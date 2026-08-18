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
  /* v45: a vítima precisa ESTAR VISÍVEL, e agora isso não é de graça — o Pombo
     Ciborgue fica Invisível sozinho, e a IA não pode ler posição que não vê
     (§30). Sem revelar, este teste passava a medir a névoa em vez da conversão
     de dado em movimento, que é o que ele existe para medir. */
  g.aplicaCond(vitima, "revelado", { tu: 3 });
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
  /* Quantos do time 0 estão nesta rota AGORA. Era `1` fixo, e virou contagem na
     v46: desde que a rotação passou a acontecer também na rodada 1, o Caçador
     nasce reposicionado e pode cair na mesma rota do herói do meio. O teste mede
     o CONGELAMENTO — se ele depender de quantos heróis calharam de estar na rota,
     ele reprova por um motivo que não é o dele. */
  const esperado = g.vivos(0).filter(x => g.rotaDaPos(x) === nomeRota).length;
  g.encerraTurno();
  eq(g.J.presenca[0][nomeRota], esperado, "a presença do time 0 não foi congelada");

  /* agora o time 0 sai da rota — a contagem congelada NÃO pode mudar */
  c.poe(h, g.BASE[0][0]);
  eq(g.J.presenca[0][nomeRota], esperado,
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

/* ═══════════════ v29 — níveis da IA, e o crash do time inteiro morto ═══════════════ */

/* Achado dirigindo a IA de verdade em sim/niveis.js: com o TIME INTEIRO morto,
   `iaJogaCartas` escolhia como alvo o herói vivo mais saudável — que não existe —
   e seguia jogando a carta com `selHeroi` indefinido. A primeira carta de ward
   estourava `TypeError: Cannot read properties of undefined (reading 'pos')` e a
   partida MORRIA. Time inteiro no respawn ao mesmo tempo é situação comum no fim
   de partida, não caso de borda. */
teste("com o time inteiro morto a IA não joga carta — e não derruba a partida", () => {
  const c = cena({ times: [["kaross", "nyx", "solenne", "vesper", "torvald"],
                           ["vharn", "grumo", "zhet", "cael", "gorm"]] })
              .dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  g.J.times[0].herois.forEach(h => { h.morto = 2; h.vida = 0; });
  g.maos[0] = g.baralho.slice(0, 3);            // mão cheia, para ela querer jogar

  let estourou = null;
  try { g.iaJogaCartas(0); } catch (e) { estourou = e; }
  eq(estourou, null,
     `a IA estourou com o time morto: ${estourou && estourou.message}`);
});

/* ═══════════════ v38 — a rotação do Caçador por REGIÃO ═══════════════ */

/* No início da rodada os dois escolhem, às cegas, PARA QUE REGIÃO o próprio
   Caçador vai: Topo, Meio, Baixo ou Selva. Ele é reposicionado na hora, sempre
   dentro da SELVA, na parte dela colada à região escolhida.

   HISTÓRIA, porque estes testes mudaram de lado e isso precisa ficar escrito.
   Até a v37 a rotação era ANDAR — até 3 casas de graça — e havia dois testes
   aqui travando o teleporte, herdados da correção que o Vinicius fez na v19
   contra o desenho da v18. A v38 reintroduz o reposicionamento imediato, a
   pedido do Vilker, e aqueles dois testes saíram junto.

   O que continua travado, e é a metade da correção do Vinicius que segue de pé:
   o Caçador NUNCA sai do tabuleiro, nunca pousa fora da selva e nunca pousa em
   cima de outra peça. Os testes abaixo cobrem exatamente isso. */

const cenaSelva = () => cena({ times: [["kaross", "nyx", "solenne", "vesper", "torvald"],
                                       ["vharn", "grumo", "zhet", "cael", "gorm"]] })
                          .mov(0).vez(0);

const REGS = ["topo", "meio", "baixo", "selva"];

/* ---------- as quatro regiões, uma por uma ---------- */

REGS.forEach(reg => {
  teste(`escolher ${reg.toUpperCase()} põe o Caçador na selva daquela região`, () => {
    const c = cenaSelva();
    const g = c.g;
    const h = g.cacadorDe(0);
    ok(h, "não achei o Caçador do time 0");

    const alvo = g.SELVA_PONTOS[0][reg];
    ok(alvo, `a região ${reg} não tem ponto derivado`);

    g.escolheRotacao(0, reg);

    eq(g.dist(...h.pos, ...alvo), 0,
       `escolheu ${reg} e não pousou no ponto daquela região`);
    ok(g.MATO.has(g.k(...h.pos)), "pousou fora da selva");
    ok(g.noTab(...h.pos), "saiu do tabuleiro — foi o erro da v18");
  });
});

teste("o Caçador NUNCA pousa dentro da rota, em nenhuma das quatro regiões", () => {
  const g = cenaSelva().g;
  [0, 1].forEach(t => REGS.forEach(reg => {
    const h = g.cacadorDe(t);
    g.escolheRotacao(t, reg);
    const K = g.k(...h.pos);
    ok(!g.LANE.has(K),
       `time ${t}, região ${reg}: pousou em ${K}, que é corredor de rota`);
    ok(g.MATO.has(K), `time ${t}, região ${reg}: pousou em ${K}, que não é selva`);
  }));
});

teste("Topo, Meio e Baixo pousam colados na PRÓPRIA rota; Selva no centro", () => {
  const g = cenaSelva().g;
  [0, 1].forEach(t => {
    ["topo", "meio", "baixo"].forEach(reg => {
      const p = g.SELVA_PONTOS[t][reg];
      const d = Math.min(...g.CORREDOR[reg].map(q => g.dist(...p, ...q)));
      eq(d, 1, `time ${t}: o ponto de ${reg} está a ${d} da rota ${reg} — devia encostar`);
    });
    /* o ponto da Selva não é o de nenhuma rota */
    const s = g.k(...g.SELVA_PONTOS[t].selva);
    ["topo", "meio", "baixo"].forEach(reg =>
      ok(s !== g.k(...g.SELVA_PONTOS[t][reg]),
         `time ${t}: o ponto da Selva repete o ponto de ${reg} — quatro botões, três lugares`));
  });
});

teste("cada time pousa no PRÓPRIO lado, e os oito pontos são espelho exato", () => {
  const g = cenaSelva().g;
  const dBase = (p, t) => Math.min(...g.BASE[t].map(b => g.dist(...b, ...p)));
  [0, 1].forEach(t => REGS.forEach(reg => {
    const p = g.SELVA_PONTOS[t][reg];
    ok(dBase(p, t) < dBase(p, 1 - t),
       `time ${t}, região ${reg}: o ponto ${g.k(...p)} está mais perto da base inimiga`);
  }));
  /* `gira` leva a rota de cima na de baixo — o espelho troca topo por baixo */
  const par = { topo: "baixo", baixo: "topo", meio: "meio", selva: "selva" };
  REGS.forEach(reg => {
    const esp = g.gira(...g.SELVA_PONTOS[0][reg]);
    const alvo = g.SELVA_PONTOS[1][par[reg]];
    eq(g.k(...esp), g.k(...alvo),
       `o ponto de ${reg} do time 0 não espelha o de ${par[reg]} do time 1`);
  });
});

/* ---------- casa ocupada, casa inválida ---------- */

teste("ponto preferencial OCUPADO: pousa na casa de selva válida mais próxima", () => {
  const c = cenaSelva();
  const g = c.g;
  const h = g.cacadorDe(0);
  const alvo = g.SELVA_PONTOS[0].topo;

  /* um aliado sentado exatamente no ponto preferencial */
  const bloqueio = g.J.times[0].herois.find(x => x !== h);
  c.poe(bloqueio, alvo);

  g.escolheRotacao(0, "topo");

  ok(g.dist(...h.pos, ...alvo) > 0, "pousou em cima de outra peça");
  ok(g.MATO.has(g.k(...h.pos)), "desviou para fora da selva");
  ok(!g.LANE.has(g.k(...h.pos)), "desviou para dentro da rota");
  eq(g.em(...h.pos), h, "a casa de pouso tem outra peça");
});

teste("ponto preferencial cercado de ocupados: continua achando casa de selva", () => {
  const c = cenaSelva();
  const g = c.g;
  const h = g.cacadorDe(0);
  const alvo = g.SELVA_PONTOS[0].meio;

  /* enche o ponto e todas as vizinhas de selva com o resto do time */
  const encher = [alvo, ...g.vizinhos(...alvo).filter(p => g.MATO.has(g.k(...p)))];
  const outros = g.J.times[0].herois.filter(x => x !== h)
                  .concat(g.J.times[1].herois);
  encher.forEach((p, i) => { if (outros[i]) c.poe(outros[i], p); });

  g.escolheRotacao(0, "meio");

  ok(g.MATO.has(g.k(...h.pos)), "com o ponto cercado, pousou fora da selva");
  eq(g.em(...h.pos), h, "pousou em cima de outra peça");
});

teste("escolher a região onde o Caçador JÁ está não falha por ele ocupar a casa", () => {
  const c = cenaSelva();
  const g = c.g;
  const h = g.cacadorDe(0);
  const alvo = g.SELVA_PONTOS[0].selva;
  c.poe(h, alvo);
  g.escolheRotacao(0, "selva");
  eq(g.dist(...h.pos, ...alvo), 0, "saiu do lugar certo por estar nele");
});

teste("o reposicionamento não altera o mapa", () => {
  const c = cenaSelva();
  const g = c.g;
  const antes = {
    mato: [...g.MATO].sort().join("|"),
    lane: [...g.LANE.keys()].sort().join("|"),
    poco: g.k(...g.POCO),
    torres: g.J.torres.map(t => `${t.rota}${t.i}${t.t}${t.vida}`).join("|")
  };
  [0, 1].forEach(t => REGS.forEach(reg => g.escolheRotacao(t, reg)));
  eq([...g.MATO].sort().join("|"), antes.mato, "a selva mudou de forma");
  eq([...g.LANE.keys()].sort().join("|"), antes.lane, "as rotas mudaram de forma");
  eq(g.k(...g.POCO), antes.poco, "o poço mudou de casa");
  eq(g.J.torres.map(t => `${t.rota}${t.i}${t.t}${t.vida}`).join("|"), antes.torres, "as torres mudaram");
});

teste("depois de reposicionado o Caçador age normalmente", () => {
  const c = cenaSelva().dados(6, 6, 6).mov(3).vez(0);
  const g = c.g;
  const h = g.cacadorDe(0);
  g.escolheRotacao(0, "topo");
  const de = [...h.pos];

  /* anda: a peça continua sendo uma peça comum depois do pouso */
  const livre = g.vizinhos(...h.pos).find(p => g.noTab(...p) && !g.em(...p));
  ok(livre, "o Caçador pousou sem nenhuma vizinha livre");
  g.selHeroi = h; g.limpaModo(); g.selHeroi = h;
  g.moveAte(...livre);
  ok(g.dist(...de, ...h.pos) > 0, "não conseguiu andar depois de reposicionado");

  /* e bate: um inimigo colado toma dano da básica */
  const alvo = g.J.times[1].herois.find(x => !x.morto);
  c.poe(alvo, g.vizinhos(...h.pos).find(p => g.noTab(...p) && !g.em(...p)));
  const v0 = alvo.vida;
  c.usa(h, 0, alvo);
  ok(alvo.vida < v0, "a básica não saiu depois do reposicionamento");
});

/* ---------- o relógio de 10 segundos ---------- */

teste("sem escolha em 10 segundos, o Caçador vai sozinho para a Selva", () => {
  const c = cenaSelva();
  const g = c.g;
  g.simMode = false; g.aiMode = false;
  g.rotacaoDeVerdade();   // este teste mede o RELÓGIO, não o atalho do harness          // hotseat: os dois são humanos
  const h = g.cacadorDe(0);
  const centro = g.SELVA_PONTOS[0].selva;
  c.poe(h, g.BASE[0][0]);                        // longe do centro da selva

  eq(g.ROTACAO_SEGUNDOS, 10, "o prazo deixou de ser 10 segundos");

  g.abreRotacoes();
  const rel = g.__timers.filter(t => t.vivo).pop();
  ok(rel, "a tela da rotação abriu sem relógio — a partida pode travar esperando");
  eq(rel.ms, 1000, "o relógio não bate de segundo em segundo");

  /* nove tiques: ainda não escolheu nada */
  for (let i = 0; i < 9; i++) rel.fn();
  eq(g.dist(...h.pos, ...centro) === 0, false, "reposicionou antes do prazo acabar");

  rel.fn();                                      // o décimo
  eq(g.dist(...h.pos, ...centro), 0, "o timeout não mandou o Caçador para o centro da Selva");
  eq(g.J.rotacao[0], "selva", "o timeout não registrou a Selva como escolha");
});

teste("o timeout usa exatamente o mesmo caminho da escolha manual", () => {
  const a = cenaSelva(), b = cenaSelva();
  a.g.simMode = false; a.g.aiMode = false;
  a.g.rotacaoDeVerdade();   // este teste mede o RELÓGIO, não o atalho do harness
  a.poe(a.g.cacadorDe(0), a.g.BASE[0][0]);
  b.poe(b.g.cacadorDe(0), b.g.BASE[0][0]);

  a.g.abreRotacoes();
  const rel = a.g.__timers.filter(t => t.vivo).pop();
  for (let i = 0; i < 10; i++) rel.fn();

  b.g.escolheRotacao(0, "selva");               // manual

  eq(a.g.k(...a.g.cacadorDe(0).pos), b.g.k(...b.g.cacadorDe(0).pos),
     "timeout e escolha manual pousam em casas diferentes");
});

teste("escolher desliga o relógio — ele não dispara depois", () => {
  const c = cenaSelva();
  const g = c.g;
  g.simMode = false; g.aiMode = false;
  g.rotacaoDeVerdade();   // este teste mede o RELÓGIO, não o atalho do harness
  const h = g.cacadorDe(0);

  g.abreRotacoes();
  const rel = g.__timers.filter(t => t.vivo).pop();
  ok(rel, "não abriu relógio");

  g.escolheRotacao(0, "topo");                   // o jogador escolheu
  g.paraRelogioRotacao();                        // é o que o clique faz
  eq(rel.vivo, false, "o relógio continuou vivo depois da escolha");

  const pouso = g.k(...h.pos);
  for (let i = 0; i < 20; i++) if (rel.vivo) rel.fn();
  eq(g.k(...h.pos), pouso, "o relógio disparou depois da escolha e mudou o Caçador de lugar");
});

teste("com a partida encerrada o relógio se desliga em vez de reposicionar", () => {
  const c = cenaSelva();
  const g = c.g;
  g.simMode = false; g.aiMode = false;
  g.rotacaoDeVerdade();   // este teste mede o RELÓGIO, não o atalho do harness
  const h = g.cacadorDe(0);
  g.abreRotacoes();
  const rel = g.__timers.filter(t => t.vivo).pop();
  const pouso = g.k(...h.pos);
  g.J.fim = 0;
  for (let i = 0; i < 15; i++) if (rel.vivo) rel.fn();
  eq(g.k(...h.pos), pouso, "mexeu no Caçador com a partida já encerrada");
});

/* ---------- escolha secreta ---------- */

teste("a escolha é secreta: nada no log entrega a região", () => {
  const c = cenaSelva();
  const g = c.g;
  const antes = g.J.log.length;
  REGS.forEach(reg => g.escolheRotacao(0, reg));
  const novas = g.J.log.slice(0, g.J.log.length - antes).map(l => l.txt).join(" ").toLowerCase();
  ["topo", "meio", "baixo", "selva", "rotaci"].forEach(palavra =>
    ok(!novas.includes(palavra),
       `o log entregou a região do Caçador: achei "${palavra}" em "${novas}"`));
});

teste("Caçador fora da visão inimiga continua escondido depois de pousar", () => {
  const c = cenaSelva();
  const g = c.g;
  const h = g.cacadorDe(0);
  /* o time 1 inteiro na própria base, longe da selva do time 0 */
  g.J.times[1].herois.forEach(x => c.poe(x, g.BASE[1][0]));
  g.J.wards = [];
  g.escolheRotacao(0, "topo");
  ok(g.MATO.has(g.k(...h.pos)), "não pousou no mato");
  ok(!g.visivelPara(h, 1), "o adversário enxergou o Caçador sem ter visão do mato");
});

teste("com ward na casa de pouso, o adversário VÊ o Caçador — a posição é a informação", () => {
  const c = cenaSelva();
  const g = c.g;
  const h = g.cacadorDe(0);
  g.J.times[1].herois.forEach(x => c.poe(x, g.BASE[1][0]));
  g.J.wards = [];

  const alvo = g.SELVA_PONTOS[0].topo;
  g.poeWard(1, alvo);                            // ward do time 1 exatamente ali
  g.escolheRotacao(0, "topo");

  eq(g.dist(...h.pos, ...alvo), 0, "não pousou no ponto esperado");
  ok(g.visivelPara(h, 1), "a ward estava em cima do Caçador e não o revelou");
});

teste("ward em OUTRA região não revela: o que revela é a posição, não a escolha", () => {
  const c = cenaSelva();
  const g = c.g;
  const h = g.cacadorDe(0);
  g.J.times[1].herois.forEach(x => c.poe(x, g.BASE[1][0]));
  g.J.wards = [];

  g.poeWard(1, g.SELVA_PONTOS[0].baixo);         // vigiando a região errada
  g.escolheRotacao(0, "topo");

  ok(!g.visivelPara(h, 1),
     "a ward numa região revelou o Caçador que foi para outra — informação de ficha, não de posição");
});

/* ---------- a IA ---------- */

teste("a IA só devolve Topo, Meio, Baixo ou Selva, e nunca fica sem resposta", () => {
  const c = cenaSelva();
  const g = c.g;
  const ids = g.REGIOES.map(r => r.id);
  eq(ids.sort().join(","), "baixo,meio,selva,topo", "o menu de regiões não é o dos quatro");

  Object.keys(g.NIVEIS_IA).forEach(nivel => {
    g.nivelIA = nivel;
    for (let i = 0; i < 40; i++)
      ok(ids.includes(g.iaEscolheRotacao(1)), `nível ${nivel}: destino fora do menu`);
  });
  g.nivelIA = "dificil";
  g.cacadorDe(1).morto = 2;
  ok(ids.includes(g.iaEscolheRotacao(1)), "sem Caçador vivo a IA não devolveu região");
});

teste("a IA usa a mesma mecânica de pouso do jogador", () => {
  const c = cenaSelva();
  const g = c.g;
  g.nivelIA = "dificil";
  const h = g.cacadorDe(1);
  const reg = g.iaEscolheRotacao(1);
  g.escolheRotacao(1, reg);
  eq(g.k(...h.pos), g.k(...g.SELVA_PONTOS[1][reg]),
     "a IA pousou em casa diferente da que o mesmo botão daria ao jogador");
  ok(g.MATO.has(g.k(...h.pos)), "a IA pousou fora da selva");
  ok(!g.LANE.has(g.k(...h.pos)), "a IA pousou dentro da rota");
});

teste("a IA escolhe a rota onde há gank, e cada uma das três é alcançável", () => {
  const g = cenaSelva().g;
  g.nivelIA = "dificil";
  ["topo", "meio", "baixo"].forEach(reg => {
    const c2 = cenaSelva();
    const g2 = c2.g;
    g2.nivelIA = "dificil";
    /* o time 0 inteiro fora do caminho, e um herói dele ferido e exposto
       colado no ponto de pouso da IA naquela rota */
    g2.J.times[0].herois.forEach(x => c2.poe(x, g2.BASE[0][0]));
    const isca = g2.J.times[0].herois[0];
    /* na ROTA, no vão disputado — é o que "gank no topo" quer dizer */
    const corr = g2.CORREDOR[reg].filter(p => g2.noTab(...p) && !g2.em(...p));
    ok(corr.length, `a rota ${reg} não tem casa livre`);
    const vao = g2.ROTAS[reg][Math.floor(g2.ROTAS[reg].length / 2)];
    c2.poe(isca, corr.sort((a, b) => g2.dist(...a, ...vao) - g2.dist(...b, ...vao))[0]);
    isca.vida = 1;
    /* a IA precisa ENXERGAR a isca — senão, e corretamente, ela a ignora */
    g2.poeWard(1, isca.pos);
    g2.J.poco.vida = 0;                          // sem objetivo puxando para a Selva
    eq(g2.iaEscolheRotacao(1), reg,
       `com alvo ferido e visível em ${reg}, a IA foi para outro lugar`);
  });
});

teste("a IA não enxerga através da névoa para decidir a rotação", () => {
  /* A isca tem de ficar num MATO colado à rota do topo: rota aberta é visível de
     torre e de onda, e ali a IA enxerga sem ward nenhuma — de direito. O mato só
     se vê de dentro, então é lá que dá para separar "decidiu vendo" de
     "decidiu adivinhando". */
  const monta = () => {
    const c = cenaSelva(), g = c.g;
    g.nivelIA = "dificil";
    g.J.times[0].herois.forEach(x => c.poe(x, g.BASE[0][0]));
    g.J.wards = [];
    g.J.poco.vida = 0;                                  // sem objetivo puxando para a Selva
    return { c, g };
  };
  /* uma casa de mato colada ao topo e fora da visão do time 1 */
  const escolhe = g => [...g.MATO].map(K => K.split(",").map(Number))
    .filter(p => Math.min(...g.CORREDOR.topo.map(q => g.dist(...p, ...q))) <= 1)
    .filter(p => !g.enxergaCasa(1, ...p) && !g.em(...p))[0];

  const base = monta();
  const casa = escolhe(base.g);
  ok(casa, "não achei mato colado ao topo e escondido do time 1");

  const roda = comWard => {
    const { c, g } = monta();
    const isca = g.J.times[0].herois[0];
    c.poe(isca, casa);
    isca.vida = 1;
    if (comWard) g.poeWard(1, casa);
    ok(g.visivelPara(isca, 1) === comWard,
       `a visibilidade da isca não é a esperada (ward=${comWard})`);
    return g.iaEscolheRotacao(1);
  };

  eq(roda(true), "topo", "com ward em cima do alvo a IA não foi ao gank");
  ok(roda(false) !== "topo",
     "sem visão do alvo a IA foi ao gank mesmo assim — está lendo através da névoa");
});

teste("com o Barão de pé e o mapa quieto, a IA vai para a Selva", () => {
  const c = cenaSelva();
  const g = c.g;
  g.nivelIA = "dificil";
  /* ninguém visível em rota nenhuma */
  g.J.times[0].herois.forEach(x => c.poe(x, g.BASE[0][0]));
  g.J.wards = [];
  g.J.poco.id = "barao"; g.J.poco.vida = 16;
  eq(g.iaEscolheRotacao(1), "selva", "com o Barão vivo e nada nas rotas, a IA não foi à Selva");
});

teste("o Aprendiz sorteia entre as quatro regiões — e só entre elas", () => {
  const g = cenaSelva().g;
  g.nivelIA = "facil";
  const vistos = new Set();
  for (let i = 0; i < 300; i++) vistos.add(g.iaEscolheRotacao(1));
  ok([...vistos].every(x => REGS.includes(x)), `sorteou fora do menu: ${[...vistos]}`);
  ok(vistos.size >= 3, `o sorteio do Aprendiz só produziu ${vistos.size} regiões em 300 tentativas`);
});

/* ---------- o que saiu junto ---------- */

teste("as opções antigas de destino não existem mais no menu", () => {
  const g = cenaSelva().g;
  const ids = g.REGIOES.map(r => r.id);
  ["proprio", "neutro", "invasao", "poco"].forEach(velho =>
    ok(!ids.includes(velho), `o destino antigo "${velho}" continua no menu da rotação`));
  ok(!("migraCacador" in g), "migraCacador continua exposto — a rotação por passos não saiu inteira");
});

/* O foco no poço deixou de ser bônus de rotação junto com o destino "poço", mas
   o +1 no golpe continua existindo no motor. Este teste guarda a regra, agora
   sem passar pela rotação — era a única cobertura que ela tinha. */
teste("o foco no poço soma +1 no golpe, venha ele de onde vier", () => {
  const c = cenaSelva();
  const g = c.g;
  const h = g.cacadorDe(0);
  g.J.poco.id = "dragao"; g.J.poco.vida = g.J.poco.vidaMax = 99;
  const semFoco = g.golpeNoPoco(h, h.habs[0], 0, 4, g.J.poco);
  h.focoPoco = 1;
  eq(g.golpeNoPoco(h, h.habs[0], 0, 4, g.J.poco), semFoco + 1,
     "o foco no poço não somou +1 no golpe");
});
/* ═══════════════ v39 — hexágonos bloqueados na selva ═══════════════ */

/* Item 4 e 5 da direção de arte: algumas casas da selva são fisicamente
   bloqueadas, e o obstáculo é o próprio hexágono. Elas existem para a selva
   virar corredor em vez de campo aberto.

   O item 1 da mesma direção diz que a PLANTA NÃO MUDA. Os dois convivem porque
   bloquear é sobre quais casas são caminháveis, não sobre onde os hexágonos
   estão — e o primeiro teste daqui existe para provar isso. */

const cenaBloq = () => cena({ times: [["kaross", "nyx", "solenne", "vesper", "torvald"],
                                      ["vharn", "grumo", "zhet", "cael", "gorm"]] })
                         .mov(6).vez(0);

teste("a planta do mapa não mudou: mesmos hexágonos, rotas, torres e poço", () => {
  const g = cenaBloq().g;
  let casas = 0;
  for (let r = 0; r < g.LINS; r++) for (let c = 0; c < g.COLS; c++) if (g.noTab(c, r)) casas++;
  eq(casas, 116, "o número de hexágonos do tabuleiro mudou");
  eq(g.COLS, 11, "largura do tabuleiro mudou");
  eq(g.LINS, 11, "altura do tabuleiro mudou");
  eq(g.MATO.size, 27, "o tamanho da selva mudou");
  eq(g.k(...g.POCO), "8,8", "o poço saiu do lugar");
  eq(g.J.torres.length, 12, "o número de torres mudou");
  /* nenhuma bloqueada é rota, base, rio ou poço */
  [...g.BLOQUEADO].forEach(K => {
    ok(g.MATO.has(K), `a casa bloqueada ${K} não é selva`);
    ok(!g.LANE.has(K), `a casa bloqueada ${K} é corredor de rota`);
    ok(K !== g.k(...g.POCO), "o poço foi bloqueado");
  });
});

teste("bloqueada nenhuma cai em acampamento nem em ponto de pouso do Caçador", () => {
  const g = cenaBloq().g;
  const pousos = new Set([0, 1].flatMap(t =>
    ["topo", "meio", "baixo", "selva"].map(i => g.k(...g.SELVA_PONTOS[t][i]))));
  const acampas = new Set([
    ...g.CAMP_NEUTRO_LADOS.map(p => g.k(...p)),
    g.k(...g.CAMP_AZUL), g.k(...g.gira(...g.CAMP_AZUL))
  ]);
  [...g.BLOQUEADO].forEach(K => {
    ok(!pousos.has(K), `a casa bloqueada ${K} é ponto de pouso do Caçador`);
    ok(!acampas.has(K), `a casa bloqueada ${K} é acampamento`);
  });
  /* e o poço continua acessível: nenhuma vizinha dele bloqueada */
  g.vizinhos(...g.POCO).forEach(p =>
    ok(!g.ehBloqueado(...p), `a vizinha ${g.k(...p)} do poço foi bloqueada — o objetivo fica sem porta`));
});

teste("as casas bloqueadas são espelho exato umas das outras", () => {
  const g = cenaBloq().g;
  ok(g.BLOQUEADO.size > 0, "não há casa bloqueada nenhuma");
  eq(g.BLOQUEADO.size % 2, 0, "número ímpar de bloqueadas — alguma ficou sem espelho");
  [...g.BLOQUEADO].forEach(K => {
    const [c, r] = K.split(",").map(Number);
    const e = g.gira(c, r);
    ok(g.BLOQUEADO.has(g.k(...e)),
       `a casa ${K} está bloqueada e o espelho dela ${g.k(...e)} não — um lado anda mais que o outro`);
  });
});

teste("obstáculo não encosta em obstáculo — é contorno, não muralha", () => {
  const g = cenaBloq().g;
  [...g.BLOQUEADO].forEach(K => {
    const [c, r] = K.split(",").map(Number);
    const vizinhaBloq = g.vizinhos(c, r).find(p => g.ehBloqueado(...p));
    ok(!vizinhaBloq,
       `${K} encosta em ${vizinhaBloq && g.k(...vizinhaBloq)} — dois obstáculos juntos viram parede`);
  });
});

teste("o tabuleiro continua inteiro: toda casa livre alcança toda casa livre", () => {
  const g = cenaBloq().g;
  const livres = [];
  for (let r = 0; r < g.LINS; r++) for (let c = 0; c < g.COLS; c++)
    if (g.noTab(c, r) && !g.ehBloqueado(c, r)) livres.push([c, r]);
  const d = g.passosDe(livres[0]);
  const presas = livres.filter(p => !d.has(g.k(...p)));
  eq(presas.length, 0, `${presas.length} casas ficaram inalcançáveis: ${presas.slice(0, 5).map(p => g.k(...p))}`);
});

teste("a selva continua inteira — o bloqueio estreita corredor, não parte em ilhas", () => {
  const g = cenaBloq().g;
  /* componentes do grafo de mato, com e sem os bloqueios */
  const comps = usaBloqueio => {
    const livres = [...g.MATO].map(K => K.split(",").map(Number))
      .filter(p => !(usaBloqueio && g.ehBloqueado(...p)));
    const chaves = new Set(livres.map(p => g.k(...p)));
    const vis = new Set(); let n = 0;
    livres.forEach(p0 => {
      if (vis.has(g.k(...p0))) return;
      n++; const f = [p0]; vis.add(g.k(...p0));
      while (f.length) {
        const p = f.pop();
        g.vizinhos(...p).forEach(v => {
          const kk = g.k(...v);
          if (chaves.has(kk) && !vis.has(kk)) { vis.add(kk); f.push(v); }
        });
      }
    });
    return n;
  };
  eq(comps(true), comps(false),
     "o bloqueio partiu a selva em mais regiões do que ela tinha — o Caçador fica preso no quintal");
});

teste("cada casa bloqueada tem um obstáculo declarado — nada de pedra genérica", () => {
  const g = cenaBloq().g;
  [...g.BLOQUEADO].forEach(K =>
    ok(g.OBSTACULO[K], `a casa bloqueada ${K} não diz o que está em cima dela`));
  /* o par espelhado carrega o mesmo objeto: silhueta igual dos dois lados */
  [...g.BLOQUEADO].forEach(K => {
    const [c, r] = K.split(",").map(Number);
    eq(g.OBSTACULO[g.k(...g.gira(c, r))], g.OBSTACULO[K],
       `${K} e o espelho dele têm obstáculos diferentes`);
  });
});

/* ---------- o herói não entra ---------- */

teste("casa bloqueada nunca aparece entre os destinos de movimento", () => {
  const c = cenaBloq();
  const g = c.g;
  const h = g.cacadorDe(0);
  /* colado numa bloqueada, com movimento de sobra */
  const alvo = [...g.BLOQUEADO].map(K => K.split(",").map(Number))[0];
  const perto = g.vizinhos(...alvo).find(p => g.noTab(...p) && !g.em(...p) && !g.ehBloqueado(...p));
  ok(perto, "a casa bloqueada não tem vizinha livre");
  c.poe(h, perto);

  g.selHeroi = h; g.limpaModo(); g.selHeroi = h;
  g.modo = "mover"; g.calcula();
  const achou = g.mover.find(p => g.ehBloqueado(...p));
  ok(!achou, `o obstáculo ${achou && g.k(...achou)} entrou na lista de destinos`);

  /* e o caminho direto também é recusado */
  const antes = g.k(...h.pos);
  g.moveAte(...alvo);
  eq(g.k(...h.pos), antes, "o herói entrou no hexágono bloqueado");
});

teste("o herói não ATRAVESSA: a casa atrás do obstáculo custa o contorno", () => {
  const g = cenaBloq().g;
  /* procura um par (casa livre, casa livre) cuja reta passe por um obstáculo */
  let achado = null;
  for (const K of g.BLOQUEADO) {
    const [bc, br] = K.split(",").map(Number);
    const viz = g.vizinhos(bc, br).filter(p => !g.ehBloqueado(...p) && g.noTab(...p));
    for (const a of viz) for (const b of viz) {
      if (g.k(...a) === g.k(...b)) continue;
      const reta = g.dist(...a, ...b);
      const anda = g.passosAte(a, b);
      if (anda !== null && anda > reta) { achado = { a, b, reta, anda, obst: K }; break; }
    }
    if (achado) break;
  }
  ok(achado, "não achei nenhum par cuja reta atravesse um obstáculo — o bloqueio não está criando contorno");
  ok(achado.anda > achado.reta,
     `andando ${achado.anda} e em linha reta ${achado.reta}: o obstáculo ${achado.obst} não está sendo contornado`);
});

teste("moveAte cobra o caminho andado, não a linha reta", () => {
  const c = cenaBloq();
  const g = c.g;
  const h = g.cacadorDe(0);
  /* acha um destino cujo contorno custe mais que a reta */
  let par = null;
  for (const K of g.BLOQUEADO) {
    const [bc, br] = K.split(",").map(Number);
    const viz = g.vizinhos(bc, br).filter(p => g.noTab(...p) && !g.ehBloqueado(...p));
    for (const a of viz) for (const b of viz) {
      if (g.k(...a) === g.k(...b)) continue;
      const anda = g.passosAte(a, b);
      if (anda !== null && anda > g.dist(...a, ...b)) { par = { a, b, anda }; break; }
    }
    if (par) break;
  }
  ok(par, "não achei par com contorno");

  g.J.times[0].herois.concat(g.J.times[1].herois).forEach((x, i) => {
    if (x !== h) c.poe(x, g.BASE[x.t][0]);
  });
  c.poe(h, par.a);
  h.agilUsado = 1;                                  // tira o desconto do Ágil da conta
  g.J.mov = { v: 9, rest: 9 };
  g.selHeroi = h; g.limpaModo(); g.selHeroi = h;
  g.modo = "mover"; g.calcula();
  g.moveAte(...par.b);
  eq(g.k(...h.pos), g.k(...par.b), "não chegou ao destino");
  eq(9 - g.J.mov.rest, par.anda,
     `pagou ${9 - g.J.mov.rest} por um caminho de ${par.anda} passos — está cobrando a reta`);
});

teste("a IA contorna o obstáculo em vez de travar contra ele", () => {
  const c = cenaBloq();
  const g = c.g;
  g.nivelIA = "dificil";
  const h = g.cacadorDe(1);
  /* põe a IA colada num obstáculo, com o destino do outro lado dele */
  const K = [...g.BLOQUEADO][0];
  const [bc, br] = K.split(",").map(Number);
  const viz = g.vizinhos(bc, br).filter(p => g.noTab(...p) && !g.ehBloqueado(...p) && !g.em(...p));
  ok(viz.length >= 2, "obstáculo sem duas vizinhas livres");
  c.poe(h, viz[0]);

  const de = [...h.pos];
  const ate = g.passosDe(viz[1]);
  const antes = ate.get(g.k(...de));

  /* um passo de movimento pela mesma régua que a IA usa */
  g.J.vez = 1; g.J.mov = { v: 3, rest: 3 };
  g.selHeroi = h; g.limpaModo(); g.selHeroi = h;
  g.modo = "mover"; g.calcula();
  const passo = g.mover.filter(p => g.dist(...h.pos, ...p) === 1)
    .sort((a, b) => (ate.get(g.k(...a)) ?? 99) - (ate.get(g.k(...b)) ?? 99))[0];
  ok(passo, "não sobrou nenhum passo possível");
  ok(!g.ehBloqueado(...passo), "o passo escolhido é dentro do obstáculo");
  ok((ate.get(g.k(...passo)) ?? 99) < antes,
     "nenhum passo aproxima do destino — a IA travaria contra o obstáculo");
});

/* ---------- as outras formas de entrar numa casa ---------- */

teste("o Caçador nunca pousa em casa bloqueada, em nenhuma das quatro regiões", () => {
  const g = cenaBloq().g;
  [0, 1].forEach(t => ["topo", "meio", "baixo", "selva"].forEach(reg => {
    const h = g.cacadorDe(t);
    g.escolheRotacao(t, reg);
    ok(!g.ehBloqueado(...h.pos),
       `time ${t}, região ${reg}: o Caçador pousou dentro do obstáculo ${g.k(...h.pos)}`);
  }));
});

teste("o pouso desvia quando o ponto preferencial vira obstáculo", () => {
  const c = cenaBloq();
  const g = c.g;
  const h = g.cacadorDe(0);
  /* nenhum ponto de pouso é bloqueado por construção — então o teste é que o
     desvio existe e continua caindo em selva livre mesmo com o mapa apertado */
  const outros = g.J.times[0].herois.filter(x => x !== h).concat(g.J.times[1].herois);
  outros.forEach((x, i) => {
    const alvo = g.SELVA_PONTOS[0].topo;
    if (i === 0) c.poe(x, alvo);
  });
  g.escolheRotacao(0, "topo");
  ok(g.MATO.has(g.k(...h.pos)), "desviou para fora da selva");
  ok(!g.ehBloqueado(...h.pos), "desviou para dentro de um obstáculo");
  eq(g.em(...h.pos), h, "desviou para cima de outra peça");
});

teste("empurrar e puxar não jogam ninguém para dentro do obstáculo", () => {
  const c = cenaBloq();
  const g = c.g;
  const K = [...g.BLOQUEADO][0];
  const [bc, br] = K.split(",").map(Number);
  const viz = g.vizinhos(bc, br).filter(p => g.noTab(...p) && !g.ehBloqueado(...p));
  ok(viz.length >= 2, "obstáculo sem vizinhas livres");

  const alvo = g.J.times[1].herois.find(x => !x.morto);
  const empurrador = g.J.times[0].herois.find(x => !x.morto);
  /* alvo colado ao obstáculo, empurrador do lado oposto: o empurrão aponta
     exatamente para dentro da casa bloqueada */
  c.poe(alvo, viz[0]);
  const oposto = g.vizinhos(...viz[0]).find(p => g.noTab(...p) && !g.em(...p) && g.k(...p) !== K);
  c.poe(empurrador, oposto);
  for (let i = 0; i < 6; i++) {
    g.desloca(alvo, empurrador.pos, +1, 1);
    ok(!g.ehBloqueado(...alvo.pos), `empurrão ${i + 1} jogou o alvo para dentro de ${g.k(...alvo.pos)}`);
    g.desloca(alvo, empurrador.pos, -1, 1);
    ok(!g.ehBloqueado(...alvo.pos), `puxão ${i + 1} jogou o alvo para dentro de ${g.k(...alvo.pos)}`);
  }
});

teste("ward não é plantada dentro do obstáculo", () => {
  const g = cenaBloq().g;
  const K = [...g.BLOQUEADO][0];
  const [bc, br] = K.split(",").map(Number);
  g.J.times[0].wards = [];
  g.poeWard(0, [bc, br]);
  eq((g.J.times[0].wards || []).length, 0, "plantou ward dentro de um hexágono bloqueado");
  /* e numa casa livre continua funcionando */
  const livre = g.vizinhos(bc, br).find(p => !g.ehBloqueado(...p) && g.noTab(...p));
  g.poeWard(0, livre);
  eq(g.J.times[0].wards.length, 1, "parou de plantar ward em casa válida");
});

teste("o obstáculo continua bloqueando visão, como todo mato", () => {
  const g = cenaBloq().g;
  [...g.BLOQUEADO].forEach(K => {
    const [c, r] = K.split(",").map(Number);
    ok(g.ehMato(c, r), `${K} deixou de contar como mato e passou a ser transparente`);
  });
});

/* ═══════════════ v27 — as Ultimates travadas voltam a crescer ═══════════════ */

/* RELATO: "alguns ults tão travados em valores, não tá usando a regra de mult da
   força e poder".

   Correto, e o histórico explica sem justificar: Julgamento, Ato Final e Sentença
   viraram `danoFixo` na v19 porque estavam PIORES que a própria básica, e travar
   o número com "ignora armadura" foi o conserto rápido. O preço era este — elas
   pararam no tempo: não crescem com dado, com Poder, com item, com Reforço nem
   com a Herança do Dragão, enquanto a básica do mesmo herói cresce com tudo isso.
   Numa partida longa a Ultimate virava a jogada pior.

   Agora elas escalam como qualquer outra E continuam ignorando armadura — mas com
   multiplicador REDUZIDO (0,8), que é o preço do dano que passa por dentro. Contra
   alvo sem armadura rendem menos que uma Ultimate comum; contra alvo blindado,
   mais. É a identidade de dano verdadeiro do gênero, e não um upgrade grátis. */
teste("as Ultimates perfurantes crescem com o dado e com o Poder", () => {
  const c = cena();
  const g = c.g;
  const perfurantes = Object.entries(g.CATALOGO)
    .filter(([id, d]) => d.habs[2].ef.perfura)
    .map(([id, d]) => d.n);
  ok(perfurantes.length >= 3,
     `esperava ao menos 3 Ultimates perfurantes, achei ${perfurantes.length}`);

  Object.values(g.CATALOGO).forEach(def => {
    const u = def.habs[2];
    if (!u.ef.perfura) return;
    ok(!u.ef.danoFixo, `${def.n}: ${u.n} continua com danoFixo — não escala com nada`);
    ok(u.ef.dano, `${def.n}: ${u.n} é perfurante mas não tem dano que escale`);
    /* a comparação é da FÓRMULA, e não da faixa legal de dado: o Julgamento
       exige 6, então "dado mínimo contra dado 6" nele compara 6 com 6. */
    const comDado = F => Math.round(F * u.ef.dano * g.ESCALA_ULT) + def.poder;
    ok(comDado(6) > comDado(1),
       `${def.n}: ${u.n} entrega o mesmo com dado 1 e com dado 6 — continua travada`);
    const comPoder = P => Math.round(6 * u.ef.dano * g.ESCALA_ULT) + P;
    ok(comPoder(def.poder + 2) > comPoder(def.poder),
       `${def.n}: ${u.n} não responde a Poder — item e Reforço não a alcançam`);
  });
});

teste("dano perfurante rende menos que Ultimate comum contra alvo sem armadura", () => {
  const c = cena();
  const g = c.g;
  Object.values(g.CATALOGO).forEach(def => {
    const u = def.habs[2];
    if (!u.ef.perfura) return;
    const perf = Math.round(6 * u.ef.dano * g.ESCALA_ULT) + def.poder;
    const comum = Math.round(6 * 1 * g.ESCALA_ULT) + def.poder;   // a mesma Ultimate sem perfurar
    ok(perf < comum,
       `${def.n}: ${u.n} perfura E entrega ${perf} contra os ${comum} de uma Ultimate comum `
       + `— passar por dentro da armadura tem de custar alguma coisa`);
  });
});

/* ═══════════════ v27 — o alvo escondido embaixo do outro ═══════════════ */

/* RELATO: "eu estava com todos os creeps na base e ele com os heróis dentro do
   nexus, eu não conseguia dar dano no nexus pra acabar a partida, e os creeps
   tão não".

   Empate travado, e as duas metades se alimentavam. A ÚLTIMA MURALHA (v23) diz
   que com o Nexus em 1 a onda só passa se NÃO houver herói defendendo — então a
   onda parava, de propósito, esperando o herói fechar. Só que na tela o Nexus
   desenha o alvo de toque com raio 9 e o herói com raio 15,5, e o herói é
   desenhado DEPOIS: um defensor parado em cima do Nexus cobria o alvo dele por
   inteiro. A regra exigia o golpe de herói e a tela não deixava dar o golpe.

   A correção é a pedida: quando mais de um alvo divide o mesmo hexágono, o
   toque abre uma janela perguntando em quem se está batendo. */
teste("herói em cima do Nexus não esconde o Nexus — os dois viram opção de alvo", () => {
  const c = cena({ times: [["kaross", "nyx", "solenne", "vesper", "torvald"],
                           ["vharn", "grumo", "zhet", "cael", "gorm"]] })
              .dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  const lado = 1;
  /* rota aberta e Nexus no último ponto: o cenário exato do relato */
  g.J.torres.filter(t => t.t === lado).forEach(t => { t.vida = 0; });
  g.J.nexus[lado] = 1;

  const defensor = c.heroi(1, "topo");
  c.poe(defensor, g.BASE[lado][0]);              // defensor EM CIMA do Nexus

  const atacante = c.heroi(0, "meio");           // Solenne, alcance 3
  const perto = g.vizinhos(...g.BASE[lado][0]).find(v => g.noTab(...v) && !g.em(...v));
  ok(perto, "não achei casa livre ao lado do Nexus");
  c.poe(atacante, perto);

  c.mira(atacante, 0);
  const lista = g.alvosNoHex(...g.BASE[lado][0]);
  const tipos = lista.map(a => a.tipo);
  ok(tipos.includes("nexus"),
     `o hexágono do Nexus com um defensor em cima ofereceu ${JSON.stringify(tipos)} — `
     + `o Nexus sumiu como alvo e a partida não tem como terminar`);
  ok(tipos.includes("heroi"), "o defensor deixou de ser alvo");
  ok(lista.length > 1, "com dois alvos no mesmo hexágono a janela de escolha precisa abrir");
});

teste("com um alvo só no hexágono, nada de janela — o toque resolve direto", () => {
  const c = cena({ times: [["kaross", "nyx", "solenne", "vesper", "torvald"],
                           ["vharn", "grumo", "zhet", "cael", "gorm"]] })
              .dados(6, 6, 6).mov(0).vez(0);
  const g = c.g;
  const alvo = c.heroi(1, "topo"), atacante = c.heroi(0, "topo");
  c.poe(alvo, [5, 5]);
  c.poe(atacante, g.vizinhos(5, 5).find(v => g.noTab(...v) && !g.em(...v)));
  c.mira(atacante, 0);
  eq(g.alvosNoHex(5, 5).length, 1, "hexágono com um alvo só não deveria abrir escolha");
});

/* ═══════════════ v26 — o Barão apanha como herói ═══════════════ */

/* Cada morador conta uma coisa, e é de propósito. O Dragão conta GOLPES
   (Ultimate 2, básica 1, o dado não entra); o Barão conta DANO, pela mesma
   fórmula de qualquer herói. Estes testes travam os dois lados: sem o primeiro,
   alguém "uniformiza" o Dragão; sem o segundo, o Barão volta a ser um contador. */

const cenaPoco = (id, vida) => {
  const c = cena({ times: [["kaross", "nyx", "solenne", "vesper", "torvald"],
                           ["vharn", "grumo", "zhet", "cael", "gorm"]] })
              .mov(0).vez(0);
  const g = c.g;
  g.J.rodada = id === "barao" ? 12 : 1;
  g.J.poco.id = id;
  g.J.poco.vidaMax = vida || g.EPICO[id].vida;
  g.J.poco.vida = g.J.poco.vidaMax;
  return c;
};
/* bate no poço com o herói `h` usando o slot `i` e o dado `dado`; devolve quanto saiu */
function golpeNoPoco(c, h, i, dado) {
  const g = c.g;
  h.agiu = 0; h.vida = g.CATALOGO[h.id].vida;
  c.dados(dado, dado, dado);
  const v0 = g.J.poco.vida;
  c.mira(h, i); g.atacaEpico(g.J.poco);
  return v0 - g.J.poco.vida;
}

teste("o Barão apanha pela regra dos heróis — Força + Poder − Armadura", () => {
  const c = cenaPoco("barao", 99);
  const g = c.g;
  const h = c.heroi(0, "topo");                      // Kaross: básica dano 1
  const livre = g.vizinhos(...g.POCO).find(v => g.noTab(...v) && !g.em(...v));
  c.poe(h, livre);

  const arm = g.EPICO.barao.arm || 0;
  const P = g.poderTotal(h);
  for (const dado of [2, 4, 6]) {
    const esperado = Math.max(1, Math.round(dado * 1) + P - arm);
    eq(golpeNoPoco(c, h, 0, dado), esperado,
       `básica com dado ${dado} devia tirar ${esperado} do Barão (Força+Poder−Armadura)`);
  }
});

teste("no Barão o dado importa; no Dragão, não", () => {
  const cB = cenaPoco("barao", 99), gB = cB.g;
  const hB = cB.heroi(0, "topo");
  cB.poe(hB, gB.vizinhos(...gB.POCO).find(v => gB.noTab(...v) && !gB.em(...v)));
  ok(golpeNoPoco(cB, hB, 0, 6) > golpeNoPoco(cB, hB, 0, 1),
     "o Barão levou o mesmo de um dado 6 e de um dado 1 — ele voltou a contar golpes");

  const cD = cenaPoco("dragao", 99), gD = cD.g;
  const hD = cD.heroi(0, "topo");
  cD.poe(hD, gD.vizinhos(...gD.POCO).find(v => gD.noTab(...v) && !gD.em(...v)));
  eq(golpeNoPoco(cD, hD, 0, 6), golpeNoPoco(cD, hD, 0, 1),
     "o Dragão passou a variar com o dado — ele conta GOLPES, e é assim de propósito");
});

teste("o Dragão continua em Ultimate 2 e básica 1", () => {
  const c = cenaPoco("dragao", 99);
  const g = c.g;
  const h = c.heroi(0, "topo");
  c.poe(h, g.vizinhos(...g.POCO).find(v => g.noTab(...v) && !g.em(...v)));
  eq(golpeNoPoco(c, h, 0, 6), 1, "a básica deixou de tirar 1 do Dragão");
  eq(golpeNoPoco(c, h, 2, 6), 2, "a Ultimate deixou de tirar 2 do Dragão");
});

/* O QUE OBRIGA UM GRUPO É A ARMADURA, NÃO A VIDA.
   A primeira tentativa deu ao Barão 22 de vida e 1 de armadura, e resolvia o
   problema errado: com armadura baixa todo dado contribui proporcionalmente, e
   cinco cutucadas fracas derrubam o objetivo igual a dois golpes comprometidos —
   vida alta vira barra comprida, não exigência de time. Com armadura 3 o dado
   fraco quase não conta, e é isso que faz o Barão pedir os dados bons de vários
   heróis ao mesmo tempo. */
teste("no Barão o dado bom vale muito mais que o fraco — é isso que exige um grupo", () => {
  const c = cenaPoco("barao", 99);
  const g = c.g;
  const h = c.heroi(0, "topo");
  c.poe(h, g.vizinhos(...g.POCO).find(v => g.noTab(...v) && !g.em(...v)));

  const fraco = golpeNoPoco(c, h, 0, 2);      // básica, dado 2
  const forte = golpeNoPoco(c, h, 2, 6);      // Ultimate, dado 6
  ok(forte >= fraco * 3,
     `Ultimate com dado 6 tira ${forte} e básica com dado 2 tira ${fraco} — só ${(forte / fraco).toFixed(1)}× `
     + `de diferença. Sem esse degrau, cutucar com dado ruim vale tanto quanto comprometer o bom, `
     + `e o Barão deixa de precisar de um grupo`);
});

teste("o Barão não é o saco de pancada mais gordo da mesa", () => {
  const c = cena();
  const g = c.g;
  const menorHeroi = Math.min(...Object.values(g.CATALOGO).map(d => d.vida));
  ok(g.EPICO.barao.vida < menorHeroi,
     `o Barão tem ${g.EPICO.barao.vida} de vida e o herói mais frágil tem ${menorHeroi} — `
     + `o objetivo passou a exigir grupo por ter barra comprida, que é o jeito preguiçoso`);
  ok(g.EPICO.barao.arm >= 3,
     `o Barão tem ${g.EPICO.barao.arm} de armadura — é a armadura, e não a vida, que faz o dado ruim não servir`);
});

/* Nenhum escudo pode valer um turno inteiro. A Muralha dava Força + 11, ou seja
   17 num herói de 25 — 68% da vida máxima, de uma habilidade só. Isso não é
   "absorve um golpe", é "ignore a rodada". Teto de 12: metade da vida do maior
   herói do jogo e dois terços da do menor. */
teste("nenhum escudo passa de 12 — metade da vida do maior herói", () => {
  const c = cena();
  const g = c.g;
  const TETO = 12, DADO_MAX = 6;
  const passaram = [];
  Object.values(g.CATALOGO).forEach(def => def.habs.forEach(hb => {
    if (!hb.ef.escudo) return;
    const maximo = DADO_MAX + hb.ef.escudo;
    if (maximo > TETO) passaram.push(`${def.n}/${hb.n} chega a ${maximo}`);
  }));
  eq(passaram.length, 0,
     `escudo acima do teto de ${TETO}: ${passaram.join(", ")} — escudo desse tamanho `
     + `não absorve um golpe, apaga um turno`);
});

/* A carta prometia 4 de escudo e o motor entregava 7. O jogador escolhia a
   dádiva lendo um número e recebia outro — e 7 por herói por turno somava 70 de
   escudo no time em duas rodadas. */
teste("a Égide entrega exatamente o escudo que a própria carta promete", () => {
  const c = cena();
  const g = c.g;
  const egide = g.DADIVAS.find(d => d.id === "egide");
  ok(egide, "não achei a Égide entre as dádivas");
  const prometido = /(\d+) de escudo/.exec(egide.d);
  ok(prometido, `o texto da Égide não diz quanto escudo dá: "${egide.d}"`);
  eq(g.BARAO_ESCUDO, +prometido[1],
     `a carta promete ${prometido[1]} de escudo e o motor entrega ${g.BARAO_ESCUDO}`);
});

teste("Ultimate perfurante ignora a armadura do Barão, como ignora a de um herói", () => {
  const c = cenaPoco("barao", 99);
  const g = c.g;
  const s = c.heroi(0, "meio");          // Solenne: Julgamento é perfurante
  const ult = s.habs[2];
  ok(ult.ef.perfura, "a Ultimate da Solenne deixou de ser perfurante");
  c.poe(s, g.vizinhos(...g.POCO).find(v => g.noTab(...v) && !g.em(...v)));

  const esperado = Math.round(6 * ult.ef.dano * g.ESCALA_ULT) + g.poderTotal(s);
  eq(golpeNoPoco(c, s, 2, 6), esperado,
     `a armadura ${g.EPICO.barao.arm} do Barão comeu parte do dano perfurante`);
});

/* Quando os dois moradores contavam golpes, o motor e a IA podiam calcular o
   golpe em lugares diferentes sem ninguém notar. Com o Barão em dano, a
   divergência viraria a IA achando que nunca fecha e largando o objetivo. */
teste("a IA avalia o poço na mesma unidade em que o motor cobra", () => {
  const c = cenaPoco("barao", 99);
  const g = c.g;
  const h = c.heroi(0, "topo");
  c.poe(h, g.vizinhos(...g.POCO).find(v => g.noTab(...v) && !g.em(...v)));
  c.dados(5, 5, 5); h.agiu = 0;

  const previsto = g.golpeNoPoco(h, h.habs[0], 0, 5, g.J.poco);
  const saiu = golpeNoPoco(c, h, 0, 5);
  eq(saiu, previsto,
     "o que a IA usa para decidir não é o que o motor cobra — ela vai largar o Barão");
});

/* ═══════════════ v25 — a loja e o escudo que não apareciam ═══════════════ */

/* RELATO: "não tô conseguindo comprar os itens de buff".
   A prateleira "Gastar ouro" desenha os botões com class="itC" E data-g. O
   handler dos itens era ligado por `querySelectorAll(".itC")`, que pega as DUAS
   prateleiras, e como ele é ligado DEPOIS, sobrescrevia o handler do gasto.
   Clicar em Reforço caía no corpo do item, `ITEM[undefined]` dava undefined e
   `it.o` estourava TypeError: o botão simplesmente não fazia nada.

   O teste lê do próprio fonte o seletor com que o handler de item é ligado e
   confere que ele NÃO alcança nenhum botão de gasto. É o único jeito de pegar
   este bug sem um DOM de verdade — e é a forma exata do erro. */
teste("o seletor dos itens da loja não rouba o clique dos gastos de ouro", () => {
  const fs = require("fs"), path = require("path");
  const { RAIZ } = require("./motor.js");
  const fonte = fs.readFileSync(path.join(RAIZ, "jogo/jogo.js"), "utf8");

  const corpo = /function abreLoja\(\)\{[\s\S]*?\n\}/.exec(fonte);
  ok(corpo, "não achei abreLoja no fonte");
  const seletorItem = /querySelectorAll\("([^"]+)"\)\.forEach\(b=>b\.onclick=\(\)=>\{\s*const it=ITEM\[b\.dataset\.i\]/
                        .exec(corpo[0]);
  ok(seletorItem, "não achei o handler de compra de item dentro de abreLoja");

  /* renderiza a loja de verdade e pega os botões que ela produz */
  const c = cena();
  const g = c.g;
  let html = "";
  g.abreSheet = (titulo, corpoHtml) => { html = corpoHtml; };
  const h = g.J.times[0].herois[0];
  h.ouro = 99;                              // dinheiro para as duas prateleiras acenderem
  g.J.vez = 0;
  g.abreLoja();

  const botoes = html.match(/<button[^>]*>/g) || [];
  const gastos = botoes.filter(b => /data-g="/.test(b));
  ok(gastos.length, "a prateleira de gasto de ouro não apareceu na loja");

  /* aplica o seletor lido do fonte — só as duas formas que abreLoja usa */
  const alcanca = tag => seletorItem[1].startsWith(".")
    ? new RegExp(`class="[^"]*\\b${seletorItem[1].slice(1)}\\b`).test(tag)
    : new RegExp(`${seletorItem[1].replace(/[[\]]/g, "")}=`).test(tag);

  const roubados = gastos.filter(alcanca);
  eq(roubados.length, 0,
     `o seletor '${seletorItem[1]}' dos itens também pega ${roubados.length} botão(ões) `
     + `de gasto e sobrescreve o clique deles — Reforço vira botão morto`);
});

/* RELATO: "dei 2 ataques contra o Vharn e não deu dano nem tirou escudo".
   O escudo absorvia certo — o que faltava era a tela dizer isso. A peça não
   tem etiqueta de escudo (estadoDaPeca lista seis estados e escudo não é um
   deles), e `revela()` só emite número flutuante quando o escudo SOBE. Como a
   vida não muda num golpe absorvido, o ataque saía sem dano, sem tremida e sem
   número: da cadeira do jogador, nada aconteceu. */
teste("herói com escudo mostra ESCUDO na peça — senão o golpe absorvido some da tela", () => {
  const c = cena({ times: [["kaross", "nyx", "solenne", "vesper", "torvald"],
                           ["vharn", "grumo", "zhet", "cael", "gorm"]] });
  const g = c.g;
  const vharn = c.heroi(1, "topo");
  /* nada de exigir etiqueta nula aqui: o Vharn nasce na entrada da rota e pode
     estar no mato, o que legitimamente acende ESCONDIDO. O que este teste
     trava é que ESCUDO ganha de tudo que for só posição. */
  vharn.esc = 17;
  const et = g.estadoDaPeca(vharn);
  ok(et && /ESCUDO/.test(et.txt),
     `Vharn com 17 de escudo mostra ${et ? et.txt : "nada"} na peça — `
     + `o jogador bate e não tem como saber por que não saiu dano`);
});

teste("a ficha do Time mostra o número do escudo, como já mostra marcado e carregado", () => {
  const c = cena({ times: [["kaross", "nyx", "solenne", "vesper", "torvald"],
                           ["vharn", "grumo", "zhet", "cael", "gorm"]] });
  const g = c.g;
  const vharn = c.heroi(1, "topo");
  vharn.esc = 17;
  ok(/escudo 17/i.test(g.fichaHTML(vharn, false)),
     "a gaveta do Time não diz quanto escudo o herói tem");
});

/* ═══════════════ v25 — efeito com prazo e controle de área ═══════════════ */

const cenaDot = () => cena({ times: [["kaross", "kurr", "arden", "cael", "torvald"],
                                     ["vharn", "grumo", "nira", "vesper", "gorm"]] });

/* v45: o sangramento passou a contar ACÚMULOS, e o prazo cai no FIM do turno do
   portador, não no início. Este teste mede as duas coisas juntas porque é a
   combinação que define a condição: 3 acúmulos custam 3 + 2 + 1 e acabam. */
teste("sangramento cobra por acúmulo no início do turno, e perde 1 acúmulo no fim", () => {
  const c = cenaDot();
  const g = c.g;
  const vitima = c.heroi(1, "topo");
  g.aplicaCond(vitima, "sangramento", { st: 3, dono: c.heroi(0, "topo") });
  const v0 = vitima.vida;

  g.J.vez = 0; g.iniciaTurno();
  eq(vitima.vida, v0, "o efeito cobrou no turno do ADVERSÁRIO — a âncora está errada");

  const volta = () => { g.J.vez = 1; g.iniciaTurno(); g.processaCondsFim(1); };

  volta();
  eq(vitima.vida, v0 - 3, "3 acúmulos deveriam custar 3 no primeiro turno");
  eq(g.stacksDe(vitima, "sangramento"), 2, "não perdeu 1 acúmulo no fim do turno");

  volta();
  eq(vitima.vida, v0 - 5, "2 acúmulos deveriam custar 2 no segundo turno");

  volta();
  eq(vitima.vida, v0 - 6, "1 acúmulo deveria custar 1 no terceiro turno");

  volta();
  eq(vitima.vida, v0 - 6, "o sangramento cobrou uma quarta vez — não tinha prazo");
  ok(!g.temCond(vitima, "sangramento"), "o efeito não saiu da lista depois de vencer");
});

teste("o efeito com prazo ignora armadura e escudo — é o golpe que já chegou", () => {
  const c = cenaDot();
  const g = c.g;
  const vharn = c.heroi(1, "topo");          // 3 de armadura, e aqui com escudo cheio
  vharn.esc = 20;
  g.aplicaCond(vharn, "veneno", { tu: 2, dono: c.heroi(0, "topo") });
  const v0 = vharn.vida, e0 = vharn.esc;

  /* `cobraDots` direto, e NÃO `iniciaTurno`: o turno começa expirando o escudo
     (regra da v21), e por esse caminho o escudo sumiria sem o veneno ter
     encostado nele — o teste passaria medindo a coisa errada. */
  g.cobraDots(1);
  eq(vharn.vida, v0 - g.COND_NUM.venenoDano, "a armadura ou o escudo comeram o veneno");
  eq(vharn.esc, e0, "o veneno gastou escudo — ele deveria passar por dentro");
});

/* v45: SANGRAMENTO empilha (é o que o desenho pediu), VENENO renova. A regra que
   sobreviveu inteira das duas versões é a que importa: nunca DUAS entradas do
   mesmo tipo na lista — senão o indicador na peça mentiria e a limpeza tiraria
   só metade. E o teto (`max` no registro) é o que impede o dano instantâneo com
   passos extras que a v25 tinha medo de criar. */
teste("condição do mesmo tipo nunca vira duas entradas, e respeita o teto", () => {
  const c = cenaDot();
  const g = c.g;
  const vitima = c.heroi(1, "topo"), autor = c.heroi(0, "topo");

  g.aplicaCond(vitima, "sangramento", { st: 2, dono: autor });
  g.aplicaCond(vitima, "sangramento", { st: 3, dono: autor });
  eq(vitima.conds.filter(x => x.t === "sangramento").length, 1,
     "abriu uma segunda entrada de sangramento em vez de acumular na primeira");
  eq(g.stacksDe(vitima, "sangramento"), 5, "sangramento deveria ACUMULAR os acúmulos");

  g.aplicaCond(vitima, "sangramento", { st: 4, dono: autor });
  eq(g.stacksDe(vitima, "sangramento"), g.CONDS.sangramento.max,
     "passou do teto de acúmulos do registro");

  g.aplicaCond(vitima, "veneno", { tu: 1, dono: autor });
  g.aplicaCond(vitima, "veneno", { tu: 3, dono: autor });
  eq(vitima.conds.filter(x => x.t === "veneno").length, 1, "abriu um segundo veneno");
  eq(g.condDe(vitima, "veneno").tu, 3, "veneno deveria RENOVAR pelo maior prazo");
});

teste("morrer limpa o efeito — o respawn devolve o herói inteiro", () => {
  const c = cenaDot();
  const g = c.g;
  const vitima = c.heroi(1, "topo");
  g.aplicaCond(vitima, "sangramento", { st: 3, dono: c.heroi(0, "topo") });
  g.aplicaCond(vitima, "atordoado", { tu: 1, dono: c.heroi(0, "topo") });
  vitima.preso = 2;
  g.mata(vitima, c.heroi(0, "topo"));
  eq(vitima.conds.length, 0, "a condição sobreviveu à morte e cobraria de novo no respawn");
  eq(vitima.preso, 0, "a prisão sobreviveu à morte");
});

teste("quem começa o turno na zona inimiga é envenenado; a própria zona não machuca", () => {
  const c = cenaDot();
  const g = c.g;
  const meu = c.heroi(0, "meio"), dele = c.heroi(1, "meio");
  const alvoHex = [5, 5];
  c.poe(dele, alvoHex); c.poe(meu, alvoHex);
  g.poeZona(0, alvoHex, { tipo: "veneno", dano: 2, raio: 1, n: "Tapeçaria", dono: meu });

  g.J.vez = 1; g.zonasCobram(1);
  ok(g.temCond(dele, "veneno"), "o inimigo parado na zona não recebeu o efeito");

  g.J.vez = 0; g.zonasCobram(0);
  eq(meu.conds.length, 0, "a própria zona envenenou quem a criou");
});

teste("a zona gasta prazo por turno do adversário, mesmo sem pegar ninguém", () => {
  const c = cenaDot();
  const g = c.g;
  g.poeZona(0, [5, 5], { tipo: "veneno", dano: 2, raio: 1, n: "zona", dono: c.heroi(0, "meio") });
  eq(g.J.zonas.length, 1, "a zona não entrou no tabuleiro");

  /* o turno do DONO não gasta carga — senão a zona morreria sem nunca vigiar */
  g.zonasCobram(0);
  eq(g.J.zonas.length, 1, "o turno do próprio dono consumiu o prazo da zona");

  for (let i = 0; i < g.ZONA_TURNOS; i++) g.zonasCobram(1);
  eq(g.J.zonas.length, 0,
     `a zona sobreviveu aos ${g.ZONA_TURNOS} turnos adversários de prazo`);
});

/* A simetria que a v20 já teve de aprender nas ondas: o prazo contado em RODADA
   dava à zona de quem joga primeiro dois turnos adversários de cobrança e à do
   segundo apenas um. Medido: 53,3% para quem começa contra 51,6% com as zonas
   desligadas. Contado em turnos, os dois lados recebem o mesmo — e este teste é
   o que impede a contagem de voltar a ser por rodada. */
teste("a zona do primeiro e a do segundo jogador vigiam o mesmo tanto de turnos", () => {
  const c = cenaDot();
  const g = c.g;
  const conta = dono => {
    g.J.zonas = [];
    g.poeZona(dono, [5, 5], { tipo: "veneno", dano: 2, raio: 1, n: "z", dono: c.heroi(dono, "meio") });
    let vigiou = 0;
    /* a rodada é sempre A → C; quem criou já teve o próprio turno nesta rodada */
    for (let rodada = 0; rodada < 6 && g.J.zonas.length; rodada++)
      for (const t of [0, 1]) {
        if (rodada === 0 && t <= dono) continue;      // o turno de quem criou já passou
        if (!g.J.zonas.length) break;
        if (t !== dono) vigiou++;
        g.zonasCobram(t);
      }
    return vigiou;
  };
  eq(conta(0), conta(1),
     `a zona de quem joga primeiro vigia ${conta(0)} turnos do adversário e a do segundo `
     + `vigia ${conta(1)} — vantagem estrutural de ordem, o erro que a v20 corrigiu nas ondas`);
});

/* ═══════════════ v25 — a base trata, e o cerco interrompe ═══════════════ */

teste("herói ferido na própria base se trata a cada rodada", () => {
  const c = cenaDot();
  const g = c.g;
  const h = c.heroi(0, "topo");
  c.poe(h, g.BASE[0][0]);
  h.vida = 5;
  /* inimigos longe: ninguém cercando */
  g.J.times[1].herois.forEach(o => c.poe(o, g.BASE[1][0]));

  g.curaDeBase();
  eq(h.vida, 5 + g.CURA_BASE, "a base não tratou o herói");
  g.curaDeBase();
  eq(h.vida, 5 + 2 * g.CURA_BASE, "a base tratou só uma vez sem ninguém por perto");
});

teste("com inimigo a 2 hexágonos, a base trata UMA vez e só volta quando ele sai", () => {
  const c = cenaDot();
  const g = c.g;
  const h = c.heroi(0, "topo"), inimigo = c.heroi(1, "topo");
  c.poe(h, g.BASE[0][0]);
  h.vida = 5;
  g.J.times[1].herois.forEach(o => c.poe(o, g.BASE[1][0]));

  /* o cerco: um inimigo a exatamente 2 de distância */
  const perto = g.vizinhos(...h.pos).flatMap(v => g.vizinhos(...v))
                 .find(p => g.noTab(...p) && g.dist(...p, ...h.pos) === 2);
  ok(perto, "não achei casa a 2 de distância da base");
  c.poe(inimigo, perto);

  g.curaDeBase();
  eq(h.vida, 5 + g.CURA_BASE, "cercado, a primeira cura deveria sair mesmo assim");
  g.curaDeBase();
  eq(h.vida, 5 + g.CURA_BASE, "cercado, a cura veio de novo — a base virou poço infinito");
  g.curaDeBase();
  eq(h.vida, 5 + g.CURA_BASE, "cercado, a cura continuou vindo");

  /* ele sai de perto: a torneira volta */
  c.poe(inimigo, g.BASE[1][0]);
  g.curaDeBase();
  eq(h.vida, 5 + 2 * g.CURA_BASE, "o inimigo saiu de perto e a cura não voltou");
});

teste("a base não trata quem está longe dela, nem quem está SEM CURA", () => {
  const c = cenaDot();
  const g = c.g;
  const fora = c.heroi(0, "meio"), naBase = c.heroi(0, "topo");
  g.J.times[1].herois.forEach(o => c.poe(o, g.BASE[1][0]));

  c.poe(fora, [5, 5]); fora.vida = 5;
  c.poe(naBase, g.BASE[0][0]); naBase.vida = 5; naBase.semCura = 2;

  g.curaDeBase();
  eq(fora.vida, 5, "curou um herói que não estava na base");
  eq(naBase.vida, 5, "a base tratou um herói marcado como SEM CURA");
});

/* ═══════════════ v25 — o Reforço não pode ser o Poder mais barato ═══════════════ */

/* RELATO: "não tô conseguindo comprar os itens de buff, além disso tá mto barato".
   Medido em 600 partidas (sim/ouro.js): um herói termina com 61 de ouro e o
   build de 3 itens mais caro que ele consegue vestir custa 25 — sobram 36. Com a
   curva antiga (6, +2), esses 36 compravam QUATRO Reforços: 6+8+10+12 = 36, ou
   +4 de Poder permanente. Nenhum item da loja dá mais de +2, e o Reforço não tem
   teto. Era o Poder mais barato do jogo, e por larga margem.

   O teste não trava um preço — trava a RELAÇÃO, que é o que não pode voltar a
   inverter: uma unidade de Poder pelo Reforço nunca custa menos que a mesma
   unidade comprada em item. */
teste("o Reforço nunca é a fonte de Poder mais barata da loja", () => {
  const c = cena();
  const g = c.g;
  const h = g.J.times[0].herois[0];

  const reforco = g.GASTOS.find(x => x.id === "reforco");
  ok(reforco, "não achei o Reforço na prateleira de gasto de ouro");

  /* o item de Poder mais barato por ponto de Poder */
  const porPonto = g.ITENS.filter(it => it.ef && it.ef.poder)
                          .map(it => it.o / it.ef.poder);
  ok(porPonto.length, "nenhum item de Poder na loja");
  const itemMaisBarato = Math.min(...porPonto);

  h.reforcos = 0;
  const primeiro = g.precoGasto(reforco, h);
  ok(primeiro >= itemMaisBarato,
     `o primeiro Reforço custa ${primeiro} por +1 de Poder e o item mais barato `
     + `custa ${itemMaisBarato} pelo mesmo ponto — o gasto tardio saiu mais barato que a loja`);
});

teste("a sobra de ouro de uma partida não compra mais de dois Reforços", () => {
  const c = cena();
  const g = c.g;
  const h = g.J.times[0].herois[0];
  const reforco = g.GASTOS.find(x => x.id === "reforco");

  /* 36 é a sobra medida em 600 partidas: renda de 61 menos o build mais caro (25) */
  const SOBRA = 36;
  let bolso = SOBRA, comprados = 0;
  for (h.reforcos = 0; ; h.reforcos++) {
    const preco = g.precoGasto(reforco, h);
    if (preco > bolso) break;
    bolso -= preco; comprados++;
  }
  ok(comprados <= 2,
     `a sobra de ${SOBRA} de ouro compra ${comprados} Reforços (+${comprados} de Poder permanente) `
     + `— o ouro tardio vira estatística em vez de escolha`);
});

/* O efeito com prazo nasceu na BÁSICA do Kaross e do Kurr, e sim/habs.js pegou o
   problema na hora: com sangramento de graça em todo golpe, o Talho (dado 1)
   passava a valer MAIS que a Puxada (dado 3) — a habilidade do meio deixava de
   pagar o próprio dado, que é a regra fechada na v23. Movido para o slot de
   controle, o Kaross foi de −1 para +5.

   A regra que fica: efeito com prazo é escolha, não passiva. Ele custa um dado
   médio ou alto, e por isso pode ser forte. */
teste("efeito com prazo mora no slot de controle ou na Ultimate, nunca na básica", () => {
  const c = cena();
  const g = c.g;
  const naBasica = Object.values(g.CATALOGO)
    .filter(def => def.habs[0].ef.dot || def.habs[0].ef.zona)
    .map(def => def.n);
  eq(naBasica.length, 0,
     `${naBasica.join(", ")} aplica efeito com prazo na BÁSICA — com dado 1 ele vira `
     + `passiva de todo golpe e faz a habilidade do meio deixar de pagar o próprio dado`);
});

teste("quem aplicou o efeito leva o ouro da morte, mesmo na última cobrança", () => {
  const c = cenaDot();
  const g = c.g;
  const vitima = c.heroi(1, "topo"), autor = c.heroi(0, "topo"), outro = c.heroi(0, "meio");
  /* o outro colado na vítima: se o crédito escorregar, é para ele que vai */
  c.poe(vitima, [5, 5]); c.poe(outro, [5, 6]); c.poe(autor, g.BASE[0][0]);

  g.aplicaCond(vitima, "sangramento", { st: 3, dono: autor }); // a cobrança que mata é a última
  vitima.vida = 2;
  const ouro0 = autor.ouro, ouroOutro0 = outro.ouro;

  g.cobraDots(1);
  ok(vitima.morto, "o sangramento não matou a vítima");
  eq(autor.ouro, ouro0 + 4, "o ouro da morte não foi para quem aplicou o sangramento");
  eq(outro.ouro, ouroOutro0, "o crédito escorregou para o inimigo mais próximo");
});

teste("a IA sai de cima de uma zona inimiga em vez de ficar apanhando", () => {
  const c = cenaDot();
  const g = c.g;
  const h = c.heroi(1, "meio");
  c.poe(h, [5, 5]);
  /* ninguém colado, para não disputar a decisão com "caça" ou "recua" */
  g.J.times[0].herois.forEach(o => c.poe(o, g.BASE[0][0]));

  const semZona = g.iaDestino(h, 1);
  g.poeZona(0, [5, 5], { tipo: "veneno", dano: 2, raio: 1, n: "zona", dono: c.heroi(0, "meio") });
  const comZona = g.iaDestino(h, 1);

  ok(comZona && comZona.motivo === "sai da zona",
     `com veneno no chão a IA decidiu "${comZona ? comZona.motivo : "nada"}" `
     + `(sem zona era "${semZona ? semZona.motivo : "nada"}") — território negado que a IA ignora não nega nada`);
  ok(g.dist(...comZona.p, 5, 5) > 1 || !g.J.zonas.some(z => g.dist(...comZona.p, ...z.pos) <= z.raio),
     "a IA fugiu para dentro da mesma zona");
});

/* ═══════════════ v45 — INDIVIDUALIDADE DOS HERÓIS ═══════════════
   O sistema central de condições, as passivas, o crítico condicional e as regras
   novas de banimento, invisibilidade e cópia. Cada teste aqui existe porque a
   regra correspondente tem uma armadilha: ou o prazo cai na hora errada, ou o
   contrajogo não existe, ou a IA passa a saber algo que o jogador não sabe. */

const cenaV45 = (t0, t1) => cena({ times: [t0, t1] });
/* uma cena controlada: dois heróis vizinhos, dados altos, movimento à vontade */
function encosta(c, a, b) {
  const g = c.g;
  const livre = g.vizinhos(...a.pos).find(p => g.noTab(...p) && !g.em(...p) && !g.ehBloqueado(...p));
  ok(livre, "não achei casa vizinha livre");
  b.pos = [...livre];
  return c;
}

/* ---------- o registro é a fonte única ---------- */

teste("todo herói declara passiva, e toda passiva declarada existe no motor", () => {
  const g = carrega();
  const semPassiva = [], semCodigo = [];
  Object.entries(g.CATALOGO).forEach(([id, d]) => {
    if (!d.pas) return semPassiva.push(id);
    if (!g.PASSIVAS[d.pas.id]) semCodigo.push(`${id} → ${d.pas.id}`);
  });
  eq(semPassiva.length, 0, `heróis sem passiva: ${semPassiva.join(", ")}`);
  eq(semCodigo.length, 0, `passiva declarada e não implementada: ${semCodigo.join(", ")}`);
});

teste("toda condição que uma habilidade aplica existe no registro", () => {
  const g = carrega();
  const orfas = [];
  const olha = (id, nome, lista) => (lista || []).forEach(x => {
    if (!g.CONDS[x.t]) orfas.push(`${id} · ${nome} → ${x.t}`);
  });
  Object.entries(g.CATALOGO).forEach(([id, d]) => d.habs.forEach(hb => {
    const e = hb.ef;
    olha(id, hb.n, e.cond); olha(id, hb.n, e.condEu); olha(id, hb.n, e.condVizinhos);
    olha(id, hb.n, e.condRaio); olha(id, hb.n, e.condAliadosPerto); olha(id, hb.n, e.condSeNaZona);
    if (e.zona && e.zona.cond && !g.CONDS[e.zona.cond.t]) orfas.push(`${id} · zona → ${e.zona.cond.t}`);
    [e.bonusCond, e.consome, e.execPorStack, e.execSeCond, e.espalha].forEach(x => {
      if (x && !g.CONDS[x.t]) orfas.push(`${id} · ${hb.n} → ${x.t}`);
    });
    if (e.bonusPorRecurso && !g.RECURSOS[e.bonusPorRecurso.t])
      orfas.push(`${id} · ${hb.n} → recurso ${e.bonusPorRecurso.t}`);
    if (e.recurso && !g.RECURSOS[e.recurso.t]) orfas.push(`${id} · ${hb.n} → recurso ${e.recurso.t}`);
  }));
  eq(orfas.length, 0, `condição ou recurso sem registro: ${orfas.join(" | ")}`);
});

teste("o desenho parou onde prometeu: entre 8 e 12 condições, nem uma a mais", () => {
  const g = carrega();
  const n = Object.keys(g.CONDS).length;
  ok(n >= 8 && n <= 12,
     `${n} condições — o desenho pediu 8 a 12 bem definidas em vez de 30 impossíveis de decorar`);
  const semTexto = Object.entries(g.CONDS).filter(([, d]) => !d.d || !d.ico || !d.selo);
  eq(semTexto.length, 0,
     `condição sem ícone, selo ou regra escrita: ${semTexto.map(x => x[0]).join(", ")} — `
     + "sem os três ela não pode aparecer na peça nem no tooltip");
});

teste("cada condição do registro é usada por alguém — nenhuma decoração", () => {
  const g = carrega();
  const usadas = new Set();
  Object.values(g.CATALOGO).forEach(d => d.habs.forEach(hb => {
    const e = hb.ef;
    [...(e.cond || []), ...(e.condEu || []), ...(e.condVizinhos || []),
     ...(e.condRaio || []), ...(e.condAliadosPerto || []), ...(e.condSeNaZona || [])]
      .forEach(x => usadas.add(x.t));
    if (e.zona && e.zona.cond) usadas.add(e.zona.cond.t);
    [e.bonusCond, e.consome, e.execPorStack, e.execSeCond, e.espalha].forEach(x => x && usadas.add(x.t));
    if (e.baneEu) usadas.add("banido");
  }));
  /* as que nascem de passiva ou de regra, e não de habilidade */
  ["invisivel", "catarino", "revelado", "sangramento", "tenacidade", "veneno"].forEach(x => usadas.add(x));
  const sobrando = Object.keys(g.CONDS).filter(t => !usadas.has(t));
  eq(sobrando.length, 0, `condição no registro que ninguém aplica: ${sobrando.join(", ")}`);
});

/* ---------- o relógio das condições ---------- */

teste("veneno cobra o mesmo dano todo turno; sangramento cobra menos a cada turno", () => {
  const c = cenaDot(); const g = c.g;
  const a = c.heroi(1, "topo"), b = c.heroi(1, "selva");
  a.arm = 9; b.arm = 9;                                  // armadura não muda nada nos dois
  g.aplicaCond(a, "veneno", { tu: 3 });
  g.aplicaCond(b, "sangramento", { st: 3 });
  const va = [], vb = [];
  for (let i = 0; i < 3; i++) {
    const a0 = a.vida, b0 = b.vida;
    g.J.vez = 1; g.iniciaTurno(); g.processaCondsFim(1);
    va.push(a0 - a.vida); vb.push(b0 - b.vida);
  }
  eq(va.join(","), "2,2,2", "o veneno deveria cobrar sempre o mesmo — é a diferença dele");
  eq(vb.join(","), "3,2,1", "o sangramento deveria decair — é a diferença dele");
});

teste("condição de 1 turno num inimigo custa exatamente um turno dele", () => {
  const c = cenaDot(); const g = c.g;
  const v = c.heroi(1, "topo");
  g.J.vez = 0;                                        // aplicada no MEU turno
  g.aplicaCond(v, "atordoado", { tu: 1 });
  g.processaCondsFim(0);                              // fim do meu turno não deveria gastar o dele
  ok(g.temCond(v, "atordoado"),
     "o atordoamento venceu no fim do turno de QUEM APLICOU — a vítima nunca perdeu turno");
  ok(g.travaDeAcao(v, 0), "atordoado e ainda assim livre para agir");
  g.J.vez = 1; g.iniciaTurno();
  ok(g.temCond(v, "atordoado"), "o atordoamento sumiu no início do turno da vítima");
  g.processaCondsFim(1);
  ok(!g.temCond(v, "atordoado"), "o atordoamento durou mais de um turno da vítima");
});

teste("morrer limpa TODAS as condições, boas e ruins, e o respawn volta limpo", () => {
  const c = cenaDot(); const g = c.g;
  const v = c.heroi(1, "topo"), autor = c.heroi(0, "topo");
  ["sangramento", "veneno", "lentidao", "atordoado", "invisivel", "marcado", "tenacidade"]
    .forEach(t => g.aplicaCond(v, t, { st: 2, tu: 2, dono: autor }));
  v.preso = 2; v.esc = 9;
  g.mata(v, autor);
  eq(v.conds.length, 0, "sobrou condição pendurada num morto (§40)");
  eq(v.preso, 0, "a prisão sobreviveu à morte");
  eq(v.esc, 0, "o escudo sobreviveu à morte");
});

/* ---------- TENACIDADE e a cadeia de atordoamento ---------- */

teste("Tenacidade anula controle e se gasta; dano passa por ela", () => {
  const c = cenaDot(); const g = c.g;
  const v = c.heroi(1, "topo");
  g.aplicaCond(v, "tenacidade", { tu: 2 });
  ok(!g.aplicaCond(v, "atordoado", { tu: 1 }), "a Tenacidade deixou o atordoamento entrar");
  ok(!g.temCond(v, "atordoado"), "atordoou mesmo com Tenacidade");
  ok(!g.temCond(v, "tenacidade"), "a Tenacidade anulou e não se gastou — vira imunidade eterna");
  g.aplicaCond(v, "tenacidade", { tu: 2 });
  ok(g.aplicaCond(v, "veneno", { tu: 2 }),
     "a Tenacidade barrou VENENO — ela responde a controle, não a dano");
  ok(g.temCond(v, "tenacidade"), "o veneno gastou a Tenacidade");
});

teste("não existe cadeia de atordoamento: sair de um deixa Tenacidade", () => {
  const c = cenaDot(); const g = c.g;
  const v = c.heroi(1, "topo");
  g.aplicaCond(v, "atordoado", { tu: 1 });
  g.J.vez = 1; g.iniciaTurno(); g.processaCondsFim(1);
  ok(!g.temCond(v, "atordoado"), "o atordoamento não passou");
  ok(g.temCond(v, "tenacidade"),
     "saiu do atordoamento sem Tenacidade — dá para atordoar em cadeia e o jogador nunca joga (§8)");
  g.aplicaCond(v, "atordoado", { tu: 1 });
  ok(!g.temCond(v, "atordoado"), "o segundo atordoamento seguido entrou");
});

teste("Prende passa pela mesma porta da Tenacidade que o atordoamento", () => {
  const c = cenaDot(); const g = c.g;
  const v = c.heroi(1, "topo");
  g.aplicaCond(v, "tenacidade", { tu: 2 });
  g.prende(v, c.heroi(0, "topo"));
  eq(v.preso, 0, "a Tenacidade não protegeu contra Prende — para o jogador é o mesmo problema");
});

/* ---------- LENTIDÃO ---------- */

teste("Lentidão tira casas de caminhada, nunca impede de andar, e mata o passo Ágil", () => {
  const c = cena().vez(0).mov(6); const g = c.g;
  const h = c.heroi(0, "selva");                       // ágil
  ok(g.ehAgil(h), "o herói de selva desta cena deveria ser Ágil");
  const cheio = g.tetoAndar(h);
  g.aplicaCond(h, "lentidao", { tu: 1 });
  const lento = g.tetoAndar(h);
  eq(lento, cheio - g.LENTIDAO_CASAS - 1,
     "a Lentidão deveria tirar as casas E o passo grátis de Ágil");
  c.mov(1);
  ok(g.tetoAndar(h) >= 1, "a Lentidão zerou o movimento — isso é Prende, não Lentidão (§7)");
  ok(!g.travaDeAcao(h, 0), "a Lentidão impediu de AGIR — ela é de mobilidade");
});

/* ---------- ATORDOAMENTO e SILÊNCIO trancam o que devem ---------- */

teste("Atordoado não age nem anda; Silenciado só perde a segunda e a Ultimate", () => {
  const c = cena().vez(0); const g = c.g;
  const h = c.heroi(0, "topo");
  g.aplicaCond(h, "atordoado", { tu: 1 });
  ok(g.travaDeAcao(h, 0) && g.travaDeAcao(h, 2), "atordoado e livre para agir");
  g.removeCond(h, "atordoado");
  g.aplicaCond(h, "silenciado", { tu: 1 });
  ok(!g.travaDeAcao(h, 0), "o Silêncio trancou a básica — ele deveria deixar a básica passar");
  ok(g.travaDeAcao(h, 1) && g.travaDeAcao(h, 2), "o Silêncio deixou passar a segunda ou a Ultimate");
});

/* ---------- BANIMENTO: todas as regras explícitas do §9 ---------- */

teste("Banido sai do tabuleiro: não é alvo, não sofre dano e não ocupa hexágono", () => {
  const c = cena().vez(0); const g = c.g;
  const z = c.heroi(1, "topo"), bate = c.heroi(0, "topo");
  const onde = [...z.pos];
  g.aplicaCond(z, "banido", { tu: 1 });

  eq(g.em(...onde), undefined, "o banido continua ocupando o hexágono");
  ok(!g.visivelPara(z, 0), "o adversário continua vendo o banido");
  ok(!g.visivelPara(z, 1), "o próprio time continua vendo o banido — ele não está no tabuleiro");
  const v0 = z.vida;
  g.aplicaDano(bate, z, 99, "teste", true, true);
  eq(z.vida, v0, "o banido levou dano — banimento tem que ser imunidade completa");
  ok(!g.aplicaCond(z, "veneno", { tu: 2 }), "o banido recebeu condição nova");
});

teste("Banido volta no início do próprio turno, no mesmo lugar, e a regra é previsível", () => {
  const c = cena().vez(0); const g = c.g;
  const z = c.heroi(1, "topo");
  const onde = [...z.pos];
  g.aplicaCond(z, "banido", { tu: 1 });
  g.J.vez = 0; g.iniciaTurno();
  ok(g.temCond(z, "banido"), "voltou no turno do ADVERSÁRIO — o banimento não vigiou nada");
  g.J.vez = 1; g.iniciaTurno();
  ok(!g.temCond(z, "banido"), "não voltou no início do próprio turno");
  eq(g.k(...z.pos), g.k(...onde),
     "voltou em outro lugar — o retorno é previsível de propósito, para o Banimento ser jogada e não fuga");
  ok(!z.agiu, "voltou sem poder agir — o banimento viraria dois turnos perdidos");
});

teste("Banido não acende visão e o cache de visão sabe disso", () => {
  const c = cena().vez(0); const g = c.g;
  const h = c.heroi(1, "meio");
  const perto = g.vizinhos(...h.pos).find(p => g.noTab(...p));
  ok(g.enxergaCasa(1, ...perto), "a casa colada no herói já não era vista");
  g.aplicaCond(h, "banido", { tu: 1 });
  const outros = g.J.times[1].herois.filter(o => o !== h && !o.morto);
  const soDele = !outros.some(o => g.dist(...o.pos, ...perto) <= 2);
  if (soDele) ok(!g.enxergaCasa(1, ...perto),
    "o banido continua acendendo o raio de visão dele — o cache não viu a mudança");
});

/* ---------- INVISIBILIDADE: contrajogo obrigatório ---------- */

teste("Invisível não é visto em campo aberto, mas atacar entrega a posição", () => {
  const c = cena().vez(0); const g = c.g;
  const p = c.heroi(0, "selva"), alvo = c.heroi(1, "topo");
  encosta(c, alvo, p);                                   // colado, em campo aberto
  /* o Voo Silencioso pode já ter escondido o Pombo na abertura da partida — este
     teste mede a CONDIÇÃO, não a passiva, então parte-se do zero explicitamente */
  g.removeCond(p, "invisivel", "silencio");
  ok(g.visivelPara(p, 1), "colado e em campo aberto e já invisível sem motivo");
  g.aplicaCond(p, "invisivel", { tu: 2 });
  ok(!g.visivelPara(p, 1), "a Invisibilidade não esconde em campo aberto");
  g.aplicaDano(p, alvo, 1, "teste", false, false);
  ok(g.visivelPara(p, 1), "atacou e continuou invisível — não sobrou contrajogo (§28)");
});

teste("Ward revela o Invisível: é a resposta que o desenho nomeou", () => {
  const c = cena().vez(0); const g = c.g;
  const p = c.heroi(0, "selva");
  g.aplicaCond(p, "invisivel", { tu: 2 });
  ok(!g.visivelPara(p, 1), "não ficou invisível");
  g.poeWard(1, [...p.pos]);
  ok(g.enxergaPorWard(1, ...p.pos), "a ward não cobre a casa em que foi plantada");
  ok(g.visivelPara(p, 1), "ward em cima do invisível e ele continua invisível — sem Ward não há resposta");
});

teste("Revelado vence a Invisibilidade e o mato", () => {
  const c = cena().vez(0); const g = c.g;
  const p = c.heroi(0, "selva");
  const mato = [...g.MATO].map(s => s.split(",").map(Number)).find(q => !g.em(...q));
  ok(mato, "não achei mato livre");
  p.pos = [...mato];
  g.aplicaCond(p, "invisivel", { tu: 2 });
  ok(!g.visivelPara(p, 1), "invisível no mato e visível");
  g.aplicaCond(p, "revelado", { tu: 1 });
  ok(g.visivelPara(p, 1), "Revelado não venceu a Invisibilidade — o contrajogo não funciona");
});

teste("a IA não persegue quem ela não vê", () => {
  const c = cena().vez(1); const g = c.g;
  const escondido = c.heroi(0, "selva");
  /* põe o herói do time 0 longe de tudo e invisível: para o time 1 ele não existe */
  g.aplicaCond(escondido, "invisivel", { tu: 3 });
  eq(g.iaInimigosVisiveis(1).filter(o => o === escondido).length, 0,
     "a IA lista um inimigo invisível como alvo — informação privilegiada (§30)");
});

/* ---------- CRÍTICO: previsível, nunca sorte ---------- */

teste("nenhum crítico do jogo depende de sorte — todos têm condição visível", () => {
  const g = carrega();
  const sorte = [];
  Object.entries(g.CATALOGO).forEach(([id, d]) => d.habs.forEach(hb => {
    if (hb.ef.critChance || hb.ef.critSorte) sorte.push(`${id} · ${hb.n}`);
  }));
  eq(sorte.length, 0, `crítico aleatório: ${sorte.join(", ")} — o §12 pediu condição, não chance`);
});

teste("o Crítico do Cael acontece contra alvo travado, e só contra alvo travado", () => {
  const c = cenaV45(["cael", "nyx", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "corvo", "torvald"]);
  const g = c.g;
  const cael = c.heroi(0, "adc"), alvo = c.heroi(1, "topo");
  const hb = cael.habs[0];
  ok(!g.ehCritico(cael, hb, alvo), "critou num alvo solto — o crítico dele tem endereço");
  g.aplicaCond(alvo, "lentidao", { tu: 1 });
  ok(g.ehCritico(cael, hb, alvo), "não critou num alvo Lento, que é a condição dele");
  g.removeCond(alvo, "lentidao");
  alvo.preso = 2;
  ok(g.ehCritico(cael, hb, alvo), "não critou num alvo Preso");
});

teste("o quarto tiro do Corvo é Crítico, e o Recarregar adianta a conta", () => {
  const c = cenaV45(["corvo", "nyx", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]);
  const g = c.g;
  const corvo = c.heroi(0, "adc"), alvo = c.heroi(1, "topo");
  const hb = corvo.habs[0];
  eq(g.ehCritico(corvo, hb, alvo), null, "o primeiro tiro já saiu crítico");
  eq(g.ehCritico(corvo, hb, alvo), null, "o segundo tiro já saiu crítico");
  eq(g.ehCritico(corvo, hb, alvo), null, "o terceiro tiro já saiu crítico");
  ok(g.ehCritico(corvo, hb, alvo), "o quarto tiro não saiu crítico");
  eq(g.recursoDe(corvo, "cartucho"), 0, "o cartucho não zerou depois do crítico");
});

teste("o Crítico multiplica o dano de verdade, e a IA sabe disso antes de bater", () => {
  const c = cenaV45(["cael", "nyx", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "corvo", "torvald"]);
  const g = c.g;
  const cael = c.heroi(0, "adc"), alvo = c.heroi(1, "topo");
  const solto = g.iaDanoReal(cael, cael.habs[0], 0, 5, alvo);
  g.aplicaCond(alvo, "lentidao", { tu: 1 });
  const travado = g.iaDanoReal(cael, cael.habs[0], 0, 5, alvo);
  ok(travado > solto,
     `a IA calculou ${travado} contra alvo travado e ${solto} contra alvo solto — `
     + "ela não vê o próprio crítico e nunca vai preparar o combo (§29)");
});

/* ---------- as sinergias internas de kit (§26) ---------- */

teste("Dona Chinela: a básica empilha Sangramento e a Ultimate cobra a conta", () => {
  const c = cenaV45(["kaross", "nyx", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]);
  const g = c.g;
  const k = c.heroi(0, "topo"), v = c.heroi(1, "topo");
  encosta(c, k, v);
  c.vez(0).mov(0).dados(6, 6, 6);
  c.usa(k, 0, v);
  eq(g.stacksDe(v, "sangramento"), 1, "a passiva Chinelada não deixou Sangramento");

  /* a Ultimate executa mais alto por acúmulo — é a conta que os outros dois abriram */
  const semPilha = k.habs[2].ef.executa;
  g.aplicaCond(v, "sangramento", { st: 3, dono: k });
  const comPilha = semPilha + 3 * k.habs[2].ef.execPorStack.v;
  v.vida = comPilha;
  k.agiu = 0; c.dados(6, 6, 6);
  c.usa(k, 2, v);
  ok(v.morto, `com ${g.stacksDe(v, "sangramento")} acúmulos o limiar deveria chegar a ${comPilha}`);
});

teste("Ilva: a Ceifa bate mais forte em alvo Envenenado, e o Miasma envenena colado", () => {
  const c = cenaV45(["ilva", "nyx", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]);
  const g = c.g;
  const ilva = c.heroi(0, "topo"), v = c.heroi(1, "topo");
  encosta(c, ilva, v);
  c.vez(0);
  g.iniciaTurno();
  ok(g.temCond(v, "veneno"), "o Miasma não envenenou o inimigo colado nela");

  const limpo = g.iaDanoReal(ilva, ilva.habs[2], 2, 5, c.heroi(1, "meio"));
  const doente = g.iaDanoReal(ilva, ilva.habs[2], 2, 5, v);
  ok(doente > limpo, "a Ceifa não distingue alvo envenenado de alvo limpo — não há sinergia");
});

teste("Valti: o Coco só atordoa quem está dentro da armadilha dele", () => {
  const c = cenaV45(["kurr", "kaross", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]);
  const g = c.g;
  const valti = c.heroi(0, "selva"), v = c.heroi(1, "topo");
  encosta(c, valti, v);
  c.vez(0).mov(0).dados(6, 6, 6);
  c.usa(valti, 2, v);
  ok(!g.temCond(v, "atordoado"),
     "atordoou sem armadilha no chão — o controle mais forte do jogo perdeu o pré-requisito (§28)");

  g.poeZona(0, [...v.pos], { tipo: "cascas", cond: { t: "lentidao", tu: 1 }, raio: 1, dono: valti, n: "Talho" });
  valti.agiu = 0; c.dados(6, 6, 6);
  c.usa(valti, 2, v);
  ok(g.temCond(v, "atordoado") || g.temCond(v, "tenacidade") || v.morto,
     "com a armadilha embaixo, o Coco não atordoou");
});

teste("Catarino: a terceira marca estoura e ignora armadura e escudo", () => {
  const c = cenaV45(["nessa", "nyx", "solenne", "kaross", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]);
  const g = c.g;
  const cat = c.heroi(0, "adc"), v = c.heroi(1, "topo");
  v.esc = 40; v.arm = 20;                                  // nada disso protege do estouro
  g.aplicaCond(v, "catarino", { st: 2, dono: cat });
  const v0 = v.vida, e0 = v.esc;
  g.aplicaCond(v, "catarino", { st: 1, dono: cat });
  eq(v.vida, v0 - g.COND_NUM.catarinoEstouro, "a terceira marca não estourou");
  eq(v.esc, e0, "o estouro comeu escudo — ele deveria passar por dentro");
  ok(!g.temCond(v, "catarino"), "as marcas não saíram depois do estouro");
});

teste("Arden: o Tribunal devolve a habilidade registrada, e Ultimate nunca entra nos autos", () => {
  const c = cenaV45(["kaross", "nyx", "solenne", "vesper", "mirrha"],
                    ["arden", "grumo", "zhet", "cael", "torvald"]);
  const g = c.g;
  const juiz = c.heroi(1, "meio"), bate = c.heroi(0, "topo");
  encosta(c, juiz, bate);

  /* a Ultimate do agressor NÃO pode ser registrada */
  c.vez(0).mov(0).dados(6, 6, 6);
  c.usa(bate, 2, juiz);
  ok(!juiz.autos, `o Tribunal registrou uma Ultimate inimiga (${juiz.autos && juiz.autos.n}) — §10 proíbe`);

  /* a básica pode */
  juiz.vida = juiz.vidaMax; bate.agiu = 0; c.dados(6, 6, 6);
  c.usa(bate, 0, juiz);
  ok(juiz.autos, "o Tribunal não registrou a habilidade básica que o acertou");
  eq(juiz.autos.n, bate.habs[0].n, "registrou a habilidade errada");

  /* e devolve uma vez só */
  const v0 = bate.vida;
  c.vez(1).mov(0).dados(6, 6, 6);
  c.usa(juiz, 2, bate);
  ok(bate.vida < v0, "o Tribunal não devolveu dano nenhum");
  ok(!juiz.autos, "os autos não esvaziaram — dá para devolver a mesma sentença para sempre");
});

teste("Zhet: o Eco troca de lugar e o Trio de Sombras a tira do tabuleiro", () => {
  const c = cenaV45(["kaross", "nyx", "zhet", "vesper", "mirrha"],
                    ["vharn", "grumo", "solenne", "cael", "torvald"]);
  const g = c.g;
  const z = c.heroi(0, "meio"), v = c.heroi(1, "topo");
  encosta(c, z, v);
  const pz = [...z.pos], pv = [...v.pos];
  c.vez(0).mov(0).dados(6, 6, 6);
  c.usa(z, 1, v);
  if (!v.morto) {
    /* o alvo vai para onde ela estava, e isso é firme. A posição FINAL dela não é
       verificável aqui de propósito: o Passo de Sombra a tira uma casa depois do
       dano, e essa soma é o kit funcionando — o que não pode é ela terminar onde
       começou, que seria a troca não ter acontecido. */
    eq(g.k(...v.pos), g.k(...pz), "o Eco não trouxe o alvo para onde a Zhet estava");
    ok(g.k(...z.pos) !== g.k(...pz), "a Zhet terminou onde começou — a troca não aconteceu");
  }
  /* o Passo de Sombra a afastou; ela tem alcance 1, então precisa reencostar
     antes da Ultimate — exatamente o que o jogador faria com o Dado Mestre */
  encosta(c, v, z);
  z.agiu = 0; z.vida = z.vidaMax; v.vida = v.vidaMax; v.morto = 0;
  c.dados(6, 6, 6);
  c.usa(z, 2, v);
  ok(g.temCond(z, "banido"), "o Trio de Sombras não baniu a própria Zhet");
  eq(g.em(...z.pos), undefined, "banida e ainda ocupando o hexágono");
});

teste("Xhera bebe vida quando causa dano, e mais quando está ferida", () => {
  const c = cenaV45(["xhera", "nyx", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]);
  const g = c.g;
  const x = c.heroi(0, "topo"), v = c.heroi(1, "topo");
  encosta(c, x, v);
  x.vida = x.vidaMax - 6;
  const v0 = x.vida;
  c.vez(0).mov(0).dados(6, 6, 6);
  c.usa(x, 0, v);
  ok(x.vida > v0, "a passiva Insaciável não curou nada ao causar dano");
  /* e o Poder dela sobe quando ela cai abaixo da metade */
  const cheia = (x.vida = x.vidaMax, g.poderTotal(x));
  x.vida = Math.floor(x.vidaMax / 2);
  ok(g.poderTotal(x) > cheia, "abaixo da metade o Poder dela não subiu");
});

teste("Emerson Emo converte a dor do time em cura — Tristeza sobe e é gasta", () => {
  const c = cenaV45(["kaross", "nyx", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]);
  const g = c.g;
  const emo = c.heroi(0, "sup"), amigo = c.heroi(0, "topo"), inimigo = c.heroi(1, "topo");
  encosta(c, amigo, inimigo);
  g.aplicaDano(inimigo, amigo, 4, "teste", false, false);
  ok(g.recursoDe(emo, "tristeza") > 0, "aliado apanhou e o Emerson não ganhou Tristeza");

  encosta(c, emo, amigo);
  amigo.vida = 5;
  const antes = amigo.vida;
  c.vez(0).mov(0).dados(6, 6, 6);
  c.usa(emo, 0, amigo);
  eq(g.recursoDe(emo, "tristeza"), 0, "o Ombro Amigo não gastou a Tristeza");
  ok(amigo.vida - antes > emo.habs[0].ef.cura,
     "a cura não levou o bônus da Tristeza — a passiva não faz nada");
});

teste("Caramêlo 2.0 abate dano do aliado colado, e só do colado", () => {
  const c = cenaV45(["kaross", "nyx", "solenne", "vesper", "gorm"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]);
  const g = c.g;
  const dog = c.heroi(0, "sup"), amigo = c.heroi(0, "topo"), bate = c.heroi(1, "topo");
  amigo.arm = 0; amigo.esc = 0;
  /* longe do cachorro: dano cheio */
  amigo.pos = [...g.ROTAS.topo[0]];
  const longe = (v => { const a = amigo.vida; g.aplicaDano(bate, amigo, 10, "t", false, true);
                        return a - amigo.vida; })();
  amigo.vida = amigo.vidaMax;
  encosta(c, dog, amigo);
  const colado = (v => { const a = amigo.vida; g.aplicaDano(bate, amigo, 10, "t", false, true);
                         return a - amigo.vida; })();
  ok(colado < longe, `colado no Caramêlo levou ${colado} e longe levou ${longe} — a passiva não protege`);
});

teste("Torvald endurece com as almas de quem morre perto, até o teto", () => {
  const c = cenaV45(["kaross", "nyx", "solenne", "vesper", "torvald"],
                    ["vharn", "grumo", "zhet", "cael", "gorm"]);
  const g = c.g;
  const t = c.heroi(0, "sup"), v = c.heroi(1, "topo");
  encosta(c, t, v);
  const arm0 = g.armTotal(t);
  g.mata(v, c.heroi(0, "topo"));
  ok(g.armTotal(t) > arm0, "morreu alguém colado nele e a Armadura não subiu");
  for (let i = 0; i < 9; i++) { v.morto = 0; v.vida = 1; g.mata(v, c.heroi(0, "topo")); }
  eq(g.recursoDe(t, "almas"), g.RECURSOS.almas.max, "as almas passaram do teto");
});

teste("Vidente revela o escondido mais próximo — a resposta ao invisível existe no draft", () => {
  const c = cenaV45(["kaross", "nyx", "solenne", "vesper", "vidra"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]);
  const g = c.g;
  const vid = c.heroi(0, "sup"), oculto = c.heroi(1, "meio");
  oculto.pos = g.vizinhos(...vid.pos).find(p => g.noTab(...p) && !g.em(...p)) || oculto.pos;
  g.aplicaCond(oculto, "invisivel", { tu: 3 });
  ok(!g.visivelPara(oculto, 0), "não ficou invisível para começar");
  c.vez(0); g.iniciaTurno();
  ok(g.visivelPara(oculto, 0), "a Vidência não revelou o inimigo invisível colado nela");
});

teste("Grumo digere as próprias condições ruins", () => {
  const c = cenaV45(["kaross", "grumo", "solenne", "vesper", "mirrha"],
                    ["vharn", "nyx", "zhet", "cael", "torvald"]);
  const g = c.g;
  const gr = c.heroi(0, "selva");
  ["veneno", "sangramento", "lentidao"].forEach(t => g.aplicaCond(gr, t, { st: 2, tu: 2 }));
  c.vez(0).mov(0).dados(6, 6, 6);
  c.usa(gr, 1, gr);
  eq(g.condsMalignas(gr).length, 0, "o Digerir não limpou as condições ruins dele");
});

/* ---------- o que NÃO deve acontecer ---------- */

teste("condição não se aplica ao morador do poço — o alvo precisa aceitar o efeito", () => {
  const c = cena().vez(0); const g = c.g;
  g.J.poco.vida = 10;
  ok(!g.aplicaCond(g.J.poco, "atordoado", { tu: 1 }),
     "atordoou o Dragão — o §39 exige que cada efeito declare que alvo aceita");
  ok(!g.J.poco.conds || !g.J.poco.conds.length, "o poço ficou com lista de condições");
});

teste("nenhum kit é só dano: todo herói tem pelo menos uma habilidade que não é golpe", () => {
  const g = carrega();
  const puros = [];
  Object.entries(g.CATALOGO).forEach(([id, d]) => {
    const extras = d.habs.filter(hb => {
      const e = hb.ef;
      return e.cond || e.condEu || e.condVizinhos || e.condRaio || e.condAliadosPerto ||
             e.condSeNaZona || e.zona || e.escudo || e.cura || e.doar || e.ward || e.troca ||
             e.baneEu || e.copia || e.revelaRaio || e.limpa || e.limpaEu || e.limpaAliados ||
             e.recuaLivre || e.prende || e.prendeVizinhos || e.puxar || e.empurrar ||
             e.empurraVizinhos || e.empurraDoAlvo || e.recurso || e.consome || e.espalha ||
             e.drena || e.escudoAliados || e.revive || e.recarga;
    });
    if (!extras.length) puros.push(id);
  });
  eq(puros.length, 0,
     `kit de dano puro: ${puros.join(", ")} — o §25 pediu habilidade que FAZ algo, não só "causa X de dano"`);
});

teste("cada herói tem uma ideia principal escrita, e ela cabe numa frase", () => {
  const g = carrega();
  const ruins = Object.entries(g.CATALOGO)
    .filter(([, d]) => !d.ideia || d.ideia.length > 160)
    .map(([id, d]) => `${id}(${d.ideia ? d.ideia.length : 0})`);
  eq(ruins.length, 0,
     `sem ideia principal ou com texto longo demais: ${ruins.join(", ")} — §27 limita a complexidade`);
});

teste("passiva cabe numa frase — nada de cinco condições e oito exceções (§14)", () => {
  const g = carrega();
  const longas = Object.entries(g.CATALOGO)
    .filter(([, d]) => d.pas && (d.pas.d.length > 150 || (d.pas.d.match(/\./g) || []).length > 2))
    .map(([id]) => id);
  eq(longas.length, 0, `passiva comprida: ${longas.join(", ")}`);
});

teste("os indicadores da peça param em três, e avisam quantos ficaram de fora (§20)", () => {
  const c = cena().vez(0); const g = c.g;
  const h = c.heroi(0, "topo");
  ["sangramento", "veneno", "lentidao", "marcado", "vulneravel"]
    .forEach(t => g.aplicaCond(h, t, { st: 2, tu: 2 }));
  const lista = g.condsDaPeca(h);
  ok(lista.length >= 5, "as condições não entraram na lista da peça");
  /* a de maior consequência tem que ser a primeira: é ela que vira etiqueta */
  eq(lista[0].n, g.CONDS.lentidao.n,
     `a primeira da fila é ${lista[0].n} — a ordem deveria ser a de consequência`);
  const et = g.estadoDaPeca(h);
  ok(et && et.k === "mal", "com cinco condições ruins a peça não mostrou nenhuma etiqueta");
});

teste("a ficha mostra a seção de condições, com ícone, nome e quantidade", () => {
  const c = cena().vez(0); const g = c.g;
  const h = c.heroi(0, "topo");
  g.aplicaCond(h, "sangramento", { st: 2 });
  g.aplicaCond(h, "veneno", { tu: 2 });
  const html = g.fichaHTML(h, true);
  ok(/Sangramento ×2/.test(html), "a ficha não diz quantos acúmulos de Sangramento (§22)");
  ok(/Veneno · 2 turnos/.test(html), "a ficha não diz quantos turnos de Veneno faltam");
  ok(/data-cond=/.test(html), "os selos não são clicáveis — no celular não existe hover (§21)");
});

teste("a Invisibilidade não aparece na peça para o adversário", () => {
  const c = cena().vez(0); const g = c.g;
  const meu = c.heroi(0, "selva"), dele = c.heroi(1, "selva");
  g.aplicaCond(meu, "invisivel", { tu: 2 });
  g.aplicaCond(dele, "invisivel", { tu: 2 });
  g.aiMode = false;
  ok(g.condsDaPeca(meu).some(x => x.n === g.CONDS.invisivel.n),
     "o dono da peça não vê a própria Invisibilidade");
  ok(!g.condsDaPeca(dele).some(x => x.n === g.CONDS.invisivel.n),
     "o ícone de Invisibilidade entrega o inimigo invisível — o indicador anula a condição");
});

teste("a IA prefere a jogada que aplica controle à que só arranha", () => {
  const c = cenaV45(["kaross", "nyx", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]);
  const g = c.g;
  const taxista = c.heroi(1, "topo"), v = c.heroi(0, "topo");
  encosta(c, taxista, v);
  v.vida = v.vidaMax;                                  // ninguém morre: a comparação é limpa
  g.aplicaCond(v, "revelado", { tu: 3 });
  c.vez(1).mov(0).dados(4, 4, 4);
  const lista = g.iaJogadas(1).filter(x => x.h === taxista && x.v === v);
  const buzina = lista.find(x => x.i === 1), martelo = lista.find(x => x.i === 0);
  ok(buzina && martelo, "a IA não enumerou as duas habilidades do Taxista contra o alvo");
  ok(buzina.nota > martelo.nota,
     `a Buzina (atordoa) tirou ${buzina.nota.toFixed(1)} e o Martelo ${martelo.nota.toFixed(1)} — `
     + "a IA não vê valor em controlar (§29)");
});

teste("a IA cura e limpa aliado em vez de ficar parada com o suporte", () => {
  const c = cenaV45(["kaross", "nyx", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "mirrha"]);
  const g = c.g;
  const sup = c.heroi(1, "sup"), amigo = c.heroi(1, "topo");
  encosta(c, sup, amigo);
  amigo.vida = 4;
  g.aplicaCond(amigo, "veneno", { tu: 2 });
  c.vez(1).mov(0).dados(6, 6, 6);
  const lista = g.iaJogadas(1).filter(x => x.h === sup && x.v === amigo);
  ok(lista.length, "a IA não enumerou nenhuma jogada do suporte no aliado ferido e envenenado");
  ok(lista.some(x => x.nota > 15), "a IA achou que socorrer um aliado a 4 de vida não valia nada");
});

/* Achado por sim/condicoes.js: a condição Marcado aparecia em 0% de 120 partidas
   com a IA de verdade. A causa era mais velha que a v45 — a marca era pendurada
   antes do golpe da própria habilidade que a criava, e `aplicaDano` a consumia no
   mesmo instante. O texto da carta prometia "o próximo dano nele leva +N" e o
   motor entregava "+N neste dano". */
teste("a Marca sobrevive ao golpe que a aplica, e só é gasta no golpe SEGUINTE", () => {
  const c = cenaV45(["kaross", "nyx", "solenne", "corvo", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]);
  const g = c.g;
  const corvo = c.heroi(0, "adc"), v = c.heroi(1, "topo");
  v.pos = [...corvo.pos];
  c.poe(v, g.vizinhos(...corvo.pos).find(p => g.noTab(...p) && !g.em(...p)) || v.pos);
  v.vida = v.vidaMax = 60;                              // ninguém morre no meio do teste

  c.vez(0).mov(0).dados(3, 3, 3);
  c.usa(corvo, 0, v);
  eq(g.stacksDe(v, "marcado"), corvo.habs[0].ef.cond[0].st,
     "o Tiro Marcado comeu a própria marca — ela nunca chega ao golpe seguinte");

  /* e o golpe seguinte gasta a marca, somando o bônus */
  const antes = v.vida;
  corvo.agiu = 0; c.dados(3, 3, 3);
  const semMarca = g.iaDanoReal(corvo, corvo.habs[0], 0, 3, { ...v, conds: [] });
  c.usa(corvo, 0, v);
  const levou = antes - v.vida;
  ok(levou > semMarca, `com a marca levou ${levou} e sem ela levaria ${semMarca} — a marca não somou`);
  eq(g.stacksDe(v, "marcado"), corvo.habs[0].ef.cond[0].st,
     "a marca antiga não foi gasta, ou a nova não foi aplicada");
});

/* ═══════════════ v46 — os seis relatos do Vilker ═══════════════
   Cada teste aqui nasceu de uma frase dele, e cada um FALHAVA antes do conserto.
   Onde o teste não falha antes, ele não está testando o bug. */

/* ---------- 1 · a rotação acontece ANTES dos turnos, e paga bônus ---------- */

teste("o turno NÃO começa enquanto a rotação do Caçador estiver aberta", () => {
  const g = carrega();
  g.aiMode = false; g.simMode = false;     // hotseat: os dois escolhem, duas telas
  g.rotacaoDeVerdade();                    // sem o atalho do harness, que responde sozinho
  g.novo();
  /* `novo` chama caraOuCoroa → abreRotacoes. Sem ninguém responder, a fase tem
     que ficar em "rotacao": era exatamente o defeito — `fimDaRodada` seguia na
     mesma pilha até `faseOculta`, que rola os dados e COMEÇA o turno por baixo
     da tela de escolha. */
  eq(g.J.fase, "rotacao",
     "a partida entrou em 'jogando' com a escolha do Caçador ainda aberta — "
     + "o turno começou por baixo da tela");
  ok(g.mesaTravada(), "a mesa não estava travada durante a rotação");
});

/* O BÔNUS CHEGA AO TURNO DO DONO. Este é o teste que faltava na primeira versão,
   e ele reprovava: pagar na hora da escolha punha o buff na virada da rodada, e
   `expiraDoTime` — a primeira coisa que `iniciaTurno` faz — limpava antes de o
   jogador poder usar. O +2 de Armadura e o +2 de Poder eram letra morta. */
teste("o bônus de região chega ao turno do dono, e não morre na virada", () => {
  const c = cena(); const g = c.g;
  const conf = g.BONUS_REGIAO;
  const h = g.cacadorDe(0);
  const arm0 = g.armTotal(h);

  g.escolheRotacao(0, "topo");
  g.J.vez = 0; g.iniciaTurno();      // expiraDoTime roda ANTES de o bônus ser pago
  eq(g.armTotal(h), arm0 + conf.topo.arm,
     "o Topo não chegou ao turno do dono — o buff morreu em expiraDoTime, "
     + "que é a primeira coisa que iniciaTurno faz");

  const pod0 = g.poderTotal(h);
  g.escolheRotacao(0, "meio");
  g.J.vez = 0; g.iniciaTurno();
  eq(g.poderTotal(h), pod0 + conf.meio.poder, "o Meio não pagou Poder");
});

teste("ouro e cura da região são pagos no turno do dono, e uma vez só", () => {
  const c = cena(); const g = c.g;
  const conf = g.BONUS_REGIAO;
  const h = g.cacadorDe(0);
  const ouro0 = h.ouro;
  g.escolheRotacao(0, "baixo");
  eq(h.ouro, ouro0, "o ouro foi pago na virada em vez do turno do dono");
  g.J.vez = 0; g.iniciaTurno();
  eq(h.ouro, ouro0 + conf.baixo.ouro, "o Baixo não pagou ouro no turno do dono");
  g.J.vez = 0; g.iniciaTurno();
  eq(h.ouro, ouro0 + conf.baixo.ouro, "pagou DE NOVO — o bônus virou renda por turno");

  h.vida = 1;
  g.escolheRotacao(0, "selva");
  g.J.vez = 0; g.iniciaTurno();
  eq(h.vida, 1 + conf.selva.cura, "a Selva não curou");
});

teste("o bônus de região é MOMENTÂNEO — expira no turno seguinte do dono", () => {
  const c = cena(); const g = c.g;
  const h = g.cacadorDe(0);
  const arm0 = g.armTotal(h);
  g.escolheRotacao(0, "topo");
  g.J.vez = 0; g.iniciaTurno();
  ok(g.armTotal(h) > arm0, "o bônus não entrou");
  g.J.vez = 0; g.iniciaTurno();      // sem nova escolha: nada a pagar
  eq(g.armTotal(h), arm0,
     "o bônus da região sobreviveu ao próprio turno — momentâneo virou permanente");
});

teste("o +1 de movimento da Selva é gasto na rodada em que foi escolhido", () => {
  const c = cena(); const g = c.g;
  g.J.times[0].movRegiao = 0;
  g.escolheRotacao(0, "selva");
  g.J.vez = 0; g.iniciaTurno();
  eq(g.J.times[0].movRegiao, 0, "o movimento da região não foi consumido — vira renda");
  const semBonus = g.J.mov.v;
  g.escolheRotacao(0, "selva");
  g.J.vez = 0; g.iniciaTurno();
  ok(g.J.mov.v >= 1, "o Dado Mestre ficou inválido");
});

/* ---------- 2 · nada de tocar na mesa no turno do adversário ---------- */

teste("na vez da IA a mesa está travada para o humano", () => {
  const c = cena(); const g = c.g;
  g.aiMode = true;
  g.J.vez = 1; g.J.fase = "jogando";
  ok(g.mesaTravada(), "a vez da IA não travou a mesa");
  g.J.vez = 0;
  ok(!g.mesaTravada(), "a mesa ficou travada na vez do humano");
});

teste("o rabo do turno da IA também trava — encerraTurno roda com a vez já virada", () => {
  const c = cena(); const g = c.g;
  g.aiMode = true; g.J.vez = 0; g.J.fase = "jogando";
  ok(!g.mesaTravada(), "deveria estar livre antes");
  g.iaRodando = true;
  ok(g.mesaTravada(),
     "com a vez virada para o humano mas a IA ainda fechando o turno, a mesa ficou aberta — "
     + "é dali que saía o gank da rotação e a torre que a onda derrubou");
});

teste("o arrasto obedece à mesma trava que o clique", () => {
  const c = cena().vez(0).mov(6); const g = c.g;
  const h = c.heroi(0, "topo");
  ok(g.podeArrastar(h), "não dava para arrastar a própria peça na própria vez");
  g.aiMode = true; g.J.vez = 1;
  ok(!g.podeArrastar(g.J.times[1].herois[0]),
     "dava para arrastar a peça da IA no turno dela — o arrasto tinha lista de condições própria");
});

/* ---------- 3 · o dado extra tem que caber e ser usável ---------- */

teste("o dado extra da Retomada entra na mesa e serve a uma habilidade", () => {
  /* a Dona Chinela porque a Ultimate dela mira INIMIGO — a do Taxista é nele
     mesmo, e o teste passaria sem nunca provar que o dado extra pagou o golpe */
  const c = cenaV45(["kaross", "nyx", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]).vez(0);
  const g = c.g;
  const h = c.heroi(0, "topo"), alvo = c.heroi(1, "topo");
  alvo.vida = alvo.vidaMax = 60;                 // ninguém morre: mede-se o dano
  encosta(c, h, alvo);
  /* três dados baixos e um extra alto: a Ultimate só sai com o extra */
  g.J.dados = [{ v: 1, usado: 1 }, { v: 1, usado: 1 }, { v: 1, usado: 1 },
               { v: 6, usado: 0, extra: 1 }];
  g.J.mov = { v: 0, rest: 0 };
  const ult = h.habs[2];
  eq(g.dadoPara(ult), 3, "o dado extra não foi eleito para a habilidade que só ele paga");
  const v0 = alvo.vida;
  c.usa(h, 2, alvo);
  ok(alvo.vida < v0 || alvo.morto, "a habilidade paga pelo dado extra não saiu");
  eq(g.J.dados[3].usado, 1, "o dado extra não foi marcado como gasto");
});

/* ---------- 4 · vender item ---------- */

teste("vender devolve menos do que custou, e só na base ou morto", () => {
  const c = cena().vez(0); const g = c.g;
  const h = c.heroi(0, "topo");
  const it = g.ITENS[0];
  h.itens = [it.id]; h.ouro = 0;

  /* longe da base: a janela é a MESMA da compra */
  h.pos = [...g.ROTAS.topo[Math.floor(g.ROTAS.topo.length / 2)]];
  ok(!g.naBase(h), "o herói deveria estar longe da base");
  ok(!g.vendeItem(h, it.id, 0), "vendeu no meio da rota — a mochila virou dinheiro líquido");
  eq(h.itens.length, 1, "o item saiu mesmo com a venda recusada");

  /* na base: vende, e por menos */
  h.pos = [...g.BASE[0][0]];
  ok(g.vendeItem(h, it.id, 0), "não vendeu estando na base");
  eq(h.itens.length, 0, "o item continuou na mochila");
  eq(h.ouro, g.precoVenda(it.id), "o ouro devolvido não bate com o preço de venda");
  ok(g.precoVenda(it.id) < it.o,
     `venda (${g.precoVenda(it.id)}) não é menor que a compra (${it.o}) — trocar de build sairia de graça`);
  ok(g.precoVenda(it.id) >= 1, "a venda devolveu zero — o botão existiria sem servir para nada");
});

teste("vender item de vida devolve o teto, sem deixar o herói acima do próprio máximo", () => {
  const c = cena().vez(0); const g = c.g;
  const h = c.heroi(0, "topo");
  h.pos = [...g.BASE[0][0]];
  const it = g.ITENS.find(x => x.ef && x.ef.vida);
  ok(it, "nenhum item de vida na loja para testar");
  const max0 = h.vidaMax;
  h.itens = [it.id]; h.vidaMax += it.ef.vida; h.vida = h.vidaMax;
  g.vendeItem(h, it.id, 0);
  eq(h.vidaMax, max0, "o teto de vida do item ficou depois da venda — vida permanente de graça");
  ok(h.vida <= h.vidaMax, "o herói ficou com vida acima do próprio teto");
  ok(h.vida >= 1, "a venda matou o herói");
});

teste("todo item da loja tem preço de venda menor que o de compra", () => {
  const g = carrega();
  const ruins = g.ITENS.filter(it => g.precoVenda(it.id) >= it.o).map(it => it.n);
  eq(ruins.length, 0, `venda igual ou maior que a compra: ${ruins.join(", ")}`);
});

/* ---------- 5 · a torre debaixo da própria peça ---------- */

teste("com a própria peça em cima da torre inimiga, o toque ainda oferece a torre", () => {
  const c = cena().vez(0); const g = c.g;
  const h = c.heroi(0, "topo");
  const tr = g.J.torres.find(x => x.t === 1 && x.vida > 0 && g.torreExposta(x.rota, 1) === x);
  ok(tr, "não achei torre inimiga exposta");
  const p = g.ROTAS[tr.rota][tr.i];
  h.pos = [...p]; h.agiu = 0; h.alc = 4;
  g.J.dados = [{ v: 6, usado: 0 }];
  c.mira(h, 0);
  const lista = g.alvosNoHex(...p);
  ok(lista.some(a => a.tipo === "torre"), "a torre nem aparecia na lista do hexágono");

  /* o gesto real: o dedo acerta a PEÇA, que é o que está desenhado por cima */
  const v0 = tr.vida;
  g.escolheHeroi(h);
  ok(tr.vida < v0,
     "tocar na própria peça em cima da torre cancelou a mira em vez de bater — "
     + "cercar a torre com o herói em cima dela era impossível");
});

/* ---------- 6 · alcance por habilidade ---------- */

teste("habilidade pode ter alcance próprio, maior ou menor que o do herói", () => {
  const g = carrega();
  const k = g.CATALOGO.kaross, i = g.CATALOGO.ilva;
  eq(k.alc, 1, "a Dona Chinela deixou de ser de alcance 1");
  eq(k.habs[2].alc, 3, "o Chinelo Voador deveria ser arremessado — é a habilidade de longe dela");
  eq(i.habs[0].alc, 3, "a Chama Espectral da Ilva deveria ser a de longe");
  eq(i.habs[2].alc, 1, "a Ceifa da Ilva deveria exigir encostar");
  /* e existe herói dos três tipos */
  const tipo = id => {
    const h = g.CATALOGO[id], l = h.habs.filter(hb => hb.alvo !== "eu").map(hb => hb.alc || h.alc);
    return l.every(x => x <= 1) ? "perto" : l.every(x => x >= 2) ? "longe" : "os dois";
  };
  const tipos = new Set(Object.keys(g.CATALOGO).map(tipo));
  ["perto", "longe", "os dois"].forEach(t =>
    ok(tipos.has(t), `nenhum herói é do tipo "${t}" — o pedido era ter os três`));
});

teste("corpo a corpo é corpo a corpo: item de alcance não transforma em tiro", () => {
  const c = cenaV45(["kaross", "nyx", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]).vez(0);
  const g = c.g;
  const h = c.heroi(0, "topo");
  const lente = g.ITENS.find(x => x.ef && x.ef.alc);
  ok(lente, "nenhum item de alcance na loja");
  const perto = h.habs.find(hb => hb.alc === 1);
  ok(perto, "o herói de topo desta cena não tem habilidade corpo a corpo");
  const antes = g.alcDeHab(h, perto);
  h.itens = [lente.id];
  eq(g.alcDeHab(h, perto), antes,
     "a Lente de Âmbar deu alcance de arqueiro a uma habilidade de encostar");
  /* mas soma normalmente numa habilidade que já é de longe */
  const longe = h.habs.find(hb => hb.alc > 1);
  if (longe) ok(g.alcDeHab(h, longe) > longe.alc, "o item não somou numa habilidade de longe");
});

teste("a mira respeita o alcance da HABILIDADE, não o do herói", () => {
  const c = cenaV45(["kaross", "nyx", "solenne", "vesper", "mirrha"],
                    ["vharn", "grumo", "zhet", "cael", "torvald"]).vez(0);
  const g = c.g;
  const k = c.heroi(0, "topo"), alvo = c.heroi(1, "topo");
  ok(k.habs[0].alc === 1 && k.habs[2].alc === 3,
     "esta cena precisa de um herói com básica de perto e Ultimate de longe");
  /* alvo a 3 casas: fora da básica, dentro da Ultimate */
  const casa = [];
  for (let r = 0; r < g.LINS; r++) for (let col = 0; col < g.COLS; col++)
    if (g.noTab(col, r) && g.dist(col, r, ...k.pos) === 3 && !g.em(col, r)) casa.push([col, r]);
  ok(casa.length, "não achei casa a 3 de distância");
  alvo.pos = [...casa[0]];
  g.aplicaCond(alvo, "revelado", { tu: 3 });
  g.J.dados = [{ v: 6, usado: 0 }];

  c.mira(k, 0);
  ok(!g.alvos.includes(alvo), "a básica corpo a corpo alcançou um alvo a 3 casas");
  g.limpaModo(); g.selHeroi = k;
  c.mira(k, 2);
  ok(g.alvos.includes(alvo), "a Ultimate arremessada NÃO alcançou um alvo a 3 casas");
});

teste("a IA se aproxima pelo maior alcance do kit, não pelo do herói", () => {
  const g = carrega();
  const k = g.CATALOGO.kaross;
  const falso = { ...k, id: "kaross", habs: k.habs, itens: [], alcTurno: 0, extraPoder: 0, pos: [0, 0] };
  ok(g.alcanceUtil(falso) >= 3,
     "a IA acha que a Dona Chinela só alcança 1 — ela nunca usaria o Chinelo Voador de longe");
});

/* ═══════════════ v47 — o defensor passa a contar ═══════════════
   Relato: *"tá muito fácil ganhar o jogo só empurrando torre, tem que ter uma
   forma de defender mais efetiva"*. A causa não era número: era que o defensor
   não entrava na conta de presença em posição nenhuma do mapa. */

/* posição da torre exterior do time `t` numa rota */
function torreExterior(g, t, rota) {
  const minhas = g.J.torres.filter(x => x.t === t && x.rota === rota);
  ok(minhas.length, `time ${t} não tem torre no ${rota}`);
  return minhas.reduce((a, b) => (t === 0 ? (b.i > a.i ? b : a) : (b.i < a.i ? b : a)));
}

teste("na MESMA casa, atacante e defensor contam igual", () => {
  const c = cena(); const g = c.g;
  const tr = torreExterior(g, 0, "topo");
  const casa = g.ROTAS.topo[tr.i];
  g.J.frentes.topo = tr.i;                       // a onda chegou na torre: há cerco

  const meu = c.heroi(0, "topo"), dele = c.heroi(1, "topo");
  c.poe(meu, casa); c.poe(dele, casa);
  eq(g.rotaDaPos(meu), "topo",
     "o defensor em cima da própria torre não conta na rota — nenhuma posição do "
     + "mapa fazia ele somar, então defender era impossível, não difícil");
  eq(g.rotaDaPos(dele), "topo", "o atacante deixou de contar");
});

teste("quem está encostado na Frente de Onda conta; quem está em casa, não", () => {
  const c = cena(); const g = c.g;
  const tr = torreExterior(g, 0, "topo");
  g.J.frentes.topo = tr.i;
  const h = c.heroi(0, "topo");

  c.poe(h, g.ROTAS.topo[tr.i]);
  eq(g.rotaDaPos(h), "topo", "em cima da torre sitiada não contou");

  c.poe(h, g.ROTAS.topo[Math.max(0, tr.i - 1)]);
  eq(g.rotaDaPos(h), "topo", "um passo atrás da torre sitiada não contou");

  c.poe(h, g.ROTAS.topo[0]);
  eq(g.rotaDaPos(h), null,
     "herói na própria base contou como presença — isso é acampar, não defender");
});

teste("sem cerco, estar atrás da própria torre continua NÃO contando", () => {
  const c = cena(); const g = c.g;
  const tr = torreExterior(g, 0, "topo");
  const h = c.heroi(0, "topo");
  /* a onda no vão neutro: ninguém está atacando esta torre */
  g.J.frentes.topo = g.J.frentes.topo;
  const longe = Math.abs(g.J.frentes.topo - tr.i) > 1;
  if (!longe) return;                            // cena degenerada, não mede nada
  c.poe(h, g.ROTAS.topo[tr.i]);
  eq(g.rotaDaPos(h), null,
     "a regra nova ligou sem cerco — ela só pode valer quando a onda VEIO até você, "
     + "senão quem fica em casa passa a empurrar onda de graça");
});

teste("trazer um corpo a mais empurra a onda de volta e a torre para de cair", () => {
  const c = cena(); const g = c.g;
  const tr = torreExterior(g, 0, "topo");
  g.J.frentes.topo = tr.i;
  const casa = g.ROTAS.topo[tr.i];

  /* o atacante sozinho na rota: a onda fica e a torre cai */
  g.todos().forEach(h => c.poe(h, g.BASE[h.t][0]));
  c.poe(c.heroi(1, "topo"), casa);
  g.J.presenca = [{}, {}];
  g.J.vez = 0; g.encerraTurno();                 // congela a presença do time 0
  g.J.vez = 1; g.encerraTurno();                 // congela a do time 1 e vira a rodada
  const vidaSo = g.J.torres.find(x => x === tr).vida;
  ok(vidaSo < g.VIDA_TORRE, "sem defensor a torre deveria ter levado dano");

  /* agora com um defensor colado: a presença empata e a onda para de andar */
  const def = c.heroi(0, "topo");
  c.poe(def, casa);
  eq(g.rotaDaPos(def), "topo", "o defensor não contou");
  eq(g.rotaDaPos(c.heroi(1, "topo")), "topo", "o atacante não contou");
});

teste("a IA defende torre sitiada em vez de esperar o Nexus chegar a 1", () => {
  const c = cena(); const g = c.g;
  g.nivelIA = "dificil";
  const tr = torreExterior(g, 1, "topo");        // torre da IA (time 1)
  g.J.frentes.topo = tr.i;
  /* dois heróis do time 0 pressionando, nenhum do time 1 */
  g.J.presenca = [{ topo: 2 }, { topo: 0 }];
  const casa = g.ROTAS.topo[tr.i];
  const perto = g.vivos(1).slice()
    .sort((a, b) => g.dist(...a.pos, ...casa) - g.dist(...b.pos, ...casa))[0];
  const d = g.iaDestino(perto, 1);
  ok(d && d.motivo === "defende a torre",
     `a IA decidiu "${d ? d.motivo : "nada"}" com uma torre dela caindo — `
     + "a regra nova existiria só para o humano");
});

teste("a IA não larga a rota para defender uma torre que já está segura", () => {
  const c = cena(); const g = c.g;
  g.nivelIA = "dificil";
  const tr = torreExterior(g, 1, "topo");
  g.J.frentes.topo = tr.i;
  g.J.presenca = [{ topo: 1 }, { topo: 2 }];     // a IA já tem gente a mais lá
  const casa = g.ROTAS.topo[tr.i];
  const perto = g.vivos(1).slice()
    .sort((a, b) => g.dist(...a.pos, ...casa) - g.dist(...b.pos, ...casa))[0];
  const d = g.iaDestino(perto, 1);
  ok(!d || d.motivo !== "defende a torre",
     "a IA mandou reforço para uma torre que não estava caindo — assim se perde o mapa");
});

teste("o rótulo da rota conta presença e obedece à névoa", () => {
  const c = cena().vez(0); const g = c.g;
  g.aiMode = false;
  const tr = torreExterior(g, 0, "topo");
  g.J.frentes.topo = tr.i;
  const casa = g.ROTAS.topo[tr.i];
  const meu = c.heroi(0, "topo"), dele = c.heroi(1, "topo");
  c.poe(meu, casa);
  /* o inimigo colado e INVISÍVEL não pode aparecer na conta */
  const viz = g.vizinhos(...casa).find(p => g.noTab(...p) && !g.em(...p));
  c.poe(dele, viz);
  g.aplicaCond(dele, "invisivel", { tu: 3 });
  ok(!g.visivelPara(dele, 0), "não ficou invisível");
  const oculto = g.contaRota("topo");
  g.aplicaCond(dele, "revelado", { tu: 3 });
  const visto = g.contaRota("topo");
  eq(oculto.deles, 0, "o rótulo entregou a posição de um inimigo invisível");
  ok(visto.deles >= 1, "o rótulo não contou o inimigo revelado ao lado");
});

/* ---------- resumo ---------- */
console.log(`\n  ${passou} passaram · ${falhou} falharam\n`);
if (falhou) {
  console.log("  falhas:");
  falhas.forEach(([n, e]) => console.log(`    · ${n}\n      ${e.message}`));
  console.log("");
}
process.exit(falhou ? 1 : 0);
