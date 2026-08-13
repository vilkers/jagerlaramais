/* Carrega o jogo inteiro em Node, sem navegador e sem tocar em jogo/jogo.js.
   Serve para rodar centenas de partidas por segundo e escolher número com dado
   na mão em vez de opinião.

   Como funciona: um DOM falso permissivo, os três scripts avaliados na ordem em
   que o index.html carrega, e as funções de interface trocadas por no-op depois.

   As variantes (`troca`) fazem substituição no TEXTO do jogo.js antes de avaliar.
   É proposital: dá para testar mapa 9x9 com 2d10 sem sujar o arquivo que o time
   está editando em paralelo.  */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const RAIZ = path.join(__dirname, "..");

/* ---------- DOM falso ---------- */
function elemento() {
  const base = {
    classList: { add(){}, remove(){}, contains(){ return false; }, toggle(){} },
    style: {}, dataset: {},
    innerHTML: "", textContent: "", value: "", disabled: false, onclick: null, onkeydown: null,
    appendChild(x){ return x; }, append(){}, prepend(){}, remove(){}, insertBefore(x){ return x; },
    setAttribute(){}, getAttribute(){ return null; }, removeAttribute(){},
    addEventListener(){}, removeEventListener(){}, click(){}, focus(){},
    querySelector(){ return null; }, querySelectorAll(){ return []; },
    animate(){ return { cancel(){}, finished: Promise.resolve() }; },
    getBBox(){ return { x:0, y:0, width:100, height:100 }; },
    getBoundingClientRect(){ return { left:0, top:0, right:100, bottom:100, width:100, height:100 }; },
    getScreenCTM(){ return null; },
    createSVGPoint(){ return { x:0, y:0, matrixTransform(){ return { x:0, y:0 }; } }; }
  };
  return new Proxy(base, {
    get: (o, p) => (p in o ? o[p] : undefined),
    set: (o, p, v) => { o[p] = v; return true; }
  });
}

function contextoDOM() {
  const doc = {
    getElementById: () => elemento(),
    createElement: () => elemento(),
    createElementNS: () => elemento(),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(){}, body: elemento()
  };
  return {
    document: doc,
    navigator: { vibrate(){} },
    console,
    performance: { now: () => Date.now() },
    setTimeout: () => 0,
    clearTimeout(){},
    Math, JSON, Date, Object, Array, String, Number, Boolean, Set, Map, Promise, Error
  };
}

/* ---------- carga ---------- */
const LEITURA = {
  imagens: fs.readFileSync(path.join(RAIZ, "arte/imagens.js"), "utf8"),
  catalogo: fs.readFileSync(path.join(RAIZ, "data/catalogo.js"), "utf8"),
  jogo: fs.readFileSync(path.join(RAIZ, "jogo/jogo.js"), "utf8")
};

/* Cada troca é [regex, substituto]. Falha alto se não casar: variante que não
   aplicou e passa despercebida produz resultado que parece válido e não é. */
function aplicaTrocas(fonte, trocas) {
  for (const [de, para] of trocas) {
    const antes = fonte;
    fonte = fonte.replace(de, para);
    if (fonte === antes) throw new Error("troca não casou: " + de);
  }
  return fonte;
}

/* `let J` e companhia são ligações léxicas do script: não viram propriedade do
   objeto global como `function` e `var` viram, então de fora não dá para ler nem
   escrever. Esta ponte é avaliada no mesmo escopo e fecha sobre elas. */
const PONTE = `
;globalThis.__ponte = {
  get J(){return J},                 set J(v){J=v},
  get TIMES(){return TIMES},         set TIMES(v){TIMES=v},
  get selHeroi(){return selHeroi},   set selHeroi(v){selHeroi=v},
  get modo(){return modo},           set modo(v){modo=v},
  get habAtual(){return habAtual},   set habAtual(v){habAtual=v},
  get dadoSel(){return dadoSel},     set dadoSel(v){dadoSel=v},
  get aiMode(){return aiMode},       set aiMode(v){aiMode=v},
  get simMode(){return simMode},     set simMode(v){simMode=v},
  get alvos(){return alvos},
  get alvosTorre(){return alvosTorre},
  get alvosEpico(){return alvosEpico},
  get alvoNexus(){return alvoNexus},
  get mover(){return mover},
  get maos(){return maos},
  get baralho(){return baralho},
  get cemiterio(){return cemiterio},
  get escolhaItem(){return escolhaItem},
  /* geometria e catálogo — \`const\` de script não vira propriedade do global,
     então sem estes getters um teste não consegue nem achar um herói. */
  get CATALOGO(){return CATALOGO},   get ITENS(){return ITENS},
  get CAMP_NEUTRO(){return CAMP_NEUTRO}, get CAMP_AZUL(){return CAMP_AZUL},
  get CAMP_NEUTRO_LADOS(){return CAMP_NEUTRO_LADOS}, get GASTOS(){return GASTOS},
  visivelPara:(h,t)=>visivelPara(h,t), escondido:h=>escondido(h),
  ehMato:(c,r)=>ehMato(c,r), get MATO(){return MATO},
  reveladoPorAtaque:h=>reveladoPorAtaque(h),
  sobTorreAmiga:h=>sobTorreAmiga(h), get ARM_TORRE(){return ARM_TORRE},
  plantaSentinela:h=>plantaSentinela(h), usaGasto:(id,h,t)=>usaGasto(id,h,t),
  iaPlantaWards:t=>iaPlantaWards(t),
  estadoDaPeca:h=>estadoDaPeca(h),
  escalaDe:slot=>escalaDe(slot), get ESCALA_CTRL(){return ESCALA_CTRL},
  get ESCALA_ULT(){return ESCALA_ULT},
  respawnAgora:()=>respawnAgora(), fimDaRodada:()=>fimDaRodada(),
  golpeNoPoco:(h,hb,slot,F,ep)=>golpeNoPoco(h,hb,slot,F,ep),
  alvosNoHex:(c,r)=>alvosNoHex(c,r), tocaAlvo:(c,r)=>tocaAlvo(c,r),
  migraCacador:t=>migraCacador(t), cacadorDe:t=>cacadorDe(t),
  iaEscolheRotacao:t=>iaEscolheRotacao(t), abreRotacoes:()=>abreRotacoes(),
  get ROTACOES(){return ROTACOES}, get ROTACAO_PASSOS(){return ROTACAO_PASSOS},
  get NIVEIS_IA(){return NIVEIS_IA},
  get nivelIA(){return nivelIA}, set nivelIA(v){nivelIA=v},
  iaMelhorJogada:(t,m)=>iaMelhorJogada(t,m), iaJogadas:t=>iaJogadas(t),
  iaDestino:(h,t)=>iaDestino(h,t), iaCompra:t=>iaCompra(t),
  iaPlanejaAlcance:t=>iaPlanejaAlcance(t), iaJogaCartas:t=>iaJogaCartas(t),
  encerraTurno:()=>encerraTurno(), moveAte:(c,r)=>moveAte(c,r),
  limpaModo:()=>limpaModo(), calcula:()=>calcula(),
  poeDot:(a,q,t,d,r)=>poeDot(a,q,t,d,r), cobraDots:t=>cobraDots(t),
  poeZona:(t,p,z)=>poeZona(t,p,z), zonasCobram:t=>zonasCobram(t),
  curaDeBase:()=>curaDeBase(),
  get DOTS(){return DOTS}, get ZONA_TURNOS(){return ZONA_TURNOS},
  get CURA_BASE(){return CURA_BASE}, get CERCO_RAIO(){return CERCO_RAIO},
  iniciaTurno:()=>iniciaTurno(),
  enxergaCasa:(t,c,r)=>enxergaCasa(t,c,r), visaoDe:t=>visaoDe(t),
  poeWard:(t,p)=>poeWard(t,p), expiraWards:()=>expiraWards(),
  ladoDaTela:()=>ladoDaTela(), colheAcampamentos:()=>colheAcampamentos(),
  iaInimigosVisiveis:t=>iaInimigosVisiveis(t),
  desempilha:()=>desempilha(),
  precoGasto:(g,h)=>precoGasto(g,h), gastosDisponiveis:h=>gastosDisponiveis(h),
  get ROTAS(){return ROTAS},         get BASE(){return BASE},
  get POCO(){return POCO},           get EPICO(){return EPICO},
  get DADIVAS(){return DADIVAS},     get BARAO_RODADAS(){return BARAO_RODADAS},
  get BARAO_ESCUDO(){return BARAO_ESCUDO},
  get COLS(){return COLS},           get LINS(){return LINS},
  get VIDA_TORRE(){return VIDA_TORRE}, get VIDA_NEXUS(){return VIDA_NEXUS},
  dist:(...a)=>dist(...a), vizinhos:(...a)=>vizinhos(...a),
  noTab:(...a)=>noTab(...a), em:(...a)=>em(...a), k:(...a)=>k(...a),
  todos:()=>todos(), vivos:t=>vivos(t), naBase:h=>naBase(h),
  torreExposta:(...a)=>torreExposta(...a), capacidade:h=>capacidade(h),
  poderTotal:h=>poderTotal(h), armTotal:h=>armTotal(h), alcTotal:h=>alcTotal(h)
};`;

function carrega(trocas = []) {
  const ctx = vm.createContext(contextoDOM());
  vm.runInContext(LEITURA.imagens, ctx, { filename: "imagens.js" });
  vm.runInContext(LEITURA.catalogo, ctx, { filename: "catalogo.js" });
  vm.runInContext(aplicaTrocas(LEITURA.jogo, trocas) + PONTE, ctx, { filename: "jogo.js" });

  /* interface fora do caminho — o que interessa aqui é a regra */
  const nada = () => {};
  ctx.pinta = nada; ctx.desenhaMapa = nada; ctx.toast = nada; ctx.fx = nada;
  ctx.tremer = nada; ctx.vibra = nada; ctx.animaMovimento = nada; ctx.aplicaFoco = nada;
  ctx.checaTut = nada; ctx.falaIA = nada; ctx.abreSheet = nada; ctx.fechaSheet = nada;

  /* iaExecutaTurno FORA do caminho — e este é o ponto mais importante do
     harness. Em `simMode` o motor dispara a IA a cada turno; ela é `async` e o
     `setTimeout` daqui nunca chama o callback, então ela roda o começo do turno
     (comprar item, jogar carta) e TRAVA no primeiro `await`, deixando
     `iaRodando` preso em true para sempre.

     O efeito era medição não estacionária: a IA comprava na PRIMEIRA partida da
     bateria e em nenhuma das seguintes, e o resultado do run inteiro dependia do
     que tivesse acontecido no jogo nº 1. Medido: o mesmo build deu 47,6% e 50,4%
     em execuções diferentes — 3 pontos de diferença que não eram do jogo.

     Quem quiser medir a IA de verdade usa o navegador (ver o teste de fumaça):
     lá o setTimeout existe e ela termina o turno. */
  ctx.iaExecutaTurno = nada;

  /* `abre` guarda o callback em vez de disparar: a tela de fim de partida chama
     partida() de novo, e auto-executar isso iniciaria uma partida infinita. */
  ctx.abre = (html, ok) => { ctx.__pendente = ok || null; };
  ctx.fecha = nada;

  /* O cara ou coroa (v21) é uma TELA com botão, e sem ninguém para clicar a
     partida nunca saía da fase "oculto" — a bateria inteira reportava 100% de
     partidas não terminadas. Aqui ele resolve na hora, sorteando do mesmo jeito
     que sortearia na mão do jogador: quem começa continua sendo aleatório, que é
     justamente o que a medição de "quem começa" precisa. */
  ctx.caraOuCoroa = depois => {
    const p = ctx.__ponte.J;
    p.primeiro = Math.random() < 0.5 ? 0 : 1;
    p.vez = p.primeiro;
    depois();
  };

  const ponte = ctx.__ponte;

  /* A fase de comando oculto (as cinco fichas do Caçador) saiu na v19: esconder
     o Caçador virou consequência de POSIÇÃO — ele fica invisível enquanto está
     no mato e o adversário não tem ninguém lá. Não há mais nada para o harness
     responder antes do primeiro turno. */

  /* uma fachada só: estado mutável vem da ponte, o resto do global do script */
  return new Proxy({}, {
    get: (_, p) => (p in ponte ? ponte[p] : ctx[p]),
    set: (_, p, v) => { (p in ponte ? ponte : ctx)[p] = v; return true; },
    has: (_, p) => p in ponte || p in ctx
  });
}

module.exports = { carrega, RAIZ };
