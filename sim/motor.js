/* Carrega o jogo inteiro em Node, sem navegador e sem tocar nas fontes.
   Serve para rodar centenas de partidas por segundo e escolher número com dado
   na mão em vez de opinião.

   Como funciona: um DOM falso permissivo, os scripts avaliados na ordem em
   que o index.html carrega, e as funções de interface trocadas por no-op depois.

   As variantes (`troca`) fazem substituição no TEXTO do motor.js antes de avaliar.
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
  motor: fs.readFileSync(path.join(RAIZ, "jogo/motor.js"), "utf8"),
  interface: fs.readFileSync(path.join(RAIZ, "jogo/interface.js"), "utf8"),
  cartas: fs.readFileSync(path.join(RAIZ, "jogo/cartas.js"), "utf8"),
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
  get alvos(){return alvos},
  get alvosTorre(){return alvosTorre},
  get alvosEpico(){return alvosEpico},
  get alvoNexus(){return alvoNexus},
  get POCO(){return POCO},
  get N(){return N},
  get COLS(){return COLS},
  get LINS(){return LINS},
  get NO_TAB(){return NO_TAB},
  get RIO_S(){return RIO_S},
  get BASE(){return BASE},
  get ROTAS(){return ROTAS},
  get TORRES_DEF(){return TORRES_DEF},
  get VIDA_TORRE(){return VIDA_TORRE},
  get VIDA_NEXUS(){return VIDA_NEXUS},
  get DANO_TORRE(){return DANO_TORRE},
  get REVIDE_TORRE(){return REVIDE_TORRE},
  get EPICO(){return EPICO},
  get R_DRAGAO(){return R_DRAGAO},
  get R_BARAO(){return R_BARAO},
  get DRAGAO_PODER(){return DRAGAO_PODER},
  get BARAO_PODER(){return BARAO_PODER},
  get BARAO_RODADAS(){return BARAO_RODADAS},
  get GOLPE_HAB(){return GOLPE_HAB},
  get GOLPE_ULT(){return GOLPE_ULT},
  get LAMPEJO_ALC(){return LAMPEJO_ALC},
  get FEITICO_CD(){return FEITICO_CD},
  get RETORNO_CURA(){return RETORNO_CURA},
  get ITENS(){return ITENS},
  get mover(){return mover},
  get maos(){return maos},
  get baralho(){return baralho},
  get cemiterio(){return cemiterio}
};`;

function carrega(trocas = []) {
  const ctx = vm.createContext(contextoDOM());
  vm.runInContext(LEITURA.imagens, ctx, { filename: "imagens.js" });
  vm.runInContext(LEITURA.catalogo, ctx, { filename: "catalogo.js" });
  vm.runInContext(aplicaTrocas(LEITURA.motor, trocas), ctx, { filename: "motor.js" });
  vm.runInContext(LEITURA.interface, ctx, { filename: "interface.js" });
  vm.runInContext(LEITURA.cartas, ctx, { filename: "cartas.js" });
  vm.runInContext(LEITURA.jogo + PONTE, ctx, { filename: "jogo.js" });

  /* interface fora do caminho — o que interessa aqui é a regra */
  const nada = () => {};
  ctx.pinta = nada; ctx.desenhaMapa = nada; ctx.toast = nada; ctx.fx = nada;
  ctx.tremer = nada; ctx.vibra = nada; ctx.animaMovimento = nada; ctx.aplicaFoco = nada;
  ctx.checaTut = nada;

  /* `abre` guarda o callback em vez de disparar: a tela de fim de partida chama
     partida() de novo, e auto-executar isso iniciaria uma partida infinita. */
  ctx.abre = (html, ok) => { ctx.__pendente = ok || null; };
  ctx.fecha = nada;

  const ponte = ctx.__ponte;

  /* a escolha do Caçador acontece por clique num botão; aqui vira parâmetro */
  const ZONAS = ["selva", "topo", "meio", "baixo"];
  ctx.__zonaCaca = () => ZONAS[Math.floor(Math.random() * ZONAS.length)];
  ctx.perguntaCaca = (t, depois) => {
    ponte.J.times[t].caca = ctx.__zonaCaca(t);
    ponte.J.times[t].cacaRevelada = null;
    depois();
  };

  /* uma fachada só: estado mutável vem da ponte, o resto do global do script */
  return new Proxy({}, {
    get: (_, p) => (p in ponte ? ponte[p] : ctx[p]),
    set: (_, p, v) => { (p in ponte ? ponte : ctx)[p] = v; return true; },
    has: (_, p) => p in ponte || p in ctx
  });
}

module.exports = { carrega, RAIZ };
