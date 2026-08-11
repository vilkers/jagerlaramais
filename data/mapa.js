/* ═══════════════════════════════════════════════════════════════════
   JAGERLARAMAIS — a GEOMETRIA do tabuleiro. Fonte única.

   Não tem estado de partida, não toca em DOM e não conhece regra: só diz onde
   ficam as casas, as rotas, as bases, as torres e o poço. Por isso pode ser
   carregado por qualquer página.

   Moraram dentro de `jogo/jogo.js` até a v0.6.4, e o preço foi o guia desenhar
   um mapa PRÓPRIO, escrito à mão, que ficou parado num 7×7 de duas versões
   atrás — com dois poços épicos e quatro acampamentos de selva que o motor
   nunca teve. Mesma doença dos três catálogos de herói da v0.3.

   Quem consome: jogo/jogo.js (o motor), guia/index.html (o mapa do manual),
   sim/ (medição). Todo mundo lê daqui; ninguém redesenha.

   TUDO SAI DE `const N`. Mudar N redesenha rotas, bases, rio, torres e poço.
   Depois de mudar, rode `node sim/simetria.js` — ele sai com 1 se os dois lados
   deixarem de ser espelho.
   ═══════════════════════════════════════════════════════════════════ */

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

/* Node (sim/, scripts): no navegador `module` não existe e esta linha é ignorada. */
if(typeof module!=="undefined")
  module.exports={N,COLS,LINS,R,k,centro,dist,gira,NO_TAB,noTab,vizinhos,BASE,
                  L_TOPO,L_BOT,L_MEIO,ROTAS,CORREDOR,LANE,RIO,RIO_S,BASE_S,
                  TORRES_DEF,centroRota,POCO,POCO_K};
