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

teste("escudo expira no início do próximo turno do DONO, não no fim da rodada", () => {
  const c = cena().dados(6, 6, 6).mov(0);
  const g = c.g;
  g.J.vez = 0;
  const vharn = c.heroi(0, "topo");
  vharn.esc = 0;
  c.usa(vharn, 2);                                  // Muralha: escudo 6 + Força
  ok(vharn.esc > 0, "Muralha não deu escudo");

  /* a virada da rodada por si só NÃO apaga: o prazo é o turno do dono */
  g.J.vez = 0; g.iniciaTurno();
  eq(vharn.esc, 0, "o escudo sobreviveu ao próprio turno seguinte do dono");
});

teste("escudo não acumula entre rodadas até virar invulnerabilidade", () => {
  const c = cena().mov(0);
  const g = c.g;
  g.J.primeiro = 0;                    // o dono precisa ter turno dentro do laço
  const vharn = c.heroi(0, "topo");
  let pico = 0;
  for (let r = 0; r < 4; r++) {
    g.J.vez = 0; g.iniciaTurno();      // início do turno do dono: expira o anterior
    c.dados(6, 6, 6); vharn.agiu = 0;
    c.usa(vharn, 2);
    pico = Math.max(pico, vharn.esc);
  }
  /* o teto é UM uso: Força máxima (6) + o escudo da habilidade. O que não pode é
     somar entre rodadas — foi o bug 2 da v16. O número acompanha a escala de vida
     da v21, então o teste pergunta pelo comportamento, não pelo valor. */
  const umUso = 6 + vharn.habs[2].ef.escudo;
  ok(pico <= umUso, `escudo empilhou até ${pico}, teto de um uso é ${umUso}`);
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

teste("os turnos alternam sem ninguém jogar duas vezes seguidas", () => {
  const c = cena();
  const g = c.g;
  const p = g.J.primeiro;                 // sorteado desde a v21
  g.J.vez = p;
  const ordem = [];
  for (let i = 0; i < 8; i++) { ordem.push(g.J.vez); g.encerraTurno(); }
  const esperado = [p, 1 - p, p, 1 - p, p, 1 - p, p, 1 - p];
  eq(ordem.join(""), esperado.join(""),
     "alguém jogou dois turnos seguidos na virada da rodada");
});

teste("uma rodada é um turno de cada, e agiu reseta a cada turno", () => {
  const c = cena();
  const g = c.g;
  g.J.vez = g.J.primeiro;                // quem começa é sorteado desde a v21
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
              .dados(6, 6, 6).mov(0);
  const g = c.g;
  /* o time 1 tem que ser o SEGUNDO a jogar para o teste medir o que promete */
  g.J.primeiro = 0; g.J.vez = 1;
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


/* ═══════════════ v21 — visão por fontes ═══════════════ */

/* uma casa que o time `t` NÃO enxerga, longe de tudo que ele tem */
function casaCega(g, t) {
  for (let r = 0; r < g.LINS; r++) for (let c = 0; c < g.COLS; c++) {
    if (!g.noTab(c, r) || g.em(c, r)) continue;
    if (!g.enxergaCasa(t, c, r)) return [c, r];
  }
  return null;
}

teste("a visão vem das peças: existe mapa escuro no começo da partida", () => {
  const c = cena();
  const g = c.g;
  let vistas = 0, total = 0;
  for (let r = 0; r < g.LINS; r++) for (let col = 0; col < g.COLS; col++) {
    if (!g.noTab(col, r)) continue;
    total++;
    if (g.enxergaCasa(0, col, r)) vistas++;
  }
  ok(vistas > 0, "o time não enxerga nada — a visão quebrou");
  ok(vistas < total, `o time enxerga o tabuleiro inteiro (${vistas}/${total}) — não há névoa`);
});

teste("herói acende um raio ao redor de si", () => {
  const c = cena();
  const g = c.g;
  const p = casaCega(g, 0);
  ok(p, "não achei casa escura para o time 0");
  ok(!g.enxergaCasa(0, ...p), "cenário inválido");

  const h = c.heroi(0, "topo");
  c.poe(h, p);
  ok(g.enxergaCasa(0, ...p), "o herói não acendeu a própria casa");
  const viz = g.vizinhos(...p).find(v => g.noTab(...v));
  ok(g.enxergaCasa(0, ...viz), "o herói não acendeu a casa vizinha");
});

teste("torre viva dá visão, torre caída não", () => {
  const c = cena();
  const g = c.g;
  const tr = g.J.torres.find(x => x.t === 0);
  const p = g.ROTAS[tr.rota][tr.i];
  /* tira todos os heróis para longe, para isolar a torre como fonte */
  g.J.times[0].herois.forEach(h => c.poe(h, g.BASE[0][0]));
  g.desempilha();
  ok(g.enxergaCasa(0, ...p), "a torre viva não ilumina a própria casa");
  tr.vida = 0;
  ok(!g.enxergaCasa(0, ...p) || g.dist(...p, ...g.BASE[0][0]) <= 4,
     "a torre caída continuou dando visão");
});

teste("ward é uma peça no mapa, com posição e prazo", () => {
  const c = cena();
  const g = c.g;
  const p = casaCega(g, 0);
  ok(p, "não achei casa escura");
  g.poeWard(0, p);
  eq(g.J.times[0].wards.length, 1, "a ward não entrou no time");
  ok(g.enxergaCasa(0, ...p), "a ward não acendeu a própria casa");
  /* raio maior que o do herói */
  const longe = [];
  for (let r = 0; r < g.LINS; r++) for (let col = 0; col < g.COLS; col++)
    if (g.noTab(col, r) && g.dist(col, r, ...p) === 3) longe.push([col, r]);
  if (longe.length) ok(g.enxergaCasa(0, ...longe[0]), "a ward não alcança 3 de raio");

  for (let i = 0; i < 4; i++) g.expiraWards();
  eq(g.J.times[0].wards.length, 0, "a ward não expirou");
});

teste("herói fora do campo de visão inimigo não pode ser alvo", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  const presa = c.heroi(1, "selva"), atacante = c.heroi(0, "topo");
  /* leva o time 0 inteiro para a base, e a presa para uma casa escura */
  g.J.times[0].herois.forEach(h => c.poe(h, g.BASE[0][0]));
  g.desempilha();
  const p = casaCega(g, 0);
  ok(p, "não achei casa escura");
  c.poe(presa, p);
  ok(!g.visivelPara(presa, 0), "a presa deveria estar escondida");

  /* o atacante encosta nela: agora ele a enxerga e ela vira alvo */
  g.limpaModo(); g.selHeroi = atacante; g.iniciaHab(0);
  ok(!g.alvos.includes(presa), "dá para atacar quem você não enxerga");

  c.poe(atacante, g.vizinhos(...p).find(v => g.noTab(...v) && !g.em(...v)));
  g.limpaModo(); g.selHeroi = atacante; g.iniciaHab(0);
  ok(g.alvos.includes(presa), "encostado nela, ainda não a enxerga");
});

teste("atacar sem ter sido visto vale +2 de Força", () => {
  const c = cena().dados(4, 4, 4).mov(0).vez(1);
  const g = c.g;
  const cac = c.heroi(1, "selva"), alvo = c.heroi(0, "topo");
  alvo.vida = alvo.vidaMax = 90; alvo.arm = 0; alvo.esc = 0;

  /* cena 1: atacante à vista do inimigo (colado no time 0 inteiro) */
  g.J.times[0].herois.forEach(h => c.poe(h, g.ROTAS.meio[5]));
  g.desempilha();
  c.poe(cac, g.vizinhos(...alvo.pos).find(v => g.noTab(...v) && !g.em(...v)));
  ok(!g.escondido(cac), "cenário 1 deveria ter o atacante visível");
  const v0 = alvo.vida;
  c.usa(cac, 0, alvo);
  const aberto = v0 - alvo.vida;

  /* cena 2: só o alvo por perto, o resto do time 0 longe → atacante escondido */
  const p = casaCega(g, 0);
  ok(p, "não achei casa escura");
  g.J.times[0].herois.filter(x => x !== alvo).forEach(h => c.poe(h, g.BASE[0][0]));
  c.poe(cac, p);
  c.poe(alvo, g.vizinhos(...p).find(v => g.noTab(...v) && !g.em(...v)));
  g.J.times[0].wards = [];
  if (g.escondido(cac)) {
    cac.agiu = 0;
    const v1 = alvo.vida;
    c.usa(cac, 0, alvo);
    eq((v1 - alvo.vida) - aberto, 2, "a emboscada não valeu +2 de Força");
  }
});

teste("a IA não enxerga nem mira quem está fora do campo de visão dela", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(1);
  const g = c.g;
  const presa = c.heroi(0, "selva");
  presa.vida = 1;
  g.J.times[1].herois.forEach(h => c.poe(h, g.BASE[1][0]));
  g.desempilha();
  const p = casaCega(g, 1);
  ok(p, "não achei casa escura para o time 1");
  c.poe(presa, p);
  g.J.times[1].wards = [];

  ok(!g.iaInimigosVisiveis(1).includes(presa),
     "a IA está trapaceando: enxergou quem está fora da visão dela");
  const lista = g.iaJogadas(1).filter(j => j.tipo === "heroi" && j.v === presa);
  eq(lista.length, 0, "a IA montou jogada contra um herói invisível");
});

teste("na partida contra a IA a tela é sempre a do humano", () => {
  const c = cena().vez(1);
  const g = c.g;
  g.aiMode = true;
  eq(g.ladoDaTela(), 0, "no turno da IA a tela deveria continuar mostrando a visão do time 0");
  g.J.vez = 0;
  eq(g.ladoDaTela(), 0, "no turno do humano a tela também é a do time 0");
  g.aiMode = false;
  g.J.vez = 1;
  eq(g.ladoDaTela(), 1, "sem IA, a tela segue quem está na vez (passa-e-joga)");
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


/* ═══════════════ v20 — equilíbrio de ordem ═══════════════ */

teste("a presença de rota é congelada no fim do turno de cada time", () => {
  const c = cena().vez(0);
  const g = c.g;
  const h = c.heroi(0, "meio");
  /* time 0 põe alguém no meio e encerra: a presença dele fica registrada */
  c.poe(h, g.ROTAS.meio[Math.floor(g.ROTAS.meio.length / 2)]);
  const nomeRota = g.rotaDaPos(h);
  ok(nomeRota, "o herói não ficou numa rota");
  g.encerraTurno();
  eq(g.J.presenca[0][nomeRota], 1, "a presença do time 0 não foi congelada");

  /* agora o time 0 sai da rota — a contagem congelada NÃO pode mudar */
  c.poe(h, g.BASE[0][0]);
  eq(g.J.presenca[0][nomeRota], 1,
     "a presença mudou depois de congelada — o segundo jogador voltaria a ter a última palavra");
});

teste("quem começa rola +1 de movimento na rodada 1, e só nela", () => {
  const c = cena();
  const g = c.g;

  /* `primeiro` é sorteado a cada `novo()` desde a v21 — tem que ser lido DENTRO
     do laço, senão metade das iterações compara o lado errado */
  let somaPrim = 0, somaSeg = 0, n = 400;
  for (let i = 0; i < n; i++) {
    g.novo();
    const primeiro = g.J.primeiro;
    g.J.vez = primeiro; g.J.rodada = 1; g.iniciaTurno();
    somaPrim += g.J.mov.v;
    g.J.vez = 1 - primeiro; g.J.rodada = 1; g.iniciaTurno();
    somaSeg += g.J.mov.v;
  }
  const dif = (somaPrim - somaSeg) / n;
  ok(dif > 0.6 && dif < 1.4,
     `a diferença média na rodada 1 deveria ser ~1, veio ${dif.toFixed(2)}`);

  /* na rodada 2 os dois rolam igual */
  let d2Prim = 0, d2Seg = 0;
  for (let i = 0; i < n; i++) {
    g.novo();
    const primeiro = g.J.primeiro;
    g.J.rodada = 2;
    g.J.vez = primeiro; g.iniciaTurno(); d2Prim += g.J.mov.v;
    g.J.vez = 1 - primeiro; g.iniciaTurno(); d2Seg += g.J.mov.v;
  }
  const dif2 = Math.abs(d2Prim - d2Seg) / n;
  ok(dif2 < 0.35, `na rodada 2 não deveria haver bônus, diferença média ${dif2.toFixed(2)}`);
});


/* ═══════════════ v20 — gasto que encarece com o relógio ═══════════════ */

teste("Leva de Ferro fica mais cara conforme a partida anda", () => {
  const c = cena().vez(0);
  const g = c.g;
  const leva = g.GASTOS.find(x => x.id === "leva");
  ok(leva, "não existe o gasto Leva de Ferro");
  g.J.rodada = 1;  const p1 = g.precoGasto(leva, c.heroi(0, "topo"));
  g.J.rodada = 10; const p10 = g.precoGasto(leva, c.heroi(0, "topo"));
  g.J.rodada = 30; const p30 = g.precoGasto(leva, c.heroi(0, "topo"));
  ok(p10 > p1, `o preço não subiu da rodada 1 (${p1}) para a 10 (${p10})`);
  ok(p30 > p10, `o preço parou de subir entre a 10 (${p10}) e a 30 (${p30})`);
  ok(p30 <= 12, `o preço passou do teto: ${p30}`);
});

teste("Leva de Ferro empurra a onda da rota escolhida na direção certa", () => {
  const c = cena().vez(0);
  const g = c.g;
  const antes = g.J.frentes.topo;
  g.empurraOnda(0, "topo");
  ok(g.J.frentes.topo > antes, "a onda do time 0 deveria avançar para índice maior");

  const antes1 = g.J.frentes.meio;
  g.empurraOnda(1, "meio");
  ok(g.J.frentes.meio < antes1, "a onda do time 1 deveria avançar para índice menor");
});

teste("a IA compra a Leva e escolhe rota sem travar em tela", () => {
  const c = cena().vez(1);
  const g = c.g;
  const h = c.heroi(1, "topo");
  h.pos = [...g.BASE[1][0]];
  h.itens = ["eclipse", "basalto", "egide"];
  h.ouro = 60;
  const frentes0 = JSON.stringify(g.J.frentes);
  g.iaCompra(1);
  ok(h.ouro < 60, "a IA não gastou nada com o inventário cheio");
  ok(JSON.stringify(g.J.frentes) !== frentes0,
     "a IA comprou a Leva mas nenhuma onda andou — provável trava na escolha de rota");
});


/* ═══════════════ v21 — acampamento, moeda, ágil ═══════════════ */

teste("pisar no acampamento não coleta: é preciso estar lá no fim da rodada", () => {
  const c = cena().mov(6).vez(0);
  const g = c.g;
  const cp = g.J.camps.find(x => x.t === 0 && x.ativo);
  const h = c.heroi(0, "selva");
  const ouro0 = h.ouro;

  /* entra na casa andando — o caminho real do jogador */
  c.poe(h, g.vizinhos(...cp.pos).find(v => g.noTab(...v) && !g.em(...v)));
  g.limpaModo(); g.selHeroi = h; g.modo = "mover"; g.calcula();
  g.moveAte(...cp.pos);
  eq(h.ouro, ouro0, "pisar já pagou o ouro — o adversário não teve janela");
  ok(cp.ativo, "o acampamento sumiu só de pisar");

  /* fica lá até o fim da rodada: agora sim */
  g.colheAcampamentos();
  ok(h.ouro > ouro0, "ficar a rodada inteira não pagou");
  ok(!cp.ativo, "o acampamento continuou ativo depois de colhido");
});

teste("quem não sobreviveu em cima do acampamento não colhe", () => {
  const c = cena().vez(0);
  const g = c.g;
  const cp = g.J.camps.find(x => x.t === 0 && x.ativo);
  const h = c.heroi(0, "selva");
  c.poe(h, cp.pos);
  h.morto = 2;                              // morreu antes do fim da rodada
  const ouro0 = h.ouro;
  g.colheAcampamentos();
  eq(h.ouro, ouro0, "herói morto colheu o acampamento");
  ok(cp.ativo, "o acampamento foi consumido por um morto");
});

teste("invadir o acampamento inimigo paga mais", () => {
  const c = cena().vez(0);
  const g = c.g;
  const meu = g.J.camps.find(x => x.t === 0), dele = g.J.camps.find(x => x.t === 1);
  const a = c.heroi(0, "selva"), b = c.heroi(0, "topo");
  c.poe(a, meu.pos); c.poe(b, dele.pos);
  const oa = a.ouro, ob = b.ouro;
  g.colheAcampamentos();
  ok(b.ouro - ob > a.ouro - oa, "invadir deveria pagar mais que farmar em casa");
});

teste("o cara ou coroa sorteia quem começa, e vale a partida inteira", () => {
  const c = cena();
  const g = c.g;
  const vistos = new Set();
  for (let i = 0; i < 60; i++) { g.novo(); vistos.add(g.J.primeiro); }
  eq(vistos.size, 2, "quem começa não está sendo sorteado");

  /* e não pode re-sortear a cada rodada */
  g.novo();
  const p = g.J.primeiro;
  for (let i = 0; i < 6; i++) g.fimDaRodada();
  eq(g.J.primeiro, p, "quem começa mudou no meio da partida");
});

teste("Ágil dá uma casa grátis por turno, não por movimento", () => {
  const c = cena().mov(3).vez(0);
  const g = c.g;
  const nyx = g.J.times[0].herois.find(h => h.agil) || c.heroi(0, "selva");
  nyx.agil = 1; nyx.agilUsado = 0;
  const restante0 = g.J.mov.rest;

  const passo = () => {
    g.limpaModo(); g.selHeroi = nyx; g.modo = "mover"; g.calcula();
    const p = g.mover.find(q => g.dist(...nyx.pos, ...q) === 1);
    ok(p, "sem casa vizinha livre");
    g.moveAte(...p);
  };
  passo();
  eq(g.J.mov.rest, restante0, "a primeira casa deveria ser grátis");
  passo();
  eq(g.J.mov.rest, restante0 - 1, "a segunda casa também saiu de graça — movimento infinito");
  passo();
  eq(g.J.mov.rest, restante0 - 2, "o desconto voltou dentro do mesmo turno");
});

teste("respingo de Ultimate tira 2 do poço, igual ao golpe mirado", () => {
  const c = cena({ times: [["vharn", "nyx", "solenne", "vesper", "torvald"],
                           ["kaross", "grumo", "zhet", "cael", "gorm"]] })
              .dados(5, 5, 5).mov(0).vez(0);
  const g = c.g;
  const torvald = c.heroi(0, "sup");
  g.J.poco.vida = g.J.poco.vidaMax = 9;
  c.poe(torvald, g.vizinhos(...g.POCO).find(v => g.noTab(...v) && !g.em(...v)));
  const v0 = g.J.poco.vida;
  c.usa(torvald, 2);                        // Cerco é Ultimate, entra por respingo
  eq(v0 - g.J.poco.vida, 2, "Ultimate por respingo tirou peso de habilidade básica");
});

teste("nenhuma Ultimate mata um herói de vida cheia num golpe", () => {
  const c = cena();
  const g = c.g;
  let piores = [];
  for (const [id, h] of Object.entries(g.CATALOGO)) {
    const u = h.habs[2], e = u.ef;
    if (!e.dano && !e.danoFixo) continue;
    const bruto = e.danoFixo ? e.danoFixo
                : Math.round(6 * e.dano * 1.25) + h.poder + (e.extra || 0);
    const dano = e.danoFixo ? bruto : Math.max(1, bruto - 1);
    if (dano >= h.vida) piores.push(`${h.n} (${dano} vs ${h.vida})`);
  }
  eq(piores.length, 0, `Ultimates que matam de um golpe: ${piores.join(", ")}`);
});

teste("nenhum herói alcança mais de 4 hexágonos, nem com itens", () => {
  const c = cena();
  const g = c.g;
  const h = c.heroi(0, "adc");
  h.itens = g.ITENS.filter(i => i.ef.alc).map(i => i.id);
  ok(g.alcTotal(h) <= 4, `alcance ${g.alcTotal(h)} passou do teto de 4`);
});


teste("carta de item fica apagada quando não tem o que entregar", () => {
  const c = cena().vez(0);
  const g = c.g;
  const h = c.heroi(0, "topo");
  h.pos = [...g.BASE[0][0]];
  g.maos[0] = ["forja"];
  g.selHeroi = h;

  h.itens = [];
  ok(g.podeJogar("forja"), "com slot livre deveria ser jogável");

  h.itens = ["eclipse", "basalto", "egide"];
  ok(!g.podeJogar("forja"),
     "com inventário cheio a carta continua jogável e some sem entregar nada");
});

teste("as duas cartas de item abrem escolha de 3", () => {
  for (const carta of ["forja", "achado"]) {
    const c = cena().vez(0);
    const g = c.g;
    const h = c.heroi(0, "topo");
    h.pos = [...g.BASE[0][0]]; h.itens = [];
    g.maos[0] = [carta]; g.selHeroi = h;
    g.jogaCarta(carta);
    ok(g.escolhaItem, `${carta} não abriu escolha`);
    eq(g.escolhaItem.opcoes.length, 3, `${carta} não ofereceu 3 itens`);
    g.confirmaEscolhaItem(g.escolhaItem.opcoes[0]);
    eq(h.itens.length, 1, `${carta} não equipou o escolhido`);
  }
});

/* ═══════════════ v22 — o mato esconde de verdade ═══════════════ */

/* uma casa de mato longe de qualquer herói, para servir de esconderijo */
function casaDeMato(g, longeDe) {
  const cand = [];
  for (let r = 0; r < g.LINS; r++) for (let c = 0; c < g.COLS; c++) {
    if (!g.noTab(c, r) || !g.ehMato(c, r) || g.em(c, r)) continue;
    cand.push([c, r]);
  }
  if (!longeDe) return cand[0];
  return cand.sort((a, b) =>
    g.dist(...b, ...longeDe) - g.dist(...a, ...longeDe))[0];
}

teste("o mato só é visto de dentro do mato — rota e torre não enxergam lá", () => {
  const c = cena();
  const g = c.g;
  /* time 1 inteiro fora do mato: nas próprias casas de base */
  g.J.times[1].herois.forEach(h => c.poe(h, g.BASE[1][0]));
  g.desempilha();
  g.J.times[1].wards = [];

  let mato = 0, visto = 0;
  for (let r = 0; r < g.LINS; r++) for (let col = 0; col < g.COLS; col++) {
    if (!g.noTab(col, r) || !g.ehMato(col, r)) continue;
    mato++;
    if (g.enxergaCasa(1, col, r)) visto++;
  }
  ok(mato > 0, "o tabuleiro não tem mato — a classificação de terreno quebrou");
  eq(visto, 0,
     `com ninguém no mato o time ainda enxerga ${visto} de ${mato} casas de mato`);
});

teste("herói dentro do mato enxerga o mato à volta", () => {
  const c = cena();
  const g = c.g;
  g.J.times[0].herois.forEach(h => c.poe(h, g.BASE[0][0]));
  g.desempilha();
  const p = casaDeMato(g, g.BASE[0][0]);
  ok(p, "não achei casa de mato");
  ok(!g.enxergaCasa(0, ...p), "cenário inválido: o mato já estava aceso");

  const h = c.heroi(0, "selva");
  c.poe(h, p);
  ok(g.enxergaCasa(0, ...p), "o herói não acendeu o próprio mato");
  const vizMato = g.vizinhos(...p).find(v => g.ehMato(...v));
  if (vizMato) ok(g.enxergaCasa(0, ...vizMato), "o herói no mato não vê o mato vizinho");
});

teste("herói escondido no mato não aparece para o inimigo em cima da rota", () => {
  const c = cena();
  const g = c.g;
  const cac = c.heroi(1, "selva");
  g.J.times[0].wards = [];
  const p = casaDeMato(g, g.BASE[0][0]);
  c.poe(cac, p);
  /* o time 0 inteiro na casa de rota mais próxima do esconderijo */
  let melhor = null;
  for (let r = 0; r < g.LINS; r++) for (let col = 0; col < g.COLS; col++) {
    if (!g.noTab(col, r) || g.ehMato(col, r)) continue;
    const d = g.dist(col, r, ...p);
    if (!melhor || d < melhor.d) melhor = { p: [col, r], d };
  }
  ok(melhor && melhor.d <= 2, "não achei casa aberta encostada no mato");
  g.J.times[0].herois.forEach(h => c.poe(h, melhor.p));
  g.desempilha();
  ok(!g.visivelPara(cac, 0),
     "o inimigo na rota, colado no mato, continua vendo quem está dentro dele");
});

teste("ward posta na rota não enxerga dentro do mato; posta no mato, enxerga", () => {
  const c = cena();
  const g = c.g;
  g.J.times[0].herois.forEach(h => c.poe(h, g.BASE[0][0]));
  g.desempilha();
  const p = casaDeMato(g, g.BASE[0][0]);
  const aberta = g.vizinhos(...p).find(v => !g.ehMato(...v));

  g.J.times[0].wards = [];
  if (aberta) {
    g.poeWard(0, aberta);
    ok(!g.enxergaCasa(0, ...p), "a ward na rota enxergou dentro do mato");
  }
  g.J.times[0].wards = [];
  g.poeWard(0, p);
  ok(g.enxergaCasa(0, ...p), "a ward posta no mato não acendeu o mato");
});

teste("quem ataca fica revelado até se mover", () => {
  const c = cena().dados(4, 4, 4).mov(0).vez(1);
  const g = c.g;
  const cac = c.heroi(1, "selva"), alvo = c.heroi(0, "topo");
  alvo.vida = alvo.vidaMax = 90;
  g.J.times[0].wards = [];

  const p = casaDeMato(g, g.BASE[0][0]);
  c.poe(cac, p);
  g.J.times[0].herois.forEach(h => c.poe(h, g.BASE[0][0]));
  /* o alvo encosta no mato POR FORA: de lá ele não vê dentro, que é o cenário */
  const viz = g.vizinhos(...p).find(v => g.noTab(...v) && !g.em(...v) && !g.ehMato(...v));
  ok(viz, "não achei casa aberta encostada no mato");
  c.poe(alvo, viz);
  ok(!g.visivelPara(cac, 0), "cenário inválido: o atacante já estava à vista");

  c.usa(cac, 0, alvo);
  ok(g.visivelPara(cac, 0), "atacou de dentro do mato e continuou invisível");

  /* andar quebra o feitiço: ele sai da casa de onde atacou e some de novo */
  const outro = g.vizinhos(...p).find(v => g.ehMato(...v) && !g.em(...v));
  if (outro) {
    c.poe(cac, outro);
    ok(!g.visivelPara(cac, 0), "o revelado grudou no herói mesmo depois de ele andar");
  }
});

/* ═══════════════ v22 — defender junto da torre ═══════════════ */

teste("herói colado na própria torre viva ganha +1 de Armadura", () => {
  const c = cena();
  const g = c.g;
  const h = c.heroi(0, "topo");
  const tr = g.J.torres.find(x => x.t === 0 && x.vida > 0);
  const p = posTorre(g, tr);

  c.poe(h, g.BASE[0][0]);
  g.desempilha();
  const base = g.armTotal(h);

  c.poe(h, g.vizinhos(...p).find(v => g.noTab(...v) && !g.em(...v)));
  eq(g.armTotal(h), base + 1, "colado na própria torre, a armadura não subiu");

  tr.vida = 0;
  eq(g.armTotal(h), base, "a torre caída continuou protegendo");
});

teste("a torre INIMIGA não dá armadura a quem está mergulhando nela", () => {
  const c = cena();
  const g = c.g;
  const h = c.heroi(0, "topo");
  const tr = g.J.torres.find(x => x.t === 1 && x.vida > 0);
  const p = posTorre(g, tr);
  c.poe(h, g.BASE[0][0]);
  g.desempilha();
  const base = g.armTotal(h);
  c.poe(h, g.vizinhos(...p).find(v => g.noTab(...v) && !g.em(...v)));
  eq(g.armTotal(h), base, "a torre do adversário está protegendo o invasor");
});

teste("a armadura da torre entra na conta do dano", () => {
  const c = cena().dados(4, 4, 4).mov(0).vez(1);
  const g = c.g;
  const alvo = c.heroi(0, "topo"), bate = c.heroi(1, "topo");
  alvo.vida = alvo.vidaMax = 90; alvo.esc = 0;
  const tr = g.J.torres.find(x => x.t === 0 && x.vida > 0);
  const p = posTorre(g, tr);

  /* Uma cena só, medida duas vezes: com a torre viva e com ela caída. Comparar
     duas POSIÇÕES diferentes não serve aqui — mudar de casa mexe também em quem
     enxerga quem, e o +2 de emboscada entraria na conta sem avisar. A ward do
     time 0 em cima do atacante fecha essa porta nas duas medições. */
  const junto = g.vizinhos(...p).find(v => g.noTab(...v) && !g.em(...v));
  c.poe(alvo, junto);
  c.poe(bate, g.vizinhos(...junto).find(v => g.noTab(...v) && !g.em(...v)));
  g.J.times[0].wards = [];
  g.poeWard(0, bate.pos);
  ok(!g.escondido(bate), "cenário inválido: o atacante ficou escondido");

  let v0 = alvo.vida; c.usa(bate, 0, alvo);
  const sobTorre = v0 - alvo.vida;

  tr.vida = 0;
  bate.agiu = 0;
  v0 = alvo.vida; c.usa(bate, 0, alvo);
  const semTorre = v0 - alvo.vida;

  eq(semTorre - sobTorre, 1, "lutar sob a torre não reduziu o dano em 1");
});

/* ═══════════════ v22 — a Sentinela como gasto de ouro ═══════════════ */

teste("Sentinela: compra na base vira carga, e a carga vira ward onde o herói está", () => {
  const c = cena().vez(0);
  const g = c.g;
  const h = c.heroi(0, "selva");
  c.poe(h, g.BASE[0][0]);
  h.ouro = 30;
  g.J.times[0].wards = [];

  ok(g.gastosDisponiveis(h).some(x => x.id === "sentinela"),
     "a Sentinela não aparece na loja para quem está na base");
  const preco = g.precoGasto(g.GASTOS.find(x => x.id === "sentinela"), h);
  ok(g.usaGasto("sentinela", h, 0), "não deu para comprar a Sentinela");
  eq(h.ouro, 30 - preco, "o ouro não saiu");
  eq(h.sentinelas, 1, "a carga não entrou no herói");
  eq(g.J.times[0].wards.length, 0, "a ward foi plantada na base em vez de virar carga");

  const p = casaDeMato(g, g.BASE[0][0]);
  c.poe(h, p);
  ok(g.plantaSentinela(h), "não deu para plantar a carga");
  eq(h.sentinelas, 0, "a carga não foi consumida");
  eq(g.J.times[0].wards.length, 1, "a ward não entrou no mapa");
  ok(g.enxergaCasa(0, ...p), "a ward plantada não acendeu o mato");
  ok(!g.plantaSentinela(h), "plantou sem ter carga");
});

teste("Sentinela encarece a cada compra do mesmo herói", () => {
  const c = cena().vez(0);
  const g = c.g;
  const h = c.heroi(0, "selva");
  c.poe(h, g.BASE[0][0]);
  h.ouro = 99;
  const gs = g.GASTOS.find(x => x.id === "sentinela");
  const p1 = g.precoGasto(gs, h);
  g.usaGasto("sentinela", h, 0);
  const p2 = g.precoGasto(gs, h);
  ok(p2 > p1, `o preço não subiu (${p1} → ${p2})`);
});

/* ═══════════════ v23 — o fim de partida é de quem joga ═══════════════ */

/* deixa a rota do meio aberta e a onda encostada na base de `lado` */
function rotaAberta(c, lado) {
  const g = c.g;
  g.J.torres.filter(t => t.rota === "meio" && t.t === lado).forEach(t => t.vida = 0);
  g.J.frentes.meio = lado === 1 ? g.ROTAS.meio.length - 1 : 0;
}

teste("com defensor no Nexus, a onda para em 1 — o último ponto é de herói", () => {
  const c = cena().vez(0);
  const g = c.g;
  rotaAberta(c, 1);
  /* um defensor Carmim colado no próprio Nexus, o resto longe */
  const guarda = c.heroi(1, "sup");
  c.poe(guarda, g.BASE[1][0]);

  const antes = g.J.nexus[1];
  for (let i = 0; i < 8 && g.J.fim === null; i++) { rotaAberta(c, 1); g.fimDaRodada(); }
  ok(g.J.nexus[1] < antes, "a onda não bateu no Nexus nenhuma vez");
  eq(g.J.nexus[1], 1, "a onda passou de 1 mesmo com defensor — a última muralha não segurou");
  eq(g.J.fim, null, "a onda fechou a partida com o Nexus defendido");
});

teste("base vazia continua caindo sozinha — a regra não trava a partida", () => {
  const c = cena().vez(0);
  const g = c.g;
  rotaAberta(c, 1);
  /* ninguém do Carmim perto da própria base */
  const longe = g.ROTAS.meio[0];
  g.J.times[1].herois.forEach(h => c.poe(h, longe));
  g.desempilha();

  for (let i = 0; i < 10 && g.J.fim === null; i++) {
    rotaAberta(c, 1);
    g.J.times[1].herois.forEach(h => { if (!h.morto) c.poe(h, longe); });
    g.desempilha();
    g.fimDaRodada();
  }
  eq(g.J.fim, 0, "com a base abandonada a onda deveria ter fechado a partida");
});

teste("com o Nexus em 1, o herói fecha a partida", () => {
  const c = cena().dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  g.J.torres.filter(t => t.rota === "meio" && t.t === 1).forEach(t => t.vida = 0);
  g.J.nexus[1] = 1;
  const h = c.heroi(0, "meio");
  c.poe(h, g.vizinhos(...g.BASE[1][0]).find(v => g.noTab(...v) && !g.em(...v)));
  c.mira(h, 0);
  ok(g.alvoNexus === 1, "o Nexus exposto não virou alvo do herói");
  g.atacaNexus(1);
  eq(g.J.fim, 0, "o golpe de herói no Nexus em 1 não fechou a partida");
});

teste("o tempo de respawn cresce com a partida", () => {
  const c = cena();
  const g = c.g;
  const alvo = c.heroi(1, "topo"), quem = c.heroi(0, "topo");

  const morre = rodada => {
    g.J.rodada = rodada;
    alvo.vida = 1; alvo.morto = 0;
    g.mata(alvo, quem);
    return alvo.morto;
  };
  eq(morre(1), 2, "no começo da partida a morte deveria custar 2 rodadas");
  ok(morre(12) > 2, "na rodada 12 a morte ainda custa o mesmo do começo");
  ok(morre(30) <= 4, "o tempo de respawn passou do teto de 4");
  ok(morre(30) >= morre(12), "o tempo de respawn não é monotônico");
});

/* ═══════════════ v23 — a habilidade do meio paga o próprio dado ═══════════════ */

/* dano bruto de uma habilidade com o dado F, sem alvo — a régua da comparação */
function danoBruto(g, def, i, F) {
  const ef = def.habs[i].ef;
  return Math.round(F * (ef.dano || 0) * g.escalaDe(i)) + def.poder + (ef.extra || 0);
}

teste("habilidade do meio nunca dá MENOS dano que a básica com o mesmo dado", () => {
  const c = cena();
  const g = c.g;
  Object.entries(g.CATALOGO).forEach(([id, def]) => {
    const meio = def.habs[1];
    if (!meio.ef.dano || !def.habs[0].ef.dano) return;   // só compara dano com dano
    const F = meio.f;
    const dMeio = danoBruto(g, def, 1, F), dBas = danoBruto(g, def, 0, F);
    /* `>=` e não `>`: no dado 2 a escala de controle arredonda para baixo
       (round(2×1,2)=2) e o empate é legítimo — quem exige dado 2 exige quase
       nada, e essas trazem o efeito por cima. O que não pode é ficar ABAIXO. */
    ok(dMeio >= dBas,
       `${def.n}: ${meio.n} (F${F}) dá ${dMeio} e a básica dá ${dBas} com o mesmo dado`);
  });
});

teste("no dado 3 ou mais, a habilidade do meio paga o dado que ela exige", () => {
  const c = cena();
  const g = c.g;
  Object.entries(g.CATALOGO).forEach(([id, def]) => {
    const meio = def.habs[1];
    if (!meio.ef.dano || !def.habs[0].ef.dano || meio.f < 3) return;
    const dMeio = danoBruto(g, def, 1, meio.f), dBas = danoBruto(g, def, 0, meio.f);
    ok(dMeio > dBas,
       `${def.n}: ${meio.n} exige dado ${meio.f} e entrega o mesmo que a básica (${dMeio})`);
  });
});

teste("nenhuma Ultimate entrega menos que a básica do próprio herói", () => {
  const c = cena();
  const g = c.g;
  Object.entries(g.CATALOGO).forEach(([id, def]) => {
    const ult = def.habs[2];
    if (!ult.ef.dano || !def.habs[0].ef.dano) return;
    const dUlt = danoBruto(g, def, 2, ult.f), dBas = danoBruto(g, def, 0, ult.f);
    ok(dUlt >= dBas,
       `${def.n}: a Ultimate ${ult.n} dá ${dUlt} e a básica dá ${dBas} com o mesmo dado`);
  });
});

/* ═══════════════ v24 — o preço do Dragão ═══════════════ */

/* Medido em 1500 partidas antes de mexer: o Dragão morria em 21,5% das partidas
   em que aparecia, e `sim/epicos.js` imprimia "muito tentado e pouco fechado".
   O pedágio foi descartado por medição, não por gosto — `revide=off` deu 21,7%,
   ou seja, nada. O que segurava era a VIDA: com 4, matar exigia duas Ultimates
   no mesmo poço, e a janela do Dragão (rodada 5 até a 12, quando o Barão toma o
   lugar) quase nunca comportava as duas.

   Este teste trava o preço nos dois sentidos, que é onde mora o dilema:
   caber em dois dados, e nunca em um. */
teste("o Dragão cai em dois dados — Ultimate mais básica, e nunca numa só", () => {
  const c = cena({ times: [["kaross", "nyx", "solenne", "vesper", "torvald"],
                           ["vharn", "grumo", "zhet", "cael", "gorm"]] })
              .mov(0).vez(0);
  const g = c.g;
  const h = c.heroi(0, "topo");           // Kaross: básica e Ultimate miram inimigo
  const livre = g.vizinhos(...g.POCO).find(v => g.noTab(...v) && !g.em(...v));
  ok(livre, "não achei casa livre colada no poço");
  c.poe(h, livre);

  /* GOLPE_HAB e GOLPE_ULT são `const` de script e não saem pela ponte, então o
     peso de cada golpe se mede batendo — num poço fundo demais para morrer no
     meio da medição e falsear o segundo golpe. */
  const peso = i => {
    g.J.poco.id = "dragao"; g.J.poco.vida = g.J.poco.vidaMax = 99;
    h.agiu = 0; h.vida = g.CATALOGO[h.id].vida; c.dados(6, 6, 6);
    const v0 = g.J.poco.vida;
    c.mira(h, i); g.atacaEpico(g.J.poco);
    return v0 - g.J.poco.vida;
  };
  const pesoUlt = peso(2), pesoBas = peso(0);
  ok(pesoUlt > 0 && pesoBas > 0, "o golpe no poço não tirou vida nenhuma");

  const vida = g.EPICO.dragao.vida;
  ok(vida <= pesoUlt + pesoBas,
     `o Dragão tem ${vida} de vida e não cai em Ultimate + básica `
     + `(${pesoUlt}+${pesoBas}=${pesoUlt + pesoBas}) — caro demais para a janela dele`);
  ok(vida > pesoUlt,
     `o Dragão tem ${vida} de vida e cai numa Ultimate sozinha (${pesoUlt}) `
     + `— deixou de custar o segundo dado, e com ele o dilema`);
});

/* ---------- resumo ---------- */
console.log(`\n  ${passou} passaram · ${falhou} falharam\n`);
if (falhou) {
  console.log("  falhas:");
  falhas.forEach(([n, e]) => console.log(`    · ${n}\n      ${e.message}`));
  console.log("");
}
process.exit(falhou ? 1 : 0);
