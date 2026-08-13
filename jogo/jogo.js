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
/* Quantos itens este herói carrega. Três é o padrão; o Relicário dá um quarto.
   Existia como `h.slots||3` copiado em quatro lugares — a loja, a checagem de
   compra, o item grátis e o texto do botão. Bastava um deles ficar para trás
   para o Relicário "não funcionar", que foi exatamente o relato da v15. */
const capacidade=h=>h.slots||3;

/* ---------- ESCALA DA ULTIMATE ----------
   Medido no catálogo da v15: em 15 dos 16 heróis que causam dano, a habilidade
   BÁSICA com um dado 6 batia mais forte que a própria Ultimate. Nyx e Cael por
   3 pontos. A causa é a fórmula, não os números dos heróis: dano era
   `round(Força × dano) + Poder` para os três slots iguais, e como quase toda
   básica e quase toda Ultimate têm `dano:1`, as duas rendiam exatamente o mesmo
   com o mesmo dado — só que a básica aceita QUALQUER dado e a Ultimate exige 5+.
   Mesmo dano e mais exigência: a Ultimate era estritamente pior.

   A correção é uma linha de regra, não vinte de balanceamento: a Ultimate
   converte o dado em metade a mais de dano. É fácil de dizer na mesa ("a
   Ultimate rende 1,5× o dado"), preserva a identidade de cada herói e não mexe
   em nenhum número do catálogo — Ultimate de utilidade continua valendo pelo que
   faz, e Ultimate ofensiva volta a ser um pico. */
const ESCALA_ULT=1.25;
/* ---------- A HABILIDADE DO MEIO PAGA O PRÓPRIO DADO ----------
   Medido em `sim/habs.js`, com o dado mínimo de cada uma e alvo de 2 de
   armadura: Provocar, Puxada, Emaranhar e Puxada Funda entregavam EXATAMENTE o
   mesmo dano que a básica do próprio herói. Só que a básica sai com qualquer
   dado e elas exigem 3+ — o jogador pagava um dado mais raro pelo mesmo número,
   e o efeito (prender, puxar) vinha como se fosse de graça. Não vinha: vinha em
   vez da liberdade de gastar aquele 3 em outro herói.

   1,2 e não 1,15: com 1,15 o arredondamento comia o bônus justamente no dado 3,
   que é o dado mínimo da maioria delas (round(3×1,15)=3, igual à básica). Com
   1,2 o ganho é +1 em TODO dado de 3 a 6 — pequeno, constante e legível. O pico
   continua sendo da Ultimate, que escala 1,25 e pede 5 ou 6. */
const ESCALA_CTRL=1.2;
const escalaDe=slot=>slot===2?ESCALA_ULT:slot===1?ESCALA_CTRL:1;
const inventarioCheio=h=>h.itens.length>=capacidade(h);
function bonus(h,campo){ return (h.itens||[]).reduce((a,id)=>a+(ITEM[id].ef[campo]||0),0); }
function auraDe(h){
  return J.times[h.t].herois.some(o=>o!==h&&!o.morto&&(o.itens||[]).some(i=>ITEM[i].ef.aura)
    && dist(...h.pos,...o.pos)<=1) ? 1 : 0;
}
const poderTotal=h=>h.poder+h.extraPoder+bonus(h,"poder")+auraDe(h);

/* ---------- DEFENDER JUNTO DA TORRE ----------
   +1 de Armadura para quem está encostado numa torre VIVA do próprio time. É a
   diferença entre brigar no vão da rota e brigar em casa: quem defende ganha um
   ponto, quem mergulha na torre inimiga não ganha nada.

   Um ponto e não mais. Com a vida da v21 (18–25) e o golpe médio na casa de 6–8,
   +1 tira cerca de um sétimo do dano — muda a conta da troca sem tornar o par
   torre+herói impossível de quebrar, que era o risco levantado. E ele morre com
   a torre: derrubada a estrutura, a rota volta a ser vão. */
const ARM_TORRE=1;
const sobTorreAmiga=h=>(h.t===0||h.t===1)&&J.torres.some(x=>
  x.t===h.t&&x.vida>0&&dist(...h.pos,...ROTAS[x.rota][x.i])<=1);
const armTotal=h=>h.arm+bonus(h,"arm")+(sobTorreAmiga(h)?ARM_TORRE:0);
/* TETO DE ALCANCE. Sem ele o Corvo (base 4) somava Cetro +1 e Lente +2 e
   atirava a SETE hexágonos — atravessava meio tabuleiro sem sair do lugar, que
   foi a queixa "os range tão conseguindo 4, 5 hexágonos". Quatro é o teto: ainda
   é o dobro do corpo a corpo, e ainda dá para fugir andando. */
const ALCANCE_MAX=4;
const alcTotal=h=>Math.min(ALCANCE_MAX,h.alc+bonus(h,"alc"));
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
const REVIDE_TORRE=4;      /* e a torre cobra o pedágio de quem encostou */
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

/* ---------- O MATO ----------
   Terreno é uma coisa só, classificada uma vez: base, poço, rota (o corredor
   largo), rio, e o que sobra é MATO. `desenhaMapa` pintava por esta mesma ordem
   com um if/else local; agora a ordem mora aqui, porque a visão passou a
   depender dela e duas cópias da regra de terreno viram duas regras diferentes
   na primeira vez que alguém mexer no mapa. */
const MATO=new Set();
NO_TAB.forEach(key=>{
  if(BASE_S.has(key)||key===POCO_K||LANE.has(key)||RIO_S.has(key))return;
  MATO.add(key);
});
const ehMato=(c,r)=>MATO.has(k(c,r));

/* ---------- ACAMPAMENTOS ----------
   As três posições eram fixas no código: [3,4], [7,6] e [6,4]. Medido no
   tabuleiro 11×11 da v15, o acampamento NEUTRO ficava a 8 da base Azul e a 5 da
   base Carmim — três hexágonos de vantagem geográfica para um lado num objetivo
   que o nome diz ser de ninguém. Não era escolha de design: era um número que
   sobreviveu ao tabuleiro crescer de 8×8 para 11×11.

   Agora as três são DERIVADAS, pelo mesmo princípio que já escolhe o poço épico:
   o mapa muda de tamanho e elas se recolocam sozinhas.

   · neutro — entre as casas equidistantes das duas bases, a mais central e fora
     das rotas. Empate exato por construção, e o desempate é a acessibilidade.
   · azul/carmim — ficam onde estavam, [3,4] e [7,6]. Foram medidos e já eram
     espelho um do outro (6 da própria base, 8 da adversária): o defeito estava
     só no neutro, e mexer nos outros dois seria mudar o mapa sem motivo. O
     `gira` aqui é a garantia de que continuam espelhos se alguém editar um. */
const _distBase=(p,t)=>Math.min(...BASE[t].map(([c,r])=>dist(c,r,...p)));
/* Duas casas neutras possíveis, uma de cada lado da selva, e a partida sorteia
   qual usa. Antes era uma só, sempre no mesmo mato — "o acampamento neutro tá
   sempre aparecendo no mato da direita". Uma posição fixa vira rota decorada: na
   terceira partida todo mundo já sabe o caminho e o objetivo deixa de ser
   disputa. Alternando, a primeira decisão da partida volta a ser uma pergunta.

   As duas continuam equidistantes das bases — a justiça não é sorteada, só o
   lado é. `CAMP_NEUTRO_LADOS` guarda as duas; `sorteiaNeutro()` escolhe. */
const CAMP_NEUTRO_LADOS=(()=>{
  const meio=[(COLS-1)/2,(LINS-1)/2];
  const justas=[];
  for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
    const p=[c,r];
    if(!noTab(c,r)||k(c,r)===POCO_K||BASE_S.has(k(c,r))||LANE.has(k(c,r)))continue;
    if(_distBase(p,0)!==_distBase(p,1))continue;
    if(dist(...p,...meio)>4)continue;                 // perto do centro, disputável
    justas.push(p);
  }
  if(justas.length<2) return [justas[0]||[6,4],justas[0]||[6,4]];
  /* as duas mais distantes ENTRE SI são naturalmente uma de cada lado */
  let par=[justas[0],justas[1]], melhor=-1;
  for(let i=0;i<justas.length;i++)for(let j=i+1;j<justas.length;j++){
    const d=dist(...justas[i],...justas[j]);
    if(d>melhor){melhor=d;par=[justas[i],justas[j]];}
  }
  return par;
})();
let CAMP_NEUTRO=CAMP_NEUTRO_LADOS[0];
function sorteiaNeutro(){
  CAMP_NEUTRO=CAMP_NEUTRO_LADOS[Math.floor(Math.random()*CAMP_NEUTRO_LADOS.length)];
  return CAMP_NEUTRO;
}
/* ---------- VISÃO ----------
   Regra de MOBA, direto: **você enxerga o que as suas peças enxergam.** Cada
   fonte acende um raio ao redor de si, e o que estiver fora de todos os raios
   é escuridão — inclusive pedaço de rota.

   A v19 tinha uma versão simplificada disto, por REGIÃO: o mato só se enxergava
   com alguém dentro dele, e rota/rio/base eram sempre visíveis. Funcionava, mas
   não era o que o jogo queria: escondia só a selva, e a rota era um corredor
   iluminado de graça. Agora a visão é do tabuleiro inteiro e vem das peças.

   Os raios são pequenos de propósito. Num 11×11, raio grande revela tudo e a
   névoa vira enfeite; com estes números a linha de frente enxerga à sua volta e
   o resto do mapa é suposição.  */
const VISAO_HEROI=2;      /* o que o herói vê à volta */
const VISAO_TORRE=2;      /* torre viva vigia o próprio pedaço de rota */
const VISAO_BASE=2;       /* a própria base nunca é surpresa */
const VISAO_ONDA=2;       /* a onda é o creep: enxerga onde está empurrando */
const VISAO_WARD=3;       /* ward vê mais que herói — é o que a torna comprável */
const WARD_RODADAS=3;     /* e ela apaga sozinha */

/* A escolha, no início da rodada. Os dois escolhem ANTES de qualquer um jogar, e
   um não vê o do outro — é a aposta às cegas que dá sal à mecânica. Em hotseat
   isso são duas telas em sequência; contra a IA, só a do humano.
   A escolha só aparece se o time ainda TEM Caçador vivo: pedir aposta a quem não
   tem peça para mover é pedir clique por nada. */
function abreRotacoes(){
  if(!J||J.fim!==null)return;
  const humanos=[0,1].filter(t=>!(simMode||(aiMode&&t===1)));
  [0,1].forEach(t=>{ if(!humanos.includes(t)) J.rotacao[t]=cacadorDe(t)?iaEscolheRotacao(t):null; });
  const fila=humanos.filter(t=>cacadorDe(t));
  if(!fila.length) return pinta();
  perguntaRotacao(fila,0);
}
function perguntaRotacao(fila,i){
  if(i>=fila.length){ pinta(); return; }
  const t=fila[i], h=cacadorDe(t);
  const bts=ROTACOES.map(r=>{
    const destino=r.onde(t);
    const d=destino?dist(...h.pos,...destino):99;
    const chega=d<=ROTACAO_PASSOS+1;
    return `<button class="grande rotCac" data-r="${r.id}" style="font-size:15px;padding:12px;text-align:left">
      ${r.ico} ${r.n}<br><span style="font-size:12.5px;opacity:.8">${r.d}</span>
      <br><span style="font-size:12px;opacity:${chega?".75":".55"}">
      ${d} de distância — ${chega?"dá para chegar nesta rodada":"longe demais, não chega"}</span></button>`;
  }).join("");
  abre(`<span class="et">Rotação do Caçador · rodada ${J.rodada}</span>
    <h2 class="t${t}">${NOMES[t]}: para onde vai ${h.n}?</h2>
    <p>Ele anda <b>${ROTACAO_PASSOS} casas de graça</b> no início do seu turno.
    O outro jogador <b>não vê</b> a sua escolha — e você não vê a dele.
    <b>Só ganha o bônus se chegar.</b></p>${bts}`);
  G("telacx").querySelectorAll(".rotCac").forEach(b=>b.onclick=()=>{
    J.rotacao[t]=b.dataset.r; fecha(); perguntaRotacao(fila,i+1); });
}

/* ---------- ROTAÇÃO DO CAÇADOR ----------
   No início de cada rodada os DOIS jogadores escolhem, escondido um do outro,
   para onde o próprio Caçador vai. No seu turno ele migra para lá, e o destino
   decide o bônus. A graça é a aposta às cegas: você compromete o Caçador antes
   de ver o que o outro fez com o dele.

   AVISO DE HISTÓRIA, e ele é o motivo do desenho ser este. A v18 já teve uma
   "rotação do Caçador" e ela foi DESFEITA na v19 (ver docs/DECISOES-PENDENTES,
   item 6): lá o Caçador gastava uma ação, SAÍA DO TABULEIRO e reaparecia noutra
   entrada de selva no turno seguinte. A correção veio do Vinicius — a peça tem
   de continuar existindo num lugar real, e o que muda é quem enxerga.

   Por isso aqui NÃO HÁ TELEPORTE. O Caçador anda de verdade, no mapa, até
   ROTACAO_PASSOS casas na direção escolhida, de graça (sem tocar no Dado
   Mestre). Ele continua interceptável, continua ocupando casa, continua
   aparecendo ao sair do mato. O que a rotação compra é TEMPO, não ubiquidade —
   e é o que faz dela uma decisão em vez de um botão. */
const ROTACAO_PASSOS=3;
const ROTACOES=[
  {id:"proprio", n:"Acampamento próprio", ico:"⛰",
   d:"Farm seguro. +3 de ouro ao chegar.",
   onde:t=>J.camps.find(c=>c.t===t).pos,
   bonus:(h,t)=>{ h.ouro+=3; return "+3 de ouro"; }},
  {id:"neutro", n:"Acampamento neutro", ico:"◈",
   d:"A disputa do meio. +1 de Poder até o seu próximo turno.",
   onde:()=>J.camps.find(c=>c.t===-1).pos,
   bonus:(h)=>{ h.extraPoder+=1; h.buffP=(h.buffP||0)+1; return "+1 de Poder"; }},
  {id:"invasao", n:"Acampamento inimigo", ico:"⚔",
   d:"Invasão. +4 de ouro, mas você termina o passo dentro da casa do outro.",
   onde:t=>J.camps.find(c=>c.t===1-t).pos,
   bonus:(h)=>{ h.ouro+=4; return "+4 de ouro roubado"; }},
  {id:"poco", n:"O poço", ico:"☠",
   d:"Objetivo. Os seus golpes no poço valem +1 nesta rodada.",
   onde:()=>POCO,
   bonus:(h)=>{ h.focoPoco=1; return "golpes no poço valem +1"; }}
];
const ROTACAO=Object.fromEntries(ROTACOES.map(r=>[r.id,r]));
const cacadorDe=t=>J.times[t].herois.find(h=>!h.morto&&CATALOGO[h.id].pos==="selva");

/* Um passo na direção do destino. Prefere a casa livre que APROXIMA; se não
   houver nenhuma, aceita uma de mesma distância para contornar.

   O contorno não é firula. Sem ele, medido: saindo da própria base o Caçador
   tem uma só casa que aproxima, e no começo da partida ela está ocupada por um
   aliado — a rotação inteira não saía do lugar por causa do próprio time. Ficar
   preso atrás do adversário é informação; ficar preso atrás do seu suporte é só
   frustração. `visitadas` impede o vaivém entre duas casas de mesma distância. */
function passoNaDirecao(h,destino,visitadas){
  const atual=dist(...h.pos,...destino);
  const livre=p=>noTab(...p)&&!em(...p)&&!(visitadas&&visitadas.has(k(...p)));
  const perto=vizinhos(...h.pos).filter(p=>livre(p)&&dist(...p,...destino)<atual)
    .sort((a,b)=>dist(...a,...destino)-dist(...b,...destino));
  if(perto.length) return perto[0];
  return vizinhos(...h.pos).filter(p=>livre(p)&&dist(...p,...destino)===atual)[0]||null;
}
/* A migração, no início do turno do dono. Anda de graça e só ganha o bônus se
   CHEGAR — comprometer o Caçador e não chegar é o custo da aposta errada. */
function migraCacador(t){
  const id=J.rotacao&&J.rotacao[t];
  if(!id||!ROTACAO[id])return;
  const h=cacadorDe(t);
  if(!h)return;
  const r=ROTACAO[id], destino=r.onde(t);
  if(!destino)return;
  let andou=0;
  const visitadas=new Set([k(...h.pos)]);
  for(let i=0;i<ROTACAO_PASSOS;i++){
    const p=passoNaDirecao(h,destino,visitadas);
    if(!p)break;
    visitadas.add(k(...p));
    const de=[...h.pos]; h.pos=[...p]; andou++;
    animaMovimento(h,de);
    coletaAcampamento(h);
  }
  if(andou) reg(t?"c":"a",`${h.n} rotaciona para ${r.n} — ${andou} casa${andou>1?"s":""} de graça`);
  if(dist(...h.pos,...destino)<=1){
    const txt=r.bonus(h,t);
    reg(t?"c":"a",`${h.n} chegou: ${r.n} — ${txt}`);
    fx(h.pos,r.ico,"esc");
  }else if(andou){
    reg("b",`${h.n} não alcançou ${r.n} nesta rodada — sem bônus`);
  }
  J.rotacao[t]=null;
}
/* A IA escolhe pelo estado do mapa, e não ao acaso: poço aberto e perto puxa;
   atrás em ouro puxa farm; senão invade. */
function iaEscolheRotacao(t){
  const h=cacadorDe(t);
  if(!h) return "proprio";
  if(J.poco.vida>0&&dist(...h.pos,...POCO)<=ROTACAO_PASSOS+2) return "poco";
  const meu=J.times[t].herois.reduce((a,x)=>a+x.ouro,0);
  const dele=J.times[1-t].herois.reduce((a,x)=>a+x.ouro,0);
  if(meu<dele) return "proprio";
  return "invasao";
}

/* ---------- EFEITO AO LONGO DO TEMPO ----------
   Sangramento e envenenamento. O jogo só tinha dano instantâneo: todo golpe
   resolvia no próprio turno, e por isso a única forma de pressionar alguém era
   estar do lado dele com dado na mão. O efeito com prazo é a primeira coisa que
   continua trabalhando depois que o dado acabou — e é o que dá sentido a recuar,
   perseguir e negar espaço.

   COBRA NO INÍCIO DO TURNO DA VÍTIMA, uma vez por rodada, e é a mesma âncora de
   escudo, prisão e buff (ver expiraDoTime): quem recebe sempre tem exatamente um
   turno adversário de exposição, jogando em primeiro ou em segundo.

   IGNORA ARMADURA E ESCUDO, de propósito. Não é o golpe chegando — é o golpe que
   já chegou, cobrando depois. A consequência de desenho é a que faltava: um
   Vharn com 17 de escudo e 4 de armadura era imune a quase tudo enquanto a
   Muralha durasse, e agora existe uma classe de dano que responde a ele. Em
   troca, o número é pequeno e não escala com o dado: quem quer matar continua
   precisando bater. */
const DOTS={
  sangramento:{n:"sangramento", selo:"SANGRANDO",   ico:"🩸"},
  veneno:     {n:"envenenamento", selo:"ENVENENADO", ico:"☠"}
};
/* ---------- ZONA — controle de área ----------
   A ward já provou que peça-no-mapa-com-prazo funciona neste motor, e a zona é a
   mesma ideia virada para o outro lado: em vez de acender o terreno, ela o
   NEGA. Quem começa o turno dentro leva o efeito com prazo.

   É o que faltava para "controle de área" existir de verdade. `area`,
   `danoVizinhos` e `danoRaio` acertam quem está lá NO INSTANTE do golpe e
   acabam ali — são explosões, não território. A zona permanece, então ela muda
   por onde o adversário anda mesmo nas rodadas em que ninguém gasta dado.

   O PRAZO É CONTADO EM TURNOS DO ADVERSÁRIO, e não em rodadas. Medir em rodada
   parece igual e não é: a zona cobra no início do turno de quem está dentro,
   então a criada por quem joga PRIMEIRO pega o adversário já na mesma rodada,
   e a criada por quem joga em segundo só pega na rodada seguinte. Com prazo de
   2 rodadas, a primeira cobrava dois turnos adversários e a segunda, um.

   É exatamente o erro que a v20 já corrigiu nas ondas — comparar presença no
   fim da RODADA dava 42% para quem começa, e congelar por turno devolveu 4,8
   pontos. Medido de novo aqui: com prazo em rodadas a bateria dava 53,3% para
   quem começa contra 51,6% com as zonas desligadas. Contando turnos, os dois
   lados recebem o mesmo número de exposições por construção. */
const ZONA_TURNOS=2;

/* Vizinhança pré-calculada. A primeira versão varria os 116 hexágonos para CADA
   fonte de visão, a cada consulta — com ~15 fontes por time e a visão sendo
   perguntada dentro de laços de mira, a bateria de 2000 partidas deixou de
   terminar. Aqui o raio de cada casa é calculado UMA vez, na carga. */
const [RAIO_ATE,RAIO_ATE_ABERTO]=(()=>{
  const maior=Math.max(VISAO_HEROI,VISAO_TORRE,VISAO_BASE,VISAO_ONDA,VISAO_WARD);
  const tudo=new Map(), aberto=new Map();
  for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
    if(!noTab(c,r))continue;
    const porRaio=Array.from({length:maior+1},()=>[]);
    for(let r2=0;r2<LINS;r2++)for(let c2=0;c2<COLS;c2++){
      if(!noTab(c2,r2))continue;
      const d=dist(c,r,c2,r2);
      if(d<=maior) porRaio[d].push(k(c2,r2));
    }
    /* acumula: porRaio[n] passa a conter tudo até n */
    for(let i=1;i<=maior;i++) porRaio[i]=porRaio[i-1].concat(porRaio[i]);
    tudo.set(k(c,r),porRaio);
    /* a mesma lista sem as casas de mato — é o que uma fonte de fora do mato vê */
    aberto.set(k(c,r),porRaio.map(l=>l.filter(x=>!MATO.has(x))));
  }
  return [tudo,aberto];
})();

/* Todas as casas que o time `t` enxerga agora.

   A REGRA DO MATO (v22). Medido na v21: na rodada 1 o time já enxergava 78 das
   116 casas, e 47 das 70 fora de rota. Com seis torres, três ondas, a base e
   cinco heróis acendendo 2 de raio cada, a névoa cobria o que ninguém ia visitar
   e o mato — o único lugar onde esconder-se é jogada — vinha aceso de graça. O
   Caçador ficava invisível no papel e à vista na tela.

   O conserto não é diminuir raio (isso só empurra o problema): é o mato bloquear
   visão, como o mato de MOBA sempre bloqueou. Só se enxerga o mato de DENTRO do
   mato. Vale para todas as fontes, inclusive a ward — ward na rota não vê o mato
   ao lado, e é isso que faz existir escolha de onde plantar. */
function campoDeVisao(t){
  const vistos=new Set();
  const acende=(p,raio)=>{
    if(!p)return;
    const tabela = ehMato(...p) ? RAIO_ATE : RAIO_ATE_ABERTO;
    const tab=tabela.get(k(...p));
    if(tab) tab[raio].forEach(x=>vistos.add(x));
  };
  J.times[t].herois.filter(h=>!h.morto).forEach(h=>acende(h.pos,VISAO_HEROI));
  J.torres.filter(x=>x.t===t&&x.vida>0).forEach(x=>acende(ROTAS[x.rota][x.i],VISAO_TORRE));
  BASE[t].forEach(p=>acende(p,VISAO_BASE));
  /* a Frente de Onda é o creep: acende onde a sua onda está */
  Object.entries(ROTAS).forEach(([nome,l])=>{
    const i=Math.max(0,Math.min(l.length-1,J.frentes[nome]));
    acende(l[i],VISAO_ONDA);
  });
  (J.times[t].wards||[]).forEach(w=>acende(w.pos,VISAO_WARD));
  return vistos;
}
/* Memo com chave DERIVADA DO ESTADO, não invalidação manual.
   A primeira tentativa foi um contador `sujaVisao()` chamado em cada ponto que
   move peça — e ela quebrou na hora: qualquer código que escreva `h.pos` direto
   (um teste, uma carta nova, a IA sondando) deixava o cache mentindo. Cache que
   depende de todo mundo lembrar de avisar sempre desatualiza.
   A chave abaixo é ~25 números somados: barata o bastante para rodar a cada
   consulta e correta por construção. */
/* A conta é em INTEIRO DE 32 BITS, e isso não é preciosismo. A primeira versão
   somava `x=x*31+…` em `Number` comum: com 5 heróis, 6 torres, 3 frentes e as
   wards, `x` passa de 1e19 muito antes do fim, e a partir daí o ulp do float é
   maior que os termos que ainda faltam entrar. Na prática a POSIÇÃO DA WARD e os
   últimos heróis deixavam de mudar o selo — mover a ward de uma casa para a
   vizinha dava a mesma chave e a visão vinha do cache velho.
   `Math.imul` mantém tudo em 32 bits, onde nenhum bit se perde por magnitude. */
function seloVisao(t){
  let x=0;
  const mix=n=>{ x=(Math.imul(x,31)+n)|0; };
  const hs=J.times[t].herois;
  for(let i=0;i<hs.length;i++) mix(hs[i].pos[0]*13+hs[i].pos[1]*7+(hs[i].morto?1:0));
  for(let i=0;i<J.torres.length;i++) if(J.torres[i].t===t) mix(J.torres[i].vida);
  mix(J.frentes.topo*7+J.frentes.meio*13+J.frentes.baixo*17);
  const w=J.times[t].wards||[];
  for(let i=0;i<w.length;i++) mix(w[i].pos[0]*13+w[i].pos[1]*7);
  mix(w.length);
  return x;
}
let _visCache=[null,null], _visSelo=[NaN,NaN];
function visaoDe(t){
  const selo=seloVisao(t);
  if(_visSelo[t]!==selo){ _visCache[t]=campoDeVisao(t); _visSelo[t]=selo; }
  return _visCache[t];
}
const enxergaCasa=(t,c,r)=>visaoDe(t).has(k(c,r));

/* ---------- REVELADO POR TER ATACADO ----------
   Bater entrega a posição. Quem golpeia de dentro do mato fica visível para o
   adversário até SAIR da casa de onde bateu — é o que impede que o mato vire um
   ninho onde se atira de graça a partida inteira, e é a razão de o gank ser um
   compromisso: você troca o esconderijo pelo dano.

   Guardado como a CASA de onde ele atacou, não como um sinalizador para alguém
   lembrar de apagar. Andar invalida sozinho, e isso vale para todo caminho que
   mexe em `pos` — passo, recuo, Convocar, respawn. A v21 já tinha aprendido isso
   com o cache de visão: estado derivado não desatualiza; sinalizador desatualiza. */
const entregaPosicao=h=>{ h.revelou=[...h.pos]; };
const reveladoPorAtaque=h=>!!h.revelou&&h.revelou[0]===h.pos[0]&&h.revelou[1]===h.pos[1];

/* O herói `h` é visível para o time `t`? */
function visivelPara(h,t){
  if(h.t===t||h.morto)return true;              // os seus você sempre vê
  if(reveladoPorAtaque(h))return true;          // bateu: entregou onde está
  return enxergaCasa(t,...h.pos);
}
/* Escondido AGORA: fora do campo de visão inimigo. É a condição do bônus de
   emboscada — o gank virou consequência de posição, não de ficha declarada. */
const escondido=h=>!h.morto&&!visivelPara(h,1-h.t);

/* De quem é a tela. Em partida contra a IA quem olha é SEMPRE o humano: durante
   a vez dela o tabuleiro continua mostrando o que o time 0 enxerga. Antes ele
   desenhava pela perspectiva de `J.vez`, e no turno da IA o jogador via os
   heróis dela saindo do mato — a névoa vazava justamente para o lado errado. */
const ladoDaTela=()=>aiMode?0:J.vez;

/* ---------- WARDS ----------
   A Ward deixou de ser um sinalizador abstrato do time e virou uma PEÇA NO MAPA,
   com posição e prazo. É o que a faz interagir com a visão por raio: ela acende
   um pedaço do tabuleiro onde você não tem ninguém. */
function poeWard(t,pos){
  const tm=J.times[t];
  tm.wards=tm.wards||[];
  tm.wards.push({pos:[...pos],rodadas:WARD_RODADAS});
  reg(t?"c":"a",`ward posta — acende ${VISAO_WARD} de raio por ${WARD_RODADAS} rodadas`);
}
/* Aplica (ou renova) um efeito com prazo. Não empilha duas vezes o mesmo tipo:
   reaplicar RENOVA a duração e fica com o maior dano. Empilhar era a alternativa
   e foi descartada na mesa do desenho — dois assassinos sangrando o mesmo alvo
   viraria dano instantâneo com passos extras, que é justamente o que o efeito
   com prazo não deveria ser. */
function poeDot(alvo,quem,tipo,dano,rodadas){
  if(!alvo||alvo.morto||!DOTS[tipo])return;
  alvo.dots=alvo.dots||[];
  const ja=alvo.dots.find(d=>d.tipo===tipo);
  if(ja){ ja.dano=Math.max(ja.dano,dano); ja.rodadas=Math.max(ja.rodadas,rodadas); ja.dono=quem; }
  else alvo.dots.push({tipo,dano,rodadas,dono:quem});
  reg("b",`${alvo.n} está com ${DOTS[tipo].n} — ${dano} por rodada, ${rodadas} rodadas`);
}
/* Cobra os efeitos no início do turno do dono da peça, e só uma vez por rodada.
   Ignora armadura e escudo — ver o comentário de DOTS. Não passa por aplicaDano
   justamente por isso: aquele é o funil do golpe que CHEGA, e este é o do golpe
   que já chegou. */
function cobraDots(t){
  J.times[t].herois.forEach(h=>{
    if(h.morto||!h.dots||!h.dots.length)return;
    /* o autor é guardado ANTES de a lista ser filtrada. Ler `h.dots[0].dono`
       depois do filtro perdia o crédito exatamente no caso mais comum — a última
       cobrança do efeito é justamente a que mata, e é também a que tira o efeito
       da lista. O ouro da morte ia para o vizinho mais próximo em vez de para
       quem aplicou. */
    let autor=null;
    h.dots.forEach(d=>{
      if(h.vida<=0)return;
      h.vida-=d.dano; autor=d.dono;
      reg("b",`${DOTS[d.tipo].ico} ${h.n} perde ${d.dano} de ${DOTS[d.tipo].n} `
             +`(${Math.max(0,h.vida)}/${h.vidaMax})`);
      fx(h.pos,-d.dano,"dano");
      d.rodadas--;
    });
    h.dots=h.dots.filter(d=>d.rodadas>0);
    /* a morte por efeito credita o ouro a quem aplicou — mesmo que ele já tenha
       morrido desde então. Herói morto continua existindo e continua tendo bolso. */
    if(h.vida<=0) mata(h,autor||maisPertoDe(h,1-h.t));
  });
}
/* fallback de autoria: se o aplicador sumiu da mesa (não deveria acontecer, mas
   `mata` precisa de alguém para creditar), o crédito vai para o inimigo vivo mais
   próximo. Nunca fica sem dono, e nunca estoura. */
function maisPertoDe(h,t){
  const cand=J.times[t].herois.filter(x=>!x.morto);
  if(!cand.length)return J.times[t].herois[0];
  return cand.reduce((a,b)=>dist(...h.pos,...b.pos)<dist(...h.pos,...a.pos)?b:a);
}
/* Zona: quem começa o turno dentro de uma zona inimiga recebe o efeito dela.
   O prazo da zona também corre AQUI, e só aqui — cada turno adversário que ela
   vigia gasta uma carga, tenha pegado alguém ou não. É o que a torna simétrica:
   as duas zonas vigiam o mesmo número de turnos do outro lado, não importa quem
   jogou primeiro. Gastar só quando pega alguém faria zona em canto vazio durar
   a partida inteira. */
function zonasCobram(t){
  if(!J.zonas||!J.zonas.length)return;
  J.zonas.forEach(z=>{
    if(z.t===t)return;                       // a sua própria zona não te machuca
    J.times[t].herois.forEach(h=>{
      if(h.morto)return;
      if(dist(...h.pos,...z.pos)>z.raio)return;
      reg("b",`${h.n} começou o turno dentro de ${z.n}`);
      poeDot(h,z.dono,z.tipo,z.dano,2);
    });
    z.turnos--;
  });
  const antes=J.zonas.length;
  J.zonas=J.zonas.filter(z=>z.turnos>0);
  if(J.zonas.length<antes) reg("b","uma zona se dissipou");
}
function poeZona(t,pos,z){
  J.zonas=J.zonas||[];
  J.zonas.push({t,pos:[...pos],raio:z.raio||1,turnos:ZONA_TURNOS,
                tipo:z.tipo,dano:z.dano,n:z.n||"uma zona",dono:z.dono});
  reg(t?"c":"a",`${z.n||"zona"} criada — raio ${z.raio||1}, `
     +`os ${ZONA_TURNOS} próximos turnos do adversário`);
}
function expiraWards(){
  J.times.forEach((tm,t)=>{
    if(!tm.wards||!tm.wards.length)return;
    tm.wards.forEach(w=>w.rodadas--);
    const antes=tm.wards.length;
    tm.wards=tm.wards.filter(w=>w.rodadas>0);
    if(tm.wards.length<antes) reg("b",`uma ward do ${NOMES[t]} apagou`);
  });
}

const CAMP_AZUL=[3,4];
const CAMP_CARMIM=gira(...CAMP_AZUL);

/* Dragão compõe, Barão vira a mesa — a distinção do MOBA, ver docs/00-anatomia-moba.md.
   `volta` é quantas rodadas depois de morrer o poço reabre. `revide` é o preço de
   encostar, como na torre.
   Ninguém tem limite de golpes por rodada: é o dado que você deixa de gastar em outro
   lugar que mede o quanto você quer o objetivo — e é isso que abre a janela do roubo. */
/* VIDA DO ÉPICO — medida, não estimada. Com 8 e 14 o objetivo estava fora de
   alcance: um time rola 3 dados por turno, e a básica tira 1 do poço enquanto a
   Ultimate tira 2. Isso punha o Dragão em ~2,7 turnos do time INTEIRO e o Barão
   em ~4,7 — contra uma torre que custa 3 golpes e leva direto à vitória.

   Não havia dilema nenhum: contestar era matematicamente um mau negócio, e foi
   por isso que a IA — depois de ganhar avaliação na v17 — parou de bater no poço.
   Ela estava certa; o preço é que estava errado.

   Cabe dentro de um turno se o time comprar a briga, e aí a pergunta "pressiono a
   torre ou disputo o objetivo?" passa a ter os dois lados viáveis — que é a
   definição de dilema. O revide não mudou: encostar continua custando.

   VIDA DO DRAGÃO 4 → 3 na v24. Com 4 ele exigia DUAS Ultimates no mesmo poço, e a
   janela dele é curta: desce na rodada 5 e perde o lugar na 12, quando o Barão
   toma o poço mesmo com ele vivo. Medido em 1500 partidas: morria em 21,5%
   daquelas em que aparecia, com o veredito automático de sim/epicos.js em "muito
   tentado e pouco fechado". O Barão, com a mesma vida 4 e um pedágio MAIOR, caía
   em 56% — a diferença nunca foi preço, foi tempo de janela.

   O pedágio foi descartado por medição, não por gosto: `revide=off` deu 21,7% e
   `rdragao=0` deu 23,4%, contra os 21,5% da base. Zerar o revide não move o
   número, porque quem desiste do Dragão desiste por dado gasto, não por vida
   perdida. Com vida 3 ele cai em Ultimate + básica — dois dados, de dois heróis,
   dentro de um turno — e fecha em 33,1%, sem ser mais atacado (1,3 golpes por
   partida contra 1,4). Não virou ímã: virou tentativa que converte.

   O Barão continua em 4 de propósito. É ele que vira a mesa, e a assimetria
   agora diz na mecânica o que a lore já dizia: o Dragão se acumula, o Barão se
   conquista. */
/* ---------- OS DOIS MORADORES CONTAM COISAS DIFERENTES (v26) ----------
   O Dragão conta GOLPES: vida 3, Ultimate tira 2 e básica tira 1, o dado não
   entra na conta. É o objetivo de cedo, e a regra de contagem é o que o mantém
   legível na rodada 5, quando ninguém tem item e a conta de dano ainda é rasa.

   O BARÃO conta DANO, pela mesma regra de qualquer herói: `porDano` liga
   `round(Força × dano × escala) + Poder − Armadura`, com respingo valendo metade
   e `danoFixo` ignorando armadura — exatamente como contra um herói. Ele tem
   **16 de vida e 3 de ARMADURA**, e a armadura é a peça que importa. A primeira
   tentativa foi vida 22 e armadura 1, e ela resolvia o problema errado: com
   armadura baixa todo dado contribui proporcionalmente, então cinco cutucadas
   fracas derrubam o Barão igual a dois golpes bons — vida alta vira só uma barra
   mais comprida, não uma exigência de time.

   Com armadura 3 e Poder 3, uma básica de dado 2 tira 2 e uma Ultimate de dado 6
   tira 8: QUATRO VEZES mais. É isso que obriga a comprometer o dado bom de vários
   heróis ao mesmo tempo, que é como o objetivo grande funciona no gênero. E 16
   fica ABAIXO da vida de todos os 20 heróis (o menor tem 18): o Barão não precisa
   ser o saco de pancada mais gordo da mesa para exigir um grupo.

   Fechar num turno pede 4 dos 5 heróis — `16 ÷ (7 − 3)`. Medido: 55,9% de Barões
   fechados contra 56,6% da regra que contava golpes.

   Por que os dois não são iguais: contar golpes achata tudo — com o Dragão, o 1
   e o 6 no dado de uma básica valem o mesmo, e é aceitável num alvo de 3 que
   morre em dois dados. Num alvo grande, achatar apaga a decisão inteira: o
   Barão passa a premiar o dado que você comprometeu nele, e as três Ultimates de
   `danoFixo` (Julgamento, Ato Final, Sentença) ganham no poço o mesmo papel que
   já tinham contra tanque.

   O número foi VARRIDO antes de entrar, com `sim/epicos.js baraodano= baraoarm=`,
   e a dificuldade não mudou: 57,0% de Barões fechados contra 53,8% e 55,4% de
   duas execuções do build que contava golpes — dentro da oscilação do próprio
   controle. Detalhe importante e honesto sobre essa medição no patch note da
   v26: o agente da bateria só compromete dado quando fecha no mesmo turno, e
   isso QUANTIZA o resultado em degraus inteiros de heróis necessários. 22/1 cai
   no mesmo degrau (4 heróis) do Barão antigo — afinar mais fino que o degrau
   seria ajustar contra o agente, não contra o jogo. */
const EPICO={
  dragao:{n:"Dragão", vida:3, revide:2, volta:3, pre:"a Herança do Dragão"},
  barao: {n:"Barão",  vida:16, arm:3, porDano:1, revide:4, volta:4, pre:"a Fúria do Barão"}
};
/* Rodadas medidas em sim/epicos.js, 600 partidas por variante:
     · Barão na 8 dava ao Dragão só 3 rodadas de janela — ele caía em 1,3%;
     · Barão na 12 devolve 7 rodadas ao Dragão e ainda deixa ~10 de Barão numa
       partida de 22 rodadas medianas. */
const R_DRAGAO=5, R_BARAO=12;
const morador=r=>r>=R_BARAO?"barao":"dragao";
const DRAGAO_PODER=1;      /* por Dragão levado, permanente e acumulativo */
/* ---------- A DÁDIVA DO BARÃO ----------
   Antes o Barão dava sempre a mesma coisa: +2 de Poder no time e as ondas
   andando sozinhas. Prêmio fixo produz estratégia fixa — levou o Barão, faz o
   mesmo de sempre. Agora quem fecha ESCOLHE uma de três, e as três empurram a
   partida em direções diferentes.

   Nenhuma delas dá Poder bruto, de propósito: o Barão deixou de ser "seu time
   bate mais forte" e virou PRESSÃO DE MAPA. É o que o torna útil para quem está
   atrás — não porque o jogo entregue vantagem a quem perde, mas porque a
   recompensa converte um objetivo conquistado em avanço de território, que é a
   moeda de quem precisa virar. A virada continua tendo de ser ganha. */
const DADIVAS=[
  {id:"ondas", n:"Ondas de Ferro", ico:"◆◆",
   d:"As suas três ondas avançam sozinhas, mesmo sem herói nas rotas.",
   porque:"Pressiona o mapa inteiro enquanto o time faz outra coisa."},
  {id:"egide", n:"Égide do Barão", ico:"⛨",
   d:"Todos os seus heróis ganham 4 de escudo no início de cada turno seu.",
   porque:"Compra as brigas que você não podia comprar."},
  {id:"ariete", n:"Aríete", ico:"⌂",
   d:"Os seus golpes de herói em torre e Nexus causam 2 em vez de 1.",
   porque:"Dobra a velocidade de derrubar estrutura."}
];
const DADIVA=Object.fromEntries(DADIVAS.map(d=>[d.id,d]));
/* 7 → 4 na v26. A carta SEMPRE disse "4 de escudo" e o motor entregava 7: o
   jogador escolhia a dádiva lendo um número e recebia outro. E 7 por herói por
   turno, com cinco heróis e duas rodadas, somava 70 de escudo — quase três heróis
   inteiros de vida, de graça, num jogo em que o maior herói tem 25. Com 4 são 40,
   que ainda "compra as brigas que você não podia comprar" sem apagar duas rodadas
   de combate. */
const BARAO_ESCUDO=4;
const BARAO_ARIETE=1;      /* dano somado ao golpe em estrutura */
const BARAO_RODADAS=2;     /* e ela dura pouco — é botão de ponto-sem-volta, não renda */
const GOLPE_HAB=1, GOLPE_ULT=2;   /* quanto cada golpe tira do poço — ver atacaEpico */

/* ---------- ESTADO ---------- */
let J,dadoSel=null,ativo=null,habSel=null,selHeroi=null,alvos=[],alvosTorre=[],alvosEpico=[],
    alvoNexus=null,mover=[],lojaHeroi=null;
let aiMode=false, simMode=false;

function novo(){
  J={
    rodada:1, vez:0, primeiro:0, fase:"oculto", fim:null,
    times:[0,1].map(t=>({
      placas:0, prio:0, prioGuardada:0, wards:[],
      dragoes:0, baroes:0, barao:0, dadiva:null, retomada:0,
      feitico:1, feiticoCd:0,
      herois:TIMES[t].map((id,i)=>{
        const b=CATALOGO[id];
        return{id,t,...b,vidaMax:b.vida,vida:b.vida,esc:0,ouro:0,pat:0,itens:[],veuAtivo:0,semCura:0,
          pos:[...BASE[t][i%2]], morto:0, agiu:0, preso:0, intoc:0, marca:0, recarga:0, extraPoder:0,
          dots:[], curouSitiado:0, focoPoco:0};
      })
    })),
    dados:[], mov:{v:0,rest:0},
    frentes:{topo:centroRota("topo"),meio:centroRota("meio"),baixo:centroRota("baixo")},
    presenca:[{},{}],
    torres:TORRES_DEF.map(d=>({...d,vida:VIDA_TORRE})),
    /* vida 0 = o poço está vazio; `volta` é a rodada em que o próximo morador desce */
    poco:{id:"dragao", vida:0, vidaMax:EPICO.dragao.vida, volta:R_DRAGAO},
    camps:[
      {id:"azul",  t: 0,pos:[...CAMP_AZUL],  ouro:3,respawn:0,ativo:1},
      {id:"carmim",t: 1,pos:[...CAMP_CARMIM],ouro:3,respawn:0,ativo:1},
      {id:"neutro",t:-1,pos:[...sorteiaNeutro()],ouro:4,respawn:0,ativo:1}
    ],
    zonas:[], rotacao:[null,null],
    nexus:[VIDA_NEXUS,VIDA_NEXUS], motivoFim:null, golpeFinal:null, log:[]
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
  caraOuCoroa(()=>faseOculta());
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
/* Escondido NÃO é ausente. O herói no mato ocupa a casa, bloqueia passagem,
   pressiona a rota e coleta acampamento normalmente — o adversário só não o VÊ.
   É a diferença entre a névoa desta versão e a rotação da v18, que tirava a peça
   do tabuleiro: aqui o Caçador nunca deixa de estar em algum lugar real. */
const em=(c,r)=>todos().find(h=>!h.morto&&h.pos[0]===c&&h.pos[1]===r);
const reg=(cls,txt)=>{J.log.unshift({cls,txt});};

/* ---------- FASE OCULTA ---------- */
/* A partida começa jogando. Antes havia uma FASE OCULTA antes do primeiro turno,
   em que cada jogador escolhia numa tela uma de cinco fichas de destino para o
   Caçador. Ela saiu junto com as fichas: a ocultação do Caçador agora acontece
   DENTRO do turno, quando ele decide entrar em rotação, e custa uma ação — em vez
   de ser um formulário obrigatório antes de qualquer jogada. Menos uma tela entre
   o jogador e a primeira decisão. */
/* início de RODADA — roda no fim de cada uma. O cara ou coroa NÃO mora aqui:
   ele é uma vez por partida, em `novo()`. Deixá-lo aqui re-sorteava quem começa
   a cada rodada, e a ordem virava aleatória no meio da partida. */
function faseOculta(){
  J.fase="jogando"; J.vez=J.primeiro; iniciaTurno();
}

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

/* ---------- TURNO ----------
   EXPIRAÇÃO. Todo efeito temporário de um herói morre no INÍCIO do próximo turno
   do dono — nunca no fim da rodada. São dois problemas resolvidos pela mesma
   regra:

   · escudo não expirava em lugar nenhum. `esc` só era zerado ao morrer, então
     Muralha do Vharn (escudo 6 + Força, até 12 por uso) empilhava rodada após
     rodada e o herói virava intocável de fato. Era o "escudo que dá
     invulnerabilidade" do relatório — não era bug de absorção, era ausência de
     prazo de validade.
   · o que expirava, expirava na hora errada. "até o fim da rodada" pune quem
     joga em segundo: o escudo dele nascia e morria dentro do próprio turno, sem
     o adversário nunca ter tido a chance de bater nele. "Até o início do seu
     próximo turno" dá a mesma janela real aos dois lados — sempre exatamente um
     turno adversário de exposição, seja você o primeiro ou o segundo.

   A regra vale para escudo, intocável, buff, prisão e a ação do herói. Uma regra
   só, e o texto da carta pode dizer a mesma frase para todos. */
function expiraDoTime(t){
  J.times[t].herois.forEach(h=>{
    if(h.esc){ h.esc=0; }
    h.intoc=0; h.veuAtivo=0;
    h.agiu=0; h.agilUsado=0;
    h.preso=Math.max(0,h.preso-1);
    h.semCura=Math.max(0,h.semCura-1);
    if(h.buffP){ h.extraPoder-=h.buffP; h.buffP=0; }
    if(h.buffA){ h.arm-=h.buffA; h.buffA=0; }
    if(h.buffAgil){ h.agil=0; h.buffAgil=0; }
    h.focoPoco=0;
  });
}
function iniciaTurno(){
  const t=J.vez, tm=J.times[t];
  expiraDoTime(t);
  /* a zona marca ANTES de o efeito cobrar: quem começou o turno dentro dela paga
     na hora, e não só na rodada seguinte. Sem isso dava para entrar e sair da
     zona no mesmo turno sem custo nenhum, e território que não cobra não nega
     nada. */
  migraCacador(t);          // a rotação escolhida no início da rodada acontece aqui
  zonasCobram(t);
  cobraDots(t);
  /* a Égide repõe DEPOIS da expiração, senão o escudo que ela deu morreria no
     mesmo instante em que é reposto */
  if(tm.barao>0&&tm.dadiva==="egide") daEgide(t);
  const extra=tm.herois.filter(h=>!h.morto).reduce((a,h)=>a+bonus(h,"mov"),0);
  tm.retomada=atraso(t);
  /* PRIMEIRO PASSO. Quem começa a partida rola +1 no Dado Mestre na rodada 1, e
     só nela. É o resto da compensação de ordem, medida em 3000 partidas por
     variante:
       · 42,0% antes de qualquer correção;
       · 46,8% só com a presença congelada (ver encerraTurno);
       · 49,7% (z=−0,29) somando este +1.
     Testadas e descartadas: +1 de movimento TODA rodada dá 59,7% — vira
     vantagem em vez de compensação; e +2 na rodada 1 empata com +1, porque na
     primeira rodada não há o que fazer com tanto movimento. */
  const primeiroPasso = (t===J.primeiro && J.rodada===1) ? 1 : 0;
  const m=1+Math.floor(Math.random()*6)+extra+primeiroPasso;
  J.mov={v:m,rest:m};
  /* RETOMADA aplicada: o freio da bola de neve vira DADO, que era a intenção
     declarada na seção RETOMADA. Antes `tm.retomada` era calculado e desenhado
     no HUD, mas a mão era sempre de 3 — o freio nunca chegava à mesa. */
  J.dados=Array.from({length:3+tm.retomada},(_,i)=>
    ({v:1+Math.floor(Math.random()*6),usado:0,...(i>2?{extra:1}:{})}));
  
  dadoSel=ativo=habSel=selHeroi=null; alvos=[]; mover=[];
  reg(t?"c":"a",`${NOMES[t]} rola — movimento ${m} · ações ${J.dados.map(d=>d.v).join(" · ")}`);
  if(primeiroPasso) reg("b",`PRIMEIRO PASSO — ${NOMES[t]} começa a partida e rola +1 de movimento`);
  if(tm.retomada) reg("b",`RETOMADA — ${NOMES[t]} está atrás e rola ${tm.retomada} dado${tm.retomada>1?"s":""} a mais`);
  pinta();
}
/* ---------- FIM DE PARTIDA ----------
   PORTA ÚNICA. Antes cada fonte de vitória escrevia `J.fim` por conta própria e
   torcia para alguém reparar, e havia dois jeitos de a partida não acabar:

     · `J.fim=1-lado`. Quando o AZUL (time 0) derrubava o Nexus, `J.fim` valia
       ZERO — e todo teste do motor era `if(J.fim)`, que é falso para zero. O
       AZUL literalmente não conseguia ganhar na hora: a partida seguia, o CARMIM
       jogava seu turno inteiro, e se ele derrubasse o Nexus no contragolpe o
       `J.fim` era sobrescrito para 1 e ele levava a partida que já tinha perdido.
     · mesmo com o time certo, nada congelava: quem venceu no meio da rodada
       continuava recebendo cliques até `fimDaRodada` reparar no assunto.

   Agora quem derruba o Nexus chama isto, e isto trava a fase. `J.fase==="fim"`
   é a trava que `pinta`, `escolheHeroi`, `iniciaHab` e a IA já respeitavam. */
function encerraPartida(vencedor,motivo,autor){
  if(J.fim!==null) return;                 // primeiro golpe vence; contragolpe não conta
  J.fim=vencedor; J.motivoFim=motivo; J.fase="fim";
  if(autor) J.golpeFinal={id:autor.id,n:autor.n,t:autor.t};
  reg("b",`FIM — ${NOMES[vencedor]} venceu. ${motivo}`);
  pinta(); telaFim();
}
function encerraTurno(){
  if(J.fim!==null)return;
  /* PRESENÇA CONGELADA. A onda avança comparando quantos heróis cada time tem
     em cada rota, e essa contagem acontecia no fim da RODADA — ou seja, depois
     que o segundo jogador já tinha mexido. Ele via o posicionamento do
     adversário e respondia; o primeiro jogava às cegas. Medido: quem começa
     ganhava 43,9%.
     Agora cada time é contado ao fim do PRÓPRIO turno. Os dois declaram
     posição sem ver a resposta do outro, que é a mesma informação para os dois. */
  J.presenca[J.vez]=Object.fromEntries(Object.keys(ROTAS).map(nome=>
    [nome, vivos(J.vez).filter(h=>rotaDaPos(h)===nome).length]));
  if(J.vez===J.primeiro){ J.vez=1-J.vez; iniciaTurno(); }
  else fimDaRodada();
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
/* Alguma rota do time `t` está sem torre e com a onda encostada na base dele?
   É a condição de "a onda vai bater no meu Nexus na virada da rodada". */
function rotaAbertaContra(t){
  return Object.entries(ROTAS).some(([nome,l])=>{
    const f=J.frentes[nome];
    const encostou = t===0 ? f<=0 : f>=l.length-1;
    return encostou && !J.torres.some(x=>x.rota===nome&&x.t===t&&x.vida>0);
  });
}

function fimDaRodada(){
  /* a Fúria do Barão empurra as três rotas sozinha, mesmo sem herói nenhum nelas.
     É o que faz do Barão um relógio: dois times parados param de empatar. */
  const furia=J.times.map(tm=>(tm.barao>0&&tm.dadiva==="ondas")?1:0);
  Object.entries(ROTAS).forEach(([nome,l])=>{     // ondas: a torre viva trava o avanço
    const n0=J.presenca[0][nome]||0, n1=J.presenca[1][nome]||0;
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
    /* ── ÚLTIMA MURALHA: creep não fecha partida com alguém defendendo ──
       Medido na v22, em 1500 partidas: **97,3% terminavam com a onda dando o
       golpe final**. O jogador derrubava a rota e depois assistia — três rodadas
       de contagem regressiva em que nenhuma escolha mudava nada. Era a queixa do
       playtest: *"as lanes acabam empurrando... os creeps acabam levando o jogo
       depois que eu levo as torres"*.

       A primeira tentativa foi um piso duro (a onda para em 1, sempre). Ela
       morreu na medição: sem ninguém obrigado a ir lá fechar, a bateria de 1200
       partidas não terminou nenhuma — regra que depende de iniciativa para a
       partida acabar trava contra quem não toma iniciativa.

       A regra que ficou não pode empacar: a onda só é barrada no último ponto
       **enquanto houver herói inimigo defendendo o Nexus** (a 1 de distância).
       Base vazia continua caindo sozinha, então a partida sempre termina. Base
       defendida exige matar o defensor — a última luta volta a existir, e o
       Aríete do Barão (golpe de herói em estrutura vale 2) ganha função. */
    const golpeFinal = J.nexus[lado]<=1;
    const defensor = golpeFinal && J.times[lado].herois.some(h=>
      !h.morto && dist(...h.pos,...BASE[lado][0])<=1);
    if(defensor){
      reg("b",`ÚLTIMA MURALHA — ${NOMES[lado]} defende o Nexus e a onda não passa`);
      return;
    }
    J.nexus[lado]--;      /* a onda tira 1: o Aríete é bônus de GOLPE DE HERÓI */
    reg("b",`Rota ${nome} aberta — Nexus ${NOMES[lado]} em ${Math.max(0,J.nexus[lado])}/${VIDA_NEXUS}`);
    if(J.nexus[lado]<=0) encerraPartida(1-lado,`Nexus ${NOMES[lado]} destruído pela onda do ${nome}.`);
  });
  [0,1].forEach(t=>{                              // a dádiva do Barão expira
    const tm=J.times[t];
    if(!tm.barao)return;
    tm.barao--;
    if(!tm.barao){
      reg("b",`${DADIVA[tm.dadiva]?DADIVA[tm.dadiva].n:"a dádiva"} abandona o ${NOMES[t]}`);
      tm.dadiva=null;
    }
  });
  colheAcampamentos();                            // quem ficou em cima, colhe
  curaDeBase();                                   // e quem ficou em casa, se trata
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
    if(h.morto){ h.morto--; if(!h.morto){ h.vida=h.vidaMax; h.esc=0; h.pos=[...BASE[h.t][0]]; reg("b",`${h.n} voltou`);} }
  });   /* escudo, buff, prisão e ação expiram em expiraDoTime, no início do turno do dono */
  desempilha();
  expiraWards();
  if(J.fim!==null) return;      // encerraPartida já pintou e abriu a tela de vitória
  /* A iniciativa NÃO alterna mais entre rodadas. Ela alternava desde a v0.5 para
     diluir a vantagem de quem começa (60,3% → 56,8%, 3000 partidas), mas o preço
     era a sequência que o playtest da v15 reportou: com `primeiro` girando, a
     ordem real vira A C | C A | A C — cada jogador joga DOIS turnos seguidos na
     virada da rodada, e a partida fica ilegível.

     Agora quem começa começa a partida inteira, e a rodada é sempre um turno de
     cada: A → C → A → C. A vantagem de quem começa volta a existir sem freio, e
     é medida em `node sim/bateria.js` — a compensação é decisão do grupo (ver
     docs/DECISOES-PENDENTES.md), não algo para o motor escolher sozinho. */
  J.rodada++; reg("r",`— rodada ${J.rodada} — começa ${NOMES[J.primeiro]}`);
  abreRotacoes();           // os dois escolhem para onde o Caçador vai, às cegas
  atualizaAcampamentos();
  /* O poço reabre com o morador da vez — e o BARÃO NÃO ESPERA VAGA.
     Até a v19 a troca só acontecia com o poço vazio (`p.vida<=0`), e a
     consequência, medida em 800 partidas, era que o Barão aparecia em apenas
     55% delas: se ninguém matasse o Dragão, ele ficava sentado no poço a
     partida inteira e o Barão nunca descia. A chegada do objetivo mais
     importante do jogo dependia de alguém ter fechado o anterior.
     Agora, na rodada do Barão, ele toma o lugar mesmo com o Dragão vivo — que é
     o que dá ao Dragão um prazo ("mate antes da rodada 8 ou perca a chance") e
     garante que o fim de partida sempre tenha um objetivo grande na mesa. */
  const p=J.poco;
  const vez=morador(J.rodada);
  const trocaForcada = p.vida>0 && p.id!==vez;
  if(trocaForcada){
    const d=EPICO[vez];
    reg("b",`o ${EPICO[p.id].n} abandonou o poço — ${d.n} desceu no lugar`);
    p.id=vez; p.vidaMax=d.vida; p.vida=d.vida;
    reg("b",`${d.n} desceu ao poço — ${d.pre} está em jogo`);
  } else if(p.vida<=0&&J.rodada>=p.volta){
    p.id=vez;
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
  /* ÁGIL — "a 1ª casa andada é grátis" era por MOVIMENTO, não por turno. Andando
     de 1 em 1 hexágono, todo passo custava zero: movimento infinito. Agora o
     desconto vale uma vez por turno, e `agilUsado` expira com o resto. */
  const temDesconto = ehAgil(h) && !h.agilUsado;
  const d=dist(...h.pos,c,r), custo=Math.max(0,d-(temDesconto?1:0));
  if(temDesconto&&d>0) h.agilUsado=1;
  if(custo>J.mov.rest)return;
  h.pos=[c,r]; J.mov.rest-=custo;
  coletaAcampamento(h);
  reg(J.vez?"c":"a",
    `${h.n} anda ${d} ${d>1?"casas":"casa"}${temDesconto&&d>0?" (ágil)":""} — movimento restante ${J.mov.rest}`);
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
const LAMPEJO_ALC=2, FEITICO_CD=3, RETORNO_CURA=5;

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
  if(!souIA()) toast("lampejo","gank");
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
  if(!souIA()) toast("retorno","");
  vibra([14,40,14]);
  limpaModo(); pinta(); animaMovimento(h,de);
}

const campEm=(c,r)=>J.camps.find(cp=>cp.ativo&&cp.pos[0]===c&&cp.pos[1]===r);
/* PISAR NÃO COLETA MAIS. Antes o ouro saía no instante em que o herói entrava na
   casa, e o efeito era o relatado no playtest: quem joga primeiro, com um Dado
   Mestre alto, varria os três acampamentos numa tacada e o adversário não tinha
   como responder — não havia janela para contestar.

   Agora pisar só OCUPA. O ouro sai no fim da rodada, para quem ainda estiver em
   cima. Isso dá ao adversário um turno inteiro para matar, empurrar ou chegar
   antes — o acampamento virou território disputado em vez de item de corrida. */
function coletaAcampamento(h){ /* mantida por compatibilidade: ocupar é o que vale */ }

/* roda no fim da rodada, depois de todo mundo ter mexido */
/* ---------- CURA DE BASE, E O CERCO QUE A INTERROMPE ----------
   Até a v25 não havia cura nenhuma de base: o único jeito de recuperar vida
   cheia era morrer, e o respawn ficou sendo a "cura" mais barata do jogo, o que
   é exatamente o incentivo errado. Agora voltar para casa trata — e voltar custa
   movimento, que é o recurso mais disputado da mesa.

   A TRAVA é a parte que importa, e veio do relato: *"se tiver um inimigo a 2
   hexágonos dele só cura 1x até ele sair de perto"*. Sem ela, recuar para a base
   com o adversário em cima viraria um poço de vida infinito e o mergulho na base
   deixaria de ser uma decisão. Com ela, quem está sitiado se trata UMA vez e
   depois precisa resolver o cerco: matar, ser morto, ou esperar o outro
   desistir. `curouSitiado` zera sozinho assim que não há mais ninguém a 2 —
   sair de perto devolve a torneira, e é o próprio relato virado regra. */
const CURA_BASE=3;
const CERCO_RAIO=2;
function curaDeBase(){
  todos().forEach(h=>{
    if(h.morto||!naBase(h))return;
    const sitiado=J.times[1-h.t].herois.some(o=>!o.morto&&dist(...o.pos,...h.pos)<=CERCO_RAIO);
    if(!sitiado){ h.curouSitiado=0; }
    else if(h.curouSitiado){
      if(h.vida<h.vidaMax) reg("b",`${h.n} está cercado na base — a cura não vem de novo`);
      return;
    }
    if(h.semCura){ reg("b",`${h.n} está SEM CURA — a base não trata`); return; }
    if(h.vida>=h.vidaMax)return;
    const antes=h.vida;
    h.vida=Math.min(h.vidaMax,h.vida+CURA_BASE);
    if(sitiado) h.curouSitiado=1;
    reg(h.t?"c":"a",`${h.n} se trata na base (+${h.vida-antes})`
       +(sitiado?" — e não se trata de novo enquanto houver inimigo por perto":""));
    fx(h.pos,"+"+(h.vida-antes),"cura");
  });
}
function colheAcampamentos(){
  J.camps.forEach(cp=>{
    if(!cp.ativo||cp.respawn>0)return;
    const h=em(...cp.pos);
    if(!h||h.morto)return;
    const invadindo = cp.t!==-1 && cp.t!==h.t;
    const ouro = cp.ouro + (invadindo?1:0);
    cp.ativo=0; cp.respawn=3; h.ouro+=ouro;
    reg(invadindo?"b":(h.t?"c":"a"),
      invadindo ? `${h.n} segurou o acampamento inimigo a rodada inteira e roubou ${ouro} de ouro`
                : `${h.n} colheu o acampamento (+${ouro} de ouro)`);
  });
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
  /* EMBOSCADA. O bônus de gank deixou de ser prêmio por cumprir uma ficha
     declarada e virou consequência de posição: quem ataca vindo do mato, sem o
     adversário ter olhos ali, bate mais forte. A regra se explica sozinha na
     mesa e recompensa exatamente o que a névoa passou a permitir. */
  if(h.emboscada && (ef.dano||ef.danoFixo||ef.danoVizinhos||ef.danoRaio)){
    bonusGank=2;
    reg("b",`EMBOSCADA! ${h.n} atacou do mato sem ser visto: +2 de Força`);
  }
  const poder=poderTotal(h)+(h.recarga?h.recarga:0)+dupla(h)+bonusGank;
  const base=(mult)=>Math.round(F*mult*escalaDe(habSel))+poder;

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
    /* a Ward nasce ONDE O HERÓI ESTÁ e acende um raio dali por algumas rodadas */
    poeWard(h.t,h.pos);
    txt+=` — ward posta aqui (raio ${VISAO_WARD}, ${WARD_RODADAS} rodadas)`;
  }
  if(ef.revive&&alvo.morto){ alvo.morto=Math.max(1,alvo.morto-1); txt+=` — ${alvo.n} volta 1 rodada antes`; }
  if(ef.marca){ alvo.marca=ef.marca; txt+=` — ${alvo.n} marcado (+${ef.marca})`; }
  /* ZONA — o alvo é o CHÃO, não a peça. Nasce onde a habilidade aponta (ou sob o
     próprio herói, quando ela é `alvo:"eu"`), e continua lá depois do turno. */
  if(ef.zona){
    const onde = (hb.alvo==="eu"||!alvo||!alvo.pos) ? h.pos : alvo.pos;
    poeZona(h.t,onde,{...ef.zona,n:hb.n,dono:h});
    txt+=` — ${hb.n} cobre ${ef.zona.raio||1} de raio pelos ${ZONA_TURNOS} próximos turnos do adversário`;
  }

  if(ef.dano||ef.danoFixo){
    let d = ef.danoFixo ? ef.danoFixo : base(ef.dano);
    if(ef.extra)d+=ef.extra;
    if(ef.bonusFerido&&alvo.vida<=alvo.vidaMax/2)d+=ef.bonusFerido;
    if(ef.executa&&alvo.vida<=ef.executa){ reg("b",`EXECUÇÃO — ${h.n} elimina ${alvo.n}`); mata(alvo,h); }
    else aplicaDano(h,alvo,d,txt,habSel===2||h.habs[habSel].f>=5,!!ef.danoFixo||!!ef.perfura);
    /* o efeito com prazo entra DEPOIS do dano e só se o alvo sobreviveu: pendurar
       sangramento num defunto não faz sentido e ainda sujaria o crédito da morte */
    if(ef.dot&&!alvo.morto) poeDot(alvo,h,ef.dot.tipo,ef.dot.dano,ef.dot.rodadas);
    if(ef.area) inimigosNosHex(vizinhos(...alvo.pos),h)
      .forEach(o=>danoEmEntidade(h,o,Math.round(d/2),hb.n,habSel===2,!!ef.danoFixo||!!ef.perfura));
    if(ef.ouroSeMatar&&alvo.morto)h.ouro+=ef.ouroSeMatar;
    h.recarga=0;
  }else reg(J.vez?"c":"a",txt);

  if(ef.danoVizinhos) inimigosNosHex(vizinhos(...h.pos),h)
    .forEach(o=>danoEmEntidade(h,o,base(ef.danoVizinhos),hb.n,habSel===2));
  if(ef.danoRaio){
    const raio=[];
    for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++)
      if(noTab(c,r)&&dist(...h.pos,c,r)<=ef.danoRaio) raio.push([c,r]);
    inimigosNosHex(raio,h).forEach(o=>danoEmEntidade(h,o,Math.round(F*escalaDe(habSel))+poder,hb.n,habSel===2));
  }
  if(ef.prendeVizinhos) vizinhos(...h.pos).map(p=>em(...p)).filter(o=>o&&o.t!==h.t)
    .forEach(o=>{o.preso=2;reg("b",`${o.n} está preso`);});   /* prender só vale em herói */
  if(ef.prende&&alvo){ alvo.preso=2; reg("b",`${alvo.n} está preso`); }
  if(ef.puxar&&alvo&&!alvo.morto) desloca(alvo,h.pos,-1,ef.puxar);
  if(ef.empurrar&&alvo&&!alvo.morto) desloca(alvo,h.pos,1,ef.empurrar);
  if(critico) reg("b","CRÍTICO — dado 6 natural");

  h.emboscada=0;
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
/* ---------- QUEM ESTÁ NUM HEXÁGONO ----------
   `em(c,r)` responde só "que HERÓI está aqui". Os três efeitos de área do jogo
   (respingo, dano nos vizinhos, dano em raio) foram escritos em cima dela, e por
   isso enxergavam um mapa só de heróis: o Cerco do Torvald com o Dragão colado
   não tirava um ponto do Dragão, porque o Dragão não é herói.

   Estas duas funções são o lugar único onde se pergunta "o que dá para acertar
   aqui". Quem for adicionar creep ou monstro de acampamento como alvo mexe aqui
   e os três efeitos passam a acertar de graça.

   Estrutura (torre e Nexus) NÃO entra: ela tem porta própria — alvo mirado, dano
   fixo, revide — e deixar respingo derrubar torre mudaria o ritmo de cerco sem
   ninguém ter pedido. */
const epicoNoHex=(c,r)=> (J.poco.vida>0 && k(c,r)===POCO_K) ? J.poco : null;
const ehEpico=o=> o===J.poco;
function inimigosNosHex(hexes,h){
  const fora=[];
  hexes.forEach(([c,r])=>{
    const o=em(c,r);          if(o&&o.t!==h.t&&!o.morto) fora.push(o);
    const ep=epicoNoHex(c,r); if(ep) fora.push(ep);
  });
  return fora;
}
/* dano que não sabe de antemão se bate em herói ou em morador do poço.
   O poço não tem armadura nem escudo: ele conta GOLPES, então respingo vale 1. */
function danoEmEntidade(quem,alvo,bruto,txt,ehUlt,ignoraArm){
  /* O poço conta GOLPES, não dano — e o peso do golpe é da HABILIDADE, não do
     caminho por onde ele chegou. Antes o respingo entrava sempre como 1, então
     o Cerco do Torvald (que é Ultimate) tirava 1 do Dragão enquanto uma
     Ultimate mirada tirava 2. Mesma habilidade, peso diferente por acidente. */
  if(ehEpico(alvo)){
    const d=EPICO[alvo.id];
    /* morador que conta dano leva o respingo pela mesma conta de um herói —
       `bruto` já chega dividido de quem chamou. Armadura entra aqui porque o
       respingo não passa por `golpeNoPoco`. */
    const golpe = d.porDano ? Math.max(1,bruto-(ignoraArm?0:(d.arm||0)))
                            : (ehUlt?GOLPE_ULT:GOLPE_HAB);
    return golpeiaEpico(quem,alvo,golpe,txt?` com ${txt}`:"");
  }
  aplicaDano(quem,alvo,bruto,txt,ehUlt,ignoraArm);
}
function aplicaDano(quem,alvo,bruto,txt,ehUlt,ignoraArm){
  /* antes de qualquer coisa: bateu em herói inimigo, entregou a posição.
     Fica aqui e não em cada habilidade porque este é o funil por onde passam
     básica, ultimate e respingo — três lugares, uma regra. */
  if(quem&&quem.t!==alvo.t&&!ehEpico(quem)&&!ehEpico(alvo)) entregaPosicao(quem);
  if(alvo.intoc){ reg("b",`${alvo.n} está intocável — sem efeito`); return; }
  if(ehUlt&&bonus(alvo,"veu")&&!alvo.veuAtivo){
    alvo.veuAtivo=1; reg("b",`VÉU PRISMÁTICO — ${alvo.n} anula a Ultimate`); return; }
  /* DANO GARANTIDO (`danoFixo`). Três Ultimates usam número fixo em vez de
     escalar com o dado: Julgamento, Ato Final e Sentença. Elas continuavam
     perdendo para a própria básica mesmo depois da escala 1,5× da v16, porque
     número fixo não escala com nada — nem com o dado, nem com o Poder, nem com
     item. Pior: elas PIORAVAM ao longo da partida, enquanto a básica subia.

     A saída não foi só aumentar o número, que faria delas "a básica com mais
     dano". Elas passam a IGNORAR ARMADURA. Agora são uma função diferente, não
     uma versão pior: previsíveis, e o melhor golpe do jogo contra tanque —
     exatamente onde a básica, que perde ponto a ponto para a armadura, falha. */
  let d=Math.max(1,bruto+(alvo.marca||0)-(ignoraArm?0:armTotal(alvo)));
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
/* ---------- O PREÇO DE MORRER CRESCE ----------
   Morrer custava 2 rodadas do começo ao fim. Com a base a uma casa do Nexus, o
   defensor de fim de partida voltava inteiro, de graça e no lugar certo — dava
   para segurar o Nexus morrendo de propósito, que foi o relato do playtest:
   *"não ficar dentro da base se curando e lutando contra os inimigos"*.

   Não existe cura de base neste jogo; o que existe é o RESPAWN, que devolve
   vida cheia. Então é ele que tem preço. A curva é a de MOBA: 2 rodadas até a 8,
   3 até a 16, 4 daí em diante. Cedo, morrer é lição; tarde, morrer é a partida —
   e é o que abre a janela para o atacante fechar o Nexus com um herói. */
const RESPAWN_BASE=2, RESPAWN_MAX=4, RESPAWN_PASSO=8;
const respawnAgora=()=>Math.min(RESPAWN_MAX,
  RESPAWN_BASE+Math.floor((J.rodada-1)/RESPAWN_PASSO));

function mata(alvo,quem){
  /* morrer limpa o que estava pendurado: o respawn devolve o herói inteiro, e
     sangramento que sobrevivesse à morte cobraria duas vezes pelo mesmo golpe */
  alvo.vida=0; alvo.morto=respawnAgora(); alvo.esc=0; alvo.intoc=0;
  alvo.dots=[]; alvo.curouSitiado=0;
  quem.ouro+=4;
  reg("b",`☠ ${alvo.n} morreu — volta em ${alvo.morto} rodada${alvo.morto>1?"s":""} · ${quem.n} leva 4 de ouro`);
}

/* conclui o Recuo: anda a casa escolhida sem tocar no Dado Mestre */
function recuaAte(c,r){
  if(modo!=="recuo"||!selHeroi)return;
  if(!mover.some(p=>p[0]===c&&p[1]===r))return;
  const h=selHeroi, de=[...h.pos];
  h.pos=[c,r];
  animaMovimento(h,de);
  coletaAcampamento(h);
  reg(J.vez?"c":"a",`${h.n} recua uma casa`);
  modo=null; mover=[]; calcula(); pinta();
}

/* ---------- CONVERSÃO ----------
   Todo dado tem saída. Era o buraco do "quarto dado inutilizável": um herói só
   age uma vez por turno, então quando a Retomada, a Prioridade ou a carta
   Adiantar davam o 4º dado e já não sobrava herói livre — ou os que sobravam não
   tinham ninguém no alcance — o dado ficava na mesa sem uso e sem explicação.
   A conversão já existia como clique num botão anônimo; agora é função com nome,
   a IA sabe usá-la, e `pinta` avisa quando é a única saída que resta. */
function converteDado(i){
  const idx = i==null?dadoSel:i;
  if(idx===null||idx===undefined||!J.dados[idx]||J.dados[idx].usado)return false;
  const d=J.dados[idx]; d.usado=1; J.mov.rest+=d.v; J.mov.v+=d.v;
  reg(J.vez?"c":"a",`${NOMES[J.vez]} vira a ação ${d.v} em movimento (total ${J.mov.rest})`);
  toast("+"+d.v+" de movimento",""); vibra(12);
  dadoSel=null; calcula(); pinta();
  return true;
}
/* um dado que nenhum herói livre consegue pagar não é decisão, é lixo na mesa */
function dadoSemUso(i){
  const d=J.dados[i]; if(!d||d.usado)return false;
  return !J.times[J.vez].herois.some(h=>!h.morto&&!h.agiu
    &&(!d.dono||d.dono===h.id)&&h.habs.some(hb=>d.v>=hb.f));
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
/* O viewBox sai da geometria, não de número escrito no HTML: trocar `N` tem que
   redesenhar o mapa inteiro sem ninguém lembrar de ajustar o SVG à mão. Mede só
   as casas que existem — a borda sem par não entra e não vira margem morta. */
(()=>{ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){ if(!noTab(c,r))continue;
    const[x,y]=centro(c,r); x0=Math.min(x0,x-R);y0=Math.min(y0,y-R);x1=Math.max(x1,x+R);y1=Math.max(y1,y+R); }
  const m=6;
  svg.setAttribute("viewBox",`${(x0-m).toFixed(1)} ${(y0-m).toFixed(1)} ${(x1-x0+2*m).toFixed(1)} ${(y1-y0+2*m).toFixed(1)}`);
})();
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
  oculto:"M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M6.5 6.6C4 8.2 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.3-.9",
  casa:"M4 11l8-7 8 7v9h-6v-5h-4v5H4z"
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
  /* a mesma escala do motor: se a ficha prometer menos do que sai, o jogador
     aprende a não confiar na ficha */
  const esc=escalaDe(h.habs.indexOf(hb));
  const t=[];
  if(e.danoFixo) t.push(`${e.danoFixo} de dano garantido · ignora armadura`);
  else if(e.dano){
    const base=F!=null?Math.round(F*e.dano*esc)+p+(e.extra||0):null;
    t.push(base!=null?`~${base} de dano`:(esc>1?`Força × ${esc} + ${p} de dano`:`Força + ${p} de dano`));
  }
  if(e.area) t.push("respinga nos vizinhos");
  if(e.danoVizinhos) t.push("dano em todos os vizinhos");
  if(e.danoRaio) t.push(`dano em todos até ${e.danoRaio} casas`);
  if(e.escudo) t.push(`escudo ${F!=null?F+e.escudo:"Força+"+e.escudo}`);
  if(e.cura) t.push(`cura ${e.cura}`);
  if(e.ouro) t.push(`+${e.ouro} de ouro`);
  if(e.recarga) t.push(`próximo golpe +${e.recarga}`);
  if(e.intocavel) t.push("fica intocável");
  if(e.ward) t.push("posta uma ward aqui");
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
/* A IA descobre o que dá para fazer CHAMANDO iniciaHab em cada habilidade de cada
   herói e vendo o que sobra mirado — ou seja, ela erra de propósito, dezenas de vezes
   por turno. Cada erro desses disparava o mesmo aviso que o jogador humano recebe, e
   a tela virava uma cascata de "ninguém no alcance" durante a vez do adversário.
   O aviso é certo; o público é que estava errado. `sondando` cala a UI enquanto a IA
   está só tateando — as mensagens que ela emite de propósito ficam fora da sonda. */
let sondando=false;
/* True durante TODO o turno da máquina — não só enquanto `J.vez` aponta para ela.
   O buraco anterior estava no fecho: `encerraTurno` e `fimDaRodada` rodam de dentro
   do turno da IA mas já com a vez virada, e era de lá que saíam justamente as
   mensagens que insistiam em aparecer no meio da tela (o gank da rotação, a
   torre que a onda derrubou, quem caiu na virada). `iaRodando` só é desligado
   depois disso tudo, então é ele quem marca a fronteira certa. */
const souIA=()=>aiMode&&J&&(iaRodando||J.vez===1);
/* narração da IA — canto inferior direito, fora do caminho do tabuleiro */
function falaIA(txt,cls){
  const cx=G("iaFala"); if(!cx)return;
  /* pulando: o passo a passo perde a função (ninguém lê seis linhas em meio segundo),
     mas o evento não — é ele o "resultado" que o botão promete mostrar. */
  if(pularIA&&cls!=="evento")return;
  const d=document.createElement("div");
  d.className="iaL"+(cls?" "+cls:""); d.textContent=txt;
  cx.appendChild(d);
  while(cx.children.length>3) cx.firstChild.remove();
  setTimeout(()=>{ if(d.parentNode) d.remove(); },pularIA?2600:1900);
}
function toast(txt,tipo){
  if(sondando)return;
  /* Nada da vez da IA aparece no meio da tela. Antes só a narração descia para o
     canto, e "GANK NO TOPO" continuava cobrindo o tabuleiro — mas quem dá o gank é
     ela, então a mensagem é dela também. O meio da tela volta a ser exclusivo do
     que VOCÊ faz; a vez do adversário inteira mora no rodapé. */
  if(souIA()) return falaIA(txt,(tipo==="morte"||tipo==="gank")?"evento":"viva");
  const d=document.createElement("div");
  d.className="tst"+(tipo?" "+tipo:""); d.textContent=txt;
  G("toast").appendChild(d);
  setTimeout(()=>d.remove(),2300);
}
function tremer(h){
  agendaAnim(()=>{
    const g=svg.querySelector(`[data-peca="${h.t}-${h.id}"]`);
    if(!g)return;
    g.classList.remove("treme"); void g.getBBox(); g.classList.add("treme");
    setTimeout(()=>g.classList.remove("treme"),360);
  });
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
    /* escudo que DESCE também é notícia. Antes só a subida virava número, e um
       golpe inteiramente absorvido não produzia nada na tela: sem número de
       dano (a vida não mudou), sem tremida, sem vibração. O jogador batia duas
       vezes e via o adversário intacto, sem explicação. Agora o golpe absorvido
       treme a peça igual, e o número sai com o sinal do escudo. */
    else if(h.esc<s.e&&!h.morto){ fx(h.pos,"⛨−"+(s.e-h.esc),"esc"); tremer(h); bateu=true; }
    if(h.morto&&!s.m){ fx(h.pos,"☠","morte"); toast(h.n+" caiu","morte"); vibra([35,55,35]); }
  });
  if(bateu) vibra(18);
}
const _usaHab=usaHab;
usaHab=function(alvo){
  const s=fotografa();
  /* posição capturada ANTES: puxar e empurrar mudam o alvo de casa no meio do golpe */
  const quem=ativo&&ativo.h, onde=alvo&&alvo!==quem&&alvo.pos?[...alvo.pos]:null;
  _usaHab(alvo); revela(s);
  if(quem&&onde) agendaAnim(()=>animaAtaque(quem,onde));
};
/* Fila de animação da peça. `pinta()` refaz o SVG inteiro (svg.textContent=""), e
   tudo que era aplicado à peça ANTES dele morria junto — foi por isso que `tremer`
   nunca apareceu na tela: era chamado de `revela()`, que roda antes do redesenho de
   `confirmaHab`. Agendar e disparar no fim de `pinta()` conserta isso de uma vez. */
let animPend=[];
function agendaAnim(fn){ animPend.push(fn); }
function rodaAnims(){
  if(!animPend.length)return;
  const fila=animPend; animPend=[];
  requestAnimationFrame(()=>fila.forEach(f=>{ try{ f(); }catch(e){} }));
}
/* O golpe: a peça avança meio caminho na direção do alvo e volta. Vale para herói,
   torre, Nexus e poço — o alvo entra como posição, não como objeto, justamente para
   estrutura poder usar a mesma animação. O avanço é limitado a pouco mais de meio
   hexágono para o atirador de alcance 3 não atravessar o tabuleiro em 380ms. */
function animaAtaque(quem,pos){
  const g=svg.querySelector(`[data-peca="${quem.t}-${quem.id}"]`);
  if(!g||!pos)return;
  const [x0,y0]=centro(...quem.pos), [x1,y1]=centro(...pos);
  const dx=x1-x0, dy=y1-y0, n=Math.hypot(dx,dy);
  if(!n)return;
  const esc=(()=>{ try{ const m=svg.getScreenCTM(); return m?m.a:1; }catch(e){ return 1; } })();
  const av=Math.min(n*0.5, R*0.62)*esc;
  try{
    g.animate([{transform:"none",offset:0},
               {transform:`translate(${dx/n*av}px,${dy/n*av}px)`,offset:.38},
               {transform:"none",offset:1}],
      {duration:380,easing:"cubic-bezier(.2,.85,.3,1)"});
  }catch(e){}
}
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
/* Confirmação com explicação. Recurso que some sem o jogador entender o que
   comprou é recurso que ele para de usar — foi o caso da Prioridade, gasta por
   engano e sem nunca dizer o que ia acontecer. */
function confirma(titulo,texto,aoSim){
  abre(`<span class="et">${titulo}</span>
    <p style="text-align:left;line-height:1.6">${texto}</p>
    <button class="grande" id="ok">Confirmar</button>
    <button class="grande" id="btNao"
      style="background:none;border:1px solid var(--line);color:var(--ink-2)">Cancelar</button>`,
    ()=>{ fecha(); aoSim(); });
  const n=G("btNao"); if(n) n.onclick=()=>fecha();
}

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
  mover=[]; alvos=[]; alvosTorre=[]; alvosEpico=[]; alvoNexus=null;
  if(modo==="mover"&&selHeroi&&!selHeroi.morto&&selHeroi.t===J.vez&&!selHeroi.preso&&J.mov.rest>0){
    const teto=J.mov.rest+((ehAgil(selHeroi)&&!selHeroi.agilUsado)?1:0);
    for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
      if(!noTab(c,r)||em(c,r))continue;   // casa fora do tabuleiro não é destino
      const d=dist(...selHeroi.pos,c,r);
      if(d>0&&d<=teto) mover.push([c,r]);
    }
  }
  /* o Lampejo pinta as mesmas casas verdes do mover, mas com outra régua:
     ignora movimento restante e ignora `preso`. Só não atravessa para dentro
     da base inimiga — de lá o Nexus ficaria a um salto de distância. */
  if(modo==="lampejo"&&selHeroi&&!selHeroi.morto&&selHeroi.t===J.vez&&temFeitico(selHeroi.t)){
    for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
      if(!noTab(c,r)||em(c,r))continue;
      if(BASE_S.get(k(c,r))===1-selHeroi.t)continue;
      const d=dist(...selHeroi.pos,c,r);
      if(d>0&&d<=LAMPEJO_ALC) mover.push([c,r]);
    }
  }
  /* Recuo: uma casa, de graça, ignorando movimento restante e prisão — é uma
     carta de reação, e o ponto dela é justamente escapar de onde você travou. */
  if(modo==="recuo"&&selHeroi&&!selHeroi.morto){
    mover=vizinhos(...selHeroi.pos).filter(([c,r])=>noTab(c,r)&&!em(c,r)
      &&BASE_S.get(k(c,r))!==1-selHeroi.t);
  }
  if(modo==="mirar"&&selHeroi&&habAtual!==null){
    const h=selHeroi, hb=h.habs[habAtual], alc=alcTotal(h)+(hb.ef.alcExtra||0);
    alvos=todos().filter(o=>{
      if(o.morto)return false;
      if(!visivelPara(o,h.t))return false;      // escondido no mato: não é alvo
      if(hb.alvo==="in"&&(o.t===h.t||o.intoc))return false;
      if(hb.alvo==="al"&&(o.t!==h.t||o===h))return false;
            if(hb.alvo==="eu")return o===h;
      return hb.ef.semAlcance||dist(...h.pos,...o.pos)<=alc;
    });
    alvosTorre=torresAoAlcance(h,hb,alc);
    alvosEpico=epicosAoAlcance(h,hb,alc);
    alvoNexus=nexusAoAlcance(h,hb,alc);
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
/* A torre EXPOSTA de uma rota: a mais avançada que ainda está de pé. Enquanto
   ela vive, a de trás não aceita golpe — senão dava para passar por fora da
   linha de frente e bater direto na porta da base. Time 0 avança para índice
   maior, time 1 para índice menor: por isso os dois extremos. */
function torreExposta(rota,t){
  const vivas=J.torres.filter(x=>x.rota===rota&&x.t===t&&x.vida>0);
  if(!vivas.length) return null;
  return vivas.reduce((a,b)=>((t===0?b.i>a.i:b.i<a.i)?b:a));
}
/* Até a v0.6 havia aqui `if(J.frentes[tr.rota]!==tr.i) return false;` — a torre
   só aceitava golpe de herói com a ONDA em cima dela. Na prática o herói nunca
   cercava: esperava o creep chegar. Agora quem decide é a posição do herói, e a
   onda voltou a ser o que devia ser — pressão constante, não permissão. */
function torresAoAlcance(h,hb,alc){
  if(!(hb.ef.dano||hb.ef.danoFixo)||hb.alvo!=="in") return [];
  return J.torres.filter(tr=>{
    if(tr.t===h.t||tr.vida<=0) return false;
    if(torreExposta(tr.rota,tr.t)!==tr) return false;
    return hb.ef.semAlcance||dist(...h.pos,...ROTAS[tr.rota][tr.i])<=alc;
  });
}

/* O Nexus só fica exposto quando uma rota INTEIRA daquele lado cai — as duas
   torres da rota no chão. É o que separa "invadir" de "ganhar por atalho":
   sem isso um assassino veloz correria para a base na rodada 2. */
const rotaAberta=t=>Object.keys(ROTAS).some(nome=>
  !J.torres.some(x=>x.rota===nome&&x.t===t&&x.vida>0));
function nexusAoAlcance(h,hb,alc){
  if(!(hb.ef.dano||hb.ef.danoFixo)||hb.alvo!=="in") return null;
  const lado=1-h.t;
  if(J.nexus[lado]<=0) return null;
  if(!rotaAberta(lado)) return null;
  const d=Math.min(...BASE[lado].map(([c,r])=>dist(...h.pos,c,r)));
  return (hb.ef.semAlcance||d<=alc) ? lado : null;
}

/* dado que será gasto: o escolhido à mão, senão o menor que atende */
function dadoPara(hb){
  if(dadoSel!==null&&!J.dados[dadoSel].usado&&J.dados[dadoSel].v>=hb.f
     &&(!J.dados[dadoSel].dono||J.dados[dadoSel].dono===selHeroi?.id)) return dadoSel;
  let melhor=null;
  J.dados.forEach((d,i)=>{
    if(d.usado||d.v<hb.f||(d.dono&&d.dono!==selHeroi?.id))return;
    if(melhor===null||d.v<J.dados[melhor].v) melhor=i;
  });
  return melhor;
}

function escolheHeroi(h){
  if(cliqueBloqueado||J.fase!=="jogando")return;
  /* passa pelo desempate: se houver estrutura embaixo deste herói (defensor em
     cima do Nexus, herói em cima da própria torre), o jogador escolhe em vez de
     o maior alvo de toque decidir por ele */
  if(modo==="mirar"&&alvos.includes(h)) return tocaAlvo(...h.pos);
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
  if(!alvos.length&&!alvosTorre.length&&!alvosEpico.length&&alvoNexus===null){
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
  selHeroi.emboscada=escondido(selHeroi)?1:0;
  ativo={h:selHeroi,forca:d.v,seis:d.v===6};
  habSel=habAtual;
  reg(J.vez?"c":"a",`${selHeroi.n} usa ${hb.n} com o dado ${d.v}`);
  dadoSel=null; vibra(14);
  usaHab(alvo||selHeroi);
  modo=null; habAtual=null; confirmar=null; ativo=null; habSel=null;
  calcula(); pinta();
}
/* o golpe na torre não passa por usaHab: torre não tem armadura, escudo nem status.
   Dano fixo e o revide é o preço de encostar.

   A trava de "um golpe por rodada" saiu na v16. Ela era invisível e enganava:
   o jogador que gastava o dado doado pelo Suporte para bater de novo na mesma
   torre via a ação sumir sem explicação nenhuma na tela. A estrutura agora é
   como qualquer alvo — se sobra recurso, dá para bater de novo, e o teto vira o
   que sempre deveria ter sido: dado na mesa e herói que ainda não agiu. */
function atacaTorre(tr){
  if(!selHeroi||habAtual===null)return;
  const h=selHeroi, hb=h.habs[habAtual], di=dadoPara(hb);
  if(di===null)return;
  J.dados[di].usado=1; h.agiu=1; dadoSel=null; vibra(16);

  const somaAriete=(J.times[h.t].barao>0&&J.times[h.t].dadiva==="ariete")?BARAO_ARIETE:0;
  tr.vida-=DANO_TORRE+somaAriete;
  agendaAnim(()=>animaAtaque(h,ROTAS[tr.rota][tr.i]));
  reg(J.vez?"c":"a",`${h.n} bate na torre do ${tr.rota} com ${hb.n}${somaAriete?" (ARÍETE)":""} `+
      `(${Math.max(0,tr.vida)}/${VIDA_TORRE})`);
  fx(ROTAS[tr.rota][tr.i],"-"+(DANO_TORRE+somaAriete),"dano");

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

/* O Nexus, pela mesma porta da torre: dano fixo de 1, sem trava por rodada e sem
   revide — quem chegou até aqui já pagou o pedágio das duas torres da rota.
   Até a v0.6 não existia caminho nenhum: só a onda derrubava Nexus, e a partida
   terminava sem que ninguém desse o golpe final. */
function atacaNexus(lado){
  if(!selHeroi||habAtual===null)return;
  const h=selHeroi, hb=h.habs[habAtual], di=dadoPara(hb);
  if(di===null)return;
  J.dados[di].usado=1; h.agiu=1; dadoSel=null; vibra(18);

  const ariete=(J.times[h.t].barao>0&&J.times[h.t].dadiva==="ariete")?BARAO_ARIETE:0;
  J.nexus[lado]-=1+ariete;
  agendaAnim(()=>animaAtaque(h,BASE[lado][0]));
  reg(J.vez?"c":"a",`${h.n} golpeia o NEXUS ${NOMES[lado]} com ${hb.n} `+
      `(${Math.max(0,J.nexus[lado])}/${VIDA_NEXUS})`);
  fx(BASE[lado][0],"-"+(1+ariete),"dano");

  if(J.nexus[lado]<=0){
    reg("b",`NEXUS ${NOMES[lado]} DESTRUÍDO`);
    toast("NEXUS DESTRUÍDO","gank"); vibra([60,80,60]);
    encerraPartida(1-lado,`Nexus ${NOMES[lado]} destruído por ${h.n}.`,h);
  }else{ toast("NEXUS EM "+J.nexus[lado],"gank"); }
  modo=null; habAtual=null; confirmar=null; ativo=null; habSel=null;
  calcula(); pinta();
}

/* mesma porta da torre: dano fixo, sem armadura e sem status — mas sem a trava de
   e com o prêmio indo para quem der o último.

   `golpeiaEpico` é o miolo, separado de `atacaEpico` porque o morador do poço
   pode agora levar pancada por DOIS caminhos: mirado (atacaEpico, gasta dado) ou
   de respingo (usaHab, sem gastar dado a mais). Antes só existia o mirado, e o
   respingo o atravessava — ver `inimigosNosHex`. */
/* QUANTO ESTE GOLPE TIRA DO MORADOR — um lugar só, de propósito.
   O combate e a IA calculavam isto separado, e enquanto os dois moradores
   contavam golpes ninguém percebia. Com o Barão contando dano, a divergência
   apareceria na hora: a IA avaliaria "fecho com este golpe?" em golpes enquanto
   o motor cobraria em dano, e ela largaria o Barão achando que nunca fecha.
   Qualquer caminho novo até o poço deve passar por aqui. */
function golpeNoPoco(h,hb,slot,F,ep){
  const d=EPICO[ep.id];
  /* o foco da Rotação do Caçador vale nos DOIS moradores — o `return` antecipado
     do Dragão pulava o bônus e fazia o destino "poço" não servir para nada na
     metade da partida em que o Dragão é o morador */
  const foco=h.focoPoco?1:0;
  if(!d.porDano) return (slot===2?GOLPE_ULT:GOLPE_HAB)+foco;
  const ef=hb.ef;
  const bruto=Math.round(F*(ef.dano||1)*escalaDe(slot))
             +poderTotal(h)+(h.recarga||0)+dupla(h)+(ef.extra||0);
  /* perfurante ignora a armadura do poço pelo mesmo motivo que ignora a de um
     herói — é a função dela, e é o que dá a essas Ultimates um papel contra o
     Barão, que tem 3 de armadura */
  if(ef.danoFixo) return ef.danoFixo+foco;
  if(ef.perfura)  return Math.max(1,bruto+foco);
  return Math.max(1,bruto+foco-(d.arm||0));
}
function golpeiaEpico(h,ep,golpe,comoTxt){
  const d=EPICO[ep.id];
  ep.vida-=golpe;
  agendaAnim(()=>animaAtaque(h,POCO));
  reg(J.vez?"c":"a",`${h.n} golpeia o ${d.n}${comoTxt||""} (−${golpe}) `
     +`(${Math.max(0,ep.vida)}/${ep.vidaMax})`);
  fx(POCO,"-"+golpe,"dano");

  if(ep.vida<=0){ levaEpico(ep,h.t); return; }
  /* o revide nunca mata, pelo mesmo motivo da torre: `mata()` precisa de autor
     para creditar o ouro, e monstro neutro não é autor. */
  const levou=Math.min(d.revide,h.vida-1);
  if(levou>0){ h.vida-=levou; reg("b",`o ${d.n} revida — ${levou} em ${h.n}`);
    fx(h.pos,-levou,"dano"); tremer(h); }
}
/* ---------- QUEM ESTÁ NESTE HEXÁGONO, AFINAL ----------
   Herói e estrutura dividem hexágono o tempo todo: defensor em cima do Nexus,
   herói em cima da própria torre, e o morador do poço com alguém colado. Até a
   v26 o desempate era o TAMANHO DO ALVO DE TOQUE — criatura com raio 15,5,
   estrutura com raio 9 — e o herói ainda era desenhado por cima. Na prática a
   estrutura ficava inalcançável, e o relato foi o pior caso possível:

     "eu estava com todos os creeps na base e ele com os heróis dentro do nexus,
      eu não conseguia dar dano no nexus pra acabar a partida"

   Empate travado, porque a ÚLTIMA MURALHA (v23) segura a onda de propósito
   esperando o golpe de herói — e a tela não deixava dar esse golpe. Regra e
   interface se contradiziam.

   Agora o hexágono devolve TODOS os alvos válidos que estão nele, e quem escolhe
   é o jogador. Com um alvo só nada muda: o toque resolve direto, sem janela. */
function alvosNoHex(c,r){
  const out=[];
  alvos.forEach(o=>{ if(o.pos[0]===c&&o.pos[1]===r)
    out.push({tipo:"heroi",v:o,n:o.n,d:`${Math.max(0,o.vida)}/${o.vidaMax} de vida`
      +(o.esc>0?` · escudo ${o.esc}`:"")}); });
  alvosTorre.forEach(tr=>{ const p=ROTAS[tr.rota][tr.i];
    if(p[0]===c&&p[1]===r) out.push({tipo:"torre",v:tr,n:`Torre ${tr.rota}`,
      d:`${Math.max(0,tr.vida)}/${VIDA_TORRE} de vida · revida ${REVIDE_TORRE}`}); });
  alvosEpico.forEach(ep=>{ if(k(c,r)===POCO_K)
    out.push({tipo:"epico",v:ep,n:EPICO[ep.id].n,
      d:`${Math.max(0,ep.vida)}/${ep.vidaMax} de vida · revida ${EPICO[ep.id].revide}`}); });
  if(alvoNexus!==null&&BASE[alvoNexus].some(([bc,br])=>bc===c&&br===r))
    out.push({tipo:"nexus",v:alvoNexus,n:`Nexus ${NOMES[alvoNexus]}`,
      d:`${Math.max(0,J.nexus[alvoNexus])}/${VIDA_NEXUS} — é a vitória`});
  return out;
}
function executaAlvo(a){
  if(a.tipo==="nexus")      atacaNexus(a.v);
  else if(a.tipo==="torre") atacaTorre(a.v);
  else if(a.tipo==="epico") atacaEpico(a.v);
  else                      confirmaHab(a.v);
}
/* O toque num hexágono durante a mira. Um alvo resolve direto; dois ou mais
   abrem a escolha, porque adivinhar por baixo do dedo é como o bug nasceu. */
function tocaAlvo(c,r){
  const lista=alvosNoHex(c,r);
  if(!lista.length)return;
  if(lista.length===1) return executaAlvo(lista[0]);
  const ICONE={heroi:"⚔",torre:"⌂",epico:"☠",nexus:"◈"};
  const bts=lista.map((a,i)=>`<button class="grande escAlvo" data-i="${i}"
      style="font-size:15px;padding:12px;text-align:left">
      ${ICONE[a.tipo]||"•"} ${a.n}<br><span style="font-size:12.5px;opacity:.8">${a.d}</span></button>`).join("");
  abre(`<span class="et">Mesmo hexágono</span><h2>Bater em quem?</h2>
    <p>Há <b>${lista.length} alvos</b> nesta casa.</p>${bts}
    <button class="grande" id="escAlvoX"
      style="background:none;border:1px solid var(--line);color:var(--ink-2)">cancelar</button>`);
  G("telacx").querySelectorAll(".escAlvo").forEach(b=>b.onclick=()=>{
    fecha(); executaAlvo(lista[+b.dataset.i]); });
  G("escAlvoX").onclick=()=>{ fecha(); pinta(); };
}
function atacaEpico(ep){
  if(!selHeroi||habAtual===null)return;
  const h=selHeroi, hb=h.habs[habAtual], di=dadoPara(hb);
  if(di===null)return;
  J.dados[di].usado=1; h.agiu=1; dadoSel=null; vibra(16);

  /* A ultimate vale por duas. Antes todo golpe tirava 1, e a consequência era que
     a habilidade básica de Força 1 era o jeito mais barato de matar o épico — o
     objetivo grande premiava o dado pequeno. Com 2, derrubar o poço em uma rodada
     exige que alguém queime a ultimate nele em vez de num herói: é a escolha que
     faz o objetivo pesar. Testado na mesa antes de entrar. */
  golpeiaEpico(h,ep,golpeNoPoco(h,hb,habAtual,J.dados[di].v,ep),` com ${hb.n}`);
  if(EPICO[ep.id].porDano) h.recarga=0;   // a carga foi gasta no golpe, como em usaHab
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
    tm.baroes++;
    reg("b",`${NOMES[t]} levou o Barão — escolha a dádiva`);
    escolheDadiva(t);
  }
  toast(EPICO[ep.id].n.toUpperCase()+" É DO "+NOMES[t],"gank"); vibra([40,60,40,60,80]);
}

/* Aplica a dádiva escolhida. `tm.barao` conta as rodadas que faltam e
   `tm.dadiva` diz qual efeito está de pé — os dois expiram juntos. */
function aplicaDadiva(t,id){
  const tm=J.times[t], d=DADIVA[id];
  if(!d)return;
  tm.dadiva=id; tm.barao=BARAO_RODADAS;
  reg(t?"c":"a",`${NOMES[t]} escolheu ${d.n} — ${BARAO_RODADAS} rodadas`);
  toast(d.n.toUpperCase(),"gank"); vibra([40,60,40,60,80]);
  if(id==="egide") daEgide(t);      // o primeiro escudo sai na hora, não no turno seguinte
  calcula(); pinta();
}
function daEgide(t){
  J.times[t].herois.filter(h=>!h.morto).forEach(h=>{
    h.esc+=BARAO_ESCUDO; fx(h.pos,"⛨"+BARAO_ESCUDO,"esc");
  });
}
function escolheDadiva(t){
  /* a IA decide sozinha; o humano escolhe na tela */
  if(simMode||(aiMode&&t===1)) return aplicaDadiva(t,iaEscolheDadiva(t));
  const bts=DADIVAS.map(d=>
    `<button class="grande dadiva" data-d="${d.id}" style="font-size:15px;padding:12px 14px;text-align:left">
       <b style="font-size:17px">${d.ico} ${d.n}</b><br>
       <span style="font-size:13.5px;opacity:.85">${d.d}</span><br>
       <span style="font-size:12px;color:var(--brass)">${d.porque}</span>
     </button>`).join("");
  abre(`<span class="et">Barão derrubado</span>
    <h2 class="t${t}">${NOMES[t]} escolhe</h2>
    <p>Uma das três, por <b>${BARAO_RODADAS} rodadas</b>.</p>${bts}`);
  G("telacx").querySelectorAll(".dadiva").forEach(b=>b.onclick=()=>{
    fecha(); aplicaDadiva(t,b.dataset.d);
  });
}
/* A IA escolhe pela situação, não por gosto: se está atrás em torre, quer
   derrubar estrutura; se está apanhando, quer escudo; senão, empurra o mapa. */
function iaEscolheDadiva(t){
  const minhasCaidas=J.torres.filter(x=>x.t===t&&x.vida<=0).length;
  const delasCaidas=J.torres.filter(x=>x.t!==t&&x.vida<=0).length;
  const machucado=vivos(t).filter(h=>h.vida<=h.vidaMax*.5).length;
  if(minhasCaidas>delasCaidas) return "ariete";   // atrás: precisa virar território
  if(machucado>=2) return "egide";
  return "ondas";
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
    if(!noTab(c,r))continue;             // o dedo não pode mirar casa que não existe
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
  if(modo==="lampejo") return lampejaAte(c,r);
  if(modo==="recuo")   return recuaAte(c,r);
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
/* Alvo de toque. Herói e estrutura podem dividir o MESMO hexágono — um inimigo
   parado em cima da própria torre é jogada normal — e aí duas miras se sobrepõem
   no mesmo ponto. O relato da v15 foi não conseguir mirar a Ultimate no herói
   que estava sobre a torre.

   A regra passa a ser explícita em vez de depender da ordem de desenho: quem
   ocupa o hexágono (herói, morador do poço) tem o alvo GRANDE; a estrutura, que
   é o cenário do hexágono, tem o alvo menor. Assim o toque no meio da casa é
   sempre da criatura, e a estrutura continua alcançável pela borda — e pelo
   painel de comando, que nunca dependeu do mapa. */
/* A etiqueta de estado da peça, em ordem de consequência. Só uma aparece: numa
   peça de 19px de raio, três etiquetas não são três informações — são zero.
   Primeiro o que IMPEDE a jogada (preso, intocável), depois o que a modifica
   (marcado, carregado), e por último o que é só posição (revelado, escondido). */
function estadoDaPeca(h){
  if(h.preso)  return {k:"mal",  txt:"PRESO"};
  if(h.intoc)  return {k:"bom",  txt:"INTOCÁVEL"};
  /* ESCUDO entra logo depois de INTOCÁVEL porque responde à mesma pergunta que
     ele — "por que o meu golpe não fez nada?". Faltava, e o relato foi exato:
     "dei 2 ataques contra o Vharn e não deu dano nem tirou escudo". A Muralha
     dele dá até 17 num herói de 25, o golpe some inteiro dentro do escudo e a
     peça não dizia nada. Vem antes de MARCADO por consequência: marca modifica
     o próximo golpe, escudo decide se vale dar o golpe. */
  if(h.esc>0)  return {k:"bom",  txt:"ESCUDO"};
  /* o efeito com prazo vem antes de MARCADO porque já está cobrando: ele muda a
     conta de "dá para aguentar mais uma rodada?", que é a decisão mais comum da
     mesa. Marca só vale se um segundo golpe acertar. */
  if(h.dots&&h.dots.length) return {k:"mal", txt:DOTS[h.dots[0].tipo].selo};
  if(h.marca)  return {k:"mal",  txt:"MARCADO"};
  if(h.recarga)return {k:"bom",  txt:"CARREGADO"};
  if(h.semCura)return {k:"mal",  txt:"SEM CURA"};
  /* os dois de posição só interessam ao dono da peça: para o adversário,
     "escondido" é justamente o que ele não deveria saber */
  if(h.t===ladoDaTela()){
    if(escondido(h))          return {k:"bom", txt:"ESCONDIDO"};
    if(reveladoPorAtaque(h))  return {k:"mal", txt:"REVELADO"};
  }
  return null;
}

const R_TOQUE=15.5;
const R_TOQUE_ESTRUTURA=9;
const alvoDeToque=(g,x,y,aoTocar,raio)=>{
  const c=el("circle",{cx:x,cy:y,r:raio||R_TOQUE,class:"toque"});
  if(aoTocar) c.onclick=aoTocar;
  g.appendChild(c);
  return c;
};
function desenhaMapa(){
  svg.textContent="";
  const gH=el("g"),gE=el("g"),gM=el("g"),gP=el("g");
  const moverS=new Set(mover.map(p=>k(...p)));

  /* O QUE A WARD ACENDE, desenhado nas próprias casas.
     A primeira tentativa foi um anel em volta do olho, e ela quebrou a tela: o
     `viewBox` é recalculado por `getBBox()`, então um círculo de raio 3 (≈100px
     num tabuleiro de 300) inflava a caixa e ENCOLHIA o mapa inteiro. Marcar
     hexágono é mais barato, é exato (distância de hexágono não é círculo) e não
     sai do tabuleiro — a borda tracejada mostra exatamente o que a ward compra. */
  const wardS=new Set();
  (J.times[ladoDaTela()].wards||[]).forEach(w=>{
    const tab=RAIO_ATE.get(k(...w.pos));
    if(tab) tab[VISAO_WARD].forEach(x=>{ if(!MATO.has(x)||ehMato(...w.pos)) wardS.add(x); });
  });

  /* AS ZONAS, pintadas no chão pelo mesmo princípio da ward: hexágono marcado, e
     nunca um círculo. O anel de raio 3 da ward já quebrou o mapa uma vez inflando
     o `getBBox()`, e uma zona é a mesma armadilha com outro nome.
     A sua zona e a do adversário se distinguem pela classe — território negado
     por você e território que nega você não podem ter a mesma cor.
     Quem não enxerga a casa também não vê a zona: ela obedece à névoa igual a
     todo o resto, senão viraria um radar de graça. */
  const zonaMinha=new Set(), zonaDele=new Set();
  const meuLadoZ=ladoDaTela();
  (J.zonas||[]).forEach(z=>{
    const tab=RAIO_ATE.get(k(...z.pos));
    const casas=tab?tab[Math.min(z.raio,tab.length-1)]:[k(...z.pos)];
    casas.forEach(x=>{
      if(z.t!==meuLadoZ){
        const [zc,zr]=x.split(",").map(Number);
        if(!enxergaCasa(meuLadoZ,zc,zr))return;
      }
      (z.t===meuLadoZ?zonaMinha:zonaDele).add(x);
    });
  });

  for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
    if(!noTab(c,r))continue;            // casa sem par no espelho não existe no tabuleiro
    let cls="hx ";
    /* a classificação de terreno é a de `MATO` — uma cópia local aqui e a regra
       da tela sairia da regra da visão no primeiro ajuste de mapa */
    if(BASE_S.has(k(c,r)))cls+="base"+BASE_S.get(k(c,r));
    else if(k(c,r)===POCO_K)cls+="poco";
    else if(ehMato(c,r))cls+="selva";
    else if(LANE.has(k(c,r)))cls+="rota";
    else cls+="rio";
    /* mato sem visão fica visivelmente mais escuro: é a única forma de o jogador
       saber que aquele pedaço do mapa pode ter alguém dentro. Sem isso a névoa
       seria invisível — e névoa que não se vê é só herói sumindo sem explicação. */
    /* o poço fica de fora: é objetivo compartilhado, e a vida do morador tem de
       ser legível para os dois lados o tempo todo. */
    if(k(c,r)!==POCO_K&&!enxergaCasa(ladoDaTela(),c,r)) cls+=" cego";
    if(wardS.has(k(c,r)))cls+=" wardado";
    if(zonaDele.has(k(c,r)))cls+=" zona-ini";
    else if(zonaMinha.has(k(c,r)))cls+=" zona-min";
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

  /* acampamentos: 2 de cada lado + 1 neutro disputável. Farmar é feito ao
     pisar na casa; isso transforma o caminho do Caçador em uma escolha de macro. */
  J.camps.forEach(cp=>{
    const [x,y]=centro(...cp.pos);
    if(cp.ativo){
      const g=el("g",{class:"camp"+(cp.t===-1?" neutro":"")});
      g.appendChild(el("circle",{cx:x,cy:y,r:7.2,class:"camp-bg"}));
      g.appendChild(el("circle",{cx:x,cy:y,r:4.4,class:"camp-core"}));
      const tx=el("text",{x:x,y:y+11,class:"camp-txt"}); tx.textContent=cp.t===-1?"NEUTRO":(cp.t===0?"AZUL":"CARMIM"); g.appendChild(tx);
      gM.appendChild(g);
    } else if(cp.respawn>0){
      const tx=el("text",{x:x,y:y+3,class:"camp-cd"}); tx.textContent="R"+cp.respawn; gM.appendChild(tx);
    }
  });

  const torreS=new Set(alvosTorre);
  J.torres.forEach(t=>{
    const[x,y]=centro(...ROTAS[t.rota][t.i]);
    const mirando=torreS.has(t);
    if(mirando) gM.appendChild(el("circle",{cx:x,cy:y,r:12.6,class:"mira-torre"}));
    const rc=el("rect",{x:x-6,y:y-6,width:12,height:12,transform:`rotate(45 ${x} ${y})`,
      class:"torre t"+t.t+(t.vida<=0?" caiu":"")+(mirando?" alvo":"")});
    if(mirando) rc.onclick=()=>{vibra(10);atacaTorre(t);};
    gM.appendChild(rc);
    if(mirando) alvoDeToque(gM,x,y,()=>{vibra(10);atacaTorre(t);},R_TOQUE_ESTRUTURA);
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
    if(mirando){ g.onclick=()=>{vibra(10);tocaAlvo(...POCO);}; alvoDeToque(g,x,y); }
    gM.appendChild(g);
  })();
  [0,1].forEach(t=>{
    const[x,y]=centro(...BASE[t][0]);
    const mirando=alvoNexus===t;
    if(mirando) gM.appendChild(el("circle",{cx:x,cy:y,r:14,class:"mira-torre"}));
    const nx=el("circle",{cx:x,cy:y,r:10.5,class:"nexus t"+t+(mirando?" alvo":"")});
    if(mirando) nx.onclick=()=>{vibra(12);tocaAlvo(...BASE[t][0]);};
    gM.appendChild(nx);
    if(mirando) alvoDeToque(gM,x,y,()=>{vibra(12);tocaAlvo(...BASE[t][0]);},R_TOQUE_ESTRUTURA);
    const v=el("text",{x:x,y:y+2.4,class:"tvida"});v.textContent=Math.max(0,J.nexus[t]);gM.appendChild(v);
  });
  const rot=(txt,x,y)=>{const g=el("g",{class:"rotulo"}),w=txt.length*5.4+13;
    g.appendChild(el("rect",{x:x-w/2,y:y-6.5,width:w,height:13,rx:2}));
    const t=el("text",{x:x,y:y+2.2});t.textContent=txt;g.appendChild(t);gM.appendChild(g);};
  rot("TOPO",centro(...L_TOPO[6])[0],11);
  rot("BAIXO",centro(...L_BOT[2])[0],275);
  rot("MEIO",...centro(3,2));

  /* WARDS do lado que olha. Antes era só um pontinho com o prazo embaixo, e a
     queixa foi direta: *"quando usar um ward, sinalizar no mapa onde ele tá"*.
     O problema não era a peça estar ausente — era ela não dizer NADA sobre o que
     comprou. Agora cada ward desenha o próprio ALCANCE: o anel tracejado é
     exatamente o que ela acende, então dá para escolher onde plantar olhando o
     mapa em vez de contar hexágono na cabeça.
     `w-larg` é a largura de um hexágono; três delas é o raio 3 da ward. */
  (J.times[ladoDaTela()].wards||[]).forEach(w=>{
    const [x,y]=centro(...w.pos);
    /* recém-plantada: nasce pulsando, para o olho achar onde ela caiu */
    const g=el("g",{class:"ward"+(w.rodadas===WARD_RODADAS?" nova":"")});
    g.appendChild(el("circle",{cx:x,cy:y,r:6.4,class:"w-bg"}));
    g.appendChild(el("circle",{cx:x,cy:y,r:2.4,class:"w-olho"}));
    const t=el("text",{x:x,y:y+11.4,class:"w-cd"}); t.textContent=w.rodadas+"R"; g.appendChild(t);
    gM.appendChild(g);
  });

  const alvoS=new Set(alvos.map(o=>o.id+o.t));
  /* Quem o jogador da vez não enxerga simplesmente não aparece. É aqui que a
     névoa vira jogo: o mato deixa de ser cenário e vira lugar onde cabe alguém. */
  todos().filter(h=>!h.morto&&visivelPara(h,ladoDaTela())).forEach(h=>{
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

    /* ESTADO ESCRITO NA PEÇA. Antes ele só existia na gaveta do Time, e a queixa
       foi essa: *"quando o herói tiver preso tem que estar escrito nele"*. Um
       herói que não anda precisa dizer por quê no lugar onde o jogador está
       olhando — o mapa —, não numa tela que é preciso abrir.
       Uma etiqueta só, a de maior consequência, para não virar sopa de ícone: o
       que impede a jogada vem antes do que a modifica. */
    const et=estadoDaPeca(h);
    if(et){
      const larg=et.txt.length*2.55+5;
      const eg=el("g",{class:"est "+et.k});
      eg.appendChild(el("rect",{x:x-larg/2,y:y+14,width:larg,height:5.8,rx:2.4}));
      const t2=el("text",{x:x,y:y+18.3}); t2.textContent=et.txt; eg.appendChild(t2);
      g.appendChild(eg);
      g.setAttribute("aria-label",`${h.n}, ${h.vida} de vida, ${et.txt.toLowerCase()}`);
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
    escondido(h)?'<span class="selo-est">escondido</span>':"",
    reveladoPorAtaque(h)&&!h.morto?'<span class="selo-est mal">revelado</span>':"",
    h.esc>0?`<span class="selo-est">escudo ${h.esc}</span>`:"",
    ...(h.dots||[]).map(d=>`<span class="selo-est mal">${DOTS[d.tipo].n} ${d.dano}/rodada `
       +`· ${d.rodadas} rodada${d.rodadas>1?"s":""}</span>`),
    h.recarga?`<span class="selo-est">carregado +${h.recarga}</span>`:"",
    h.marca?`<span class="selo-est mal">marcado +${h.marca}</span>`:"",
    h.semCura?'<span class="selo-est mal">sem cura</span>':"",
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
/* ---------- GASTO DE OURO TARDIO (gold sink) ----------
   O problema medido: com os três slots cheios, o ouro do herói para de comprar
   qualquer coisa. Numa partida de ~22 rodadas isso acontece bem antes do fim, e
   a renda de 1–3 por rodada vira número decorativo — recurso morto, e com ele
   morre a decisão "farmo ou pressiono?" justamente na fase em que ela deveria
   pesar mais.

   Aqui está só o ENCANAMENTO, de propósito. A regra final é decisão do grupo
   (consumível? cura? ward? re-rolagem? melhoria de item?), e o relatório foi
   explícito em não inventar um sistema grande sozinho. Com a lista vazia nada
   muda no jogo e a prateleira nem aparece.

   Para ativar um gasto, basta uma entrada aqui — a loja, o preço, o botão e o
   registro no log já funcionam. Candidatos discutidos estão em
   docs/DECISOES-PENDENTES.md, item 5. Exemplo da forma:

     {id:"cura", n:"Bandagem", o:3, d:"Cura 4 agora.",
      pode:h=>h.vida<h.vidaMax, faz:h=>{h.vida=Math.min(h.vidaMax,h.vida+4);}}

   `pode` decide se o botão fica ativo; `faz` aplica o efeito. Nada mais. */
const GASTOS=[
  /* REFORÇO — o depósito de ouro tardio. Preço sobe a cada compra do MESMO herói,
     então ele nunca vira renda infinita: cada ponto de Poder custa mais que o
     anterior, e a certa altura vale mais gastar em outra coisa.

     CURVA 6+2 → 10+4 na v25, e o relato foi direto: "tá mto barato". Medido em
     600 partidas com sim/ouro.js: um herói termina a partida com 61 de ouro e o
     build de 3 itens mais caro que ele consegue vestir custa 25. Sobravam 36 —
     e 36 pagava QUATRO Reforços na curva antiga (6+8+10+12), ou +4 de Poder
     permanente. Nenhum item da loja dá mais de +2, e todos ocupam um dos três
     slots. O Reforço não ocupa nada e não tem teto: era o Poder mais barato do
     jogo justamente por ser o único ilimitado.

     Com 10+4 a mesma sobra compra DOIS (10+14=24), e o terceiro exige guardar
     em vez de gastar. O que se comprou não foi equilíbrio de número, foi
     escolha: com quatro compras o ouro tardio era uma lista; com duas, é uma
     decisão entre Poder, carta, território e visão. */
  {id:"reforco", n:"Reforço", d:"+1 de Poder permanente neste herói.",
   o:h=>10+4*(h.reforcos||0),
   pode:h=>h.morto||naBase(h),
   faz:h=>{ h.reforcos=(h.reforcos||0)+1; h.extraPoder+=1; }},

  /* REQUISIÇÃO — ouro vira OPÇÃO, não estatística. Reaproveita o Deck de Comando
     inteiro em vez de inventar um sistema novo, e a mão máxima de 3 já é o freio. */
  {id:"requisicao", n:"Requisição", d:"Compre 1 carta do baralho.",
   o:()=>5,
   pode:h=>(h.morto||naBase(h))&&maos[h.t].length<3&&(baralho.length||cemiterio.length),
   faz:(h,t)=>{ compra(t); }},

  /* LEVA DE FERRO — o gasto que encarece com o RELÓGIO, não com o uso.
     Os outros dois sobem de preço conforme VOCÊ compra; este sobe conforme a
     PARTIDA anda, e é de propósito: ele compra território, que é a coisa cujo
     valor mais muda com o tempo. Cedo, empurrar uma rota é barato e vale pouco
     (a torre está cheia, a onda longe). Tarde, é caro e pode fechar a partida.
     O preço acompanhar a rodada é o que impede que o ouro parado do fim vire
     uma alavanca melhor do que o ouro gasto no começo. */
  {id:"leva", n:"Leva de Ferro", d:"A sua onda de uma rota avança 1 casa agora.",
   o:()=>PRECO_LEVA(),
   pode:h=>h.morto||naBase(h),
   faz:(h,t)=>{ abreEscolhaRota(t); }},

  /* SENTINELA — o gasto tardio que compra INFORMAÇÃO.
     Escolhido entre os cinco candidatos discutidos (ward, consumível, carta,
     creep, re-rolagem) por dois motivos. Primeiro, é o único que ficou melhor
     com a regra do mato da v22: agora que o mato só se vê de dentro, saber onde
     o adversário está passou a ser um problema de verdade, e a ward é a resposta
     que o gênero já tem. Segundo, não abre submenu nenhum — a compra vira carga,
     e a carga vira ward na casa onde o herói estiver, num botão só.

     E ficou UM. A prateleira já tinha três; um quarto é o teto pedido, e um
     quinto seria a lista de cinco opções que o próprio pedido dizia para não
     fazer. O consumível de cura, o candidato mais próximo, fica de fora por
     redundância: quem compra está na base ou morto, e os dois estados já curam. */
  {id:"sentinela", n:"Sentinela", d:"Leva 1 ward na mochila. Plante onde quiser, de graça.",
   o:h=>4+2*(h.sentinelasCompradas||0),
   pode:h=>(h.morto||naBase(h))&&(h.sentinelas||0)<SENTINELAS_MAX,
   faz:h=>{ h.sentinelas=(h.sentinelas||0)+1;
            h.sentinelasCompradas=(h.sentinelasCompradas||0)+1; }}
];
/* Duas na mochila. O teto existe para a Sentinela não virar cofre: sem ele o
   ouro tardio compraria dez wards e o mapa inteiro acenderia de uma vez, que é
   exatamente o problema que a regra do mato acabou de resolver. */
const SENTINELAS_MAX=2;

/* Planta uma carga onde o herói está. Não gasta dado nem ação: o custo já foi
   pago em ouro, e cobrar de novo em tempo faria dela uma compra que ninguém usa. */
function plantaSentinela(h){
  if(!h||h.morto||!(h.sentinelas>0))return false;
  h.sentinelas--;
  poeWard(h.t,h.pos);
  toast("sentinela plantada",""); vibra(12);
  return true;
}
/* 4 na rodada 1, subindo 1 a cada três rodadas, teto 12 — a curva foi escolhida
   para cruzar a renda de um herói (3 por rodada parado) por volta da rodada 12,
   que é quando o Barão desce e o mapa passa a valer mais que o cofre. */
const PRECO_LEVA=()=>Math.min(12, 4+Math.floor((J.rodada-1)/3));

const precoGasto=(g,h)=> typeof g.o==="function" ? g.o(h) : g.o;
function gastosDisponiveis(h){ return GASTOS.filter(g=>!g.pode||g.pode(h)); }
function usaGasto(id,h,t){
  const g=GASTOS.find(x=>x.id===id); if(!g)return false;
  const preco=precoGasto(g,h);
  if(h.ouro<preco||(g.pode&&!g.pode(h)))return false;
  h.ouro-=preco; g.faz(h,t);
  reg(t?"c":"a",`${h.n} gasta ${preco} de ouro em ${g.n}`);
  toast(g.n,""); vibra(12);
  return true;
}

/* Escolha da rota para a Leva de Ferro. Fica fora de `usaGasto` porque é a única
   compra que precisa de um segundo toque — e o ouro já saiu quando esta tela
   abre, então não há caminho de desistir sem cobrar. */
function empurraOnda(t,nome){
  J.frentes[nome]=limitaFrente(nome, J.frentes[nome]+(t===0?1:-1));
  reg(t?"c":"a",`LEVA DE FERRO — a onda do ${nome} avança`);
}
function abreEscolhaRota(t){
  /* a IA escolhe sozinha: empurra onde a própria onda está mais atrasada.
     Sem isto ela abriria uma tela de escolha e ficaria parada nela. */
  if(simMode||(aiMode&&t===1)){
    const nome=Object.keys(ROTAS).sort((a,b)=>
      (t===0?J.frentes[a]-J.frentes[b]:J.frentes[b]-J.frentes[a]))[0];
    return empurraOnda(t,nome);
  }
  const nomes=Object.keys(ROTAS);
  const bts=nomes.map(nome=>{
    const f=J.frentes[nome], l=ROTAS[nome];
    const perto = f<=1 ? "encostada na base inimiga" : f>=l.length-2 ? "encostada na sua base" : "no vão";
    return `<button class="grande rotaLeva" data-r="${nome}" style="font-size:15px;padding:12px">
      ${nome.toUpperCase()}<br><span style="font-size:12.5px;opacity:.8">onda ${perto}</span></button>`;
  }).join("");
  abre(`<span class="et">Leva de Ferro</span><h2 class="t${t}">Qual rota?</h2>
    <p>A sua onda avança <b>1 casa</b> nesta rota.</p>${bts}`);
  G("telacx").querySelectorAll(".rotaLeva").forEach(b=>b.onclick=()=>{
    fecha();
    empurraOnda(t,b.dataset.r);
    toast("onda avança","gank"); vibra(14);
    calcula(); pinta();
  });
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
    const tem=quem.itens.includes(it.id), cheio=inventarioCheio(quem), pode=quem.ouro>=preco&&!tem&&!cheio;
    return `<button class="itC${pode?"":" off"}${tem?" tem":""}" data-i="${it.id}" ${pode?"":"disabled"}>
      <img src="${RETRATO_ITEM(it.id)}" alt=""><span class="iN">${it.n}</span>
      <span class="iD">${it.d}</span>
      <span class="iO">${tem?"comprado":cheio?capacidade(quem)+" slots cheios":preco+" ◈"+(descontos[t]?" (-"+descontos[t]+")":"")}</span></button>`;
  }).join("");
  /* a prateleira de gasto tardio só existe se houver regra aprovada para ela */
  const gastos=gastosDisponiveis(quem);
  const prat2 = !gastos.length ? "" :
    `<div class="secao-loja">Gastar ouro</div><div class="prat">${gastos.map(g=>{
      const preco=precoGasto(g,quem), pode=quem.ouro>=preco;
      const jaFez = g.id==="reforco"&&quem.reforcos ? ` · ${quem.reforcos}º` : "";
      return `<button class="itC${pode?"":" off"}" data-g="${g.id}" ${pode?"":"disabled"}>
        <span class="iN">${g.n}${jaFez}</span><span class="iD">${g.d}</span>
        <span class="iO">${preco} ◈</span></button>`;}).join("")}</div>`;

  abreSheet("Loja",`<div class="abas">${abas}</div><div class="prat">${cards}</div>${prat2}`);
  G("shCorpo").querySelectorAll(".abaH").forEach(b=>b.onclick=()=>{
    lojaHeroi=tm.herois.find(h=>h.id===b.dataset.h); abreLoja(); });
  G("shCorpo").querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{
    if(usaGasto(b.dataset.g,quem,t)){ abreLoja(); pinta(); } });
  /* `[data-i]`, e NÃO `.itC`: as duas prateleiras usam a mesma classe de estilo,
     então `.itC` pegava também os botões de gasto e — por ser ligado depois —
     sobrescrevia o clique deles. Reforço, Requisição, Leva e Sentinela caíam no
     corpo de compra de item, `ITEM[undefined]` dava undefined e `it.o` estourava
     TypeError: quatro botões mortos, sem nada no console para o jogador.
     A classe continua sendo de aparência; quem manda no clique é o dado. */
  G("shCorpo").querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{
    const it=ITEM[b.dataset.i];
    const preco=Math.max(0,it.o-descontos[t]);
    if(quem.ouro<preco||quem.itens.includes(it.id)||inventarioCheio(quem))return;
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
    <section class="destaque"><h4>Feitiços de invocador</h4>
      <p>O time tem <b>uma carga</b>, não um feitiço por herói. Ela não gasta dado nem movimento, serve a <b>qualquer</b> um dos cinco, e volta <b>3 rodadas</b> depois de usada.</p>
      <table><tr><td><b>Lampejo</b></td><td>salta até 2 casas e escapa de <i>preso</i></td></tr>
      <tr><td><b>Retorno</b></td><td>volta à base e recupera 3</td></tr></table>
      <p style="margin-top:7px">Como a carga é uma só, a pergunta nunca é <i>posso?</i> — é <b>quem merece</b>. E vale contar a do adversário: feitiço gasto é informação.</p>
      <p>O Retorno é <b>interrompido por inimigo colado</b>. Quem foi pego não escapa de graça.</p></section>
    <section class="destaque"><h4>3 · Quem não age, enriquece</h4>
      <p>Herói que recebe dado ganha <b>1 de ouro</b>. Quem fica de fora <b>farma 3</b>. Como só três dos cinco recebem ação, dois sempre estão enriquecendo. <b>Agir custa dinheiro.</b></p></section>
    <section class="destaque"><h4>Escudo dura um turno adversário</h4><p>Escudo, buff e <b>intocável</b> valem <b>até o início do seu próximo turno</b> — ou seja, exatamente uma vez de o adversário poder bater neles. Antes o escudo não expirava nunca e empilhava até o herói virar intocável de fato; e "até o fim da rodada" dava menos janela a quem jogava em segundo. Agora os dois lados têm a mesma.</p></section><section><h4>Combate</h4>
      <p>Sem rolagem extra — o dado já foi rolado.</p>
      <table><tr><td>Dano</td><td>Força + Poder − Armadura</td></tr>
      <tr><td>Dado 6 natural</td><td>Crítico</td></tr>
      <tr><td>Morte</td><td>volta em 2 rodadas</td></tr>
      <tr><td>Quem matou</td><td>+4 de ouro</td></tr></table></section>
    <section><h4>As cinco posições</h4>
      <p><b>Topo</b> — sozinho lá em cima. Dominar a rota dá <b>Placas</b>: 1 ajusta um dado em ±1, 2 re-rolam. É a sua única fonte de controle sobre a sorte.</p>
      <p><b>Farm</b> — o Caçador. Ele vive no <b>mato</b>, e é lá que ele desaparece: enquanto o adversário não tiver ninguém (nem ward) dentro do mato, ele não está na tela do outro. Sair do mato para a rota é aparecer.</p>
      <p><b>Meio</b> — a rota mais curta. Dominar dá <b>Prioridade</b>: gaste para rolar <b>um dado de ação a mais</b>, quando quiser.</p>
      <p><b>Atirador</b> — frágil e caro, mas escala: a cada 10 de ouro ganha +2 de Poder. Perto do Suporte, ganha escudo e dano.</p>
      <p><b>Suporte</b> — escuda, doa o próprio dado, e planta a <b>Ward</b>: o olho que enxerga um pedaço de mapa onde o time não tem ninguém.</p></section>
    <section class="destaque"><h4>Visão · o mato esconde</h4>
      <p>Você só enxerga o que as <b>suas peças</b> enxergam: heróis, torres vivas, a sua onda, a base e as wards. O resto do tabuleiro fica <b>escuro</b> — e herói que está no escuro <b>não aparece</b>.</p>
      <p>E o <b>mato bloqueia</b>: dentro do mato só se enxerga <b>de dentro do mato</b>. Estar colado nele pela rota não adianta, e ward plantada na rota também não vê lá dentro. Quem quer saber o que tem no mato entra ou <b>planta a ward dentro</b>.</p>
      <p>Duas saídas para quem está no escuro: atacar de lá vale <b>+2 de Força</b> (emboscada) — mas <b>quem ataca fica visível</b> até sair da casa de onde bateu. Bater entrega a posição.</p>
      <p>Ouro sobrando com os três itens comprados? A <b>Sentinela</b>, na loja, é uma ward na mochila: compre na base, plante onde quiser, sem gastar dado.</p></section>
    <section class="destaque"><h4>Sangramento, veneno e zonas</h4>
      <p>Algumas habilidades de <b>controle</b> (dado 3+) e algumas Ultimates deixam um <b>efeito com prazo</b>. Ele cobra <b>no início do turno de quem está marcado</b>, uma vez por rodada, e <b>ignora armadura e escudo</b> — é o golpe que já chegou, cobrando depois. É a resposta que faltava contra tanque com escudo grande.</p>
      <p>Reaplicar <b>renova o prazo</b>, não empilha um segundo. Morrer limpa tudo.</p>
      <p>A <b>zona</b> é o mesmo efeito posto no <b>chão</b>: quem <b>começa o turno dentro</b> dela fica envenenado. Ela dura os <b>2 próximos turnos do adversário</b> — contado em turnos, e não em rodadas, para a zona de quem joga primeiro não vigiar mais tempo que a de quem joga em segundo. No mapa, a sua aparece em <b>verde tracejado</b> e a do adversário em <b>vermelho pulsante</b>.</p></section>
    <section class="destaque"><h4>A base trata — mas não com o inimigo em cima</h4>
      <p>Herói ferido na <b>própria base</b> recupera <b>3 de vida por rodada</b>. Voltar custa movimento, que é o recurso mais disputado da mesa — é esse o preço.</p>
      <p><b>Com inimigo a 2 casas ou menos, ele se trata UMA vez e para.</b> A cura só volta quando o cerco sair de perto. Mergulhar na base do adversário continua sendo decisão, e não suicídio garantido.</p></section>
    <section><h4>Defender junto da torre</h4>
      <p>Herói colado numa torre <b>viva do próprio time</b> ganha <b>+1 de Armadura</b>. Lutar em casa é diferente de lutar no vão da rota — e o bônus cai junto com a torre.</p></section>
    <section class="destaque"><h4>Regra de mesa · presença na rota</h4>
      <p>Um herói só conta para empurrar uma rota depois de <b>passar da própria Torre Exterior</b>. Antes dela, está em desenvolvimento e não gera Top/Meio/Bot. Mais heróis ativos que o rival: a onda anda 1. Empate: não anda.</p></section>
    <section><h4>Torres, ondas e Nexus</h4>
      <p>Cada rota tem uma <b>Frente de Onda</b> (o círculo tracejado). Ela desliza para o lado de quem tem mais heróis vivos naquela rota, e bate na torre onde encosta.</p>
      <p>Torre tem <b>3 de vida</b>. A onda tira 1 por rodada, e o golpe de herói tira <b>1</b> — qualquer habilidade ofensiva, inclusive a Ultimate. Torre não é poço: quem quer derrubar mais rápido junta heróis, não gasta a Ultimate.</p>
      <p><b>Você também derruba torre.</b> Se a sua onda já está encostada nela, ela vira alvo de habilidade: mira vermelha, um toque, <b>1 de dano</b>. Mas a torre <b>revida 2</b> a cada golpe — e é esse pedágio, não uma trava de rodada, que decide quantas vezes vale bater. Empurrar a rota com o time é o dobro da velocidade de esperar a onda.</p>
      <p>Torres caídas abrem a rota. Rota aberta, a onda bate no <b>Nexus</b>. Zerou, acabou.</p></section>
    <section><h4>O Poço — Dragão e Barão</h4>
      <p>Há <b>um poço</b> no meio do mapa, em terreno de ninguém, e ele <b>muda de morador</b>. Vazio, mostra a rodada em que o próximo desce — esse é o relógio da partida.</p>
      <p>Na <b>rodada 5</b> desce o <b>Dragão</b>: <b>3 de vida</b>, revida 2. Cai em <b>dois dados</b> — uma Ultimate e uma básica — se dois heróis comprarem a briga no mesmo turno. Levar dá a <b>Herança do Dragão</b>: <b>+1 de Poder em todo o time, para sempre</b>, e <b>acumula</b> a cada Dragão. Ele volta 3 rodadas depois de cair.</p>
      <p>Na <b>rodada 12</b> o <b>Barão</b> toma o poço — <b>mesmo com o Dragão vivo</b>. Ele é diferente do Dragão: tem <b>16 de vida e 3 de Armadura</b> e <b>apanha pela regra dos heróis</b> — <b>Força + Poder − Armadura</b>, com respingo valendo metade. No Barão o <b>dado importa muito</b>: com 3 de Armadura, uma básica de dado 2 tira <b>2</b> e uma Ultimate de dado 6 tira <b>8</b>. É por isso que ele <b>pede um grupo</b> — não por ter barra comprida, mas porque cutucar com dado ruim quase não anda. Conte com <b>4 dos 5 heróis</b> para fechar num turno. E as três Ultimates de <b>dano garantido</b> (Julgamento, Ato Final, Sentença) <b>ignoram a armadura dele</b>, como ignoram a de qualquer tanque. Ele revida 4: encostar custa o dobro. Quem leva <b>escolhe uma de três dádivas</b> por <b>2 rodadas</b>: <b>Ondas de Ferro</b> (as três ondas avançam sozinhas), <b>Égide</b> (4 de escudo no time por turno) ou <b>Aríete</b> (seu golpe em estrutura causa 2). Nenhuma dá Poder — o Barão é pressão de mapa, não força bruta. É o botão de ponto-sem-volta.</p>
      <p><b>No Dragão</b> a conta é de <b>golpes</b>, e não de dano: básica ofensiva tira <b>1</b> e Ultimate tira <b>2</b>, com qualquer dado. Ele desce na rodada 5, quando ninguém tem item e a conta de dano ainda é rasa — contar golpes é o que o mantém legível ali. O poço é <b>sem dono</b>: Quem dá o <b>último golpe</b> leva o prêmio inteiro. É por isso que ninguém deixa o poço sozinho.</p></section>
    <section class="destaque"><h4>Rotação do Caçador</h4>
      <p>No <b>início de cada rodada</b> os dois jogadores escolhem, <b>escondido um do outro</b>, para onde o próprio Caçador vai. No <b>seu turno</b> ele anda até <b>3 casas de graça</b> naquela direção — sem gastar o Dado Mestre.</p>
      <p><b>Ele não teleporta:</b> anda casa a casa, continua no mapa e continua podendo ser interceptado. Se o caminho fechar, contorna; se não alcançar, <b>não ganha bônus nenhum</b>. É esse o preço da aposta errada.</p>
      <table><tr><td>⛰ <b>Acampamento próprio</b></td><td>+3 de ouro</td></tr>
      <tr><td>◈ <b>Acampamento neutro</b></td><td>+1 de Poder até o seu próximo turno</td></tr>
      <tr><td>⚔ <b>Acampamento inimigo</b></td><td>+4 de ouro roubado</td></tr>
      <tr><td>☠ <b>O poço</b></td><td>seus golpes no poço valem +1 nesta rodada</td></tr></table>
      <p style="margin-top:7px">Você escolhe <b>antes</b> de ver o que o adversário fez com o Caçador dele. É aí que mora o jogo.</p></section>
    <section><h4>O Caçador e o mato</h4>
<p><b>Rota, rio e base todo mundo vê.</b> O <b>mato</b> é diferente: você só enxerga o mato onde tiver <b>alguém seu dentro</b>. O mapa tem dois — o <b>mato de cima</b> e o <b>mato de baixo</b> — e eles se enxergam separadamente. As casas escuras no tabuleiro são o mato onde você está cego.</p>
      <p>Ou seja: o Caçador inimigo entrou no mato e <b>sumiu da sua tela</b>. Ele continua lá, andando, farmando e empurrando rota — você é que parou de ver. Quando ele pisa numa rota, aparece de novo.</p>
      <p>Quem ataca <b>saindo do mato sem ter sido visto</b> ganha <b>+2 de Força</b> no golpe. É a <b>Emboscada</b>, e é o motivo de valer a pena a espera.</p>
      <p>A resposta é <b>presença</b>: mande alguém para o mato e ele acende. Uma <b>Ward</b> acende os dois de uma vez. A pergunta que o jogo faz o tempo todo é essa — vale uma peça vigiando o mato, ou ela faz mais pressionando a rota?</p></section>
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
  /* Durante a sondagem a IA abre e fecha a ficha de cada habilidade de cada herói
     dezenas de vezes por turno, e isso piscava na tela como se ela estivesse
     folheando as cartas na sua frente. Não é jogada, é raciocínio — e raciocínio
     não se mostra. O que se mostra é para onde ela andou e o que ela fez. */
  if(sondando)return;
  const tm=J.times[J.vez];
  G("rod").textContent="R"+J.rodada;
  G("faixa").className="faixa t"+J.vez;
  G("quem").textContent=NOMES[J.vez];

  const ouro=tm.herois.reduce((a,h)=>a+h.ouro,0);
  /* O aviso do HUD é sobre INFORMAÇÃO: quanto do mapa eu enxergo, e quantos dos
     meus estão fora da vista do inimigo. */
  const meuLado=ladoDaTela();
  const vistas=visaoDe(meuLado).size, totalCasas=NO_TAB.size;
  const meusEscondidos=J.times[meuLado].herois.filter(h=>escondido(h)).length;
  const nWards=(J.times[meuLado].wards||[]).length;
  const cacaTxt = meusEscondidos ? `${meusEscondidos} escondido${meusEscondidos>1?"s":""}`
      : `visão ${Math.round(vistas/totalCasas*100)}%${nWards?` · ${nWards} ward`:""}`;
  G("pills").innerHTML=
    `<span>◈ <b>${ouro}</b></span>`+
    `<span class="${tm.placas?"on":""}">⬢ <b>${tm.placas}</b></span>`+
    (tm.prio?`<span class="on">⚡ <b>${tm.prio}</b></span>`:"")+
    (tm.dragoes?`<span class="on">herança <b>${tm.dragoes}</b></span>`:"")+
    (tm.barao?`<span class="on">fúria <b>${tm.barao}</b></span>`:"")+
    (tm.retomada?`<span class="on">retomada${tm.retomada>1?" <b>2</b>":""}</span>`:"")+
    `<span class="${tm.feitico?"on":""}">✦ ${tm.feitico?"feitiço":"<b>"+tm.feiticoCd+"</b>"}</span>`+
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

  /* O placar de estruturas saiu do painel fixo e virou gaveta (botão ⌂ no
     cabeçalho). Motivo: com o tabuleiro maior o mapa é quem precisa do espaço
     vertical, e a vida das torres é consulta — olha-se de vez em quando, não o
     tempo todo. O que fica sempre à vista é só o aviso no botão, para ninguém
     perder a rota abrindo sem perceber. */
  (()=>{
    const bt=G("btEstr");
    if(!bt) return;
    bt.disabled = J.fase!=="jogando";
    /* aviso vermelho quando o SEU lado tem rota aberta — é o estado que muda a
       jogada agora. Dourado quando é o inimigo que abriu: oportunidade. */
    bt.classList.toggle("perigo", J.fase==="jogando"&&rotaAberta(J.vez));
    bt.classList.toggle("chance", J.fase==="jogando"&&!rotaAberta(J.vez)&&rotaAberta(1-J.vez));
  })();

  /* Um botão de feitiço lê igual a uma habilidade: nome, uma linha de regra, e o
   número da direita. Só que o número é a recarga, não a Força — por isso a classe
   `trava`, a mesma que a habilidade sem dado usa. Estado é o único idioma da UI. */
function feiticoBt(h,qual){
  const lampejo = qual==="lampejo";
  const cd = J.times[h.t].feitico ? 0 : J.times[h.t].feiticoCd;
  const colado = !lampejo && vizinhos(...h.pos).some(([vc,vr])=>{
    const o=em(vc,vr); return o&&o.t!==h.t; });
  const pode = !cd && J.fase==="jogando" && (lampejo || (!naBase(h)&&!colado));
  const linha = cd ? `feitiço do time gasto — volta em ${cd} ${cd>1?"rodadas":"rodada"}`
    : lampejo ? `salta até ${LAMPEJO_ALC} casas · gasta o feitiço do time`
    : colado ? "inimigo colado — interrompido"
    : naBase(h) ? "já está na própria base"
    : `volta à base e recupera ${RETORNO_CURA} · gasta o feitiço do time`;
  return `<button class="opc${modo==="lampejo"&&lampejo?" on":""}${pode?" pode":" naoPode"}"
      id="cmd${lampejo?"Lampejo":"Retorno"}" ${pode?"":"disabled"}>
    <span class="ico">${svgIco(lampejo?ICO.raio:ICO.casa)}</span>
    <span class="txt"><span class="t1">${lampejo?"Lampejo":"Retorno"}</span>
      <span class="t2">${linha}</span></span>
    <span class="mark${pode?"":" trava"}">${cd?cd:"◇"}</span>
  </button>`;
}

/* painel de comando — a peça central da correção de jogabilidade */
  const cmd=G("comando");
  /* e o painel de comando não abre no herói da IA: durante a vez dela o painel diz
     de quem é a vez e mais nada. */
  if(aiMode&&iaRodando){
    cmd.innerHTML=`<div class="vaziomsg">Vez de <b>${NOMES[J.vez]}</b><br>`
      +`acompanhe pelo tabuleiro e pelo canto</div>`;
  }else if(selHeroi&&!selHeroi.morto){
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
            podeMover?`até <b>${J.mov.rest+((ehAgil(h)&&!h.agilUsado)?1:0)}</b> casas · sai do bolso do time`:"sem movimento restante"}</span></span>
        <span class="mark">${J.mov.rest}</span>
      </button>
      ${feiticoBt(h,"lampejo")}
      ${feiticoBt(h,"retorno")}
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
    G("cmdLampejo").onclick=iniciaLampejo;
    G("cmdRetorno").onclick=usaRetorno;
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
  G("btPrio").disabled = !tm.prio || J.fase!=="jogando";
  G("btPrio").textContent = tm.prio ? `⚡ prioridade (${tm.prio})` : "⚡ prioridade";
  /* o botão da Sentinela só existe quando o herói selecionado tem carga: ele é a
     única saída dela, e um botão apagado a partida inteira só ocupa altura */
  const cargas = selHeroi&&selHeroi.t===J.vez ? (selHeroi.sentinelas||0) : 0;
  const bw=G("btWard");
  bw.hidden = !cargas;
  bw.disabled = !cargas || J.fase!=="jogando" || selHeroi.morto;
  bw.textContent = `◉ plantar ward${cargas>1?` (${cargas})`:""}`;
  /* linha inteira some quando nenhum dos botões serve — devolve altura ao mapa */
  G("extraBts").classList.toggle("ocioso",
    G("btPlaca").disabled && G("btRerol").disabled && G("btConv").disabled
    && G("btPrio").disabled && bw.hidden);
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
  rodaAnims();
}
function texto(){
  if(J.fim!==null)return `<b>${NOMES[J.fim]} venceu.</b>`;
  const livres=J.dados.filter(d=>!d.usado).length;
  if(!livres&&!J.mov.rest) return "Tudo gasto. <b>Encerre o turno.</b>";
  return `<b>${J.mov.rest}</b> de movimento · <b>${livres}</b> ${livres===1?"ação":"ações"}<br>`+
         `toque num herói seu para abrir o comando`;
}

/* ══════════════════ IA TÁTICA ══════════════════ */
/* A IA da v15 e da v16 era GULOSA: varria heróis e habilidades na ordem do
   catálogo e executava a PRIMEIRA jogada válida que encontrasse, com uma escada
   fixa de prioridade (Nexus > torre > épico > herói). Isso produz exatamente o
   que o playtest descreveu — "sem noção de urgência, sem avaliação, sem
   estratégia": ela batia num herói de passagem com a Ultimate enquanto o Barão
   morria ao lado, e gastava o golpe que mataria alguém num alvo cheio de vida.

   Aqui a escada vira NOTA. Toda jogada possível (herói × habilidade × alvo) é
   enumerada e pontuada, e a IA executa a de maior nota. Continua sendo
   heurística — não há busca, não há profundidade — mas passa a comparar antes de
   agir, que é a diferença entre reagir e decidir.

   As notas estão numa escala só, e a ordem de grandeza é a intenção:
     1000  ganhar a partida agora
      300  matar um herói / levar o épico
      100  derrubar uma torre
       10  dano comum
   Assim "matar" nunca perde para "bater mais forte em quem não morre", que era o
   erro mais visível da versão anterior. */

/* Dano que este golpe realmente tira, já contando armadura e escudo do alvo — a
   IA precisa saber se MATA, e `poderTotal - armadura` sem escudo mentia. */
function iaDanoReal(h,hb,slot,F,alvo){
  const ef=hb.ef;
  if(!ef.dano&&!ef.danoFixo)return 0;
  const poder=poderTotal(h)+(h.recarga||0)+dupla(h);
  let bruto = ef.danoFixo ? ef.danoFixo : Math.round(F*ef.dano*escalaDe(slot))+poder;
  if(ef.extra)bruto+=ef.extra;
  if(ef.bonusFerido&&alvo&&alvo.vida<=alvo.vidaMax/2)bruto+=ef.bonusFerido;
  if(!alvo)return bruto;
  const d=Math.max(1,bruto+(alvo.marca||0)-(ef.danoFixo?0:armTotal(alvo)));
  return Math.max(0,d-(alvo.esc||0));
}
/* o quanto vale tirar este herói do tabuleiro: quem está atrás na vida morre
   mais fácil, e atirador/mago pesam mais que tanque porque é deles o dano */
const IA_VALOR_ROTA={adc:1.35,meio:1.25,selva:1.1,sup:1.0,topo:.95};
function iaValorHeroi(o){ return (IA_VALOR_ROTA[CATALOGO[o.id].pos]||1)*(1+(o.itens?o.itens.length:0)*.12); }

/* A IA NÃO TRAPACEIA. Toda leitura de herói inimigo passa por aqui, e aqui
   aplica-se a mesma regra de visão do jogador humano: quem está no mato sem que
   o time tenha olhos lá simplesmente não existe para a decisão. Sem isto a névoa
   seria uma regra que só o jogador obedece, e o modo contra IA viraria mentira.

   Consequência aceita: a IA às vezes anda para dentro de uma emboscada. É o
   preço de jogar limpo, e é exatamente o que acontece com o humano. */
const iaInimigosVisiveis=t=>J.times[1-t].herois.filter(o=>!o.morto&&visivelPara(o,t));

/* Enumera e pontua. Não executa nada: devolve a lista ordenada. */
function iaJogadas(t){
  const saida=[], salvoSel=selHeroi, salvoModo=modo, salvoHab=habAtual;
  const ep=J.poco, epVivo=ep.vida>0;
  sondando=true;
  try{
    for(const h of vivos(t)){
      if(h.agiu)continue;
      for(let i=0;i<h.habs.length;i++){
        const hb=h.habs[i], di=dadoPara(hb);
        if(di===null)continue;
        const F=J.dados[di].v;
        limpaModo(); selHeroi=h; iniciaHab(i);

        /* NEXUS — acaba a partida. Nada compete. */
        if(alvoNexus!==null)
          saida.push({h,i,tipo:"nexus",v:alvoNexus,nota:1000});

        /* ÉPICO — o prêmio é do último golpe, então o que vale é MATAR, não
           arranhar. Bater sem levar só entrega vida de graça ao adversário e
           ainda cobra revide: por isso só pontua alto quando fecha, ou quando o
           poço já está tão baixo que a próxima rodada decide. */
        if(epVivo&&alvosEpico.includes(ep)){
          const golpe=golpeNoPoco(h,hb,i,F,ep);
          const fecha=ep.vida<=golpe;
          const revideMata=EPICO[ep.id].revide>=h.vida;
          let nota = fecha ? 320 : (ep.vida<=golpe*2 ? 90 : 22);
          if(ep.id==="barao") nota*=1.4;            /* Fúria decide partida */
          if(revideMata) nota=fecha?nota:5;         /* não morre para arranhar */
          saida.push({h,i,tipo:"epico",v:ep,nota});
        }

        /* TORRE — objetivo de verdade, mas o revide de 2 é real. */
        alvosTorre.forEach(tr=>{
          const cai=tr.vida<=DANO_TORRE;
          let nota = cai?150:55;
          if(REVIDE_TORRE>=h.vida&&!cai) nota=4;    /* não se mata por 1 de torre */
          saida.push({h,i,tipo:"torre",v:tr,nota});
        });

        /* HERÓI — matar vale muito mais que machucar. */
        alvos.filter(o=>o.t!==h.t&&!o.morto).forEach(o=>{
          const d=iaDanoReal(h,hb,i,F,o);
          const mata=d>=o.vida||(hb.ef.executa&&o.vida<=hb.ef.executa);
          let nota = mata ? 300*iaValorHeroi(o)
                          : 10*Math.min(d,o.vida)*iaValorHeroi(o)/Math.max(1,o.vidaMax/6);
          if(!mata&&i===2) nota*=.55;               /* não queima Ultimate sem fechar */
          saida.push({h,i,tipo:"heroi",v:o,nota});
        });

        /* HABILIDADE EM SI MESMO — escudo, área, cura. Vale quando há inimigo
           por perto para a área pegar, ou quando o herói está apanhando. */
        if(hb.alvo==="eu"&&confirmar===i){
          const ef=hb.ef;
          const perto=inimigosNosHex(vizinhos(...h.pos),h).length;
          let nota=0;
          if(ef.danoVizinhos||ef.danoRaio) nota=28*perto;
          if(ef.escudo) nota=(h.vida<h.vidaMax*.6?45:12)+(perto?18:0);
          if(ef.cura&&h.vida<h.vidaMax*.7) nota=38;
          if(ef.ward) nota=8;
          if(ef.intocavel&&h.vida<=h.vidaMax*.35) nota=50;
          if(nota>0) saida.push({h,i,tipo:"eu",v:h,nota});
        }
        limpaModo();
      }
    }
  } finally {
    sondando=false;
    limpaModo(); selHeroi=salvoSel; modo=salvoModo; habAtual=salvoHab;
  }
  return saida.sort((a,b)=>b.nota-a.nota);
}

/* Executa a melhor jogada. `minimo` é o piso de nota: com ele a IA prefere
   guardar o dado (e convertê-lo em movimento) a gastar num golpe inútil. */
function iaMelhorJogada(t,minimo){
  const lista=iaJogadas(t);
  const j=lista[0];
  if(!j||j.nota<(minimo||0))return null;
  limpaModo(); selHeroi=j.h; iniciaHab(j.i);
  if(j.tipo==="nexus")      atacaNexus(j.v);
  else if(j.tipo==="torre") atacaTorre(j.v);
  else if(j.tipo==="epico") atacaEpico(j.v);
  else                      confirmaHab(j.v);
  return j;
}
/* ---------- IA: HEURÍSTICAS ----------
   A IA da v15 só sabia uma coisa: procurar alvo ao alcance e, se não achasse,
   andar um passo. O playtest listou o que faltava, e cada item virou uma função
   pequena aqui embaixo. São heurísticas de propósito — a alternativa é uma busca
   que ninguém consegue manter e que joga bem sem nunca parecer que está pensando.

   Cada uma devolve `true` se fez alguma coisa, e o laço do turno tenta de novo.
   Todas são chamáveis de fora, o que é o que deixa sim/testes.js verificar cada
   comportamento isoladamente em vez de olhar uma partida inteira e torcer.   */

/* LOJA. Ouro parado não ganha partida. Compra o item mais caro que cabe, porque
   os caros são os que mudam o combate — e só quando o herói está na base ou
   morto, que é a mesma regra do humano. */
function iaCompra(t){
  let comprou=false;
  J.times[t].herois.forEach(h=>{
    if(!(h.morto||naBase(h)))return;
    while(!inventarioCheio(h)){
      const opc=ITENS.filter(i=>!h.itens.includes(i.id)
        && h.ouro>=Math.max(0,i.o-descontos[t]));
      if(!opc.length)break;
      const it=opc.sort((a,b)=>b.o-a.o)[0];
      const preco=Math.max(0,it.o-descontos[t]);
      h.ouro-=preco; h.itens.push(it.id);
      if(descontos[t]) descontos[t]=0;
      if(it.ef.vida){ h.vidaMax+=it.ef.vida; h.vida+=it.ef.vida; }
      reg(t?"c":"a",`${h.n} compra ${it.n} (−${preco} de ouro)`);
      comprou=true;
    }
    /* Inventário cheio: o ouro vai para os gastos tardios, senão a IA acumula
       uma montanha de ouro morto — exatamente a queixa do playtest.

       A ordem NÃO é por preço. Comprar sempre o mais caro fazia ela despejar
       tudo em Reforço, que encarece a cada compra e portanto continuava sendo o
       mais caro: um monopólio disfarçado de heurística. Agora ela passa uma vez
       por cada tipo, na ordem em que eles resolvem problemas diferentes —
       território, opção, e só então estatística. */
    const ORDEM_GASTO=["sentinela","leva","requisicao","reforco"];
    for(let volta=0;volta<2;volta++){
      for(const id of ORDEM_GASTO){
        const g=gastosDisponiveis(h).find(x=>x.id===id);
        if(!g||h.ouro<precoGasto(g,h))continue;
        if(usaGasto(g.id,h,t)) comprou=true;
      }
    }
  });
  return comprou;
}

/* CARTAS. Sem ler o texto: a família da carta já diz o bastante para uma decisão
   boa o suficiente. O que importa é que a IA gaste a mão — segurar carta até o
   fim da partida é o erro que o jogador percebe na hora. */
const PRIORIDADE_CARTA=["item","economia","buff","tempo","dado","mapa","reacao"];
function iaJogaCartas(t){
  let jogou=false;
  for(let volta=0;volta<3;volta++){
    const mao=maos[t].slice()
      .sort((a,b)=>PRIORIDADE_CARTA.indexOf(CARTA[a].fam)-PRIORIDADE_CARTA.indexOf(CARTA[b].fam));
    /* cartas que pedem herói recebem o melhor candidato antes da checagem */
    const alvo=J.times[t].herois.filter(h=>!h.morto)
      .sort((a,b)=>(b.vida/b.vidaMax)-(a.vida/a.vidaMax))[0];
    const id=mao.find(x=>{
      const salvo=selHeroi; selHeroi=alvo;
      const pode=podeJogar(x); selHeroi=salvo; return pode;
    });
    if(!id)break;
    selHeroi=alvo; jogaCarta(id); jogou=true;
    /* Forja abre escolha; a IA pega a primeira e segue */
    if(escolhaItem) confirmaEscolhaItem(escolhaItem.opcoes[0]);
    if(modo==="recuo"){ if(mover.length) recuaAte(...mover[0]); modo=null; }
  }
  return jogou;
}

/* OBJETIVOS. O dilema que o épico deveria criar só existe se os dois lados o
   virem. A IA bate no poço quando ele está aberto e alguém alcança, e prefere o
   Barão ao Dragão — mas NÃO abandona a rota por ele: quem vai é quem já está
   perto, e é por isso que a decisão continua sendo de posicionamento. */
function iaObjetivos(t){
  if(J.poco.vida<=0) return false;
  const j=iaJogadas(t).find(x=>x.tipo==="epico");
  if(!j) return false;
  limpaModo(); selHeroi=j.h; iniciaHab(j.i); atacaEpico(j.v);
  return true;
}

/* ---------- IA: PARA ONDE ANDAR ----------
   "Fica andando sem objetivo nenhum pois ainda tem dado de movimento" — o relato
   do playtest, e era literal: o laço gastava movimento enquanto sobrasse, um
   passo por herói, na direção do inimigo mais próximo. Andar era o que a IA fazia
   quando não sabia o que fazer.

   Agora cada herói tem um DESTINO com motivo, e — o mais importante — a IA só
   anda se o passo aproximar de algo. Movimento que não serve a nada fica no
   bolso, que é o que um jogador faz.

   A ordem dos motivos é a estratégia da IA inteira, e está escrita aqui de
   propósito, para poder ser discutida sem ler código:
     1. herói muito ferido volta para a base (não morrer é o primeiro objetivo);
     2. poço aberto e perto puxa quem está por perto — mas só quem está perto,
        senão o objetivo deixa de ser dilema e vira convocação geral;
     3. acampamento livre ao alcance é ouro de graça no caminho;
     4. inimigo matável perto: fecha a distância para o golpe;
     5. torre exposta da rota: pressão, que é como a partida realmente avança;
     6. sem nada disso, fica onde está. */
function iaDestino(h,t){
  const inimigos=iaInimigosVisiveis(t);
  const ferido=h.vida<=Math.ceil(h.vidaMax*.3);
  if(ferido&&!naBase(h)) return {p:BASE[t][0],motivo:"recua"};

  /* SAIR DA ZONA vem antes de tudo o mais, porque é a única entrada desta lista
     que cobra por ficar parado. Território negado que a IA ignora não nega nada:
     ela levaria o efeito todo turno e o jogador aprenderia que zona é decoração.
     Sai para a casa vizinha mais próxima que esteja limpa — e se não houver
     nenhuma, segue a lista normal, porque fugir para lugar nenhum é pior do que
     jogar. */
  const naZona=(p)=>(J.zonas||[]).some(z=>z.t!==t&&dist(...p,...z.pos)<=z.raio);
  if(naZona(h.pos)){
    /* A saída NÃO está entre os vizinhos. Uma zona de raio 1 cobre a casa e as
       seis em volta, então procurar a 1 passo não acha nada e a IA desistia de
       sair — foi o que o teste pegou. O alcance da busca tem de ser maior que o
       raio da maior zona em cima dela, e o desempate é o de sempre: sai pelo
       lado do adversário, não pelo próprio. */
    const raioMax=Math.max(...(J.zonas||[]).filter(z=>z.t!==t).map(z=>z.raio),1);
    let fora=null;
    for(let d=1;d<=raioMax+1&&!fora;d++){
      const anel=[];
      for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
        if(!noTab(c,r)||dist(c,r,...h.pos)!==d)continue;
        if(em(c,r)||naZona([c,r]))continue;
        anel.push([c,r]);
      }
      fora=anel.sort((a,b)=>dist(...a,...BASE[1-t][0])-dist(...b,...BASE[1-t][0]))[0]||null;
    }
    if(fora) return {p:fora,motivo:"sai da zona"};
  }

  /* ÚLTIMA MURALHA. Com o Nexus em 1 e uma rota aberta, ficar em casa deixou de
     ser desperdício e passou a ser a jogada que impede a onda de fechar (ver
     `fimDaRodada`). Sem isto a regra existiria só para o humano: a IA nunca
     voltaria, e o jogador jamais veria a última luta que ela devolve.
     Um herói e não o time todo — o mais perto de casa. Segurar o Nexus com
     cinco é perder o mapa inteiro para não perder um ponto. */
  if(J.nexus[t]<=1 && rotaAbertaContra(t)){
    const perto=vivos(t).slice().sort((a,b)=>
      dist(...a.pos,...BASE[t][0])-dist(...b.pos,...BASE[t][0]))[0];
    if(perto===h) return {p:BASE[t][0],motivo:"defende o Nexus"};
  }

  if(J.poco.vida>0&&dist(...h.pos,...POCO)<=4) return {p:POCO,motivo:"objetivo"};

  /* acampamento: qualquer herói pega, não só o caçador — era a queixa de "toda
     partida eu pego os acampamentos sozinho". O caçador continua com prioridade
     por chegar antes, mas o campo não fica mais parado a partida inteira. */
  const camps=J.camps.filter(c=>c.ativo&&(c.t===t||c.t===-1));
  const camp=camps.slice().sort((a,b)=>dist(...h.pos,...a.pos)-dist(...h.pos,...b.pos))[0];
  const raioCamp=CATALOGO[h.id].pos==="selva"?9:3;
  if(camp&&dist(...h.pos,...camp.pos)<=raioCamp) return {p:camp.pos,motivo:"farma"};

  const presa=inimigos.filter(o=>o.vida<=o.vidaMax*.5)
    .sort((a,b)=>dist(...h.pos,...a.pos)-dist(...h.pos,...b.pos))[0];
  if(presa&&dist(...h.pos,...presa.pos)<=5) return {p:presa.pos,motivo:"caça"};

  const rota=CATALOGO[h.id].pos, nome={topo:"topo",meio:"meio",adc:"baixo",sup:"baixo"}[rota];
  const tr=nome?torreExposta(nome,1-t):null;
  if(tr) return {p:ROTAS[tr.rota][tr.i],motivo:"pressiona"};

  const alvo=inimigos.sort((a,b)=>dist(...h.pos,...a.pos)-dist(...h.pos,...b.pos))[0];
  return alvo?{p:alvo.pos,motivo:"avança"}:null;
}

/* ALCANCE. O buraco mais visível da IA da v15: com duas ações e o inimigo a três
   casas ela ficava parada, porque só sabia procurar alvo dentro do alcance atual
   e andar um passo por vez com o Dado Mestre. Aqui ela faz a conta que o jogador
   faz sem pensar — "gasto uma ação virando movimento, chego, e ataco com a
   outra" — e só gasta o dado se a conta realmente fechar. */
function iaPlanejaAlcance(t){
  const livres=J.dados.map((d,i)=>({d,i})).filter(x=>!x.d.usado);
  if(livres.length<2 && !(livres.length===1&&J.mov.rest>0)) return false;

  const inimigos=iaInimigosVisiveis(t);
  const epAberto=J.poco.vida>0?[{pos:POCO}]:[];
  const cobicados=[...inimigos,...epAberto];
  if(!cobicados.length) return false;

  /* de quanto movimento eu precisaria para alguém encostar em alguém? */
  let melhor=null;
  for(const h of vivos(t)){
    if(h.agiu||h.preso)continue;
    const alc=alcTotal(h);
    for(const alvo of cobicados){
      const falta=dist(...h.pos,...alvo.pos)-alc;
      if(falta<=0||falta>6)continue;
      if(!melhor||falta<melhor.falta) melhor={h,alvo,falta};
    }
  }
  if(!melhor) return false;
  if(J.mov.rest>=melhor.falta) return false;      // já dá para chegar andando

  /* converte o MENOR dado que ainda resolve — o grande fica para a habilidade */
  const precisa=melhor.falta-J.mov.rest;
  const serve=livres.filter(x=>x.d.v>=precisa).sort((a,b)=>a.d.v-b.d.v)[0]
           || livres.slice().sort((a,b)=>b.d.v-a.d.v)[0];
  if(!serve) return false;
  /* não queima a última ação se ela é a única que ainda ataca */
  if(livres.length===1&&J.dados.filter(d=>!d.usado).length===1&&melhor.falta>serve.d.v) return false;
  converteDado(serve.i);
  return true;
}

/* 650ms era o tempo de ver que algo mexeu, não de entender o quê. Uma jogada da IA
   é herói + habilidade + alvo + resultado: quatro leituras. 1200 dá para acompanhar
   sem virar espera, e quem já entendeu tem o botão de pular. */
const RITMO_IA=1200;
let iaRodando=false, pularIA=false;
/* A IA planta as Sentinelas que comprou, no fim do turno, onde os heróis
   pararam. Planta só no MATO — fora dele a ward não acende nada que os raios já
   não deem, e gastar carga na rota seria a IA jogando pior que as regras.

   O critério NÃO é "não enxergo isto agora": herói parado no mato acende 2 de
   raio à própria volta, então essa condição é falsa quase sempre e a primeira
   versão nunca plantou nada — medido numa partida IA×IA inteira, 19 Sentinelas
   compradas e zero plantadas, com o ouro morrendo na mochila. O que a ward
   compra é visão que FICA depois que o herói sai. Logo o critério é cobertura:
   planta se não houver ward dela por perto. */
function iaPlantaWards(t){
  J.times[t].herois.forEach(h=>{
    if(h.morto||!(h.sentinelas>0)||!ehMato(...h.pos))return;
    const jaCoberto=(J.times[t].wards||[]).some(w=>dist(...w.pos,...h.pos)<=VISAO_WARD);
    if(jaCoberto)return;
    plantaSentinela(h);
  });
}

async function iaExecutaTurno(){
  if(iaRodando||(!aiMode&&!simMode)||J.fim!==null||J.fase!=="jogando"||(aiMode&&J.vez!==1))return;
  iaRodando=true; pularIA=false;
  const bp=G("btPularIA");
  if(bp&&aiMode){ bp.classList.add("on"); bp.classList.remove("correndo");
    bp.textContent="▸▸ pular vez da IA"; }
  const lado=J.vez, passos=new Map();
  const pausa=ms=>new Promise(r=>setTimeout(r,ms));
  falaIA("vez da IA","viva");

  /* Antes do primeiro movimento: gastar ouro e gastar mão. Ficam fora do laço
     porque nenhuma das duas depende de posição — e dentro dele virariam ruído
     visual, uma fala de IA por carta. */
  if(iaCompra(lado)&&aiMode) falaIA("comprou item");
  if(iaJogaCartas(lado)&&aiMode) falaIA("jogou carta");

  let guard=0;
  while(guard++<45&&J.fim===null&&J.vez===lado){
    /* Pular era "acelerar": o laço seguia pintando e cedendo a cada passo, e o
       jogador via a vez da IA passar rápido em vez de já ver o resultado. Com o
       pulo ligado, nada de tela até o fim — a IA resolve o turno inteiro e o
       mapa aparece uma vez, já no estado final. */
    if(!pularIA){
      pinta();
      await pausa(aiMode?RITMO_IA:0);
    }

    const vivosAI=vivos(lado);

    /* Feitiço de emergência. A IA não sabe engajar com Lampejo — sabe só fugir, e só
       quando está de fato morrendo. É pouco de propósito: uma IA que lampeja para
       cima acerta por acidente e o jogador aprende a regra errada. Fugir ela acerta
       sempre, e é o que faz o humano sentir que os dois botões são do jogo, não dele.
       As duas condições são exclusivas: Lampejo é para inimigo colado, Retorno é
       justamente para quando NÃO há ninguém colado (com inimigo ao lado ele é
       interrompido, mesma regra do jogador). */
    const colado=h=>vizinhos(...h.pos).some(([vc,vr])=>{const o=em(vc,vr);return o&&o.t!==lado;});
    const machucado=h=>h.vida<=Math.ceil(h.vidaMax/3);
    const longeDeInimigo=p=>Math.min(...J.times[1-lado].herois.filter(o=>!o.morto)
      .map(o=>dist(...p,...o.pos)),99);

    const saltador=temFeitico(lado)&&vivosAI.find(h=>machucado(h)&&colado(h));
    if(saltador){
      limpaModo(); selHeroi=saltador; modo="lampejo"; calcula();
      const destino=mover.slice().sort((a,b)=>longeDeInimigo(b)-longeDeInimigo(a))[0];
      if(destino){
        if(aiMode) falaIA(`${saltador.n} lampeja`,"viva");
        lampejaAte(...destino); continue;
      }
      limpaModo();
    }
    const voltador=temFeitico(lado)&&vivosAI.find(h=>machucado(h)&&!colado(h)&&!naBase(h));
    if(voltador){
      limpaModo(); selHeroi=voltador;
      if(aiMode) falaIA(`${voltador.n} volta à base`,"viva");
      usaRetorno(); continue;
    }

    /* A JOGADA. Uma chamada: enumera tudo, pontua, executa a melhor.
       O piso de 15 é o que separa "jogada" de "gastar dado": abaixo disso a IA
       prefere guardar a ação — e o fim do laço a converte em movimento, que
       quase sempre vale mais que um arranhão. */
    const jogada = iaMelhorJogada(lado, 15);
    if(jogada){
      if(aiMode){
        const alvoTxt = jogada.tipo==="nexus" ? "no NEXUS"
                      : jogada.tipo==="torre" ? "na torre"
                      : jogada.tipo==="epico" ? `no ${EPICO[J.poco.id].n}`
                      : jogada.tipo==="eu"    ? "" : `em ${jogada.v.n}`;
        falaIA(`${jogada.h.n} usa ${jogada.h.habs[jogada.i].n} ${alvoTxt}`.trim(),"viva");
      }
      continue;
    }

    /* MOVIMENTO COM MOTIVO. Só anda quem tem para onde ir e cujo passo aproxima.
       Sem a checagem de aproximação a IA gastava o Dado Mestre inteiro andando em
       volta de si mesma sempre que não achava alvo. */
    if(J.mov.rest>0){
      const candidatos=vivosAI.filter(h=>!h.preso)
        .sort((a,b)=>(passos.get(a.id)||0)-(passos.get(b.id)||0));
      let moveu=false;
      for(const h of candidatos){
        const dest=iaDestino(h,lado);
        if(!dest)continue;
        const agora=dist(...h.pos,...dest.p);
        if(agora===0)continue;
        selHeroi=h; modo="mover"; calcula();
        const umPasso=mover.filter(p=>dist(...h.pos,...p)===1)
          .sort((a,b)=>dist(...a,...dest.p)-dist(...b,...dest.p))[0];
        if(umPasso&&dist(...umPasso,...dest.p)<agora){
          if(aiMode) falaIA(`${h.n} ${dest.motivo}`);
          moveAte(...umPasso);
          passos.set(h.id,(passos.get(h.id)||0)+1);
          moveu=true; break;
        }
        limpaModo();
      }
      if(moveu)continue;
    }

    if(iaPlanejaAlcance(lado)){ if(aiMode) falaIA("vira ação em movimento"); continue; }
    break;
  }

  iaPlantaWards(lado);
  limpaModo(); selHeroi=null;
  pinta();
  if(bp) bp.classList.remove("on");
  if(J.fim===null){
    if(aiMode){
      falaIA("encerrou o turno","viva");
      await pausa(pularIA?0:900);
    }
    encerraTurno();
  }
  iaRodando=false; pularIA=false;
}

/* ══════════════════ FLUXO ══════════════════ */
const _iniciaTurno=iniciaTurno;
iniciaTurno=function(){
  _iniciaTurno();
  limpaModo(); selHeroi=null;
  const nova=compra(J.vez);
  if(simMode || (aiMode&&J.vez===1)){
    pinta();
    iaExecutaTurno();
    return;
  }
  abre(`<span class="et">Passe o aparelho</span><h2 class="t${J.vez}">${NOMES[J.vez]}</h2>
    <p>É a sua vez. Ninguém mais deve estar olhando.</p>
    ${nova?`<span class="et" style="display:block;margin-bottom:2px">Você comprou</span>
        ${faceCarta(nova)}`:""}
    <button class="grande" id="ok">Começar meu turno</button>`,()=>{ fecha(); pinta(); });
};

/* buffs do deck duram até o início do próximo turno do dono — ver expiraDoTime */
/* limpaBuffs() era chamada aqui, no fim da rodada, e zerava o buff dos DOIS
   times de uma vez. Agora cada time perde o seu no início do próprio turno
   (expiraDoTime), que é o que dá a mesma janela de exposição aos dois lados. */
/* A tela existia e só dizia quem venceu. Agora mostra o placar dos dois lados e o
   motivo — que hoje é sempre o Nexus, mas `J.motivoFim` já está plumbado para o dia
   em que o limite de rodadas entrar (ver docs/REVISAO-EXTERNA.md, item 3.3). */
/* A tela de vitória é o último quadro que o jogador leva da partida, e a v15
   terminava com uma linha de texto. O que o relatório pediu (PARTE 19) é que ela
   seja um pequeno momento: quem venceu, e sobretudo QUEM DEU O GOLPE — com o
   rosto na tela. `J.golpeFinal` é gravado em `encerraPartida`; quando o Nexus cai
   pela onda não há autor, e aí o bloco do herói simplesmente não aparece. */
function telaFim(){
  const v=J.fim, p=1-v;
  const linha=(rot,a,b)=>`<tr><th>${rot}</th>
    <td class="${a>=b?"mais":""}">${a}</td><td class="${b>=a?"mais":""}">${b}</td></tr>`;
  const gf=J.golpeFinal;
  /* Com autor: o rosto de quem fechou. Sem autor — o Nexus caiu pela onda, que é
     como a maioria das partidas termina — o crédito é do time, e a tela mostra os
     cinco juntos. Antes esse caso não mostrava nada e o fim ficava sem imagem
     justamente na partida mais comum. */
  const heroi = gf ? `
    <div class="golpe-final t${gf.t}">
      <img src="${RETRATO(gf.id)}" alt="">
      <div><span class="gf-n">${gf.n}</span><span class="gf-d">destruiu o Nexus</span></div>
    </div>`
  : `<div class="time-vitoria t${v}">
      <div class="tv-fila">${J.times[v].herois.map(h=>
        `<figure><img src="${RETRATO(h.id)}" alt=""><figcaption>${h.n}</figcaption></figure>`).join("")}</div>
      <span class="gf-d">as cinco peças derrubaram o Nexus</span>
    </div>`;
  abre(`<span class="et">Fim de partida · rodada ${J.rodada}</span>
    <h2 class="t${v}">${NOMES[v]} venceu</h2>
    ${heroi}
    <p>${J.motivoFim||`Nexus ${NOMES[p]} destruído.`}</p>
    <table class="placar">
      <thead><tr><th></th><th class="t${v}">${NOMES[v]}</th><th class="t${p}">${NOMES[p]}</th></tr></thead>
      <tbody>
        ${linha("Nexus",Math.max(0,J.nexus[v]),Math.max(0,J.nexus[p]))}
        ${linha("Torres derrubadas",torresDerrubadas(v),torresDerrubadas(p))}
        ${linha("Ouro acumulado",ouroDoTime(v),ouroDoTime(p))}
      </tbody>
    </table>
    <button class="grande" id="ok">Nova partida</button>
    <button class="grande" id="btMenu"
      style="background:none;border:1px solid var(--line);color:var(--ink-2)">Voltar ao menu</button>`,
    ()=>{fecha();partida(false);});
  const bm=G("btMenu"); if(bm) bm.onclick=()=>{ fecha(); telaAbertura(); };
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
  confirma("Usar prioridade",
    `Você gasta <b style="color:var(--brass)">1 carga de Prioridade</b> e rola
     <b style="color:var(--brass)">um dado de ação a mais</b> agora, neste turno.
     <br><br>O dado sai aleatório, de 1 a 6 — pode vir baixo. Ele entra na mesa
     como qualquer outro: dá para gastar numa habilidade, virar movimento ou
     ajustar com placa.
     <br><br>Você tem <b>${tm.prio}</b> ${tm.prio===1?"carga":"cargas"}.
     A carga não volta, e sobra para as próximas rodadas se você não usar.`,
    ()=>{
      tm.prio--;
      const v=1+Math.floor(Math.random()*6);
      J.dados.push({v,usado:0,extra:1});
      reg("b",`PRIORIDADE — ${NOMES[J.vez]} rola um dado a mais: ${v}`);
      toast("dado extra: "+v,""); vibra(14); pinta();
    });
}

/* ══════════════════ BOTÕES ══════════════════ */
G("btTime").onclick=()=>{ sheetAberto==="Time"?fechaSheet():abreTime(); };
G("btPrio").onclick=()=>usaPrioridade();
G("btPularIA").onclick=()=>{
  if(pularIA)return;
  pularIA=true;
  const b=G("btPularIA");
  b.classList.add("correndo"); b.textContent="resolvendo…";
};
G("btLoja").onclick=()=>{ sheetAberto&&sheetAberto.startsWith("Loja")?fechaSheet():abreLoja(); };
G("btCartas").onclick=()=>{ sheetAberto==="Cartas"?fechaSheet():abreMao(); };
/* Estruturas: uma linha por rota, dos dois lados, com a vida em bolinha e a
   torre que aceita golpe AGORA marcada. Na gaveta cabe o que não cabia no
   painel — em que passo da rota cada torre está, e por que o Nexus está ou não
   exposto. É consulta, não HUD: abre, decide onde cercar, fecha. */
function abreEstruturas(){
  const pip=(v,max)=>`<span class="pips">${
    Array.from({length:max},(_,i)=>`<i class="${i<v?"on":""}"></i>`).join("")}</span>`;
  const lado=t=>{
    const rotas=Object.keys(ROTAS).map(nome=>{
      const ts=J.torres.filter(x=>x.rota===nome&&x.t===t).sort((a,b)=>a.i-b.i);
      const exp=torreExposta(nome,t);
      const caiu=ts.every(x=>x.vida<=0);
      const torres=ts.map(x=>{
        if(x.vida<=0) return `<span class="tw caiu" title="passo ${x.i}">✕</span>`;
        const eu=x===exp;
        return `<span class="tw${eu?" exposta":""}" title="passo ${x.i}">`+
               `${pip(x.vida,VIDA_TORRE)}${eu?'<em>alvo</em>':""}</span>`;
      }).join("");
      return `<div class="er${caiu?" aberta":""}">
        <b>${nome.toUpperCase()}</b>
        ${caiu?'<span class="aviso">ROTA ABERTA</span>':torres}</div>`;
    }).join("");
    const aberta=rotaAberta(t), nx=Math.max(0,J.nexus[t]);
    return `<div class="ecol t${t}">
      <div class="ecab">${NOMES[t]}${t===J.vez?" <i>· sua vez</i>":""}</div>
      ${rotas}
      <div class="er nex${aberta?" exposto":""}">
        <b>NEXUS</b>${pip(nx,VIDA_NEXUS)}
        <span class="${aberta?"aviso":"ja"}">${aberta?"EXPOSTO":"protegido"}</span></div></div>`;
  };
  abreSheet("Estruturas",
    `<div id="estruturas">${lado(0)}${lado(1)}</div>
     <p class="est-nota">A torre marcada <b>alvo</b> é a única da rota que aceita golpe de herói
     agora — a de trás só depois que ela cair. O <b>Nexus</b> só fica exposto quando uma rota
     inteira daquele lado cai.</p>`);
}
G("btEstr").onclick=()=>{ sheetAberto==="Estruturas"?fechaSheet():abreEstruturas(); };
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
G("btConv").onclick=()=>converteDado();
G("btPlaca").onclick=()=>{ usaPlaca(1); toast("dado ajustado",""); vibra(10); };
G("btRerol").onclick=()=>{ rerola(); toast("dado re-rolado",""); vibra(10); };
G("btWard").onclick=()=>{ if(plantaSentinela(selHeroi)){ calcula(); pinta(); } };
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
   e guardam o quanto aplicaram, para devolver no início do próximo turno do dono.
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
    h.focoPoco=0;
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
  if(ef.itemGratis){
    /* A carta era jogável mesmo quando não tinha o que entregar: com o
       inventário cheio ela ia para o cemitério e escrevia "sem item disponível"
       no log, sem abrir escolha nenhuma. Do lado do jogador isso é a carta
       sumindo sem fazer nada. Agora ela fica apagada quando não há slot livre
       ou quando não sobrou item elegível. */
    if(!selHeroi||selHeroi.morto)return false;
    if(!(ef.ondeEstiver||naBase(selHeroi)))return false;
    if(inventarioCheio(selHeroi))return false;
    return ITENS.some(i=>i.o<=ef.itemGratis&&!selHeroi.itens.includes(i.id));
  }
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
  if(ef.moverReacao){
    /* Recuo não empresta movimento: ele move ESTE herói exatamente uma casa.
       Somar em J.mov era o bug — o Dado Mestre é de quem está na vez, então uma
       carta de reação acabava presenteando o adversário com +1 de movimento, e
       o herói que deveria recuar não saía do lugar. */
    modo="recuo"; selHeroi=h; calcula();
    msg+=` → escolha a casa para onde ${h.n} recua`;
  }
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
  if(ef.slotExtra){ h.slots=capacidade(h)+1; msg+=` → ${h.n} tem ${h.slots} slots`; }
  if(ef.recall){ h.pos=[...BASE[t][0]]; desempilha(); msg+=` → ${h.n} volta à base`; }
  if(ef.ward){ poeWard(t,h.pos); msg+=` → ward posta em ${h.n}`; }
  if(ef.revelarCaca){
    /* revela pelo LOG quem está fora do seu campo de visão agora — informação
       pontual, sem virar uma ward de graça */
    const ocultos=J.times[1-t].herois.filter(x=>!x.morto&&!visivelPara(x,t));
    msg+=ocultos.length?` → escondidos: ${ocultos.map(x=>x.n).join(", ")}`
                       :" → ninguém escondido"; }
  if(ef.empurrarOnda){
    const rota=["topo","meio","baixo"][Math.floor(Math.random()*3)];
    J.frentes[rota]=limitaFrente(rota, J.frentes[rota]+(t===0?1:-1));
    msg+=` → onda do ${rota} avança`; }
  if(ef.itemGratis){
    /* Antes o motor sorteava UM item e equipava. A carta era um dado disfarçado:
       o jogador não escolhia nada, e "Forja de Campo" acabava valendo o item que
       calhasse. Agora o sorteio escolhe TRÊS e a decisão é do jogador — mesma
       aleatoriedade na oferta, agência de volta na escolha. */
    const opc=ITENS.filter(i=>i.o<=ef.itemGratis&&!h.itens.includes(i.id));
    if(opc.length&&!inventarioCheio(h)){
      const sorteio=opc.slice();
      for(let i=sorteio.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[sorteio[i],sorteio[j]]=[sorteio[j],sorteio[i]];}
      abreEscolhaItem(h,sorteio.slice(0,3).map(i=>i.id),c.n);
      msg+=` → ${h.n} escolhe entre 3 itens`;
    } else msg+=" → sem item disponível";
  }
  if(ef.doCemiterio){ const volta=cemiterio.pop(); maos[t].push(volta);
    msg+=` → recuperou ${CARTA[volta].n}`; }

  maos[t]=maos[t].filter(x=>x!==id); cemiterio.push(id);
  reg(t?"c":"a",msg); toast(c.n,""); vibra(12);
  calcula(); pinta(); if(sheetAberto==="Cartas") abreMao();
}
/* ---------- ESCOLHA DE ITEM ----------
   Estado próprio porque a escolha sobrevive ao fechamento do sheet: a carta já
   foi para o cemitério quando a lista aparece, então perder a escolha por um
   toque fora seria perder a carta. `confirmaEscolhaItem` é a única saída. */
let escolhaItem=null;
function abreEscolhaItem(h,ids,titulo){
  escolhaItem={h,opcoes:ids};
  const cards=ids.map(id=>{const it=ITEM[id];
    return `<button class="itC" data-i="${id}">
      <img src="${RETRATO_ITEM(id)}" alt=""><span class="iN">${it.n}</span>
      <span class="iD">${it.d}</span><span class="iO">grátis</span></button>`;}).join("");
  abreSheet(titulo||"Escolha um item",
    `<p style="color:var(--ink-2);font-size:13.5px;margin:0 0 10px">
       <b style="color:var(--ink)">${h.n}</b> equipa <b style="color:var(--brass)">um</b> destes.
       Os outros dois são descartados.</p><div class="prat">${cards}</div>`);
  G("shCorpo").querySelectorAll(".itC").forEach(b=>
    b.onclick=()=>confirmaEscolhaItem(b.dataset.i));
}
function confirmaEscolhaItem(id){
  if(!escolhaItem||!escolhaItem.opcoes.includes(id))return;
  const h=escolhaItem.h, it=ITEM[id];
  h.itens.push(id);
  if(it.ef.vida){ h.vidaMax+=it.ef.vida; h.vida+=it.ef.vida; }
  reg(h.t?"c":"a",`${h.n} forja ${it.n}`);
  toast(it.n,""); vibra(14);
  escolhaItem=null; fechaSheet(); calcula(); pinta();
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

function draftTurnoAtual(){
  const ORDEM=typeof ORDEM_DRAFT!=="undefined"?ORDEM_DRAFT:
    [{rota:"topo",primeiro:0},{rota:"selva",primeiro:1},{rota:"meio",primeiro:0},
     {rota:"adc",primeiro:1},{rota:"sup",primeiro:0}];
  if(dr.fase==="ban") return dr.passo;
  const et=ORDEM[Math.floor(dr.passo/2)];
  return dr.passo%2===0 ? et.primeiro : 1-et.primeiro;
}
function draftEscolhaIA(){
  if(!aiMode || draftTurnoAtual()!==1)return false;
  const ORDEM=typeof ORDEM_DRAFT!=="undefined"?ORDEM_DRAFT:
    [{rota:"topo",primeiro:0},{rota:"selva",primeiro:1},{rota:"meio",primeiro:0},
     {rota:"adc",primeiro:1},{rota:"sup",primeiro:0}];

  let legais=[];
  if(dr.fase==="ban"){
    const rotasBanidas=dr.bans.map(id=>CATALOGO[id].pos);
    legais=Object.keys(CATALOGO).filter(id=>!dr.bans.includes(id)&&!rotasBanidas.includes(CATALOGO[id].pos));
  } else {
    const et=ORDEM[Math.floor(dr.passo/2)], rota=et.rota;
    legais=Object.keys(CATALOGO).filter(id=>
      CATALOGO[id].pos===rota &&
      !dr.bans.includes(id) &&
      !dr.times[0].includes(id) &&
      !dr.times[1].includes(id));
  }
  if(!legais.length)return false;

  /* IA prefere, entre opções legais, mais vida+poder+armadura; pequeno ruído evita draft sempre idêntico. */
  legais.sort((a,b)=>{
    const A=CATALOGO[a], B=CATALOGO[b];
    const sa=A.vida+A.poder*2+A.arm*1.5+Math.random()*2;
    const sb=B.vida+B.poder*2+B.arm*1.5+Math.random()*2;
    return sb-sa;
  });
  const id=legais[0];

  setTimeout(()=>{
    if(dr.fase==="ban"){
      dr.bans.push(id); dr.passo++;
      if(dr.passo>=2){dr.fase="pick";dr.passo=0;}
    } else {
      const et=ORDEM[Math.floor(dr.passo/2)];
      const t=dr.passo%2===0?et.primeiro:1-et.primeiro;
      dr.times[t].push(id); dr.passo++;
      if(dr.passo>=10){ fecha(); return dr.aoFim(dr.times); }
    }
    telaDraft();
  },500);
  return true;
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
  if(draftEscolhaIA()){
    document.querySelectorAll(".dr-h").forEach(b=>b.disabled=true);
    return;
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
  novo();
  pinta();
}
/* CARA OU COROA. Quem começa deixou de ser sempre o Azul. Começar tem valor
   medido (a compensação do Primeiro Passo existe por isso), e num jogo de dois
   no mesmo aparelho a ordem fixa era um presente silencioso para quem sentasse
   do lado azul. O sorteio é visível de propósito: o jogador vê a moeda cair. */
function caraOuCoroa(depois){
  if(simMode) { J.primeiro=Math.random()<.5?0:1; J.vez=J.primeiro; return depois(); }
  const vencedor=Math.random()<.5?0:1;
  abre(`<span class="et">Antes de começar</span>
    <h2 style="font-size:30px">Cara ou coroa</h2>
    <p>Quem começa joga sem saber o que o outro vai fazer — e por isso rola
       <b style="color:var(--brass)">+1 de movimento</b> na primeira rodada.</p>
    <div class="moeda" id="moeda">?</div>
    <button class="grande" id="ok">Girar a moeda</button>`,
    ()=>{
      const m=G("moeda");
      if(m){ m.classList.add("girando"); m.textContent = vencedor===0?"AZUL":"CARMIM"; }
      J.primeiro=vencedor; J.vez=vencedor;
      reg("b",`Cara ou coroa — ${NOMES[vencedor]} começa a partida`);
      setTimeout(()=>{ fecha(); depois(); },1100);
    });
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
    <button class="grande" id="btIA" style="background:#315B52">Jogar contra a IA · com Draft</button>
    <button class="grande" id="btDireto"
      style="background:none;border:1px solid var(--line);color:var(--ink-2)">Partida rápida</button>`,
    ()=>comeca(true,false));
  G("btDraft").onclick=()=>comeca(false,true);
  G("btIA").onclick=()=>{
    aiMode=true; simMode=false;
    iniciaDraft(times=>{ TIMES=times; partida(false); });
  };
  G("btDireto").onclick=()=>{aiMode=false;comeca(false,false);};
}
globalThis.__JAGER_AI__={
  start:()=>{ aiMode=false; simMode=true; TIMES=[["vharn","nyx","solenne","vesper","mirrha"],["vharn","nyx","solenne","vesper","mirrha"]]; baralho=typeof montaDeck!=="undefined"?montaDeck():[]; cemiterio=[]; maos=[[],[]]; descontos=[0,0]; novo(); },
  startHuman:()=>{ aiMode=true; simMode=false; baralho=typeof montaDeck!=="undefined"?montaDeck():[]; cemiterio=[]; maos=[[],[]]; descontos=[0,0]; novo(); },
  turn:()=>iaExecutaTurno(),
  get state(){return J}
};
telaAbertura();
