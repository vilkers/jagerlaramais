/* JAGERLARAMAIS — motor de regras.
   Estado, geometria, turno e ações. Não desenha tela e não conhece o modo contra IA.
   Conteúdo mora em data/catalogo.js; apresentação mora em interface.js. */

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
const FACES_ACAO=6;
const rolaAcao=()=>1+Math.floor(Math.random()*FACES_ACAO);
const rolaMovimento=()=>1+Math.floor(Math.random()*6);
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
   à mão: mudar N muda o mapa inteiro — rotas, bases, rio e posição das torres.

   SIMETRIA — leia antes de mexer. O mapa é 1v1: tudo que o time 0 tem, o time 1
   tem na posição girada em 180°. Até a v0.5.9 o espelho era (COLS-1-c, LINS-1-r),
   que PARECE rotação e não é numa grade offset odd-r: as linhas ímpares andam meio
   hexágono, e a fórmula quebra a vizinhança justamente nelas. O estrago era medível
   — rotas de 14 e 13 casas, bases fora do espelho, torres a distâncias diferentes
   da própria base.

   Agora a rotação passa por coordenada cúbica (`gira`) e o mapa é GERADO POR
   METADE: escreve-se topo e meia rota do meio, e o resto é o espelho delas.
   Assimetria deixa de ser coisa para consertar e passa a ser impossível de
   escrever. Quem prova é `node sim/simetria.js`. */
/* N=11 desde a v0.6.2, para dar selva. A selva é o INTERIOR do mapa e cresce ao
   quadrado; a rota é o perímetro e cresce linear — então aumentar o lado engorda
   a selva muito mais rápido que a rota, sem tirar uma casa que seja das rotas.
   De 9 para 11: selva 16 → 38 casas, rota 57 → 74. Medido junto: quem começa cai
   de 57,1% para 55,0%, e a partida vai de 15 para 18 rodadas de mediana.
   N=10 foi medido e descartado — 59,7% para quem começa e o poço quase nunca
   disputado (0,21 Dragão por partida contra 0,55 em N=11). */
const N=11;
const COLS=N,LINS=N,R=19;
const k=(c,r)=>c+","+r;
const centro=(c,r)=>{const w=Math.sqrt(3)*R;return[26+w*(c+.5*(r&1))+w/2,26+R*1.5*r+R];};
const dist=(c1,r1,c2,r2)=>{const ax=c1-(r1-(r1&1))/2,ay=-ax-r1,bx=c2-(r2-(r2&1))/2,by=-bx-r2;
  return Math.max(Math.abs(ax-bx),Math.abs(ay-by),Math.abs(r1-r2));};

/* Rotação de 180°, ancorada nos DOIS CANTOS opostos — e não no "hexágono central".
   Em tabuleiro de lado par o centro cai entre casas e o cubo sairia fracionário;
   com o eixo no canto a conta é exata nas duas paridades. */
const _cubo=(c,r)=>{const x=c-(r-(r&1))/2;return[x,-x-r,r];};
const _off=(x,y,z)=>[x+(z-(z&1))/2,z];
const _EIXO=(()=>{const a=_cubo(0,0),b=_cubo(COLS-1,LINS-1);return[a[0]+b[0],a[1]+b[1],a[2]+b[2]];})();
const gira=(c,r)=>{const p=_cubo(c,r);return _off(_EIXO[0]-p[0],_EIXO[1]-p[1],_EIXO[2]-p[2]);};

/* O tabuleiro é o maior conjunto FECHADO sob a rotação: casa cujo espelho cairia
   fora da grade simplesmente não existe. Em N=9 isso corta 4 casas da última
   coluna — as que não tinham contraparte e só serviam para um lado. */
const _naGrade=([c,r])=>c>=0&&c<COLS&&r>=0&&r<LINS;
const NO_TAB=new Set();
for(let _r=0;_r<LINS;_r++)for(let _c=0;_c<COLS;_c++)
  if(_naGrade(gira(_c,_r))) NO_TAB.add(k(_c,_r));
const noTab=(c,r)=>NO_TAB.has(k(c,r));

const vizinhos=(c,r)=>((r&1)?[[-1,0],[1,0],[0,-1],[1,-1],[0,1],[1,1]]:[[-1,0],[1,0],[-1,-1],[0,-1],[-1,1],[0,1]])
  .map(([a,b])=>[c+a,r+b]).filter(([a,b])=>noTab(a,b));

/* a base do time 0 é escrita; a do time 1 é o espelho — nunca escrita duas vezes */
const BASE=[[[0,N-1],[1,N-1]]];
BASE.push(BASE[0].map(([c,r])=>gira(c,r)));
const _BASE_K=new Set([...BASE[0],...BASE[1]].map(([c,r])=>k(c,r)));

/* ---------- ESPINHA DAS ROTAS ----------
   A espinha tem UMA casa por passo e é ela que indexa torre e onda: `frentes`
   guarda um índice desta lista. Alargar a espinha mudaria o significado de todo
   índice do motor — por isso quem alarga é o corredor, mais abaixo. */
/* sobe pela coluna 0 e vira à direita na linha 0, parando antes da base inimiga */
const L_TOPO=(()=>{const l=[];
  for(let r=N-2;r>=1;r--) l.push([0,r]);
  for(let c=1;c<=N-2;c++){ if(_BASE_K.has(k(c,0)))break; l.push([c,0]); }
  return l;})();
/* a rota de baixo NÃO é escrita: é o espelho da de cima, percorrida ao contrário */
const L_BOT=L_TOPO.map(([c,r])=>gira(c,r)).reverse();

/* O meio é espelho de si mesmo: metade escrita, e o resto espelhado.
   Lado ÍMPAR tem uma casa fixa da rotação, que vira o centro exato da rota.
   Lado PAR não tem: o eixo cai entre duas casas, e aí a rota é só as duas
   metades emendadas. Sem esse ramo, `mapa=8` e `mapa=10` da bateria quebravam. */
const L_MEIO=(()=>{
  const ocup=new Set([...BASE[0],...BASE[1],...L_TOPO,...L_BOT].map(([c,r])=>k(c,r)));
  const fixo=(()=>{ for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
      const g=gira(c,r); if(g[0]===c&&g[1]===r&&noTab(c,r))return[c,r]; } return null; })();
  /* Até onde a metade escrita desce. COM casa fixa, ela para na linha do centro
     e a casa fixa fecha a emenda. SEM casa fixa (o eixo cai entre casas), a
     metade precisa AVANÇAR uma linha além do meio: aí a última casa dela e o
     espelho dessa casa são vizinhas, e as duas metades se emendam sozinhas.
     Parar na linha do centro deixava um vão de 3 casas — a rota do meio ficava
     partida em duas, e a onda atravessava o buraco. Apareceu só em N ímpar sem
     centro (11), porque em 9 a casa fixa escondia o defeito. */
  const paraR=fixo?fixo[1]:(LINS/2-1);
  const[x1,y1]=centro(...BASE[0][1]),[x2,y2]=centro(...BASE[1][1]),L=Math.hypot(y2-y1,x2-x1);
  const meia=[];
  for(let r=LINS-2;r>paraR;r--){
    let m=null,d0=1e9;
    for(let c=0;c<COLS;c++){
      if(!noTab(c,r)||ocup.has(k(c,r)))continue;
      const[x,y]=centro(c,r),d=Math.abs((y2-y1)*x-(x2-x1)*y+x2*y1-y2*x1)/L;
      if(d<d0){d0=d;m=[c,r];}
    }
    if(!m)continue;
    const ant=meia.at(-1)||BASE[0][1];
    if(dist(...ant,...m)>1){
      const p=vizinhos(...ant).find(v=>dist(...v,...m)===1&&!ocup.has(k(...v))&&!meia.some(z=>z[0]===v[0]&&z[1]===v[1]));
      if(p)meia.push(p);
    }
    meia.push(m);
  }
  const espelhada=meia.map(([c,r])=>gira(c,r)).reverse();
  /* Emenda, como rede de segurança: se ainda sobrar vão, caminha até fechá-lo em
     vez de tentar uma casa só. Vão de 3 já aconteceu, e uma casa não o cobria.
     A rota do meio TEM que ser um caminho contínuo — é ela que indexa a onda. */
  const costura=[];
  if(!fixo&&meia.length&&espelhada.length){
    let atual=meia.at(-1);
    for(let guarda=0; guarda<LINS && dist(...atual,...espelhada[0])>1; guarda++){
      const passo=vizinhos(...atual)
        .filter(v=>!ocup.has(k(...v))&&!costura.some(z=>z[0]===v[0]&&z[1]===v[1]))
        .sort((a,b)=>dist(...a,...espelhada[0])-dist(...b,...espelhada[0]))[0];
      if(!passo) break;
      costura.push(passo); atual=passo;
    }
  }
  return [...meia, ...(fixo?[fixo]:costura), ...espelhada];
})();

const ROTAS={topo:L_TOPO,meio:L_MEIO,baixo:L_BOT};

/* ---------- CORREDOR: a rota com DUAS casas de largura ----------
   A espinha indexa; o corredor é onde se anda. Cada passo ganha a casa vizinha
   mais para dentro do mapa, e com isso suporte e atirador finalmente cabem na
   mesma rota — que era a queixa registrada em docs/ESTADO.md.

   Os estreitamentos são de propósito, não sobra: a ENTRADA DA BASE e a TRAVESSIA
   DO RIO ficam com uma casa só, para que ainda exista lugar onde segurar avanço.
   Como o corredor de baixo é o espelho do de cima, o estreitamento nasce em par. */
const _espinhaK=new Set([...L_TOPO,...L_BOT,...L_MEIO].map(([c,r])=>k(c,r)));
const _MEIO_TAB=[(COLS-1)/2,(LINS-1)/2];
const _usados=new Set();
const _paraDentro=p=>{
  const cand=vizinhos(...p).filter(([a,b])=>
    !_espinhaK.has(k(a,b))&&!_BASE_K.has(k(a,b))&&!_usados.has(k(a,b)));
  if(!cand.length)return null;
  return cand.sort((u,v)=>dist(...u,..._MEIO_TAB)-dist(...v,..._MEIO_TAB)||u[0]-v[0]||u[1]-v[1])[0];
};
/* Só a BOCA DA BASE fica com uma casa. O estreitamento do meio da rota foi
   removido: no meio ele era calculado sobre a METADE da lista (a rota do meio é
   escrita pela metade e espelhada), então caía no lugar errado e deixava a rota
   central com 6 casas extras para 10 de espinha, contra 12 para 17 do topo.
   O resultado era uma rota do meio visivelmente mais fina que as outras duas. */
const _estreito=i=>i===0;
const _alarga=l=>{ const ex=[];
  l.forEach((p,i)=>{ if(_estreito(i,l.length))return;
    const v=_paraDentro(p); if(v){ ex.push(v); _usados.add(k(...v)); _usados.add(k(...gira(...v))); } });
  return ex; };
const EX_TOPO=_alarga(L_TOPO);
const EX_BOT=EX_TOPO.map(([c,r])=>gira(c,r));
/* no meio só a primeira metade é alargada; a outra é o espelho dela */
const _EX_MEIO_A=_alarga(L_MEIO.slice(0,Math.floor(L_MEIO.length/2)));
const EX_MEIO=[..._EX_MEIO_A,..._EX_MEIO_A.map(([c,r])=>gira(c,r))];

const CORREDOR={topo:[...L_TOPO,...EX_TOPO],meio:[...L_MEIO,...EX_MEIO],baixo:[...L_BOT,...EX_BOT]};
const LANE=new Map();
Object.entries(CORREDOR).forEach(([nome,l])=>l.forEach(([c,r])=>LANE.set(k(c,r),nome)));

/* o rio é só pintura: separa as duas metades, não afeta movimento.
   Metade escrita e metade espelhada, como todo o resto. */
const RIO=(()=>{const meia=[];
  for(let r=LINS-1;r>Math.floor((LINS-1)/2);r--){const c=1+Math.floor(r/2);if(noTab(c,r))meia.push([c,r]);}
  return [...meia,...meia.map(([c,r])=>gira(c,r))];})();
const RIO_S=new Set(RIO.map(([c,r])=>k(c,r)));
const BASE_S=new Map();
BASE.forEach((b,t)=>b.forEach(([c,r])=>BASE_S.set(k(c,r),t)));

/* duas torres por lado, medidas a partir da PRÓPRIA base e espelhadas por construção.
   A versão anterior usava duas fórmulas diferentes para os dois lados e vinha com um
   aviso para não "consertar" o desencontro: consertar sozinho jogava a vitória de quem
   começa de 51,1% para 40,8%, porque o desencontro compensava a assimetria do mapa.
   Com o mapa de fato simétrico a compensação perdeu a função e sai junto — o par
   (mapa simétrico + torre simétrica) foi medido em conjunto, que era o que o aviso
   pedia. Ver docs/patch-notes.md, v0.6. */
const TORRES_DEF=Object.entries(ROTAS).flatMap(([nome,l])=>{
  const n=l.length, d=[1,Math.max(2,Math.round(n*.28))];
  return [...d.map(i=>({rota:nome,i,t:0})), ...d.map(i=>({rota:nome,i:n-1-i,t:1}))];
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
    if(!noTab(c,r))continue;
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
  dragao:{n:"Dragão", vida:8, revide:1, volta:3, pre:"a Herança do Dragão"},
  barao: {n:"Barão",  vida:14, revide:2, volta:4, pre:"a Fúria do Barão"}
};
const R_DRAGAO=5, R_BARAO=8;          /* rodada em que cada morador passa a descer */
const morador=r=>r>=R_BARAO?"barao":"dragao";
const DRAGAO_PODER=1;      /* por Dragão levado, permanente e acumulativo */
const BARAO_PODER=2;       /* enquanto a Fúria durar */
const BARAO_RODADAS=2;     /* e ela dura pouco — é botão de ponto-sem-volta, não renda */
const GOLPE_HAB=1, GOLPE_ULT=2;   /* quanto cada golpe tira do poço — ver atacaEpico */

/* ---------- ESTADO ---------- */
let J,dadoSel=null,ativo=null,habSel=null,selHeroi=null,alvos=[],alvosTorre=[],alvosEpico=[],
    alvoNexus=null,mover=[],lojaHeroi=null;

function novo(){
  J={
    rodada:1, vez:0, primeiro:0, fase:"oculto", fim:null,
    times:[0,1].map(t=>({
      placas:0, prio:0, prioGuardada:0, ward:0,
      caca:null, cacaRevelada:null,
      dragoes:0, baroes:0, barao:0, retomada:0,
      feitico:1, feiticoCd:0,
      herois:TIMES[t].map((id,i)=>{
        const b=CATALOGO[id];
        return{id,t,...b,vidaMax:b.vida,vida:b.vida,esc:0,ouro:0,pat:0,itens:[],veuAtivo:0,semCura:0,
          pos:[...BASE[t][i%2]], morto:0, agiu:0, preso:0, intoc:0, marca:0, recarga:0, extraPoder:0};
      })
    })),
    dados:[], mov:{v:0,rest:0},
    frentes:{topo:centroRota("topo"),meio:centroRota("meio"),baixo:centroRota("baixo")},
    torres:TORRES_DEF.map(d=>({...d,vida:VIDA_TORRE})),
    /* vida 0 = o poço está vazio; `volta` é a rodada em que o próximo morador desce */
    poco:{id:"dragao", vida:0, vidaMax:EPICO.dragao.vida, volta:R_DRAGAO},
    camps:[
      {id:"azul",t:0,pos:[3,4],ouro:3,respawn:0,ativo:1},
      {id:"carmim",t:1,pos:[7,6],ouro:3,respawn:0,ativo:1},
      {id:"neutro",t:-1,pos:[6,4],ouro:4,respawn:0,ativo:1}
    ],
    nexus:[VIDA_NEXUS,VIDA_NEXUS], nexusBatido:[0,0], motivoFim:null, log:[]
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
  const m=rolaMovimento()+extra;
  J.mov={v:m,rest:m};
  /* RETOMADA aplicada: o freio da bola de neve vira DADO, que era a intenção
     declarada na seção RETOMADA. Antes `tm.retomada` era calculado e desenhado
     no HUD, mas a mão era sempre de 3 — o freio nunca chegava à mesa. */
  J.dados=Array.from({length:3+tm.retomada},(_,i)=>
    ({v:rolaAcao(),usado:0,...(i>2?{extra:1}:{})}));

  dadoSel=ativo=habSel=selHeroi=null; alvos=[]; mover=[];
  reg(t?"c":"a",`${NOMES[t]} rola — movimento ${m} · ações ${J.dados.map(d=>d.v).join(" · ")}`);
  if(tm.retomada) reg("b",`RETOMADA — ${NOMES[t]} está atrás e rola ${tm.retomada} dado${tm.retomada>1?"s":""} a mais`);
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
  const cac=J.times[t].herois.find(h=>CATALOGO[h.id].pos==="selva")||J.times[t].herois[1];
  if(cac.morto){ reg("b",`Plano de Caça falhou — Caçador morto`); return; }

  if(z==="selva"){
    /* FARM: só premia se o caçador realmente tiver coletado camp nesta rodada.
       coletaAcampamento marca farmouCamp. */
    if(cac.farmouCamp){
      cac.ouro+=1;
      reg(t?"c":"a",`PLANO FARM cumprido — ${cac.n} ganha +1 ouro`);
    } else reg("b",`PLANO FARM não cumprido — nenhum acampamento coletado`);
  }else{
    const chegou=rotaDaPos(cac)===z;
    if(chegou){
      cac.gankPlano=z;
      reg("b",`PLANO ${z.toUpperCase()} CUMPRIDO — próxima habilidade ofensiva de ${cac.n} nessa rota recebe +2 Força`);
    } else reg("b",`PLANO ${z.toUpperCase()} falhou — ${cac.n} não chegou à zona ativa da rota`);
  }
  cac.farmouCamp=0;
  pinta();
}

/* ---------- FIM DE RODADA ---------- */
function rotaDaPos(h){
  let melhor=null, md=1e9, idx=-1;
  Object.entries(ROTAS).forEach(([nome,l])=>{
    l.forEach((p,i)=>{
      const d=dist(...h.pos,...p);
      if(d<md){md=d;melhor=nome;idx=i;}
    });
  });
  if(md>1||!melhor)return null;

  /* REGRA DE MESA: só exerce pressão depois de passar da própria Torre Exterior.
     No físico, a própria torre é a linha visual: antes dela = desenvolvimento; depois = lane ativa. */
  const l=ROTAS[melhor];
  const minhas=TORRES_DEF.filter(x=>x.t===h.t&&x.rota===melhor).map(x=>x.i);
  if(!minhas.length)return melhor;
  const exterior = h.t===0 ? Math.max(...minhas) : Math.min(...minhas);
  const passou = h.t===0 ? idx>exterior : idx<exterior;
  return passou?melhor:null;
}
function fimDaRodada(){
  /* a Fúria do Barão empurra as três rotas sozinha, mesmo sem herói nenhum nelas.
     É o que faz do Barão um relógio: dois times parados param de empatar. */
  const furia=J.times.map(tm=>tm.barao>0?1:0);
  Object.entries(ROTAS).forEach(([nome,l])=>{     // ondas: a torre viva trava o avanço
    const n0=vivos(0).filter(h=>rotaDaPos(h)===nome).length;
    const n1=vivos(1).filter(h=>rotaDaPos(h)===nome).length;
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
  [0,1].forEach(t=>{                              // o feitiço do time volta a carregar
    const tm=J.times[t];
    if(tm.feitico||!tm.feiticoCd)return;
    tm.feiticoCd--;
    if(!tm.feiticoCd){ tm.feitico=1; reg("b",`o feitiço do ${NOMES[t]} recarregou`); }
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
    h.agiu=0; h.preso=Math.max(0,h.preso-1); h.intoc=0; h.esc=0;
    h.veuAtivo=0; h.semCura=Math.max(0,h.semCura-1);
  });
  desempilha();
  J.nexusBatido=[0,0];                            // e o Nexus também, um golpe por rodada
  J.times.forEach(t=>{t.caca=null;t.cacaRevelada=null;t.ward=0;});
  if(J.fim!==null){ pinta(); return telaFim(); }
  /* Turnos seguem em sequência contínua: AZUL → CARMIM → AZUL → CARMIM.
     Alternar a iniciativa por rodada criava a fronteira 1–2 | 2–1, percebida no
     playtest como turnos repetidos do mesmo lado. O impacto de balanceamento
     desta regra precisa ser medido novamente antes de a versão ser aprovada. */
  J.rodada++; reg("r",`— rodada ${J.rodada} — começa ${NOMES[J.primeiro]}`);
  atualizaAcampamentos();
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
  coletaAcampamento(h);
  reg(J.vez?"c":"a",
    `${h.n} anda ${d} ${d>1?"casas":"casa"}${ehAgil(h)&&d>0?" (ágil)":""} — movimento restante ${J.mov.rest}`);
  calcula(); pinta();
}
/* ---------- FEITIÇOS DE INVOCADOR ---------- */
/* UMA carga por time, não uma por herói. A primeira versão deu Lampejo e Retorno a
   cada um dos cinco, com recarga própria: vinte contadores girando na mesa, e o
   feitiço deixava de ser decisão — quando todo mundo tem, ninguém escolhe.
   Agora o time tem uma carga só, gasta em Lampejo OU em Retorno, e ela demora
   3 rodadas para voltar. Numa partida de ~15 rodadas isso dá quatro ou cinco usos
   no total, para os cinco heróis somados.

   O que isso compra, e é o ponto: a pergunta deixa de ser "posso?" e vira "quem
   merece?". E o adversário passa a contar junto — feitiço gasto é informação, do
   mesmo jeito que no MOBA se guarda na cabeça quem está sem flash.

   É aqui, e só aqui, que a versão digital se solta do tabuleiro físico: no papel
   seria um contador extra por time. Um cabe na mesa; vinte não cabiam. */
const LAMPEJO_ALC=2, FEITICO_CD=3, RETORNO_CURA=3;

const temFeitico=t=>!!J.times[t].feitico;
function gastaFeitico(t){
  const tm=J.times[t];
  tm.feitico=0; tm.feiticoCd=FEITICO_CD;
}

function iniciaLampejo(){
  const h=selHeroi;
  if(!h||h.morto||h.t!==J.vez||J.fase!=="jogando")return;
  if(!temFeitico(h.t))
    return toast(`feitiço recarrega em ${J.times[h.t].feiticoCd}`,"morte");
  modo = modo==="lampejo" ? null : "lampejo";
  habAtual=null; confirmar=null; calcula();
  if(modo==="lampejo"&&!mover.length){ modo=null; calcula(); pinta();
    return toast("nenhuma casa livre no salto","morte"); }
  vibra(8); pinta();
}
function lampejaAte(c,r){
  const h=selHeroi;
  if(!h||!temFeitico(h.t)||em(c,r)||!noTab(c,r))return;
  if(dist(...h.pos,c,r)>LAMPEJO_ALC)return;
  const de=[...h.pos];
  h.pos=[c,r]; gastaFeitico(h.t);
  h.preso=0;                       /* o Lampejo é a saída do prende — é o sabor dele */
  coletaAcampamento(h);
  reg(J.vez?"c":"a",`LAMPEJO — ${h.n} salta ${dist(...de,c,r)} `
     +`${dist(...de,c,r)>1?"casas":"casa"} · feitiço do time gasto`);
  toast("lampejo","gank");
  vibra([10,30,10]);
  modo=null; calcula(); pinta(); animaMovimento(h,de);
}
function usaRetorno(){
  const h=selHeroi;
  if(!h||h.morto||h.t!==J.vez||J.fase!=="jogando")return;
  if(!temFeitico(h.t))
    return toast(`feitiço recarrega em ${J.times[h.t].feiticoCd}`,"morte");
  if(naBase(h)) return toast("já está na própria base","morte");
  /* a única trava que sobrevive à carga compartilhada: quem foi pego não escapa.
     Sem ela o Retorno viraria botão de anular gank, e gank é metade do jogo. */
  const colado=vizinhos(...h.pos).some(([vc,vr])=>{ const o=em(vc,vr); return o&&o.t!==h.t; });
  if(colado) return toast("inimigo colado — retorno interrompido","morte");
  const de=[...h.pos];
  h.pos=[...BASE[h.t][0]];
  gastaFeitico(h.t);
  h.preso=0;
  const antes=h.vida;
  h.vida=Math.min(h.vidaMax,h.vida+RETORNO_CURA);
  desempilha();
  reg(J.vez?"c":"a",`RETORNO — ${h.n} volta à base`
     +(h.vida>antes?` e recupera ${h.vida-antes}`:"")+` · feitiço do time gasto`);
  toast("retorno","");
  vibra([14,40,14]);
  limpaModo(); pinta(); animaMovimento(h,de);
}

const campEm=(c,r)=>J.camps.find(cp=>cp.ativo&&cp.pos[0]===c&&cp.pos[1]===r);
function coletaAcampamento(h){
  const cp=campEm(...h.pos);
  if(!cp||cp.respawn>0)return;
  if(CATALOGO[h.id].pos==="selva") h.farmouCamp=1;
  if(cp.t!==-1&&cp.t!==h.t){
    cp.ativo=0; cp.respawn=3; h.ouro+=cp.ouro+1;
    reg("b",`${h.n} invadiu a selva e roubou um acampamento (+${cp.ouro+1} ouro)`);
  }else{
    cp.ativo=0; cp.respawn=3; h.ouro+=cp.ouro;
    reg(h.t?"c":"a",`${h.n} farmou acampamento (+${cp.ouro} ouro)`);
  }
}
function atualizaAcampamentos(){
  J.camps.forEach(cp=>{
    if(cp.respawn>0){ cp.respawn--; if(cp.respawn===0)cp.ativo=1; }
  });
}

function usaHab(alvo){
  const{h,forca}=ativo, hb=h.habs[habSel], F=forca, ef=hb.ef;
  if(F<hb.f)return;
  const critico=ativo.seis;
  let txt=`${h.n} usa ${hb.n} (Força ${F})`;

  let bonusGank=0;
  if(h.gankPlano && (ef.dano||ef.danoFixo||ef.danoVizinhos||ef.danoRaio)){
    if(rotaDaPos(h)===h.gankPlano){
      bonusGank=2; h.gankPlano=null;
      reg("b",`GANK! Plano cumprido: +2 Força para ${h.n}`);
    }
  }
  const poder=poderTotal(h)+(h.recarga?h.recarga:0)+dupla(h)+bonusGank;
  const base=(mult)=>Math.round(F*mult)+poder;

  if(ef.doar){
    J.dados.push({v:F,usado:0,extra:1,doado:1,dono:alvo.id});
    alvo.agiu=0;
    reg(J.vez?"c":"a",`${h.n} doa um dado ${F} para ${alvo.n} — ele pode agir agora`);
    toast(`Dado ${F} doado para ${alvo.n}`,"");
    calcula(); return pinta();
  }
  if(ef.escudo){ alvo.esc+=F+ef.escudo; txt+=` — escudo ${F+ef.escudo} em ${alvo.n}`; }
  if(ef.cura){ if(h.semCura){txt+=' — CURA BLOQUEADA';} else {h.vida=Math.min(h.vidaMax,h.vida+ef.cura); txt+=` — cura ${ef.cura}`;} }
  if(ef.ouro){ h.ouro+=ef.ouro; txt+=` (+${ef.ouro} de ouro)`; }
  if(ef.recarga){ h.recarga=ef.recarga; txt+=` — próximo golpe +${ef.recarga}`; }
  if(ef.intocavel){ h.intoc=1; txt+=" — intocável até o próximo turno"; }
  if(ef.ward){
    J.times[h.t].ward=1;
    const z=J.times[1-h.t].caca;
    txt+=z?` — WARD revela o PLANO DE CAÇA inimigo: ${(z==="selva"?"FARM":z.toUpperCase())}`:" — ward posta";
  }
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
  tm.placas-=2; J.dados[dadoSel].v=rolaAcao();
  reg("b",`${NOMES[J.vez]} gasta 2 placas: re-rola para ${J.dados[dadoSel].v}`);
  pinta();
}


/* abreLoja mora na seção FICHAS / LOJA / LOG — é a versão em sheet, que roda. */
