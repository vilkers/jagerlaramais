/* JAGERLARAMAIS — motor de regras e interface.
   Ordem interna: CATÁLOGO → GEOMETRIA → ESTADO → TURNO → AÇÕES → DECK/DRAFT → UI.
   Conteúdo (heróis, itens, cartas) NÃO mora aqui — mora em data/catalogo.js.
   Aparência não mora aqui — mora em estilo.css. */

/* ---------- CATÁLOGO ---------- */
const POS={
  topo:{n:"Topo",cor:"#6E8F6A"}, selva:{n:"Selva",cor:"#4F7F7A"},
  meio:{n:"Meio",cor:"#5D7EA8"}, adc:{n:"Atirador",cor:"#8A7CAE"}, sup:{n:"Suporte",cor:"#A87F92"}
};

/* os 20 heróis vivem em data/catalogo.js — este arquivo não guarda conteúdo */
const CATALOGO = Object.assign({}, typeof HEROIS!=="undefined" ? HEROIS : {});

/* times padrão — sobrescritos pelo draft */
let TIMES=[["vharn","nyx","solenne","vesper","mirrha"],["kaross","grumo","zhet","cael","torvald"]];
const NOMES=["AZUL","CARMIM"];
const ROTA_ORDEM=["topo","selva","meio","adc","sup"];
const porRota=r=>Object.keys(CATALOGO).filter(id=>CATALOGO[id].pos===r);


/* ---------- LOJA ---------- */
const ITENS=[
 {id:"eclipse",  n:"Lâmina do Eclipse", o:6, d:"+2 de Poder",                        ef:{poder:2}},
 {id:"cetro",    n:"Cetro Cinéreo",     o:6, d:"+2 de Poder e +1 de Alcance",        ef:{poder:2,alc:1}},
 {id:"basalto",  n:"Coração de Basalto",o:5, d:"+4 de Vida máxima",                  ef:{vida:4}},
 {id:"egide",    n:"Égide do Juramento",o:5, d:"+2 de Armadura",                     ef:{arm:2}},
 {id:"manto",    n:"Manto de Cinzas",   o:5, d:"+1 de Armadura e +2 de Vida",        ef:{arm:1,vida:2}},
 {id:"passos",   n:"Passos do Vento",   o:4, d:"Ágil: a 1ª casa andada é grátis",    ef:{agil:1}},
 {id:"ampulheta",n:"Ampulheta Rachada", o:6, d:"+1 no Dado Mestre, toda rodada",     ef:{mov:1}},
 {id:"garra",    n:"Garra do Faminto",  o:7, d:"Cura 2 sempre que causar dano",      ef:{roubo:2}},
 {id:"coroa",    n:"Coroa do Comando",  o:5, d:"Aliados adjacentes ganham +1 de Poder", ef:{aura:1}},
 {id:"selo",     n:"Selo da Ruína",     o:5, d:"RESPOSTA — quem você atinge não é curado por 1 rodada", ef:{antiCura:1}},
 {id:"espinho",  n:"Cota do Espinho",   o:6, d:"RESPOSTA — devolve 2 a quem atacar de perto", ef:{espinho:2}},
 {id:"veu",      n:"Véu Prismático",    o:7, d:"RESPOSTA — anula a próxima Ultimate que te atingir", ef:{veu:1}}
];
if(typeof ITENS_NOVOS!=="undefined") ITENS.push(...ITENS_NOVOS);
const ITEM=Object.fromEntries(ITENS.map(i=>[i.id,i]));
/* Vale a base E o entorno imediato, não o hexágono exato. A base tem dois hexágonos
   e o time tem cinco heróis: `desempilha()` empurra três deles para as casas vizinhas
   já na largada, e com a checagem exata NENHUM dos cinco contava como estando na base
   — medido, a loja abria dizendo "Loja fechada" na rodada 1 de toda partida.
   Efeito colateral assumido: voltar para comprar ficou mais barato. */
const naBase=h=>BASE[h.t].some(([c,r])=>dist(c,r,...h.pos)<=1);
function bonus(h,campo){ return (h.itens||[]).reduce((a,id)=>a+(ITEM[id].ef[campo]||0),0); }
function auraDe(h){
  return J.times[h.t].herois.some(o=>o!==h&&!o.morto&&(o.itens||[]).some(i=>ITEM[i].ef.aura)
    && dist(...h.pos,...o.pos)<=1) ? 1 : 0;
}
const poderTotal=h=>h.poder+h.extraPoder+bonus(h,"poder")+auraDe(h);
const armTotal=h=>h.arm+bonus(h,"arm");
const alcTotal=h=>h.alc+bonus(h,"alc");
const ehAgil=h=>h.agil||bonus(h,"agil")>0;

/* ---------- GEOMETRIA DO MAPA ---------- */
/* O tabuleiro é quadrado de lado N e as rotas saem de regra, não de lista escrita
   à mão: mudar N muda o mapa inteiro — rotas, bases, rio e posição das torres,
   que já se calculam por proporção do comprimento da rota.
   Em N=7 a regra reproduz exatamente as listas fixas que existiam até a v0.5.2. */
const N=8;
const COLS=N,LINS=N,R=19;
const BASE=[[[0,N-1],[1,N-1]],[[N-1,0],[N-1,1]]];
/* sobe pela coluna 0 e vira à direita na linha 0 */
const L_TOPO=(()=>{const l=[];for(let r=N-2;r>=1;r--)l.push([0,r]);
  for(let c=1;c<=N-2;c++)l.push([c,0]);return l;})();
/* corre pela linha de baixo e sobe pela última coluna */
const L_BOT=(()=>{const l=[];for(let c=2;c<=N-1;c++)l.push([c,N-1]);
  for(let r=N-2;r>=2;r--)l.push([N-1,r]);return l;})();
/* o rio é só pintura: separa as duas metades, não afeta movimento */
const RIO=(()=>{const l=[];for(let r=1;r<=N-1;r++)l.push([1+Math.floor(r/2),r]);return l;})();
const k=(c,r)=>c+","+r;
const centro=(c,r)=>{const w=Math.sqrt(3)*R;return[26+w*(c+.5*(r&1))+w/2,26+R*1.5*r+R];};
const dist=(c1,r1,c2,r2)=>{const ax=c1-(r1-(r1&1))/2,ay=-ax-r1,bx=c2-(r2-(r2&1))/2,by=-bx-r2;
  return Math.max(Math.abs(ax-bx),Math.abs(ay-by),Math.abs(r1-r2));};
const vizinhos=(c,r)=>((r&1)?[[-1,0],[1,0],[0,-1],[1,-1],[0,1],[1,1]]:[[-1,0],[1,0],[-1,-1],[0,-1],[-1,1],[0,1]])
  .map(([a,b])=>[c+a,r+b]).filter(([a,b])=>a>=0&&a<COLS&&b>=0&&b<LINS);

const L_MEIO=(()=>{                       // reta entre as bases, sem invadir as outras rotas
  const ocup=new Set([...BASE[0],...BASE[1],...L_TOPO,...L_BOT].map(([c,r])=>k(c,r)));
  const[x1,y1]=centro(...BASE[0][1]),[x2,y2]=centro(...BASE[1][1]),L=Math.hypot(y2-y1,x2-x1);
  const cam=[];
  for(let r=LINS-2;r>=1;r--){
    let m=null,d0=1e9;
    for(let c=0;c<COLS;c++){
      if(ocup.has(k(c,r)))continue;
      const[x,y]=centro(c,r),d=Math.abs((y2-y1)*x-(x2-x1)*y+x2*y1-y2*x1)/L;
      if(d<d0){d0=d;m=[c,r];}
    }
    if(!m)continue;
    const ant=cam.at(-1)||BASE[0][1];
    if(dist(...ant,...m)>1){
      const p=vizinhos(...ant).find(v=>dist(...v,...m)===1&&!ocup.has(k(...v))&&!cam.some(z=>z[0]===v[0]&&z[1]===v[1]));
      if(p)cam.push(p);
    }
    cam.push(m);
  }
  return cam;
})();

const ROTAS={topo:L_TOPO,meio:L_MEIO,baixo:L_BOT};
const LANE=new Map();
Object.entries(ROTAS).forEach(([nome,l])=>l.forEach(([c,r])=>LANE.set(k(c,r),nome)));
const RIO_S=new Set(RIO.map(([c,r])=>k(c,r)));
const BASE_S=new Map();
BASE.forEach((b,t)=>b.forEach(([c,r])=>BASE_S.set(k(c,r),t)));

/* duas torres por lado, com um vão neutro no meio da rota para a onda disputar */
/* NÃO "conserte" a assimetria aparente destas duas fórmulas. Já foi tentado e medido.
   Por índice elas não são espelho: no topo o time 0 fica em [1,3] e o time 1 em [9,10],
   quando o espelho de [1,3] seria [8,10]. Trocar a segunda fórmula por `n-1-i`, que
   parece o conserto óbvio, joga a vitória de quem começa de 51,1% para 40,8%
   (8000 partidas por medição, `sim/bateria.js` com épico e retomada desligados).
   O desencontro compensa outra assimetria do sistema — o `limitaFrente` somado ao
   comprimento ímpar/par de cada rota. Mexer num lado sem medir o outro quebra as duas. */
const TORRES_DEF=Object.entries(ROTAS).flatMap(([nome,l])=>{
  const n=l.length;
  return[{rota:nome,i:1,t:0},{rota:nome,i:Math.max(2,Math.round(n*.28)),t:0},
         {rota:nome,i:Math.min(n-3,Math.round(n*.72)),t:1},{rota:nome,i:n-2,t:1}];
});
/* Torre passou de 2 para 3 de vida em v0.5.1, quando o herói virou fonte de dano nela.
   Só a onda: 3 rodadas de cerco. Onda + um herói por rodada: metade disso.
   O 3 saiu de simulação: com 2 a partida fechava em 10 rodadas, com 4 passava de 18. */
const VIDA_TORRE=3, VIDA_NEXUS=3;
const DANO_TORRE=1;        /* golpe de herói tira sempre 1 — Força não derruba torre sozinha */
const REVIDE_TORRE=2;      /* e a torre cobra o pedágio de quem encostou */
/* Meio do vão neutro. Com as torres espelhadas o meio é (a+b)/2 — inteiro só quando a
   rota tem comprimento ímpar. Rota par não TEM hexágono central: a frente começa meio
   passo para um dos lados, e esse meio passo é vantagem de siege para alguém.
   Arredondar sempre para o mesmo lado empilha o viés nas três rotas; alternando, o que
   a rota par tira de um time a próxima devolve. Em N=8: topo 12 e meio 8 são pares e se
   cancelam, baixo 11 é ímpar e cai certo no meio. */
const centroRota=nome=>{                       /* meio do vão neutro */
  const ts=TORRES_DEF.filter(t=>t.rota===nome);
  const a=Math.max(...ts.filter(t=>t.t===0).map(t=>t.i));
  const b=Math.min(...ts.filter(t=>t.t===1).map(t=>t.i));
  return Math.round((a+b)/2);
};
/* torre viva trava o avanço da onda — e a frente nunca sai da rota.
   Vale para o empurrão natural do fim de rodada e para quem empurra por carta. */
function limitaFrente(nome,f){
  const l=ROTAS[nome];
  const t0=J.torres.filter(x=>x.rota===nome&&x.t===0&&x.vida>0).map(x=>x.i);
  const t1=J.torres.filter(x=>x.rota===nome&&x.t===1&&x.vida>0).map(x=>x.i);
  return Math.max(t0.length?Math.max(...t0):0,
         Math.min(t1.length?Math.min(...t1):l.length-1, f));
}

/* ---------- OBJETIVO ÉPICO ---------- */
/* UM poço só, e ele muda de morador: Dragão cedo, Barão tarde.
   Dois poços foram tentados primeiro, um por metade do mapa, e a medição matou a ideia:
   o time 1 ficava ao alcance 43% mais vezes que o time 0.

   A casa do poço é MEDIDA, não deduzida, e essa distinção custou caro para aprender.
   Distância no papel não prevê encontro no tabuleiro: [3,3] e [4,4] têm praticamente o
   mesmo acesso teórico (19-19 contra 17-19), e rodando dão 45,4% e 48,0% de encontros
   para o time 0; [4,4] e [5,5] têm acesso teórico idêntico e dão 48,0% contra 35,6%.
   Nenhuma fórmula estática separa esses casos — herói não anda em linha reta.
   Em N=8 a casa é [4,4]: a mais parelha das testadas e a que mais gera disputa (colada
   numa rota, 43% mais encontros que [3,3]). Trocou N? A dedução abaixo dá um ponto de
   partida razoável, mas rode `sim/` e meça antes de confiar nela. */
const POCO=(N===8?[4,4]:(()=>{
  const DE_ROTA_INI={topo:L_TOPO,meio:L_MEIO,adc:L_BOT,sup:L_BOT};
  const inicio=t=>{
    const p=[];
    ["topo","meio","adc","sup"].forEach(papel=>{
      const l=DE_ROTA_INI[papel], i=papel==="sup"?1:0;
      p.push(t===0?l[i]:l.at(-1-i));
    });
    p.push(t===0?[1,LINS-3]:[COLS-3,1]);           // o Caçador, que começa fora de rota
    return p;
  };
  const I=[inicio(0),inicio(1)];
  const perto=(p,l)=>Math.min(...l.map(q=>dist(...p,...q)));
  const acesso=(p,t)=>I[t].reduce((a,q)=>a+dist(...p,...q),0);
  const cmp=(a,b)=>{ for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return a[i]-b[i]; return 0; };
  let melhor=null;
  for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
    const p=[c,r];
    if(LANE.has(k(c,r))||BASE_S.has(k(c,r)))continue;
    if(perto(p,BASE[0])<3||perto(p,BASE[1])<3)continue;          // não encosta em base
    const nota=[Math.abs(acesso(p,0)-acesso(p,1)),               // justiça primeiro
                Math.min(perto(p,L_TOPO),perto(p,L_MEIO),perto(p,L_BOT)),  // depois disputa
                acesso(p,0)+acesso(p,1)];
    if(!melhor||cmp(nota,melhor.nota)<0) melhor={p,nota};
  }
  return melhor?melhor.p:[(COLS-1)>>1,(LINS-1)>>1];
})());
const POCO_K=k(...POCO);

/* Dragão compõe, Barão vira a mesa — a distinção do MOBA, ver docs/00-anatomia-moba.md.
   `volta` é quantas rodadas depois de morrer o poço reabre. `revide` é o preço de
   encostar, como na torre.
   Ninguém tem limite de golpes por rodada: é o dado que você deixa de gastar em outro
   lugar que mede o quanto você quer o objetivo — e é isso que abre a janela do roubo. */
const EPICO={
  dragao:{n:"Dragão", vida:3, revide:1, volta:3, pre:"a Herança do Dragão"},
  barao: {n:"Barão",  vida:5, revide:2, volta:4, pre:"a Fúria do Barão"}
};
const R_DRAGAO=5, R_BARAO=8;          /* rodada em que cada morador passa a descer */
const morador=r=>r>=R_BARAO?"barao":"dragao";
const DRAGAO_PODER=1;      /* por Dragão levado, permanente e acumulativo */
const BARAO_PODER=2;       /* enquanto a Fúria durar */
const BARAO_RODADAS=2;     /* e ela dura pouco — é botão de ponto-sem-volta, não renda */

/* ---------- ESTADO ---------- */
let J,dadoSel=null,ativo=null,habSel=null,selHeroi=null,alvos=[],alvosTorre=[],alvosEpico=[],
    mover=[],lojaHeroi=null;

function novo(){
  J={
    rodada:1, vez:0, primeiro:0, fase:"oculto", fim:null,
    times:[0,1].map(t=>({
      placas:0, prio:0, prioGuardada:0, ward:0,
      caca:null, cacaRevelada:null,
      dragoes:0, baroes:0, barao:0, retomada:0,
      herois:TIMES[t].map((id,i)=>{
        const b=CATALOGO[id];
        return{id,t,...b,vidaMax:b.vida,vida:b.vida,esc:0,ouro:0,pat:0,itens:[],veuAtivo:0,semCura:0,
          pos:[...BASE[t][i%2]], morto:0, agiu:0, preso:0, intoc:0, marca:0, recarga:0, extraPoder:0};
      })
    })),
    dados:[], mov:{v:0,rest:0},
    frentes:{topo:centroRota("topo"),meio:centroRota("meio"),baixo:centroRota("baixo")},
    torres:TORRES_DEF.map(d=>({...d,vida:VIDA_TORRE,batida:0})),
    /* vida 0 = o poço está vazio; `volta` é a rodada em que o próximo morador desce */
    poco:{id:"dragao", vida:0, vidaMax:EPICO.dragao.vida, volta:R_DRAGAO},
    nexus:[VIDA_NEXUS,VIDA_NEXUS], motivoFim:null, log:[]
  };
  /* cada herói começa na entrada da própria rota, não empilhado na base */
  const DE_ROTA={topo:"topo",meio:"meio",adc:"baixo",sup:"baixo"};
  J.times.forEach((tm,t)=>tm.herois.forEach(h=>{
    const papel=CATALOGO[h.id].pos;
    const l=ROTAS[DE_ROTA[papel]];
    if(!l){ h.pos=[...(t===0?[1,N-3]:[N-3,1])]; return; }   // selva
    const i = papel==="sup" ? 1 : 0;
    h.pos=[...(t===0 ? l[i] : l.at(-1-i))];
  }));
  desempilha();
  dadoSel=ativo=habSel=selHeroi=null; alvos=[]; mover=[];
  reg("r","— rodada 1 —");
  faseOculta();
}
function desempilha(){                     // dois heróis nunca no mesmo hex
  const usados=new Set();
  todos().forEach(h=>{
    while(usados.has(k(...h.pos))){
      const v=vizinhos(...h.pos).find(p=>!usados.has(k(...p)));
      if(!v)break; h.pos=v;
    }
    usados.add(k(...h.pos));
  });
}
const todos=()=>J.times.flatMap(t=>t.herois);
const vivos=t=>J.times[t].herois.filter(h=>!h.morto);
const em=(c,r)=>todos().find(h=>!h.morto&&h.pos[0]===c&&h.pos[1]===r);
const reg=(cls,txt)=>{J.log.unshift({cls,txt});};

/* ---------- FASE OCULTA ---------- */
function faseOculta(){
  J.fase="oculto";
  perguntaCaca(0,()=>perguntaCaca(1,()=>{
    fecha(); J.fase="jogando"; J.vez=J.primeiro; iniciaTurno();
  }));
}
/* perguntaCaca mora na seção FLUXO, lá embaixo — é a versão que roda. */

/* ---------- RETOMADA ---------- */
/* O freio da bola de neve. Ouro já tinha sido testado como freio e não moveu a agulha
   (+10 por herói, medição registrada na v0.5.2) — dado move, porque dado é ação, e
   ação é o que falta a quem está apanhando.
   O perigo NÃO é medido só em torre caída. A primeira versão era, e a medição mostrou
   por que não funcionava: torre só cai tarde, então a Retomada disparava na rodada 12,9
   de uma partida que acaba na 15 — chegava depois da partida ter sido decidida.
   Rota invadida é o mesmo perigo, várias rodadas antes: a onda passa do meio muito
   antes da torre cair. Somando os dois, o freio chega a tempo de ser freio.
   Some sozinha quando a diferença fecha: é rubber band, não presente permanente. */
const torresPerdidas=t=>J.torres.filter(x=>x.t===t&&x.vida<=0).length;
/* quantos hexágonos de onda inimiga estão do seu lado do meio, somando as três rotas.
   Contar rota invadida como sim/não foi tentado e medido: as frentes oscilam em volta
   do centro, então os dois times ficavam "invadidos" ao mesmo tempo e o sinal sumia
   (disparava 39,4% × 36,6% dos turnos — rubber band que ajuda o líder não é freio).
   O divisor é o meio do VÃO entre as torres, sem arredondar — e não `centroRota` nem o
   meio da rota. Os dois foram medidos e os dois enviesam:
     · `centroRota` arredonda, e o arredondamento dá ao time 0 um hexágono a mais de
       vão para ser invadido: disparava 37,4% dos turnos para o time 0 contra 28,8%
       para o time 1, socorrendo o líder;
     · o meio da rota `(n-1)/2` não é o meio do vão: a frente nasce 2 unidades dentro
       da metade do time 1, que ganhava Retomada de graça na rodada 1 (25,1% × 53,3%).
   Sem arredondar, o vão fica com o mesmo alcance dos dois lados em todas as rotas
   (topo 3 e 3, meio 1,5 e 1,5, baixo 2,5 e 2,5) e a conta nasce zerada. */
const MEIO_VAO=Object.fromEntries(Object.keys(ROTAS).map(nome=>{
  const ts=TORRES_DEF.filter(t=>t.rota===nome);
  return[nome,(Math.max(...ts.filter(t=>t.t===0).map(t=>t.i))
              +Math.min(...ts.filter(t=>t.t===1).map(t=>t.i)))/2];
}));
const invasao=t=>Object.keys(ROTAS).reduce((a,nome)=>{
  const m=MEIO_VAO[nome], f=J.frentes[nome];
  return a+Math.max(0, t===0 ? m-f : f-m);
},0);
const PESO_TORRE=2;                    /* torre caída vale por dois hexágonos de invasão */
const perigo=t=>PESO_TORRE*torresPerdidas(t)+invasao(t);
const atraso=t=>{ const d=perigo(t)-perigo(1-t); return d>=4?2:d>=2?1:0; };

/* ---------- TURNO ---------- */
function iniciaTurno(){
  const t=J.vez, tm=J.times[t];
  const extra=tm.herois.filter(h=>!h.morto).reduce((a,h)=>a+bonus(h,"mov"),0);
  tm.retomada=atraso(t);
  const m=1+Math.floor(Math.random()*6)+extra+(tm.retomada>=2?1:0);
  J.mov={v:m,rest:m};
  J.dados=[0,1,2].map(()=>({v:1+Math.floor(Math.random()*6),usado:0}));
  if(tm.retomada>=1) J.dados.push({v:1+Math.floor(Math.random()*6),usado:0,extra:1,retom:1});
  dadoSel=ativo=habSel=selHeroi=null; alvos=[]; mover=[];
  reg(t?"c":"a",`${NOMES[t]} rola — movimento ${m} · ações ${J.dados.map(d=>d.v).join(" · ")}`);
  if(tm.retomada>=1)
    reg("b",`RETOMADA — ${NOMES[t]} está ${tm.retomada} ${tm.retomada===1?"torre":"torres"} atrás`
           +`: +1 dado de ação${tm.retomada>=2?" e +1 no Dado Mestre":""}`);
  pinta();
}
function encerraTurno(){
  const advers=1-J.vez;
  revelaCaca(advers);
  if(J.fim)return;
  if(J.vez===J.primeiro){ J.vez=1-J.vez; iniciaTurno(); }
  else fimDaRodada();
}
function revelaCaca(t){
  const z=J.times[t].caca; if(!z)return;
  J.times[t].cacaRevelada=z;
  const cac=J.times[t].herois.find(h=>h.pos==="selva")||J.times[t].herois[1];
  if(cac.morto){ reg("b",`Caçador do ${NOMES[t]} está morto — carta descartada`); return; }
  if(z==="selva"){
    cac.ouro+=3; reg(t?"c":"a",`${cac.n} farmou a selva (+3 de ouro)`);
  }else{
    const l=ROTAS[z], destino=l[Math.max(0,Math.min(l.length-1,J.frentes[z]))];
    if(!em(...destino)) cac.pos=[...destino]; else{
      const v=vizinhos(...destino).find(p=>!em(...p)); if(v)cac.pos=v;
    }
    reg("b",`GANK — ${cac.n} aparece no ${z}`);
    const presa=vizinhos(...cac.pos).map(p=>em(...p)).find(h=>h&&h.t!==t&&!h.intoc);
    /* 3 de base + o bônus de gank (+2). O Poder tem que passar por poderTotal,
       senão os itens do Caçador não contam justo na jogada principal dele. */
    if(presa){ aplicaDano(cac,presa,3+poderTotal(cac)+2); }
    else reg("b","…e não achou ninguém");
  }
  pinta();
}

/* ---------- FIM DE RODADA ---------- */
function fimDaRodada(){
  /* a Fúria do Barão empurra as três rotas sozinha, mesmo sem herói nenhum nelas.
     É o que faz do Barão um relógio: dois times parados param de empatar. */
  const furia=J.times.map(tm=>tm.barao>0?1:0);
  Object.entries(ROTAS).forEach(([nome,l])=>{     // ondas: a torre viva trava o avanço
    const n0=vivos(0).filter(h=>LANE.get(k(...h.pos))===nome).length;
    const n1=vivos(1).filter(h=>LANE.get(k(...h.pos))===nome).length;
    let d=0;
    if(n0>n1) d=1; else if(n1>n0) d=-1;
    d+=furia[0]-furia[1];
    if(!d) return;
    J.frentes[nome]=limitaFrente(nome,J.frentes[nome]+d);
  });
  Object.entries(ROTAS).forEach(([nome,l])=>{     // cerco: só as torres do lado pressionado
    const f=J.frentes[nome];
    const alvo=J.torres.find(x=>x.rota===nome&&x.vida>0&&x.i===f);
    if(alvo){
      alvo.vida--;
      reg("b",`Onda do ${nome} bate na torre ${NOMES[alvo.t]} (${Math.max(0,alvo.vida)}/${VIDA_TORRE})`);
      if(alvo.vida<=0) reg("b",`TORRE CAIU — ${nome}, lado ${NOMES[alvo.t]}`);
      return;
    }
    const lado = f<=0 ? 0 : (f>=l.length-1 ? 1 : null);
    if(lado===null) return;
    if(J.torres.some(x=>x.rota===nome&&x.t===lado&&x.vida>0)) return;
    J.nexus[lado]--;
    reg("b",`Rota ${nome} aberta — Nexus ${NOMES[lado]} em ${Math.max(0,J.nexus[lado])}/${VIDA_NEXUS}`);
    if(J.nexus[lado]<=0){ J.fim=1-lado; J.motivoFim=`Nexus ${NOMES[lado]} destruído.`; }
  });
  [0,1].forEach(t=>{                              // a Fúria expira e devolve o Poder
    const tm=J.times[t];
    if(!tm.barao)return;
    tm.barao--;
    if(!tm.barao){
      tm.herois.forEach(h=>h.extraPoder-=BARAO_PODER);
      reg("b",`a Fúria do Barão abandona o ${NOMES[t]}`);
    }
  });
  todos().forEach(h=>{                            // renda: quem não agiu, farma
    if(h.morto)return;
    h.ouro += h.agiu?1:3;
    if(h.patamar){ const p=Math.min(3,Math.floor(h.ouro/10)); if(p>h.pat){h.extraPoder+=2*(p-h.pat);h.pat=p;
      reg("b",`${h.n} sobe ao patamar ${p} (+2 de Poder)`);} }
  });
  [0,1].forEach(t=>{                              // placas do topo
    const meu=J.times[t].herois[0], dele=J.times[1-t].herois[0];
    const i1=L_TOPO.findIndex(p=>k(...p)===k(...meu.pos)), i2=L_TOPO.findIndex(p=>k(...p)===k(...dele.pos));
    const av = t===0 ? i1>i2 : (i1>=0&&(i2<0||i1<i2));
    if(!meu.morto&&i1>=0&&av){ J.times[t].placas++; reg(t?"c":"a",`${meu.n} domina o topo (+1 placa)`); }
  });
  [0,1].forEach(t=>{                              // prioridade do meio
    const meu=J.times[t].herois[2], dele=J.times[1-t].herois[2];
    const i1=L_MEIO.findIndex(p=>k(...p)===k(...meu.pos)), i2=L_MEIO.findIndex(p=>k(...p)===k(...dele.pos));
    const av = t===0 ? i1>i2 : (i1>=0&&(i2<0||i1<i2));
    if(!meu.morto&&i1>=0&&av){ J.times[t].prio=Math.min(2,J.times[t].prio+1);
      reg(t?"c":"a",`${meu.n} domina o meio — prioridade (+1 dado na próxima rodada)`); }
  });
  todos().forEach(h=>{                            // respawn e limpeza
    if(h.morto){ h.morto--; if(!h.morto){ h.vida=h.vidaMax; h.pos=[...BASE[h.t][0]]; reg("b",`${h.n} voltou`);} }
    h.agiu=0; h.preso=Math.max(0,h.preso-1); h.intoc=0; h.esc=0; h.veuAtivo=0; h.semCura=Math.max(0,h.semCura-1);
  });
  desempilha();
  J.torres.forEach(t=>t.batida=0);                // torre volta a aceitar golpe de herói
  J.times.forEach(t=>{t.caca=null;t.cacaRevelada=null;t.ward=0;});
  if(J.fim!==null){ pinta(); return telaFim(); }
  /* a iniciativa alterna. Antes `primeiro` era 0 e nunca mudava: o mesmo time
     jogava primeiro nas ~12 rodadas seguidas, e isso valia 60,3% de vitórias.
     Alternando cai para 56,8% (3000 partidas por medição, ver sim/). */
  J.primeiro=1-J.primeiro;
  J.rodada++; reg("r",`— rodada ${J.rodada} — começa ${NOMES[J.primeiro]}`);
  const p=J.poco;                                 // o poço reabre, com o morador da vez
  if(p.vida<=0&&J.rodada>=p.volta){
    p.id=morador(J.rodada);
    const d=EPICO[p.id];
    p.vidaMax=d.vida; p.vida=d.vida;
    reg("b",`${d.n} desceu ao poço — ${d.pre} está em jogo`);
  }
  pinta(); faseOculta();
}

/* ---------- AÇÕES ---------- */
/* calcula() mora na seção ESTADO DE INTERAÇÃO — é a versão baseada em `modo`. */
function moveAte(c,r){
  const h=selHeroi; if(!h)return;
  const d=dist(...h.pos,c,r), custo=Math.max(0,d-(ehAgil(h)?1:0));
  if(custo>J.mov.rest)return;
  h.pos=[c,r]; J.mov.rest-=custo;
  reg(J.vez?"c":"a",
    `${h.n} anda ${d} ${d>1?"casas":"casa"}${ehAgil(h)&&d>0?" (ágil)":""} — movimento restante ${J.mov.rest}`);
  calcula(); pinta();
}
function usaHab(alvo){
  const{h,forca}=ativo, hb=h.habs[habSel], F=forca, ef=hb.ef;
  if(F<hb.f)return;
  const critico=ativo.seis;
  let txt=`${h.n} usa ${hb.n} (Força ${F})`;

  const poder=poderTotal(h)+(h.recarga?h.recarga:0)+dupla(h);
  const base=(mult)=>Math.round(F*mult)+poder;

  if(ef.doar){ ativo={h:alvo,forca:F,seis:critico}; alvo.agiu=1; habSel=null; selHeroi=alvo;
    reg(J.vez?"c":"a",`${h.n} doa o dado para ${alvo.n} (Força ${F})`); calcula(); return pinta(); }
  if(ef.escudo){ alvo.esc+=F+ef.escudo; txt+=` — escudo ${F+ef.escudo} em ${alvo.n}`; }
  if(ef.cura){ if(h.semCura){txt+=' — CURA BLOQUEADA';} else {h.vida=Math.min(h.vidaMax,h.vida+ef.cura); txt+=` — cura ${ef.cura}`;} }
  if(ef.ouro){ h.ouro+=ef.ouro; txt+=` (+${ef.ouro} de ouro)`; }
  if(ef.recarga){ h.recarga=ef.recarga; txt+=` — próximo golpe +${ef.recarga}`; }
  if(ef.intocavel){ h.intoc=1; txt+=" — intocável até o próximo turno"; }
  if(ef.ward){ J.times[h.t].ward=1; const z=J.times[1-h.t].caca;
    txt+=z?` — WARD: o Caçador inimigo foi para ${z.toUpperCase()}`:" — ward posta"; }
  if(ef.revive&&alvo.morto){ alvo.morto=Math.max(1,alvo.morto-1); txt+=` — ${alvo.n} volta 1 rodada antes`; }
  if(ef.marca){ alvo.marca=ef.marca; txt+=` — ${alvo.n} marcado (+${ef.marca})`; }

  if(ef.dano||ef.danoFixo){
    let d = ef.danoFixo ? ef.danoFixo : base(ef.dano);
    if(ef.extra)d+=ef.extra;
    if(ef.bonusFerido&&alvo.vida<=alvo.vidaMax/2)d+=ef.bonusFerido;
    if(ef.executa&&alvo.vida<=ef.executa){ reg("b",`EXECUÇÃO — ${h.n} elimina ${alvo.n}`); mata(alvo,h); }
    else aplicaDano(h,alvo,d,txt,habSel===2||h.habs[habSel].f>=5);
    if(ef.area) vizinhos(...alvo.pos).map(p=>em(...p)).filter(o=>o&&o.t!==h.t)
      .forEach(o=>aplicaDano(h,o,Math.round(d/2)));
    if(ef.ouroSeMatar&&alvo.morto)h.ouro+=ef.ouroSeMatar;
    h.recarga=0;
  }else reg(J.vez?"c":"a",txt);

  if(ef.danoVizinhos) vizinhos(...h.pos).map(p=>em(...p)).filter(o=>o&&o.t!==h.t)
    .forEach(o=>aplicaDano(h,o,base(ef.danoVizinhos)));
  if(ef.danoRaio) todos().filter(o=>!o.morto&&o.t!==h.t&&dist(...h.pos,...o.pos)<=ef.danoRaio)
    .forEach(o=>aplicaDano(h,o,F+poder));
  if(ef.prendeVizinhos) vizinhos(...h.pos).map(p=>em(...p)).filter(o=>o&&o.t!==h.t)
    .forEach(o=>{o.preso=2;reg("b",`${o.n} está preso`);});
  if(ef.prende&&alvo){ alvo.preso=2; reg("b",`${alvo.n} está preso`); }
  if(ef.puxar&&alvo&&!alvo.morto) desloca(alvo,h.pos,-1,ef.puxar);
  if(ef.empurrar&&alvo&&!alvo.morto) desloca(alvo,h.pos,1,ef.empurrar);
  if(critico) reg("b","CRÍTICO — dado 6 natural");

  ativo=null; habSel=null; calcula(); pinta();
}
function dupla(h){                                   /* atirador perto do suporte */
  if(h.pos_!=="adc"&&CATALOGO[h.id].pos!=="adc")return 0;
  const sup=J.times[h.t].herois.find(x=>CATALOGO[x.id].pos==="sup");
  return sup&&!sup.morto&&dist(...h.pos,...sup.pos)<=2?2:0;
}
/* arrasta o alvo até n casas: dir -1 puxa para perto de `de`, dir +1 empurra para longe.
   Anda uma casa por vez e só aceita passo que melhore a distância — se travar, para onde está. */
function desloca(alvo,de,dir,n=1){
  for(let p=0;p<n;p++){
    const atual=dist(...alvo.pos,...de);
    const passo=vizinhos(...alvo.pos)
      .filter(v=>!em(...v))
      .map(v=>[v,dist(...v,...de)])
      .filter(([,d])=>dir<0 ? d<atual : d>atual)
      .sort((a,b)=>dir<0 ? a[1]-b[1] : b[1]-a[1])[0];
    if(!passo)break;
    alvo.pos=passo[0];
  }
}
function aplicaDano(quem,alvo,bruto,txt,ehUlt){
  if(alvo.intoc){ reg("b",`${alvo.n} está intocável — sem efeito`); return; }
  if(ehUlt&&bonus(alvo,"veu")&&!alvo.veuAtivo){
    alvo.veuAtivo=1; reg("b",`VÉU PRISMÁTICO — ${alvo.n} anula a Ultimate`); return; }
  let d=Math.max(1,bruto+(alvo.marca||0)-armTotal(alvo));
  alvo.marca=0;
  if(alvo.esc>0){ const abs=Math.min(alvo.esc,d); alvo.esc-=abs; d-=abs;
    if(abs)reg("b",`escudo de ${alvo.n} absorve ${abs}`); }
  alvo.vida-=d;
  reg(quem.t?"c":"a",`${txt||quem.n+" ataca"} → ${d} em ${alvo.n} (${Math.max(0,alvo.vida)}/${alvo.vidaMax})`);
  const rb=bonus(quem,"roubo");
  if(rb&&quem.vida>0){ quem.vida=Math.min(quem.vidaMax,quem.vida+rb); reg("b",`${quem.n} rouba ${rb} de vida`); }
  if(bonus(quem,"antiCura")){ alvo.semCura=2; }
  const esp=bonus(alvo,"espinho");
  if(esp&&dist(...quem.pos,...alvo.pos)<=1&&quem.vida>0){
    quem.vida-=esp; reg("b",`espinhos de ${alvo.n} devolvem ${esp}`);
    if(quem.vida<=0) mata(quem,alvo); }
  if(alvo.vida<=0) mata(alvo,quem);
}
function mata(alvo,quem){
  alvo.vida=0; alvo.morto=2; alvo.esc=0; alvo.intoc=0;
  quem.ouro+=4;
  reg("b",`☠ ${alvo.n} morreu — ${quem.n} leva 4 de ouro`);
}

/* ---------- PLACAS ---------- */
function usaPlaca(delta){
  const tm=J.times[J.vez];
  if(tm.placas<1||dadoSel===null||J.dados[dadoSel].usado)return;
  const d=J.dados[dadoSel];
  const nv=d.v+delta; if(nv<1||nv>6)return;
  d.v=nv; tm.placas--;
  reg("b",`${NOMES[J.vez]} gasta 1 placa: dado vira ${nv}`);
  pinta();
}
function rerola(){
  const tm=J.times[J.vez];
  if(tm.placas<2||dadoSel===null||J.dados[dadoSel].usado)return;
  tm.placas-=2; J.dados[dadoSel].v=1+Math.floor(Math.random()*6);
  reg("b",`${NOMES[J.vez]} gasta 2 placas: re-rola para ${J.dados[dadoSel].v}`);
  pinta();
}


/* abreLoja mora na seção FICHAS / LOJA / LOG — é a versão em sheet, que roda. */

/* ══════════════════ BASE VISUAL ══════════════════ */
const NS="http://www.w3.org/2000/svg";
const el=(t,a={})=>{const e=document.createElementNS(NS,t);for(const q in a)e.setAttribute(q,a[q]);return e;};
const svg=document.getElementById("mapa");
const palco=document.getElementById("palco");
const G=id=>document.getElementById(id);
function vibra(p){ if(navigator.vibrate) try{navigator.vibrate(p);}catch(e){} }

/* ícones por natureza da habilidade — lidos do próprio efeito, sem tabela paralela */
const ICO={
  espada:"M6 18L18 6M14 6h4v4M7 15l2 2",
  mira:"M12 3v3M12 18v3M3 12h3M18 12h3M12 7a5 5 0 100 10 5 5 0 000-10",
  raio:"M13 3L6 13h5l-1 8 7-10h-5z",
  escudo:"M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z",
  cruz:"M12 6v12M6 12h12",
  corrente:"M10 8h4a4 4 0 010 8h-4a4 4 0 010-8M9 12h6",
  olho:"M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6",
  estrela:"M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z",
  dado:"M5 5h14v14H5zM9 9h.01M15 9h.01M9 15h.01M15 15h.01",
  passos:"M12 20V6M6 12l6-6 6 6",
  oculto:"M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M6.5 6.6C4 8.2 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.3-.9"
};
function iconeDe(hb){
  const e=hb.ef;
  if(e.ward) return ICO.olho;
  if(e.intocavel) return ICO.oculto;
  if(e.doar) return ICO.dado;
  if(e.revive) return ICO.cruz;
  if(e.escudo) return ICO.escudo;
  if(e.cura) return ICO.cruz;
  if(e.danoVizinhos||e.danoRaio||e.area) return ICO.estrela;
  if(e.danoFixo) return ICO.raio;
  if(e.puxar||e.empurrar||e.prende||e.prendeVizinhos||e.marca) return ICO.corrente;
  if(e.dano) return ICO.espada;
  return ICO.passos;
}
const svgIco=(d,cls="")=>`<svg viewBox="0 0 24 24" class="${cls}"><path d="${d}"/></svg>`;

/* descrição legível do efeito — o jogador nunca precisa decorar */
function descreve(h,hb,F){
  const e=hb.ef, p=poderTotal(h);
  const t=[];
  if(e.danoFixo) t.push(`${e.danoFixo} de dano`);
  else if(e.dano){
    const base=F!=null?Math.round(F*e.dano)+p+(e.extra||0):null;
    t.push(base!=null?`~${base} de dano`:`Força + ${p} de dano`);
  }
  if(e.area) t.push("respinga nos vizinhos");
  if(e.danoVizinhos) t.push("dano em todos os vizinhos");
  if(e.danoRaio) t.push(`dano em todos até ${e.danoRaio} casas`);
  if(e.escudo) t.push(`escudo ${F!=null?F+e.escudo:"Força+"+e.escudo}`);
  if(e.cura) t.push(`cura ${e.cura}`);
  if(e.ouro) t.push(`+${e.ouro} de ouro`);
  if(e.recarga) t.push(`próximo golpe +${e.recarga}`);
  if(e.intocavel) t.push("fica intocável");
  if(e.ward) t.push("revela o Caçador inimigo");
  if(e.revive) t.push("acelera o respawn de um aliado");
  if(e.marca) t.push(`marca: próximo dano +${e.marca}`);
  if(e.doar) t.push("passa este dado a um aliado");
  if(e.puxar) t.push("puxa");
  if(e.empurrar) t.push("empurra");
  if(e.prende||e.prendeVizinhos) t.push("prende");
  if(e.executa) t.push(`executa com ${e.executa} de vida ou menos`);
  if(e.bonusFerido) t.push(`+${e.bonusFerido} em alvo ferido`);
  if(e.semAlcance) t.push("qualquer distância");
  return t.join(" · ")||"—";
}

/* ══════════════════ EFEITOS DE TELA ══════════════════ */
function fx(pos,txt,tipo){
  const [x,y]=centro(...pos);
  let px,py;
  try{
    const pt=svg.createSVGPoint(); pt.x=x; pt.y=y;
    const sp=pt.matrixTransform(svg.getScreenCTM());
    const pr=palco.getBoundingClientRect();
    px=sp.x-pr.left; py=sp.y-pr.top;
  }catch(e){ return; }
  const d=document.createElement("div");
  d.className="flut "+tipo; d.textContent=txt;
  d.style.left=px+"px"; d.style.top=py+"px";
  G("fx").appendChild(d);
  setTimeout(()=>d.remove(),1050);
}
function toast(txt,tipo){
  const d=document.createElement("div");
  d.className="tst"+(tipo?" "+tipo:""); d.textContent=txt;
  G("toast").appendChild(d);
  setTimeout(()=>d.remove(),2300);
}
function tremer(h){
  const g=svg.querySelector(`[data-peca="${h.t}-${h.id}"]`);
  if(!g)return;
  g.classList.remove("treme"); void g.getBBox(); g.classList.add("treme");
  setTimeout(()=>g.classList.remove("treme"),360);
}
function fotografa(){ return new Map(todos().map(h=>[h,{v:h.vida,e:h.esc,m:h.morto}])); }
function revela(snap){
  let bateu=false;
  todos().forEach(h=>{
    const s=snap.get(h); if(!s)return;
    const dv=h.vida-s.v;
    if(dv<0){ fx(h.pos,dv,"dano"); tremer(h); bateu=true; }
    else if(dv>0) fx(h.pos,"+"+dv,"cura");
    if(h.esc>s.e) fx(h.pos,"⛨"+(h.esc-s.e),"esc");
    if(h.morto&&!s.m){ fx(h.pos,"☠","morte"); toast(h.n+" caiu","morte"); vibra([35,55,35]); }
  });
  if(bateu) vibra(18);
}
const _usaHab=usaHab;
usaHab=function(alvo){ const s=fotografa(); _usaHab(alvo); revela(s); };
const _revelaCaca=revelaCaca;
revelaCaca=function(t){
  const z=J.times[t].caca, s=fotografa();
  _revelaCaca(t);
  if(z&&z!=="selva"&&!J.fim) toast("GANK NO "+z.toUpperCase(),"gank");
  revela(s);
};

/* animação de deslocamento da peça */
let animandoDe=null;
function animaMovimento(h,de){
  const g=svg.querySelector(`[data-peca="${h.t}-${h.id}"]`);
  if(!g||!de)return;
  const [x0,y0]=centro(...de), [x1,y1]=centro(...h.pos);
  const esc=(()=>{ try{ const m=svg.getScreenCTM(); return m?m.a:1; }catch(e){ return 1; } })();
  try{
    g.animate([{transform:`translate(${(x0-x1)*esc}px,${(y0-y1)*esc}px)`},{transform:"none"}],
      {duration:300,easing:"cubic-bezier(.3,.9,.3,1)"});
  }catch(e){}
}

/* ══════════════════ TELAS ══════════════════ */
function abre(html,aoOk){
  G("tela").classList.add("on");
  G("telacx").innerHTML=html;
  const b=G("ok"); if(b&&aoOk)b.onclick=aoOk;
}
function fecha(){ G("tela").classList.remove("on"); }

let sheetAberto=null;
function abreSheet(tit,html){
  sheetAberto=tit; G("shTit").textContent=tit; G("shCorpo").innerHTML=html;
  G("sheet").classList.add("on"); G("veu").classList.add("on");
}
function fechaSheet(){ sheetAberto=null; G("sheet").classList.remove("on"); G("veu").classList.remove("on"); }
G("shX").onclick=fechaSheet; G("veu").onclick=fechaSheet;

/* ══════════════════ ESTADO DE INTERAÇÃO ══════════════════
   Um modo por vez. Nunca dois gestos disputando o mesmo toque.
   null → só olhando | "mover" → escolhendo casa | "mirar" → escolhendo alvo        */
let modo=null, habAtual=null, confirmar=null;

function limpaModo(){ modo=null; habAtual=null; confirmar=null; ativo=null; habSel=null; calcula(); }
function cancela(){ limpaModo(); selHeroi=null; pinta(); }

function calcula(){
  mover=[]; alvos=[]; alvosTorre=[]; alvosEpico=[];
  if(modo==="mover"&&selHeroi&&!selHeroi.morto&&selHeroi.t===J.vez&&!selHeroi.preso&&J.mov.rest>0){
    const teto=J.mov.rest+(ehAgil(selHeroi)?1:0);
    for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
      if(em(c,r))continue;
      const d=dist(...selHeroi.pos,c,r);
      if(d>0&&d<=teto) mover.push([c,r]);
    }
  }
  if(modo==="mirar"&&selHeroi&&habAtual!==null){
    const h=selHeroi, hb=h.habs[habAtual], alc=alcTotal(h)+(hb.ef.alcExtra||0);
    alvos=todos().filter(o=>{
      if(o.morto)return false;
      if(hb.alvo==="in"&&(o.t===h.t||o.intoc))return false;
      if(hb.alvo==="al"&&(o.t!==h.t||o===h))return false;
      if(hb.ef.doar&&o.agiu)return false;      // doar dado para quem já agiu era jogar fora
      if(hb.alvo==="eu")return o===h;
      return hb.ef.semAlcance||dist(...h.pos,...o.pos)<=alc;
    });
    alvosTorre=torresAoAlcance(h,hb,alc);
    alvosEpico=epicosAoAlcance(h,hb,alc);
  }
}
/* O épico não tem dono, então não tem a trava da onda que a torre tem: qualquer um
   bate, a qualquer hora, quantas vezes quiser. É de propósito — o último golpe leva
   o prêmio inteiro, e é essa janela que transforma o objetivo em briga. */
function epicosAoAlcance(h,hb,alc){
  if(!(hb.ef.dano||hb.ef.danoFixo)||hb.alvo!=="in") return [];
  if(J.poco.vida<=0) return [];
  return (hb.ef.semAlcance||dist(...h.pos,...POCO)<=alc) ? [J.poco] : [];
}
/* Uma torre só é alvo se a SUA onda já está encostada nela. Sem isso, um assassino
   sozinho derrubaria a base pelas costas — no MOBA quem derruba torre é a onda, o
   herói só acelera. Uma torre aguenta um golpe de herói por rodada. */
function torresAoAlcance(h,hb,alc){
  if(!(hb.ef.dano||hb.ef.danoFixo)||hb.alvo!=="in") return [];
  return J.torres.filter(tr=>{
    if(tr.t===h.t||tr.vida<=0||tr.batida) return false;
    if(J.frentes[tr.rota]!==tr.i) return false;
    return hb.ef.semAlcance||dist(...h.pos,...ROTAS[tr.rota][tr.i])<=alc;
  });
}

/* dado que será gasto: o escolhido à mão, senão o menor que atende */
function dadoPara(hb){
  if(dadoSel!==null&&!J.dados[dadoSel].usado&&J.dados[dadoSel].v>=hb.f) return dadoSel;
  let melhor=null;
  J.dados.forEach((d,i)=>{
    if(d.usado||d.v<hb.f)return;
    if(melhor===null||d.v<J.dados[melhor].v) melhor=i;
  });
  return melhor;
}

function escolheHeroi(h){
  if(cliqueBloqueado||J.fase!=="jogando")return;
  if(modo==="mirar"&&alvos.includes(h)) return confirmaHab(h);
  if(h.t!==J.vez||h.morto){ // inspeciona o adversário sem mudar de estado
    abreCarta(h); return;
  }
  limpaModo();
  selHeroi = selHeroi===h ? null : h;
  pinta();
}
function iniciaMover(){
  if(!selHeroi||J.mov.rest<=0)return;
  if(selHeroi.preso) return toast("preso nesta rodada","morte");
  modo = modo==="mover" ? null : "mover";
  habAtual=null; confirmar=null; calcula(); vibra(8); pinta();
}
function iniciaHab(i){
  if(!selHeroi)return;
  /* um dado de ação por herói por rodada. É o que o manual sempre prometeu:
     3 dados para 5 heróis, e quem fica de fora farma 3. Sem esta trava dava
     para empilhar os 3 dados no mesmo herói e atacar três vezes. */
  if(selHeroi.agiu) return toast("já agiu nesta rodada","morte");
  const hb=selHeroi.habs[i];
  const d=dadoPara(hb);
  if(d===null) return toast("nenhum dado chega a Força "+hb.f,"morte");
  if(confirmar===i) return confirmaHab(hb.alvo==="eu"?selHeroi:null);
  modo="mirar"; habAtual=i; calcula();
  if(hb.alvo==="eu"){ confirmar=i; vibra(8); return pinta(); }
  if(!alvos.length&&!alvosTorre.length&&!alvosEpico.length){
    limpaModo(); pinta();
    return toast(hb.alvo==="al"?"nenhum aliado no alcance":"ninguém no alcance","morte");
  }
  confirmar=null; vibra(8); pinta();
}
function confirmaHab(alvo){
  if(!selHeroi||habAtual===null)return;
  const hb=selHeroi.habs[habAtual];
  const di=dadoPara(hb);
  if(di===null)return;
  const d=J.dados[di];
  d.usado=1; selHeroi.agiu=1;
  ativo={h:selHeroi,forca:d.v,seis:d.v===6};
  habSel=habAtual;
  reg(J.vez?"c":"a",`${selHeroi.n} usa ${hb.n} com o dado ${d.v}`);
  dadoSel=null; vibra(14);
  usaHab(alvo||selHeroi);
  modo=null; habAtual=null; confirmar=null; ativo=null; habSel=null;
  calcula(); pinta();
}
/* o golpe na torre não passa por usaHab: torre não tem armadura, escudo nem status.
   Dano fixo, um por rodada, e o revide é o preço de encostar. */
function atacaTorre(tr){
  if(!selHeroi||habAtual===null)return;
  const h=selHeroi, hb=h.habs[habAtual], di=dadoPara(hb);
  if(di===null)return;
  J.dados[di].usado=1; h.agiu=1; dadoSel=null; vibra(16);

  tr.vida-=DANO_TORRE; tr.batida=1;
  reg(J.vez?"c":"a",`${h.n} bate na torre do ${tr.rota} com ${hb.n} `+
      `(${Math.max(0,tr.vida)}/${VIDA_TORRE})`);
  fx(ROTAS[tr.rota][tr.i],"-"+DANO_TORRE,"dano");

  if(tr.vida<=0){
    reg("b",`TORRE CAIU — ${tr.rota}, lado ${NOMES[tr.t]}`);
    toast("TORRE CAIU","gank"); vibra([40,60,40]);
  }else{
    /* o revide nunca mata: a torre é pedágio, não morte sem autor —
       senão `mata()` ficaria sem quem creditar o ouro */
    const levou=Math.min(REVIDE_TORRE,h.vida-1);
    if(levou>0){ h.vida-=levou; reg("b",`a torre revida — ${levou} em ${h.n}`);
      fx(h.pos,-levou,"dano"); tremer(h); }
  }
  modo=null; habAtual=null; confirmar=null; ativo=null; habSel=null;
  calcula(); pinta();
}

/* mesma porta da torre: dano fixo, sem armadura e sem status — mas sem a trava de
   um golpe por rodada, e com o prêmio indo para quem der o último. */
function atacaEpico(ep){
  if(!selHeroi||habAtual===null)return;
  const h=selHeroi, hb=h.habs[habAtual], di=dadoPara(hb);
  if(di===null)return;
  const d=EPICO[ep.id];
  J.dados[di].usado=1; h.agiu=1; dadoSel=null; vibra(16);

  ep.vida--;
  reg(J.vez?"c":"a",`${h.n} golpeia o ${d.n} com ${hb.n} (${Math.max(0,ep.vida)}/${ep.vidaMax})`);
  fx(POCO,"-1","dano");

  if(ep.vida<=0) levaEpico(ep,h.t);
  else{
    /* o revide nunca mata, pelo mesmo motivo da torre: `mata()` precisa de autor
       para creditar o ouro, e monstro neutro não é autor. */
    const levou=Math.min(d.revide,h.vida-1);
    if(levou>0){ h.vida-=levou; reg("b",`o ${d.n} revida — ${levou} em ${h.n}`);
      fx(h.pos,-levou,"dano"); tremer(h); }
  }
  modo=null; habAtual=null; confirmar=null; ativo=null; habSel=null;
  calcula(); pinta();
}
/* Dragão compõe para sempre, Barão queima em duas rodadas. O Poder entra por
   `extraPoder` — nunca por poderTotal, que é const e mata o script inteiro. */
function levaEpico(ep,t){
  const tm=J.times[t];
  ep.volta=J.rodada+EPICO[ep.id].volta;
  if(ep.id==="dragao"){
    tm.dragoes++;
    tm.herois.forEach(h=>h.extraPoder+=DRAGAO_PODER);
    reg("b",`${NOMES[t]} levou o Dragão — Herança do Dragão ${tm.dragoes}`
           +` (+${DRAGAO_PODER} de Poder no time, para sempre)`);
  }else{
    if(!tm.barao) tm.herois.forEach(h=>h.extraPoder+=BARAO_PODER);
    tm.barao=BARAO_RODADAS; tm.baroes++;
    reg("b",`${NOMES[t]} levou o Barão — Fúria por ${BARAO_RODADAS} rodadas`
           +` (+${BARAO_PODER} de Poder e as ondas avançam sozinhas)`);
  }
  toast(EPICO[ep.id].n.toUpperCase()+" É DO "+NOMES[t],"gank"); vibra([40,60,40,60,80]);
}

/* ══════════════════ ARRASTAR PARA MOVER ══════════════════ */
/* Pegar o herói, arrastar e soltar na casa. O caminho antigo continua inteiro —
   tocar, abrir o comando, tocar MOVER, tocar a casa: o arrasto só nasce depois que
   o dedo anda LIMIAR px, e antes disso tudo é toque normal.

   Os eventos ficam no <svg>, não na peça. `pinta()` reconstrói o mapa inteiro toda
   vez, e um handler preso à peça morreria junto com ela no meio do arrasto —
   inclusive o `setPointerCapture`, que é o que garante receber o `pointerup` mesmo
   se o dedo sair de cima do elemento. */
const LIMIAR_ARRASTO=7;
let arr=null, cliqueBloqueado=false;

function paraSVG(ev){
  const ctm=svg.getScreenCTM(); if(!ctm) return null;
  const p=svg.createSVGPoint(); p.x=ev.clientX; p.y=ev.clientY;
  const q=p.matrixTransform(ctm.inverse());
  return [q.x,q.y];
}
/* casa sob o dedo: a mais próxima em coordenada de mapa, com folga de um raio.
   Folga generosa é de propósito — dedo não é cursor. */
function hexSob(ev){
  const p=paraSVG(ev); if(!p) return null;
  let melhor=null,d0=Infinity;
  for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
    const[x,y]=centro(c,r), d=(x-p[0])**2+(y-p[1])**2;
    if(d<d0){ d0=d; melhor=[c,r]; }
  }
  return d0<=(R*1.1)**2 ? melhor : null;
}
const podeArrastar=h=>h&&!h.morto&&h.t===J.vez&&J.fase==="jogando"
  &&!h.preso&&J.mov.rest>0&&!sheetAberto;

function heroiDaPeca(no){
  const d=no&&no.getAttribute("data-peca"); if(!d) return null;
  const i=d.indexOf("-");
  return J.times[+d.slice(0,i)].herois.find(x=>x.id===d.slice(i+1));
}
function marcaArrasto(ev,destino){
  svg.querySelectorAll(".hx.sob").forEach(e=>e.classList.remove("sob"));
  if(destino){
    const e=svg.querySelector(`[data-hex="${k(...destino)}"]`);
    if(e) e.classList.add("sob");
  }
  const g=svg.querySelector(`[data-peca="${arr.h.t}-${arr.h.id}"]`);
  const p=paraSVG(ev); if(!g||!p) return;
  const[x,y]=centro(...arr.h.pos);
  g.setAttribute("transform",`translate(${(p[0]-x).toFixed(1)} ${(p[1]-y).toFixed(1)})`);
  g.classList.add("arrastada");
}
svg.addEventListener("pointerdown",ev=>{
  const alvo=ev.target.closest?ev.target.closest(".peca"):null;
  const h=heroiDaPeca(alvo);
  if(!podeArrastar(h))return;
  arr={h,x0:ev.clientX,y0:ev.clientY,pid:ev.pointerId,ativo:false,destino:null};
});
svg.addEventListener("pointermove",ev=>{
  if(!arr||ev.pointerId!==arr.pid)return;
  if(!arr.ativo){
    if(Math.hypot(ev.clientX-arr.x0,ev.clientY-arr.y0)<LIMIAR_ARRASTO)return;
    arr.ativo=true;
    try{ svg.setPointerCapture(arr.pid); }catch(e){}
    /* NÃO chamar pinta() aqui. Selecionar o herói faz o painel de comando crescer,
       o palco encolher e o mapa inteiro se redimensionar — no meio do gesto, com o
       dedo encostado. Medido: a casa sob o dedo mudava de [0,5] para [0,7] só por
       causa disso. O alcance é calculado sem tocar na tela e as casas são realçadas
       na marra, direto nos polígonos que já estão no DOM. */
    const selAntes=selHeroi, modoAntes=modo;
    selHeroi=arr.h; modo="mover"; calcula();
    arr.alcance=mover.slice();
    selHeroi=selAntes; modo=modoAntes; calcula();
    const s=new Set(arr.alcance.map(p=>k(...p)));
    svg.querySelectorAll(".hx").forEach(e=>
      e.classList.toggle("mover",s.has(e.getAttribute("data-hex"))));
    svg.classList.add("arrastando"); vibra(8);
  }
  ev.preventDefault();
  const alvo=hexSob(ev);
  arr.destino = alvo&&arr.alcance.some(([c,r])=>c===alvo[0]&&r===alvo[1]) ? alvo : null;
  marcaArrasto(ev,arr.destino);
});
function soltaArrasto(ev){
  if(!arr||ev.pointerId!==arr.pid)return;
  const a=arr; arr=null;
  try{ svg.releasePointerCapture(a.pid); }catch(e){}
  svg.classList.remove("arrastando");
  svg.querySelectorAll(".hx.sob").forEach(e=>e.classList.remove("sob"));
  if(!a.ativo)return;                       /* foi toque simples: deixa o clique seguir */
  /* o navegador ainda dispara um `click` depois do arrasto; sem esta trava ele
     abriria o comando do herói ou moveria de novo por cima do que acabou de sair */
  cliqueBloqueado=true; setTimeout(()=>{cliqueBloqueado=false;},350);
  /* só agora o herói é selecionado de fato: é o `pinta()` do fim que abre o painel,
     e aí a mudança de layout já não atrapalha gesto nenhum */
  if(a.destino){ limpaModo(); selHeroi=a.h; moveAte(...a.destino); }
  else pinta();
}
svg.addEventListener("pointerup",soltaArrasto);
svg.addEventListener("pointercancel",soltaArrasto);

const _moveAte=moveAte;
moveAte=function(c,r){
  if(!selHeroi)return;
  const de=[...selHeroi.pos];
  _moveAte(c,r);
  modo=null; calcula(); pinta();
  animaMovimento(selHeroi,de);
};

/* ══════════════════ MAPA ══════════════════ */
/* O dedo não mira no desenho, mira no hexágono. A peça do herói é desenhada com raio
   9,6 e a torre é um quadrado de 12 — no aparelho isso vira alvo de 25px e de 22px,
   contra os 44px de referência (e de 12px num celular de 667 de altura, medido).
   Este círculo invisível leva o alvo até a borda do hexágono sem mudar nada do desenho.
   15,5 é o teto: os centros vizinhos ficam a sqrt(3)*R ≈ 32,9 um do outro, então
   raio 16,45 já encostaria no vizinho e roubaria o toque dele. */
const R_TOQUE=15.5;
const alvoDeToque=(g,x,y,aoTocar)=>{
  const c=el("circle",{cx:x,cy:y,r:R_TOQUE,class:"toque"});
  if(aoTocar) c.onclick=aoTocar;
  g.appendChild(c);
  return c;
};
function desenhaMapa(){
  svg.textContent="";
  const gH=el("g"),gE=el("g"),gM=el("g"),gP=el("g");
  const moverS=new Set(mover.map(p=>k(...p)));

  for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
    let cls="hx ";
    if(BASE_S.has(k(c,r)))cls+="base"+BASE_S.get(k(c,r));
    else if(k(c,r)===POCO_K)cls+="poco";
    else if(LANE.has(k(c,r)))cls+="rota";
    else if(RIO_S.has(k(c,r)))cls+="rio";
    else cls+="selva";
    if(moverS.has(k(c,r)))cls+=" mover";
    const p=[];for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-90);const[x,y]=centro(c,r);
      p.push((x+R*Math.cos(a)).toFixed(1)+","+(y+R*Math.sin(a)).toFixed(1));}
    const hx=el("polygon",{points:p.join(" "),class:cls,"data-hex":k(c,r)});
    if(moverS.has(k(c,r))) hx.onclick=()=>{ if(cliqueBloqueado)return; vibra(9); moveAte(c,r); };
    gH.appendChild(hx);
  }
  [[BASE[0][0],L_TOPO,BASE[1][0]],[BASE[0][1],L_MEIO,BASE[1][1]],[BASE[0][1],L_BOT,BASE[1][1]]]
    .forEach(([a,l,b])=>gE.appendChild(el("polyline",
      {points:[a,...l,b].map(p=>centro(...p).map(n=>n.toFixed(1)).join(",")).join(" "),class:"estrada"})));

  const torreS=new Set(alvosTorre);
  J.torres.forEach(t=>{
    const[x,y]=centro(...ROTAS[t.rota][t.i]);
    const mirando=torreS.has(t);
    if(mirando) gM.appendChild(el("circle",{cx:x,cy:y,r:12.6,class:"mira-torre"}));
    const rc=el("rect",{x:x-6,y:y-6,width:12,height:12,transform:`rotate(45 ${x} ${y})`,
      class:"torre t"+t.t+(t.vida<=0?" caiu":"")+(mirando?" alvo":"")});
    if(mirando) rc.onclick=()=>{vibra(10);atacaTorre(t);};
    gM.appendChild(rc);
    if(mirando) alvoDeToque(gM,x,y,()=>{vibra(10);atacaTorre(t);});
    if(t.vida>0){const v=el("text",{x:x,y:y+2.2,class:"tvida"});v.textContent=t.vida;gM.appendChild(v);}
  });
  Object.entries(ROTAS).forEach(([nome,l])=>{
    const[x,y]=centro(...l[Math.max(0,Math.min(l.length-1,J.frentes[nome]))]);
    gM.appendChild(el("circle",{cx:x,cy:y,r:14,class:"frente"}));
  });

  /* o poço: retrato do morador e a vida por baixo. Vazio, ele mostra a rodada em
     que o próximo desce — o relógio da partida só vale se estiver visível. */
  (()=>{
    const ep=J.poco, [x,y]=centro(...POCO);
    if(ep.vida<=0){
      const g=el("g",{class:"poco-vazio"});
      g.appendChild(el("circle",{cx:x,cy:y,r:9}));
      const t=el("text",{x:x,y:y+3});t.textContent="R"+ep.volta;g.appendChild(t);
      return gM.appendChild(g);
    }
    const mirando=alvosEpico.includes(ep);
    const g=el("g",{class:"epico"+(mirando?" alvo":""),role:"img"});
    g.setAttribute("aria-label",`${EPICO[ep.id].n}, ${ep.vida} de vida`);
    if(mirando) g.appendChild(el("circle",{cx:x,cy:y,r:13.4,class:"mira-torre"}));
    g.appendChild(el("circle",{cx:x,cy:y,r:10.4,class:"fundo"}));
    const cid="cl-poco";
    const cp=el("clipPath",{id:cid});
    cp.appendChild(el("circle",{cx:x,cy:y,r:9}));
    const ip=el("image",{x:x-9,y:y-9,width:18,height:18,
      "clip-path":`url(#${cid})`,preserveAspectRatio:"xMidYMid slice"});
    ip.setAttribute("href",RETRATO_EPICO(ep.id));
    g.append(cp,ip);
    g.appendChild(el("circle",{cx:x,cy:y,r:10.4,class:"anel"}));
    const v=el("text",{x:x,y:y+15.6,class:"epvida"});v.textContent=ep.vida;g.appendChild(v);
    if(mirando){ g.onclick=()=>{vibra(10);atacaEpico(ep);}; alvoDeToque(g,x,y); }
    gM.appendChild(g);
  })();
  [0,1].forEach(t=>{
    const[x,y]=centro(...BASE[t][0]);
    gM.appendChild(el("circle",{cx:x,cy:y,r:10.5,class:"nexus t"+t}));
    const v=el("text",{x:x,y:y+2.4,class:"tvida"});v.textContent=Math.max(0,J.nexus[t]);gM.appendChild(v);
  });
  const rot=(txt,x,y)=>{const g=el("g",{class:"rotulo"}),w=txt.length*5.4+13;
    g.appendChild(el("rect",{x:x-w/2,y:y-6.5,width:w,height:13,rx:2}));
    const t=el("text",{x:x,y:y+2.2});t.textContent=txt;g.appendChild(t);gM.appendChild(g);};
  rot("TOPO",centro(...L_TOPO[6])[0],11);
  rot("BAIXO",centro(...L_BOT[2])[0],275);
  rot("MEIO",...centro(3,2));

  const alvoS=new Set(alvos.map(o=>o.id+o.t));
  todos().filter(h=>!h.morto).forEach(h=>{
    const[x,y]=centro(...h.pos);
    const ehAlvo=alvoS.has(h.id+h.t), ehSel=selHeroi===h;
    const foco=tutFoco==="peca:"+h.id;
    const g=el("g",{class:"peca t"+h.t+(ehSel?" sel":"")+(ehAlvo?" alvo":"")+(foco?" foco":""),
      tabindex:"0",role:"button","data-peca":h.t+"-"+h.id});
    g.setAttribute("aria-label",`${h.n}, ${h.vida} de vida`);
    alvoDeToque(g,x,y);                       // primeiro filho: o alvo vale o hexágono
    if(ehAlvo) g.appendChild(el("circle",{cx:x,cy:y,r:12.6,class:"mira"}));
    g.appendChild(el("circle",{cx:x,cy:y,r:9.6,class:"fundo"}));
    const cid="cl-"+h.t+h.id;
    const cp=el("clipPath",{id:cid});
    cp.appendChild(el("circle",{cx:x,cy:y,r:8.2}));
    const ip=el("image",{x:x-8.2,y:y-8.2,width:16.4,height:16.4,
      "clip-path":`url(#${cid})`,preserveAspectRatio:"xMidYMin slice"});
    ip.setAttribute("href",RETRATO(h.id));
    g.append(cp,ip);
    g.appendChild(el("circle",{cx:x,cy:y,r:9.6,class:"anel"}));

    const pc=Math.max(0,h.vida)/h.vidaMax, LB=17;
    const bg=el("g",{class:"barravida"});
    bg.appendChild(el("rect",{x:x-LB/2,y:y+10.4,width:LB,height:2.6,rx:1.3,fill:"#000","fill-opacity":".55"}));
    bg.appendChild(el("rect",{x:x-LB/2,y:y+10.4,width:(LB*pc).toFixed(2),height:2.6,rx:1.3,
      fill:pc>.5?"var(--vivo)":pc>.25?"var(--brass)":"var(--dano)"}));
    if(h.esc>0) bg.appendChild(el("rect",{x:x-LB/2,y:y+10.4,
      width:(LB*Math.min(1,h.esc/h.vidaMax)).toFixed(2),height:2.6,rx:1.3,
      fill:"var(--brass)","fill-opacity":".85"}));
    g.appendChild(bg);

    if(h.itens.length){
      g.append(el("circle",{cx:x+7.4,cy:y-7.4,r:3.6,class:"selo"}));
      const bt=el("text",{x:x+7.4,y:y-5.8,class:"selotxt"}); bt.textContent=h.itens.length; g.append(bt);
    }
    g.onclick=()=>escolheHeroi(h);
    g.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();escolheHeroi(h);}};
    gP.appendChild(g);
  });
  svg.append(gH,gE,gM,gP);
  const b=svg.getBBox();
  svg.setAttribute("viewBox",
    `${(b.x-5).toFixed(1)} ${(b.y-5).toFixed(1)} ${(b.width+10).toFixed(1)} ${(b.height+10).toFixed(1)}`);
}

/* ══════════════════ CARTA ══════════════════ */
function abreCarta(h){
  const P=POS[CATALOGO[h.id].pos];
  abreSheet(h.n,`
    <div class="carta-g" style="--pos:${P.cor}">
      <div class="arte"><img src="${RETRATO(h.id)}" alt=""><div class="grad"></div>
        <div class="id"><div class="nm">${h.n}</div><div class="ep">${P.n} · ${NOMES[h.t]}</div></div></div>
      <div class="faixa">
        <div><div class="k">Vida</div><div class="v">${Math.max(0,h.vida)}/${h.vidaMax}</div></div>
        <div><div class="k">Poder</div><div class="v">${poderTotal(h)}</div></div>
        <div><div class="k">Armad.</div><div class="v">${armTotal(h)}</div></div>
        <div><div class="k">Alcance</div><div class="v">${alcTotal(h)}</div></div>
      </div>
      <div class="lista">
        ${h.habs.map(hb=>`<div class="hb2">${svgIco(iconeDe(hb))}
          <div><span class="n">${hb.n}</span><span class="d">${descreve(h,hb)}</span></div>
          <span class="f">Força ${hb.f}${hb.f===6?"":"+"}</span></div>`).join("")}
      </div>
      ${h.itens.length?`<div class="itens-g">${h.itens.map(i=>
        `<figure><img src="${RETRATO_ITEM(i)}" alt=""><figcaption>${ITEM[i].n}</figcaption></figure>`).join("")}</div>`:""}
      <div class="rodape">${ehAgil(h)?"ágil · 1ª casa grátis · ":""}${CATALOGO[h.id].patamar?"escala por ouro · ":""}ouro ${h.ouro}</div>
    </div>`);
}

/* ══════════════════ FICHAS / LOJA / LOG ══════════════════ */
function fichaHTML(h,meu){
  const pc=Math.max(0,h.vida)/h.vidaMax*100, esc=Math.min(100-pc,h.esc/h.vidaMax*100);
  const P=POS[CATALOGO[h.id].pos];
  const selos=[
    h.morto?`<span class="selo-est mal">volta em ${h.morto}</span>`:"",
    h.preso?'<span class="selo-est mal">preso</span>':"",
    h.intoc?'<span class="selo-est">intocável</span>':"",
    h.recarga?'<span class="selo-est">carregado</span>':"",
    h.marca?'<span class="selo-est mal">marcado</span>':"",
    h.pat?`<span class="selo-est">patamar ${h.pat}</span>`:""
  ].join("");
  return `<div class="fic${h.morto?" morto":""}${selHeroi===h?" sel":""}"
       style="--pos:${P.cor}" data-sel="${h.t}-${h.id}">
    <img class="rosto" src="${RETRATO(h.id)}" alt="">
    <div class="col">
      <div class="l1"><span class="nm">${h.n}</span><span class="ps">${P.n}</span>
        ${meu&&!h.agiu&&!h.morto&&J.fase==="jogando"?'<span class="farm">FARM +3</span>':""}</div>
      <div class="vb"><i style="width:${pc}%"></i><i class="esc" style="width:${esc}%"></i></div>
      <div class="l3"><span>♥ <b>${Math.max(0,h.vida)}</b>/${h.vidaMax}</span>
        <span>⚔ <b>${poderTotal(h)}</b></span><span>⛨ <b>${armTotal(h)}</b></span>
        <span>◈ <b>${h.ouro}</b></span></div>
      ${h.itens.length?`<div class="itens">${h.itens.map(i=>
        `<img src="${RETRATO_ITEM(i)}" title="${ITEM[i].n}" alt="">`).join("")}</div>`:""}
      ${selos?`<div class="itens">${selos}</div>`:""}
    </div></div>`;
}
function abreTime(){
  const meu=J.vez, out=1-meu, tm=J.times[meu];
  const btPrio = tm.prio&&J.fase==="jogando"
    ? `<button class="grande" id="btPrioReal" style="margin-bottom:12px;font-size:15px;padding:13px">
         ⚡ Usar prioridade — rolar +1 dado (${tm.prio})</button>` : "";
  abreSheet("Time", btPrio+
    `<div class="fichas">${J.times[meu].herois.map(h=>fichaHTML(h,true)).join("")}</div>
     <div style="font-family:var(--carto);font-size:9px;letter-spacing:.2em;text-transform:uppercase;
       color:var(--ink-3);margin:16px 0 8px">Adversário · ${NOMES[out]}</div>
     <div class="fichas">${J.times[out].herois.map(h=>fichaHTML(h,false)).join("")}</div>`);
  G("shCorpo").querySelectorAll("[data-sel]").forEach(e=>e.onclick=()=>{
    const[t,id]=e.dataset.sel.split("-");
    const h=J.times[+t].herois.find(x=>x.id===id);
    if(+t===J.vez&&!h.morto){ limpaModo(); selHeroi=h; fechaSheet(); pinta(); }
    else abreCarta(h);
  });
  const bp=G("btPrioReal"); if(bp) bp.onclick=()=>{ usaPrioridade(); fechaSheet(); };
}
function abreLog(){
  abreSheet("Histórico",
    `<div class="linhas">${J.log.slice(0,70).map(l=>`<div class="${l.cls}">${l.txt}</div>`).join("")}</div>`);
}
function abreLoja(){
  const t=J.vez, tm=J.times[t];
  /* morto está na base esperando respawn — é a janela de compra clássica de MOBA.
     A regra sempre disse "na base ou morto"; o filtro é que excluía o morto. */
  const naLoja=tm.herois.filter(h=>h.morto||naBase(h));
  if(!naLoja.length){
    abreSheet("Loja fechada",
      `<p style="color:var(--ink-2);font-size:14px;line-height:1.55;margin:0">
        Só compra quem está <b style="color:var(--ink)">na própria base</b> ou morto.
        Gaste movimento para voltar — é o custo real de fazer compras no meio da partida.</p>`);
    return;
  }
  let quem=lojaHeroi&&naLoja.includes(lojaHeroi)?lojaHeroi:naLoja[0];
  lojaHeroi=quem;
  const abas=naLoja.map(h=>`<button class="abaH${h===quem?" on":""}" data-h="${h.id}">
      <img src="${RETRATO(h.id)}" alt=""><span>${h.n}</span><i>${h.ouro}◈</i></button>`).join("");
  const cards=ITENS.map(it=>{
    const preco=Math.max(0,it.o-descontos[t]);
    const tem=quem.itens.includes(it.id), cheio=quem.itens.length>=(quem.slots||3), pode=quem.ouro>=preco&&!tem&&!cheio;
    return `<button class="itC${pode?"":" off"}${tem?" tem":""}" data-i="${it.id}" ${pode?"":"disabled"}>
      <img src="${RETRATO_ITEM(it.id)}" alt=""><span class="iN">${it.n}</span>
      <span class="iD">${it.d}</span>
      <span class="iO">${tem?"comprado":cheio?(quem.slots||3)+" slots cheios":preco+" ◈"+(descontos[t]?" (-"+descontos[t]+")":"")}</span></button>`;
  }).join("");
  abreSheet("Loja",`<div class="abas">${abas}</div><div class="prat">${cards}</div>`);
  G("shCorpo").querySelectorAll(".abaH").forEach(b=>b.onclick=()=>{
    lojaHeroi=tm.herois.find(h=>h.id===b.dataset.h); abreLoja(); });
  G("shCorpo").querySelectorAll(".itC").forEach(b=>b.onclick=()=>{
    const it=ITEM[b.dataset.i];
    const preco=Math.max(0,it.o-descontos[t]);
    if(quem.ouro<preco||quem.itens.includes(it.id)||quem.itens.length>=(quem.slots||3))return;
    quem.ouro-=preco; quem.itens.push(it.id);
    if(descontos[t]){ descontos[t]=0; }
    if(it.ef.vida){ quem.vidaMax+=it.ef.vida; quem.vida+=it.ef.vida; }
    reg(t?"c":"a",`${quem.n} compra ${it.n} (−${preco} de ouro)`);
    toast(it.n,""); vibra(12); abreLoja(); pinta(); });
}

/* ══════════════════ MANUAL ══════════════════ */
function abreManual(){
  abreSheet("Manual",`<div class="man">
    <section class="destaque"><h4>O que você é</h4>
      <p>Você não controla um herói: você é o <b>técnico</b> de cinco. Vence quem derrubar o Nexus adversário — e o caminho até lá é <b>empurrar uma rota</b>, derrubando as torres.</p></section>
    <section><h4>1 · O Dado Mestre move o time todo</h4>
      <p>Um dado por rodada. O valor é o total de casas que os seus <b>cinco</b> heróis andam <b>juntos</b>.</p>
      <p>Tirou 4? São 4 casas no total: quatro com um herói, ou uma com quatro heróis. Aproximar o assassino custa o recuo do atirador.</p></section>
    <section><h4>2 · Três dados de ação, cinco heróis</h4>
      <p>Cada dado alocado num herói vira a <b>Força</b> da habilidade. Toda habilidade tem uma Força mínima.</p>
      <table><tr><td>Habilidades básicas</td><td>Força 1+</td></tr>
      <tr><td>Habilidades de controle</td><td>Força 3+</td></tr>
      <tr><td>Ultimates</td><td>Força 5+ ou 6</td></tr></table>
      <p style="margin-top:7px">Precisa de mais movimento? <b>Vire um dado de ação em movimento</b> pelo botão <b>→ mover</b>.</p></section>
    <section class="destaque"><h4>3 · Quem não age, enriquece</h4>
      <p>Herói que recebe dado ganha <b>1 de ouro</b>. Quem fica de fora <b>farma 3</b>. Como só três dos cinco recebem ação, dois sempre estão enriquecendo. <b>Agir custa dinheiro.</b></p></section>
    <section><h4>Combate</h4>
      <p>Sem rolagem extra — o dado já foi rolado.</p>
      <table><tr><td>Dano</td><td>Força + Poder − Armadura</td></tr>
      <tr><td>Dado 6 natural</td><td>Crítico</td></tr>
      <tr><td>Morte</td><td>volta em 2 rodadas</td></tr>
      <tr><td>Quem matou</td><td>+4 de ouro</td></tr></table></section>
    <section><h4>As cinco posições</h4>
      <p><b>Topo</b> — sozinho lá em cima. Dominar a rota dá <b>Placas</b>: 1 ajusta um dado em ±1, 2 re-rolam. É a sua única fonte de controle sobre a sorte.</p>
      <p><b>Selva</b> — o Caçador. A ação dele é <b>escondida</b> no início da rodada e revelada no fim do turno do adversário. Ir a uma rota é <b>gank</b>: +2 de Força.</p>
      <p><b>Meio</b> — a rota mais curta. Dominar dá <b>Prioridade</b>: gaste para rolar <b>um dado de ação a mais</b>, quando quiser.</p>
      <p><b>Atirador</b> — frágil e caro, mas escala: a cada 10 de ouro ganha +2 de Poder. Perto do Suporte, ganha escudo e dano.</p>
      <p><b>Suporte</b> — escuda, doa o próprio dado, e a <b>Ward</b> revela o Caçador inimigo antes da hora.</p></section>
    <section><h4>Torres, ondas e Nexus</h4>
      <p>Cada rota tem uma <b>Frente de Onda</b> (o círculo tracejado). Ela desliza para o lado de quem tem mais heróis vivos naquela rota, e bate na torre onde encosta.</p>
      <p>Torre tem <b>3 de vida</b>. A onda tira 1 por rodada.</p>
      <p><b>Você também derruba torre.</b> Se a sua onda já está encostada nela, ela vira alvo de habilidade: mira vermelha, um toque, <b>1 de dano</b>. Mas a torre <b>revida 2</b> — e só aceita <b>um golpe de herói por rodada</b>. Empurrar a rota com o time é o dobro da velocidade de esperar a onda.</p>
      <p>Torres caídas abrem a rota. Rota aberta, a onda bate no <b>Nexus</b>. Zerou, acabou.</p></section>
    <section><h4>O Poço — Dragão e Barão</h4>
      <p>Há <b>um poço</b> no meio do mapa, em terreno de ninguém, e ele <b>muda de morador</b>. Vazio, mostra a rodada em que o próximo desce — esse é o relógio da partida.</p>
      <p>Até a rodada 8 quem desce é o <b>Dragão</b>: <b>3 de vida</b>, revida 1. Levar dá a <b>Herança do Dragão</b> — <b>+1 de Poder em todo o time, para sempre</b>, e <b>acumula</b> a cada Dragão. Ele volta 3 rodadas depois de cair.</p>
      <p>Da rodada 8 em diante quem desce é o <b>Barão</b>: <b>5 de vida</b>, revida 2. Levar dá a <b>Fúria</b> por <b>2 rodadas</b> — +2 de Poder no time e <b>as três ondas avançam sozinhas</b>, com herói na rota ou sem. É o botão de ponto-sem-volta.</p>
      <p>Bater no poço é como bater na torre — mira vermelha, um toque, 1 de dano — só que <b>sem limite por rodada</b> e <b>sem dono</b>. Quem dá o <b>último golpe</b> leva o prêmio inteiro. É por isso que ninguém deixa o poço sozinho.</p></section>
    <section><h4>Retomada</h4>
      <p>O jogo conta o quanto você está apanhando: cada <b>torre sua caída</b> vale 2, cada <b>hexágono de onda inimiga do seu lado</b> do vão vale 1.</p>
      <p>Se a sua conta passar a do adversário em <b>2</b>, você rola <b>+1 dado de ação</b>. Em <b>4</b>, também ganha <b>+1 no Dado Mestre</b>.</p>
      <p>É automático e <b>some sozinho</b> quando a diferença fecha. Estar atrás não devolve a partida — devolve <b>ação</b> para brigar por ela.</p></section>
    <section><h4>No aparelho</h4>
      <p><b>Arraste o herói para andar.</b> Encoste nele e puxe: as casas ao alcance acendem e a casa sob o dedo fica marcada. Soltou, andou. É o caminho mais rápido.</p>
      <p>Prefere tocar? Toque num herói seu → abre o <b>comando</b> dele, e de lá você escolhe <b>mover</b> ou uma <b>habilidade</b>. Os dois caminhos valem.</p>
      <p><b>Segure uma habilidade por meio segundo</b> e ela se explica: Força mínima, alvo, alcance, a regra por extenso e <b>o que sai com cada um dos dados que estão na mesa agora</b>. Funciona até nas habilidades apagadas — é quando mais se quer saber.</p>
      <p>O dado é escolhido sozinho: o menor que dá conta. Quer gastar um específico? Toque nele antes.</p>
      <p>O <b>✕</b> cancela sempre. Toque num herói inimigo para ver a carta dele.</p></section>
  </div>`);
}

/* ══════════════════ TUTORIAL ══════════════════ */
let tut=null, tutI=0, tutFoco=null;
const PASSOS=[
  {t:"Você comanda os cinco heróis azuis. Cada um joga um jogo diferente.<br><br>Toque em <b>VHARN</b>, o círculo azul lá no canto de baixo à esquerda.",
   foco:"peca:vharn", ok:()=>selHeroi&&selHeroi.id==="vharn"},
  {t:"Este é o <b>comando</b> dele. Aqui você decide o que esse herói faz na rodada.<br><br>Toque em <b>MOVER</b>.",
   foco:"bt:cmdMover", ok:()=>modo==="mover"},
  {t:"As casas douradas são onde ele alcança.<br><br>O <b>Dado Mestre</b> é o movimento do <b>time inteiro</b> — cada casa andada sai do mesmo bolso. Toque numa casa.",
   ok:()=>J.mov.rest<J.mov.v},
  {t:"Andou. Repare que o Dado Mestre diminuiu — é o orçamento comum dos cinco.<br><br>Agora a ação: toque em <b>GOLPE DE ESCUDO</b>.",
   foco:"bt:hab0", ok:()=>modo==="mirar"||J.dados.some(d=>d.usado)},
  {t:"O jogo já escolheu o <b>menor dado</b> que dá conta — os grandes ficam guardados para as ultimates.<br><br>Se houver alvo no alcance, ele fica com a mira vermelha. Toque nele. Se não houver, toque no <b>✕</b> e siga.",
   ok:()=>J.dados.some(d=>d.usado)},
  {t:"Você tem <b>3 dados de ação</b> e <b>5 heróis</b>. Nunca dá para todos.<br><br>E aqui está o truque: quem <b>não</b> recebe dado <b>farma 3 de ouro</b>, contra 1 de quem age. <b>Agir custa dinheiro.</b>",
   ok:null},
  {t:"Duas rotas mexem nos seus dados:<br><br><b>Topo</b> dá <b>Placas</b> — ajusta um dado em ±1 ou re-rola.<br><b>Meio</b> dá <b>Prioridade</b> — um dado de ação a mais.<br><br>Ganhar essas rotas é o que faz sua ultimate sair na hora certa.",
   ok:null},
  {t:"Por último: o <b>Caçador</b> da selva. No começo de cada rodada vocês dois escolhem em segredo para onde ele vai, e a carta só vira <b>no fim do turno do adversário</b>.<br><br>É o blefe do gank. Use.",
   ok:null},
  {t:"É isso. Encerre o turno e jogue.<br><br>O <b>?</b> lá em cima abre o manual completo a qualquer momento.",
   ok:null, fim:true}
];
function iniciaTutorial(){
  tut=true; tutI=0; mostraTut();
}
function mostraTut(){
  const box=G("tut"); if(!tut){ box.classList.remove("on"); tutFoco=null; return; }
  const p=PASSOS[tutI];
  tutFoco=p.foco||null;
  box.className="on";
  box.innerHTML=`<div class="pass">Tutorial · ${tutI+1} de ${PASSOS.length}</div>
    <div class="txt">${p.t}</div>
    <div class="bt"><button id="tutSair">Sair</button>
      ${p.ok?"":`<button class="ok" id="tutOk">${p.fim?"Jogar":"Entendi"}</button>`}</div>`;
  G("tutSair").onclick=()=>{ tut=null; mostraTut(); pinta(); };
  const b=G("tutOk"); if(b) b.onclick=()=>avancaTut();
  aplicaFoco();
}
function avancaTut(){
  tutI++;
  if(tutI>=PASSOS.length){ tut=null; }
  mostraTut(); pinta();
}
function checaTut(){
  if(!tut)return;
  const p=PASSOS[tutI];
  if(p.ok&&p.ok()) setTimeout(()=>avancaTut(),380);
}
function aplicaFoco(){
  document.querySelectorAll(".foco").forEach(e=>e.classList.remove("foco"));
  if(!tutFoco)return;
  if(tutFoco.startsWith("bt:")){ const e=G(tutFoco.slice(3)); if(e)e.classList.add("foco"); }
}

/* ══════════════════ RENDER ══════════════════ */
let assinaturaDados="";
function pinta(){
  const tm=J.times[J.vez];
  G("rod").textContent="R"+J.rodada;
  G("faixa").className="faixa t"+J.vez;
  G("quem").textContent=NOMES[J.vez];

  const ouro=tm.herois.reduce((a,h)=>a+h.ouro,0);
  const cacaTxt = tm.cacaRevelada ? `caçador: ${tm.cacaRevelada}`
      : (J.times[1-J.vez].ward&&tm.caca) ? `ward: ${tm.caca}` : null;
  G("pills").innerHTML=
    `<span>◈ <b>${ouro}</b></span>`+
    `<span class="${tm.placas?"on":""}">⬢ <b>${tm.placas}</b></span>`+
    (tm.prio?`<span class="on">⚡ <b>${tm.prio}</b></span>`:"")+
    (tm.dragoes?`<span class="on">herança <b>${tm.dragoes}</b></span>`:"")+
    (tm.barao?`<span class="on">fúria <b>${tm.barao}</b></span>`:"")+
    (tm.retomada?`<span class="on">retomada${tm.retomada>1?" <b>2</b>":""}</span>`:"")+
    (cacaTxt?`<span class="on">${cacaTxt}</span>`:"");

  const dm=G("ddm");
  dm.innerHTML=J.mov.rest+(J.mov.rest!==J.mov.v?`<small>de ${J.mov.v}</small>`:"");
  dm.className="dado mestre"+(J.mov.rest?"":" zero");

  const assina=J.dados.map(d=>d.v+(d.usado?"u":"")).join(",");
  const cx=G("dadosAcao");
  cx.innerHTML=J.dados.map((d,i)=>
    `<div class="dado${d.usado?" usado":""}${dadoSel===i?" sel":""}${d.v===6?" seis":""}${d.extra?" extra":""}"
      data-i="${i}">${d.v}</div>`).join("");
  if(assina!==assinaturaDados){
    cx.querySelectorAll(".dado").forEach((e,i)=>{
      e.classList.add("rola"); setTimeout(()=>e.classList.remove("rola"),320+i*40); });
    assinaturaDados=assina;
  }
  cx.querySelectorAll(".dado").forEach(e=>e.onclick=()=>{
    const i=+e.dataset.i;
    if(J.dados[i].usado||J.fase!=="jogando")return;
    dadoSel=dadoSel===i?null:i; vibra(8); pinta();
  });

  /* painel de comando — a peça central da correção de jogabilidade */
  const cmd=G("comando");
  if(selHeroi&&!selHeroi.morto){
    const h=selHeroi;
    const podeMover=J.mov.rest>0&&!h.preso;
    cmd.innerHTML=`
      <div class="cmd-cab">
        <img src="${RETRATO(h.id)}" alt="">
        <div><div class="nm">${h.n}</div>
          <div class="st"><span>♥ <b>${Math.max(0,h.vida)}</b></span><span>⚔ <b>${poderTotal(h)}</b></span>
            <span>⛨ <b>${armTotal(h)}</b></span><span>◈ <b>${h.ouro}</b></span></div></div>
        <div class="dir"><button class="cmd-x carta" id="cmdCarta">carta</button>
          <button class="cmd-x" id="cmdX">✕</button></div>
      </div>
      <button class="opc${modo==="mover"?" on":""}${podeMover?" pode":""}" id="cmdMover" ${podeMover?"":"disabled"}>
        <span class="ico">${svgIco(ICO.passos)}</span>
        <span class="txt"><span class="t1">Mover</span>
          <span class="t2">${h.preso?"preso nesta rodada":
            podeMover?`até <b>${J.mov.rest+(ehAgil(h)?1:0)}</b> casas · sai do bolso do time`:"sem movimento restante"}</span></span>
        <span class="mark">${J.mov.rest}</span>
      </button>
      ${h.habs.map((hb,i)=>{
        const di=dadoPara(hb), pode=di!==null&&!h.agiu;
        const emMira=modo==="mirar"&&habAtual===i;
        return `<button class="opc${emMira?" on":""}${pode?" pode":" naoPode"}" id="hab${i}">
          <span class="ico">${svgIco(iconeDe(hb))}</span>
          <span class="txt"><span class="t1">${hb.n}${confirmar===i?" — confirmar":""}</span>
            <span class="t2">${h.agiu?"já agiu nesta rodada":descreve(h,hb,di!==null?J.dados[di].v:null)}</span></span>
          <span class="mark${pode?"":" trava"}">${di!==null?J.dados[di].v:"F"+hb.f}</span>
        </button>`;
      }).join("")}`;
    G("cmdX").onclick=cancela;
    G("cmdCarta").onclick=()=>abreCarta(h);
    G("cmdMover").onclick=iniciaMover;
    h.habs.forEach((_,i)=>{
      const b=G("hab"+i); if(!b)return;
      b.onclick=()=>{ if(cliqueBloqueado)return; iniciaHab(i); };
      toqueLongo(b,()=>fichaHab(h,i));      // segurar explica, mesmo apagada
    });
  }else{
    cmd.innerHTML=`<div class="vaziomsg">${texto()}</div>`;
  }

  const dLivre = dadoSel!==null && !(J.dados[dadoSel]||{}).usado;
  G("btPlaca").disabled = tm.placas<1||!dLivre;
  G("btRerol").disabled = tm.placas<2||!dLivre;
  G("btConv").disabled = !dLivre;
  /* linha inteira some quando nenhum dos três serve — devolve altura ao mapa */
  G("extraBts").classList.toggle("ocioso",
    G("btPlaca").disabled && G("btRerol").disabled && G("btConv").disabled);
  G("btLoja").classList.toggle("destaque",tm.herois.some(h=>h.morto||naBase(h)));
  G("btLoja").disabled=J.fase!=="jogando";
  G("btTime").innerHTML="Time"+(tm.prio?` <span class="bad">⚡${tm.prio}</span>`:"");
  const nMao=maos[J.vez].length, jogaveis=maos[J.vez].filter(podeJogar).length;
  G("btCartas").innerHTML="Cartas"+(nMao?` <span class="bad">${nMao}</span>`:"");
  G("btCartas").classList.toggle("destaque",jogaveis>0);
  G("btCartas").disabled=J.fase!=="jogando";
  G("btFim").disabled = J.fase!=="jogando";

  /* só desbota se realmente sobrar conteúdo para rolar */
  const cmdEl=G("comando");
  cmdEl.classList.toggle("rolando",cmdEl.scrollHeight>cmdEl.clientHeight+1);
  if(sheetAberto==="Time") abreTime();
  desenhaMapa();
  aplicaFoco();
  checaTut();
}
function texto(){
  if(J.fim!==null)return `<b>${NOMES[J.fim]} venceu.</b>`;
  const livres=J.dados.filter(d=>!d.usado).length;
  if(!livres&&!J.mov.rest) return "Tudo gasto. <b>Encerre o turno.</b>";
  return `<b>${J.mov.rest}</b> de movimento · <b>${livres}</b> ${livres===1?"ação":"ações"}<br>`+
         `toque num herói seu para abrir o comando`;
}

/* ══════════════════ FLUXO ══════════════════ */
function perguntaCaca(t,depois){
  const cac=J.times[t].herois[1];
  abre(`
    <span class="et">Comando oculto · em segredo</span>
    <h2 class="t${t}">${NOMES[t]}</h2>
    <p>Para onde vai <b>${cac.n}</b>, seu Caçador?<br>
    A escolha fica virada para baixo e só é revelada no fim do turno do adversário.</p>
    <div class="zonas">
      <button class="zona" data-z="selva"><span class="zn">Selva</span><span class="zd">+3 de ouro · seguro</span></button>
      <button class="zona" data-z="topo"><span class="zn">Topo</span><span class="zd">gank · +2 de Força</span></button>
      <button class="zona" data-z="meio"><span class="zn">Meio</span><span class="zd">gank · +2 de Força</span></button>
      <button class="zona" data-z="baixo"><span class="zn">Baixo</span><span class="zd">gank · +2 de Força</span></button>
    </div>`);
  document.querySelectorAll(".zona").forEach(b=>b.onclick=()=>{
    J.times[t].caca=b.dataset.z; J.times[t].cacaRevelada=null; vibra(12);
    if(t===0) abre(`<span class="et">Passe o aparelho</span><h2 class="t1">${NOMES[1]}</h2>
        <p>A escolha do ${NOMES[0]} está virada para baixo.<br>Sua vez de esconder o Caçador.</p>
        <button class="grande" id="ok">Estou pronto</button>`,()=>depois());
    else depois();
  });
}
const _iniciaTurno=iniciaTurno;
iniciaTurno=function(){
  _iniciaTurno();
  limpaModo(); selHeroi=null;
  const nova=compra(J.vez);
  abre(`<span class="et">Passe o aparelho</span><h2 class="t${J.vez}">${NOMES[J.vez]}</h2>
    <p>É a sua vez. Ninguém mais deve estar olhando.</p>
    ${nova?`<span class="et" style="display:block;margin-bottom:2px">Você comprou</span>
        ${faceCarta(nova)}`:""}
    <button class="grande" id="ok">Começar meu turno</button>`,()=>{ fecha(); pinta(); });
};

/* buffs do deck duram até o fim da rodada */
const _fimDaRodada=fimDaRodada;
fimDaRodada=function(){ limpaBuffs(); _fimDaRodada(); };
/* A tela existia e só dizia quem venceu. Agora mostra o placar dos dois lados e o
   motivo — que hoje é sempre o Nexus, mas `J.motivoFim` já está plumbado para o dia
   em que o limite de rodadas entrar (ver docs/REVISAO-EXTERNA.md, item 3.3). */
function telaFim(){
  const v=J.fim, p=1-v;
  const linha=(rot,a,b)=>`<tr><th>${rot}</th>
    <td class="${a>=b?"mais":""}">${a}</td><td class="${b>=a?"mais":""}">${b}</td></tr>`;
  abre(`<span class="et">Fim de partida · rodada ${J.rodada}</span>
    <h2 class="t${v}">${NOMES[v]} venceu</h2>
    <p>${J.motivoFim||`Nexus ${NOMES[p]} destruído.`}</p>
    <table class="placar">
      <thead><tr><th></th><th class="t${v}">${NOMES[v]}</th><th class="t${p}">${NOMES[p]}</th></tr></thead>
      <tbody>
        ${linha("Nexus",Math.max(0,J.nexus[v]),Math.max(0,J.nexus[p]))}
        ${linha("Torres derrubadas",torresDerrubadas(v),torresDerrubadas(p))}
        ${linha("Ouro acumulado",ouroDoTime(v),ouroDoTime(p))}
      </tbody>
    </table>
    <button class="grande" id="ok">Nova partida</button>`,()=>{fecha();partida(false);});
  vibra([60,80,60,80,120]);
}
/* ══════════════════ FICHA DA HABILIDADE ══════════════════ */
/* Meio segundo de toque abre a regra por extenso e o resultado estimado PARA CADA
   DADO QUE ESTÁ NA MESA nesta rodada — que é a pergunta real do jogador ("com o 4
   que eu tenho, isso mata?"). Vale também para habilidade sem dado disponível: é
   justamente quando mais se quer saber o que ela faria. */
function toqueLongo(elem,aoSegurar){
  let t=null,x0=0,y0=0;
  const cancela=()=>{ if(t){clearTimeout(t);t=null;} };
  elem.addEventListener("pointerdown",e=>{
    x0=e.clientX; y0=e.clientY;
    t=setTimeout(()=>{ t=null; cliqueBloqueado=true;
      setTimeout(()=>{cliqueBloqueado=false;},350);
      vibra(18); aoSegurar(); },460);
  });
  elem.addEventListener("pointermove",e=>{
    if(t&&Math.hypot(e.clientX-x0,e.clientY-y0)>10) cancela();
  });
  ["pointerup","pointercancel","pointerleave"].forEach(ev=>elem.addEventListener(ev,cancela));
}
function fichaHab(h,i){
  const hb=h.habs[i];
  const ALVO={in:"um inimigo",al:"um aliado",eu:"você mesmo"};
  const alc=alcTotal(h)+(hb.ef.alcExtra||0);
  const alcTxt=hb.alvo==="eu"?"—":hb.ef.semAlcance?"o mapa inteiro":`${alc} ${alc===1?"casa":"casas"}`;
  const dados=J.dados.map(d=>{
    const gasto=d.usado, serve=!gasto&&d.v>=hb.f;
    return `<div class="fdl${serve?" ok":""}">
      <span class="fdd">${d.v}</span>
      <span class="fdt">${gasto?"já gasto nesta rodada"
        :serve?descreve(h,hb,d.v):`não chega à Força ${hb.f}`}</span></div>`;
  }).join("");
  abreSheet(hb.n,`
    <div class="fh-top">
      <span class="fh-et">${h.n} · ${POS[CATALOGO[h.id].pos].n}</span>
      <div class="fh-grade">
        <div><div class="k">Força mínima</div><div class="v">${hb.f}</div></div>
        <div><div class="k">Alvo</div><div class="v">${ALVO[hb.alvo]||hb.alvo}</div></div>
        <div><div class="k">Alcance</div><div class="v">${alcTxt}</div></div>
      </div>
    </div>
    <p class="fh-regra">${typeof textoHab==="function"?textoHab(hb):descreve(h,hb,null)}</p>
    <div class="fh-sub">Com os dados desta rodada</div>
    ${dados}
    ${h.agiu?'<p class="fh-nota">Este herói já agiu nesta rodada.</p>':""}`);
}

/* ══════════════════ FIM DE PARTIDA ══════════════════ */
const ouroDoTime=t=>J.times[t].herois.reduce((a,h)=>a+h.ouro,0);
const torresDerrubadas=t=>J.torres.filter(x=>x.t===1-t&&x.vida<=0).length;
function usaPrioridade(){
  const tm=J.times[J.vez];
  if(!tm.prio||J.fase!=="jogando")return;
  tm.prio--;
  const v=1+Math.floor(Math.random()*6);
  J.dados.push({v,usado:0,extra:1});
  reg("b",`PRIORIDADE — ${NOMES[J.vez]} rola um dado a mais: ${v}`);
  toast("dado extra: "+v,""); vibra(14); pinta();
}

/* ══════════════════ BOTÕES ══════════════════ */
G("btTime").onclick=()=>{ sheetAberto==="Time"?fechaSheet():abreTime(); };
G("btLoja").onclick=()=>{ sheetAberto&&sheetAberto.startsWith("Loja")?fechaSheet():abreLoja(); };
G("btCartas").onclick=()=>{ sheetAberto==="Cartas"?fechaSheet():abreMao(); };
G("btLog").onclick=()=>{ sheetAberto==="Histórico"?fechaSheet():abreLog(); };
G("btAjuda").onclick=()=>{ sheetAberto==="Manual"?fechaSheet():abreManual(); };
G("btFim").onclick=()=>{
  if(J.fase!=="jogando")return;
  const livres=J.dados.filter(d=>!d.usado).length;
  if((livres||J.mov.rest)&&!G("btFim").dataset.confirma){
    G("btFim").dataset.confirma="1";
    G("btFim").textContent="Sobrou! Encerrar?";
    setTimeout(()=>{ const b=G("btFim"); if(b){ delete b.dataset.confirma; b.textContent="Encerrar"; } },2600);
    return toast(`sobrou ${J.mov.rest} de movimento e ${livres} ${livres===1?"ação":"ações"}`,"");
  }
  delete G("btFim").dataset.confirma; G("btFim").textContent="Encerrar";
  fechaSheet(); limpaModo(); selHeroi=null;
  encerraTurno(); pinta();
};
G("btConv").onclick=()=>{
  if(dadoSel===null||J.dados[dadoSel].usado)return;
  const d=J.dados[dadoSel]; d.usado=1; J.mov.rest+=d.v; J.mov.v+=d.v;
  reg(J.vez?"c":"a",`${NOMES[J.vez]} vira a ação ${d.v} em movimento (total ${J.mov.rest})`);
  toast("+"+d.v+" de movimento",""); vibra(12);
  dadoSel=null; calcula(); pinta();
};
G("btPlaca").onclick=()=>{ usaPlaca(1); toast("dado ajustado",""); vibra(10); };
G("btRerol").onclick=()=>{ rerola(); toast("dado re-rolado",""); vibra(10); };
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){ if(sheetAberto)return fechaSheet(); return cancela(); }
});

/* ══════════════════ DECK DE COMANDO ══════════════════ */
const CARTA=typeof DECK!=="undefined"?Object.fromEntries(DECK.map(c=>[c.id,c])):{};

/* rede de segurança: se faltar arte, desenha a inicial sobre a cor da rota.
   Com o pool em 20 heróis, todos têm retrato — isso só protege contra id novo sem imagem. */
function retratoProv(id){
  const h=CATALOGO[id]||{n:"?",pos:"topo"};
  const cor=(POS[h.pos]||{cor:"#6C817C"}).cor;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${cor}" stop-opacity=".55"/>
      <stop offset="1" stop-color="#0B120F"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#g)"/>
    <text x="50" y="66" font-family="Avenir Next Condensed,Impact,sans-serif" font-size="52"
      font-weight="700" fill="#E8F0EA" fill-opacity=".82" text-anchor="middle">${h.n[0]}</text></svg>`;
  return "data:image/svg+xml;utf8,"+encodeURIComponent(svg);
}
const RETRATO=id=>ARTE[id]||retratoProv(id);
/* Item sem arte vira selo de latão com a inicial. Sem isso, os 10 itens de
   ITENS_NOVOS entrariam na loja com `src="undefined"` e ícone quebrado. */
function itemProv(id){
  const n=(ITEM[id]||{n:"?"}).n;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#18251F"/>
    <circle cx="50" cy="50" r="31" fill="none" stroke="#8A6A2F" stroke-width="4"/>
    <text x="50" y="64" font-family="Copperplate,Georgia,serif" font-size="38"
      fill="#D4A24C" text-anchor="middle">${n[0]}</text></svg>`;
  return "data:image/svg+xml;utf8,"+encodeURIComponent(svg);
}
const ARTE_I = typeof ARTE_ITEM!=="undefined" ? ARTE_ITEM : {};
const RETRATO_ITEM=id=>ARTE_I[id]||itemProv(id);
/* mesma rede de segurança para os monstros do poço */
const ARTE_M = typeof ARTE_MONSTRO!=="undefined" ? ARTE_MONSTRO : {};
const RETRATO_EPICO=id=>ARTE_M[id]||("data:image/svg+xml;utf8,"+encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#1B2A24"/>
    <text x="50" y="68" font-family="Impact,sans-serif" font-size="60" fill="#D4A24C"
      text-anchor="middle">${(EPICO[id]||{n:"?"}).n[0]}</text></svg>`));
const COR_FAM={dado:"#D4A24C",tempo:"#5B93B8",reacao:"#B75C52",mapa:"#6E8F6A",
               economia:"#A87F92",buff:"#8A7CAE",item:"#4F7F7A"};
const ARTE_C = typeof ARTE_CARTA!=="undefined" ? ARTE_CARTA : {};
/* face da carta em tamanho grande — usada na compra e em qualquer tela de revelação */
function faceCarta(id){
  const c=CARTA[id];
  return `<div class="cartona" style="--fam:${COR_FAM[c.fam]}">
    ${ARTE_C[id]?`<img src="${ARTE_C[id]}" alt="">`:""}
    <div class="cx"><div class="fam">${c.fam}</div>
      <div class="cn">${c.n}</div><div class="cd">${c.d}</div></div></div>`;
}
let baralho=[], cemiterio=[], maos=[[],[]], descontos=[0,0];

/* Buffs temporários escrevem nos campos que o motor já soma (extraPoder, arm, agil)
   e guardam o quanto aplicaram, para devolver no fim da rodada.
   poderTotal/armTotal/ehAgil são const no motor — não dá para envolvê-las. */
function aplicaBuff(h,campo,v){
  if(campo==="poder"){ h.extraPoder+=v; h.buffP=(h.buffP||0)+v; }
  if(campo==="arm"){ h.arm+=v; h.buffA=(h.buffA||0)+v; }
  if(campo==="agil"){ if(!h.agil){ h.agil=1; h.buffAgil=1; } }
}
function limpaBuffs(){
  todos().forEach(h=>{
    if(h.buffP){ h.extraPoder-=h.buffP; h.buffP=0; }
    if(h.buffA){ h.arm-=h.buffA; h.buffA=0; }
    if(h.buffAgil){ h.agil=0; h.buffAgil=0; }
  });
}

function compra(t){
  if(!baralho.length){ baralho=cemiterio.splice(0).sort(()=>Math.random()-.5);
    if(baralho.length) reg("b","o baralho foi reembaralhado"); }
  if(!baralho.length) return null;
  const c=baralho.pop(); maos[t].push(c);
  if(maos[t].length>3){ const fora=maos[t].shift(); cemiterio.push(fora);
    reg(t?"c":"a",`mão cheia — ${CARTA[fora].n} foi descartada`); }
  return c;
}
function podeJogar(id){
  const c=CARTA[id], ef=c.ef;
  const dLivre=dadoSel!==null&&!J.dados[dadoSel].usado;
  if(ef.rerolar||ef.ajustar||ef.dadoParaMov) return dLivre;
  if(ef.buffPoder||ef.buffArm||ef.buffEscudo||ef.buffAgil||ef.ouro||ef.recall||
     ef.reativar||ef.anularDano||ef.moverReacao||ef.slotExtra) return !!selHeroi&&!selHeroi.morto;
  if(ef.itemGratis) return !!selHeroi&&!selHeroi.morto&&(ef.ondeEstiver||naBase(selHeroi));
  if(ef.doCemiterio) return cemiterio.length>0;
  return true;
}
function jogaCarta(id){
  const c=CARTA[id], ef=c.ef, t=J.vez, h=selHeroi;
  if(!podeJogar(id)) return toast("não dá para jogar agora","morte");
  let msg=c.n;

  if(ef.rerolar){ J.dados[dadoSel].v=1+Math.floor(Math.random()*6); msg+=` → ${J.dados[dadoSel].v}`; }
  if(ef.ajustar){ const d=J.dados[dadoSel]; d.v=Math.min(6,d.v+1); msg+=` → ${d.v}`; }
  if(ef.dadoParaMov){ const d=J.dados[dadoSel]; d.usado=1;
    J.mov.rest+=d.v*2; J.mov.v+=d.v*2; dadoSel=null; msg+=` → +${d.v*2} de movimento`; }
  if(ef.movExtra){ J.mov.rest+=ef.movExtra; J.mov.v+=ef.movExtra; }
  if(ef.moverReacao){ J.mov.rest+=1; J.mov.v+=1; }
  if(ef.dadoExtra){ const v=1+Math.floor(Math.random()*6);
    J.dados.push({v,usado:0,extra:1}); msg+=` → dado ${v}`; }
  if(ef.reativar){ h.agiu=0; msg+=` → ${h.n} pode agir de novo`; }
  if(ef.buffPoder){ aplicaBuff(h,"poder",ef.buffPoder); msg+=` → ${h.n} +${ef.buffPoder} de Poder`; }
  if(ef.buffArm){ aplicaBuff(h,"arm",ef.buffArm); msg+=` → ${h.n} +${ef.buffArm} de Armadura`; }
  if(ef.buffEscudo||ef.anularDano){ const v=ef.buffEscudo||ef.anularDano;
    h.esc+=v; fx(h.pos,"⛨"+v,"esc"); msg+=` → escudo ${v} em ${h.n}`; }
  if(ef.buffAgil){ aplicaBuff(h,"agil",1); msg+=` → ${h.n} está ágil`; }
  if(ef.ouro){ h.ouro+=ef.ouro; msg+=` → ${h.n} +${ef.ouro} de ouro`; }
  if(ef.desconto){ descontos[t]+=ef.desconto; }
  if(ef.slotExtra){ h.slots=(h.slots||3)+1; msg+=` → ${h.n} tem ${h.slots} slots`; }
  if(ef.recall){ h.pos=[...BASE[t][0]]; desempilha(); msg+=` → ${h.n} volta à base`; }
  if(ef.ward){ J.times[t].ward=1; const z=J.times[1-t].caca;
    msg+=z?` → Caçador inimigo vai ao ${z.toUpperCase()}`:" → ward posta"; }
  if(ef.revelarCaca){ const z=J.times[1-t].caca;
    J.times[1-t].cacaRevelada=z; msg+=z?` → Caçador inimigo no ${z.toUpperCase()}`:" → nada escondido"; }
  if(ef.empurrarOnda){
    const rota=["topo","meio","baixo"][Math.floor(Math.random()*3)];
    J.frentes[rota]=limitaFrente(rota, J.frentes[rota]+(t===0?1:-1));
    msg+=` → onda do ${rota} avança`; }
  if(ef.itemGratis){
    const opc=ITENS.filter(i=>i.o<=ef.itemGratis&&!h.itens.includes(i.id));
    if(opc.length&&h.itens.length<(h.slots||3)){
      const it=opc[Math.floor(Math.random()*opc.length)];
      h.itens.push(it.id); if(it.ef.vida){h.vidaMax+=it.ef.vida;h.vida+=it.ef.vida;}
      msg+=` → ${h.n} equipa ${it.n}`;
    } else msg+=" → sem item disponível";
  }
  if(ef.doCemiterio){ const volta=cemiterio.pop(); maos[t].push(volta);
    msg+=` → recuperou ${CARTA[volta].n}`; }

  maos[t]=maos[t].filter(x=>x!==id); cemiterio.push(id);
  reg(t?"c":"a",msg); toast(c.n,""); vibra(12);
  calcula(); pinta(); if(sheetAberto==="Cartas") abreMao();
}
function abreMao(){
  const t=J.vez, mao=maos[t];
  const corpo = !mao.length
    ? `<p style="color:var(--ink-3);font-size:13.5px;margin:0;line-height:1.5">
         Mão vazia. Você compra <b style="color:var(--brass)">1 carta</b> no início de cada turno.</p>`
    : `<div class="mao">${mao.map(id=>{const c=CARTA[id],ok=podeJogar(id);
        return `<button class="ct${ok?"":" off"}" style="--fam:${COR_FAM[c.fam]}" data-c="${id}" ${ok?"":"disabled"}>
          ${ARTE_C[id]?`<img class="th" src="${ARTE_C[id]}" alt="">`:""}
          <div style="flex:1"><div class="fam">${c.fam}</div><div class="cn">${c.n}</div>
          <div class="cd">${c.d}</div></div></button>`;}).join("")}</div>`;
  abreSheet("Cartas",
    `<div class="deckinfo"><span>baralho ${baralho.length}</span><span>cemitério ${cemiterio.length}</span>
      <span>mão ${mao.length}/3</span></div>`+corpo+
    (mao.length&&!selHeroi?`<p style="color:var(--ink-3);font-size:12px;margin:12px 0 0">
       Cartas que afetam um herói pedem que ele esteja <b style="color:var(--brass)">selecionado</b>.</p>`:""));
  G("shCorpo").querySelectorAll(".ct").forEach(b=>b.onclick=()=>jogaCarta(b.dataset.c));
}

/* ══════════════════ DRAFT ══════════════════ */
let dr=null;
function iniciaDraft(depois){
  dr={fase:"ban", passo:0, bans:[], times:[[],[]], aoFim:depois};
  telaDraft();
}
function telaDraft(){
  const ORDEM=typeof ORDEM_DRAFT!=="undefined"?ORDEM_DRAFT:
    [{rota:"topo",primeiro:0},{rota:"selva",primeiro:1},{rota:"meio",primeiro:0},
     {rota:"adc",primeiro:1},{rota:"sup",primeiro:0}];
  const NOMEROTA={topo:"Topo",selva:"Selva",meio:"Meio",adc:"Atirador",sup:"Suporte"};

  if(dr.fase==="ban"){
    const t=dr.passo;                       /* A bane, depois B bane */
    const lista=Object.keys(CATALOGO);
    /* com 4 heróis por rota, dois bans na mesma rota zerariam o counterpick dela */
    const rotasBanidas=dr.bans.map(id=>CATALOGO[id].pos);
    abre(`<div id="dr">
      <div class="dr-cab"><span class="et">Banimento · ${dr.passo+1} de 2</span>
        <h3 class="t${t}">${NOMES[t]} bane</h3>
        <p>Tire da partida um herói que você não quer ver do outro lado.
        ${rotasBanidas.length?"<br>Uma rota só pode perder um herói.":""}</p></div>
      <div class="dr-grade">${lista.map(id=>{const h=CATALOGO[id];
        const ban=dr.bans.includes(id)||rotasBanidas.includes(h.pos);
        return `<button class="dr-h${ban?" ban":""}" data-id="${id}" ${ban?"disabled":""}>
          <img src="${RETRATO(id)}" alt=""><div class="dn">${h.n}</div>
          <div class="dr2">${NOMEROTA[h.pos]}</div></button>`;}).join("")}</div>
      </div>`);
  } else if(dr.fase==="pick"){
    const et=ORDEM[Math.floor(dr.passo/2)];
    const t = dr.passo%2===0 ? et.primeiro : 1-et.primeiro;
    const rota=et.rota;
    const jaTem=id=>dr.times[0].includes(id)||dr.times[1].includes(id)||dr.bans.includes(id);
    const opcoes=Object.keys(CATALOGO).filter(id=>CATALOGO[id].pos===rota);
    const advers=dr.times[1-t][Math.floor(dr.passo/2)];
    abre(`<div id="dr">
      <div class="dr-cab"><span class="et">${NOMEROTA[rota]} · escolha ${dr.passo+1} de 10</span>
        <h3 class="t${t}">${NOMES[t]} escolhe</h3>
        <p>${advers?`O adversário levou <b>${CATALOGO[advers].n}</b> — escolha o counter.`
                   :"Você escolhe primeiro nesta rota."}</p></div>
      <div class="dr-grade">${opcoes.map(id=>{const h=CATALOGO[id],fora=jaTem(id);
        return `<button class="dr-h${fora?" tomado":""}" data-id="${id}" ${fora?"disabled":""}>
          <img src="${RETRATO(id)}" alt=""><div class="dn">${h.n}</div>
          <div class="dr2">${h.ep||""}</div></button>`;}).join("")}</div>
      <div class="dr-times">
        ${[0,1].map(x=>dr.times[x].map(id=>
          `<span class="dr-chip t${x}"><img src="${RETRATO(id)}" alt="">${CATALOGO[id].n}</span>`).join("")).join("")}
      </div></div>`);
  }
  document.querySelectorAll(".dr-h").forEach(b=>b.onclick=()=>{
    const id=b.dataset.id; vibra(10);
    if(dr.fase==="ban"){
      dr.bans.push(id); dr.passo++;
      if(dr.passo>=2){ dr.fase="pick"; dr.passo=0; }
    }else{
      const et=ORDEM[Math.floor(dr.passo/2)];
      const t = dr.passo%2===0 ? et.primeiro : 1-et.primeiro;
      dr.times[t].push(id); dr.passo++;
      if(dr.passo>=10){ fecha(); return dr.aoFim(dr.times); }
    }
    telaDraft();
  });
}

/* ══════════════════ BOOT ══════════════════ */
function partida(comTutorial){
  baralho = typeof montaDeck!=="undefined" ? montaDeck() : [];
  cemiterio=[]; maos=[[],[]]; descontos=[0,0];
  if(comTutorial) iniciaTutorial();   /* fica no painel, atrás das telas de fluxo */
  novo();                             /* dispara a fase de comando oculto */
  pinta();
}
function comeca(comTutorial,comDraft){
  if(!comDraft) return partida(comTutorial);
  iniciaDraft(times=>{ TIMES=times; partida(comTutorial); });
}
function telaAbertura(){
  abre(`<span class="et">Um MOBA de mesa para dois</span><h2>JAGER<br>LARAMAIS</h2>
    <p>Cada um comanda <b>cinco heróis</b> — no mesmo aparelho.</p>
    <button class="grande" id="ok">Jogar o tutorial</button>
    <button class="grande" id="btDraft">Partida com draft</button>
    <button class="grande" id="btDireto"
      style="background:none;border:1px solid var(--line);color:var(--ink-2)">Partida rápida</button>`,
    ()=>comeca(true,false));
  G("btDraft").onclick=()=>comeca(false,true);
  G("btDireto").onclick=()=>comeca(false,false);
}
telaAbertura();
