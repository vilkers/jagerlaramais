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
  const timers = [];
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
    /* O relógio da rotação do Caçador é um `setInterval`. Um stub que engole a
       chamada deixaria o timeout de 10 segundos sem teste possível — então aqui
       ele GUARDA o callback, e o teste dispara os tiques na mão. Determinístico,
       sem esperar tempo de parede. */
    setInterval: (fn, ms) => { timers.push({ fn, ms, vivo: true }); return timers.length; },
    clearInterval: id => { const t = timers[id - 1]; if (t) t.vivo = false; },
    __timers: timers,
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
  ehMato:(c,r)=>ehMato(c,r), get MATO(){return MATO}, gira:(c,r)=>gira(c,r),
  reveladoPorAtaque:h=>reveladoPorAtaque(h),
  sobTorreAmiga:h=>sobTorreAmiga(h), get ARM_TORRE(){return ARM_TORRE},
  plantaSentinela:h=>plantaSentinela(h), usaGasto:(id,h,t)=>usaGasto(id,h,t),
  iaPlantaWards:t=>iaPlantaWards(t), iaRecuaDeTorre:t=>iaRecuaDeTorre(t),
  estadoDaPeca:h=>estadoDaPeca(h),
  escalaDe:slot=>escalaDe(slot), get ESCALA_CTRL(){return ESCALA_CTRL},
  get ESCALA_ULT(){return ESCALA_ULT},
  respawnAgora:()=>respawnAgora(), fimDaRodada:()=>fimDaRodada(),
  golpeNoPoco:(h,hb,slot,F,ep)=>golpeNoPoco(h,hb,slot,F,ep),
  alvosNoHex:(c,r)=>alvosNoHex(c,r), tocaAlvo:(c,r)=>tocaAlvo(c,r),
  descreve:(h,hb,F)=>descreve(h,hb,F),
  faixaDeHab:(hb,quem)=>faixaDeHab(hb,quem), get FAIXA_PADRAO(){return FAIXA_PADRAO},
  get DANO_ESTRUTURA_MIN(){return DANO_ESTRUTURA_MIN},
  dadoServe:(hb,quem,v)=>dadoServe(hb,quem,v),
  textoFaixa:(hb,quem)=>textoFaixa(hb,quem),
  cacadorDe:t=>cacadorDe(t),
  iaEscolheRotacao:t=>iaEscolheRotacao(t), abreRotacoes:()=>abreRotacoes(),
  escolheRotacao:(t,r)=>escolheRotacao(t,r), paraRelogioRotacao:()=>paraRelogioRotacao(),
  reposicionaCacador:(t,r)=>reposicionaCacador(t,r),
  pousoNaSelva:(t,r,h)=>pousoNaSelva(t,r,h),
  casaDeSelvaLivre:(p,h)=>casaDeSelvaLivre(p,h),
  get REGIOES(){return REGIOES}, get SELVA_PONTOS(){return SELVA_PONTOS},
  get BLOQUEADO(){return BLOQUEADO}, get OBSTACULO(){return OBSTACULO},
  ehBloqueado:(c,r)=>ehBloqueado(c,r),
  /* cenário: geometria pura, para o teste conferir que nada escapa do hexágono */
  cenarioDa:(c,r)=>cenarioDa(c,r), centro:(c,r)=>centro(c,r), get R_HEX(){return R},
  get COLS(){return COLS}, get LINS(){return LINS}, noTab:(c,r)=>noTab(c,r),
  ladoDoRio:(c,r)=>ladoDoRio(c,r), ehRio:(c,r)=>ehRio(c,r),
  passosDe:de=>passosDe(de), passosAte:(a,b)=>passosAte(a,b),
  get BLOQUEIOS_ALVO(){return BLOQUEIOS_ALVO},
  get ROTACAO_SEGUNDOS(){return ROTACAO_SEGUNDOS},
  get CORREDOR(){return CORREDOR}, get LANE(){return LANE},
  get NIVEIS_IA(){return NIVEIS_IA},
  get nivelIA(){return nivelIA}, set nivelIA(v){nivelIA=v},
  get iaRodando(){return iaRodando}, set iaRodando(v){iaRodando=v},
  podeArrastar:h=>podeArrastar(h), dadoPara:hb=>dadoPara(hb),
  rotaDaPos:h=>rotaDaPos(h), contaRota:nome=>contaRota(nome),
  get REVIDE_TORRE(){return REVIDE_TORRE}, get TIRO_TORRE(){return TIRO_TORRE},
  get OURO_ABATE(){return OURO_ABATE}, get OURO_CAMP(){return OURO_CAMP},
  get OURO_CAMP_NEUTRO(){return OURO_CAMP_NEUTRO}, get PATAMAR_PASSO(){return PATAMAR_PASSO},
  get ARM_ESTRUTURA(){return ARM_ESTRUTURA}, get ZONA_TORRE(){return ZONA_TORRE},
  get ARIETE_MULT(){return ARIETE_MULT},
  get ONDA_GOLPE(){return ONDA_GOLPE}, degrauDaOnda:()=>degrauDaOnda(),
  danoDaOnda:()=>danoDaOnda(),
  golpeEmEstrutura:(h,hb,slot,F)=>golpeEmEstrutura(h,hb,slot,F),
  podeAtingirEstrutura:hb=>podeAtingirEstrutura(hb), multEstrutura:hb=>multEstrutura(hb),
  creepApoia:tr=>creepApoia(tr), naZonaDaTorre:(h,tr)=>naZonaDaTorre(h,tr),
  torreQueAmeaca:h=>torreQueAmeaca(h), torresAtiram:t=>torresAtiram(t),
  posDaFrente:r=>posDaFrente(r), posDaTorre:tr=>posDaTorre(tr),
  iaMelhorJogada:(t,m)=>iaMelhorJogada(t,m), iaJogadas:t=>iaJogadas(t),
  iaDestino:(h,t)=>iaDestino(h,t), iaCompra:t=>iaCompra(t),
  iaPlanejaAlcance:t=>iaPlanejaAlcance(t), iaJogaCartas:t=>iaJogaCartas(t),
  encerraTurno:()=>encerraTurno(), moveAte:(c,r)=>moveAte(c,r),
  limpaModo:()=>limpaModo(), calcula:()=>calcula(),
  poeDot:(a,q,t,d,r)=>poeDot(a,q,t,d,r), cobraDots:t=>cobraDots(t),
  /* ---- o sistema central de condições (v45) ---- */
  get CONDS(){return CONDS}, get COND_NUM(){return COND_NUM},
  get RECURSOS(){return RECURSOS}, get PASSIVAS(){return PASSIVAS},
  aplicaCond:(a,t,o)=>aplicaCond(a,t,o), removeCond:(a,t,m)=>removeCond(a,t,m),
  gastaCond:(a,t)=>gastaCond(a,t), limpaCond:(a,n)=>limpaCond(a,n),
  temCond:(a,t)=>temCond(a,t), condDe:(a,t)=>condDe(a,t), stacksDe:(a,t)=>stacksDe(a,t),
  condsMalignas:a=>condsMalignas(a), ehControle:t=>ehControle(t),
  processaCondsInicio:t=>processaCondsInicio(t), processaCondsFim:t=>processaCondsFim(t),
  noJogo:h=>noJogo(h), voltaDoBanimento:h=>voltaDoBanimento(h),
  dispara:(ev,h,...a)=>dispara(ev,h,...a), passivaDe:h=>passivaDe(h),
  ganhaRecurso:(h,t,n)=>ganhaRecurso(h,t,n), recursoDe:(h,t)=>recursoDe(h,t),
  zeraRecurso:(h,t)=>zeraRecurso(h,t),
  ehCritico:(h,hb,a)=>ehCritico(h,hb,a), poderPassivo:h=>poderPassivo(h),
  reducaoDeAliados:a=>reducaoDeAliados(a), veMatoDeLonge:h=>veMatoDeLonge(h),
  travaDeAcao:(h,i)=>travaDeAcao(h,i), tetoAndar:h=>tetoAndar(h),
  movMaxDe:h=>movMaxDe(h), casasRestantes:h=>casasRestantes(h),
  expiraDoTime:t=>expiraDoTime(t), lampejaAte:(c,r)=>lampejaAte(c,r),
  get MOV_MAX_PADRAO(){return MOV_MAX_PADRAO}, get MOV_MAX_TETO(){return MOV_MAX_TETO},
  prende:(a,q)=>prende(a,q), revelaAoRedor:(h,r)=>revelaAoRedor(h,r),
  enxergaPorWard:(t,c,r)=>enxergaPorWard(t,c,r),
  condsDaPeca:h=>condsDaPeca(h), get LENTIDAO_CASAS(){return LENTIDAO_CASAS},
  mata:(a,q)=>mata(a,q), aplicaDano:(...a)=>aplicaDano(...a),
  usaHab:a=>usaHab(a), confirmaHab:a=>confirmaHab(a), iniciaHab:i=>iniciaHab(i),
  poeZona:(t,p,z)=>poeZona(t,p,z), zonasCobram:t=>zonasCobram(t),
  curaDeBase:()=>curaDeBase(),
  get DOTS(){return DOTS}, get ZONA_TURNOS(){return ZONA_TURNOS},
  get CURA_BASE(){return CURA_BASE}, get CERCO_RAIO(){return CERCO_RAIO},
  iniciaTurno:()=>iniciaTurno(),
  enxergaCasa:(t,c,r)=>enxergaCasa(t,c,r), visaoDe:t=>visaoDe(t),
  poeWard:(t,p)=>poeWard(t,p), expiraWards:()=>expiraWards(),
  desloca:(a,de,dir,n)=>desloca(a,de,dir,n), get CAMP_CARMIM(){return CAMP_CARMIM},
  ladoDaTela:()=>ladoDaTela(), colheAcampamentos:()=>colheAcampamentos(),
  iaInimigosVisiveis:t=>iaInimigosVisiveis(t),
  desempilha:()=>desempilha(),
  precoGasto:(g,h)=>precoGasto(g,h), gastosDisponiveis:h=>gastosDisponiveis(h),
  vendeItem:(h,id,t)=>vendeItem(h,id,t), precoVenda:id=>precoVenda(id),
  get VENDE_FRACAO(){return VENDE_FRACAO}, abreLoja:()=>abreLoja(),
  get ITEM(){return ITEM}, mesaTravada:()=>mesaTravada(),
  get BONUS_REGIAO(){return BONUS_REGIAO}, pagaBonusRegiao:(t,r)=>pagaBonusRegiao(t,r),
  aplicaBuff:(h,c,v)=>aplicaBuff(h,c,v), alvosNoHex:(c,r)=>alvosNoHex(c,r),
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
  poderTotal:h=>poderTotal(h), armTotal:h=>armTotal(h), alcTotal:h=>alcTotal(h),
  ehAgil:h=>ehAgil(h), fichaHTML:(h,m)=>fichaHTML(h,m),
  alcDeHab:(h,hb)=>alcDeHab(h,hb), alcanceUtil:h=>alcanceUtil(h),
  get ALCANCE_MAX(){return ALCANCE_MAX}, escolheHeroi:h=>escolheHeroi(h),
  get REGIAO(){return REGIAO}, atacaTorre:t=>atacaTorre(t),
  perguntaRotacao:(f,i,d)=>perguntaRotacao(f,i,d),
  /* ---- o draft (v48) ---- */
  get dr(){return dr}, set dr(v){dr=v},
  iniciaDraft:d=>iniciaDraft(d), draftLegais:()=>draftLegais(),
  iaEscolheDraft:t=>iaEscolheDraft(t), draftAplica:id=>draftAplica(id),
  draftTurnoAtual:()=>draftTurnoAtual(), draftNota:(id,t)=>draftNota(id,t),
  draftForca:id=>draftForca(id), draftAmeaca:id=>draftAmeaca(id), draftSinergia:(id,tm)=>draftSinergia(id,tm),
  get ORDEM_DRAFT(){return ORDEM_DRAFT}
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

  /* A ROTAÇÃO DO CAÇADOR É UMA TELA, e desde a v46 ela BLOQUEIA de verdade: o
     turno só começa quando os dois lados respondem. Isso é o conserto de um
     defeito real (o turno começava por baixo da tela de escolha) e é também o
     motivo de este stub existir.

     Sem ele, `perguntaRotacao` chama `abre`, que aqui só guarda o callback e
     nunca clica em nada — a partida fica parada em `J.fase==="rotacao"` para
     sempre. Medido na hora em que a v46 entrou: a bateria de 3000 partidas
     reportou "3000 estouraram o teto", ou seja, ZERO partidas concluídas.

     O harness responde como a IA responderia, para os dois lados. É a mesma
     escolha que `caraOuCoroa` faz logo abaixo, e pela mesma razão: sem ninguém
     para clicar, o motor precisa de alguém que decida — e decidir como a IA
     mantém a medição simétrica, que é o que a bateria exige. */
  const ponteRot = ctx.__ponte;
  /* guardada antes de ser trocada: os testes do RELÓGIO da rotação precisam da
     função de verdade, e é só ela que eles querem. `g.rotacaoDeVerdade()` põe a
     original de volta para aquele teste. */
  ctx.perguntaRotacaoReal = ctx.perguntaRotacao;
  ctx.rotacaoDeVerdade = () => { ctx.perguntaRotacao = ctx.perguntaRotacaoReal; };
  ctx.perguntaRotacao = (fila, i, depois) => {
    (fila || []).forEach(t => ponteRot.escolheRotacao(t, ponteRot.iaEscolheRotacao(t)));
    if (typeof depois === "function") depois();
  };

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
