/* Suíte de regressão do motor — roda as regras sem navegador.

   Existe porque a v15 chegou com nove bugs que um humano só encontra jogando, e
   quase todos vinham de causa única. Cada teste aqui nasceu de um relatório de
   playtest: o nome do teste é o sintoma que o jogador descreveu, e o corpo é a
   menor cena que reproduz aquilo.

   Regra da casa: bug relatado vira teste ANTES de virar correção. Se o teste não
   falha antes do conserto, ele não está testando o bug.

     node sim/testes.js            → roda tudo
     node sim/testes.js torre      → só os testes cujo nome casa com "torre"

   O harness é o mesmo do sim/bateria.js (sim/motor.js): DOM falso, os três
   scripts avaliados na ordem do index.html, interface trocada por no-op.  */

const { carrega } = require("./motor.js");

/* ---------- mini framework ---------- */
const filtro = process.argv[2] || "";
let passou = 0, falhou = 0;
const falhas = [];

function teste(nome, corpo) {
  if (filtro && !nome.toLowerCase().includes(filtro.toLowerCase())) return;
  try {
    corpo();
    passou++;
    console.log(`  \x1b[32m✓\x1b[0m ${nome}`);
  } catch (e) {
    falhou++;
    falhas.push([nome, e]);
    console.log(`  \x1b[31m✗\x1b[0m ${nome}\n      ${e.message}`);
  }
}
function ok(cond, msg) { if (!cond) throw new Error(msg); }
function eq(a, b, msg) {
  if (a !== b) throw new Error(`${msg} — esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`);
}

/* ---------- cenário ----------
   Uma partida nova, com os dados sob controle: sem isso metade dos testes
   depende de rolagem e passa ou falha por sorte. `dados()` reescreve a mão de
   ação; `mov()` reescreve o Dado Mestre.  */
function cena(opcoes = {}) {
  const g = carrega();
  g.simMode = true;                      // pula a tela de escolha do Caçador
  if (opcoes.times) g.TIMES = opcoes.times;
  g.novo();
  const api = {
    g,
    get J() { return g.J; },
    herois: t => g.J.times[t].herois,
    heroi(t, papel) {
      const h = g.J.times[t].herois.find(x => g.CATALOGO[x.id].pos === papel);
      ok(h, `time ${t} não tem herói de ${papel}`);
      return h;
    },
    dados(...valores) { g.J.dados = valores.map(v => ({ v, usado: 0 })); return api; },
    mov(n) { g.J.mov = { v: n, rest: n }; return api; },
    vez(t) { g.J.vez = t; return api; },
    /* usa a habilidade `i` de `h` — o mesmo caminho que o toque na tela segue */
    usa(h, i, alvo) {
      g.selHeroi = h; g.limpaModo(); g.selHeroi = h;
      g.iniciaHab(i);
      const hb = h.habs[i];
      if (hb.alvo === "eu") { if (g.habAtual === null) g.habAtual = i; g.confirmaHab(h); }
      else g.confirmaHab(alvo);
      return api;
    },
    /* mira e bate na estrutura — atacaTorre/atacaNexus/atacaEpico pedem modo "mirar" */
    mira(h, i) { g.selHeroi = h; g.limpaModo(); g.selHeroi = h; g.iniciaHab(i); return api; },
    poe(h, pos) { h.pos = [...pos]; return api; }
  };
  return api;
}

/* posição de uma torre no tabuleiro */
const posTorre = (g, tr) => g.ROTAS[tr.rota][tr.i];

/* uma torre inimiga que o herói `h` consegue alcançar, com h colado nela */
function encostaNaTorre(c, h, t = 1) {
  const g = c.g;
  const tr = g.J.torres.find(x => x.t === t && x.vida > 0 && g.torreExposta(x.rota, t) === x);
  ok(tr, "não achei torre exposta");
  const p = posTorre(g, tr);
  const livre = g.vizinhos(...p).find(v => g.noTab(...v) && !g.em(...v));
  c.poe(h, livre);
  return tr;
}

console.log("\n  JAGERLARAMAIS · regressão do motor\n");

/* ═══════════════ BUG 1 — torre trava o segundo golpe da rodada ═══════════════ */

teste("torre aceita dois golpes de heróis diferentes na mesma rodada", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const a = c.heroi(0, "topo"), b = c.heroi(0, "meio");
  const tr = encostaNaTorre(c, a);
  const p = posTorre(c.g, tr);
  c.poe(b, c.g.vizinhos(...p).find(v => c.g.noTab(...v) && !c.g.em(...v)));
  const vida0 = tr.vida;

  c.mira(a, 0); c.g.atacaTorre(tr);
  eq(tr.vida, vida0 - 1, "primeiro golpe");
  c.mira(b, 0); c.g.atacaTorre(tr);
  eq(tr.vida, vida0 - 2, "segundo golpe, outro herói, mesma rodada");
});

teste("torre aceita segundo golpe do mesmo herói reativado pelo Suporte", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const a = c.heroi(0, "topo");
  const tr = encostaNaTorre(c, a);
  const vida0 = tr.vida;

  c.mira(a, 0); c.g.atacaTorre(tr);
  eq(tr.vida, vida0 - 1, "primeiro golpe");

  /* é o que a carta Dobradinha e o dado doado pelo Suporte fazem: devolvem a ação */
  a.agiu = 0;
  c.mira(a, 0); c.g.atacaTorre(tr);
  eq(tr.vida, vida0 - 2, "segundo golpe do mesmo herói na mesma rodada");
});

teste("torre aceita golpe de longe repetido", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const arq = c.heroi(0, "adc"), mid = c.heroi(0, "meio");
  const tr = c.g.J.torres.find(x => x.t === 1 && x.vida > 0 && c.g.torreExposta(x.rota, 1) === x);
  const p = posTorre(c.g, tr);
  /* os dois a 2 de distância: alcance de atirador, sem encostar */
  const anel = [];
  for (let r = 0; r < c.g.LINS; r++) for (let col = 0; col < c.g.COLS; col++)
    if (c.g.noTab(col, r) && c.g.dist(col, r, ...p) === 2 && !c.g.em(col, r)) anel.push([col, r]);
  ok(anel.length >= 2, "sem casas a 2 de distância da torre");
  c.poe(arq, anel[0]); c.poe(mid, anel[1]);
  arq.alc = 3; mid.alc = 3;
  const vida0 = tr.vida;

  c.mira(arq, 0); c.g.atacaTorre(tr);
  c.mira(mid, 0); c.g.atacaTorre(tr);
  eq(tr.vida, vida0 - 2, "dois golpes à distância na mesma rodada");
});

/* ═══════════════ BUG 2 — escudo vira invulnerabilidade ═══════════════ */

teste("escudo não sobrevive à própria rodada", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const vharn = c.heroi(0, "topo");
  vharn.esc = 0;
  c.usa(vharn, 2);                                  // Muralha: escudo 6 + Força
  ok(vharn.esc > 0, "Muralha não deu escudo");
  c.g.fimDaRodada();
  eq(vharn.esc, 0, "escudo ainda de pé depois do fim da rodada");
});

teste("escudo não acumula entre rodadas até virar invulnerabilidade", () => {
  const c = cena().mov(0).vez(0);
  const vharn = c.heroi(0, "topo");
  let pico = 0;
  for (let r = 0; r < 4; r++) {
    c.dados(6, 6, 6); vharn.agiu = 0;
    c.usa(vharn, 2);
    pico = Math.max(pico, vharn.esc);
    c.g.fimDaRodada();
  }
  ok(pico <= 12, `escudo empilhou até ${pico} — Muralha repetida vira invulnerabilidade`);
});

/* ═══════════════ BUG 3 — habilidade em área ignora o Dragão ═══════════════ */

teste("Cerco do Torvald atinge o Dragão no hexágono vizinho", () => {
  const c = cena({ times: [["vharn", "nyx", "solenne", "vesper", "torvald"],
                          ["kaross", "grumo", "zhet", "cael", "gorm"]] })
              .dados(5, 5, 5).mov(0).vez(0);
  const torvald = c.heroi(0, "sup");
  const g = c.g;
  g.J.poco.vida = g.J.poco.vidaMax = 8;             // abre o poço
  const viz = g.vizinhos(...g.POCO).find(v => g.noTab(...v) && !g.em(...v));
  c.poe(torvald, viz);
  const vida0 = g.J.poco.vida;
  c.usa(torvald, 2);                                // Cerco — danoVizinhos
  ok(g.J.poco.vida < vida0, "o Dragão colado no Torvald não levou dano do Cerco");
});

teste("habilidade de respingo em área atinge o Dragão", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  g.J.poco.vida = g.J.poco.vidaMax = 8;
  /* um herói inimigo colado no poço, e um herói meu ao alcance dos dois */
  const alvo = c.heroi(1, "topo"), meu = c.heroi(0, "topo");
  const vizPoco = g.vizinhos(...g.POCO).filter(v => g.noTab(...v));
  c.poe(alvo, vizPoco[0]);
  const perto = g.vizinhos(...vizPoco[0]).find(v => g.noTab(...v) && !g.em(...v));
  c.poe(meu, perto);
  meu.habs[0] = { n: "teste", f: 1, alvo: "in", ef: { dano: 1, area: 1 } };
  const vida0 = g.J.poco.vida;
  c.usa(meu, 0, alvo);
  ok(g.J.poco.vida < vida0, "o respingo em área passou por cima do Dragão");
});

/* ═══════════════ BUG 4 — herói em cima da torre não é alvo ═══════════════ */

teste("herói inimigo parado no hexágono da torre continua alvejável", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  const tr = g.J.torres.find(x => x.t === 1 && x.vida > 0);
  const p = posTorre(g, tr);
  const inimigo = c.heroi(1, "topo"), meu = c.heroi(0, "topo");
  c.poe(inimigo, p);
  c.poe(meu, g.vizinhos(...p).find(v => g.noTab(...v) && !g.em(...v)));

  g.selHeroi = meu; g.limpaModo(); g.selHeroi = meu; g.iniciaHab(0);
  ok(g.alvos.includes(inimigo), "herói sobre a torre sumiu da lista de alvos");
});

/* ═══════════════ BUG 6/7 — Nexus a zero não encerra a partida ═══════════════ */

teste("Nexus a zero encerra a partida — vitória do AZUL (time 0)", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  g.J.torres.filter(x => x.t === 1).forEach(x => x.vida = 0);   // abre uma rota
  g.J.nexus[1] = 1;
  const meu = c.heroi(0, "topo");
  c.poe(meu, g.BASE[1][0]);
  c.mira(meu, 0);
  ok(g.alvoNexus === 1, "Nexus inimigo não entrou como alvo");
  g.atacaNexus(1);
  eq(g.J.nexus[1], 0, "Nexus deveria estar a zero");
  eq(g.J.fim, 0, "J.fim deveria marcar o time 0 como vencedor");
  /* o teste que pega o bug: encerraTurno usa `if(J.fim)` e 0 é falso */
  g.encerraTurno();
  eq(g.J.fim, 0, "a partida continuou depois do Nexus cair");
  eq(g.J.fase, "fim", "a fase deveria travar em 'fim' — ações precisam congelar");
});

teste("Nexus a zero encerra a partida — vitória do CARMIM (time 1)", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(1);
  const g = c.g;
  g.J.torres.filter(x => x.t === 0).forEach(x => x.vida = 0);
  g.J.nexus[0] = 1;
  const meu = c.heroi(1, "topo");
  c.poe(meu, g.BASE[0][0]);
  c.mira(meu, 0);
  g.atacaNexus(0);
  eq(g.J.fim, 1, "J.fim deveria marcar o time 1 como vencedor");
  eq(g.J.fase, "fim", "a fase deveria travar em 'fim'");
});

teste("golpe final no Nexus fica registrado para a tela de vitória", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  g.J.torres.filter(x => x.t === 1).forEach(x => x.vida = 0);
  g.J.nexus[1] = 1;
  const meu = c.heroi(0, "topo");
  c.poe(meu, g.BASE[1][0]);
  c.mira(meu, 0);
  g.atacaNexus(1);
  ok(g.J.golpeFinal, "ninguém registrou quem deu o golpe final");
  eq(g.J.golpeFinal.id, meu.id, "o golpe final foi creditado ao herói errado");
});

/* ═══════════════ BUG 5 — Recuo ═══════════════ */

teste("Recuo move um herói meu 1 casa, e não dá movimento ao adversário", () => {
  const c = cena().dados(6, 6, 6).mov(3).vez(0);
  const g = c.g;
  const meu = c.heroi(0, "topo");
  const antes = [...meu.pos], movAntes = g.J.mov.rest;
  g.maos[0] = ["recuo"];
  g.selHeroi = meu;
  ok(g.podeJogar("recuo"), "Recuo não está jogável com um herói selecionado");
  g.jogaCarta("recuo");
  eq(g.J.mov.rest, movAntes, "Recuo mexeu no Dado Mestre do turno em vez de mover o herói");
  ok(g.modo === "recuo", "Recuo deveria abrir a escolha da casa");
  ok(g.mover.length > 0, "Recuo não destacou nenhuma casa válida");
  ok(g.mover.every(p => g.dist(...antes, ...p) === 1), "Recuo destacou casa que não é vizinha");
  g.recuaAte(...g.mover[0]);
  eq(g.dist(...meu.pos, ...antes), 1, "o herói não andou exatamente 1 casa");
  eq(g.J.mov.rest, movAntes, "Recuo consumiu movimento do turno");
});

/* ═══════════════ BUG 8 — quarto dado ═══════════════ */

teste("dado que nenhum herói pode gastar ainda vira movimento", () => {
  const c = cena().dados(6, 6, 6, 6).mov(0).vez(0);
  const g = c.g;
  g.J.times[0].herois.forEach(h => h.agiu = 1);     // todo mundo já agiu
  g.dadoSel = 3;
  const movAntes = g.J.mov.rest;
  g.converteDado();
  ok(g.J.mov.rest > movAntes, "o quarto dado não pôde virar movimento");
  ok(g.J.dados[3].usado, "o dado convertido continua na mesa");
});

teste("Retomada entrega dados a mais e todos são gastáveis", () => {
  const c = cena().mov(0).vez(0);
  const g = c.g;
  g.J.torres.filter(x => x.t === 0).forEach(x => x.vida = 0);   // time 0 bem atrás
  g.J.vez = 0; g.iniciaTurno();
  ok(g.J.dados.length > 3, `Retomada não somou dado (${g.J.dados.length})`);
  const heroisLivres = g.J.times[0].herois.filter(h => !h.morto && !h.agiu).length;
  ok(heroisLivres >= g.J.dados.length,
     `${g.J.dados.length} dados para ${heroisLivres} heróis livres — sobra dado sem dono possível`);
});

/* ═══════════════ BUG 10 — quarto slot de item ═══════════════ */

teste("Relicário libera a compra do quarto item na loja", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  const meu = c.heroi(0, "topo");
  meu.pos = [...g.BASE[0][0]];
  meu.ouro = 99;
  meu.itens = ["eclipse", "basalto", "egide"];
  g.maos[0] = ["relicario"];
  g.selHeroi = meu;
  g.jogaCarta("relicario");
  eq(meu.slots, 4, "Relicário não deu o quarto slot");
  eq(g.capacidade(meu), 4, "a loja não enxerga o quarto slot");
  ok(meu.itens.length < g.capacidade(meu), "a loja ainda considera o inventário cheio");
});

/* ═══════════════ BUG 11 — Forja de Campo ═══════════════ */

teste("Forja de Campo oferece 3 itens e equipa o escolhido", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  const meu = c.heroi(0, "topo");
  meu.itens = [];
  g.maos[0] = ["forja"];
  g.selHeroi = meu;
  g.jogaCarta("forja");
  ok(g.escolhaItem, "Forja não abriu escolha nenhuma");
  eq(g.escolhaItem.opcoes.length, 3, "Forja deveria oferecer 3 itens");
  const escolhido = g.escolhaItem.opcoes[1];
  g.confirmaEscolhaItem(escolhido);
  ok(meu.itens.includes(escolhido), "o item escolhido não foi equipado");
  eq(meu.itens.length, 1, "a Forja equipou mais de um item");
  ok(!g.escolhaItem, "a escolha ficou aberta depois de confirmada");
});

/* ═══════════════ PARTE 2 — alternância de turnos ═══════════════ */

teste("os turnos alternam Azul → Carmim → Azul → Carmim", () => {
  const c = cena().vez(0);
  const g = c.g;
  const ordem = [];
  for (let i = 0; i < 8; i++) { ordem.push(g.J.vez); g.encerraTurno(); }
  const esperado = [0, 1, 0, 1, 0, 1, 0, 1];
  eq(ordem.join(""), esperado.join(""),
     "a iniciativa alternada dá dois turnos seguidos ao mesmo jogador na virada da rodada");
});

teste("uma rodada é um turno de cada, e agiu reseta a cada turno", () => {
  const c = cena().vez(0);
  const g = c.g;
  const r0 = g.J.rodada;
  g.encerraTurno();                        // fim do turno azul
  eq(g.J.rodada, r0, "a rodada virou no meio dela");
  g.encerraTurno();                        // fim do turno carmim → fim da rodada
  eq(g.J.rodada, r0 + 1, "a rodada não virou depois dos dois turnos");
});

/* ═══════════════ PARTE 11 — duração de escudo por turno ═══════════════ */

teste("escudo do segundo jogador sobrevive até o próximo turno dele", () => {
  /* Vharn (Muralha) escalado no time 1 de propósito: o segundo a jogar é quem o
     bug punia — com "até o fim da rodada", o escudo dele nascia e morria dentro
     do próprio turno, sem exposição nenhuma ao adversário. */
  const c = cena({ times: [["kaross", "nyx", "solenne", "vesper", "mirrha"],
                           ["vharn", "grumo", "zhet", "cael", "torvald"]] })
              .dados(6, 6, 6).mov(0).vez(1);
  const g = c.g;
  const alvo = g.J.times[1].herois.find(h => h.habs.some(hb => hb.ef.escudo));
  ok(alvo, "nenhum herói do time 1 tem escudo neste draft");
  const i = alvo.habs.findIndex(hb => hb.ef.escudo);
  alvo.esc = 0;
  c.usa(alvo, i);
  const esc = alvo.esc;
  ok(esc > 0, "a habilidade de escudo não deu escudo");

  g.encerraTurno();                        // turno do adversário: a janela de interação
  eq(alvo.esc, esc, "o escudo evaporou antes de o adversário ter chance de bater nele");
  eq(g.J.vez, 0, "a vez não passou para o adversário");

  g.encerraTurno();                        // volta a vez do dono → agora sim expira
  eq(g.J.vez, 1, "a vez não voltou");
  eq(alvo.esc, 0, "o escudo sobreviveu ao próprio turno seguinte do dono");
});

/* ═══════════════ IA ═══════════════ */

teste("a IA compra item quando tem ouro e está na base", () => {
  const c = cena().vez(1);
  const g = c.g;
  const h = c.heroi(1, "topo");
  h.pos = [...g.BASE[1][0]]; h.ouro = 20; h.itens = [];
  g.iaCompra(1);
  ok(h.itens.length > 0, "a IA não comprou nada com 20 de ouro na base");
});

teste("a IA converte ação em movimento para alcançar e atacar", () => {
  const c = cena().vez(1);
  const g = c.g;
  const atacante = c.heroi(1, "topo"), vitima = c.heroi(0, "topo");
  /* vítima a 3 de distância: fora do alcance 1, alcançável se converter dado em movimento */
  const perto = [];
  for (let r = 0; r < g.LINS; r++) for (let col = 0; col < g.COLS; col++)
    if (g.noTab(col, r) && g.dist(col, r, ...vitima.pos) === 3 && !g.em(col, r)) perto.push([col, r]);
  atacante.pos = [...perto[0]];
  g.J.mov = { v: 0, rest: 0 };
  g.J.dados = [{ v: 6, usado: 0 }, { v: 6, usado: 0 }];
  const vida0 = vitima.vida;
  g.iaPlanejaAlcance(1);
  ok(g.J.mov.rest > 0 || vitima.vida < vida0,
     "a IA ficou parada com dois dados e um inimigo a 3 casas");
});

teste("a IA joga carta quando tem carta jogável", () => {
  const c = cena().dados(6, 6, 6).mov(3).vez(1);
  const g = c.g;
  g.maos[1] = ["furia"];
  g.selHeroi = c.heroi(1, "topo");
  g.iaJogaCartas(1);
  ok(!g.maos[1].includes("furia"), "a IA segurou uma carta de buff jogável");
});

teste("a IA persegue o épico quando ele está aberto e perto", () => {
  const c = cena().vez(1);
  const g = c.g;
  g.J.poco.vida = g.J.poco.vidaMax = 8;
  const h = c.heroi(1, "selva");
  const viz = g.vizinhos(...g.POCO).find(v => g.noTab(...v) && !g.em(...v));
  h.pos = [...viz];
  g.J.dados = [{ v: 6, usado: 0 }];
  const vida0 = g.J.poco.vida;
  g.iaObjetivos(1);
  ok(g.J.poco.vida < vida0, "a IA estava colada no épico aberto e não bateu");
});

/* ═══════════════ PARTE 10 — acampamento neutro ═══════════════ */

teste("o acampamento neutro fica à mesma distância dos dois lados", () => {
  const c = cena();
  const g = c.g;
  const neutro = g.J.camps.find(x => g.CAMP_NEUTRO ? x.id === "neutro" : x.t === -1);
  ok(neutro, "não achei o acampamento neutro");
  const daBase = t => Math.min(...g.BASE[t].map(([col, r]) => g.dist(col, r, ...neutro.pos)));
  const d0 = daBase(0), d1 = daBase(1);
  eq(d0, d1, `acampamento neutro a ${d0} do Azul e ${d1} do Carmim`);
});


/* ═══════════════ v17 — IA que avalia em vez de pegar a primeira ═══════════════ */

teste("a IA prefere MATAR a bater mais forte em quem não morre", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(1);
  const g = c.g;
  const atacante = c.heroi(1, "topo");
  const quaseMorto = c.heroi(0, "adc"), cheio = c.heroi(0, "topo");
  quaseMorto.vida = 1; quaseMorto.arm = 0; quaseMorto.esc = 0;
  cheio.vida = cheio.vidaMax;
  /* os dois colados no atacante: a versão gulosa pegava o primeiro da lista */
  const viz = g.vizinhos(...atacante.pos).filter(v => g.noTab(...v) && !g.em(...v));
  c.poe(cheio, viz[0]); c.poe(quaseMorto, viz[1]);

  const lista = g.iaJogadas(1);
  const topo = lista[0];
  ok(topo, "a IA não achou jogada nenhuma");
  eq(topo.tipo, "heroi", "a melhor jogada deveria ser num herói");
  eq(topo.v.id, quaseMorto.id, "a IA escolheu o alvo cheio de vida em vez do abatível");
});

teste("a IA não queima a Ultimate num alvo que ela não mata", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(1);
  const g = c.g;
  const h = c.heroi(1, "topo"), alvo = c.heroi(0, "topo");
  alvo.vida = alvo.vidaMax = 40;                 // ninguém mata isso num golpe
  c.poe(alvo, g.vizinhos(...h.pos).find(v => g.noTab(...v) && !g.em(...v)));
  const lista = g.iaJogadas(1).filter(j => j.h.id === h.id && j.tipo === "heroi");
  ok(lista.length >= 2, "esperava mais de uma habilidade disponível");
  const ult = lista.find(j => j.i === 2), basica = lista.find(j => j.i === 0);
  if (ult && basica) ok(basica.nota >= ult.nota,
    `a Ultimate (${ult.nota.toFixed(1)}) ficou acima da básica (${basica.nota.toFixed(1)}) sem matar`);
});

teste("a IA não arranha o épico quando o revide a mataria", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(1);
  const g = c.g;
  g.J.poco.vida = g.J.poco.vidaMax = 14; g.J.poco.id = "barao";
  const h = c.heroi(1, "selva");
  h.vida = 1;                                    // o revide do Barão é 2
  c.poe(h, g.vizinhos(...g.POCO).find(v => g.noTab(...v) && !g.em(...v)));
  const j = g.iaJogadas(1).filter(x => x.tipo === "epico" && x.h.id === h.id)[0];
  if (j) ok(j.nota <= 10, `nota ${j.nota} alta demais para um golpe que mata o próprio herói`);
});

teste("a IA não gasta movimento sem ter para onde ir", () => {
  const c = cena().mov(6).vez(1);
  const g = c.g;
  /* tudo resolvido: sem poço, sem acampamento, inimigos mortos, torres de pé */
  g.J.poco.vida = 0;
  g.J.camps.forEach(cp => { cp.ativo = 0; cp.respawn = 9; });
  g.J.times[0].herois.forEach(h => { h.morto = 2; });
  const h = c.heroi(1, "topo");
  const d = g.iaDestino(h, 1);
  /* sem inimigo vivo e sem objetivo, resta a pressão de torre — mas nunca "nada" */
  if (d) ok(d.motivo === "pressiona" || d.motivo === "recua",
    `destino sem propósito claro: ${d.motivo}`);
});

teste("a IA manda qualquer herói ao acampamento perto, não só o caçador", () => {
  const c = cena().vez(1);
  const g = c.g;
  g.J.poco.vida = 0;
  const camp = g.J.camps.find(cp => cp.t === 1 && cp.ativo);
  ok(camp, "sem acampamento do time 1");
  const h = c.heroi(1, "topo");                  // o TOPO, não o caçador
  const perto = g.vizinhos(...camp.pos).find(v => g.noTab(...v) && !g.em(...v));
  c.poe(h, perto);
  const d = g.iaDestino(h, 1);
  ok(d && d.motivo === "farma", `o topo colado no acampamento foi para "${d && d.motivo}"`);
});

/* ═══════════════ v17 — acampamento neutro alterna de lado ═══════════════ */

teste("o acampamento neutro tem dois lados possíveis, os dois justos", () => {
  const c = cena();
  const g = c.g;
  const lados = g.CAMP_NEUTRO_LADOS;
  eq(lados.length, 2, "deveria haver duas posições possíveis");
  const daBase = (p, t) => Math.min(...g.BASE[t].map(([col, r]) => g.dist(col, r, ...p)));
  lados.forEach(p => eq(daBase(p, 0), daBase(p, 1),
    `posição ${JSON.stringify(p)} não é equidistante`));
  ok(g.dist(...lados[0], ...lados[1]) >= 4,
     "as duas posições estão no mesmo canto — não é alternar lado");
});

teste("partidas diferentes sorteiam lados diferentes do acampamento neutro", () => {
  const c = cena();
  const vistos = new Set();
  for (let i = 0; i < 60; i++) { c.g.novo(); vistos.add(JSON.stringify(c.g.J.camps.find(x => x.t === -1).pos)); }
  ok(vistos.size === 2, `em 60 partidas só apareceram ${vistos.size} posição(ões)`);
});

/* ═══════════════ v17 — gasto de ouro tardio ═══════════════ */

teste("Reforço dá Poder permanente e encarece a cada compra", () => {
  const c = cena().vez(0);
  const g = c.g;
  const h = c.heroi(0, "topo");
  h.pos = [...g.BASE[0][0]]; h.ouro = 40; h.itens = ["eclipse", "basalto", "egide"];
  const poder0 = g.poderTotal(h);
  const reforco = g.GASTOS.find(x => x.id === "reforco");
  ok(reforco, "não existe o gasto Reforço");

  const p1 = g.precoGasto(reforco, h);
  ok(g.usaGasto("reforco", h, 0), "primeira compra falhou");
  eq(g.poderTotal(h), poder0 + 1, "Reforço não deu Poder");
  const p2 = g.precoGasto(reforco, h);
  ok(p2 > p1, `o preço não subiu (${p1} → ${p2})`);
  ok(g.usaGasto("reforco", h, 0), "segunda compra falhou");
  eq(g.poderTotal(h), poder0 + 2, "a segunda compra não somou");
  ok(g.precoGasto(reforco, h) > p2, "o preço parou de subir");
});

teste("Requisição troca ouro por carta", () => {
  const c = cena().vez(0);
  const g = c.g;
  const h = c.heroi(0, "topo");
  h.pos = [...g.BASE[0][0]]; h.ouro = 20;
  g.maos[0] = [];
  /* `novo()` não monta o baralho — quem monta é `partida()`. Sem carta no
     baralho a Requisição fica indisponível de propósito, então o teste precisa
     encher a mesa antes de cobrar o comportamento. */
  g.baralho.push("furia", "talha", "pilhagem");
  ok(g.usaGasto("requisicao", h, 0), "Requisição falhou");
  eq(g.maos[0].length, 1, "não entrou carta na mão");
  ok(h.ouro < 20, "não cobrou ouro");
});

teste("gasto tardio só existe na base, e a mão cheia bloqueia a Requisição", () => {
  const c = cena().vez(0);
  const g = c.g;
  const h = c.heroi(0, "topo");
  h.ouro = 40;
  /* longe da base: nada disponível */
  const longe = g.BASE[1][0];
  c.poe(h, longe);
  eq(g.gastosDisponiveis(h).length, 0, "gasto disponível fora da base");
  /* na base com a mão cheia: Reforço sim, Requisição não */
  h.pos = [...g.BASE[0][0]];
  g.baralho.push("furia", "talha");
  g.maos[0] = ["furia", "muralha", "talha"];
  const ids = g.gastosDisponiveis(h).map(x => x.id);
  ok(ids.includes("reforco"), "Reforço deveria estar disponível na base");
  ok(!ids.includes("requisicao"), "Requisição disponível com a mão cheia");
});

teste("a IA gasta o ouro que sobra depois de fechar os itens", () => {
  const c = cena().vez(1);
  const g = c.g;
  const h = c.heroi(1, "topo");
  h.pos = [...g.BASE[1][0]];
  h.itens = ["eclipse", "basalto", "egide"];
  h.ouro = 30;
  g.iaCompra(1);
  ok(h.ouro < 30, "a IA ficou sentada em 30 de ouro com o inventário cheio");
});


/* ═══════════════ v19 — névoa no mato (as 5 fichas saíram) ═══════════════ */

/* acha uma casa de selva da região pedida, livre */
function casaDeSelva(g, reg, ocupadas = []) {
  for (let r = 0; r < g.LINS; r++) for (let c = 0; c < g.COLS; c++) {
    if (!g.noTab(c, r) || g.regiaoDe(c, r) !== reg) continue;
    if (g.em(c, r) || ocupadas.some(p => p[0] === c && p[1] === r)) continue;
    return [c, r];
  }
  return null;
}

teste("o mapa tem duas regiões de mato, cima e baixo", () => {
  const c = cena();
  const g = c.g;
  const cont = { cima: 0, baixo: 0, aberto: 0 };
  for (let r = 0; r < g.LINS; r++) for (let col = 0; col < g.COLS; col++) {
    if (!g.noTab(col, r)) continue;
    const reg = g.regiaoDe(col, r);
    cont[reg || "aberto"]++;
  }
  ok(cont.cima > 4, `mato de cima pequeno demais: ${cont.cima}`);
  ok(cont.baixo > 4, `mato de baixo pequeno demais: ${cont.baixo}`);
  /* as duas regiões têm que ser parecidas em tamanho, senão um lado esconde mais */
  ok(Math.abs(cont.cima - cont.baixo) <= 2,
     `matos desiguais: cima ${cont.cima}, baixo ${cont.baixo}`);
});

teste("rota, base e rio são sempre visíveis", () => {
  const c = cena();
  const g = c.g;
  const h = c.heroi(1, "topo");
  /* tira todo mundo do time 0 do mato para garantir que não há olhos lá */
  g.J.times[0].herois.forEach(x => c.poe(x, g.BASE[0][0]));
  c.poe(h, g.ROTAS.topo[3]);
  eq(g.regiaoDe(...h.pos), null, "casa de rota classificada como mato");
  ok(g.visivelPara(h, 0), "herói na rota ficou invisível");
});

teste("herói no mato some para quem não tem ninguém no mato", () => {
  const c = cena();
  const g = c.g;
  const cac = c.heroi(1, "selva");
  const p = casaDeSelva(g, "cima");
  ok(p, "não achei casa de mato de cima");
  c.poe(cac, p);
  /* time 0 inteiro fora do mato */
  g.J.times[0].herois.forEach(x => c.poe(x, g.ROTAS.meio[1]));
  g.desempilha();
  g.J.times[0].ward = 0;
  ok(!g.visivelPara(cac, 0), "o Caçador no mato continuou visível sem olhos lá");
  ok(g.escondido(cac), "escondido() não reconheceu a situação");
  ok(g.visivelPara(cac, 1), "o dono deixou de ver o próprio herói");
});

teste("basta um herói na mesma região para enxergar o mato", () => {
  const c = cena();
  const g = c.g;
  const cac = c.heroi(1, "selva"), olheiro = c.heroi(0, "topo");
  const p = casaDeSelva(g, "cima");
  c.poe(cac, p);
  g.J.times[0].herois.forEach(x => c.poe(x, g.ROTAS.meio[1]));
  g.desempilha();
  ok(!g.visivelPara(cac, 0), "deveria estar escondido antes do olheiro entrar");

  const q = casaDeSelva(g, "cima", [p]);
  c.poe(olheiro, q);
  ok(g.visivelPara(cac, 0), "com um herói no mesmo mato, ainda não enxerga");
});

teste("olho no mato de cima não revela o mato de baixo", () => {
  const c = cena();
  const g = c.g;
  const cac = c.heroi(1, "selva"), olheiro = c.heroi(0, "topo");
  const baixo = casaDeSelva(g, "baixo");
  const cima = casaDeSelva(g, "cima");
  ok(baixo && cima, "não achei as duas regiões");
  g.J.times[0].herois.forEach(x => c.poe(x, g.ROTAS.meio[1]));
  g.desempilha();
  c.poe(cac, baixo); c.poe(olheiro, cima);
  g.J.times[0].ward = 0;
  ok(!g.visivelPara(cac, 0), "o olheiro no mato de cima revelou o mato de baixo");
});

teste("quem está escondido não pode ser alvo", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  const cac = c.heroi(1, "selva"), atacante = c.heroi(0, "topo");
  const p = casaDeSelva(g, "cima");
  c.poe(cac, p);
  /* atacante colado nele, mas sem estar no mato: perto e cego */
  const viz = g.vizinhos(...p).find(v => g.noTab(...v) && !g.em(...v) && !g.regiaoDe(...v));
  ok(viz, "não achei casa aberta colada no mato");
  g.J.times[0].herois.forEach(x => c.poe(x, g.ROTAS.meio[1]));
  g.desempilha();
  c.poe(atacante, viz);
  g.J.times[0].ward = 0;

  g.limpaModo(); g.selHeroi = atacante; g.iniciaHab(0);
  ok(!g.alvos.includes(cac), "dá para atacar quem você não enxerga");
});

teste("Ward acende o mato inteiro", () => {
  const c = cena();
  const g = c.g;
  const cac = c.heroi(1, "selva");
  c.poe(cac, casaDeSelva(g, "baixo"));
  g.J.times[0].herois.forEach(x => c.poe(x, g.ROTAS.meio[1]));
  g.desempilha();
  g.J.times[0].ward = 0;
  ok(!g.visivelPara(cac, 0), "deveria estar escondido sem ward");
  g.J.times[0].ward = 1;
  ok(g.visivelPara(cac, 0), "com ward posta o mato continuou escuro");
});

teste("atacar vindo do mato sem ser visto vale +2 de Força", () => {
  const c = cena().dados(4, 4, 4).mov(0).vez(1);
  const g = c.g;
  const cac = c.heroi(1, "selva"), alvo = c.heroi(0, "topo");
  alvo.vida = alvo.vidaMax = 80; alvo.arm = 0; alvo.esc = 0;

  /* cena 1: o atacante está na ROTA, à vista — sem bônus */
  g.J.times[0].herois.forEach(x => c.poe(x, g.ROTAS.meio[1]));
  g.desempilha();
  c.poe(cac, g.ROTAS.topo[4]);
  c.poe(alvo, g.vizinhos(...cac.pos).find(v => g.noTab(...v) && !g.em(...v)));
  const v0 = alvo.vida;
  c.usa(cac, 0, alvo);
  const aberto = v0 - alvo.vida;

  /* cena 2: o mesmo golpe, agora saindo do mato sem olhos inimigos */
  const p = casaDeSelva(g, "cima");
  c.poe(cac, p);
  const viz = g.vizinhos(...p).find(v => g.noTab(...v) && !g.em(...v));
  c.poe(alvo, viz);
  g.J.times[0].herois.filter(x => x !== alvo).forEach(x => c.poe(x, g.BASE[0][0]));
  g.J.times[0].ward = 0;
  ok(g.escondido(cac), "o cenário 2 não deixou o atacante escondido");
  cac.agiu = 0;
  const v1 = alvo.vida;
  c.usa(cac, 0, alvo);
  const emboscada = v1 - alvo.vida;

  eq(emboscada - aberto, 2, "a emboscada não valeu +2 de Força");
});

teste("o bônus de emboscada não repete no golpe seguinte à vista", () => {
  const c = cena().dados(4, 4, 4).mov(0).vez(1);
  const g = c.g;
  const cac = c.heroi(1, "selva"), alvo = c.heroi(0, "topo");
  alvo.vida = alvo.vidaMax = 80; alvo.arm = 0; alvo.esc = 0;
  const p = casaDeSelva(g, "cima");
  c.poe(cac, p);
  c.poe(alvo, g.vizinhos(...p).find(v => g.noTab(...v) && !g.em(...v)));
  g.J.times[0].herois.filter(x => x !== alvo).forEach(x => c.poe(x, g.BASE[0][0]));
  g.J.times[0].ward = 0;

  const v0 = alvo.vida;
  c.usa(cac, 0, alvo);
  const primeiro = v0 - alvo.vida;
  eq(cac.emboscada, 0, "a marca de emboscada ficou pendurada no herói");

  /* agora o inimigo entra no mato e o vê: o mesmo golpe sai menor */
  c.poe(alvo, casaDeSelva(g, "cima", [p]));
  ok(!g.escondido(cac), "o atacante deveria estar visível agora");
  cac.agiu = 0;
  const v1 = alvo.vida;
  c.usa(cac, 0, alvo);
  eq(primeiro - (v1 - alvo.vida), 2, "o bônus não sumiu quando o atacante ficou visível");
});

/* ═══════════════ v19 — a IA obedece à mesma névoa ═══════════════ */

teste("a IA não enxerga herói escondido no mato", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(1);
  const g = c.g;
  const escondidoH = c.heroi(0, "selva");
  const p = casaDeSelva(g, "cima");
  c.poe(escondidoH, p);
  /* o time 1 inteiro fora do mato */
  g.J.times[1].herois.forEach(x => c.poe(x, g.ROTAS.meio[6]));
  g.desempilha();
  g.J.times[1].ward = 0;

  const vistos = g.iaInimigosVisiveis(1);
  ok(!vistos.includes(escondidoH), "a IA está trapaceando: enxergou quem está no mato");
  const outros = g.J.times[0].herois.filter(x => !x.morto && !g.regiaoDe(...x.pos));
  ok(vistos.length === outros.length, "a IA viu mais heróis do que a regra permite");
});

teste("a IA não mira quem ela não pode ver", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(1);
  const g = c.g;
  const presa = c.heroi(0, "selva");
  presa.vida = 1;                                   // alvo dos sonhos, se ela visse
  const p = casaDeSelva(g, "cima");
  c.poe(presa, p);
  const atacante = c.heroi(1, "topo");
  const viz = g.vizinhos(...p).find(v => g.noTab(...v) && !g.em(...v) && !g.regiaoDe(...v));
  ok(viz, "não achei casa aberta colada no mato");
  g.J.times[1].herois.forEach(x => c.poe(x, g.ROTAS.meio[6]));
  g.desempilha();
  c.poe(atacante, viz);
  g.J.times[1].ward = 0;

  const lista = g.iaJogadas(1).filter(j => j.tipo === "heroi" && j.v === presa);
  eq(lista.length, 0, "a IA montou jogada contra um herói invisível");
});


/* ═══════════════ v20 — a dádiva do Barão ═══════════════ */

teste("o Barão toma o poço na rodada dele mesmo com o Dragão vivo", () => {
  const c = cena();
  const g = c.g;
  g.J.poco.id = "dragao"; g.J.poco.vida = g.J.poco.vidaMax = 4;
  g.J.rodada = 12; g.J.vez = 1;
  g.fimDaRodada();
  eq(g.J.poco.id, "barao", "o Dragão vivo continuou segurando o poço na rodada do Barão");
  eq(g.J.poco.vida, g.EPICO.barao.vida, "o Barão desceu sem vida cheia");
});

teste("as três dádivas existem e são distintas", () => {
  const c = cena();
  const ids = c.g.DADIVAS.map(d => d.id);
  eq(ids.length, 3, "deveriam ser três dádivas");
  eq(new Set(ids).size, 3, "há dádivas repetidas");
  ["ondas", "egide", "ariete"].forEach(x =>
    ok(ids.includes(x), `falta a dádiva ${x}`));
});

teste("Ondas de Ferro empurra as rotas sem herói nelas", () => {
  const c = cena().vez(0);
  const g = c.g;
  /* ninguém em rota nenhuma: sem a dádiva, as frentes não andam */
  g.J.times.forEach(t => t.herois.forEach(h => c.poe(h, g.BASE[h.t][0])));
  g.desempilha();
  const antes = { ...g.J.frentes };
  g.fimDaRodada();
  const semDadiva = JSON.stringify(g.J.frentes) === JSON.stringify(antes);
  ok(semDadiva, "as frentes andaram sozinhas sem ninguém ter a dádiva");

  g.aplicaDadiva(0, "ondas");
  const antes2 = { ...g.J.frentes };
  g.fimDaRodada();
  ok(JSON.stringify(g.J.frentes) !== JSON.stringify(antes2),
     "Ondas de Ferro não empurrou nada");
});

teste("Égide dá escudo agora e repõe no início do próximo turno do dono", () => {
  const c = cena().vez(0);
  const g = c.g;
  const h = c.heroi(0, "topo");
  h.esc = 0;
  g.aplicaDadiva(0, "egide");
  ok(h.esc > 0, "a Égide não deu escudo na hora");
  const primeiro = h.esc;

  g.encerraTurno();                    // turno do adversário
  eq(h.esc, primeiro, "o escudo da Égide evaporou antes da vez do adversário");
  g.encerraTurno();                    // volta a vez do dono: expira e repõe
  ok(h.esc > 0, "a Égide não repôs o escudo no turno seguinte do dono");
});

teste("Aríete dobra o golpe de herói em torre, e a onda continua tirando 1", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  const a = c.heroi(0, "topo");
  const tr = encostaNaTorre(c, a);
  const vida0 = tr.vida;

  c.mira(a, 0); c.g.atacaTorre(tr);
  const semDadiva = vida0 - tr.vida;
  eq(semDadiva, 1, "o golpe base na torre deixou de ser 1");

  tr.vida = vida0; a.agiu = 0;
  g.aplicaDadiva(0, "ariete");
  c.mira(a, 0); c.g.atacaTorre(tr);
  eq(vida0 - tr.vida, 2, "o Aríete não dobrou o golpe na torre");
});

teste("a dádiva expira e some do time", () => {
  const c = cena().vez(0);
  const g = c.g;
  g.aplicaDadiva(0, "ariete");
  eq(g.J.times[0].dadiva, "ariete", "a dádiva não foi registrada");
  for (let i = 0; i < 4; i++) g.fimDaRodada();
  eq(g.J.times[0].dadiva, null, "a dádiva não expirou");
  eq(g.J.times[0].barao, 0, "o contador de rodadas não zerou");
});

teste("o Barão não dá mais Poder bruto — a recompensa virou pressão de mapa", () => {
  const c = cena().vez(0);
  const g = c.g;
  const h = c.heroi(0, "topo");
  const poder0 = g.poderTotal(h);
  ["ondas", "egide", "ariete"].forEach(id => {
    g.J.times[0].barao = 0; g.J.times[0].dadiva = null;
    g.aplicaDadiva(0, id);
    eq(g.poderTotal(h), poder0, `a dádiva ${id} mexeu no Poder do herói`);
  });
});

teste("a IA escolhe Aríete quando está atrás em torres", () => {
  const c = cena().vez(1);
  const g = c.g;
  /* time 1 perdeu duas torres, o adversário nenhuma */
  g.J.torres.filter(x => x.t === 1).slice(0, 2).forEach(x => x.vida = 0);
  eq(g.iaEscolheDadiva(1), "ariete", "atrás em torres, a IA deveria querer derrubar estrutura");
});

teste("a IA escolhe Égide quando o time está machucado", () => {
  const c = cena().vez(1);
  const g = c.g;
  g.J.times[1].herois.slice(0, 3).forEach(h => { h.vida = Math.ceil(h.vidaMax * 0.3); });
  eq(g.iaEscolheDadiva(1), "egide", "com metade do time ferida, a IA deveria querer escudo");
});

/* ---------- resumo ---------- */
console.log(`\n  ${passou} passaram · ${falhou} falharam\n`);
if (falhou) {
  console.log("  falhas:");
  falhas.forEach(([n, e]) => console.log(`    · ${n}\n      ${e.message}`));
  console.log("");
}
process.exit(falhou ? 1 : 0);
