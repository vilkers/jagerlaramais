/* JAGERLARAMAIS — motor de regras e interface.
   Ordem interna: CATÁLOGO → GEOMETRIA → ESTADO → TURNO → AÇÕES → DECK/DRAFT → UI.
   Conteúdo (heróis, itens, cartas) NÃO mora aqui — mora em data/catalogo.js.
   Aparência não mora aqui — mora em estilo.css. */

/* ---------- CATÁLOGO ---------- */
/* nome e cor de cada rota — no catálogo desde a v48, para o guia e as cartas
   não manterem cada um a sua versão (e `cartas/` mantinha, com outras cores) */
const POS = typeof POS_ROTA!=="undefined" ? POS_ROTA : {
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
/* ---------- OS ITENS MORAM NO CATÁLOGO (v48) ----------
   Os doze originais viviam AQUI e os dez novos em `data/catalogo.js`. Meia
   verdade em cada arquivo é a receita do defeito que o CLAUDE.md proíbe em
   letras maiúsculas: o guia mantinha uma TERCEIRA lista, escrita à mão, com
   preços e efeitos de outra versão — "Cetro Cinéreo: +2 de poder mágico; dano
   em área leva +1" quando o item real dá +2 de Poder e +1 de Alcance.
   Agora a loja inteira é `ITENS_BASE + ITENS_NOVOS`, os dois no catálogo, e o
   guia lê de lá como jogo e cartas já liam. */
const ITENS=[...(typeof ITENS_BASE!=="undefined"?ITENS_BASE:[]),
             ...(typeof ITENS_NOVOS!=="undefined"?ITENS_NOVOS:[])];
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

/* ---------- A FAIXA DE DADO (v49) ----------
   O dado deixou de dizer SE a habilidade sai e passou a dizer QUAL sai:
   1–2 é a básica, 3–5 é a segunda, 6 é a Ultimate. Não existe "ou mais".

   Nenhum dado morre — um 6 é Ultimate de qualquer um dos cinco —, e a decisão
   do turno vira "quem recebe este dado?" em vez de "que habilidade este dado
   destrava?". A faixa de cada uma mora no catálogo (FAIXA_SLOT e os `dados` de
   quem foge do padrão); aqui só se lê.

   A FAIXA MORA NA HABILIDADE, e não no lugar dela. Quem não declara `dados` no
   catálogo recebe a faixa do próprio slot uma vez só, aqui embaixo, na carga —
   e a partir daí `faixaDeHab(hb)` responde sem precisar saber de quem é o kit.

   Isso não é economia de código, é conserto: `dadoPara(hb)` é chamado em pontos
   onde o herói ainda não está selecionado, e enquanto a faixa dependia de achar
   o índice dentro de `quem.habs` esses pontos caíam calados na faixa da básica —
   a Ultimate paga por um dado extra 6 respondia "nenhum dado serve". Habilidade
   sintética (a cópia do Arden) continua caindo no padrão da básica, que é onde
   ela é resolvida. */
const FAIXA_PADRAO = typeof FAIXA_SLOT!=="undefined" ? FAIXA_SLOT : [[1,2],[3,4,5],[6]];
/* carimba a faixa do slot em quem não declarou a própria — uma vez, na carga */
(function marcaFaixas(){
  if(typeof CATALOGO==="undefined")return;
  Object.values(CATALOGO).forEach(def=>{
    (def.habs||[]).forEach((hb,i)=>{ if(!hb.dados) hb.dados=FAIXA_PADRAO[i]||FAIXA_PADRAO[0]; });
  });
})();
function faixaDeHab(hb,quem){
  if(hb&&hb.dados) return hb.dados;
  const slot = quem&&quem.habs ? quem.habs.indexOf(hb) : -1;
  return FAIXA_PADRAO[slot>=0?slot:0];
}
const dadoServe=(hb,quem,v)=>faixaDeHab(hb,quem).includes(v);
/* "1–2", "3–5", "6" — o texto que a tela mostra no lugar da Força mínima */
function textoFaixa(hb,quem){
  const f=faixaDeHab(hb,quem);
  const lo=Math.min(...f), hi=Math.max(...f);
  return lo===hi?String(lo):`${lo}–${hi}`;
}
const inventarioCheio=h=>h.itens.length>=capacidade(h);
function bonus(h,campo){ return (h.itens||[]).reduce((a,id)=>a+(ITEM[id].ef[campo]||0),0); }
function auraDe(h){
  return J.times[h.t].herois.some(o=>o!==h&&!o.morto&&(o.itens||[]).some(i=>ITEM[i].ef.aura)
    && dist(...h.pos,...o.pos)<=1) ? 1 : 0;
}
/* `poderPassivo` entra AQUI e não como buff porque passiva não tem prazo: a
   Insaciável ganha os +2 no instante em que cai abaixo da metade e perde no
   instante em que se cura. Somar por fora seria um sinalizador para alguém
   lembrar de zerar — o erro que este arquivo já pagou três vezes.
   `poderTotal` continua `const`: quem precisa mudar Poder usa aplicaBuff. */
const poderTotal=h=>h.poder+h.extraPoder+bonus(h,"poder")+auraDe(h)+poderPassivo(h);

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
const armTotal=h=>Math.max(0,h.arm+bonus(h,"arm")+(sobTorreAmiga(h)?ARM_TORRE:0)
  -(temCond(h,"vulneravel")?COND_NUM.vulneravelArm:0));
/* TETO DE ALCANCE. Sem ele o Corvo (base 4) somava Cetro +1 e Lente +2 e
   atirava a SETE hexágonos — atravessava meio tabuleiro sem sair do lugar, que
   foi a queixa "os range tão conseguindo 4, 5 hexágonos". Quatro é o teto: ainda
   é o dobro do corpo a corpo, e ainda dá para fugir andando. */
/* ---------- A ECONOMIA, NUM LUGAR SÓ (v48) ----------
   RELATO: *"os itens são adquiridos cedo demais"*. Medido com `node sim/ouro.js
   300`, e é literal: com o catálogo antigo (4 a 9 de ouro) o herói mediano
   cruzava o preço do **primeiro item na rodada 4**, do **segundo na 6** e
   fechava **os três slots na rodada 8** — de uma partida que dura 34. O build
   inteiro acontecia no primeiro quarto do jogo, e o resto da partida era ouro
   sem destino: 63 de sobra por herói.

   A correção tem DOIS lados, e os dois foram medidos juntos:

   1. PREÇO EM TRÊS FAIXAS (§11), com a mesma ordem relativa de antes — o
      equilíbrio entre itens já estava certo, o que estava errado era a escala:
        · SIMPLES 12 — um atributo, efeito pequeno;
        · INTERMEDIÁRIO 18 — dois atributos, ou um efeito de verdade;
        · FORTE 24 — o item que define a build.
   2. O QUE VOCÊ FAZ passa a pagar mais que o que você espera. Se só o preço
      subisse, a renda passiva (3 por rodada de quem farma) continuaria sendo a
      fonte quase inteira, e o jogo cobraria PACIÊNCIA em vez de jogo. Abate,
      acampamento e invasão sobem junto; a gota por rodada, não. */
const OURO_ABATE=8;          /* era 4 */
const OURO_CAMP=6;           /* acampamento do próprio lado, era 3 */
const OURO_CAMP_NEUTRO=8;    /* o do meio, era 4 */
const OURO_REGIAO=6;         /* bônus da região Baixo na rotação, era 3 */
const PATAMAR_PASSO=20;      /* degrau do Atirador que escala por ouro, era 10 */
const ALCANCE_MAX=4;
const alcTotal=h=>Math.min(ALCANCE_MAX,h.alc+bonus(h,"alc")+(h.alcTurno||0));

/* ---------- ALCANCE POR HABILIDADE (v46) ----------
   Até aqui o alcance era do HERÓI: um número na ficha, e as três habilidades
   herdavam. Isso amarrava a identidade a um extremo — ou o herói era todo de
   perto, ou todo de longe —, e apagava exatamente o tipo de personagem que o
   pedido descreve: *"os heróis podem ter só hab de longe, só de perto, ou as
   duas"*.

   Agora a habilidade pode declarar `alc` própria no catálogo:

     sem `alc`   → segue o herói (é o padrão, e a maioria continua assim)
     `alc: 1`    → CORPO A CORPO, e é corpo a corpo de verdade
     `alc: n`    → alcance próprio, que pode ser maior OU menor que o do herói

   A regra do item, e ela é a única sutileza: **item de alcance não transforma
   corpo a corpo em tiro**. `alc:1` é uma decisão de desenho ("esta habilidade
   exige encostar"), não um número baixo a ser consertado com 7 de ouro — a Lente
   de Âmbar na Dona Chinela daria à chinelada o alcance de um arqueiro. Para
   `alc:2` ou mais o item soma normalmente, porque aí ele está melhorando um tiro
   que já existe.

   O que isto abre, e é o ponto: a Dona Chinela é toda de perto e joga o chinelo
   de longe; o Gari varre a casa colada e sopra o redemoinho a três; o Coveiro
   arpoa longe, puxa e executa colado. Um kit passa a ter GEOMETRIA, e não só
   números. */
function alcDeHab(h,hb){
  const propria = hb && hb.alc;
  if(propria===undefined||propria===null) return alcTotal(h)+((hb&&hb.ef.alcExtra)||0);
  if(propria<=1) return 1+((hb.ef.alcExtra)||0);      // corpo a corpo não vira tiro
  return Math.min(ALCANCE_MAX, propria+bonus(h,"alc")+(h.alcTurno||0)+(hb.ef.alcExtra||0));
}
/* o maior alcance que este herói tem em ALGUMA habilidade — é o que a IA usa
   para decidir de quão longe vale se aproximar */
const alcanceUtil=h=>Math.max(...h.habs.map(hb=>alcDeHab(h,hb)));
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
/* HISTÓRIA, para o número não parecer arbitrário: a torre foi de 2 para 3 de
   vida na v0.5.1, quando o herói virou fonte de dano nela — com 2 a partida
   fechava em 10 rodadas, com 4 passava de 18. Esses três valeram até a v48, e a
   escala nova preserva exatamente o que aquele 3 protegia: 3 rodadas de cerco
   só com a onda. */
/* ---------- A TORRE PASSA A TER VIDA DE VERDADE (v48) ----------
   RELATO: *"está muito fácil derrubar torres"*. Até aqui a torre tinha 3 de
   vida e todo golpe de herói tirava exatamente 1 — três golpes, viesse de quem
   viesse, com o dado que fosse. A estrutura não comunicava resistência e não
   respondia a investimento: Poder, item e Ultimate não mudavam nada.

   A escala nova é 20, e ela foi escolhida para NÃO MUDAR O RELÓGIO DA ONDA:
   com `ONDA_GOLPE=7`, a onda continua levando exatamente 3 rodadas de cerco
   para derrubar uma torre cheia, 2 com a onda grossa e 1 no terceiro degrau —
   a mesma cadência da v47, medida e escolhida lá. O que muda é o golpe de
   HERÓI, que deixa de ser 1 fixo e passa a ser calculado.

   §49 do pedido, e é a régua deste bloco inteiro: a torre não pode virar
   esponja de HP. A resistência dela vem de quatro coisas juntas — vida,
   necessidade de creep, risco de aproximação e dano variável — e não de
   obrigar vinte golpes. */
const VIDA_TORRE=20, VIDA_NEXUS=3;
/* ---------- AS ONDAS ENGROSSAM (v47) ----------
   O relógio da partida, e ele existe por causa do HOTSEAT.

   A correção do defensor (ver `rotaDaPos`) foi medida com o agente quase-aleatório
   e com a IA, e nos dois a duração mal se moveu. Mas este jogo é jogador contra
   jogador no mesmo aparelho, e dois humanos que sabem que defender funciona jogam
   diferente dos dois. Medido com `sim/defesa.js estilo=pvp`, que é uma política
   curta e competente rodando dos DOIS lados:

     v46 (defensor não contava)      25,4 rodadas
     v47 sem relógio                 49,3 rodadas   ← quase o dobro

   Nenhuma partida travou — empate continua derrubando a torre, então turtle puro
   não existe. Mas 49 rodadas em hotseat são ~100 passagens de aparelho, e isso
   não é um jogo que alguém termina.

   O relógio resolve pelo lado certo: **a onda tira 1 a mais a cada 10 rodadas,
   até 3**. É simétrico (as duas ondas engrossam juntas), então não é uma
   alavanca para quem está na frente; e só morde partida longa, que é exatamente
   o caso que precisava de cura.

     rodadas 1–16    a onda tira 1
     rodadas 17–32   tira 2
     rodadas 33+     tira 3  — uma torre cheia cai numa rodada de cerco

   POR QUE 16, E NÃO UM RELÓGIO MAIS CURTO. Passo curto encurta mais, mas VAZA
   VANTAGEM DE ORDEM: a partida fica mais decisiva por rodada e quem joga primeiro
   colhe. Medido, e é reprodutível — duas execuções de 1500 partidas deram 54,6% e
   54,4% com passo 10, contra 51,6% sem relógio nenhum:

     passo   PvP (pior caso)   1ª torre vence   quem começa
     ─────   ───────────────   ──────────────   ───────────
     (sem)        49,3              66,7%          51,6%
      16          40,0              62,7%          52,9%   ← escolhido
      14          38,5              66,6%            —
      12            —                 —            54,7%
      10          34,3              65,4%          54,4%

   16 é o único que fica dentro da faixa histórica de "quem começa" (52,4% a
   53,2%, item 11 de DECISOES-PENDENTES) e ainda assim corta um terço do pior
   caso. Passo menor troca 5 rodadas por 1,5 ponto de desequilíbrio de ordem, e
   esse não é um câmbio que este projeto aceita sem o grupo decidir.

   E POR QUE O TETO É 3, e não 2: com teto 2 a duração empaca em ~41 rodadas
   qualquer que seja o passo. É o terceiro degrau — o que derruba uma torre cheia
   numa rodada de cerco — que de fato fecha a partida.

   MEDIDO E DESCARTADO no mesmo lugar: **torre com 2 de vida** em vez do relógio.
   Parecia a alavanca simples e é pior nos dois eixos (PvP 38,9 rodadas, bola de
   neve 67,0%). */
const ONDA_ENGROSSA=16, ONDA_MAX=3;
/* O DEGRAU continua sendo 1, 2 ou 3 — é ele que o relógio faz subir, e é ele
   que os testes e as variantes de medição conhecem. `ONDA_GOLPE` é só a
   conversão para a escala nova da torre: 1 degrau = 7 de vida = um terço de
   torre, exatamente o que valia antes de a torre ter 20. */
const ONDA_GOLPE=7;
const degrauDaOnda=()=>Math.min(ONDA_MAX,1+Math.floor((J.rodada-1)/ONDA_ENGROSSA));
const danoDaOnda=()=>degrauDaOnda()*ONDA_GOLPE;
/* ---------- O DEFENSOR PASSA A CONTAR (v47) ----------
   Relato: *"tá muito fácil ganhar o jogo só empurrando torre, tem que ter uma
   forma de defender mais efetiva"*. Medido com `sim/defesa.js`, 300 partidas:

     · **100%** das partidas terminavam com a onda dando o golpe final;
     · **17,7%** do dano em torre acontecia com a presença EMPATADA na rota;
     · quem derrubava a primeira torre vencia **76,3%** das vezes;
     · de 2408 viradas com torre sitiada, só **118** terminaram com o defensor
       tirando a onda de cima dela.

   O diagnóstico não é "a torre tem pouca vida", e não é o número do cerco. É que
   **o defensor não contava** — ver `rotaDaPos`, que é onde a correção mora.

   TRÊS REGRAS FORAM ESCRITAS E DUAS FORAM DESCARTADAS PELA MEDIÇÃO, e vale
   registrar porque as duas parecem obviamente boas:

     1. `defensor conta` — quem está encostado na Frente de Onda entra na conta
        de presença. **Ficou.** É correção de defeito, não ajuste de número;
     2. `empate segura` — a onda só machucaria a torre com presença estritamente
        maior. **Saiu**;
     3. `reparo` — torre ferida recuperaria 1 por rodada fora da onda. **Saiu**.

   Medido com `sim/defesa.js`, 800 partidas por build:

     só a (1)         35,0 rodadas · quem derruba a 1ª torre vence 66,3%
     (1) + (2)        37,4 rodadas · 70,0%

   As duas descartadas deixam a partida mais longa **e pioram a bola de neve**, e
   o motivo é o que não era óbvio: **defesa forte protege quem está na frente.**
   Quem lidera tem mapa para bancar o corpo a mais e continua sitiando; quem está
   atrás precisa de uma virada, e virada é ataque. Empilhar defesa cobrava
   justamente de quem precisava reagir.

   Ficam de pé, como sempre, as saídas que fazem a partida terminar: comprometer
   mais corpos numa rota, o **golpe de herói** (que ignora presença) e as **Ondas
   de Ferro** do Barão. O NEXUS não mudou — a fase final é a de sempre, com a
   Última Muralha. */
/* ---------- ESTRUTURA: O QUE ATINGE, E QUANTO (v48) ----------
   §38 e §39 do pedido: a classificação mora AQUI, num lugar só, e nunca num
   `if(heroi==="X" && alvo==="torre")`. Um herói novo entra declarando
   `estrutura` na habilidade; sem declarar nada, ele se comporta como todo
   mundo.

     · `podeAtingirEstrutura` — só habilidade de DANO e mirada em inimigo.
       Sangramento, Veneno, Atordoamento, Silêncio, Marca, cura, escudo, puxão e
       execução simplesmente não existem contra concreto: nenhum deles entra na
       conta, porque a conta só lê a parte de dano;
     · `estrutura` (multiplicador) — `0` tranca a habilidade contra estrutura,
       `1` é o padrão, acima de 1 é a habilidade explicitamente boa contra
       construção. Hoje ninguém declara nada: a vantagem contra estrutura
       aparece por mecânica, não por exceção — as Ultimates PERFURANTES ignoram
       a armadura da torre pelo mesmo motivo que ignoram a de um herói;
     · `ARM_ESTRUTURA` — a torre é de concreto. Ela não tem escudo, nem status,
       nem condição: tem armadura, e é ela que faz um golpe fraco arranhar e um
       golpe grande abrir buraco. O 5 saiu de varredura (`node sim/torres.js 60
       dificil arm=N`), com a IA de verdade nos dois lados:

         arm   1ª torre cai   torres/partida   duração
         ───   ────────────   ──────────────   ───────
         (v47)   rodada 5          7,8           30
          3      rodada 6          7,8           35
          5      rodada 8          7,0           35   ← escolhido
          7      rodada 9          6,5           36

       Com 3 a torre volta a cair como caía; com 7 o golpe fraco vira 1 de 20 e
       a estrutura começa a virar esponja, que é o que §49 proíbe. */
const ARM_ESTRUTURA=5;
const DANO_ESTRUTURA_MIN=1;   /* nem o golpe mais fraco bate em nada */
const REVIDE_TORRE=4;         /* o pedágio de quem encosta e bate */
/* O DISPARO AUTOMÁTICO da torre no fim do turno, contra quem ficou colado nela
   sem creep. Não gasta dado, ação, carta nem recurso de ninguém: é reação da
   estrutura (§45). E NÃO MATA — deixa em 1, exatamente como o revide sempre
   fez. A regra da casa é antiga e continua valendo: `mata()` precisa de um
   autor para creditar o ouro, e morte sem autor é buraco de motor. Na prática a
   torre não rouba o abate, ela ARMA o abate: quem mergulhou sozinho termina o
   turno em 1 de vida, à mão de qualquer inimigo. */
const TIRO_TORRE=5;
/* "PERTO DA TORRE" (§41). Um hexágono — a MESMA régua que já existia no jogo
   para o +1 de Armadura de quem defende junto da própria torre
   (`sobTorreAmiga`). Não inventamos alcance novo: a zona de proteção e a zona
   de ameaça são a mesma casa, vistas dos dois lados. */
const ZONA_TORRE=1;
const ARIETE_MULT=2;       /* Aríete do Barão: o golpe de herói em torre vale o dobro */
const podeAtingirEstrutura=hb=>
  !!(hb.ef.dano||hb.ef.danoFixo)&&hb.alvo==="in"&&hb.ef.estrutura!==0;
const multEstrutura=hb=>hb.ef.estrutura===undefined?1:hb.ef.estrutura;
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
/* os dois de time moram aqui, junto do neutro: eram declarados 600 linhas
   abaixo, longe dos outros acampamentos, e a lista de hexágonos bloqueados
   (que precisa saber onde eles estão para não bloqueá-los) não os enxergava */
const CAMP_AZUL=[3,4];
const CAMP_CARMIM=gira(...CAMP_AZUL);
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

/* ---------- ROTAÇÃO DO CAÇADOR ----------
   No início de cada rodada os DOIS jogadores escolhem, escondido um do outro,
   PARA QUE REGIÃO o próprio Caçador vai: Topo, Meio, Baixo ou Selva. Ele é
   reposicionado na hora, sempre DENTRO DA SELVA, na parte dela colada à região
   escolhida — nunca dentro da rota.

   AVISO DE HISTÓRIA, e ele precisa ser lido antes de mexer aqui. A v18 teve uma
   rotação em que o Caçador SAÍA DO TABULEIRO e reaparecia noutra entrada de
   selva; a v19 a desfez, por correção do Vinicius — a peça tem de continuar
   existindo num lugar real, e o que muda é quem enxerga. Da v28 até a v37 a
   rotação era ANDAR: até 3 casas de graça na direção do destino, interceptável.

   Esta versão volta a reposicionar de imediato, a pedido do Vilker (v38). A
   diferença para a v18 — e é ela que mantém a correção do Vinicius de pé — é que
   o Caçador NUNCA sai do tabuleiro: ele deixa uma casa real e ocupa outra casa
   real no mesmo instante, continua bloqueando passagem, continua coletando
   acampamento e continua aparecendo ao sair do mato. O que ele deixa de ser é
   interceptável no caminho, porque caminho não há mais.

   A ocultação não é ficha nem declaração: é a névoa. A casa de pouso é sempre
   mato, e mato só se enxerga de dentro. Quem quiser saber onde o Caçador
   inimigo caiu põe ward lá — a informação está presa à POSIÇÃO, nunca ao botão
   que o outro apertou. */

/* ---------- OS QUATRO PONTOS DA SELVA ----------
   Derivados da planta existente, nunca escritos à mão: mudou o mapa, eles se
   recolocam sozinhos. O mapa NÃO é alterado para caber a mecânica.

   Cada time tem os seus quatro, e os do time 1 são o ESPELHO dos do time 0 —
   escritos uma vez, girados uma vez, como manda o resto do arquivo. Fazer a
   conta duas vezes daria dois resultados diferentes no desempate e a simetria
   morreria sem ninguém ver.

   POR QUE POR TIME. "A selva mais perto do Topo" não quer dizer nada sozinha: a
   rota de cima atravessa o mapa inteiro, e a casa mais perto dela existe dos
   dois lados do rio. Sem âncora de time, escolher "Topo" jogaria um dos dois
   Caçadores dentro da selva do adversário todas as rodadas.

   · topo / meio / baixo — a casa de mato colada na rota (primeiro critério) e,
     entre as coladas, a mais perto do VÃO NEUTRO daquela rota, que é onde ela é
     disputada. É o ponto de onde se sai para o gank.
   · selva — o CENTRO da própria selva: a casa que minimiza a distância até a
     mais longe das três âncoras de rota. É o entroncamento de onde se alcança
     qualquer rota, e é para lá que se olha o poço. Medir pelo centro do
     TABULEIRO foi tentado primeiro e caía sempre na mesma casa da âncora do
     meio — quatro botões e três lugares. As âncoras de rota ficam de fora da
     disputa por construção, então "Selva" nunca repete "Meio".

   O ESPELHO TROCA TOPO POR BAIXO. `gira` leva a rota de cima na de baixo
   (`L_BOT` é literalmente `L_TOPO` girada), então o espelho da âncora de topo do
   time 0 é a âncora de BAIXO do time 1. Espelhar topo em topo colocava a âncora
   do time 1 a seis casas da rota que ela deveria vigiar — foi o primeiro
   resultado impresso desta função, e o motivo desta nota existir. */
const _MATO_P=[...MATO].map(s=>{const[c,r]=s.split(",").map(Number);return[c,r];});
const _meuLado=(p,t)=>_distBase(p,t)<_distBase(p,1-t);
const _distCorredor=(p,nome)=>Math.min(...CORREDOR[nome].map(q=>dist(...p,...q)));
const _ancoraRota=(nome,t)=>{
  const vao=ROTAS[nome][centroRota(nome)];
  return _MATO_P.filter(p=>_meuLado(p,t))
    .sort((a,b)=>_distCorredor(a,nome)-_distCorredor(b,nome)
              || dist(...a,...vao)-dist(...b,...vao)
              || a[0]-b[0] || a[1]-b[1])[0]||null;
};
const _ancoraSelva=(t,rotas)=>{
  const alvos=Object.values(rotas).filter(Boolean);
  const usados=new Set(alvos.map(p=>k(...p)));
  const raio=p=>alvos.length?Math.max(...alvos.map(q=>dist(...p,...q))):0;
  return _MATO_P.filter(p=>_meuLado(p,t)&&!usados.has(k(...p)))
    .sort((a,b)=>raio(a)-raio(b)
              || dist(...a,..._MEIO_TAB)-dist(...b,..._MEIO_TAB)
              || a[0]-b[0] || a[1]-b[1])[0]||null;
};
const SELVA_PONTOS=(()=>{
  const meu={topo:_ancoraRota("topo",0), meio:_ancoraRota("meio",0), baixo:_ancoraRota("baixo",0)};
  meu.selva=_ancoraSelva(0,meu);
  const esp=p=>p?gira(...p):null;
  /* topo↔baixo na virada: ver a nota do espelho, acima */
  const dele={topo:esp(meu.baixo), meio:esp(meu.meio),
              baixo:esp(meu.topo), selva:esp(meu.selva)};
  return [meu,dele];
})();

/* ---------- HEXÁGONOS BLOQUEADOS ----------
   Direção de arte, item 4 e 5 (ver docs/DIRECAO-DE-ARTE.md): algumas casas da
   selva são fisicamente bloqueadas. Herói não entra nem atravessa. Elas existem
   para a selva deixar de ser um campo aberto e virar CORREDOR — entrada, atalho,
   caminho de Caçador, lugar de emboscada.

   O obstáculo é o próprio hexágono, e ele conta a história do mundo: ônibus
   abandonado, carros empilhados, caixa-d'água sobre laje. Nada de pedra genérica.

   NÃO MUDA A PLANTA. Nenhum hexágono nasce, some ou troca de lugar; o que muda é
   quais casas são caminháveis. A geometria continua sendo a da versão 2D — item
   1 da direção de arte.

   COMO SÃO ESCOLHIDAS, e por que não estão escritas à mão:
   · só mato — rota, base, rio e poço nunca bloqueiam;
   · nunca um ponto de pouso do Caçador, nunca um acampamento (incluindo os DOIS
     lados possíveis do neutro, porque o lado é sorteado por partida e a lista
     aqui é fixa), nunca o poço nem vizinha dele;
   · escritas para um lado e ESPELHADAS para o outro, como todo o resto do mapa;
   · nunca encostadas umas nas outras — obstáculo isolado vira contorno,
     obstáculo em fila vira muralha;
   · e as duas travas que importam: o tabuleiro continua inteiro (toda casa
     alcança toda casa) e a SELVA continua com as mesmas duas regiões que já
     tinha. Bloquear a casa errada partia a selva em ilhas e o Caçador ficava
     preso no próprio quintal — aconteceu na primeira tentativa, com `[2,5]`.

   A ordem de preferência é o grau: casa com mais vizinhas de mato está no meio
   de um bolsão aberto, e é bloqueando ela que o bolsão vira corredor.

   O alvo é BLOQUEIOS_ALVO por lado, mas a lista satura sozinha antes disso — com
   as travas acima, o mapa 11×11 comporta 3 pares. Aumentar o alvo não força mais
   bloqueio; afrouxar as travas, sim, e é aí que a selva se parte. */
const BLOQUEIOS_ALVO=3;
const OBSTACULOS_TIPOS=["onibus","carros","caixadagua"];
const _BLOQ=(()=>{
  const proibidas=new Set([
    ...[0,1].flatMap(t=>Object.values(SELVA_PONTOS[t]).filter(Boolean).map(p=>k(...p))),
    ...CAMP_NEUTRO_LADOS.map(p=>k(...p)),
    k(...CAMP_AZUL), k(...gira(...CAMP_AZUL)),
    POCO_K, ...vizinhos(...POCO).map(p=>k(...p))
  ]);
  const grau=p=>vizinhos(...p).filter(v=>MATO.has(k(...v))).length;
  /* componentes do grafo de MATO, ignorando as bloqueadas */
  const comps=bloq=>{
    const livres=_MATO_P.filter(p=>!bloq.has(k(...p)));
    const vis=new Set(); let n=0;
    for(const p0 of livres){
      if(vis.has(k(...p0)))continue;
      n++; const f=[p0]; vis.add(k(...p0));
      while(f.length){ const p=f.pop();
        vizinhos(...p).forEach(v=>{ const kk=k(...v);
          if(MATO.has(kk)&&!bloq.has(kk)&&!vis.has(kk)){ vis.add(kk); f.push(v); } }); }
    }
    return n;
  };
  /* tabuleiro inteiro alcançável a pé */
  const inteiro=bloq=>{
    const todas=[];
    for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++)
      if(noTab(c,r)&&!bloq.has(k(c,r))) todas.push([c,r]);
    if(!todas.length) return false;
    const vis=new Set([k(...todas[0])]); const f=[todas[0]];
    while(f.length){ const p=f.pop();
      vizinhos(...p).forEach(v=>{ const kk=k(...v);
        if(!bloq.has(kk)&&!vis.has(kk)){ vis.add(kk); f.push(v); } }); }
    return vis.size===todas.length;
  };
  const COMPS0=comps(new Set());
  const bloq=new Set(); const tipos={}; let i=0;
  const candidatas=_MATO_P
    .filter(p=>!proibidas.has(k(...p))&&_meuLado(p,0))
    .sort((a,b)=>grau(b)-grau(a)||a[0]-b[0]||a[1]-b[1]);
  for(const p of candidatas){
    if(i>=BLOQUEIOS_ALVO)break;
    const e=gira(...p);
    if(!MATO.has(k(...e))||proibidas.has(k(...e)))continue;
    if(bloq.has(k(...p))||bloq.has(k(...e)))continue;
    const encosta=q=>vizinhos(...q).some(v=>bloq.has(k(...v)));
    if(encosta(p)||encosta(e))continue;
    const tent=new Set([...bloq,k(...p),k(...e)]);
    if(!inteiro(tent)||comps(tent)!==COMPS0)continue;
    bloq.add(k(...p)); bloq.add(k(...e));
    const tipo=OBSTACULOS_TIPOS[i%OBSTACULOS_TIPOS.length];
    tipos[k(...p)]=tipo; tipos[k(...e)]=tipo;
    i++;
  }
  return {set:bloq,tipos};
})();
const BLOQUEADO=_BLOQ.set;
const OBSTACULO=_BLOQ.tipos;                 /* casa → que coisa está ali */
const ehBloqueado=(c,r)=>BLOQUEADO.has(k(c,r));

/* ---------- DISTÂNCIA ANDANDO ----------
   `dist` continua sendo a distância em linha reta e continua valendo para
   ALCANCE DE HABILIDADE — o ônibus para o pé, não o tiro. Para andar, a régua
   passa a ser esta: busca em largura que CONTORNA o hexágono bloqueado.

   Sem isto o obstáculo seria enfeite. O movimento deste jogo sempre foi por
   distância, não por caminho: `calcula` aceitava qualquer casa dentro do
   alcance e `moveAte` levava direto. O herói simplesmente passaria por cima do
   ônibus, e "corredor" não existiria em regra nenhuma.

   Herói NÃO bloqueia caminho — só o obstáculo. Continua valendo que se passa por
   cima de aliado e de inimigo; o que mudou é que não se passa por cima de casa
   bloqueada. Era assim antes para todo mundo e continua assim para gente. */
function passosDe(de){
  const d=new Map([[k(...de),0]]);
  let borda=[de];
  while(borda.length){
    const prox=[];
    for(const p of borda){
      const n=d.get(k(...p))+1;
      for(const v of vizinhos(...p)){
        const kk=k(...v);
        if(BLOQUEADO.has(kk)||d.has(kk))continue;
        d.set(kk,n); prox.push(v);
      }
    }
    borda=prox;
  }
  return d;
}
/* quantos passos de `de` até `ate`, contornando obstáculo — `null` se não há caminho */
const passosAte=(de,ate)=>{ const v=passosDe(de).get(k(...ate)); return v===undefined?null:v; };
/* ---------- AS QUATRO REGIÕES, E O QUE CADA UMA PAGA ----------
   O bônus voltou na v46, e voltou DIFERENTE do que existia até a v37.

   O que havia antes eram quatro DESTINOS com prêmio (acampamento próprio,
   neutro, inimigo, poço), e o prêmio só era pago se o Caçador CHEGASSE lá — ele
   andava alguns passos por rodada e o bônus ficava pendurado no meio do caminho.
   Saiu junto com os destinos, quando a escolha virou região e o reposicionamento
   passou a ser imediato.

   Agora o bônus é **momentâneo e pago na hora**: ele entra no instante da
   escolha, junto com o reposicionamento, e vale **até o início do próximo turno
   do dono** — a mesma âncora de escudo, buff e prisão (ver `expiraDoTime`), pela
   mesma razão de sempre: dá exatamente um turno adversário de exposição a quem
   joga primeiro e a quem joga em segundo.

   Cada região paga o que aquela parte do mapa PEDE, e é isso que transforma a
   escolha numa leitura em vez de um menu:

     ▲ Topo   — a rota do duelo longo. Armadura, para aguentar a troca.
     ◆ Meio   — a rota curta, onde o gank mata. Poder, para fechar.
     ▼ Baixo  — a rota do investimento, com dois heróis e a maior renda. Ouro.
     ❦ Selva  — o quintal dele: cura e movimento, para farmar e circular.

   Nenhum deles dá dano de graça nem visão: o Caçador continua pagando o preço
   de estar longe da rota que escolheu não vigiar. */
const BONUS_REGIAO={
  topo:  {arm:2},
  meio:  {poder:2},
  baixo: {ouro:OURO_REGIAO},
  selva: {cura:4, mov:1},
  /* CONTINUAR ONDE ESTÁ não paga bônus, e a entrada vazia é obrigatória:
     `pagaBonusRegiao` sai cedo quando não acha a região, e sair cedo deixaria
     `J.bonusPend` preso — o time pagaria o bônus da rodada seguinte duas vezes.
     O prêmio desta opção é POSICIONAL: o Caçador não é teleportado, e quem já
     estava em cima do acampamento, do poço ou do gank continua lá. */
  ficar: {}
};
const REGIOES=[
  {id:"topo",  n:"Topo",  ico:"▲", d:"A selva colada na rota de cima.",
   b:"+2 de Armadura no seu turno"},
  {id:"meio",  n:"Meio",  ico:"◆", d:"A selva colada na rota do meio.",
   b:"+2 de Poder no seu turno"},
  {id:"baixo", n:"Baixo", ico:"▼", d:"A selva colada na rota de baixo.",
   /* o texto vem da constante: quando OURO_REGIAO mudou de 3 para 6 na v48,
      esta linha ficou dizendo "+3" na tela da rotação — número escrito à mão
      não acompanha número de regra */
   b:`+${OURO_REGIAO} de ouro, na hora`},
  {id:"selva", n:"Selva", ico:"❦", d:"O centro da sua selva, de frente para o poço.",
   b:"cura 4 e +1 no Dado Mestre"},
  /* A QUINTA OPÇÃO. Ela não é uma região: é a recusa de escolher uma.
     `fica:1` é o que o resto do motor consulta — nada de comparar com a string
     solta em quatro lugares. Não tem ponto de pouso em SELVA_PONTOS, e é de
     propósito: reposicionar é exatamente o que ela não faz. */
  {id:"ficar", n:"Continuar onde está", ico:"⊙", fica:1,
   d:"Ele não é reposicionado: fica exatamente na casa em que parou.",
   b:"nenhum bônus — o que você leva é a posição"}
];
const REGIAO=Object.fromEntries(REGIOES.map(r=>[r.id,r]));
const cacadorDe=t=>J.times[t].herois.find(h=>!h.morto&&CATALOGO[h.id].pos==="selva");

/* Casa onde o Caçador PODE pousar: dentro do tabuleiro, dentro da selva e vazia.
   `MATO` já é o que sobra depois de base, poço, corredor de rota e rio — então
   uma casa de mato nunca é rota, nunca é base e nunca é estrutura. A própria
   casa do Caçador conta como livre: escolher a região onde ele já está não pode
   falhar por ele estar no lugar. */
const casaDeSelvaLivre=(p,h)=>{
  if(!noTab(...p)||!MATO.has(k(...p))||BLOQUEADO.has(k(...p)))return false;
  const o=em(...p);
  return !o||o===h;
};
/* O ponto preferencial da região; se estiver ocupado ou inválido, a casa de
   selva válida mais próxima DENTRO DA MESMA REGIÃO (o próprio lado). Só se o
   lado inteiro estiver tomado é que aceita qualquer mato — cinco heróis não
   enchem dezenove casas, mas travar a partida por isso seria pior que o desvio. */
function pousoNaSelva(t,regiao,h){
  const alvo=SELVA_PONTOS[t]&&SELVA_PONTOS[t][regiao];
  if(!alvo)return null;
  if(casaDeSelvaLivre(alvo,h))return alvo;
  const perto=l=>l.sort((a,b)=>dist(...a,...alvo)-dist(...b,...alvo)||a[0]-b[0]||a[1]-b[1])[0]||null;
  const livres=_MATO_P.filter(p=>casaDeSelvaLivre(p,h));
  return perto(livres.filter(p=>_meuLado(p,t)))||perto(livres);
}

/* O reposicionamento. Sem animação de percurso de propósito: não há percurso, e
   uma animação deslizando pelo mapa entregaria a casa de pouso a quem não tem
   visão dela. */
function reposicionaCacador(t,regiao){
  if(!REGIAO[regiao])return null;
  const h=cacadorDe(t);
  if(!h)return null;
  /* CONTINUAR ONDE ESTÁ. Devolve a casa atual e não escreve em `h.pos`: o
     pedido foi literal — *"não executar movimentação automática apenas porque
     essa opção foi escolhida"*. Devolver a posição (em vez de `null`) importa
     porque `null` é o código de "não coube em lugar nenhum", e o resto do motor
     lê os dois de maneiras diferentes. */
  if(REGIAO[regiao].fica) return [...h.pos];
  const destino=pousoNaSelva(t,regiao,h);
  if(!destino)return null;
  h.pos=[...destino];
  return destino;
}
/* A escolha e o reposicionamento são a mesma coisa, e é isto que o resto do
   motor chama. NADA vai para o log: o log é lido pelos dois jogadores, e uma
   linha dizendo "o Caçador foi para o Topo" entregaria de graça exatamente a
   informação que a névoa existe para cobrar. Quem escolheu já sabe — clicou. */
function escolheRotacao(t,regiao){
  if(!REGIAO[regiao])return null;
  J.rotacao[t]=regiao;                 /* registro da rodada; ninguém desenha */
  const onde=reposicionaCacador(t,regiao);
  /* O BÔNUS FICA PENDENTE, e é pago no INÍCIO DO TURNO DO DONO — não aqui.

     Pagar na hora da escolha parecia certo e estava errado: a rotação acontece na
     virada da rodada, e a primeira coisa que `iniciaTurno` faz é `expiraDoTime`,
     que limpa buff. O +2 de Armadura e o +2 de Poder nasciam na virada e morriam
     no instante em que o dono ia usá-los — os dois bônus eram letra morta, e só
     ouro e cura (que não são buff) chegavam à mesa.

     Medido antes de achar isto: com o bônus ligado, "quem começa" foi a 53,8% e
     54,5%; com `bonusrot=off`, a 51,7%. A diferença vinha inteira de ouro e cura,
     porque os outros dois nunca existiram. */
  J.bonusPend[t]=regiao;
  return onde;
}
/* O bônus da região, pago no instante da escolha.

   SEGREDO, como o resto da rotação: nada disto vai para o `log`, que em hotseat
   é lido pelos dois. O dono vê o efeito na ficha do próprio Caçador; o
   adversário descobre do jeito que descobre tudo nesta mecânica — encontrando a
   peça. Foi o mesmo cuidado que a v38 teve com a posição, e vale igual para o
   bônus: dizer "o Caçador dele ganhou Armadura" é dizer "ele foi para o topo".

   `aplicaBuff` e não `h.arm+=`: o buff precisa saber se desfazer sozinho em
   `expiraDoTime`, e mexer no campo direto é justamente o erro que o CLAUDE.md
   proíbe. Ouro e cura são pagos na hora e não expiram — não são buff, são renda
   e sustento. O movimento entra no Dado Mestre do TIME, e só se a rodada dele
   ainda não tiver rolado (senão pagaria uma rodada atrasado). */
function pagaBonusRegiao(t,regiao){
  const h=cacadorDe(t), b=BONUS_REGIAO[regiao];
  if(!h||!b)return;
  J.bonusPend[t]=null;
  if(b.arm)   aplicaBuff(h,"arm",b.arm);
  if(b.poder) aplicaBuff(h,"poder",b.poder);
  if(b.ouro)  h.ouro+=b.ouro;
  if(b.cura&&!h.semCura) h.vida=Math.min(h.vidaMax,h.vida+b.cura);
  if(b.mov)   J.times[t].movRegiao=(J.times[t].movRegiao||0)+b.mov;
  h.bonusRegiao=regiao;                /* só para a ficha do dono mostrar */
}

/* A escolha, no início da rodada. Os dois escolhem ANTES de qualquer um jogar, e
   um não vê o do outro — é a aposta às cegas que dá sal à mecânica. Em hotseat
   isso são duas telas em sequência; contra a IA, só a do humano.
   A escolha só aparece se o time ainda TEM Caçador vivo: pedir aposta a quem não
   tem peça para mover é pedir clique por nada. */
/* `depois` é a CONTINUAÇÃO da virada de rodada, e é a correção do defeito que o
   Vilker relatou: *"a escolha da posição do jungle é no início da RODADA, não do
   turno"*. Ela já era chamada no início da rodada — o problema era de SEQUÊNCIA.
   `abreRotacoes` abre tela assíncrona, mas `fimDaRodada` seguia na mesma pilha
   até `faseOculta`, que rola os dados e COMEÇA O TURNO. Na prática o turno
   começava por baixo da tela de escolha: quem escolhia já estava jogando.

   Agora o resto da virada é este `depois`, e ele só roda quando os dois lados
   responderem (em hotseat são duas telas em sequência). Enquanto a fila não
   fecha, `J.fase` continua fora de "jogando" e `mesaTravada()` segura a mesa. */
function abreRotacoes(depois){
  const segue=()=>{ if(typeof depois==="function") depois(); else pinta(); };
  if(!J||J.fim!==null)return segue();
  J.rotacao=[null,null];
  const humanos=[0,1].filter(t=>!(simMode||(aiMode&&t===1)));
  [0,1].forEach(t=>{ if(!humanos.includes(t)&&cacadorDe(t)) escolheRotacao(t,iaEscolheRotacao(t)); });
  const fila=humanos.filter(t=>cacadorDe(t));
  if(!fila.length) return segue();
  perguntaRotacao(fila,0,segue);
}

/* O relógio. A partida NUNCA pode ficar parada esperando esta decisão — sem
   escolha em ROTACAO_SEGUNDOS, a Selva é escolhida sozinha e o jogo segue. */
const ROTACAO_SEGUNDOS=10;
let _rotRelogio=null;
function paraRelogioRotacao(){ if(_rotRelogio){ clearInterval(_rotRelogio); _rotRelogio=null; } }
function perguntaRotacao(fila,i,depois){
  paraRelogioRotacao();
  if(i>=fila.length){ if(typeof depois==="function") depois(); else pinta(); return; }
  const t=fila[i], h=cacadorDe(t);
  if(!h) return perguntaRotacao(fila,i+1,depois);
  const bts=REGIOES.map(r=>
    `<button class="grande rotCac" data-r="${r.id}" style="font-size:15px;padding:12px;text-align:left">
      ${r.ico} ${r.n}<br><span style="font-size:12.5px;opacity:.8">${r.d}</span>
      <br><span class="rotB">✦ ${r.b}</span></button>`).join("");
  const legenda=s=>`Escolha em <b>${s}</b>s — sem escolha, ele vai para a Selva`;
  abre(`<span class="et">Rotação do Caçador · rodada ${J.rodada}</span>
    <h2 class="t${t}">${NOMES[t]}: para que região vai ${h.n}?</h2>
    <p>Ele reaparece <b>dentro da selva</b>, na parte dela colada à região escolhida —
    <b>nunca dentro da rota</b>. O outro jogador <b>não vê</b> a sua escolha: para saber
    onde ele caiu é preciso ter visão daquele mato.</p>
    <p><b>Continuar onde está</b> não é uma região: ele <b>não sai do lugar</b> e não
    ganha bônus nenhum. Serve para quando a casa em que ele parou já vale mais que
    qualquer reposicionamento — em cima do acampamento, colado no poço ou de tocaia.</p>
    <p>Cada região paga um <b style="color:var(--brass)">bônus momentâneo</b>, que entra no
    <b>seu turno desta rodada</b> e vale só ele — não é prêmio por chegar, é o que aquela
    parte do mapa pede de quem vai para lá.</p>
    <p id="rotRel" style="opacity:.8;font-size:13px">${legenda(ROTACAO_SEGUNDOS)}</p>${bts}`);
  const escolhe=(id,porTempo)=>{
    paraRelogioRotacao(); fecha();
    escolheRotacao(t,id);
    if(porTempo) toast(`Tempo esgotado — ${h.n} foi para o centro da Selva`,"aviso");
    else toast(`${REGIAO[id].n} · ${REGIAO[id].b}`,"");
    perguntaRotacao(fila,i+1,depois);
  };
  G("telacx").querySelectorAll(".rotCac").forEach(b=>b.onclick=()=>escolhe(b.dataset.r,false));
  let resta=ROTACAO_SEGUNDOS;
  _rotRelogio=setInterval(()=>{
    if(!J||J.fim!==null){ paraRelogioRotacao(); return; }
    const el=G("rotRel");
    if(!el){ paraRelogioRotacao(); return; }   /* a tela saiu por outro caminho */
    resta--;
    if(resta<=0) return escolhe("selva",true);
    el.innerHTML=legenda(resta);
  },1000);
}

/* A IA escolhe pelo ESTADO DO MAPA, e obedece à mesma névoa que o humano: só
   entram na conta os inimigos que ela de fato enxerga (`visivelPara`). Uma IA
   que lesse o mapa inteiro daria gank perfeito em herói escondido e a névoa
   deixaria de ser jogo para quem joga contra ela.

   Não é uma IA nova — é uma nota por região, no mesmo estilo do resto do
   arquivo: inimigo exposto perto do ponto de pouso puxa gank, aliado por perto
   soma porque gank de um só não fecha, torre própria ferida puxa defesa, e o
   poço puxa a Selva com peso maior quando o morador é o Barão. */
function iaEscolheRotacao(t){
  const h=cacadorDe(t);
  if(!h) return "selva";
  /* o Aprendiz aposta no acaso — e é aposta de verdade, não sabotagem: às vezes
     acerta a região certa, como quem ainda não leu o mapa */
  if(!IA().rotacaoBoa) return REGIOES[Math.floor(Math.random()*REGIOES.length)].id;
  const inimigos=J.times[1-t].herois.filter(x=>!x.morto&&visivelPara(x,t));
  const aliados=J.times[t].herois.filter(x=>!x.morto&&x!==h);
  const nota=id=>{
    /* CONTINUAR ONDE ESTÁ (§4 do pedido). A regra que a IA aplica é a mesma das
       regiões, só que medida DE ONDE ELE JÁ ESTÁ: inimigo exposto ao alcance
       dele, aliado por perto para fechar o gank, poço colado, acampamento
       maduro na mão. Se não houver nada disso à volta, ficar vale zero e
       qualquer região ganha — que é o comportamento certo para um Caçador
       parado no mato sem nada acontecendo.

       O alcance de medição é 3 e não 1: rotação acontece ANTES do turno, então
       o que importa não é o que ele alcança agora, é o que ele alcança depois
       de andar. Três casas é o que um Caçador percorre com um Dado Mestre
       mediano. */
    if(REGIAO[id]&&REGIAO[id].fica){
      let s=0, presas=0;
      inimigos.filter(x=>dist(...x.pos,...h.pos)<=3).forEach(x=>{
        presas++;
        s+=3;
        /* O GANK QUE JÁ ESTÁ ENCOSTADO VALE MAIS. Sem esta linha, a nota da
           região empatava com a de ficar sempre que a presa estivesse perto de
           uma rota — e a IA trocava um alvo colado no Caçador por um ponto de
           pouso a quatro casas dele. A régua da região é "tem inimigo naquela
           rota"; a de ficar é "tem inimigo AQUI", e as duas coisas não valem o
           mesmo. */
        if(dist(...x.pos,...h.pos)<=1) s+=3;
        s+=Math.round(3*(1-Math.max(0,x.vida)/x.vidaMax));   /* ferido vale mais */
        if(!sobTorreAmiga(x)) s+=2;                          /* longe da torre dele */
      });
      /* O aliado só soma se houver PRESA. Na primeira versão ele somava sozinho,
         e como o Caçador nasce ao lado dos próprios quatro companheiros, "ficar"
         começava a partida valendo 8 sem nada acontecer — a IA plantava o
         Caçador na base e nunca mais girava. Aliado é o que fecha o gank; sem
         alvo, ele não é motivo para nada. */
      if(presas) s+=aliados.filter(x=>dist(...x.pos,...h.pos)<=3).length*2;
      if(J.poco.vida>0&&dist(...h.pos,...POCO)<=3) s+=(J.poco.id==="barao"?6:3);
      if(J.camps.some(c=>c.ativo&&!c.respawn&&dist(...c.pos,...h.pos)<=2)) s+=2;
      /* Caçador quase morto não fica: ele não tem o que fazer com a posição, e
         a Selva ainda cura 4. */
      if(h.vida<h.vidaMax*0.4) s-=4;
      return s;
    }
    const a=SELVA_PONTOS[t][id];
    if(!a) return -99;
    if(id==="selva"){
      let s=2;                                        /* piso: a selva sempre serve */
      if(J.poco.vida>0){
        s+=(J.poco.id==="barao"?6:3);                 /* o Barão vale a rodada inteira */
        s+=aliados.filter(x=>dist(...x.pos,...POCO)<=4).length;  /* objetivo é de grupo */
      }
      const neutro=J.camps.find(c=>c.t===-1);
      if(neutro&&!em(...neutro.pos)) s+=1;
      return s;
    }
    /* A nota da rota é medida NA ROTA, não no ponto de pouso. Os quatro pontos
       ficam a poucas casas uns dos outros — medir "inimigo perto do pouso"
       fazia a mesma isca contar para duas regiões, e o desempate alfabético
       decidia o gank. `naRota` é inequívoco: ou o herói está no corredor
       daquela rota, ou está colado nele. */
    const naRota=p=>_distCorredor(p,id)<=1;
    let s=0;
    inimigos.filter(x=>naRota(x.pos)).forEach(x=>{
      s+=3;
      s+=Math.round(3*(1-Math.max(0,x.vida)/x.vidaMax));   /* ferido vale mais */
      if(!sobTorreAmiga(x)) s+=2;                          /* longe da torre dele */
    });
    s+=aliados.filter(x=>naRota(x.pos)).length*2;          /* gank de um só não fecha */
    const minhas=J.torres.filter(x=>x.rota===id&&x.t===t&&x.vida>0);
    if(minhas.some(x=>x.vida<VIDA_TORRE)) s+=2;            /* a minha torre apanhando */
    return s;
  };
  return REGIOES.map(r=>r.id).sort((x,y)=>nota(y)-nota(x)||x.localeCompare(y))[0];
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
/* Compatibilidade: `DOTS` era o registro das duas condições que existiam antes da
   v45. Continua apontando para as mesmas duas entradas do registro central, para
   que zona, log e teste antigo não precisem saber que a casa mudou de dono. */
const DOTS={
  sangramento:{n:"sangramento",   selo:CONDS.sangramento.selo, ico:CONDS.sangramento.ico},
  veneno:     {n:"envenenamento", selo:CONDS.veneno.selo,      ico:CONDS.veneno.ico}
};

/* ═══════════════════════════════════════════════════════════════════
   O SISTEMA CENTRAL DE CONDIÇÕES (v45)
   ═══════════════════════════════════════════════════════════════════
   Uma porta para aplicar, uma para processar, uma para consultar. O registro é
   `CONDS`, em data/catalogo.js — quem quiser condição nova escreve lá e não
   toca em nada daqui.

   A LIÇÃO QUE ESTE ARQUIVO JÁ APRENDEU DUAS VEZES e que vale aqui de novo:
   estado derivado não desatualiza, sinalizador desatualiza. Por isso a condição
   é um ITEM NUMA LISTA com prazo próprio, e não um campo booleano que alguém
   precisa lembrar de zerar. `h.conds` é a única verdade; `estaAtordoado`,
   `temCond` e os indicadores todos leem dela.

   O CICLO, e ele é assimétrico de propósito:
     início do turno do portador → cobra o dano (sangramento, veneno, estouro)
     fim    do turno do portador → gasta a duração / gasta 1 acúmulo
   Cobrar e gastar no mesmo instante fazia `atordoado por 1 turno` não atordoar
   nada: ele nascia, era cobrado e morria antes de o jogador tentar agir. */

const condsDe=h=>(h.conds||(h.conds=[]));
const condDe=(h,t)=>(h.conds||[]).find(c=>c.t===t)||null;
const temCond=(h,t)=>!!condDe(h,t);
const stacksDe=(h,t)=>{ const c=condDe(h,t); return c?(c.st||c.tu||0):0; };
const condsMalignas=h=>condsDe(h).filter(c=>CONDS[c.t]&&CONDS[c.t].mal);

/* CONTROLE é a família que a Tenacidade responde, e `preso` entra nela mesmo
   sendo campo antigo — o jogador não distingue "estou preso" de "estou lento"
   por qual variável guarda o quê. */
const ehControle=t=>t==="preso"||(CONDS[t]&&CONDS[t].ctrl);

/* Aplica (ou renova) uma condição. É a ÚNICA porta.
   `st` acumula, `tu` renova pelo maior — a distinção é do registro, não do
   chamador: quem aplica só diz quanto quer. */
function aplicaCond(alvo,t,{st=0,tu=0,dono=null,quieto=false}={}){
  if(!alvo||alvo.morto||!CONDS[t])return false;
  const d=CONDS[t];
  /* alvo que não é herói (o morador do poço) só aceita o que faz sentido nele:
     ele não anda, não age e não tem ficha. Regra explícita, §39 do desenho. */
  if(ehEpico(alvo)) return false;
  /* TENACIDADE — o antídoto de controle, e o freio de cadeia de atordoamento */
  /* A Tenacidade é CARGA, não prazo: anular gasta ela INTEIRA, não um turno
     dela. Decrementar deixava um herói com `tu:2` anulando dois controles, o que
     na prática é imunidade — e imunidade a controle não tem contrajogo. */
  if(ehControle(t)&&temCond(alvo,"tenacidade")){
    removeCond(alvo,"tenacidade","silencio");
    reg("b",`${CONDS.tenacidade.ico} TENACIDADE — ${alvo.n} anula ${d.n}`);
    seloCond(alvo,"TENACIDADE!","bom");
    return false;
  }
  /* BANIDO não recebe nada: ele não está no tabuleiro para receber */
  if(temCond(alvo,"banido")&&t!=="banido")return false;

  const ja=condDe(alvo,t);
  const teto=d.max||99;
  if(ja){
    if(d.pilha) ja.st=Math.min(teto,(ja.st||0)+(st||1));
    else        ja.tu=Math.min(teto,Math.max(ja.tu||0,tu||1));
    ja.dono=dono||ja.dono;
  }else{
    const c={t,dono};
    if(d.pilha) c.st=Math.min(teto,st||1);
    else        c.tu=Math.min(teto,tu||1);
    condsDe(alvo).push(c);
  }
  const q=d.pilha?` ×${condDe(alvo,t).st}`:(condDe(alvo,t).tu>1?` (${condDe(alvo,t).tu} turnos)`:"");
  reg("b",`${d.ico} ${alvo.n} está ${d.selo.toLowerCase()}${q}`);
  if(!quieto) seloCond(alvo,d.selo+"!",d.mal?"mal":"bom");
  /* efeitos que disparam NO INSTANTE da aplicação */
  if(t==="banido") entraEmBanimento(alvo);
  if(t==="catarino") checaEstouroCatarino(alvo,dono);
  return true;
}
/* remove de vez */
function removeCond(alvo,t,motivo){
  const i=(alvo.conds||[]).findIndex(c=>c.t===t);
  if(i<0)return false;
  alvo.conds.splice(i,1);
  if(CONDS[t]&&motivo!=="silencio")
    reg("b",`${CONDS[t].ico} ${alvo.n} — ${CONDS[t].n} terminou`);
  if(motivo!=="silencio") seloCond(alvo,CONDS[t].n.toUpperCase()+" ACABOU","fim");
  return true;
}
/* gasta uma carga: some se era a última */
function gastaCond(alvo,t){
  const c=condDe(alvo,t); if(!c)return false;
  if(CONDS[t].pilha){ c.st--; if(c.st<=0) removeCond(alvo,t,"silencio"); }
  else { c.tu--; if(c.tu<=0) removeCond(alvo,t,"silencio"); }
  return true;
}
/* LIMPEZA — o contrajogo genérico. Tira as `n` piores condições ruins.
   A ordem é a de consequência: o que impede jogar sai antes do que só dói. */
const ORDEM_LIMPEZA=["atordoado","silenciado","lentidao","veneno","sangramento",
                     "catarino","marcado","vulneravel","revelado"];
function limpaCond(alvo,n=1){
  let saiu=0;
  for(const t of ORDEM_LIMPEZA){
    if(saiu>=n)break;
    if(temCond(alvo,t)){ removeCond(alvo,t); saiu++; }
  }
  if(alvo.preso&&saiu<n){ alvo.preso=0; saiu++; reg("b",`${alvo.n} não está mais preso`); }
  if(saiu) seloCond(alvo,"LIMPO","bom");
  return saiu;
}
/* ---------- BANIMENTO ----------
   As regras, todas explícitas, porque o desenho exigiu que nenhuma ficasse
   implícita (§9):
     · não é alvo de nada — habilidade, respingo, zona, torre, épico;
     · não sofre dano de nenhuma fonte, inclusive condição já pendurada;
     · NÃO ocupa hexágono: outro herói pode passar e parar onde ele estava;
     · não acende visão e não conta presença de rota (a onda não o vê);
     · o retorno é no INÍCIO do próprio turno, na MESMA casa — e se ela estiver
       ocupada, na casa livre mais próxima. Previsível de propósito: o
       adversário sabe onde ele reaparece, e é isso que faz o Banimento ser
       jogada e não fuga grátis;
     · a recarga não existe neste jogo (o dado é a recarga), então nada corre;
     · dura 1 turno. Sempre 1. `max:1` no registro garante que nem renovando
       passa disso. */
function entraEmBanimento(h){
  h.voltaEm=[...h.pos];
  reg("b",`${CONDS.banido.ico} ${h.n} sai do tabuleiro — volta no início do próprio turno`);
}
function voltaDoBanimento(h){
  const alvo=h.voltaEm||h.pos;
  h.pos = em(...alvo) ? (casaLivrePerto(alvo)||h.pos) : [...alvo];
  h.voltaEm=null;
  removeCond(h,"banido","silencio");
  reg("b",`${CONDS.banido.ico} ${h.n} volta ao tabuleiro`);
  seloCond(h,"DE VOLTA","bom");
}
function casaLivrePerto(p){
  const v=vizinhos(...p).find(q=>noTab(...q)&&!em(...q)&&!ehBloqueado(...q));
  return v||null;
}
/* está no tabuleiro? morto e banido não estão, e é UMA pergunta em vez de duas
   espalhadas — `em`, visão, presença de rota e desempilhamento leem daqui */
const noJogo=h=>!h.morto&&!temCond(h,"banido");

/* ---------- ESTOURO DA MARCA DO CATARINO ----------
   A única condição do jogo que resolve sozinha ao chegar no teto. Mora aqui e
   não na passiva porque a REGRA é da marca; a passiva só a aplica. */
function checaEstouroCatarino(alvo,dono){
  const c=condDe(alvo,"catarino");
  if(!c||c.st<(CONDS.catarino.max||3))return;
  removeCond(alvo,"catarino","silencio");
  const d=COND_NUM.catarinoEstouro;
  alvo.vida-=d;
  reg("b",`${CONDS.catarino.ico} O CILINDRO ESTOURA — ${d} em ${alvo.n}, `
         +`ignorando armadura e escudo (${Math.max(0,alvo.vida)}/${alvo.vidaMax})`);
  fx(alvo.pos,-d,"dano"); seloCond(alvo,"CILINDRO!","mal");
  if(alvo.vida<=0) mata(alvo,dono||maisPertoDe(alvo,1-alvo.t));
}

/* ---------- PROCESSAMENTO: INÍCIO DO TURNO ----------
   Cobra o que dói. Substitui `cobraDots`, que continua existindo como apelido.
   Ignora armadura e escudo, pela mesma razão de sempre: não é o golpe chegando,
   é o golpe que já chegou. */
function processaCondsInicio(t){
  J.times[t].herois.forEach(h=>{
    if(temCond(h,"banido")) voltaDoBanimento(h);
    if(h.morto||!h.conds||!h.conds.length)return;
    /* o autor é guardado ANTES de qualquer remoção: a última cobrança é
       justamente a que mata, e é também a que tira a condição da lista. Sem
       isto o ouro da morte ia para o vizinho mais próximo. */
    let autor=null, perdeu=0;
    const sang=condDe(h,"sangramento");
    if(sang){ const d=sang.st*COND_NUM.sangramentoPorStack;
      h.vida-=d; perdeu+=d; autor=sang.dono||autor;
      reg("b",`${CONDS.sangramento.ico} ${h.n} perde ${d} de sangramento `
             +`(${Math.max(0,h.vida)}/${h.vidaMax})`); }
    const ven=condDe(h,"veneno");
    if(ven&&h.vida>0){ const d=COND_NUM.venenoDano;
      h.vida-=d; perdeu+=d; autor=ven.dono||autor;
      reg("b",`${CONDS.veneno.ico} ${h.n} perde ${d} de veneno `
             +`(${Math.max(0,h.vida)}/${h.vidaMax})`); }
    if(perdeu) fx(h.pos,-perdeu,"dano");
    if(h.vida<=0) mata(h,autor||maisPertoDe(h,1-h.t));
  });
}
/* ---------- PROCESSAMENTO: FIM DO TURNO ----------
   Gasta prazo. Aqui e só aqui — se a duração caísse no início, junto da
   cobrança, toda condição de 1 turno morreria antes de valer. */
function processaCondsFim(t){
  J.times[t].herois.forEach(h=>{
    if(!h.conds||!h.conds.length)return;
    const eraAtordoado=temCond(h,"atordoado");
    [...h.conds].forEach(c=>{
      const d=CONDS[c.t]; if(!d)return;
      if(c.t==="banido")return;              // o banimento sai no retorno, não aqui
      if(d.pilha){ c.st--; if(c.st<=0) removeCond(h,c.t); }
      else       { c.tu--; if(c.tu<=0) removeCond(h,c.t); }
    });
    /* SEM CADEIA DE ATORDOAMENTO. Sair de um atordoamento deixa Tenacidade:
       o próximo controle que chegar é anulado. É o que impede
       STUN → STUN → STUN → jogador que nunca jogou. */
    if(eraAtordoado&&!temCond(h,"atordoado"))
      aplicaCond(h,"tenacidade",{tu:2,quieto:true});
  });
}
/* ═══════════════════════════════════════════════════════════════════
   PASSIVAS — registro e barramento de eventos (v45)
   ═══════════════════════════════════════════════════════════════════
   O desenho proibiu `if (heroi.nome === "X")` espalhado pelo projeto, e a saída
   é esta: o herói declara no catálogo `pas:{id}`, e o id é a chave aqui. Uma
   passiva é uma função pequena pendurada num evento. Para dar passiva a um
   herói novo escrevem-se DUAS linhas — uma no catálogo, uma neste objeto — e
   nenhum outro arquivo sabe que ela existe.

   Os eventos que o motor dispara, e de onde:
     inicioTurno   iniciaTurno, para cada herói vivo do time da vez
     fimTurno      encerraTurno
     hit           usaHab, quando uma habilidade ofensiva acerta um herói
     danoCausado   aplicaDano, depois de o dano entrar
     danoRecebido  aplicaDano, no alvo
     matou         mata, no autor
     morreu        mata, em todo herói a alcance de quem morreu
     andou         moveAte
     habUsada      usaHab, no fim

   Uma passiva pode também responder a PERGUNTAS, e aí não é evento e sim
   consulta: `poder` (soma de Poder), `crit` (este golpe é crítico?),
   `reduzDano` (o aliado colado sofre menos), `veMato` (a visão atravessa).
   Quem pergunta são `poderTotal`, `ehCritico`, `aplicaDano` e `campoDeVisao`. */

const PASSIVAS={

  /* ---- TOPO ---- */
  pontoDeOnibus:{ inicioTurno(h){
    const perto=vizinhos(...h.pos).map(p=>em(...p)).filter(o=>o&&o.t!==h.t&&!o.morto);
    perto.forEach(o=>aplicaCond(o,"lentidao",{tu:1,dono:h}));
  }},

  chinelada:{ hit(h,alvo){ aplicaCond(alvo,"sangramento",{st:1,dono:h,quieto:true}); }},

  miasma:{ inicioTurno(h){
    vizinhos(...h.pos).map(p=>em(...p)).filter(o=>o&&o.t!==h.t&&!o.morto)
      .forEach(o=>aplicaCond(o,"veneno",{tu:1,dono:h}));
  }},

  /* a única passiva que responde a duas perguntas: cura no dano e Poder na
     desvantagem. Duas linhas, uma frase — é o teto de complexidade do §14. */
  insaciavel:{
    poder:h=>(h.vida<=h.vidaMax/2?2:0),
    danoCausado(h,alvo,d){
      if(h.morto||h.semCura)return;
      const q=h.vida<=h.vidaMax/2?4:2;
      h.vida=Math.min(h.vidaMax,h.vida+q);
      reg("b",`${h.n} bebe ${q} de vida (${h.vida}/${h.vidaMax})`);
    }},

  /* ---- SELVA ---- */
  /* `tu:2` e não `tu:1`, e a razão vale para TODA condição que o herói põe em si
     mesmo ou num aliado: o prazo cai no FIM do turno de quem carrega, então
     `tu:1` aplicado no próprio turno nasce e morre antes de o adversário jogar —
     invisibilidade que ninguém teve chance de não ver. Dois turnos cobrem
     exatamente uma vez do adversário, que é a janela real.
     Para condição posta num INIMIGO a conta é a outra: `tu:1` já é um turno
     inteiro dele. A assimetria é do relógio, não do desenho. */
  vooSilencioso:{ inicioTurno(h){
    const colado=vizinhos(...h.pos).map(p=>em(...p)).some(o=>o&&o.t!==h.t&&!o.morto);
    if(!colado) aplicaCond(h,"invisivel",{tu:2,dono:h,quieto:temCond(h,"invisivel")});
  }},

  digestao:{ morreu(h,quemMorreu){
    if(h.morto||dist(...h.pos,...quemMorreu.pos)>2)return;
    h.vida=Math.min(h.vidaMax,h.vida+4);
    reg("b",`${h.n} digere o campo de batalha — cura 4 (${h.vida}/${h.vidaMax})`);
  }},

  olhoDeMateiro:{ veMato:()=>true },

  contabilidade:{ matou(h,alvo){
    h.ouro+=3;
    const amigo=J.times[h.t].herois.filter(o=>o!==h&&!o.morto)
      .sort((a,b)=>dist(...h.pos,...a.pos)-dist(...h.pos,...b.pos))[0];
    if(amigo)amigo.ouro+=2;
    reg("b",`${h.n} cobra a cova — +3 de ouro${amigo?`, +2 para ${amigo.n}`:""}`);
  }},

  /* ---- MEIO ---- */
  captacao:{
    hit(h){ ganhaRecurso(h,"carga",1); },
    crit(h){ if((h.rec&&h.rec.carga||0)>=3){ zeraRecurso(h,"carga"); return "3 CARGAS"; } return null; }
  },

  passoDeSombra:{ danoCausado(h,alvo){
    if(h.morto||!alvo.pos||temCond(h,"banido"))return;
    const de=[...h.pos];
    desloca(h,alvo.pos,1,1);
    if(de[0]!==h.pos[0]||de[1]!==h.pos[1]) reg("b",`${h.n} recua uma casa na sombra`);
  }},

  coleta:{
    hit(h){ ganhaRecurso(h,"sucata",1); },
    morreu(h,quemMorreu){ if(!h.morto&&dist(...h.pos,...quemMorreu.pos)<=3) ganhaRecurso(h,"sucata",1); }
  },

  /* JURISPRUDÊNCIA — a metade que registra. A metade que executa é a Ultimate
     `copia`. Os limites moram aqui, e são eles que impedem loop e referência
     quebrada (§10): só habilidade INIMIGA, só slot 0 ou 1 (Ultimate nunca),
     nunca uma habilidade que já seja cópia, e guarda-se o texto do efeito, não
     um ponteiro para o herói — o autor pode morrer, trocar de item ou nem estar
     mais em campo quando o Tribunal abrir. */
  jurisprudencia:{ danoRecebido(h,quem,d,ctx){
    if(!ctx||ctx.slot===undefined||ctx.slot>=2)return;
    if(!quem||quem.t===h.t||ctx.copia)return;
    h.autos={n:ctx.hb.n, de:quem.n, ef:ctx.hb.ef, dados:ctx.hb.dados, alvo:ctx.hb.alvo, slot:ctx.slot};
    reg("b",`⚖ ${h.n} registra ${ctx.hb.n} nos autos`);
  }},

  /* ---- ATIRADOR ---- */
  pulmaoDeAco:{
    hit(h,alvo){
      if(h.ultimoAlvo===alvo.id) ganhaRecurso(h,"folego",1);
      else { zeraRecurso(h,"folego"); ganhaRecurso(h,"folego",1); }
      h.ultimoAlvo=alvo.id;
    },
    danoBonus:h=>2*((h.rec&&h.rec.folego)||0)
  },

  juros:{ crit(h,alvo){
    if(!alvo)return null;
    if(alvo.preso)return "ALVO PRESO";
    if(temCond(alvo,"atordoado"))return "ALVO ATORDOADO";
    if(temCond(alvo,"lentidao"))return "ALVO LENTO";
    return null;
  }},

  marcaDoCatarino:{ hit(h,alvo){ aplicaCond(alvo,"catarino",{st:1,dono:h}); }},

  quatroTiros:{ crit(h){
    if((h.rec&&h.rec.cartucho||0)>=3){ zeraRecurso(h,"cartucho"); return "QUARTO TIRO"; }
    ganhaRecurso(h,"cartucho",1); return null;
  }},

  /* ---- SUPORTE ---- */
  tristeza:{
    danoRecebidoAliado(h,vitima){ if(vitima!==h) ganhaRecurso(h,"tristeza",1); },
    morreu(h,quemMorreu){ if(quemMorreu.t===h.t&&quemMorreu!==h) ganhaRecurso(h,"tristeza",1); }
  },

  almasNaLanterna:{ morreu(h,quemMorreu){
    if(h.morto||quemMorreu===h)return;
    if(dist(...h.pos,...quemMorreu.pos)>3)return;
    if(((h.rec&&h.rec.almas)||0)>=5)return;
    ganhaRecurso(h,"almas",1); h.arm+=1;
    reg("b",`${RECURSOS.almas.ico} ${h.n} recolhe uma alma — Armadura ${armTotal(h)}`);
  }},

  guardaCorpo:{ reduzDano:(h,alvo)=>(dist(...h.pos,...alvo.pos)<=1?2:0) },

  videncia:{ inicioTurno(h){
    const alvos=J.times[1-h.t].herois.filter(o=>!o.morto&&noJogo(o)
      &&dist(...h.pos,...o.pos)<=4&&!visivelPara(o,h.t));
    if(!alvos.length)return;
    const o=alvos.sort((a,b)=>dist(...h.pos,...a.pos)-dist(...h.pos,...b.pos))[0];
    aplicaCond(o,"revelado",{tu:1,dono:h});
    reg("b",`${CONDS.revelado.ico} ${h.n} pressente ${o.n}`);
  }}
};

/* a passiva declarada pelo herói, se o registro a conhecer */
const passivaDe=h=>{ const d=CATALOGO[h.id]; return (d&&d.pas&&PASSIVAS[d.pas.id])||null; };

/* DISPARO. Um evento, todos os heróis que se inscreveram nele. É a diferença
   entre "cada passiva chamada de um lugar diferente do motor" e "um lugar que
   chama todas": quem adiciona evento novo mexe em uma linha. */
function dispara(ev,h,...args){
  if(!h)return;
  const p=passivaDe(h); if(!p||!p[ev])return;
  try{ p[ev](h,...args); }catch(e){ /* passiva nunca derruba o turno */ }
}
/* eventos que interessam a TODO MUNDO no tabuleiro, não só ao dono da jogada */
function disparaTodos(ev,...args){ todos().forEach(h=>dispara(ev,h,...args)); }

/* ---------- RECURSOS DE PERSONAGEM ---------- */
function ganhaRecurso(h,t,n){
  if(!RECURSOS[t])return;
  h.rec=h.rec||{};
  const antes=h.rec[t]||0;
  h.rec[t]=Math.min(RECURSOS[t].max,antes+n);
  if(h.rec[t]!==antes) reg("b",`${RECURSOS[t].ico} ${h.n} — ${RECURSOS[t].n} ${h.rec[t]}/${RECURSOS[t].max}`);
}
function zeraRecurso(h,t){ if(h.rec) h.rec[t]=0; }
const recursoDe=(h,t)=>((h.rec&&h.rec[t])||0);

/* ---------- CONSULTAS QUE AS PASSIVAS RESPONDEM ---------- */
const poderPassivo=h=>{ const p=passivaDe(h); return (p&&p.poder)?p.poder(h):0; };
const danoPassivo =h=>{ const p=passivaDe(h); return (p&&p.danoBonus)?p.danoBonus(h):0; };
const veMatoDeLonge=h=>{ const p=passivaDe(h); return !!(p&&p.veMato&&p.veMato(h)); };
/* o quanto os aliados colados abatem do dano que chega neste herói */
function reducaoDeAliados(alvo){
  if(!alvo)return 0;
  let r=0;
  J.times[alvo.t].herois.forEach(o=>{
    if(o===alvo||o.morto||!noJogo(o))return;
    const p=passivaDe(o); if(!p||!p.reduzDano)return;
    r+=p.reduzDano(o,alvo);
  });
  return r;
}

/* ---------- CRÍTICO ----------
   Nunca por sorte. O desenho foi explícito: crítico com CONDIÇÃO, para o
   adversário poder ver de longe que o golpe vem grande e ter o que fazer. Cada
   caso abaixo é previsível olhando o tabuleiro — ou a peça diz (Marcado, Lento,
   Invisível), ou o contador diz (Carga, Cartucho).
   `ehCritico` devolve o MOTIVO, não um booleano: é o motivo que aparece na tela. */
function ehCritico(h,hb,alvo){
  const ef=hb.ef||{};
  if(ef.critSempre) return "ATO FINAL";
  if(ef.critSe==="isolado"&&alvo&&alvo.t!==undefined){
    const acompanhado=J.times[alvo.t].herois.some(o=>o!==alvo&&!o.morto&&noJogo(o)
      &&dist(...alvo.pos,...o.pos)<=2);
    if(!acompanhado) return "ALVO ISOLADO";
  }
  if(ef.critSe==="eraInvisivel"&&temCond(h,"invisivel")) return "DAS SOMBRAS";
  if(ef.critSe==="controlado"&&alvo&&(alvo.preso||temCond(alvo,"atordoado")||temCond(alvo,"lentidao")))
    return "ALVO TRAVADO";
  if(ef.critSe==="marcado"&&alvo&&temCond(alvo,"marcado")) return "ALVO MARCADO";
  /* a passiva pergunta depois do efeito: assim uma habilidade pode declarar
     crítico próprio sem gastar a contagem da passiva */
  const p=passivaDe(h);
  if(p&&p.crit&&(ef.dano||ef.danoFixo)) return p.crit(h,alvo);
  return null;
}

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
  const acende=(p,raio,atravessaMato)=>{
    if(!p)return;
    const tabela = (atravessaMato||ehMato(...p)) ? RAIO_ATE : RAIO_ATE_ABERTO;
    const tab=tabela.get(k(...p));
    if(tab) tab[raio].forEach(x=>vistos.add(x));
  };
  /* herói banido não acende nada: ele não está lá. E o Olho de Mateiro do Valti
     é a única fonte de visão que vê PARA DENTRO do mato de fora dele — a
     passiva pergunta, `campoDeVisao` responde. */
  J.times[t].herois.filter(h=>noJogo(h)).forEach(h=>acende(h.pos,VISAO_HEROI,veMatoDeLonge(h)));
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
  /* o estado de BANIMENTO entra no selo: um herói que sai do tabuleiro apaga a
     visão dele, e sem este bit o cache continuaria acendendo o raio de uma peça
     que não está mais lá. É o mesmo erro de magnitude que a v21 pagou. */
  for(let i=0;i<hs.length;i++) mix(hs[i].pos[0]*13+hs[i].pos[1]*7
    +(hs[i].morto?1:0)+(temCond(hs[i],"banido")?2:0));
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
/* visão SÓ DE WARD, separada da geral. Existe porque a Invisibilidade precisa de
   uma fonte de visão privilegiada e não de todas: a peça acende raio 2 e não
   deveria enxergar o invisível colado nela. */
function enxergaPorWard(t,c,r){
  const ws=J.times[t].wards||[];
  if(!ws.length)return false;
  const alvo=k(c,r);
  return ws.some(w=>{
    const tab=(ehMato(...w.pos)?RAIO_ATE:RAIO_ATE_ABERTO).get(k(...w.pos));
    return !!tab&&tab[VISAO_WARD].indexOf(alvo)>=0;
  });
}

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
/* A ORDEM AQUI É A REGRA, e cada linha tem contrajogo declarado:
     1. os seus, você sempre vê;
     2. BANIDO ninguém vê, nem o dono — ele não está no tabuleiro;
     3. REVELADO vence tudo (é o que Ward-de-habilidade, Sinal Aberto, Ato Final
        e a Vidência compram);
     4. quem ATACOU entregou a posição, invisível ou não;
     5. INVISÍVEL não é visto nem em campo aberto;
     6. o resto é a névoa de sempre. */
function visivelPara(h,t){
  if(h.t===t&&!temCond(h,"banido"))return true;
  if(h.morto)return true;
  if(temCond(h,"banido"))return false;
  if(temCond(h,"revelado"))return true;
  if(reveladoPorAtaque(h))return true;
  /* A WARD É A RESPOSTA À INVISIBILIDADE, e é a resposta que o desenho nomeou
     (§11 e §28). Névoa comum não pega o invisível; olho comprado e plantado
     pega. É o que transforma "ele desapareceu" em "preciso usar Ward" em vez de
     "não havia nada que eu pudesse fazer". */
  if(temCond(h,"invisivel"))return enxergaPorWard(t,...h.pos);
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
  if(ehBloqueado(...pos))return;             /* não se planta ward dentro do ônibus */
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
/* APELIDO HISTÓRICO. `poeDot` era a porta das duas únicas condições que existiam
   antes da v45, e o `dano` que ela recebia virou número de balanceamento
   centralizado (`COND_NUM`) — sangramento cobra por acúmulo, veneno cobra fixo.
   A assinatura fica de pé porque zona, carta e teste antigo chamam por ela; o
   parâmetro `dano` passa a ser lido como INTENSIDADE: quantos acúmulos de
   sangramento, ou nada, no caso do veneno, que não tem intensidade. */
function poeDot(alvo,quem,tipo,dano,rodadas){
  if(!alvo||!CONDS[tipo])return;
  if(tipo==="sangramento") aplicaCond(alvo,"sangramento",{st:Math.max(1,Math.round(dano||1)),dono:quem});
  else                     aplicaCond(alvo,tipo,{tu:Math.max(1,rodadas||1),dono:quem});
}
/* idem: o nome antigo do início-de-turno */
function cobraDots(t){ processaCondsInicio(t); }
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
      /* a zona virou genérica na v45: ela pode pendurar QUALQUER condição, e não
         só as duas de dano por turno. É o que faz a Armadilha do Cael e as
         cascas do Valti serem território de verdade em vez de mais um veneno. */
      if(z.cond) aplicaCond(h,z.cond.t,{st:z.cond.st||1,tu:z.cond.tu||1,dono:z.dono});
      else       poeDot(h,z.dono,z.tipo,z.dano,2);
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
                tipo:z.tipo,dano:z.dano,cond:z.cond||null,n:z.n||"uma zona",dono:z.dono});
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
   d:"Os seus golpes de herói em torre valem o dobro, e no Nexus causam 2 em vez de 1.",
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
/* O Aríete tem DUAS réguas, e é de propósito: a torre passou para a escala de
   12 na v48 e o Nexus continua na de 3. Na torre ele DOBRA o golpe
   (`ARIETE_MULT`); no Nexus ele soma 1, como sempre somou. */
const BARAO_ARIETE=1;      /* somado ao golpe de herói no NEXUS */
const BARAO_RODADAS=2;     /* e ela dura pouco — é botão de ponto-sem-volta, não renda */
const GOLPE_HAB=1, GOLPE_ULT=2;   /* quanto cada golpe tira do poço — ver atacaEpico */

/* ---------- ESTADO ---------- */
let J,dadoSel=null,ativo=null,habSel=null,selHeroi=null,alvos=[],alvosTorre=[],alvosEpico=[],
    alvoNexus=null,mover=[],lojaHeroi=null;
let aiMode=false, simMode=false;

/* ---------- OS TRÊS NÍVEIS DA IA ----------
   A regra que rege tudo aqui: DIFICULDADE MEXE NA QUALIDADE DA DECISÃO, NUNCA
   NOS NÚMEROS. A IA difícil não ganha dano, vida, ouro nem dado a mais, e não
   enxerga um hexágono sequer além do que a névoa deixa — este projeto já decidiu
   que ela obedece à mesma névoa e não trapaceia (v19), e nível de dificuldade
   não é desculpa para desfazer isso. Uma IA que trapaceia ensina a regra errada:
   o jogador perde e não sabe o que fez de errado, porque não fez.

   O que muda entre os níveis é o que qualquer jogador humano faz melhor com
   experiência — reparar na melhor jogada, gastar ouro, comprar visão, converter
   dado em movimento para chegar, voltar para defender e disputar o objetivo.

   `erro` é o coração: a chance de a IA NÃO pegar a melhor jogada da lista que
   ela mesma ordenou. É assim que se erra de verdade — vendo a jogada certa e
   escolhendo outra —, e não jogando dado escondido.

   `minimo` é o piso de nota para agir. Contraintuitivo e proposital: piso ALTO
   deixa a IA passiva, porque ela desdenha jogada pequena que somada ganha
   partida. É o erro clássico de quem está aprendendo. */
const NIVEIS_IA={
  facil:  {id:"facil",  n:"Aprendiz", d:"Erra bastante e joga passivo. Compra item, mas não warda, não volta para defender e não disputa o poço.",
           erro:0.40, minimo:26, compra:1, wards:0, alcance:0, defende:0, objetivo:0, rotacaoBoa:0,
           draftK:4, draftPeso:0},
  normal: {id:"normal", n:"Veterano", d:"Joga o mapa inteiro: compra, warda, volta para defender o Nexus e disputa o poço.",
           erro:0.20, minimo:15, compra:1, wards:1, alcance:1, defende:1, objetivo:1, rotacaoBoa:1,
           draftK:3, draftPeso:1},
  dificil:{id:"dificil",n:"Mestre",   d:"Não erra jogada e concentra fogo em quem já está caindo.",
           erro:0,    minimo:15, compra:1, wards:1, alcance:1, defende:1, objetivo:1, rotacaoBoa:1, foco:1,
           draftK:3, draftPeso:2}
};
let nivelIA="normal";
const IA=()=>NIVEIS_IA[nivelIA]||NIVEIS_IA.normal;

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
          dots:[], curouSitiado:0, focoPoco:0,
          /* v45 — o estado que as condições e as passivas usam. Nasce vazio aqui,
             e não na primeira aplicação, para que `h.conds.length` seja pergunta
             segura em qualquer lugar do motor e de qualquer teste. */
          conds:[], rec:{}, autos:null, voltaEm:null, alcTurno:0, andou:0, ultimoAlvo:null,
          mergulhou:0};
      })
    })),
    dados:[], mov:{v:0,rest:0},
    frentes:{topo:centroRota("topo"),meio:centroRota("meio"),baixo:centroRota("baixo")},
    presenca:[{},{}],
    torres:TORRES_DEF.map(d=>({...d,vida:VIDA_TORRE})),
    /* vida 0 = o poço está vazio; `volta` é a rodada em que o próximo morador desce */
    poco:{id:"dragao", vida:0, vidaMax:EPICO.dragao.vida, volta:R_DRAGAO},
    camps:[
      {id:"azul",  t: 0,pos:[...CAMP_AZUL],  ouro:OURO_CAMP,respawn:0,ativo:1},
      {id:"carmim",t: 1,pos:[...CAMP_CARMIM],ouro:OURO_CAMP,respawn:0,ativo:1},
      {id:"neutro",t:-1,pos:[...sorteiaNeutro()],ouro:OURO_CAMP_NEUTRO,respawn:0,ativo:1}
    ],
    zonas:[], rotacao:[null,null], bonusPend:[null,null],
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
  /* a rodada 1 também tem rotação: "no início de CADA rodada" é a regra, e abrir
     a exceção na primeira faria o Caçador começar sem bônus e sem aposta */
  J.fase="rotacao";
  caraOuCoroa(()=>abreRotacoes(()=>faseOculta()));
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
/* Banido NÃO ocupa hexágono — é a regra explícita do §9. `em` é o lugar único
   onde "tem alguém aqui?" é respondido, então passar por `noJogo` aqui resolve
   de uma vez movimento, empurrão, desempilhamento, mira e zona. */
const em=(c,r)=>todos().find(h=>noJogo(h)&&h.pos[0]===c&&h.pos[1]===r);
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
    h.alcTurno=0;            /* o alcance emprestado pelo Encher o Pulmão */
    h.bonusRegiao=null;      /* o selo do bônus de rotação sai com o buff dele */
    h.andou=0;               /* usado pelo crítico condicional e pela IA */
    h.mergulhou=0;           /* quem bateu em torre neste turno — alvo do disparo dela */
  });
}
function iniciaTurno(){
  const t=J.vez, tm=J.times[t];
  expiraDoTime(t);
  /* a zona marca ANTES de o efeito cobrar: quem começou o turno dentro dela paga
     na hora, e não só na rodada seguinte. Sem isso dava para entrar e sair da
     zona no mesmo turno sem custo nenhum, e território que não cobra não nega
     nada. */
  /* a rotação NÃO mora mais aqui: desde a v38 o Caçador é reposicionado no
     instante da escolha, no início da rodada, e não no início do turno do dono */
  zonasCobram(t);
  /* ORDEM, e ela tem consequência: a condição cobra ANTES de a passiva rodar.
     Sem isso o Miasma da Ilva envenenava um vizinho que ainda ia morrer de
     veneno no mesmo instante, e o log contava a história ao contrário. */
  processaCondsInicio(t);
  /* PASSIVAS DE INÍCIO DE TURNO. Só do time da vez, e só de quem está em campo:
     herói morto ou banido não aplica Lentidão em ninguém. */
  J.times[t].herois.filter(h=>noJogo(h)).forEach(h=>dispara("inicioTurno",h));
  /* a Égide repõe DEPOIS da expiração, senão o escudo que ela deu morreria no
     mesmo instante em que é reposto */
  if(tm.barao>0&&tm.dadiva==="egide") daEgide(t);
  /* o +1 da região Selva entra aqui, no Dado Mestre, e é CONSUMIDO: ele vale a
     rodada em que foi escolhido, não as seguintes. */
  /* O BÔNUS DA REGIÃO É PAGO AQUI, depois de `expiraDoTime` e antes de os dados
     rolarem: é o único ponto em que ele sobrevive ao próprio turno do dono. */
  if(J.bonusPend&&J.bonusPend[t]) pagaBonusRegiao(t,J.bonusPend[t]);
  const daRegiao=tm.movRegiao||0; tm.movRegiao=0;
  const extra=tm.herois.filter(h=>!h.morto).reduce((a,h)=>a+bonus(h,"mov"),0)+daRegiao;
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
/* ---------- A TORRE PUNE QUEM MERGULHA SOZINHO (v48) ----------
   §40 a §48 do pedido, e a ideia central cabe em duas linhas:

     CREEP PRESENTE  → o herói consegue pressionar.
     SEM CREEP       → a torre pune o herói.

   AS DEFINIÇÕES, todas espaciais e todas escritas para não virar dúvida na mesa:

   · **Perto** é `ZONA_TORRE` = **um hexágono**. É a mesma régua que já existia
     para o +1 de Armadura de quem defende junto da própria torre: a zona de
     proteção e a zona de ameaça são a mesma casa, vistas dos dois lados.

   · **Creep aliado** é a **Frente de Onda daquela rota**, e ela precisa estar
     DENTRO da zona da torre — não em qualquer lugar da rota (§43). A Frente é
     a peça de creep deste jogo, e ela só encosta na torre inimiga quando a sua
     onda venceu o empurra-empurra da rota. É exatamente a leitura de MOBA:
     enquanto a sua onda está lá, você mergulha; quando ela é empurrada de
     volta, você está sozinho embaixo da torre.

   · **Quando** — no encerramento do turno de quem se expôs, antes de a presença
     ser congelada, para que quem cair conte como morto na conta da rota.

   · **Quantos** — UM alvo por torre (§47). A alternativa "atinge todos" fazia
     da torre uma máquina de matar time inteiro, e o pedido pediu a mais simples
     e equilibrada. A ordem é: **quem bateu na torre neste turno** (o mergulho
     tem autor), depois **o mais ferido**, e o mais próximo desempata. É a
     leitura de MOBA — a torre troca de alvo para quem a atacou — e cabe numa
     frase na mesa.

   · **Não gasta nada** (§45): nem dado, nem ação, nem carta, nem recurso. É
     reação da estrutura.

   · **Não mata** — deixa em 1, como o revide sempre fez. `mata()` precisa de um
     autor para creditar o ouro, e morte sem autor é buraco de motor. Na prática
     a torre não rouba o abate, ela ARMA o abate. */
const posDaTorre=tr=>ROTAS[tr.rota][tr.i];
const posDaFrente=rota=>{
  const l=ROTAS[rota];
  return l[Math.max(0,Math.min(l.length-1,J.frentes[rota]))];
};
const creepApoia=tr=>dist(...posDaFrente(tr.rota),...posDaTorre(tr))<=ZONA_TORRE;
const naZonaDaTorre=(h,tr)=>dist(...h.pos,...posDaTorre(tr))<=ZONA_TORRE;
/* a torre inimiga que ameaça este herói AGORA, se houver — a IA lê daqui */
const torreQueAmeaca=h=>J.torres.find(tr=>tr.t!==h.t&&tr.vida>0
  &&naZonaDaTorre(h,tr)&&!creepApoia(tr))||null;

function torresAtiram(t){
  J.torres.forEach(tr=>{
    if(tr.t===t||tr.vida<=0)return;          /* torre própria, e torre já caída não atira */
    if(creepApoia(tr))return;                /* creep na zona: o mergulho está pago */
    const dentro=vivos(t).filter(h=>noJogo(h)&&naZonaDaTorre(h,tr));
    if(!dentro.length)return;
    const alvo=dentro.sort((a,b)=>
      (b.mergulhou?1:0)-(a.mergulhou?1:0)
      || a.vida-b.vida
      || dist(...a.pos,...posDaTorre(tr))-dist(...b.pos,...posDaTorre(tr)))[0];
    const levou=Math.min(TIRO_TORRE,alvo.vida-1);
    reg("b",`TORRE ATACA — ${tr.rota}, lado ${NOMES[tr.t]}: ${alvo.n} está sob a torre sem creep`);
    if(levou>0){
      alvo.vida-=levou;
      reg("b",`${alvo.n} leva ${levou} da torre (${alvo.vida}/${alvo.vidaMax})`);
      fx(alvo.pos,-levou,"dano"); tremer(alvo);
      if(!souIA()) toast(`TORRE ATACA ${alvo.n}`,"morte");
    }else{
      reg("b",`${alvo.n} já está em 1 — a torre não mata, ela deixa você à mão de qualquer um`);
    }
  });
}

function encerraTurno(){
  if(J.fim!==null)return;
  /* O PRAZO DAS CONDIÇÕES CAI AQUI, no fim do turno de quem as carrega. Cobrar e
     gastar no mesmo instante (início) fazia `atordoado por 1 turno` nascer e
     morrer antes de o jogador tentar agir — o atordoamento não atordoava nada. */
  processaCondsFim(J.vez);
  J.times[J.vez].herois.filter(h=>noJogo(h)).forEach(h=>dispara("fimTurno",h));
  /* A TORRE ATIRA ANTES DE A PRESENÇA SER CONGELADA: quem termina o turno
     debaixo dela sem creep paga na hora, e o estado que a rota vê é o de
     depois do tiro. */
  torresAtiram(J.vez);
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
  if(passou) return melhor;

  /* ---------- QUEM ESTÁ NA BRIGA CONTA (v47) ----------
     Esta é a causa raiz de *"tá muito fácil ganhar só empurrando torre"*, e ela
     era mais funda que qualquer número: **o defensor não contava.**

     A linha de cima existe para impedir que herói parado em casa empurre onda —
     e para EMPURRAR ela está certa. Mas ela media pressão pelo mesmo critério
     nos dois sentidos, e por isso, na MESMA CASA, o atacante contava e o
     defensor não: quem está em cima da própria torre exterior tem `idx ===
     exterior`, e `passou` pede estritamente MAIOR. Medido, e é literal:

         defensor em cima da própria torre  → rota: null
         atacante do outro time, mesma casa → rota: topo

     Ou seja, defender não era difícil, era impossível: nenhuma posição do mapa
     fazia o defensor somar na conta que decide se a torre cai. Ele podia trazer
     os cinco heróis e a onda continuava andando.

     A regra nova é uma frase: **quem está encostado na Frente de Onda está na
     briga, e conta** — esteja de que lado estiver. Ela não afrouxa a de cima,
     porque só liga quando a onda VEIO até você: enquanto a frente está no vão
     neutro, ninguém atrás da própria torre alcança 1 de distância dela. É o
     equivalente de mesa a "você foi defender". */
  const f=J.frentes[melhor];
  if(f!==undefined&&Math.abs(idx-f)<=1) return melhor;
  return null;
}
/* A CONTAGEM DE PRESENÇA DE UMA ROTA, do ponto de vista de quem olha a tela.
   Mora aqui e não dentro de `desenhaMapa` porque é REGRA DE LEITURA, não desenho:
   é a mesma conta que decide quem empurra quem, e o teste precisa alcançá-la.

   OBEDECE À NÉVOA. Só entra na conta o inimigo que este lado ENXERGA — mostrar o
   número real entregaria de graça a posição do Caçador escondido, que é a
   informação em torno da qual a partida inteira gira. O jogador vê o que ele
   sabe, e a incerteza continua sendo dele. */
function contaRota(nome){
  const eu=ladoDaTela();
  const meus=vivos(eu).filter(h=>noJogo(h)&&rotaDaPos(h)===nome).length;
  const deles=J.times[1-eu].herois.filter(h=>!h.morto&&noJogo(h)
    &&visivelPara(h,eu)&&rotaDaPos(h)===nome).length;
  /* TRÊS estados, e não dois. A primeira versão pintava de verde o EMPATE, com o
     rótulo "dá para segurar" — e mentia: empate impede a onda de ANDAR, mas a
     torre que está embaixo dela continua apanhando 1 por rodada. Quem lesse o
     verde levaria o time para outra rota e voltaria com a torre no chão.
     Para salvar a torre é preciso ter MAIS gente, porque só assim a onda recua e
     sai de cima dela. O âmbar é exatamente esse aviso: "está parada, mas caindo". */
  const estado = (!meus&&!deles) ? ""            /* rota vazia não é empate, é rota vazia */
    : meus>deles ? "seg" : (meus===deles ? "empate" : "perig");
  return {meus,deles,estado,seguro:meus>deles};
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
  /* ── A ONDA COBRA NO MÁXIMO 1 DO NEXUS POR RODADA (v49) ──
     RELATO: *"o jogo acabou quando o Nexus tava com 1 vida"*. Estava certo, e o
     defeito não era o fim — era o caminho até ele. O cerco roda DENTRO de um
     laço por rota, e com as três rotas abertas as três cobravam na MESMA
     virada: o Nexus ia de 3 a 0 sem ninguém jogar no meio, e chegava a ficar
     NEGATIVO. O "1" aparecia no log e sumia no mesmo instante.

     Isso derrotava a Última Muralha, que existe exatamente para garantir que o
     último ponto seja de herói: não adianta a regra checar se há defensor em
     casa se o jogador nunca chega a ver o Nexus em 1 no próprio turno para
     poder voltar.

     A REGRA MÍNIMA que conserta isso, e não outra: **a onda não fecha a partida
     na mesma virada em que começou a cobrar.** Se o Nexus estava em 2 ou mais
     quando a rodada virou, ela para em 1 — e o dono tem uma vez para voltar
     para casa. Se já estava em 1, ela leva: ele teve o turno inteiro para
     defender e não voltou.

     Medido, e é por isso que não é "1 por rodada": travar em 1 por rodada
     custava DEZ rodadas de duração com a IA de verdade (mediana 34 → 44),
     porque a base passava a levar três rodadas para cair mesmo com tudo aberto.
     Parar em 1 custa quase nada e entrega a mesma coisa — a janela.

     Abrir a segunda e a terceira rota continua valendo tudo: caminho para o
     herói, três frentes para o adversário cobrir, e o golpe de herói. */
  const nexusNoInicio=[...J.nexus];
  Object.entries(ROTAS).forEach(([nome,l])=>{     // cerco: só as torres do lado pressionado
    const f=J.frentes[nome];
    const alvo=J.torres.find(x=>x.rota===nome&&x.vida>0&&x.i===f);
    if(alvo){
      const golpe=danoDaOnda();
      alvo.vida-=golpe;
      reg("b",`Onda do ${nome} bate na torre ${NOMES[alvo.t]} −${golpe}`
             +`${degrauDaOnda()>1?" — onda grossa":""} (${Math.max(0,alvo.vida)}/${VIDA_TORRE})`);
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
    /* Nexus já no chão: as outras rotas não cobram de novo. Sem isto ele ia a
       −2 com as três abertas, e a tela mostrava a vida do Nexus negativa. */
    if(J.nexus[lado]<=0) return;
    /* a onda não tira o último ponto na mesma virada em que tirou outro */
    if(nexusNoInicio[lado]>=2&&J.nexus[lado]<=1) return;
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
    /* PATAMAR — o degrau subiu de 10 para 20 na v48, e é consequência direta do
       preço novo, não ajuste de atirador. Ele lê o ouro NA MÃO, e com item de
       4 a 9 o herói gastava antes de acumular: cruzar 10 era raro e cruzar 30,
       raríssimo. Com item de 12 a 24 ele precisa GUARDAR, então o saldo passa a
       viver acima de 10 quase sempre — os três patamares chegariam de graça, e
       o atirador ganharia +6 de Poder por um comportamento que o preço novo
       obriga. Com 20, os três degraus custam 60 de ouro acumulado, que é a
       ordem de grandeza do build completo (54). */
    if(h.patamar){ const p=Math.min(3,Math.floor(h.ouro/PATAMAR_PASSO)); if(p>h.pat){h.extraPoder+=2*(p-h.pat);h.pat=p;
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
  /* A ROTAÇÃO É A ÚLTIMA COISA DA VIRADA, e o turno só começa DEPOIS dela.
     Antes ela era chamada lá em cima e o código seguia direto para `faseOculta`
     na mesma pilha — a tela de escolha abria por cima de um turno que já tinha
     começado. Agora `faseOculta` é a continuação, e roda quando os dois lados
     responderem. */
  pinta();
  J.fase="rotacao";                    /* trava a mesa enquanto a aposta está aberta */
  abreRotacoes(()=>{ pinta(); faseOculta(); });
}

/* ---------- AÇÕES ---------- */
/* calcula() mora na seção ESTADO DE INTERAÇÃO — é a versão baseada em `modo`. */
/* ---------- LENTIDÃO ----------
   A escolha de implementação, e por que ela e não as outras duas:

     · "custa o dobro por casa" — o Dado Mestre é um bolo do TIME, então o
       lento acabaria gastando o movimento dos outros quatro. Punia o time
       inteiro por uma condição de um herói;
     · "não pode andar" — isso é Prende, e o desenho foi explícito (§7) em que
       Lentidão não é isso;
     · TETO DE CASAS, que é o que está aqui. O lento anda 2 casas a menos do que
       poderia, NUNCA menos de 1, e perde o passo grátis de Ágil. O custo em
       movimento continua sendo o do caminho: quem paga é ele, não o time.

   Nunca chega a zero de propósito: um herói lento continua jogando. */
const LENTIDAO_CASAS=COND_NUM.lentidaoCasas;
const temDescontoAgil=h=>ehAgil(h)&&!h.agilUsado&&!temCond(h,"lentidao");

/* ---------- MOVIMENTO MÁXIMO POR HERÓI (v48) ----------
   RELATO: *"no fim da partida alguns heróis acumulam movimento suficiente para
   atravessar uma parcela enorme do mapa numa jogada só"*. Verdadeiro, e medido
   em `node sim/movimento.js`: o Dado Mestre somado a todos os dados de ação
   convertidos dá um **bolso mediano de 15 e máximo de 21** — e a distância de
   base a base são **15 casas**. Sem teto, um herói literalmente atravessa o
   mapa inteiro, e posicionamento, rota, emboscada e Caçador deixam de importar.

   O teto é em CASAS, não em pontos de movimento: o herói pode ter 20 no bolso
   do time e ainda assim andar no máximo `movMax` hexágonos por turno. O custo
   continua saindo do bolso do time — o teto não devolve movimento, ele impede
   de gastar tudo numa peça só.

   OS NÚMEROS, e de onde vieram:
     3 · pesado   Taxista, Grumo, Caramêlo, Torvald — Armadura 3+ e alcance 1
     4 · normal   os onze do meio
     5 · ágil     Pombo, Valti, Pyk, Zhet, Catarino — os cinco com `agil`
   Ninguém tem 6, e isso é escolha: **6 é o vão inteiro entre as duas torres
   exteriores de uma rota**, ou seja, exatamente a jogada que este teto existe
   para tirar da mesa. O teto absoluto de 6 abaixo é só a trava dos itens.

   NÃO CONTAM PARA O TETO, e a decisão está escrita para não virar dúvida na
   mesa: Lampejo, Retorno, Puff de Emergência, Passo de Sombra, a carta Recuo e
   qualquer puxão/empurrão/troca. Nenhum deles é caminhada, todos já têm limite
   próprio (1, 2 casas ou a régua do feitiço) e cada um custa uma ação ou uma
   carta. É o que preserva a identidade de quem é móvel sem devolver o problema:
   o deslocamento total de um turno passa a ser `movMax` mais um punhado de
   casas com nome e preço, e não o bolso inteiro do time. */
const MOV_MAX_PADRAO=4, MOV_MAX_TETO=6;
const movMaxDe=h=>Math.min(MOV_MAX_TETO,
  (CATALOGO[h.id].movMax||MOV_MAX_PADRAO)+bonus(h,"movMax"));
/* quantas casas ainda restam a ESTE herói neste turno */
const casasRestantes=h=>Math.max(0,movMaxDe(h)-(h.andou||0));

function tetoAndar(h){
  let teto=J.mov.rest+(temDescontoAgil(h)?1:0);
  if(temCond(h,"lentidao")) teto=Math.max(1,teto-LENTIDAO_CASAS);
  /* O TETO PESSOAL VEM POR ÚLTIMO, e a ordem importa: o piso de 1 da Lentidão
     existe para um herói lento continuar jogando, mas aplicá-lo depois faria
     um herói que JÁ gastou as casas dele voltar a ter 1 — a Lentidão daria
     movimento. */
  return Math.min(teto,casasRestantes(h));
}
function moveAte(c,r){
  const h=selHeroi; if(!h)return;
  if(temCond(h,"atordoado")||temCond(h,"banido"))return;
  /* ÁGIL — "a 1ª casa andada é grátis" era por MOVIMENTO, não por turno. Andando
     de 1 em 1 hexágono, todo passo custava zero: movimento infinito. Agora o
     desconto vale uma vez por turno, e `agilUsado` expira com o resto. */
  const temDesconto = temDescontoAgil(h);
  /* o preço é o do CAMINHO, não o da linha reta: quem contorna o obstáculo paga
     o contorno. Sem isto, alcance e custo discordavam e o herói chegava de graça
     numa casa que a régua já dizia estar longe. */
  const andando=passosAte(h.pos,[c,r]);
  if(andando===null)return;                 // sem caminho: obstáculo fecha de vez
  const d=andando, custo=Math.max(0,d-(temDesconto?1:0));
  if(d>tetoAndar(h))return;                 // lentidão: o teto é em CASAS
  if(temDesconto&&d>0) h.agilUsado=1;
  if(custo>J.mov.rest)return;
  const de=[...h.pos];
  h.pos=[c,r]; J.mov.rest-=custo; h.andou=(h.andou||0)+d;
  coletaAcampamento(h);
  reg(J.vez?"c":"a",
    `${h.n} anda ${d} ${d>1?"casas":"casa"}${temDesconto&&d>0?" (ágil)":""}`
    +`${temCond(h,"lentidao")?" (lento)":""} — movimento restante ${J.mov.rest}`);
  dispara("andou",h,de);
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
    const ouro = cp.ouro + (invadindo?2:0);
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
  if(!dadoServe(hb,h,F))return;
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
  /* CRÍTICO é decidido ANTES de qualquer coisa mudar, e com o alvo ainda no
     estado em que o jogador o viu — senão uma condição consumida no meio da
     resolução tiraria o crítico que a tela já tinha prometido. */
  const motivoCrit = (ef.dano||ef.danoFixo) ? ehCritico(h,hb,alvo) : null;
  /* `custoVida` é pago primeiro: a Lâmina Sedenta é uma aposta, e quem aposta
     paga antes de saber o resultado. Nunca mata o próprio dono — sobra 1. */
  if(ef.custoVida){
    const pago=Math.min(ef.custoVida,h.vida-1);
    if(pago>0){ h.vida-=pago; fx(h.pos,-pago,"dano");
      reg("b",`${h.n} paga ${pago} da própria vida (${h.vida}/${h.vidaMax})`); }
  }
  const poder=poderTotal(h)+(h.recarga?h.recarga:0)+dupla(h)+bonusGank+danoPassivo(h);
  const base=(mult)=>Math.round(F*mult*escalaDe(habSel))+poder;

  if(ef.doar){
    J.dados.push({v:F,usado:0,extra:1,doado:1,dono:alvo.id});
    alvo.agiu=0;
    reg(J.vez?"c":"a",`${h.n} doa um dado ${F} para ${alvo.n} — ele pode agir agora`);
    toast(`Dado ${F} doado para ${alvo.n}`,"");
    if(ef.limpa) limpaCond(alvo,ef.limpa);
    dispara("habUsada",h,hb,habSel,alvo);
    calcula(); return pinta();
  }
  /* TRISTEZA — a única passiva que MULTIPLICA o efeito de uma habilidade em vez
     de reagir a um evento. Fica aqui, no funil de cura e escudo, e é gasta na
     hora: é o que faz o Emerson escolher QUANDO chorar. */
  const luto = (ef.gastaTristeza?recursoDe(h,"tristeza"):0);
  if(luto){ zeraRecurso(h,"tristeza");
    reg("b",`${RECURSOS.tristeza.ico} ${h.n} descarrega ${luto} de Tristeza`); }

  if(ef.escudo){ const q=F+ef.escudo+luto; alvo.esc+=q; txt+=` — escudo ${q} em ${alvo.n}`; }
  if(ef.escudoAliados){
    vizinhos(...h.pos).map(p=>em(...p)).filter(o=>o&&o.t===h.t&&!o.morto)
      .forEach(o=>{ o.esc+=ef.escudoAliados; reg("b",`${o.n} recebe ${ef.escudoAliados} de escudo`); });
  }
  if(ef.cura){
    const q=ef.cura+luto;
    if(alvo.semCura){ txt+=' — CURA BLOQUEADA'; }
    else { const quem=(hb.alvo==="al"?alvo:h);
      quem.vida=Math.min(quem.vidaMax,quem.vida+q); txt+=` — cura ${q} em ${quem.n}`; }
  }
  if(ef.ouro){ h.ouro+=ef.ouro; txt+=` (+${ef.ouro} de ouro)`; }
  if(ef.recarga){ h.recarga=ef.recarga; txt+=` — próximo golpe +${ef.recarga}`; }
  if(ef.recurso){ h.rec=h.rec||{}; h.rec[ef.recurso.t]=Math.max(h.rec[ef.recurso.t]||0,ef.recurso.n);
    reg("b",`${RECURSOS[ef.recurso.t].ico} ${h.n} — ${RECURSOS[ef.recurso.t].n} `
           +`${h.rec[ef.recurso.t]}/${RECURSOS[ef.recurso.t].max}`); }
  if(ef.alcanceTurno){ h.alcTurno=ef.alcanceTurno; txt+=` — alcance +${ef.alcanceTurno} até o próximo turno`; }
  if(ef.intocavel){ h.intoc=1; txt+=" — intocável até o próximo turno"; }
  if(ef.ward){
    /* a Ward nasce ONDE O HERÓI ESTÁ e acende um raio dali por algumas rodadas */
    poeWard(h.t,h.pos);
    txt+=` — ward posta aqui (raio ${VISAO_WARD}, ${WARD_RODADAS} rodadas)`;
  }
  if(ef.revelaRaio) revelaAoRedor(h,ef.revelaRaio);
  if(ef.revive&&alvo.morto){ alvo.morto=Math.max(1,alvo.morto-1); txt+=` — ${alvo.n} volta 1 rodada antes`; }
  /* MARCA. Era o campo `alvo.marca`, um número solto; virou condição de pilha,
     e por isso agora aparece na peça, sai na limpeza e sai na morte como todas
     as outras. O bônus que ela dá ao próximo golpe continua igual.

     A CONDIÇÃO NO ALVO SÓ ENTRA DEPOIS DO DANO, e este é o conserto de um defeito
     que era mais velho que a v45: `aplicaDano` consome a marca para somar o bônus,
     e a marca era pendurada ANTES do golpe da própria habilidade que a criava. O
     Arpão do Pyke marcava 3 e comia os 3 no mesmo instante; o Eco da Zhet marcava
     4 e comia os 4. Na prática `marca` nunca existiu como marca — era só "+N de
     dano neste golpe", e o texto da carta ("o próximo dano nele leva +N")
     prometia uma coisa que o motor nunca fez. Medido com sim/condicoes.js: a
     condição Marcado aparecia em 0% das partidas.

     Agora é `poeCondsNoAlvo`, chamada DEPOIS da resolução do dano — e só se o
     alvo sobreviveu, pela mesma razão de sempre: pendurar condição num defunto
     sujaria o crédito da morte. Habilidade sem dano aplica na hora, porque para
     ela não existe "depois do golpe". */
  const poeCondsNoAlvo=()=>{
    if(!alvo||alvo.morto||ehEpico(alvo))return;
    if(ef.marca) aplicaCond(alvo,"marcado",{st:ef.marca,dono:h});
    if(ef.cond)  ef.cond.forEach(c=>aplicaCond(alvo,c.t,{st:c.st,tu:c.tu,dono:h}));
  };
  if(ef.condEu)          ef.condEu.forEach(c=>aplicaCond(h,c.t,{st:c.st,tu:c.tu,dono:h}));
  if(ef.limpa&&alvo)     limpaCond(alvo,ef.limpa);
  if(ef.limpaEu)         limpaCond(h,ef.limpaEu);
  if(ef.limpaAliados)    vizinhos(...h.pos).map(p=>em(...p)).filter(o=>o&&o.t===h.t&&!o.morto)
                           .forEach(o=>limpaCond(o,ef.limpaAliados));
  if(ef.condAliadosPerto)vizinhos(...h.pos).map(p=>em(...p)).filter(o=>o&&o.t===h.t&&!o.morto)
                           .forEach(o=>ef.condAliadosPerto.forEach(c=>aplicaCond(o,c.t,{st:c.st,tu:c.tu,dono:h})));
  /* ZONA — o alvo é o CHÃO, não a peça. Nasce onde a habilidade aponta (ou sob o
     próprio herói, quando ela é `alvo:"eu"`), e continua lá depois do turno. */
  if(ef.zona){
    const onde = (hb.alvo==="eu"||!alvo||!alvo.pos) ? h.pos : alvo.pos;
    poeZona(h.t,onde,{...ef.zona,n:hb.n,dono:h});
    txt+=` — ${hb.n} cobre ${ef.zona.raio||1} de raio pelos ${ZONA_TURNOS} próximos turnos do adversário`;
  }
  /* CÓPIA — o Tribunal do Arden. Executa o efeito registrado pela Jurisprudência
     como se fosse dele: Poder dele, dado dele, alvo escolhido por ele. Os
     limites já foram aplicados no registro (nunca Ultimate, nunca cópia de
     cópia); aqui resta o último, que é o que fecha o loop: a cópia roda com
     `copia:1` no contexto, então ela própria não pode ser registrada por outro
     Juiz nem por este. Um uso, e os autos ficam vazios. */
  if(ef.copia){
    if(h.autos){
      const autos=h.autos; h.autos=null;
      reg(J.vez?"c":"a",`⚖ TRIBUNAL — ${h.n} devolve ${autos.n}, de ${autos.de}`);
      toast(`TRIBUNAL: ${autos.n}`,"");
      const copiada={n:autos.n+" (cópia)",dados:autos.dados,alvo:autos.alvo,ef:{...autos.ef}};
      /* a cópia não herda o que não é dano nem condição: sem ouro, sem cura de
         inimigo, sem ward, sem zona e sem doar — ela é a SENTENÇA, não o kit */
      ["ouro","ouroSeMatar","doar","ward","revive","recurso","copia","baneEu",
       "custoVida","gastaTristeza","recuaLivre"].forEach(x=>delete copiada.ef[x]);
      resolveCopia(h,copiada,alvo,F);
    }else{
      reg("b","⚖ os autos estão vazios — o Tribunal cai no dano em raio");
    }
  }

  /* TROCA DE LUGAR — o Eco da Zhet. Ela vai para onde o alvo estava e o alvo para
     onde ela estava, o que resolve num gesto o "cheguei perto para bater e agora
     estou preso no meio deles".

     ACONTECE ANTES DO DANO, e isso não é detalhe de ordem: o Passo de Sombra
     (passiva dela) dispara em `danoCausado` e a tira uma casa de onde está. Com a
     troca depois do dano, a passiva mexia na peça e a troca desfazia — as duas
     metades do kit brigavam e a que valia era a última escrita. Trocando antes,
     as duas somam: ela aparece do outro lado do alvo e recua um passo. */
  if(ef.troca&&alvo&&!alvo.morto&&!ehEpico(alvo)&&noJogo(alvo)){
    const meu=[...h.pos]; h.pos=[...alvo.pos]; alvo.pos=meu;
    reg("b",`${h.n} troca de lugar com ${alvo.n}`);
    seloCond(h,"TROCOU","bom");
  }

  if(ef.dano||ef.danoFixo){
    let d = ef.danoFixo ? ef.danoFixo : base(ef.dano);
    if(ef.extra)d+=ef.extra;
    if(ef.bonusFerido&&alvo.vida<=alvo.vidaMax/2)d+=ef.bonusFerido;
    if(ef.bonusCond&&temCond(alvo,ef.bonusCond.t))d+=ef.bonusCond.dano;
    /* CONSOME — gasta a condição que o próprio kit plantou. É a sinergia interna
       que o desenho pediu: a Ultimate não é "a básica com mais dano", ela cobra
       a conta que as outras duas abriram. */
    if(ef.consome&&temCond(alvo,ef.consome.t)){
      const st=stacksDe(alvo,ef.consome.t);
      d+=st*ef.consome.danoPorStack;
      removeCond(alvo,ef.consome.t,"silencio");
      reg("b",`${CONDS[ef.consome.t].ico} ${h.n} cobra ${st} `
             +`acúmulo${st>1?"s":""} de ${CONDS[ef.consome.t].n}: +${st*ef.consome.danoPorStack}`);
    }
    if(ef.bonusPorRecurso){
      const q=recursoDe(h,ef.bonusPorRecurso.t);
      if(q){ d+=q*ef.bonusPorRecurso.dano; zeraRecurso(h,ef.bonusPorRecurso.t);
        reg("b",`${RECURSOS[ef.bonusPorRecurso.t].ico} ${h.n} queima ${q} de `
               +`${RECURSOS[ef.bonusPorRecurso.t].n}: +${q*ef.bonusPorRecurso.dano}`); }
    }
    if(motivoCrit){
      d=Math.round(d*COND_NUM.critico);
      reg("b",`CRÍTICO! ${h.n} — ${motivoCrit}`);
      toast("CRÍTICO!","gank"); if(alvo&&alvo.pos) fx(alvo.pos,"CRÍTICO!","crit");
      txt+=" — CRÍTICO";
    }
    /* EXECUÇÃO — o limiar deixou de ser número fixo em duas Ultimates: ele sobe
       com a condição que o próprio kit plantou. Visível na peça do alvo, então o
       adversário sabe quando saiu do alcance da execução. */
    let limiar=ef.executa||0;
    if(limiar&&ef.execPorStack) limiar+=stacksDe(alvo,ef.execPorStack.t)*ef.execPorStack.v;
    if(limiar&&ef.execSeCond&&temCond(alvo,ef.execSeCond.t)) limiar+=ef.execSeCond.v;
    if(limiar&&alvo.vida<=limiar&&!ehEpico(alvo)){
      reg("b",`EXECUÇÃO — ${h.n} elimina ${alvo.n} (limiar ${limiar})`);
      toast("EXECUÇÃO!","gank");
      mata(alvo,h);
    }
    else aplicaDano(h,alvo,d,txt,habSel===2||h.habs[habSel].f>=5,!!ef.danoFixo||!!ef.perfura,
                    {hb,slot:habSel});
    /* a ordem dentro do golpe: dano → condição da habilidade → passiva de acerto.
       A passiva vem por último para poder LER o que a habilidade deixou (é o que
       faz a Chinelada empilhar em cima do Puxão de Orelha). */
    poeCondsNoAlvo();
    if(!ehEpico(alvo)&&!alvo.morto) dispara("hit",h,alvo);
    /* o efeito com prazo entra DEPOIS do dano e só se o alvo sobreviveu: pendurar
       sangramento num defunto não faz sentido e ainda sujaria o crédito da morte */
    if(ef.dot&&!alvo.morto) poeDot(alvo,h,ef.dot.tipo,ef.dot.dano,ef.dot.rodadas);
    /* ESPALHA — o contágio da Ilva. Só espalha o que o alvo JÁ tinha: ela não
       cria veneno de graça, ela transmite. Sem isso o Miasma bastaria. */
    if(ef.espalha&&temCond(alvo,ef.espalha.t)&&alvo.pos){
      const vizinhosDoAlvo=inimigosNosHex(vizinhos(...alvo.pos),h).filter(o=>!ehEpico(o));
      vizinhosDoAlvo.forEach(o=>aplicaCond(o,ef.espalha.t,{tu:ef.espalha.tu||1,dono:h}));
      if(vizinhosDoAlvo.length) reg("b",`${CONDS[ef.espalha.t].ico} o ${CONDS[ef.espalha.t].n.toLowerCase()} `
        +`se espalha para ${vizinhosDoAlvo.length} vizinho${vizinhosDoAlvo.length>1?"s":""}`);
    }
    /* CONDIÇÃO COM ENDEREÇO — o Coco do Valti só atordoa quem pisou nas cascas.
       É a resposta ao §28: o controle mais forte do jogo tem pré-requisito
       visível no chão, e sair da zona é o contrajogo. */
    if(ef.condSeNaZona&&alvo&&!alvo.morto){
      const dentro=(J.zonas||[]).some(z=>z.t===h.t&&dist(...alvo.pos,...z.pos)<=z.raio);
      if(dentro) ef.condSeNaZona.forEach(c=>aplicaCond(alvo,c.t,{st:c.st,tu:c.tu,dono:h}));
      else reg("b",`${alvo.n} não estava em nenhuma armadilha de ${h.n} — sem efeito extra`);
    }
    /* DRENA — cura o que causou. Lê o dano REAL (o que entrou na vida), não o
       bruto: drenar em cima de armadura e escudo daria cura de mentira. */
    if(ef.drena&&h.vida>0&&!h.semCura&&J._ultimoDano>0){
      const q=Math.min(J._ultimoDano,h.vidaMax-h.vida);
      if(q>0){ h.vida+=q; reg("b",`${h.n} drena ${q} de vida (${h.vida}/${h.vidaMax})`);
        fx(h.pos,"+"+q,"cura"); }
    }
    if(ef.area) inimigosNosHex(vizinhos(...alvo.pos),h)
      .forEach(o=>danoEmEntidade(h,o,Math.round(d/2),hb.n,habSel===2,!!ef.danoFixo||!!ef.perfura));
    if(ef.ouroSeMatar&&alvo.morto)h.ouro+=ef.ouroSeMatar;
    h.recarga=0;
  }else { poeCondsNoAlvo(); reg(J.vez?"c":"a",txt); }

  if(ef.danoVizinhos) inimigosNosHex(vizinhos(...h.pos),h)
    .forEach(o=>danoEmEntidade(h,o,base(ef.danoVizinhos),hb.n,habSel===2));
  if(ef.danoRaio){
    const raio=[];
    for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++)
      if(noTab(c,r)&&dist(...h.pos,c,r)<=ef.danoRaio) raio.push([c,r]);
    inimigosNosHex(raio,h).forEach(o=>danoEmEntidade(h,o,Math.round(F*escalaDe(habSel))+poder,hb.n,habSel===2));
  }
  if(ef.condVizinhos) vizinhos(...h.pos).map(p=>em(...p)).filter(o=>o&&o.t!==h.t&&!o.morto)
    .forEach(o=>ef.condVizinhos.forEach(c=>aplicaCond(o,c.t,{st:c.st,tu:c.tu,dono:h})));
  if(ef.condRaio) J.times[1-h.t].herois.filter(o=>!o.morto&&noJogo(o)&&dist(...h.pos,...o.pos)<=3)
    .forEach(o=>ef.condRaio.forEach(c=>aplicaCond(o,c.t,{st:c.st,tu:c.tu,dono:h})));
  if(ef.prendeVizinhos) vizinhos(...h.pos).map(p=>em(...p)).filter(o=>o&&o.t!==h.t)
    .forEach(o=>prende(o,h));   /* prender só vale em herói */
  if(ef.empurraVizinhos) vizinhos(...h.pos).map(p=>em(...p)).filter(o=>o&&o.t!==h.t&&!o.morto)
    .forEach(o=>desloca(o,h.pos,1,1));
  /* o Vento Contrário limpa a vizinhança DO ALIADO, não a dela: é habilidade de
     socorro, e o socorro acontece onde o outro está apanhando */
  if(ef.empurraDoAlvo&&alvo&&alvo.pos) vizinhos(...alvo.pos).map(p=>em(...p))
    .filter(o=>o&&o.t!==h.t&&!o.morto).forEach(o=>desloca(o,alvo.pos,1,1));
  if(ef.prende&&alvo) prende(alvo,h);
  if(ef.puxar&&alvo&&!alvo.morto&&!ehEpico(alvo)) desloca(alvo,h.pos,-1,ef.puxar);
  if(ef.empurrar&&alvo&&!alvo.morto&&!ehEpico(alvo)) desloca(alvo,h.pos,1,ef.empurrar);
  /* RECUO LIVRE — reposicionamento que não passa pelo Dado Mestre. O Catarino é
     atirador: o valor dele é a distância, e é ela que a habilidade compra. */
  if(ef.recuaLivre) recuaLonge(h,ef.recuaLivre);
  /* BANIMENTO PRÓPRIO por último: depois de o Trio de Sombras já ter machucado
     todo mundo. Sair antes seria sair sem pagar o preço de entrar. */
  if(ef.baneEu) aplicaCond(h,"banido",{tu:1,dono:h});

  h.emboscada=0;
  dispara("habUsada",h,hb,habSel,alvo);
  ativo=null; habSel=null; calcula(); pinta();
}
/* PRISÃO — porta única, para a Tenacidade poder responder a ela como responde a
   qualquer controle. `preso=2` porque ele decresce no início do turno do dono
   (ver expiraDoTime): 2 dá exatamente uma rodada parada. */
function prende(alvo,quem){
  if(!alvo||alvo.morto||ehEpico(alvo))return false;
  if(temCond(alvo,"tenacidade")){
    removeCond(alvo,"tenacidade","silencio");
    reg("b",`${CONDS.tenacidade.ico} TENACIDADE — ${alvo.n} anula a prisão`);
    seloCond(alvo,"TENACIDADE!","bom");
    return false;
  }
  alvo.preso=2; reg("b",`🔒 ${alvo.n} está preso`); seloCond(alvo,"PRESO!","mal");
  return true;
}
/* REVELAÇÃO — o contrajogo da Invisibilidade e do mato, num lugar só */
function revelaAoRedor(h,raio){
  const pegos=J.times[1-h.t].herois.filter(o=>!o.morto&&noJogo(o)&&dist(...h.pos,...o.pos)<=raio);
  pegos.forEach(o=>aplicaCond(o,"revelado",{tu:1,dono:h}));
  if(pegos.length){
    reg("b",`${CONDS.revelado.ico} ${h.n} revela ${pegos.length} inimigo${pegos.length>1?"s":""}`);
    toast("REVELADO!","gank");
  }
}
/* recua até `n` casas de graça, sempre para longe do inimigo mais próximo */
function recuaLonge(h,n){
  /* recua do que ele VÊ. Usar a posição real de um inimigo escondido faria a
     habilidade vazar informação — e vazaria para os dois lados, porque a IA usa
     exatamente esta função. Sem ninguém à vista, não há de quem recuar. */
  const visiveis=J.times[1-h.t].herois.filter(o=>!o.morto&&noJogo(o)&&visivelPara(o,h.t));
  const perto=visiveis.sort((a,b)=>dist(...h.pos,...a.pos)-dist(...h.pos,...b.pos))[0];
  if(!perto)return;
  const de=[...h.pos];
  desloca(h,perto.pos,1,n);
  if(de[0]!==h.pos[0]||de[1]!==h.pos[1]){
    reg(J.vez?"c":"a",`${h.n} recua ${dist(...de,...h.pos)} casa(s) de graça`);
    animaMovimento(h,de);
  }
}
/* Resolve a habilidade COPIADA. Não reentra em `usaHab` de propósito: aquela
   função lê `ativo` e `habSel` globais, e reentrar nela do meio de si mesma foi
   exatamente o loop que o desenho mandou impedir. Aqui só o que uma sentença
   precisa: dano, condição e deslocamento. */
function resolveCopia(h,hb,alvo,F){
  const ef=hb.ef;
  if(!alvo||alvo.morto)return;
  const poder=poderTotal(h)+dupla(h);
  if(ef.dano||ef.danoFixo){
    let d=ef.danoFixo?ef.danoFixo:Math.round(F*(ef.dano||1))+poder;
    if(ef.extra)d+=ef.extra;
    if(ef.bonusFerido&&alvo.vida<=alvo.vidaMax/2)d+=ef.bonusFerido;
    aplicaDano(h,alvo,d,`${h.n} devolve ${hb.n}`,false,!!ef.danoFixo||!!ef.perfura,
               {hb,slot:0,copia:1});
  }
  if(ef.cond&&!alvo.morto) ef.cond.forEach(c=>aplicaCond(alvo,c.t,{st:c.st,tu:c.tu,dono:h}));
  if(ef.marca&&!alvo.morto) aplicaCond(alvo,"marcado",{st:ef.marca,dono:h});
  if(ef.prende&&!alvo.morto) prende(alvo,h);
  if(ef.puxar&&!alvo.morto) desloca(alvo,h.pos,-1,ef.puxar);
  if(ef.empurrar&&!alvo.morto) desloca(alvo,h.pos,1,ef.empurrar);
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
      .filter(v=>!em(...v)&&!ehBloqueado(...v))   /* não se empurra ninguém para dentro do ônibus */
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
function aplicaDano(quem,alvo,bruto,txt,ehUlt,ignoraArm,ctx){
  /* antes de qualquer coisa: bateu em herói inimigo, entregou a posição.
     Fica aqui e não em cada habilidade porque este é o funil por onde passam
     básica, ultimate e respingo — três lugares, uma regra.
     Vale para a Invisibilidade também, e é o contrajogo dela: atacar revela. */
  if(quem&&quem.t!==alvo.t&&!ehEpico(quem)&&!ehEpico(alvo)) entregaPosicao(quem);
  /* BANIDO não está no tabuleiro. Vem antes de intocável porque é mais forte:
     intocável recusa o golpe, banido não tem onde o golpe chegar. */
  if(!ehEpico(alvo)&&temCond(alvo,"banido")){
    reg("b",`${CONDS.banido.ico} ${alvo.n} está fora do tabuleiro — sem efeito`); return; }
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
  /* MARCADO virou condição, e o bônus dela é consumido AQUI, no funil, como o
     campo `marca` sempre foi — mas agora aparece na peça antes de ser gasto. */
  const marcado=(!ehEpico(alvo)?stacksDe(alvo,"marcado"):0);
  if(marcado) removeCond(alvo,"marcado","silencio");
  /* GUARDA-CORPO do Caramêlo: aliado colado nele apanha menos. Entra depois da
     armadura e antes do escudo — reduz o dano que CHEGA, não o que é absorvido. */
  const guarda=(!ehEpico(alvo)?reducaoDeAliados(alvo):0);
  let d=Math.max(1,bruto+marcado-(ignoraArm?0:armTotal(alvo))-guarda);
  if(guarda&&bruto+marcado-(ignoraArm?0:armTotal(alvo))>d)
    reg("b",`🐕 guarda-corpo abate ${guarda} do golpe em ${alvo.n}`);
  if(alvo.esc>0){ const abs=Math.min(alvo.esc,d); alvo.esc-=abs; d-=abs;
    if(abs)reg("b",`escudo de ${alvo.n} absorve ${abs}`); }
  alvo.vida-=d;
  /* guardado para quem drena: é o dano que ENTROU na vida, não o bruto */
  J._ultimoDano=d;
  reg(quem.t?"c":"a",`${txt||quem.n+" ataca"} → ${d} em ${alvo.n} (${Math.max(0,alvo.vida)}/${alvo.vidaMax})`);
  const rb=bonus(quem,"roubo");
  if(rb&&quem.vida>0){ quem.vida=Math.min(quem.vidaMax,quem.vida+rb); reg("b",`${quem.n} rouba ${rb} de vida`); }
  if(bonus(quem,"antiCura")){ alvo.semCura=2; }
  /* PASSIVAS DO GOLPE. Os três eventos saem do mesmo lugar, na ordem em que a
     mesa os narraria: quem bateu, quem levou, e o time de quem levou. */
  if(!ehEpico(quem)) dispara("danoCausado",quem,alvo,d);
  if(!ehEpico(alvo)){
    dispara("danoRecebido",alvo,quem,d,ctx);
    J.times[alvo.t].herois.forEach(o=>dispara("danoRecebidoAliado",o,alvo,d));
  }
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
  /* MORTE LIMPA A MESA. O respawn devolve o herói inteiro, e sangramento que
     sobrevivesse à morte cobraria duas vezes pelo mesmo golpe. A regra do §40 é
     ampla de propósito: SAI TUDO — sangramento, veneno, lentidão, atordoamento,
     invisibilidade, marca, banimento, tenacidade. Voltar do respawn com
     condição pendurada é a única coisa que precisaria de exceção declarada, e
     nenhuma condição do jogo pediu uma.
     Recurso de personagem NÃO sai: a Alma que o Torvald já recolheu é
     permanente, e a Tristeza do Emerson é a memória dele. */
  const ondeMorreu=[...alvo.pos];
  alvo.vida=0; alvo.morto=respawnAgora(); alvo.esc=0; alvo.intoc=0;
  alvo.conds=[]; alvo.dots=[]; alvo.curouSitiado=0; alvo.preso=0; alvo.voltaEm=null;
  alvo.autos=null; alvo.alcTurno=0; alvo.ultimoAlvo=null;
  quem.ouro+=OURO_ABATE;
  reg("b",`☠ ${alvo.n} morreu — volta em ${alvo.morto} rodada${alvo.morto>1?"s":""} · ${quem.n} leva ${OURO_ABATE} de ouro`);
  /* os dois eventos da morte. `morreu` vai para TODO MUNDO no tabuleiro porque
     as passivas que o escutam (Digestão, Almas, Coleta, Tristeza) medem por
     distância, e cada uma decide sozinha se estava perto o bastante. */
  alvo.pos=ondeMorreu;
  if(quem&&!ehEpico(quem)) dispara("matou",quem,alvo);
  disparaTodos("morreu",alvo,quem);
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
    &&(!d.dono||d.dono===h.id)&&h.habs.some(hb=>dadoServe(hb,h,d.v)));
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
  /* NUNCA MOSTRAR FÓRMULA. Relato do playtest: "o ult do Catarino tá a fórmula,
     quero já o resultado do dano". Ela aparecia quando não havia dado utilizável
     na mesa (`F` nulo) — justamente na habilidade apagada, que é quando o jogador
     mais precisa saber quanto ela daria para decidir se vale guardar o dado.
     Sem dado, mostra o INTERVALO do dado mínimo dela até o 6. */
  const golpe=d=>Math.round(d*e.dano*esc)+p+(e.extra||0);
  /* v49: o intervalo é o da FAIXA DE DADO da habilidade, e não mais "do mínimo
     até 6" — uma básica que só sai com 1 ou 2 nunca chegou a dar o dano de um 6,
     e a ficha prometia isso. */
  const faixa=()=>{ const fx=faixaDeHab(hb,h);
                    const lo=golpe(Math.min(...fx)), hi=golpe(Math.max(...fx));
                    return lo===hi?`${lo} de dano`:`${lo} a ${hi} de dano`; };
  if(e.danoFixo) t.push(`${e.danoFixo} de dano garantido · ignora armadura`);
  else if(e.dano){
    t.push((F!=null?`~${golpe(F)} de dano`:faixa())
          +(e.perfura?" · ignora armadura":""));
  }
  if(e.area) t.push("respinga nos vizinhos");
  if(e.danoVizinhos) t.push("dano em todos os vizinhos");
  if(e.danoRaio) t.push(`dano em todos até ${e.danoRaio} casas`);
  if(e.escudo) t.push(`escudo ${F!=null?F+e.escudo
     :(()=>{const fx=faixaDeHab(hb,h), lo=Math.min(...fx)+e.escudo, hi=Math.max(...fx)+e.escudo;
             return lo===hi?String(lo):`${lo} a ${hi}`;})()}`);
  if(e.cura) t.push(`cura ${e.cura}`);
  if(e.ouro) t.push(`+${e.ouro} de ouro`);
  if(e.recarga) t.push(`próximo golpe +${e.recarga}`);
  if(e.intocavel) t.push("fica intocável");
  if(e.ward) t.push("posta uma ward aqui");
  if(e.revive) t.push("acelera o respawn de um aliado");
  if(e.marca) t.push(`marca: próximo dano +${e.marca}`);
  if(e.doar) t.push("passa este dado a um aliado");
  if(e.puxar) t.push("puxa");
  if(e.empurrar||e.empurraVizinhos||e.empurraDoAlvo) t.push("empurra");
  if(e.prende||e.prendeVizinhos) t.push("prende");
  if(e.executa) t.push(`executa com ${e.executa} de vida ou menos`);
  if(e.execPorStack) t.push(`+${e.execPorStack.v} no limiar por ${CONDS[e.execPorStack.t].ico}`);
  if(e.execSeCond) t.push(`+${e.execSeCond.v} no limiar contra ${CONDS[e.execSeCond.t].ico}`);
  if(e.bonusFerido) t.push(`+${e.bonusFerido} em alvo ferido`);
  if(e.semAlcance) t.push("qualquer distância");
  else if(hb.alc===1) t.push("corpo a corpo");
  else if(hb.alc>1&&hb.alvo!=="eu") t.push(`alcance ${alcDeHab(h,hb)}`);
  /* v45 — o painel de comando fala o mesmo vocabulário do resto do jogo. Curto:
     aqui é o botão, e a regra inteira mora no tooltip e na ficha. */
  const ic=l=>l.map(c=>CONDS[c.t].ico+(c.st>1?"×"+c.st:"")).join("");
  if(e.cond)            t.push("aplica "+ic(e.cond));
  if(e.condEu)          t.push("ganha "+ic(e.condEu));
  if(e.condVizinhos)    t.push("aplica "+ic(e.condVizinhos)+" nos vizinhos");
  if(e.condRaio)        t.push("aplica "+ic(e.condRaio)+" no raio");
  if(e.condAliadosPerto)t.push("dá "+ic(e.condAliadosPerto)+" aos aliados colados");
  if(e.condSeNaZona)    t.push("aplica "+ic(e.condSeNaZona)+" se o alvo estiver na armadilha");
  if(e.bonusCond)       t.push(`+${e.bonusCond.dano} contra ${CONDS[e.bonusCond.t].ico}`);
  if(e.consome)         t.push(`consome ${CONDS[e.consome.t].ico}: +${e.consome.danoPorStack} cada`);
  if(e.bonusPorRecurso) t.push(`+${e.bonusPorRecurso.dano} por ${RECURSOS[e.bonusPorRecurso.t].ico}`
                              +` (tem ${recursoDe(h,e.bonusPorRecurso.t)})`);
  if(e.critSempre)      t.push("sempre CRÍTICO");
  if(e.critSe)          t.push("pode ser CRÍTICO");
  if(e.custoVida)       t.push(`custa ${e.custoVida} da própria vida`);
  if(e.drena)           t.push("cura o que causar");
  if(e.espalha)         t.push(`espalha ${CONDS[e.espalha.t].ico}`);
  if(e.limpa||e.limpaEu||e.limpaAliados) t.push("limpa condição ruim");
  if(e.troca)           t.push("troca de lugar com o alvo");
  if(e.baneEu)          t.push("some do tabuleiro por 1 turno");
  if(e.recuaLivre)      t.push(`recua ${e.recuaLivre} de graça`);
  if(e.copia)           t.push(h.autos?`devolve ${h.autos.n}`:"sem nada nos autos");
  if(e.revelaRaio)      t.push(`revela até ${e.revelaRaio} casas`);
  if(e.escudoAliados)   t.push(`escudo ${e.escudoAliados} nos aliados colados`);
  if(e.recurso)         t.push(`enche ${RECURSOS[e.recurso.t].ico}`);
  if(e.alcanceTurno)    t.push(`alcance +${e.alcanceTurno}`);
  if(e.zona)            t.push("deixa uma zona no chão");
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
/* ---------- AVISO DE CONDIÇÃO ----------
   O §23 e o §24 pediram a mesma coisa por dois lados: quando a condição CHEGA e
   quando ela SAI, o jogador precisa ver, e depois só o indicador pequeno fica.
   É o `fx` de sempre com outra classe — nada de tela nova, nada de modal. O aviso
   de fim é discreto de propósito: "VENENO ACABOU" não merece o mesmo tamanho de
   "ATORDOADO!".

   Cala durante a SONDA da IA (ela chama iniciaHab dezenas de vezes por turno só
   para descobrir o que dá para fazer) e cala fora do turno visível — senão a
   tela do jogador piscaria com condições aplicadas do outro lado do mapa. */
function seloCond(h,txt,tipo){
  if(sondando||!h||!h.pos||simMode)return;
  try{ fx(h.pos,txt,"selo-"+(tipo||"mal")); }catch(e){}
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
  if(modo==="mover"&&selHeroi&&!selHeroi.morto&&selHeroi.t===J.vez&&!selHeroi.preso
     &&!temCond(selHeroi,"atordoado")&&!temCond(selHeroi,"banido")&&J.mov.rest>0){
    const teto=tetoAndar(selHeroi);
    /* a régua é ANDANDO, contornando obstáculo — casa atrás de um ônibus pode
       estar a 2 em linha reta e a 4 a pé, e é o 4 que vale */
    const passos=passosDe(selHeroi.pos);
    for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
      if(!noTab(c,r)||em(c,r)||ehBloqueado(c,r))continue;  // fora do tabuleiro, ocupada ou obstáculo
      const d=passos.get(k(c,r));
      if(d!==undefined&&d>0&&d<=teto) mover.push([c,r]);
    }
  }
  /* o Lampejo pinta as mesmas casas verdes do mover, mas com outra régua:
     ignora movimento restante e ignora `preso`. Só não atravessa para dentro
     da base inimiga — de lá o Nexus ficaria a um salto de distância. */
  if(modo==="lampejo"&&selHeroi&&!selHeroi.morto&&selHeroi.t===J.vez&&temFeitico(selHeroi.t)){
    for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
      /* o Lampejo é salto: passa POR CIMA do obstáculo, mas não pousa nele */
      if(!noTab(c,r)||em(c,r)||ehBloqueado(c,r))continue;
      if(BASE_S.get(k(c,r))===1-selHeroi.t)continue;
      const d=dist(...selHeroi.pos,c,r);
      if(d>0&&d<=LAMPEJO_ALC) mover.push([c,r]);
    }
  }
  /* Recuo: uma casa, de graça, ignorando movimento restante e prisão — é uma
     carta de reação, e o ponto dela é justamente escapar de onde você travou. */
  if(modo==="recuo"&&selHeroi&&!selHeroi.morto){
    mover=vizinhos(...selHeroi.pos).filter(([c,r])=>noTab(c,r)&&!em(c,r)&&!ehBloqueado(c,r)
      &&BASE_S.get(k(c,r))!==1-selHeroi.t);
  }
  if(modo==="mirar"&&selHeroi&&habAtual!==null){
    const h=selHeroi, hb=h.habs[habAtual], alc=alcDeHab(h,hb);
    alvos=todos().filter(o=>{
      if(o.morto)return false;
      if(!noJogo(o))return false;               // banido: não está no tabuleiro
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

/* dado que será gasto: o escolhido à mão, senão o EMPRESTADO, senão o menor que
   atende.

   ── O BUG DO DADO DO EMO (v48) ──
   Relato: *"o Emo empresta um dado, o aliado ataca, e o jogo consome um dado de
   ação normal — o jogador perde uma ação à toa."* Reproduzido e verdadeiro.

   A causa era esta função. Ela escolhia o MENOR dado que atendesse à Força, e o
   dado doado era só mais um da fila. Doado 6, com um 1 livre na mesa: o 1 é
   menor, então era o 1 que ia embora — e o 6 doado ficava lá, inútil, porque
   ele tem DONO (ninguém mais o gasta) e o dono já tinha `agiu`. O time pagava
   duas vezes: o dado que o Emo queimou para doar e o dado que o aliado gastou.

   A regra que conserta é uma frase: **o dado emprestado substitui o recurso,
   então ele sai primeiro.** Ele é o único da mesa que não serve a mais ninguém
   e que expira no fim do turno; guardá-lo é jogá-lo fora.

   O que NÃO mudou, de propósito (§7 do pedido): o empréstimo continua valendo
   UMA ação, a do herói que recebeu. Ele não vira ataque grátis — quem paga o
   preço é o Emo, com o próprio dado e o próprio turno.

   A escolha à mão continua ganhando de tudo: se o jogador tocou num dado, é
   aquele que ele quer gastar, emprestado ou não.

   `quem` existe porque a IA pergunta por vários heróis em sequência ANTES de
   selecionar qualquer um (`iaJogadas` só faz `selHeroi=h` depois de chamar
   aqui): sem o parâmetro, a dona do dado era a peça do laço anterior, e a IA
   media a jogada com o dado errado. */
function dadoPara(hb,quem){
  const dono=quem||selHeroi;
  if(dadoSel!==null&&!J.dados[dadoSel].usado&&dadoServe(hb,dono,J.dados[dadoSel].v)
     &&(!J.dados[dadoSel].dono||J.dados[dadoSel].dono===dono?.id)) return dadoSel;
  const serve=d=>!d.usado&&dadoServe(hb,dono,d.v)&&(!d.dono||d.dono===dono?.id);
  let melhor=null;
  J.dados.forEach((d,i)=>{
    if(!serve(d))return;
    const atual=melhor===null?null:J.dados[melhor];
    /* emprestado ganha de qualquer dado comum; entre dois iguais, o menor */
    if(atual===null||(!!d.doado&&!atual.doado)
       ||(!!d.doado===!!atual.doado&&d.v<atual.v)) melhor=i;
  });
  return melhor;
}

function escolheHeroi(h){
  if(mesaTravada())return;
  /* DESEMPATE NO HEXÁGONO. Se há qualquer coisa mirável embaixo desta peça —
     torre, poço, Nexus ou o próprio herói —, quem escolhe é o jogador.

     A v46 corrigiu o caso que faltava, e era o mais comum de todos: **a peça em
     cima da torre era SUA**. `alvos` só tem inimigo, então o `includes` dava
     falso, a função caía no ramo de seleção e `limpaModo()` CANCELAVA a mira —
     o jogador mirava a torre, encostava nela e o toque desfazia a própria
     jogada. Cercar a torre com o seu herói em cima dela era impossível.

     Agora a pergunta certa é "há alvo nesta casa?", e não "este herói é alvo?".
     `alvosNoHex` já sabia responder desde a v37; ninguém estava perguntando. */
  if(modo==="mirar"&&alvosNoHex(...h.pos).length) return tocaAlvo(...h.pos);
  if(h.t!==J.vez||h.morto){ // inspeciona o adversário sem mudar de estado
    abreCarta(h); return;
  }
  limpaModo();
  selHeroi = selHeroi===h ? null : h;
  pinta();
}
function iniciaMover(){
  if(!selHeroi||J.mov.rest<=0)return;
  if(selHeroi.preso) return toast("🔒 preso nesta rodada","morte");
  if(temCond(selHeroi,"atordoado")) return toast(`${CONDS.atordoado.ico} atordoado — não anda`,"morte");
  if(temCond(selHeroi,"banido")) return toast("está fora do tabuleiro","morte");
  modo = modo==="mover" ? null : "mover";
  habAtual=null; confirmar=null; calcula(); vibra(8); pinta();
}
/* Por que o herói não pode agir agora. Uma função, para o painel, o tabuleiro e
   a IA darem a MESMA resposta — e para a mensagem na tela ser a regra, não uma
   frase escrita à mão em cada lugar. */
function travaDeAcao(h,i){
  if(!h)return null;
  if(temCond(h,"banido"))    return "está fora do tabuleiro";
  if(temCond(h,"atordoado")) return `${CONDS.atordoado.ico} atordoado — não age neste turno`;
  if(temCond(h,"silenciado")&&i>0) return `${CONDS.silenciado.ico} silenciado — só a básica`;
  return null;
}
function iniciaHab(i){
  if(!selHeroi)return;
  const trava=travaDeAcao(selHeroi,i);
  if(trava) return toast(trava,"morte");
  /* um dado de ação por herói por rodada. É o que o manual sempre prometeu:
     3 dados para 5 heróis, e quem fica de fora farma 3. Sem esta trava dava
     para empilhar os 3 dados no mesmo herói e atacar três vezes. */
  if(selHeroi.agiu) return toast("já agiu nesta rodada","morte");
  const hb=selHeroi.habs[i];
  const d=dadoPara(hb);
  if(d===null) return toast(`nenhum dado na faixa ${textoFaixa(hb,selHeroi)}`,"morte");
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
/* o golpe na torre não passa por usaHab: torre não tem escudo, status nem
   condição. Tem ARMADURA, e a conta é a de `golpeEmEstrutura`.

   O que mudou na v48: o golpe deixou de ser 1 fixo. Antes, três golpes
   derrubavam qualquer torre — do tanque com dado 1 ao atirador com Ultimate e
   três itens de Poder. Investir não mudava nada, e a estrutura não comunicava
   resistência nenhuma.

   A trava de "um golpe por rodada" saiu na v16. Ela era invisível e enganava:
   o jogador que gastava o dado doado pelo Suporte para bater de novo na mesma
   torre via a ação sumir sem explicação nenhuma na tela. A estrutura agora é
   como qualquer alvo — se sobra recurso, dá para bater de novo, e o teto vira o
   que sempre deveria ter sido: dado na mesa e herói que ainda não agiu. */
function atacaTorre(tr){
  if(!selHeroi||habAtual===null)return;
  const h=selHeroi, hb=h.habs[habAtual], di=dadoPara(hb);
  if(di===null)return;
  const F=J.dados[di].v;
  J.dados[di].usado=1; h.agiu=1; dadoSel=null; vibra(16);

  const comAriete=(J.times[h.t].barao>0&&J.times[h.t].dadiva==="ariete");
  const golpe=golpeEmEstrutura(h,hb,habAtual,F);
  tr.vida-=golpe;
  /* quem mergulhou fica marcado até o fim do turno: é ele que a torre procura
     primeiro no disparo automático */
  h.mergulhou=1;
  agendaAnim(()=>animaAtaque(h,ROTAS[tr.rota][tr.i]));
  reg(J.vez?"c":"a",`${h.n} bate na torre do ${tr.rota} com ${hb.n} (dado ${F}) `+
      `−${golpe}${comAriete?" (ARÍETE)":""} (${Math.max(0,tr.vida)}/${VIDA_TORRE})`);
  fx(ROTAS[tr.rota][tr.i],"-"+golpe,"dano");

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
/* O GOLPE DE HERÓI EM ESTRUTURA — uma porta só, pela mesma razão que
   `golpeNoPoco` existe: o motor cobra e a IA avalia lendo daqui, então os dois
   nunca discordam. Espelha a fórmula do herói de propósito (Força × escala do
   slot + Poder), porque foi ela que o jogador aprendeu a ler.

   O que ENTRA: o dado, a escala do slot, o Poder (item incluído), o Carregado
   do Recarregar e do Encher o Pulmão, o multiplicador de estrutura da
   habilidade e o Aríete do Barão.
   O que NÃO entra: crítico, emboscada, drena, execução, condição e qualquer
   passiva que fale de um alvo vivo. Concreto não sangra, não se assusta e não
   está isolado. */
function golpeEmEstrutura(h,hb,slot,F){
  const ef=hb.ef;
  if(!podeAtingirEstrutura(hb)) return 0;
  const ariete=(J.times[h.t].barao>0&&J.times[h.t].dadiva==="ariete")?ARIETE_MULT:1;
  const mult=multEstrutura(hb)*ariete;
  if(ef.danoFixo) return Math.max(DANO_ESTRUTURA_MIN,Math.round(ef.danoFixo*mult));
  const bruto=Math.round(F*(ef.dano||1)*escalaDe(slot))+poderTotal(h)+(h.recarga||0);
  /* perfurante ignora a armadura da estrutura pelo mesmo motivo que ignora a de
     um herói e a do Barão — é a função dela */
  const util=ef.perfura?bruto:bruto-ARM_ESTRUTURA;
  /* O PISO VEM ANTES DO MULTIPLICADOR, e a v49 é quem mostrou por quê. Com a
     faixa exata, a básica bate na armadura da torre e sai no piso de 1; quando o
     multiplicador entrava primeiro, `round(util*2)` de um `util` negativo
     continuava negativo e o piso comia o Aríete inteiro — a dádiva prometia o
     dobro e entregava o mesmo 1. Piso primeiro, dobro depois: o dobro de 1 é 2,
     que é o que a carta diz. */
  return Math.max(DANO_ESTRUTURA_MIN,
                  Math.round(Math.max(DANO_ESTRUTURA_MIN,util)*mult));
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

/* ═══════════════════════════════════════════════════════════════════
   mesaTravada() — A PORTA ÚNICA DO GESTO HUMANO (v46)
   ═══════════════════════════════════════════════════════════════════
   Relato do Vilker, e ele repetiu duas vezes: *"ainda consigo selecionar as
   teclas no turno do adversário"*. É verdade, e a causa não é óbvia — **a
   própria IA pinta os destinos dela**. Quando ela decide mover, o motor faz
   `selHeroi=h; modo="mover"; calcula()`, e `pinta` desenha as casas verdes já
   com `onclick` funcionando. O dedo do humano acha aquilo pronto na tela.

   O painel de comando se protegia sozinho, com `J.fase!=="jogando"`. O
   TABULEIRO não; os dados não; as placas não; o arrasto não. Cada um tinha (ou
   não tinha) a própria condição, escrita à mão, e bastava esquecer de uma.

   Agora existe UMA porta, e todo gesto do humano passa por ela. A IA **não**
   passa: ela chama `moveAte`, `iniciaHab` e `confirmaHab` direto, sem evento —
   e é justamente por isso que a trava mora nos ouvintes de clique e não dentro
   das funções de regra. Pôr a trava lá dentro pararia a IA também.

   O que ela fecha:
     · fase que não é de jogar (rotação do Caçador, draft, fim de partida);
     · a vez da máquina, e o rabo dela: `iaRodando` continua ligado durante
       `encerraTurno`/`fimDaRodada`, que rodam de dentro do turno dela já com a
       vez virada;
     · a janela de 350ms depois de um arrasto, que já existia como
       `cliqueBloqueado`. */
const mesaTravada=()=>!J||J.fim!==null||J.fase!=="jogando"
  ||cliqueBloqueado||(aiMode&&(iaRodando||J.vez===1));

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
/* o arrasto era o gesto que mais escapava: ele tinha a própria lista de
   condições, e `aiMode` não estava nela — dava para arrastar a peça da IA */
const podeArrastar=h=>h&&!h.morto&&h.t===J.vez&&!mesaTravada()
  &&!h.preso&&!temCond(h,"atordoado")&&!temCond(h,"banido")
  &&J.mov.rest>0&&!sheetAberto;

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
/* ═══════════════════════════════════════════════════════════════════
   OS INDICADORES DA PECA  (§17 a §22)
   ═══════════════════════════════════════════════════════════════════
   `condsDaPeca` é a lista única que alimenta os TRÊS lugares onde o estado
   aparece: os iconezinhos ao lado do totem, a etiqueta grande e a seção
   CONDIÇÕES da ficha. Um lugar só, então os três nunca discordam — que é
   exatamente o defeito que o §22 pediu para não existir.

   A ORDEM é a de consequência, e ela é a mesma que a etiqueta grande usa: o que
   IMPEDE de jogar vem antes do que só dói, e o que só dói vem antes do que
   modifica o próximo golpe. Assim, quando só cabem três ícones, os três que
   ficam são os três que mudam a decisão.

   `preso` e `escudo` entram aqui apesar de não morarem em `h.conds`: para quem
   olha a mesa, "estou preso" é uma condição como qualquer outra, e obrigar o
   jogador a saber qual delas o motor guarda em que variável seria absurdo. */
const ORDEM_PECA=["atordoado","banido","silenciado","preso","lentidao","veneno",
                  "sangramento","catarino","marcado","vulneravel","revelado",
                  "invisivel","tenacidade","escudo"];
function condsDaPeca(h){
  const fora=[];
  const meu = (typeof J!=="undefined" && J && h.t===ladoDaTela());
  /* `un` é a UNIDADE do número, e existe porque os três tipos de contador do
     jogo se leem diferente: acúmulo é "×2", prazo é "2 turnos", e escudo é
     só "17". Sem isso a ficha dizia "escudo · 17 turnos". */
  const poe=(o)=>{ fora.push(Object.assign({mal:0,q:0,un:"num",peso:99},o)); };
  const peso=t=>{ const i=ORDEM_PECA.indexOf(t); return i<0?99:i; };

  if(h.preso) poe({ico:"🔒",rot:"PRESO",n:"Preso",mal:1,q:0,peso:peso("preso"),
    d:"Não anda nesta rodada. Continua agindo e continua sendo alvo."});

  (h.conds||[]).forEach(c=>{
    const d=CONDS[c.t]; if(!d)return;
    /* INVISÍVEL só o dono vê — para o adversário, o ícone entregaria justamente
       o que a condição comprou. Mesma regra que ESCONDIDO já seguia. */
    if(c.t==="invisivel"&&!meu)return;
    poe({ico:d.ico,rot:d.selo,n:d.n,mal:d.mal?1:0,d:d.d,peso:peso(c.t),
         q:d.pilha?(c.st||0):(c.tu||0), un:d.pilha?"stack":"turno"});
  });

  if(h.esc>0) poe({ico:"⛨",rot:"ESCUDO",n:"Escudo",q:h.esc,peso:peso("escudo"),
    d:"Absorve dano antes da vida. Vale até o começo do seu próximo turno."});
  if(h.recarga) poe({ico:"🎯",rot:"CARREGADO",n:"Carregado",q:h.recarga,
    d:"O próximo golpe dele leva o bônus e depois zera."});
  if(h.semCura) poe({ico:"🚫",rot:"SEM CURA",n:"Sem cura",mal:1,
    d:"Não pode ser curado enquanto durar."});

  /* RECURSO DE PERSONAGEM entra na mesma fileira: para o jogador, "3 Cargas" é
     informação de tabuleiro do mesmo tipo que "2 de sangramento". */
  Object.entries(h.rec||{}).forEach(([t,q])=>{
    if(!q||!RECURSOS[t])return;
    const d=RECURSOS[t];
    poe({ico:d.ico,rot:d.n.toUpperCase(),n:d.n,q,un:"stack",d:d.d});
  });
  return fora.sort((a,b)=>a.peso-b.peso);
}
/* o número do indicador, escrito do jeito que se lê */
const qtdCond=x=>!x.q?"":x.un==="stack"?` ×${x.q}`
  :x.un==="turno"?(x.q>1?` · ${x.q} turnos`:" · 1 turno"):` ${x.q}`;
/* quantos ícones cabem ao lado do totem antes de virar sopa (§20) */
const ICONES_NA_PECA=3;

/* A ETIQUETA GRANDE — uma só, a de maior consequência, para não virar sopa de
   ícone (a fileira pequena ao lado dá conta do resto).

   A ESCADA VIROU LISTA. Antes era um `if` por estado, e a ordem estava escrita na
   ordem dos `if` — com doze condições novas seriam doze edições e nenhuma
   garantia de que a prioridade continuava fazendo sentido. Agora a prioridade
   mora num lugar só (`ORDEM_PECA`) e vale para o ícone e para a etiqueta.

   O que ainda é `if` aqui embaixo é o que NÃO é condição: intocável responde
   "por que meu golpe não fez nada?", e escondido/revelado só interessam ao dono
   da peça — para o adversário, "escondido" é justamente o que ele não deveria
   saber. */
function estadoDaPeca(h){
  if(h.intoc) return {k:"bom", txt:"INTOCÁVEL"};
  const lista=condsDaPeca(h);
  const pior=lista.find(x=>x.mal);
  if(pior) return {k:"mal", txt:pior.rot+(pior.un==="stack"&&pior.q>1?" ×"+pior.q:"")};
  const bom=lista.find(x=>!x.mal);
  if(bom) return {k:"bom", txt:bom.rot+(bom.un==="stack"&&bom.q>1?" ×"+bom.q:"")};
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
    if(ehBloqueado(c,r))cls+=" bloq";
    if(k(c,r)!==POCO_K&&!enxergaCasa(ladoDaTela(),c,r)) cls+=" cego";
    if(wardS.has(k(c,r)))cls+=" wardado";
    if(zonaDele.has(k(c,r)))cls+=" zona-ini";
    else if(zonaMinha.has(k(c,r)))cls+=" zona-min";
    if(moverS.has(k(c,r)))cls+=" mover";
    const p=[];for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-90);const[x,y]=centro(c,r);
      p.push((x+R*Math.cos(a)).toFixed(1)+","+(y+R*Math.sin(a)).toFixed(1));}
    const hx=el("polygon",{points:p.join(" "),class:cls,"data-hex":k(c,r)});
    if(moverS.has(k(c,r))) hx.onclick=()=>{ if(mesaTravada())return; vibra(9); moveAte(c,r); };
    gH.appendChild(hx);
  }
  /* OS OBSTÁCULOS — item 5 da direção de arte: o bloqueio é uma coisa daquele
     mundo, não uma pedra genérica. Silhueta simples de propósito: o jogador tem
     de reconhecer "não passo aqui" de relance, e detalhe demais numa casa de 19
     de raio vira sujeira (item 3). Casa sem visão apaga o objeto junto — casa
     que não se vê não entrega o que tem dentro. */
  BLOQUEADO.forEach(K=>{
    const [bc,br]=K.split(",").map(Number);
    const [x,y]=centro(bc,br);
    const tipo=OBSTACULO[K]||"carros";
    const escondido=!enxergaCasa(ladoDaTela(),bc,br);
    const g=el("g",{class:"obst "+tipo+(escondido?" escondido":"")});
    g.appendChild(el("ellipse",{cx:x,cy:y+8,rx:12,ry:3.6,class:"sombra"}));
    if(tipo==="onibus"){
      g.appendChild(el("rect",{x:x-13,y:y-7,width:26,height:13,rx:2.6,class:"corpo"}));
      g.appendChild(el("rect",{x:x-13,y:y-1.6,width:26,height:2.9,class:"faixa"}));
      [-9.6,-4.2,1.2,6.6].forEach(dx=>
        g.appendChild(el("rect",{x:x+dx,y:y-5.4,width:4,height:3.4,class:"vidro"})));
      g.appendChild(el("rect",{x:x+9,y:y+1.4,width:4,height:4.2,class:"ferrugem"}));
    } else if(tipo==="carros"){
      g.appendChild(el("rect",{x:x-12,y:y-0.6,width:23,height:8.4,rx:2.6,class:"corpo"}));
      g.appendChild(el("rect",{x:x-9,y:y-8.4,width:19,height:7.8,rx:2.6,class:"cima"}));
      g.appendChild(el("rect",{x:x-5.4,y:y-7,width:6,height:3.6,class:"vidro"}));
      g.appendChild(el("rect",{x:x+6.4,y:y+4.2,width:4,height:3.4,class:"ferrugem"}));
    } else {
      g.appendChild(el("line",{x1:x-6,y1:y+7,x2:x-5,y2:y-1,class:"perna"}));
      g.appendChild(el("line",{x1:x+6,y1:y+7,x2:x+5,y2:y-1,class:"perna"}));
      g.appendChild(el("rect",{x:x-9,y:y-9,width:18,height:10.4,rx:3,class:"corpo"}));
      g.appendChild(el("rect",{x:x-6.4,y:y-11,width:12.8,height:2.8,rx:1.4,class:"tampa"}));
    }
    gM.appendChild(g);
  });

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
    if(mirando) rc.onclick=()=>{ if(mesaTravada())return; vibra(10); tocaAlvo(...ROTAS[t.rota][t.i]); };
    gM.appendChild(rc);
    if(mirando) alvoDeToque(gM,x,y,()=>{vibra(10);atacaTorre(t);},R_TOQUE_ESTRUTURA);
    if(t.vida>0){
      const v=el("text",{x:x,y:y+2.2,class:"tvida"});v.textContent=t.vida;gM.appendChild(v);
      /* BARRA DE VIDA DA TORRE (v48, §36). Com 12 de vida o número sozinho não
         diz o quanto falta — a barra diz, e é a mesma leitura que o jogador já
         faz na peça de herói. Ela some junto com a torre. */
      const L=13, A=1.8, yb=y+8.4, pc=Math.max(0,t.vida)/VIDA_TORRE;
      gM.appendChild(el("rect",{x:x-L/2,y:yb,width:L,height:A,class:"tbar bg"}));
      if(pc>0) gM.appendChild(el("rect",{x:x-L/2,y:yb,width:L*pc,height:A,
        class:"tbar t"+t.t}));
    }

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
    if(mirando){ g.onclick=()=>{ if(mesaTravada())return; vibra(10); tocaAlvo(...POCO); }; alvoDeToque(g,x,y); }
    gM.appendChild(g);
  })();
  [0,1].forEach(t=>{
    const[x,y]=centro(...BASE[t][0]);
    const mirando=alvoNexus===t;
    if(mirando) gM.appendChild(el("circle",{cx:x,cy:y,r:14,class:"mira-torre"}));
    const nx=el("circle",{cx:x,cy:y,r:10.5,class:"nexus t"+t+(mirando?" alvo":"")});
    if(mirando) nx.onclick=()=>{ if(mesaTravada())return; vibra(12); tocaAlvo(...BASE[t][0]); };
    gM.appendChild(nx);
    if(mirando) alvoDeToque(gM,x,y,()=>{ if(mesaTravada())return; vibra(12); tocaAlvo(...BASE[t][0]); },R_TOQUE_ESTRUTURA);
    const v=el("text",{x:x,y:y+2.4,class:"tvida"});v.textContent=Math.max(0,J.nexus[t]);gM.appendChild(v);
  });
  /* ---------- O PLACAR DE PRESENÇA DA ROTA (v47) ----------
     A regra nova — empate segura a torre — só vira jogada se o jogador conseguir
     CONTAR. Até aqui a presença era invisível: existia no motor, decidia quem
     empurrava quem, e não aparecia em lugar nenhum da tela. Defender era adivinhar.

     Mostra a contagem VIVA (onde os heróis estão agora), e não a congelada da
     rodada passada, porque é sobre a viva que o jogador ainda pode agir — é ela
     que vai virar a congelada quando o turno dele acabar.

     E OBEDECE À NÉVOA: só entram os inimigos que este lado ENXERGA. Mostrar a
     contagem real entregaria de graça a posição do Caçador escondido, que é a
     informação que a partida inteira gira em torno de esconder.

     Verde quando dá para segurar (meus ≥ vistos), vermelho quando não dá. */
  const rot=(txt,x,y,nome)=>{
    const c=nome?contaRota(nome):null;
    const rotulo=c?`${txt}  ${c.meus}\u2009·\u2009${c.deles}`:txt;
    const g=el("g",{class:"rotulo"+(c&&c.estado?" "+c.estado:"")}),w=rotulo.length*5.4+13;
    g.appendChild(el("rect",{x:x-w/2,y:y-6.5,width:w,height:13,rx:2}));
    const t=el("text",{x:x,y:y+2.2});t.textContent=rotulo;g.appendChild(t);gM.appendChild(g);};
  rot("TOPO",centro(...L_TOPO[6])[0],11,"topo");
  rot("BAIXO",centro(...L_BOT[2])[0],275,"baixo");
  rot("MEIO",...centro(3,2),"meio");

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
    /* A FILEIRA DE ÍCONES (§17 a §20). Fica ACIMA do retrato, do lado oposto à
       barra de vida e à etiqueta grande, que já ocupam o rodapé da peça. Teto de
       três: o §20 foi explícito em não querer uma fileira enorme cobrindo o
       tabuleiro, e quem quiser ver todas toca a peça e abre a ficha.
       O `+N` no fim é o que avisa que existe mais — sem ele, o jogador acharia
       que três é tudo. */
    const ind=condsDaPeca(h);
    if(ind.length){
      const mostra=ind.slice(0,ICONES_NA_PECA), sobra=ind.length-mostra.length;
      const gi=el("g",{class:"cond-ico"});
      const largura=mostra.length*7.6+(sobra?5.4:0);
      let cx=x-largura/2+3.8;
      mostra.forEach(c=>{
        const t=el("text",{x:cx,y:y-11.2,class:"ci"+(c.mal?" mal":" bom")});
        t.textContent=c.ico; gi.appendChild(t);
        if(c.un==="stack"&&c.q>1){
          const q=el("text",{x:cx+3.1,y:y-8.6,class:"ciq"}); q.textContent=c.q; gi.appendChild(q);
        }
        cx+=7.6;
      });
      if(sobra){ const m=el("text",{x:cx,y:y-11.2,class:"ci mais"});
        m.textContent="+"+sobra; gi.appendChild(m); }
      g.appendChild(gi);
    }
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
        <div><div class="k">Alcance</div><div class="v">${(()=>{
          const l=h.habs.filter(hb=>hb.alvo!=="eu").map(hb=>alcDeHab(h,hb));
          if(!l.length) return alcTotal(h);
          const lo=Math.min(...l), hi=Math.max(...l);
          return lo===hi?lo:`${lo}–${hi}`;})()}</div></div>
        <div><div class="k">Mov. máx.</div><div class="v">${movMaxDe(h)}</div></div>
      </div>
      ${CATALOGO[h.id].ideia?`<div class="ideia">${CATALOGO[h.id].ideia}</div>`:""}
      <div class="lista">
        ${CATALOGO[h.id].pas?`<div class="hb2 pas">
          <div><span class="n">✦ ${CATALOGO[h.id].pas.n}</span>
               <span class="d">${CATALOGO[h.id].pas.d}</span></div>
          <span class="f">passiva</span></div>`:""}
        ${h.habs.map(hb=>`<div class="hb2">${svgIco(iconeDe(hb))}
          <div><span class="n">${hb.n}</span><span class="d">${descreve(h,hb)}</span></div>
          <span class="f">dado ${textoFaixa(hb,h)}</span></div>`).join("")}
      </div>
      ${(()=>{const l=condsDaPeca(h);return l.length?`<div class="cond-lista">
        <div class="ct">Condições</div>${l.map(x=>
        `<div class="cl${x.mal?" mal":""}"><b>${x.ico} ${x.n}${qtdCond(x)}</b> ${x.d||""}</div>`)
        .join("")}</div>`:"";})()}
      ${h.itens.length?`<div class="itens-g">${h.itens.map(i=>
        `<figure><img src="${RETRATO_ITEM(i)}" alt=""><figcaption>${ITEM[i].n}</figcaption></figure>`).join("")}</div>`:""}
      <div class="rodape">${ehAgil(h)?"ágil · 1ª casa grátis · ":""}${CATALOGO[h.id].patamar?"escala por ouro · ":""}ouro ${h.ouro}</div>
    </div>`);
}

/* ══════════════════ FICHAS / LOJA / LOG ══════════════════ */
function fichaHTML(h,meu){
  const pc=Math.max(0,h.vida)/h.vidaMax*100, esc=Math.min(100-pc,h.esc/h.vidaMax*100);
  const P=POS[CATALOGO[h.id].pos];
  /* CONDIÇÕES na ficha (§22). Sai da MESMA lista que alimenta a peça, então a
     ficha não pode discordar do tabuleiro — era o requisito explícito: "isso
     deve refletir exatamente o estado real do personagem".
     Cada linha é clicável e abre a regra da condição: no celular não existe
     hover, e uma condição que o jogador não sabe ler é ruído. */
  const cond=condsDaPeca(h).map(x=>
    `<span class="selo-est cnd${x.mal?" mal":""}" data-cond="${x.n}">${x.ico} ${x.n}`
    +`${qtdCond(x)}</span>`).join("");
  const selos=[
    h.morto?`<span class="selo-est mal">volta em ${h.morto}</span>`:"",
    h.intoc?'<span class="selo-est">intocável</span>':"",
    escondido(h)?'<span class="selo-est">escondido</span>':"",
    reveladoPorAtaque(h)&&!h.morto?'<span class="selo-est mal">revelado</span>':"",
    cond,
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
      ${selos?`<div class="itens cnds">${selos}</div>`:""}
    </div></div>`;
}
/* A REGRA DA CONDIÇÃO, em uma frase, onde o dedo alcança. O texto vem do
   registro em data/catalogo.js — nunca escrito à mão aqui, senão o jogo e o guia
   passariam a explicar a mesma condição de dois jeitos diferentes. */
function explicaCond(nome){
  const achado=Object.values(CONDS).find(d=>d.n===nome)
           ||Object.values(RECURSOS).find(d=>d.n===nome);
  const extra={Preso:"Não anda nesta rodada. Continua agindo e continua sendo alvo.",
               Escudo:"Absorve dano antes da vida. Vale até o começo do seu próximo turno.",
               Carregado:"O próximo golpe dele leva o bônus e depois zera.",
               "Sem cura":"Não pode ser curado enquanto durar."}[nome];
  const d=achado?achado.d:extra;
  if(!d)return;
  const ico=achado?achado.ico:"";
  toast(`${ico} ${nome.toUpperCase()} — ${d}`,"");
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
  /* TOOLTIP DE TOQUE (§21). Registrado antes do `data-sel` e com `stopPropagation`
     porque o selo mora DENTRO da ficha clicável: sem isso, tocar no ícone
     selecionava o herói em vez de explicar a condição. */
  G("shCorpo").querySelectorAll("[data-cond]").forEach(e=>e.onclick=ev=>{
    ev.stopPropagation(); explicaCond(e.dataset.cond);
  });
  G("shCorpo").querySelectorAll("[data-sel]").forEach(e=>e.onclick=()=>{
    const[t,id]=e.dataset.sel.split("-");
    const h=J.times[+t].herois.find(x=>x.id===id);
    if(+t===J.vez&&!h.morto){ limpaModo(); selHeroi=h; fechaSheet(); pinta(); }
    else abreCarta(h);
  });
  const bp=G("btPrioReal"); if(bp) bp.onclick=()=>{ if(mesaTravada())return; usaPrioridade(); fechaSheet(); };
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

/* ═══════════ VENDER ITEM (v46) ═══════════
   Pedido: *"opção de vender item da mochila, porém mais barato do que a compra"*.

   A perda existe para que vender NÃO seja jogada neutra. Sem ela, os três slots
   deixariam de ser escolha: dava para comprar o item errado, trocar de graça na
   rodada seguinte e nunca pagar por ter errado. Com 60% de volta, trocar de build
   custa 40% do que você já investiu — caro o bastante para pensar, barato o
   bastante para não travar o jogador num item morto a partida inteira.

   Por que 60% e não metade: metade (50%) fazia um item de 5 devolver 2, e 2 não
   compra nada nesta loja — o botão existiria e não serviria para nada. Com 60%
   o item de 5 devolve 3, que já é meio Reforço ou uma Sentinela.

   A JANELA É A MESMA DA COMPRA: na própria base ou morto. Vender no meio da rota
   seria transformar a mochila em recurso líquido — e o preço de voltar à base é
   justamente o que dá peso à loja neste jogo.

   O `vida` do item precisa ser DESFEITO à mão: `vidaMax` foi somado na compra, e
   um item de vida vendido sem devolver o bônus daria vida permanente de graça. A
   vida atual é aparada junto, senão o herói ficaria acima do próprio teto. */
const VENDE_FRACAO=0.6;
const precoVenda=id=>Math.max(1,Math.floor((ITEM[id]?ITEM[id].o:0)*VENDE_FRACAO));

function vendeItem(h,id,t){
  if(!h||!ITEM[id])return false;
  if(!(h.morto||naBase(h)))return false;          // mesma janela da compra
  const i=h.itens.indexOf(id);
  if(i<0)return false;
  const it=ITEM[id], volta=precoVenda(id);
  h.itens.splice(i,1);
  h.ouro+=volta;
  if(it.ef.vida){ h.vidaMax-=it.ef.vida; h.vida=Math.min(h.vida,h.vidaMax); if(h.vida<1&&!h.morto)h.vida=1; }
  reg(t?"c":"a",`${h.n} vende ${it.n} (+${volta} de ouro, pagou ${it.o})`);
  toast(`vendido: ${it.n} · +${volta} ◈`,"");
  return true;
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
  /* MOCHILA — o que ele já tem, e por quanto sai. Só aparece com item dentro:
     uma seção vazia na loja é ruído em tela de celular. */
  const mochila = !quem.itens.length ? "" :
    `<div class="secao-loja">Mochila · ${quem.itens.length}/${capacidade(quem)}</div>
     <div class="prat">${quem.itens.map(id=>{const it=ITEM[id];
       return `<button class="itC vender" data-v="${id}">
         <img src="${RETRATO_ITEM(id)}" alt=""><span class="iN">${it.n}</span>
         <span class="iD">${it.d}</span>
         <span class="iO">vender por ${precoVenda(id)} ◈ <small>(custou ${it.o})</small></span>
       </button>`;}).join("")}</div>`;

  /* a prateleira de gasto tardio só existe se houver regra aprovada para ela */
  const gastos=gastosDisponiveis(quem);
  const prat2 = !gastos.length ? "" :
    `<div class="secao-loja">Gastar ouro</div><div class="prat">${gastos.map(g=>{
      const preco=precoGasto(g,quem), pode=quem.ouro>=preco;
      const jaFez = g.id==="reforco"&&quem.reforcos ? ` · ${quem.reforcos}º` : "";
      return `<button class="itC${pode?"":" off"}" data-g="${g.id}" ${pode?"":"disabled"}>
        <span class="iN">${g.n}${jaFez}</span><span class="iD">${g.d}</span>
        <span class="iO">${preco} ◈</span></button>`;}).join("")}</div>`;

  abreSheet("Loja",`<div class="abas">${abas}</div><div class="prat">${cards}</div>${mochila}${prat2}`);
  /* `[data-v]` antes de `[data-i]` pelo mesmo motivo que os botões de gasto usam
     dado próprio: as três prateleiras compartilham a classe `.itC`, que é de
     APARÊNCIA. Quem manda no clique é o atributo. */
  G("shCorpo").querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{
    if(vendeItem(quem,b.dataset.v,t)){ vibra(10); abreLoja(); pinta(); } });
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
      <p>Cada dado alocado num herói vira a <b>Força</b> da habilidade — e o <b>valor</b> do dado escolhe <b>qual</b> das três habilidades sai. A faixa é <b>exata</b>: não existe “ou mais”.</p>
      <table><tr><td>dado <b>1</b> ou <b>2</b></td><td>a habilidade básica</td></tr>
      <tr><td>dado <b>3</b>, <b>4</b> ou <b>5</b></td><td>a habilidade do meio</td></tr>
      <tr><td>dado <b>6</b></td><td>a Ultimate</td></tr></table>
      <p style="margin-top:7px">Um 6 é Ultimate — de qualquer um dos cinco. Ele <b>não desce</b> para pagar uma básica. Por isso a pergunta do turno não é <i>que habilidade este dado destrava?</i>, é <b>quem recebe este dado?</b>.</p>
      <p style="margin-top:7px">Alguns heróis fogem do padrão, e é o que os separa: a do meio de quem vive de utilidade sai já no <b>2</b>, a que silencia só sai no <b>4–5</b>, e a Ultimate dos dois suportes de cura sai no <b>5</b> também — ela precisa chegar a tempo. A faixa de cada uma está escrita na própria habilidade.</p>
      <p style="margin-top:7px">Precisa de mais movimento? <b>Vire um dado de ação em movimento</b> pelo botão <b>→ mover</b>.</p></section>
    <section class="destaque"><h4>Feitiços de invocador</h4>
      <p>O time tem <b>uma carga</b>, não um feitiço por herói. Ela não gasta dado nem movimento, serve a <b>qualquer</b> um dos cinco, e volta <b>3 rodadas</b> depois de usada.</p>
      <table><tr><td><b>Lampejo</b></td><td>salta até 2 casas e escapa de <i>preso</i></td></tr>
      <tr><td><b>Retorno</b></td><td>volta à base e recupera 5</td></tr></table>
      <p style="margin-top:7px">Como a carga é uma só, a pergunta nunca é <i>posso?</i> — é <b>quem merece</b>. E vale contar a do adversário: feitiço gasto é informação.</p>
      <p>O Retorno é <b>interrompido por inimigo colado</b>. Quem foi pego não escapa de graça.</p></section>
    <section class="destaque"><h4>3 · Quem não age, enriquece</h4>
      <p>Herói que recebe dado ganha <b>1 de ouro</b>. Quem fica de fora <b>farma 3</b>. Como só três dos cinco recebem ação, dois sempre estão enriquecendo. <b>Agir custa dinheiro.</b></p>
      <p>Mas a gota por rodada não é o que compra item: quem <b>abate</b> leva <b>8</b>, o <b>acampamento</b> paga <b>6</b> (o neutro do meio paga <b>8</b>, e roubar o do adversário rende <b>+2</b>). Sentar e esperar rende; jogar rende mais.</p></section>
    <section class="destaque"><h4>A loja tem três faixas</h4>
      <p>Item não é troco. São três degraus de investimento, e o preço é a decisão:</p>
      <table><tr><td><b>Simples · 12</b></td><td>um atributo, efeito pequeno</td></tr>
      <tr><td><b>Intermediário · 18</b></td><td>dois atributos, ou um efeito de verdade</td></tr>
      <tr><td><b>Forte · 24</b></td><td>o item que define a sua build</td></tr></table>
      <p style="margin-top:7px">Com a renda de uma partida, o <b>primeiro item</b> chega por volta da <b>rodada 7</b>, o segundo na <b>14</b>, e os três slots só fecham perto da <b>20</b>. A pergunta que a loja faz o tempo todo é a mesma: <b>compro o barato agora ou guardo para o que decide?</b></p>
      <p><b>Vender</b> devolve 60% do preço, na base ou morto. E com os três slots cheios o ouro continua tendo destino: <b>Reforço</b> (+1 de Poder), <b>Requisição</b> (uma carta), <b>Leva de Ferro</b> (a sua onda avança 1) e <b>Sentinela</b> (ward na mochila).</p></section>
    <section class="destaque"><h4>Escudo dura um turno adversário</h4><p>Escudo, buff e <b>intocável</b> valem <b>até o início do seu próximo turno</b> — ou seja, exatamente uma vez de o adversário poder bater neles. Antes o escudo não expirava nunca e empilhava até o herói virar intocável de fato; e "até o fim da rodada" dava menos janela a quem jogava em segundo. Agora os dois lados têm a mesma.</p></section><section><h4>Combate</h4>
      <p>Sem rolagem extra — o dado já foi rolado.</p>
      <table><tr><td>Dano</td><td>Força + Poder − Armadura</td></tr>
      <tr><td>Crítico</td><td>1,5× — e sempre <b>condicional</b>, nunca sorte</td></tr>
      <tr><td>Morte</td><td>volta em 2 rodadas (3 a partir da 8, 4 a partir da 16)</td></tr>
      <tr><td>Quem matou</td><td>+8 de ouro</td></tr></table>
      <p style="margin-top:7px"><b>Crítico não é o 6 natural.</b> Cada herói que crita tem a própria condição, e ela é visível <b>antes</b> do golpe: alvo isolado (Pombo), alvo travado por Preso, Atordoado ou Lento (Cael), 3 Cargas (Parabólica), o quarto tiro (Corvo), das sombras (Rasante Final) ou sempre (Ato Final). Dá para negar todas elas.</p></section>
    <section><h4>As cinco posições</h4>
      <p><b>Topo</b> — sozinho lá em cima. Dominar a rota dá <b>Placas</b>: 1 ajusta um dado em ±1, 2 re-rolam. É a sua única fonte de controle sobre a sorte.</p>
      <p><b>Farm</b> — o Caçador. Ele vive no <b>mato</b>, e é lá que ele desaparece: enquanto o adversário não tiver ninguém (nem ward) dentro do mato, ele não está na tela do outro. Sair do mato para a rota é aparecer.</p>
      <p><b>Meio</b> — a rota mais curta. Dominar dá <b>Prioridade</b>: gaste para rolar <b>um dado de ação a mais</b>, quando quiser.</p>
      <p><b>Atirador</b> — frágil e caro, mas escala: a cada <b>20 de ouro na mão</b> ganha +2 de Poder, até três vezes. Perto do Suporte, ganha escudo e dano.</p>
      <p><b>Suporte</b> — escuda, doa o próprio dado, e planta a <b>Ward</b>: o olho que enxerga um pedaço de mapa onde o time não tem ninguém.</p></section>
    <section class="destaque"><h4>Visão · o mato esconde</h4>
      <p>Você só enxerga o que as <b>suas peças</b> enxergam: heróis, torres vivas, a sua onda, a base e as wards. O resto do tabuleiro fica <b>escuro</b> — e herói que está no escuro <b>não aparece</b>.</p>
      <p>E o <b>mato bloqueia</b>: dentro do mato só se enxerga <b>de dentro do mato</b>. Estar colado nele pela rota não adianta, e ward plantada na rota também não vê lá dentro. Quem quer saber o que tem no mato entra ou <b>planta a ward dentro</b>.</p>
      <p>Duas saídas para quem está no escuro: atacar de lá vale <b>+2 de Força</b> (emboscada) — mas <b>quem ataca fica visível</b> até sair da casa de onde bateu. Bater entrega a posição.</p>
      <p>Ouro sobrando com os três itens comprados? A <b>Sentinela</b>, na loja, é uma ward na mochila: compre na base, plante onde quiser, sem gastar dado.</p></section>
    <section class="destaque"><h4>Condições · sangramento, veneno e zonas</h4>
      <p>São <b>doze</b> no jogo, e todas seguem a mesma máquina: o <b>dano cobra no início do turno de quem carrega</b>, e a <b>duração cai no fim</b>. O prazo é contado em <b>turnos do portador</b>, nunca em rodadas — é o que dá ao primeiro e ao segundo jogador o mesmo número de cobranças. Sangramento e Veneno <b>ignoram armadura e escudo</b>: são a resposta contra tanque com escudo grande.</p>
      <p>Duas unidades diferentes, e a peça mostra qual: <b>acúmulo</b> (escrito ×2 — reaplicar <b>soma</b>, até o teto) é do Sangramento e das marcas; <b>duração</b> (escrita em turnos — reaplicar <b>renova pelo maior</b>) é do resto. Morrer limpa tudo.</p>
      <p><b>Limpar é metade do contrajogo:</b> o Digerir do Grumo tira todas dele mesmo, o Empresta o Fone do Emerson tira uma do aliado, e a Varrida do Gari tira uma de cada aliado colado. E a <b>Tenacidade</b> anula a próxima Lentidão, Atordoamento, Silêncio ou Prisão que chegar.</p>
      <p>A <b>zona</b> é o mesmo efeito posto no <b>chão</b>: quem <b>começa o turno dentro</b> dela fica envenenado. Ela dura os <b>2 próximos turnos do adversário</b> — contado em turnos, e não em rodadas, para a zona de quem joga primeiro não vigiar mais tempo que a de quem joga em segundo. No mapa, a sua aparece em <b>verde tracejado</b> e a do adversário em <b>vermelho pulsante</b>.</p></section>
    <section class="destaque"><h4>A base trata — mas não com o inimigo em cima</h4>
      <p>Herói ferido na <b>própria base</b> recupera <b>3 de vida por rodada</b>. Voltar custa movimento, que é o recurso mais disputado da mesa — é esse o preço.</p>
      <p><b>Com inimigo a 2 casas ou menos, ele se trata UMA vez e para.</b> A cura só volta quando o cerco sair de perto. Mergulhar na base do adversário continua sendo decisão, e não suicídio garantido.</p></section>
    <section><h4>Defender junto da torre</h4>
      <p>Herói colado numa torre <b>viva do próprio time</b> ganha <b>+1 de Armadura</b>. Lutar em casa é diferente de lutar no vão da rota — e o bônus cai junto com a torre.</p></section>
    <section class="destaque"><h4>Presença · como se defende uma rota</h4>
      <p>No fim da rodada, cada rota compara <b>quantos heróis</b> cada time tem nela. Mais que o rival: a onda anda 1 casa para o lado dele. Empate: ela não anda — <b>mas continua batendo na torre que estiver embaixo</b>.</p>
      <p><b>Você conta na rota se:</b> passou da <b>sua Torre Exterior</b> (empurrar) <b>ou</b> está <b>encostado na Frente de Onda</b> (defender). Herói parado na própria base não conta — isso é acampar, não defender.</p>
      <p><b>Para SALVAR a torre não basta empatar: é preciso ter mais gente que o atacante</b>, porque só assim a onda recua e sai de cima dela. Um corpo a mais já vira a conta — e ir com o time todo é como se perde o resto do mapa.</p>
      <p>O <b>rótulo de cada rota</b>, no tabuleiro, mostra a contagem em <b>três cores</b>: <b>verde</b> = tenho mais (a onda recua e a torre para de apanhar) · <b>âmbar</b> = empate (a onda não anda, <b>mas a torre continua caindo</b>) · <b>carmim</b> = eles têm mais. Ele só conta o inimigo que <b>você enxerga</b> — o que está escondido no mato não aparece.</p></section>
    <section><h4>Torres, ondas e Nexus</h4>
      <p>Cada rota tem uma <b>Frente de Onda</b> (o círculo tracejado). Ela desliza para o lado de quem tem mais heróis vivos naquela rota, e bate na torre onde encosta.</p>
      <p><b>Torre tem 20 de vida e 5 de Armadura</b>, e a barra dela fica embaixo da peça. A onda tira <b>7</b> por rodada — um terço de torre.</p>
      <p><b>O seu golpe na torre é calculado</b>, e não mais um ponto fixo: <b>dado × escala da habilidade + Poder, menos a Armadura da estrutura</b>. Ou seja: dado bom e item de Poder <b>derrubam torre mais rápido</b>, e cutucada com dado 1 arranha. As <b>Ultimates perfurantes</b> (Julgamento, Ato Final, Sentença) <b>ignoram a Armadura da torre</b>, como ignoram a de qualquer tanque — são as melhores do jogo contra estrutura.</p>
      <p><b>O que não funciona contra concreto:</b> Sangramento, Veneno, Atordoamento, Silêncio, Marca, execução, drenar e Crítico. Torre não sangra e não se assusta.</p>
      <p><b>As ondas engrossam.</b> A cada <b>16 rodadas</b> elas passam a tirar <b>um degrau a mais</b>, até 3. Da rodada 33 em diante, uma rodada de cerco derruba uma torre cheia. É o relógio da partida: numa disputa em que os dois defendem bem, é ele que garante que alguém fecha.</p>
      <p>A torre <b>revida 4</b> a cada golpe que leva. É esse pedágio, e não uma trava de rodada, que decide quantas vezes vale bater.</p>
      <p>Torres caídas abrem a rota. Rota aberta, a onda bate no <b>Nexus</b>. Zerou, acabou.</p></section>
    <section class="destaque"><h4>O creep é quem paga o pedágio</h4>
      <p>Regra nova, e ela é curta:</p>
      <table><tr><td><b>Creep na zona</b></td><td>você pressiona a torre à vontade</td></tr>
      <tr><td><b>Sem creep</b></td><td>a torre atira em você no fim do turno</td></tr></table>
      <p style="margin-top:7px">Se você <b>terminar o turno colado</b> (1 hexágono) numa torre inimiga viva e a <b>sua Frente de Onda não estiver dentro da mesma zona</b>, a torre dispara: <b>5 de dano</b>. Ela escolhe <b>um alvo só</b> — quem bateu nela neste turno, e depois o mais ferido.</p>
      <p>O disparo <b>não gasta dado, ação nem carta de ninguém</b>: é reação da estrutura. E ele <b>não mata</b> — deixa você em 1 de vida, à mão de qualquer inimigo. A torre não rouba o abate, ela <b>arma</b> o abate.</p>
      <p>É o que transforma empurrar torre em decisão: <b>dá para bater agora, ou os meus creeps não chegam a tempo?</b></p></section>
    <section class="destaque"><h4>Movimento máximo · cada herói tem o seu</h4>
      <p>O Dado Mestre continua sendo o bolso do time — mas <b>nenhum herói atravessa mais que o próprio teto de casas por turno</b>, por mais movimento que sobre.</p>
      <table><tr><td><b>3 casas</b></td><td>Taxista, Grumo, Caramêlo, Torvald</td></tr>
      <tr><td><b>4 casas</b></td><td>os onze do meio</td></tr>
      <tr><td><b>5 casas</b></td><td>Pombo, Valti, Pyk, Zhet, Catarino</td></tr></table>
      <p style="margin-top:7px">O número aparece na <b>carta do herói</b> (Mov. máx.) e no botão <b>Mover</b>. Antes, um herói com o bolso cheio atravessava metade do mapa numa jogada só — e posicionamento, rota e emboscada deixavam de importar.</p>
      <p><b>Não contam para o teto:</b> Lampejo, Retorno, Puff de Emergência, o recuo do Passo de Sombra, a carta Recuo e qualquer puxão, empurrão ou troca de lugar. Cada um já tem limite e preço próprios — quem é móvel continua sendo móvel.</p>
      <p><b>Item de movimento sobe o teto</b>, e não devolve movimento: Passos do Vento, Botas Rúnicas e as duas Ampulhetas dão <b>+1 casa</b> cada, até o limite de 6.</p></section>
    <section><h4>O Poço — Dragão e Barão</h4>
      <p>Há <b>um poço</b> no meio do mapa, em terreno de ninguém, e ele <b>muda de morador</b>. Vazio, mostra a rodada em que o próximo desce — esse é o relógio da partida.</p>
      <p>Na <b>rodada 5</b> desce o <b>Dragão</b>: <b>3 de vida</b>, revida 2. Cai em <b>dois dados</b> — uma Ultimate e uma básica — se dois heróis comprarem a briga no mesmo turno. Levar dá a <b>Herança do Dragão</b>: <b>+1 de Poder em todo o time, para sempre</b>, e <b>acumula</b> a cada Dragão. Ele volta 3 rodadas depois de cair.</p>
      <p>Na <b>rodada 12</b> o <b>Barão</b> toma o poço — <b>mesmo com o Dragão vivo</b>. Ele é diferente do Dragão: tem <b>16 de vida e 3 de Armadura</b> e <b>apanha pela regra dos heróis</b> — <b>Força + Poder − Armadura</b>, com respingo valendo metade. No Barão o <b>dado importa muito</b>: com 3 de Armadura, uma básica de dado 2 tira <b>2</b> e uma Ultimate de dado 6 tira <b>8</b>. É por isso que ele <b>pede um grupo</b> — não por ter barra comprida, mas porque cutucar com dado ruim quase não anda. Conte com <b>4 dos 5 heróis</b> para fechar num turno. E as três Ultimates de <b>dano garantido</b> (Julgamento, Ato Final, Sentença) <b>ignoram a armadura dele</b>, como ignoram a de qualquer tanque. Ele revida 4: encostar custa o dobro. Quem leva <b>escolhe uma de três dádivas</b> por <b>2 rodadas</b>: <b>Ondas de Ferro</b> (as três ondas avançam sozinhas), <b>Égide</b> (4 de escudo no time por turno) ou <b>Aríete</b> (o seu golpe de herói em <b>torre vale o dobro</b>; no Nexus causa 2). Nenhuma dá Poder — o Barão é pressão de mapa, não força bruta. É o botão de ponto-sem-volta.</p>
      <p><b>No Dragão</b> a conta é de <b>golpes</b>, e não de dano: básica ofensiva tira <b>1</b> e Ultimate tira <b>2</b>, com qualquer dado. Ele desce na rodada 5, quando ninguém tem item e a conta de dano ainda é rasa — contar golpes é o que o mantém legível ali. O poço é <b>sem dono</b>: Quem dá o <b>último golpe</b> leva o prêmio inteiro. É por isso que ninguém deixa o poço sozinho.</p></section>
    <section class="destaque"><h4>Rotação do Caçador</h4>
      <p>No <b>início de cada rodada</b> os dois jogadores escolhem, <b>escondido um do outro</b>, para que <b>região</b> o próprio Caçador vai. Ele é reposicionado <b>na hora</b>, e isso <b>não gasta o Dado Mestre</b> nem a ação dele.</p>
      <p><b>Ele reaparece sempre dentro da selva</b> — na parte dela colada à região escolhida —, <b>nunca dentro da rota</b>. Se aquela casa estiver ocupada, ele pousa na casa de selva válida mais próxima.</p>
      <table><tr><td>▲ <b>Topo</b></td><td>a selva colada à rota de cima · +2 de Armadura</td></tr>
      <tr><td>◆ <b>Meio</b></td><td>a selva colada à rota do meio · +2 de Poder</td></tr>
      <tr><td>▼ <b>Baixo</b></td><td>a selva colada à rota de baixo · +6 de ouro</td></tr>
      <tr><td>❦ <b>Selva</b></td><td>o centro da sua selva · cura 4 e +1 no Dado Mestre</td></tr>
      <tr><td>⊙ <b>Continuar onde está</b></td><td>ele <b>não sai do lugar</b> · nenhum bônus</td></tr></table>
      <p style="margin-top:7px"><b>Continuar onde está não é uma região.</b> Não é a Selva, não é voltar para a Selva e não é ir para o centro: é <b>não mexer no Caçador</b>. Serve para quando a casa em que ele parou já vale mais que qualquer reposicionamento — em cima do acampamento, colado no poço, ou de tocaia esperando alguém passar. O preço é abrir mão do bônus da região.</p>
      <p>Você tem <b>10 segundos</b> para decidir. Sem escolha, ele vai sozinho para a <b>Selva</b> — a partida nunca fica parada esperando.</p>
      <p>O adversário <b>não recebe aviso nenhum</b> de qual botão você apertou. Para saber onde o seu Caçador caiu, ele precisa ter <b>visão daquele mato</b> — de olho ou de <b>ward</b>. A informação está presa à <b>posição</b>, não à escolha.</p></section>
    <section><h4>O Caçador e o mato</h4>
<p><b>Rota, rio e base todo mundo vê.</b> O <b>mato</b> é diferente: você só enxerga o mato onde tiver <b>alguém seu dentro</b>. O mapa tem dois — o <b>mato de cima</b> e o <b>mato de baixo</b> — e eles se enxergam separadamente. As casas escuras no tabuleiro são o mato onde você está cego.</p>
      <p>Ou seja: o Caçador inimigo entrou no mato e <b>sumiu da sua tela</b>. Ele continua lá, andando, farmando e empurrando rota — você é que parou de ver. Quando ele pisa numa rota, aparece de novo.</p>
      <p>Quem ataca <b>saindo do mato sem ter sido visto</b> ganha <b>+2 de Força</b> no golpe. É a <b>Emboscada</b>, e é o motivo de valer a pena a espera.</p>
      <p>A resposta é <b>presença</b>: mande alguém para o mato e ele acende. Uma <b>Ward</b> acende o mato <b>onde ela está plantada</b> — ward na rota não enxerga mato nenhum. A pergunta que o jogo faz o tempo todo é essa — vale uma peça vigiando o mato, ou ela faz mais pressionando a rota?</p></section>
    <section class="destaque"><h4>As casas bloqueadas</h4>
      <p>Algumas casas da selva têm <b>um ônibus abandonado, carros empilhados ou uma caixa-d'água</b> em cima. Elas são <b>mais escuras</b> e têm o objeto desenhado: <b>ninguém entra e ninguém atravessa</b>.</p>
      <p>Elas não são enfeite — são o que transforma a selva de campo aberto em <b>corredor</b>. A casa do outro lado do ônibus pode estar a <b>2 de distância e a 4 de caminhada</b>, e é a caminhada que você paga. Dá para emboscar quem vem pelo corredor, e dá para perder o gank por ter escolhido o lado errado do obstáculo.</p>
      <p>Elas também <b>bloqueiam visão</b>, como todo mato. E <b>nenhuma rota é bloqueada</b>: as três continuam abertas de ponta a ponta.</p></section>
    <section><h4>No aparelho</h4>
      <p><b>Arraste o herói para andar.</b> Encoste nele e puxe: as casas ao alcance acendem e a casa sob o dedo fica marcada. Soltou, andou. É o caminho mais rápido.</p>
      <p>Prefere tocar? Toque num herói seu → abre o <b>comando</b> dele, e de lá você escolhe <b>mover</b> ou uma <b>habilidade</b>. Os dois caminhos valem.</p>
      <p><b>Segure uma habilidade por meio segundo</b> e ela se explica: faixa de dado, alvo, alcance, a regra por extenso e <b>o que sai com cada um dos dados que estão na mesa agora</b>. Funciona até nas habilidades apagadas — é quando mais se quer saber.</p>
      <p>O dado é escolhido sozinho: o menor que dá conta — <b>com uma exceção</b>. Se o Suporte tiver <b>doado um dado</b> para este herói, é o doado que sai primeiro: ele só serve a essa peça e morre no fim do turno, então guardá-lo é jogá-lo fora. Quer gastar um específico? Toque nele antes.</p>
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
  {t:"Por último: o <b>Caçador</b> da selva. No começo de cada rodada vocês dois escolhem em segredo a <b>região</b> dele — <b>Topo, Meio, Baixo, Selva</b> ou <b>Continuar onde está</b> — e ele reaparece na hora, sempre <b>dentro do mato</b> daquela região. A quinta opção não reposiciona: ele fica exatamente onde parou.<br><br>O outro não vê a sua escolha: só descobre onde ele está se tiver <b>visão daquele mato</b>. É o blefe do gank. Use.",
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
  /* O dado EMPRESTADO ganha dono no rótulo. Ele não é como os outros: só uma
     peça pode gastá-lo e ele morre no fim do turno. Sem dizer de quem é, o
     jogador vê quatro dados iguais e não entende por que um deles não serve
     para o herói que ele selecionou. */
  const donoDoDado=d=>{
    if(!d.dono)return "";
    const o=todos().find(x=>x.id===d.dono);
    return o?` — emprestado para ${o.n}`:" — emprestado";
  };
  cx.innerHTML=J.dados.map((d,i)=>
    `<div class="dado${d.usado?" usado":""}${dadoSel===i?" sel":""}${d.v===6?" seis":""}${d.extra?" extra":""}${d.doado?" doado":""}"
      data-i="${i}" title="dado ${d.v}${donoDoDado(d)}">${d.v}</div>`).join("");
  if(assina!==assinaturaDados){
    cx.querySelectorAll(".dado").forEach((e,i)=>{
      e.classList.add("rola"); setTimeout(()=>e.classList.remove("rola"),320+i*40); });
    assinaturaDados=assina;
  }
  cx.querySelectorAll(".dado").forEach(e=>e.onclick=()=>{
    const i=+e.dataset.i;
    if(mesaTravada()||J.dados[i].usado)return;
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
  return `<button class="fei${modo==="lampejo"&&lampejo?" on":""}${pode?" pode":" naoPode"}"
      id="cmd${lampejo?"Lampejo":"Retorno"}" ${pode?"":"disabled"} title="${linha}">
    <span class="ico">${svgIco(lampejo?ICO.raio:ICO.casa)}</span>
    <span class="n">${lampejo?"Lampejo":"Retorno"}</span>
  </button>`;
}
/* ---------- O FEITIÇO SAI DA LISTA DE AÇÕES (v49) ----------
   Relato: *"acho que poderia mudar o flash e o retorno de lugar, não ficar ali
   no menu de mover/atacar; tentar deixar em algum cantinho separado"*.

   Ele estava certo, e o motivo é de leitura: aquela lista responde à pergunta
   *"o que este herói faz com o dado?"* — mover e as três habilidades. O feitiço
   não é do herói e não gasta dado: é **uma carga do TIME**, que serve a qualquer
   um dos cinco. Misturar os dois fazia o jogador procurar Lampejo entre as
   habilidades, e contar o feitiço como se fosse uma quarta ação da peça.

   Agora ele mora numa faixa própria embaixo, com a carga escrita uma vez só —
   porque a carga é uma só. */
function feiticosBloco(h){
  const tm=J.times[h.t], cd=tm.feitico?0:tm.feiticoCd;
  const estado = cd ? `gasto · volta em ${cd} ${cd>1?"rodadas":"rodada"}` : "1 carga pronta";
  return `<div class="feiticos${cd?" vazio":""}">
    <div class="fei-cab"><span>Feitiço do time</span><b>${cd?"◌":"◇"} ${estado}</b></div>
    <div class="fei-par">${feiticoBt(h,"lampejo")}${feiticoBt(h,"retorno")}</div>
  </div>`;
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
    const podeMover=J.mov.rest>0&&!h.preso&&casasRestantes(h)>0;
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
            podeMover?`até <b>${tetoAndar(h)}</b> casas · sai do bolso do time`
                     +` · máx. ${movMaxDe(h)} por turno`:"sem movimento restante"}</span></span>
        <span class="mark">${J.mov.rest}</span>
      </button>
      ${h.habs.map((hb,i)=>{
        const di=dadoPara(hb,h), pode=di!==null&&!h.agiu;
        const emMira=modo==="mirar"&&habAtual===i;
        return `<button class="opc${emMira?" on":""}${pode?" pode":" naoPode"}" id="hab${i}">
          <span class="ico">${svgIco(iconeDe(hb))}</span>
          <span class="txt"><span class="t1">${hb.n}${confirmar===i?" — confirmar":""}</span>
            <span class="t2">${h.agiu?"já agiu nesta rodada":descreve(h,hb,di!==null?J.dados[di].v:null)}</span></span>
          <span class="mark${pode?"":" trava"}">${di!==null?J.dados[di].v:textoFaixa(hb,h)}</span>
        </button>`;
      }).join("")}
      ${feiticosBloco(h)}`;
    G("cmdX").onclick=cancela;
    G("cmdCarta").onclick=()=>abreCarta(h);
    G("cmdMover").onclick=()=>{ if(!mesaTravada()) iniciaMover(); };
    G("cmdLampejo").onclick=()=>{ if(!mesaTravada()) iniciaLampejo(); };
    G("cmdRetorno").onclick=()=>{ if(!mesaTravada()) usaRetorno(); };
    h.habs.forEach((_,i)=>{
      const b=G("hab"+i); if(!b)return;
      b.onclick=()=>{ if(mesaTravada())return; iniciaHab(i); };
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
  const poder=poderTotal(h)+(h.recarga||0)+dupla(h)+danoPassivo(h);
  let bruto = ef.danoFixo ? ef.danoFixo : Math.round(F*ef.dano*escalaDe(slot))+poder;
  if(ef.extra)bruto+=ef.extra;
  if(ef.bonusFerido&&alvo&&alvo.vida<=alvo.vidaMax/2)bruto+=ef.bonusFerido;
  /* v45 — a IA precisa contar o que o kit dela promete, senão ela nunca vê a
     própria sinergia: bater no alvo que JÁ está envenenado, gastar a pilha de
     sangramento que ela mesma plantou, queimar a Sucata. Sem isto ela usava a
     Ceifa da Ilva em quem não estava envenenado e a Ultimate da Dona Chinela
     antes de ter empilhado nada — dano igual na conta dela, muito menor na mesa. */
  if(alvo&&!ehEpico(alvo)){
    if(ef.bonusCond&&temCond(alvo,ef.bonusCond.t)) bruto+=ef.bonusCond.dano;
    if(ef.consome&&temCond(alvo,ef.consome.t))
      bruto+=stacksDe(alvo,ef.consome.t)*ef.consome.danoPorStack;
  }
  if(ef.bonusPorRecurso) bruto+=recursoDe(h,ef.bonusPorRecurso.t)*ef.bonusPorRecurso.dano;
  /* CRÍTICO entra na conta, e é o que faz o Cael preferir bater em quem ele
     travou e o Corvo guardar o quarto tiro para um alvo que vale. */
  if(ehCritico(h,hb,alvo)) bruto=Math.round(bruto*COND_NUM.critico);
  if(!alvo)return bruto;
  if(ehEpico(alvo)) return Math.max(1,bruto);
  const d=Math.max(1,bruto+stacksDe(alvo,"marcado")-(ef.danoFixo?0:armTotal(alvo))
                   -reducaoDeAliados(alvo));
  return Math.max(0,d-(alvo.esc||0));
}
/* O LIMIAR DE EXECUÇÃO que este golpe teria contra este alvo. A IA precisa dele
   separado do dano porque execução não é dano: ela mata por baixo do limiar
   independentemente de armadura, escudo ou vida restante. Sem isto a Dona Chinela
   nunca via que 3 acúmulos de sangramento tinham transformado o Chinelo Voador
   num golpe que executa com 14 de vida. */
function iaLimiarExec(hb,alvo){
  const ef=hb.ef;
  if(!ef.executa||!alvo||ehEpico(alvo))return 0;
  let l=ef.executa;
  if(ef.execPorStack) l+=stacksDe(alvo,ef.execPorStack.t)*ef.execPorStack.v;
  if(ef.execSeCond&&temCond(alvo,ef.execSeCond.t)) l+=ef.execSeCond.v;
  return l;
}
/* O VALOR TÁTICO de uma habilidade que não é dano — ou de um dano cujo verdadeiro
   prêmio é a condição que ele deixa. É aqui que a IA entende o novo vocabulário,
   e a escala é a mesma da nota de dano (§ do bloco de IA): dezenas para jogada
   comum, centenas para jogada que decide.

   Tudo é medido em CONSEQUÊNCIA, nunca em "a condição é legal": atordoar um
   inimigo cheio de vida no meio do nada vale pouco; atordoar o que está pronto
   para matar alguém vale muito. */
function iaValorCondicoes(h,hb,alvo){
  const ef=hb.ef; let n=0;
  const conds=[...(ef.cond||[]),...(ef.condVizinhos||[]),...(ef.condRaio||[])];
  const jaTem=t=>alvo&&!ehEpico(alvo)&&temCond(alvo,t);
  for(const c of conds){
    if(jaTem(c.t)&&!CONDS[c.t].pilha) continue;    // renovar o que já está lá vale pouco
    switch(c.t){
      case "atordoado":  n+=42; break;             // tirar um turno é quase um golpe
      case "silenciado": n+=26; break;
      case "lentidao":   n+=14; break;
      case "vulneravel": n+=12; break;
      case "veneno":     n+=10*(c.tu||1); break;
      case "sangramento":n+=8*(c.st||1); break;
      case "marcado":    n+=6; break;
      case "catarino":   n+=6; break;
      default:           n+=4;
    }
  }
  /* condição com endereço: o Coco só atordoa quem pisou nas cascas. Se o alvo não
     está numa zona dela, a IA não deve pagar a Ultimate pelo atordoamento. */
  if(ef.condSeNaZona&&alvo&&alvo.pos){
    const dentro=(J.zonas||[]).some(z=>z.t===h.t&&dist(...alvo.pos,...z.pos)<=z.raio);
    if(dentro) n+=40;
  }
  if(ef.zona)        n+=16;
  if(ef.espalha&&jaTem(ef.espalha.t)) n+=18;
  if(ef.troca)       n+=10;
  if(ef.revelaRaio)  n+=6*J.times[1-h.t].herois.filter(o=>!o.morto&&!visivelPara(o,h.t)).length;
  if(ef.puxar)       n+=8;
  if(ef.prende)      n+=18;
  return n;
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
        const hb=h.habs[i], di=dadoPara(hb,h);
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

        /* TORRE — objetivo de verdade, e agora com duas contas reais: quanto
           este golpe TIRA (deixou de ser 1 fixo) e quanto custa estar ali.

           §50 e §51 do pedido: antes de avançar para a torre ela pesa a vida da
           torre, a própria vida, o creep, e o disparo que leva no fim do turno
           se ficar sem creep. O `55` continua calibrado em "um terço de torre
           por golpe", que era o valor da v47 — a proporção é que virou conta. */
        alvosTorre.forEach(tr=>{
          const golpe=golpeEmEstrutura(h,hb,i,F);
          const cai=tr.vida<=golpe;
          const semCreep=!creepApoia(tr);
          const risco=REVIDE_TORRE+(semCreep?TIRO_TORRE:0);
          let nota = cai?150:Math.round(55*golpe*3/VIDA_TORRE);
          if(!cai&&semCreep) nota=Math.round(nota*0.55);   /* mergulhar sozinho é caro */
          if(!cai&&risco>=h.vida) nota=4;                  /* não se mata por um arranhão */
          saida.push({h,i,tipo:"torre",v:tr,nota});
        });

        /* HERÓI — matar vale muito mais que machucar. O Mestre ainda soma foco:
           entre dois alvos igualmente atingíveis, ele bate em quem já está
           ferido, que é o que transforma dano espalhado em abate. */
        alvos.filter(o=>o.t!==h.t&&!o.morto).forEach(o=>{
          const d=iaDanoReal(h,hb,i,F,o);
          const mata=d>=o.vida||o.vida<=iaLimiarExec(hb,o);
          let nota = mata ? 300*iaValorHeroi(o)
                          : 10*Math.min(d,o.vida)*iaValorHeroi(o)/Math.max(1,o.vidaMax/6);
          /* o valor da condição entra SOMADO e não multiplicado: uma habilidade
             de controle puro (dano baixo, atordoamento) precisa poder ganhar de
             um golpe forte sem condição, e multiplicar zero dá zero. */
          if(!mata) nota+=iaValorCondicoes(h,hb,o);
          if(!mata&&i===2) nota*=.55;               /* não queima Ultimate sem fechar */
          /* FOCO (só o Mestre): alvo já ferido vale mais, porque dano em quem
             está caindo vira abate e dano espalhado vira nada. Não é bônus de
             número — é ordem de preferência entre alvos que ela já podia bater. */
          if(IA().foco&&!mata) nota*=1+.8*(1-o.vida/o.vidaMax);
          saida.push({h,i,tipo:"heroi",v:o,nota});
        });

        /* HABILIDADE NO ALIADO. A v44 não pontuava nenhuma: o suporte só agia
           quando calhava de haver inimigo ao alcance, e nunca curava, nunca
           escudava, nunca limpava. Com doze condições no jogo isso deixou de ser
           detalhe — LIMPAR é metade do contrajogo, e quem limpa é ele. */
        alvos.filter(o=>o.t===h.t&&o!==h).forEach(o=>{
          const ef=hb.ef; let nota=0;
          if(ef.cura&&o.vida<o.vidaMax) nota+=Math.round(24*(1-o.vida/o.vidaMax))+6;
          if(ef.escudo)                 nota+=(o.vida<o.vidaMax*.7?26:8);
          if(ef.limpa)                  nota+=20*condsMalignas(o).length+(o.preso?14:0);
          if(ef.revive&&o.morto)        nota+=60;
          if(ef.doar&&!o.agiu&&!o.morto) nota+=12;
          if(ef.condAliadosPerto)       nota+=6;
          if(o.morto&&!ef.revive)       nota=0;
          if(nota>0) saida.push({h,i,tipo:"heroi",v:o,nota});
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
          /* v45 — as habilidades de si mesmo que a v44 não conhecia */
          if(ef.limpaEu) nota=Math.max(nota,10+18*condsMalignas(h).length);
          if(ef.condEu&&ef.condEu.some(c=>c.t==="invisivel"))
            nota=Math.max(nota, escondido(h)?6:(h.vida<h.vidaMax*.6?46:20));
          if(ef.condEu&&ef.condEu.some(c=>c.t==="tenacidade")) nota=Math.max(nota,perto?24:8);
          if(ef.recurso) nota=Math.max(nota,20);
          if(ef.alcanceTurno) nota=Math.max(nota,14);
          if(ef.recuaLivre&&h.vida<h.vidaMax*.5) nota=Math.max(nota,30);
          if(ef.condRaio) nota=Math.max(nota,10*perto);
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
  const cfg=IA();
  const piso=(minimo!==undefined&&minimo!==null)?minimo:cfg.minimo;
  /* O ERRO. Ela ordenou a lista e conhece a melhor — e às vezes escolhe outra,
     que é exatamente como um jogador inexperiente erra: a informação estava lá.
     Nunca escolhe jogada abaixo do piso, senão viraria IA aleatória em vez de
     IA fraca, e jogar contra o acaso não ensina nada. */
  const viaveis=lista.filter(x=>x.nota>=piso);
  if(!viaveis.length)return null;
  const j=(cfg.erro&&viaveis.length>1&&Math.random()<cfg.erro)
    ? viaveis[1+Math.floor(Math.random()*(viaveis.length-1))]
    : viaveis[0];
  if(!j)return null;
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
  if(!IA().compra)return false;   // o Aprendiz deixa o ouro parado, como quem está aprendendo
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
    /* TIME INTEIRO MORTO: sem herói vivo não há alvo, e seguir daqui punha
       `selHeroi` indefinido dentro de `jogaCarta` — a primeira carta que lê
       `h.pos` (ward, recall, escudo) derrubava a partida com TypeError. Cinco
       heróis no respawn ao mesmo tempo é fim de partida normal, não borda. */
    if(!alvo)break;
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
  if(IA().defende && J.nexus[t]<=1 && rotaAbertaContra(t)){
    const perto=vivos(t).slice().sort((a,b)=>
      dist(...a.pos,...BASE[t][0])-dist(...b.pos,...BASE[t][0]))[0];
    if(perto===h) return {p:BASE[t][0],motivo:"defende o Nexus"};
  }

  /* DEFENDER A TORRE SITIADA (v47). Antes desta versão a IA só voltava para casa
     com o Nexus em 1 — ou seja, defendia quando já era tarde. Não era falta de
     vontade: até a v46 defender torre não FUNCIONAVA, porque a onda cobrava a
     torre mesmo com a presença empatada, e mandar um herói para lá só o tirava
     do mapa. A regra nova (empate segura) transformou a defesa na jogada mais
     barata do jogo, e a IA precisa saber disso — senão a regra existe só para o
     humano, que é o mesmo erro que a Última Muralha quase cometeu.

     A conta é a que o jogador faz olhando a rota: a torre está caindo porque
     eles têm MAIS gente ali. Um corpo a mais empata, e empate segura. Por isso
     vai UM herói, o mais perto — dois seria pagar caro por um empate que um só
     já compra, e é assim que se perde o resto do mapa. */
  if(IA().defende){
    const sitiadas=J.torres.filter(tr=>tr.t===t&&tr.vida>0&&J.frentes[tr.rota]===tr.i)
      .filter(tr=>((J.presenca[1-t][tr.rota]||0)-(J.presenca[t][tr.rota]||0))>0);
    if(sitiadas.length){
      /* a mais adiantada primeiro: torre perdida abre rota, e rota aberta é o Nexus */
      const alvo=sitiadas.sort((a,b)=>a.vida-b.vida)[0];
      const casa=ROTAS[alvo.rota][alvo.i];
      const perto=vivos(t).slice().sort((a,b)=>dist(...a.pos,...casa)-dist(...b.pos,...casa))[0];
      if(perto===h&&rotaDaPos(h)!==alvo.rota) return {p:casa,motivo:"defende a torre"};
    }
  }

  if(IA().objetivo && J.poco.vida>0&&dist(...h.pos,...POCO)<=4) return {p:POCO,motivo:"objetivo"};

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
  if(!IA().alcance)return false;  // converter dado em movimento para chegar é jogada de quem já jogou
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
    const alc=alcanceUtil(h);
    /* §33 — a IA não planeja caminho impossível. Converter um dado em movimento
       que este herói não tem como andar é queimar ação por nada, e era
       exatamente o que ela faria no primeiro turno em que o teto pessoal
       mordesse. O teto conta as casas que ELE ainda pode dar neste turno. */
    const podeAndar=casasRestantes(h);
    if(!podeAndar)continue;
    for(const alvo of cobicados){
      const falta=dist(...h.pos,...alvo.pos)-alc;
      if(falta<=0||falta>6||falta>podeAndar)continue;
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
/* §51 — A IA SABE RECUAR. Se ela vai terminar o turno debaixo de uma torre
   inimiga sem creep, e não derrubou a torre, isso é risco real: sai de lá com o
   movimento que sobrou. Roda depois do laço de jogadas, quando já se sabe o que
   ela conseguiu fazer no turno. O Aprendiz não faz — mergulhar é exatamente o
   erro de quem está aprendendo, e a IA fácil precisa errar em algum lugar. */
function iaRecuaDeTorre(t){
  if(!IA().defende)return false;
  let saiu=false;
  for(const h of vivos(t)){
    if(J.mov.rest<=0)break;
    if(h.preso||!noJogo(h)||!casasRestantes(h))continue;
    if(!torreQueAmeaca(h))continue;
    selHeroi=h; modo="mover"; calcula();
    const seguro=p=>!J.torres.some(x=>x.t!==h.t&&x.vida>0
      &&dist(...p,...posDaTorre(x))<=ZONA_TORRE&&!creepApoia(x));
    const fuga=mover.filter(seguro)
      .sort((a,b)=>dist(...h.pos,...a)-dist(...h.pos,...b))[0];
    if(fuga){ moveAte(...fuga); saiu=true; }
    limpaModo();
  }
  limpaModo(); selHeroi=null;
  return saiu;
}
function iaPlantaWards(t){
  if(!IA().wards)return false;   // visão é a última coisa que o iniciante compra
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
    const jogada = iaMelhorJogada(lado, IA().minimo);
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
        /* a régua da IA é a mesma do jogador: passos ANDANDO. Com distância em
           linha reta ela encostava no obstáculo e parava — nenhuma vizinha
           reduzia a reta, e o herói ficava tremendo contra o ônibus a partida
           inteira. É o mesmo defeito que o contorno do `passoNaDirecao` cobria
           na rotação antiga. */
        const ate=passosDe(dest.p);
        const anda=p=>{const v=ate.get(k(...p));return v===undefined?99:v;};
        const agora=anda(h.pos);
        if(agora===0)continue;
        selHeroi=h; modo="mover"; calcula();
        const umPasso=mover.filter(p=>dist(...h.pos,...p)===1)
          .sort((a,b)=>anda(a)-anda(b))[0];
        if(umPasso&&anda(umPasso)<agora){
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

  if(iaRecuaDeTorre(lado)&&aiMode) falaIA("sai de baixo da torre");
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
  const alc=alcDeHab(h,hb);
  const alcTxt=hb.alvo==="eu"?"—":hb.ef.semAlcance?"o mapa inteiro":`${alc} ${alc===1?"casa":"casas"}`;
  const dados=J.dados.map(d=>{
    const gasto=d.usado, serve=!gasto&&dadoServe(hb,h,d.v);
    return `<div class="fdl${serve?" ok":""}">
      <span class="fdd">${d.v}</span>
      <span class="fdt">${gasto?"já gasto nesta rodada"
        :serve?descreve(h,hb,d.v):`fora da faixa ${textoFaixa(hb,h)}`}</span></div>`;
  }).join("");
  abreSheet(hb.n,`
    <div class="fh-top">
      <span class="fh-et">${h.n} · ${POS[CATALOGO[h.id].pos].n}</span>
      <div class="fh-grade">
        <div><div class="k">Dado</div><div class="v">${textoFaixa(hb,h)}</div></div>
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
G("btPrio").onclick=()=>{ if(!mesaTravada()) usaPrioridade(); };
G("btPularIA").onclick=()=>{
  if(pularIA)return;
  pularIA=true;
  const b=G("btPularIA");
  b.classList.add("correndo"); b.textContent="resolvendo…";
};
G("btLoja").onclick=()=>{ if(mesaTravada()&&!(sheetAberto||"").startsWith("Loja"))
    return toast("a loja abre na sua vez","morte");
  sheetAberto&&sheetAberto.startsWith("Loja")?fechaSheet():abreLoja(); };
G("btCartas").onclick=()=>{ if(mesaTravada()&&sheetAberto!=="Cartas")
    return toast("as cartas saem na sua vez","morte");
  sheetAberto==="Cartas"?fechaSheet():abreMao(); };
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
        /* v48: a torre tem 12 de vida, e doze bolinhas não se leem. Barra mais
           número, que é o que o pedido chamou de "HP 12/12". */
        const pc=Math.round(Math.max(0,x.vida)/VIDA_TORRE*100);
        return `<span class="tw${eu?" exposta":""}" title="passo ${x.i}">`+
               `<span class="hp"><i style="width:${pc}%"></i></span>`+
               `<b class="hpn">${Math.max(0,x.vida)}/${VIDA_TORRE}</b>`+
               `${eu?'<em>alvo</em>':""}</span>`;
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
  if(mesaTravada())return;
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
G("btConv").onclick=()=>{ if(!mesaTravada()) converteDado(); };
G("btPlaca").onclick=()=>{ if(mesaTravada())return; usaPlaca(1); toast("dado ajustado",""); vibra(10); };
G("btRerol").onclick=()=>{ if(mesaTravada())return; rerola(); toast("dado re-rolado",""); vibra(10); };
G("btWard").onclick=()=>{ if(mesaTravada())return; if(plantaSentinela(selHeroi)){ calcula(); pinta(); } };
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
    /* v45: a Contra-emboscada deixou de ser uma linha no log e virou REVELAÇÃO de
       verdade. Ela já era a resposta ao mato; com a Invisibilidade no jogo ela
       passa a ser também a resposta ao Pombo — e é o contrajogo que o §28 exige
       estar disponível a QUALQUER time, não só a quem draftou a Vidente. */
    const ocultos=J.times[1-t].herois.filter(x=>!x.morto&&noJogo(x)&&!visivelPara(x,t));
    ocultos.forEach(x=>aplicaCond(x,"revelado",{tu:1}));
    msg+=ocultos.length?` → REVELADOS: ${ocultos.map(x=>x.n).join(", ")}`
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
  G("shCorpo").querySelectorAll(".ct").forEach(b=>b.onclick=()=>{
    if(mesaTravada())return; jogaCarta(b.dataset.c); });
}

/* ══════════════════ DRAFT ══════════════════ */
let dr=null;
function iniciaDraft(depois){
  dr={fase:"ban", passo:0, bans:[], times:[[],[]], aoFim:depois};
  telaDraft();
}

/* a ordem do draft mora no catálogo; o fallback existe para o caso de o guia
   carregar o motor sem ele */
const ORDEM_DRAFT_USADA=()=>typeof ORDEM_DRAFT!=="undefined"?ORDEM_DRAFT:
  [{rota:"topo",primeiro:0},{rota:"selva",primeiro:1},{rota:"meio",primeiro:0},
   {rota:"adc",primeiro:1},{rota:"sup",primeiro:0}];
function draftTurnoAtual(){
  const ORDEM=ORDEM_DRAFT_USADA();
  if(dr.fase==="ban") return dr.passo;
  const et=ORDEM[Math.floor(dr.passo/2)];
  return dr.passo%2===0 ? et.primeiro : 1-et.primeiro;
}
/* ══════════════ A IA DRAFTA (v48) ══════════════
   RELATO: *"a IA sempre bane e escolhe praticamente os mesmos heróis"*. E era
   literal — ela ordenava por `vida + poder×2 + arm×1,5 + ruído×2` e pegava o
   primeiro. O ruído de ±2 não chega perto da distância entre os chassis (a vida
   sozinha varia 7 pontos), então a ordem era sempre a mesma e o draft também.

   A correção NÃO é `Math.random()` (§15). É o que §16 e §17 pediram:
   **nota ponderada, e sorteio dentro do grupo dos melhores.** Um herói ruim
   continua improvável; o mesmo herói deixa de ser certeza.

   Cada peça da nota está separada de propósito, para poder ser discutida (e
   medida) uma a uma. */

/* 1. O CHASSI. Escala comprimida em relação à ordenação antiga: `vida` entrava
      inteira e dominava tudo sozinha. Aqui ela vale um terço, e o que separa os
      heróis passa a ser a soma do kit, não o tamanho da barra. */
const draftForca=id=>{
  const h=CATALOGO[id];
  return h.vida*0.35 + h.poder*2.2 + h.arm*1.6 + h.alc*1.2
       + (h.agil?1.5:0) + (h.movMax||MOV_MAX_PADRAO)*0.5;
};

/* 1b. A AMEAÇA DO KIT, lida das habilidades e não de uma lista de nomes. O
      chassi diz quanto o herói aguenta; isto diz o quanto ele assusta. Sem
      esta parcela a nota era quase só `vida`, e os quatro chassis mais gordos
      dominavam picks e bans em qualquer situação — que é metade do defeito
      relatado. Herói novo entra sozinho nesta conta: ela lê `ef`. */
function draftAmeaca(id){
  let n=0;
  (CATALOGO[id].habs||[]).forEach(hb=>{
    const e=hb.ef||{};
    const conds=[...(e.cond||[]),...(e.condVizinhos||[]),...(e.condRaio||[]),
                 ...(e.condEu||[]),...(e.condSeNaZona||[])];
    conds.forEach(c=>{
      if(c.t==="atordoado")  n+=3;
      else if(c.t==="silenciado") n+=2.5;
      else if(c.t==="invisivel")  n+=3;
      else if(c.t==="banido")     n+=1;
      else n+=0.6;
    });
    if(e.executa)  n+=2;
    if(e.revive)   n+=3;
    if(e.perfura)  n+=1.5;
    if(e.prende||e.prendeVizinhos) n+=1.5;
    if(e.zona)     n+=1;
    if(e.cura>=5)  n+=1.5;
    if(e.area||e.danoRaio||e.danoVizinhos) n+=1;
    if(e.doar)     n+=1;
  });
  return n;
}

/* 2. A COMPOSIÇÃO do próprio time (§16, "sinergia"). Não é bônus de número
      entre heróis: é o time olhando para os buracos que tem. Cinco magos é uma
      composição, mas é uma composição ruim, e a IA precisa saber disso. */
function draftSinergia(id,meuTime){
  const h=CATALOGO[id], cls=meuTime.map(x=>CATALOGO[x].cls);
  let n=0;
  const iguais=cls.filter(c=>c===h.cls).length;
  n-=iguais*2.2;                                          /* o terceiro igual pesa */
  const temFrente=meuTime.some(x=>["Tanque","Lutador"].includes(CATALOGO[x].cls));
  if(!temFrente&&["Tanque","Lutador"].includes(h.cls)) n+=2.5;
  const temLonge=meuTime.some(x=>CATALOGO[x].alc>=3);
  if(!temLonge&&h.alc>=3) n+=2;
  const temCura=meuTime.some(x=>CATALOGO[x].cls==="Suporte");
  if(!temCura&&h.cls==="Suporte") n+=1.5;
  return n;
}

/* 3. O MATCHUP contra o time do adversário. **Hoje devolve zero de propósito**:
      a rede de anti-picks é decisão do grupo (§24 e §59 do pedido pedem a
      tabela aprovada ANTES de mexer nos kits), e o lugar onde ela entra é
      exatamente aqui. Fica escrito para não haver dúvida sobre onde plugar. */
function draftContra(id,timeDeles){
  return 0;
}

/* 4. A NOTA. E o SORTEIO PONDERADO dentro do grupo dos melhores (§17): os `k`
      primeiros entram no sorteio, com peso proporcional à vantagem sobre o
      último do grupo. `draftPeso` é a personalidade do nível — o Aprendiz
      sorteia liso entre quatro, o Mestre pende forte para os dois primeiros. */
function draftNota(id,t){
  return draftForca(id)+draftAmeaca(id)
        +draftSinergia(id,dr.times[t])+draftContra(id,dr.times[1-t]);
}
function sorteiaPonderado(ids,nota,kPedido){
  const cfg=IA();
  const k=Math.max(1,Math.min(kPedido||cfg.draftK||3,ids.length));
  const ordenados=ids.slice().sort((a,b)=>nota(b)-nota(a));
  const grupo=ordenados.slice(0,k);
  const piso=nota(grupo[grupo.length-1]);
  const expo=cfg.draftPeso===undefined?1:cfg.draftPeso;
  /* +1 no piso para que o último do grupo tenha peso, e não zero: variedade é
     o objetivo, e um peso zero devolveria o determinismo pela porta dos fundos */
  const pesos=grupo.map(id=>Math.pow(nota(id)-piso+1,expo));
  const total=pesos.reduce((a,b)=>a+b,0);
  let r=Math.random()*total;
  for(let i=0;i<grupo.length;i++){ r-=pesos[i]; if(r<=0) return grupo[i]; }
  return grupo[0];
}

/* AS OPÇÕES LEGAIS — uma porta só, para a tela, a IA e o teste lerem a mesma
   lista. §18: heróis já escolhidos, banidos e a trava de uma rota por
   banimento entram aqui, e não em três lugares diferentes. */
function draftLegais(){
  const ORDEM=ORDEM_DRAFT_USADA();
  if(dr.fase==="ban"){
    const rotasBanidas=dr.bans.map(id=>CATALOGO[id].pos);
    return Object.keys(CATALOGO).filter(id=>
      !dr.bans.includes(id)&&!rotasBanidas.includes(CATALOGO[id].pos));
  }
  const rota=ORDEM[Math.floor(dr.passo/2)].rota;
  return Object.keys(CATALOGO).filter(id=>
    CATALOGO[id].pos===rota&&!dr.bans.includes(id)
    &&!dr.times[0].includes(id)&&!dr.times[1].includes(id));
}

/* A ESCOLHA DA IA, pura: devolve o id e não mexe em nada. É por aqui que
   `sim/draft.js` roda trinta drafts sem tela nenhuma. */
function iaEscolheDraft(t){
  const legais=draftLegais();
  if(!legais.length)return null;
  if(dr.fase==="ban"){
    /* BANIR é tirar da mesa o que o ADVERSÁRIO mais gostaria de ter — e o que
       mais assusta, que raramente é o chassi mais gordo. O grupo do sorteio é
       TRÊS a mais que o dos picks: o pool do ban é o catálogo inteiro (20
       heróis contra os 4 de uma rota), e com o mesmo `k` os dois bans caíam
       sempre nos mesmos quatro nomes. Medido em 200 drafts: com +2, sete heróis
       diferentes foram banidos alguma vez; com +3, nove. */
    const cfg=IA(), k=(cfg.draftK||3)+3;
    return sorteiaPonderado(legais,
      id=>draftForca(id)+draftAmeaca(id)*1.5+draftSinergia(id,dr.times[1-t]), k);
  }
  return sorteiaPonderado(legais,id=>draftNota(id,t));
}

/* APLICA a escolha e avança o passo. Porta única: o clique humano e a IA
   passam pelos mesmos oito de linha, então nunca divergem. */
function draftAplica(id){
  const ORDEM=ORDEM_DRAFT_USADA();
  if(dr.fase==="ban"){
    dr.bans.push(id); dr.passo++;
    if(dr.passo>=2){ dr.fase="pick"; dr.passo=0; }
    return false;
  }
  const et=ORDEM[Math.floor(dr.passo/2)];
  const t=dr.passo%2===0?et.primeiro:1-et.primeiro;
  dr.times[t].push(id); dr.passo++;
  return dr.passo>=10;         /* true = o draft acabou */
}

function draftEscolhaIA(){
  if(!aiMode || draftTurnoAtual()!==1)return false;
  const id=iaEscolheDraft(1);
  if(!id)return false;
  setTimeout(()=>{
    if(draftAplica(id)){ fecha(); return dr.aoFim(dr.times); }
    telaDraft();
  },500);
  return true;
}

function telaDraft(){
  const ORDEM=ORDEM_DRAFT_USADA();
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
    if(draftAplica(id)){ fecha(); return dr.aoFim(dr.times); }
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
/* A escolha do nível, antes do draft. Fica antes de propósito: o jogador decide
   contra quem vai jogar antes de escolher com quem vai jogar.

   O texto de cada botão diz o que MUDA no comportamento, e não "fácil/médio/
   difícil". É a diferença entre o jogador saber que a IA vai deixar o poço
   passar e ele só sentir que "tá mais fácil" sem entender por quê. */
function escolheNivelIA(depois){
  const bts=Object.values(NIVEIS_IA).map(v=>
    `<button class="grande nivIA" data-n="${v.id}" style="font-size:15px;padding:12px;text-align:left">
      ${v.n}${v.id===nivelIA?" ·  atual":""}<br>
      <span style="font-size:12.5px;opacity:.8">${v.d}</span></button>`).join("");
  abre(`<span class="et">Contra a IA</span><h2>Qual adversário?</h2>
    <p>Nenhum nível dá à IA dano, vida, ouro ou visão a mais —
    ela obedece à mesma névoa que você. <b>O que muda é como ela decide.</b></p>${bts}`);
  G("telacx").querySelectorAll(".nivIA").forEach(b=>b.onclick=()=>{
    nivelIA=b.dataset.n; fecha(); depois();
  });
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
  G("btIA").onclick=()=>escolheNivelIA(()=>{
    aiMode=true; simMode=false;
    iniciaDraft(times=>{ TIMES=times; partida(false); });
  });
  G("btDireto").onclick=()=>{aiMode=false;comeca(false,false);};
}
globalThis.__JAGER_AI__={
  start:()=>{ aiMode=false; simMode=true; TIMES=[["vharn","nyx","solenne","vesper","mirrha"],["vharn","nyx","solenne","vesper","mirrha"]]; baralho=typeof montaDeck!=="undefined"?montaDeck():[]; cemiterio=[]; maos=[[],[]]; descontos=[0,0]; novo(); },
  startHuman:()=>{ aiMode=true; simMode=false; baralho=typeof montaDeck!=="undefined"?montaDeck():[]; cemiterio=[]; maos=[[],[]]; descontos=[0,0]; novo(); },
  turn:()=>iaExecutaTurno(),
  get state(){return J}
};
telaAbertura();
