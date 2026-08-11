/* Os números canônicos do jogo, extraídos DO CÓDIGO — nunca digitados aqui.

   Existe porque o projeto já perdeu tempo com o contrário: o README anunciava
   Nexus com 5 de vida enquanto o motor jogava com 3, e as regras descreviam uma
   torre que só aceitava golpe com a onda em cima. Documento que guarda número
   copiado à mão envelhece em silêncio.

   Duas fontes, as duas de verdade:
     · GEOMETRIA e CONSTANTES  — lidas do jogo rodando em Node (sim/motor.js),
       com uma ponte injetada, no mesmo molde do sim/simetria.js
     · NÚMEROS INLINE          — os que não têm nome de constante (o ouro de quem
       farma, o respawn, a mão máxima) saem por regex no TEXTO do jogo.js

   Regex que não casa DERRUBA o processo, de propósito. Número que some em
   silêncio vira documentação errada com cara de certa — foi exatamente assim que
   esta divergência nasceu.

   Uso:
     node sim/numeros.js            → imprime a tabela inteira
     require("./numeros").numeros() → { chave: {valor, de} }                      */

const fs = require("fs");
const path = require("path");
const { carrega, RAIZ } = require("./motor");

/* ---------- 1. geometria e constantes, do jogo carregado ---------- */
/* A ponte é injetada na BOCA DA SEÇÃO TURNO: é o primeiro ponto do arquivo em que
   tudo que interessa — mapa, rotas, torres, poço, épico e o peso da Retomada — já
   foi inicializado. Ancorar antes disso dá "Cannot access X before initialization",
   porque `const` de escopo de script não existe até a linha dela rodar. */
const PONTE_NUM = [/\/\* ---------- TURNO ---------- \*\//,
  `;globalThis.__num={N,COLS,LINS,NO_TAB,BASE,ROTAS,CORREDOR,LANE,RIO,TORRES_DEF,` +
  `VIDA_TORRE,VIDA_NEXUS,DANO_TORRE,REVIDE_TORRE,POCO,EPICO,R_DRAGAO,R_BARAO,` +
  `DRAGAO_PODER,BARAO_PODER,BARAO_RODADAS,PESO_TORRE,ITENS,CATALOGO};\n$&`];

/* ---------- 2. números sem nome de constante, lidos do texto ---------- */
/* [chave, regex com UM grupo de captura, o que é] */
const INLINE = [
  ["ouroAgiu",     /h\.ouro \+= h\.agiu\?(\d+):\d+;/,              "ouro de quem recebeu dado"],
  ["ouroFarmou",   /h\.ouro \+= h\.agiu\?\d+:(\d+);/,              "ouro de quem farmou"],
  ["respawn",      /alvo\.vida=0; alvo\.morto=(\d+);/,             "rodadas de respawn"],
  ["ouroAbate",    /quem\.ouro\+=(\d+);\n\s*reg\("b",`☠/,          "ouro por abate"],
  ["maoMaxima",    /if\(maos\[t\]\.length>(\d+)\)\{/,              "mão máxima do Deck de Comando"],
  ["patamarOuro",  /Math\.min\(3,Math\.floor\(h\.ouro\/(\d+)\)\)/, "ouro por patamar do Atirador"],
  ["patamarPoder", /h\.extraPoder\+=(\d+)\*\(p-h\.pat\)/,          "Poder por patamar"],
  ["patamarMax",   /Math\.min\((\d+),Math\.floor\(h\.ouro\/\d+\)\)/,"patamares do Atirador"],
  ["prioMax",      /J\.times\[t\]\.prio=Math\.min\((\d+),/,        "teto de Prioridade"],
  ["retomada1",    /return d>=\d+\?2:d>=(\d+)\?1:0;/,              "diferença que dá +1 dado de ação"],
  ["retomada2",    /return d>=(\d+)\?2:d>=\d+\?1:0;/,              "diferença que também dá +1 no Dado Mestre"],
  ["gankForca",    /aplicaDano\(cac,presa,\d+\+poderTotal\(cac\)\+(\d+)\)/, "bônus de Força do gank"],
  ["cacaFarm",     /cac\.ouro\+=(\d+); reg/,                       "ouro do Caçador que fica na selva"],
  ["dadosAcao",    /J\.dados=\[((?:\d,?)+)\]\.map/,                "dados de ação por rodada"]
];

function inline(fonte) {
  const out = {};
  for (const [chave, re, oque] of INLINE) {
    const m = re.exec(fonte);
    if (!m) throw new Error(
      `sim/numeros.js: o padrão de "${chave}" (${oque}) não casa mais em jogo/jogo.js.\n` +
      `  A regra mudou de forma? Atualize o padrão aqui — não apague a linha.\n  ${re}`);
    out[chave] = { valor: chave === "dadosAcao" ? m[1].split(",").length : +m[1], de: oque };
  }
  return out;
}

/* ---------- 3. a tabela ---------- */
/* A versão é o ÚNICO número que não sai do código: ela sai da primeira entrada de
   docs/patch-notes.md, que é append-only e por definição tem a versão de hoje no
   topo. Fica aqui para que o rótulo de versão do guia, do README e do ESTADO saiam
   todos do mesmo lugar — eram três lugares, e o guia ficou anunciando v0.4 por
   três versões seguidas. */
function versaoAtual() {
  const m = /^## (v[\d.]+[\w.-]*)/m.exec(fs.readFileSync(path.join(RAIZ, "docs/patch-notes.md"), "utf8"));
  if (!m) throw new Error("sim/numeros.js: docs/patch-notes.md não começa com uma entrada `## vX.Y`");
  return m[1];
}

function numeros() {
  const fonte = fs.readFileSync(path.join(RAIZ, "jogo/jogo.js"), "utf8");
  const g = carrega([PONTE_NUM]).__num;
  const cat = require(path.join(RAIZ, "data/catalogo.js"));

  /* Selva = tudo que não é rota nem base. O RIO entra na conta de propósito: ele é
     só pintura, não afeta movimento nem LANE, então na mesa é chão de selva. É essa
     a definição por trás dos "30 casas" medidos na v0.6.2 — contar o rio à parte dá
     28 e faria o histórico parecer errado sem nada ter mudado. */
  const selva = (() => {
    const base = new Set([...g.BASE[0], ...g.BASE[1]].map(([c, r]) => c + "," + r));
    let n = 0;
    for (const k of g.NO_TAB) if (!g.LANE.has(k) && !base.has(k)) n++;
    return n;
  })();

  const corredor = Object.values(g.CORREDOR).reduce((a, l) => a + l.length, 0);
  const espinha = Object.entries(g.ROTAS).map(([n, l]) => `${n} ${l.length}`).join(" · ");
  const familias = new Set(cat.DECK.map(c => c.fam)).size;
  const cartas = cat.DECK.reduce((a, c) => a + c.copias, 0);

  const d = (valor, de) => ({ valor, de });
  return {
    versao:        d(versaoAtual(), "docs/patch-notes.md · primeira entrada"),
    /* mapa */
    lado:          d(g.N, "jogo.js · const N"),
    tabuleiro:     d(`${g.N}×${g.N}`, "jogo.js · const N"),
    casas:         d(g.NO_TAB.size, "casas fechadas sob a rotação"),
    casasSelva:    d(selva, "casas fora de rota e base — o rio é pintura e conta como selva"),
    casasRio:      d(g.RIO.length, "RIO — só pintura, não afeta movimento"),
    casasCorredor: d(corredor, "CORREDOR — a rota com 2 de largura"),
    espinhas:      d(espinha, "ROTAS — a lista que indexa torre e onda"),
    /* estruturas */
    vidaTorre:     d(g.VIDA_TORRE, "jogo.js · VIDA_TORRE"),
    vidaNexus:     d(g.VIDA_NEXUS, "jogo.js · VIDA_NEXUS"),
    danoTorre:     d(g.DANO_TORRE, "dano do golpe de herói em estrutura"),
    revideTorre:   d(g.REVIDE_TORRE, "jogo.js · REVIDE_TORRE"),
    torres:        d(g.TORRES_DEF.length, "TORRES_DEF — duas por rota, por lado"),
    /* poço e épicos */
    poco:          d(`[${g.POCO.join(",")}]`, "jogo.js · POCO"),
    rodadaDragao:  d(g.R_DRAGAO, "jogo.js · R_DRAGAO"),
    rodadaBarao:   d(g.R_BARAO, "jogo.js · R_BARAO"),
    vidaDragao:    d(g.EPICO.dragao.vida, "EPICO.dragao"),
    vidaBarao:     d(g.EPICO.barao.vida, "EPICO.barao"),
    revideDragao:  d(g.EPICO.dragao.revide, "EPICO.dragao"),
    revideBarao:   d(g.EPICO.barao.revide, "EPICO.barao"),
    voltaDragao:   d(g.EPICO.dragao.volta, "EPICO.dragao"),
    voltaBarao:    d(g.EPICO.barao.volta, "EPICO.barao"),
    herancaPoder:  d(g.DRAGAO_PODER, "jogo.js · DRAGAO_PODER"),
    furiaPoder:    d(g.BARAO_PODER, "jogo.js · BARAO_PODER"),
    furiaRodadas:  d(g.BARAO_RODADAS, "jogo.js · BARAO_RODADAS"),
    /* retomada */
    pesoTorre:     d(g.PESO_TORRE, "jogo.js · PESO_TORRE"),
    /* conteúdo */
    herois:        d(Object.keys(cat.HEROIS).length, "data/catalogo.js · HEROIS"),
    heroisPorRota: d(Object.keys(cat.HEROIS).length / 5, "HEROIS ÷ 5 rotas"),
    itens:         d(g.ITENS.length, "data/catalogo.js · ITENS_LOJA"),
    cartas:        d(cartas, "DECK, somando as cópias"),
    tiposCarta:    d(cat.DECK.length, "data/catalogo.js · DECK"),
    familias:      d(familias, "famílias distintas no DECK"),
    bans:          d(cat.BANS, "data/catalogo.js · BANS"),
    ...inline(fonte)
  };
}

module.exports = { numeros };

if (require.main === module) {
  const n = numeros();
  console.log("\n  NÚMEROS CANÔNICOS — extraídos do código\n");
  const w = Math.max(...Object.keys(n).map(k => k.length));
  for (const [k, v] of Object.entries(n))
    console.log(`  ${k.padEnd(w)}  ${String(v.valor).padEnd(12)} ${v.de}`);
  console.log("");
}
