/* ═══════════════════════════════════════════════════════════════════
   JAGERLARAMAIS — expansão de conteúdo
   10 heróis novos (pool fecha em 20, QUATRO por rota) · 10 itens · deck de 46

   O pool foi cortado de 45 para 20 em v0.4: quatro heróis por rota, cada um
   com um arquétipo distinto, TODOS com arte. Pool grande sem arte só fazia
   o draft demorar. Ver docs/patch-notes.md.

   Efeitos de herói e item usam SOMENTE o vocabulário que o motor já executa
   (ver jogo/index.html → usaHab e bonus).
   ═══════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════
   CONDIÇÕES — o registro central (v45)
   ═══════════════════════════════════════════════════════════════════
   Até a v44 existiam DUAS condições ("dot": sangramento e veneno) e três
   sinalizadores soltos no herói (`marca`, `preso`, `intoc`). Cada um era lido
   num lugar diferente do motor, e nenhum aparecia na peça — o jogador
   descobria que estava sangrando abrindo uma gaveta.

   Aqui a condição passa a ser DADO. Uma entrada nesta tabela ganha, de graça:
   ícone na peça, linha na ficha, aviso de aplicação, aviso de fim, texto de
   tooltip, imunidade por Tenacidade e limpeza na morte. O motor tem UMA porta
   para aplicar (`aplicaCond`) e UMA para processar (`processaConds`).

   Os campos:
     n         nome de manual
     ico       o que aparece na peça
     selo      etiqueta grande, quando ela é a condição de maior consequência
     mal/bom   de que lado joga — decide a cor do indicador
     pilha     conta ACÚMULOS (`st`); sem isto conta TURNOS (`tu`)
     max       teto de acúmulo ou de duração
     ctrl      é controle: Tenacidade anula, e o alvo não fica preso em cadeia
     limpavel  sai com uma limpeza (Digerir, Empresta o Fone, Varrida)
     d         a regra, na frase que o jogador lê no tooltip

   A DURAÇÃO É CONTADA EM TURNOS DO PORTADOR, nunca em rodadas. É a mesma lição
   que a zona aprendeu na v20 e a v37 repetiu: prazo em rodada dá ao primeiro
   jogador uma janela maior que a do segundo. Contando turnos do portador, os
   dois lados recebem exatamente o mesmo número de cobranças por construção.
   O dano é cobrado no INÍCIO do turno do portador; a duração cai no FIM. */
const CONDS = {
  sangramento:{n:"Sangramento", ico:"🩸", selo:"SANGRANDO", mal:1, pilha:1, max:5, limpavel:1,
    d:"No início do seu turno sofre 1 de dano por acúmulo. Depois perde 1 acúmulo."},

  veneno:{n:"Veneno", ico:"☠️", selo:"ENVENENADO", mal:1, max:4, limpavel:1,
    d:"No início do seu turno sofre 2 de dano, sempre os mesmos 2. Depois a duração cai 1."},

  lentidao:{n:"Lentidão", ico:"🐌", selo:"LENTO", mal:1, ctrl:1, limpavel:1, max:2,
    d:"Anda 2 casas a menos — nunca menos de 1 — e perde o passo grátis de Ágil. Continua agindo."},

  atordoado:{n:"Atordoamento", ico:"⭐", selo:"ATORDOADO", mal:1, ctrl:1, limpavel:1, max:1,
    d:"Não age e não anda neste turno. Ao passar, deixa Tenacidade: não dá para atordoar duas vezes seguidas."},

  banido:{n:"Banimento", ico:"🌀", selo:"BANIDO", max:1,
    d:"Fora do tabuleiro: não é alvo, não sofre dano, não ocupa hexágono e não acende visão. Volta no início do próprio turno, no mesmo lugar."},

  invisivel:{n:"Invisibilidade", ico:"👁️", selo:"INVISÍVEL", bom:1, max:3,
    d:"O adversário não vê a peça, mesmo fora do mato. Atacar entrega a posição. Ward e Revelado cancelam."},

  marcado:{n:"Marcado", ico:"🎯", selo:"MARCADO", mal:1, pilha:1, max:9, limpavel:1,
    d:"O próximo dano recebido leva um bônus igual ao total marcado. Depois a marca sai."},

  vulneravel:{n:"Vulnerável", ico:"💢", selo:"VULNERÁVEL", mal:1, limpavel:1, max:2,
    d:"Armadura −2 enquanto durar."},

  silenciado:{n:"Silenciado", ico:"🤐", selo:"SILENCIADO", mal:1, ctrl:1, limpavel:1, max:1,
    d:"Só pode usar a habilidade básica. A segunda e a Ultimate ficam trancadas."},

  tenacidade:{n:"Tenacidade", ico:"🛡️", selo:"TENAZ", bom:1, max:2,
    d:"Anula a próxima Lentidão, Atordoamento, Silêncio ou Prisão que chegar — e se gasta ao anular."},

  revelado:{n:"Revelado", ico:"📡", selo:"REVELADO", mal:1, max:2,
    d:"Visível para o adversário em qualquer lugar: no mato, atrás do ônibus e sob Invisibilidade."},

  /* MARCA DE PERSONAGEM. Vive no mesmo registro porque quer a mesma máquina
     (ícone, tooltip, limpeza, morte), mas só UM herói a aplica — é o que a
     mantém sendo assinatura em vez de status universal. Ver §16 do desenho. */
  catarino:{n:"Marca do Catarino", ico:"💠", selo:"MARCA", mal:1, pilha:1, max:3, limpavel:1,
    dono:"nessa",
    d:"Na terceira marca o cilindro estoura: 5 de dano que ignora armadura e escudo, e as marcas saem."}
};
/* números de balanceamento das condições, num lugar só */
const COND_NUM = {
  sangramentoPorStack:1,   /* dano por acúmulo, por turno */
  venenoDano:2,            /* dano fixo por turno */
  lentidaoCasas:2,         /* quantas casas a menos */
  vulneravelArm:2,         /* quanta armadura a menos */
  catarinoEstouro:5,       /* dano do estouro da 3ª marca */
  critico:1.5              /* multiplicador do CRÍTICO */
};

/* ═══════════════════════════════════════════════════════════════════
   RECURSOS DE PERSONAGEM
   ═══════════════════════════════════════════════════════════════════
   Contador que pertence a UM herói e não vira status universal. Aparece na peça
   e na ficha pela mesma máquina das condições, mas ninguém mais o usa. */
const RECURSOS = {
  carga:   {n:"Carga",    ico:"⚡", max:3, dono:"solenne", d:"3 Cargas deixam o próximo golpe Crítico."},
  sucata:  {n:"Sucata",   ico:"♻️", max:5, dono:"nira",    d:"Cada Sucata soma 2 de dano na Ultimate, que gasta tudo."},
  tristeza:{n:"Tristeza", ico:"🖤", max:5, dono:"mirrha",  d:"Cada Tristeza soma 1 na cura e no escudo dele."},
  cartucho:{n:"Cartucho", ico:"🔸", max:3, dono:"corvo",   d:"No quarto tiro, o cartucho estoura: Crítico."},
  folego:  {n:"Fôlego",   ico:"🎈", max:3, dono:"vesper",  d:"+2 de dano por Fôlego. Trocar de alvo zera."},
  almas:   {n:"Almas",    ico:"🔗", max:5, dono:"torvald", d:"Cada Alma vale +1 de Armadura permanente."}
};

/* ═══════════════════════════════════════════════════════════════════
   PASSIVAS — texto no catálogo, código no motor
   ═══════════════════════════════════════════════════════════════════
   O `id` é a chave do registro `PASSIVAS` em jogo/jogo.js. O catálogo diz O QUE
   a passiva faz (para o guia, a carta e o tooltip); o motor diz COMO. Isto é o
   que impede o `if (heroi.nome === "X")` espalhado que o desenho proibiu: para
   dar passiva a um herói novo, escreve-se uma entrada aqui e uma no registro.

   REGRA DE TAMANHO: uma frase. "Quando X acontece, Y acontece." Passiva que
   precisa de cinco condições e oito exceções está mal desenhada — simplifique. */

/* ═══════════ OS 10 ORIGINAIS ═══════════
   Moraram dentro de jogo/index.html até a v0.4. Vieram para cá porque o guia
   mantinha uma segunda lista, com números de outra versão — dois catálogos,
   uma verdade só. Agora jogo e guia leem daqui. */
/* ═══════════ A FAIXA DE DADO DE CADA HABILIDADE (v49) ═══════════
   Até a v48 o dado tinha uma FORÇA MÍNIMA: `f:3` queria dizer "3 ou mais", e um
   6 servia para tudo. O relato do Vilker foi que o sistema confundia — e a
   proposta dele é mais limpa do que parece:

     **o dado não decide SE a habilidade sai. Decide QUAL habilidade sai.**

     dado 1–2  →  a básica
     dado 3–5  →  a segunda
     dado 6    →  a Ultimate

   Não existe "ou mais": é a faixa e acabou. Nenhum dado morre — um 6 é Ultimate
   de qualquer um dos cinco heróis —, e a pergunta do turno deixa de ser "que
   habilidade eu destravo com este dado?" para ser **"quem recebe este dado?"**.

   A básica ficou mais fraca de propósito (sai sempre com 1 ou 2): era pedido
   explícito — *"a básica pode ser assim mesmo pra ficar mais difícil"*.

   ── E A INDIVIDUALIDADE ──
   A faixa acima é o PADRÃO, e fugir dela é o que dá personalidade ao herói:

     `barata` [2–5]  a segunda que sai com quase qualquer dado. É dos heróis
                     cuja segunda é utilidade, não pico: Digerir, Eco, Puff,
                     Recarregar, Empresta o Fone, Empréstimo, Escudo de Pelo;
     `cara`   [4–5]  a segunda que exige dado grande. Só a Interferência da
                     Parabólica, que silencia — controle forte pede preço;
     `ult 5–6`       a Ultimate que sai mais vezes. Só as dos dois suportes de
                     cura, o Emerson e a Vidra: elas não matam ninguém, e o que
                     elas fazem (reviver, escudar o time) tem de chegar a tempo.

   Quem não declara `dados` segue o padrão. */
const FAIXA_SLOT = [[1,2],[3,4,5],[6]];
const FAIXA_BARATA = [2,3,4,5];
const FAIXA_CARA   = [4,5];
const FAIXA_ULT_SUP= [5,6];

/* A faixa de uma habilidade, e o rótulo dela — UM lugar só. O jogo, o guia e as
   cartas mostram a mesma coisa porque leem daqui; foi assim que a v48 acabou com
   as tabelas de item divergentes, e não há motivo para repetir o erro com o
   dado. O índice é o slot no kit: quem não declara `dados` herda a faixa dele. */
function faixaHab(hb,i){ return (hb&&hb.dados)||FAIXA_SLOT[i]||FAIXA_SLOT[0]; }
function textoFaixaHab(hb,i){
  const f=faixaHab(hb,i), lo=Math.min(...f), hi=Math.max(...f);
  return lo===hi?String(lo):lo+"\u2013"+hi;
}

const HEROIS_BASE = {

/* ─────────── TOPO ─────────── */

vharn:{n:"O Taxista",ep:"o Piloto da Quebrada",pos:"topo",cls:"Tanque",ref:"Ornn / Sion",
  vida:25,poder:3,arm:3,alc:1,movMax:3,
  ideia:"O dono do espaço. Perto dele o tabuleiro fica lento, e ele é o único que ATORDOA.",
  pas:{id:"pontoDeOnibus",n:"Ponto de Ônibus",
       d:"No início do turno dele, todo inimigo colado fica Lento."},
  habs:[{n:"Martelo Carburado",alvo:"in",ef:{dano:1,cond:[{t:"vulneravel",tu:1}]}},
        {n:"Buzina Infernal",alvo:"in",alc:2,ef:{dano:1,puxar:1,cond:[{t:"atordoado",tu:1}]}},
        {n:"Escudo de Porta",alvo:"eu",ef:{escudo:6,prendeVizinhos:1,condEu:[{t:"tenacidade",tu:2}]}}]},

kaross:{n:"Dona Chinela",ep:"a Justiça de Borracha",pos:"topo",cls:"Lutador",ref:"Darius",
  vida:22,poder:3,arm:2,alc:1,movMax:4,
  ideia:"Empilha Sangramento e cobra a conta: quanto mais o alvo sangra, mais alto o chinelo executa.",
  pas:{id:"chinelada",n:"Chinelada",
       d:"Todo golpe dela deixa 1 acúmulo de Sangramento no alvo."},
  habs:[{n:"Chinelada",alvo:"in",alc:1,ef:{dano:1,bonusFerido:3}},
        {n:"Puxão de Orelha",alvo:"in",alc:1,ef:{dano:1,puxar:1,cond:[{t:"sangramento",st:2}]}},
        {n:"Chinelo Voador",alvo:"in",alc:3,ef:{dano:1,executa:5,
           execPorStack:{t:"sangramento",v:3},consome:{t:"sangramento",danoPorStack:3}}}]},

ilva:{n:"Ilva",ep:"a Portadora",pos:"topo",cls:"Mago",ref:"Gwen / Mordekaiser",
  vida:20,poder:4,arm:2,alc:2,movMax:4,
  ideia:"Espalha Veneno e depois colhe: a Ceifa bate muito mais forte em quem já está envenenado.",
  pas:{id:"miasma",n:"Miasma",
       d:"No início do turno dela, todo inimigo colado é Envenenado por 1 turno."},
  habs:[{n:"Chama Espectral",alvo:"in",alc:3,ef:{dano:1,espalha:{t:"veneno",tu:1}}},
        {n:"Véu de Névoa",alvo:"eu",ef:{escudo:5,zona:{tipo:"veneno",dano:1,raio:1}}},
        {n:"Ceifa",alvo:"in",alc:1,ef:{dano:1,area:1,bonusCond:{t:"veneno",dano:4}}}]},

xhera:{n:"Xhera",ep:"a Insaciável",pos:"topo",cls:"Lutador",ref:"Aatrox / Riven",
  vida:22,poder:4,arm:2,alc:1,movMax:4,
  ideia:"Paga com a própria vida e recompra bebendo a do outro. Quanto mais ferida, mais forte.",
  pas:{id:"insaciavel",n:"Insaciável",
       d:"Cura 2 sempre que causa dano. Abaixo de metade da vida, cura 4 e ganha +2 de Poder."},
  habs:[{n:"Lâmina Sedenta",alvo:"in",alc:1,ef:{dano:1}},
        {n:"Investir",alvo:"in",alc:2,ef:{dano:1,extra:3,puxar:1,cond:[{t:"vulneravel",tu:1}]}},
        {n:"Sede Final",alvo:"in",alc:1,ef:{dano:1,extra:4,custoVida:3,bonusFerido:3,drena:1}}]},

/* ─────────── SELVA ─────────── */

nyx:{n:"Pombo Ciborgue",ep:"o Correio da Sarjeta",pos:"selva",cls:"Assassino",ref:"Kha'Zix / Rengar",
  vida:18,poder:3,arm:1,alc:1,agil:1,movMax:5,
  ideia:"Desaparece. Você não sabe onde ele está, e ele bate Crítico em quem andou sozinho.",
  pas:{id:"vooSilencioso",n:"Voo Silencioso",
       d:"No início do turno dele, se nenhum inimigo estiver colado, ele fica Invisível."},
  habs:[{n:"Bicada",alvo:"in",ef:{dano:1,extra:2,critSe:"isolado"}},
        {n:"Voo Rasante",alvo:"eu",ef:{condEu:[{t:"invisivel",tu:2}]}},
        {n:"Rasante Final",alvo:"in",ef:{dano:1,extra:3,executa:6,critSe:"eraInvisivel"}}]},

grumo:{n:"Grumo",ep:"o Devorador",pos:"selva",cls:"Tanque",ref:"Sejuani / Zac",
  vida:23,poder:3,arm:3,alc:1,movMax:3,
  ideia:"Digere tudo: veneno, sangramento e cadáver. O tanque que não fica com condição pendurada.",
  pas:{id:"digestao",n:"Digestão",
       d:"Cura 4 quando qualquer herói morre a até 2 casas dele."},
  habs:[{n:"Investida",alvo:"in",alc:2,ef:{dano:1,empurrar:1,cond:[{t:"lentidao",tu:1}]}},
        {n:"Digerir",dados:FAIXA_BARATA,alvo:"eu",ef:{cura:7,ouro:8,limpaEu:9}},
        {n:"Avalanche",alvo:"eu",ef:{danoVizinhos:1,prendeVizinhos:1,condVizinhos:[{t:"lentidao",tu:1}]}}]},

kurr:{n:"Valti",ep:"o Homem do Coco",pos:"selva",cls:"Assassino",ref:"Nidalee / Elise",
  vida:18,poder:3,arm:1,alc:2,agil:1,movMax:5,
  ideia:"Prepara terreno. O coco só atordoa quem pisou nas cascas — o Atordoamento tem endereço.",
  pas:{id:"olhoDeMateiro",n:"Olho de Mateiro",
       d:"Enxerga dentro do mato de qualquer lugar do tabuleiro."},
  habs:[{n:"Facão",alvo:"in",alc:1,ef:{dano:1,cond:[{t:"sangramento",st:1}]}},
        {n:"Talho de Facão",dados:FAIXA_BARATA,alvo:"in",alc:3,ef:{dano:1,
           zona:{tipo:"cascas",cond:{t:"lentidao",tu:1},raio:1}}},
        {n:"Coco na Cabeça",alvo:"in",alc:3,ef:{dano:1,extra:2,
           condSeNaZona:[{t:"atordoado",tu:1}]}}]},

pyk:{n:"Pyk",ep:"o Coveiro",pos:"selva",cls:"Assassino",ref:"Pyke",
  vida:18,poder:4,arm:2,alc:2,agil:1,movMax:5,
  ideia:"Marca, arrasta e executa. Contra ele a pergunta é sempre a mesma: dá para morrer daqui?",
  pas:{id:"contabilidade",n:"Contabilidade do Coveiro",
       d:"Quando ele mata, leva +3 de ouro e o aliado mais próximo leva +2."},
  habs:[{n:"Arpão",alvo:"in",alc:3,ef:{dano:1,cond:[{t:"marcado",st:3}]}},
        {n:"Puxada Funda",alvo:"in",ef:{dano:1,puxar:3,alcExtra:2,cond:[{t:"lentidao",tu:1}]}},
        {n:"Cova",alvo:"in",alc:1,ef:{dano:1,executa:7,execSeCond:{t:"marcado",v:4},ouroSeMatar:3}}]},

/* ─────────── MEIO ─────────── */

solenne:{n:"Parabólica Diabólica",ep:"que capta até o que não existe",pos:"meio",cls:"Mago",ref:"Lux / Syndra",
  vida:18,poder:3,arm:1,alc:3,movMax:4,
  ideia:"Junta Carga para o Crítico e TRANCA habilidade: perto dela a sua Ultimate pode não sair.",
  pas:{id:"captacao",n:"Captação",
       d:"Ganha 1 Carga a cada golpe. Com 3 Cargas, o golpe seguinte é Crítico e gasta as Cargas."},
  habs:[{n:"Raio Diabólico",alvo:"in",ef:{dano:1}},
        {n:"Interferência",dados:FAIXA_CARA,alvo:"in",ef:{dano:1,area:1,cond:[{t:"silenciado",tu:1}]}},
        {n:"Sinal Aberto",alvo:"in",ef:{dano:0.8,perfura:1,revelaRaio:4}}]},

zhet:{n:"Zhet",ep:"a Lâmina de Três Sombras",pos:"meio",cls:"Assassino",ref:"Zed / Talon",
  vida:18,poder:4,arm:1,alc:1,agil:1,movMax:5,
  ideia:"Troca de lugar com você e some do tabuleiro. Nunca está onde você bateu.",
  pas:{id:"passoDeSombra",n:"Passo de Sombra",
       d:"Depois de causar dano, ele recua 1 casa de graça."},
  habs:[{n:"Estocada",alvo:"in",ef:{dano:1}},
        {n:"Eco",dados:FAIXA_BARATA,alvo:"in",alc:2,ef:{dano:1,cond:[{t:"marcado",st:4}],troca:1}},
        {n:"Trio de Sombras",alvo:"in",ef:{dano:1,area:1,baneEu:1}}]},

nira:{n:"Gari Mago",ep:"o Guardião da Limpeza",pos:"meio",cls:"Mago",ref:"Orianna / Anivia",
  vida:18,poder:3,arm:1,alc:3,movMax:4,
  ideia:"Limpa os aliados e acumula Sucata. A Ultimate dele vale o que ele varreu na partida.",
  pas:{id:"coleta",n:"Coleta",
       d:"Ganha 1 Sucata a cada golpe e a cada herói que morre a até 3 casas. Máximo 5."},
  habs:[{n:"Varrida Purificadora",alvo:"in",alc:1,ef:{dano:1,limpaAliados:1}},
        {n:"Redemoinho Sustentável",alvo:"in",ef:{dano:1,prende:1,cond:[{t:"lentidao",tu:1}]}},
        {n:"Coleta Seletiva Suprema",alvo:"in",ef:{dano:1,area:1,
           zona:{tipo:"veneno",dano:2,raio:1},bonusPorRecurso:{t:"sucata",dano:2}}}]},

arden:{n:"Arden",ep:"o Juiz",pos:"meio",cls:"Mago",ref:"Swain / Cassiopeia",
  vida:22,poder:3,arm:2,alc:2,movMax:4,
  ideia:"COPIA. Ele guarda a última habilidade que te viu usar contra ele e devolve.",
  pas:{id:"jurisprudencia",n:"Jurisprudência",
       d:"Guarda a última habilidade inimiga que o acertou. Ultimate não entra nos autos."},
  habs:[{n:"Sentença",alvo:"in",ef:{dano:1}},
        {n:"Drenar",dados:FAIXA_BARATA,alvo:"in",ef:{dano:1,cura:5,cond:[{t:"veneno",tu:2}]}},
        {n:"Tribunal",alvo:"in",ef:{copia:1,danoRaio:3}}]},

/* ─────────── ATIRADOR ─────────── */

vesper:{n:"Zé Griteco",ep:"o Regente das Gemas",pos:"adc",cls:"Atirador",ref:"Jinx / Kog'Maw",
  vida:20,poder:3,arm:1,alc:3,patamar:1,movMax:4,
  ideia:"Rampa. Se ele te escolher e você não sair, cada turno dele dói mais que o anterior.",
  pas:{id:"pulmaoDeAco",n:"Pulmão de Aço",
       d:"Cada golpe seguido no MESMO alvo dá +1 Fôlego (+2 de dano cada). Trocar de alvo zera."},
  habs:[{n:"Ovada Surpresa",alvo:"in",ef:{dano:1,cond:[{t:"vulneravel",tu:1}]}},
        {n:"Encher o Pulmão",dados:FAIXA_BARATA,alvo:"eu",ef:{recarga:6,alcanceTurno:1}},
        {n:"Caminhão Fantasma",alvo:"eu",ef:{danoRaio:3,condRaio:[{t:"lentidao",tu:1}]}}]},

cael:{n:"Cael",ep:"o Cobrador",pos:"adc",cls:"Atirador",ref:"Caitlyn / Draven",
  vida:18,poder:3,arm:1,alc:3,movMax:4,
  ideia:"Armadilha primeiro, Crítico depois. Ele não crita por sorte — crita em quem ele travou.",
  pas:{id:"juros",n:"Juros",
       d:"Crítico contra alvo Preso, Atordoado ou Lento."},
  habs:[{n:"Cobrança",alvo:"in",ef:{dano:1,ouroSeMatar:2}},
        {n:"Armadilha",dados:FAIXA_BARATA,alvo:"in",ef:{dano:1,extra:2,
           zona:{tipo:"laco",cond:{t:"lentidao",tu:1},raio:1}}},
        {n:"Sentença",alvo:"in",ef:{dano:0.8,perfura:1,alcExtra:2}}]},

nessa:{n:"Catarino",ep:"o Menino do Cilindro",pos:"adc",cls:"Atirador",ref:"Vayne / Kai'Sa",
  vida:18,poder:3,arm:1,alc:3,patamar:1,agil:1,movMax:5,
  ideia:"Três marcas e o cilindro estoura. Contra ele conta-se de três em três, não de vida em vida.",
  pas:{id:"marcaDoCatarino",n:"Marca do Catarino",
       d:"Todo golpe dele deixa 1 Marca. Na terceira, 5 de dano que ignora armadura e escudo."},
  habs:[{n:"Jato de Oxigênio",alvo:"in",ef:{dano:1}},
        {n:"Puff de Emergência",dados:FAIXA_BARATA,alvo:"eu",ef:{escudo:4,recuaLivre:2}},
        {n:"Crise Alérgica",alvo:"in",ef:{dano:1,executa:5,execSeCond:{t:"catarino",v:4}}}]},

corvo:{n:"Corvo",ep:"o Marcador",pos:"adc",cls:"Atirador",ref:"Jhin / Senna",
  vida:18,poder:3,arm:1,alc:3,patamar:1,movMax:4,
  ideia:"Quatro tiros. O quarto é Crítico, e ele escolhe QUANDO — o Recarregar adianta a conta.",
  pas:{id:"quatroTiros",n:"Quatro Tiros",
       d:"Conta os golpes: o quarto sai Crítico e zera a contagem."},
  habs:[{n:"Tiro Marcado",alvo:"in",ef:{dano:1,cond:[{t:"marcado",st:3}]}},
        {n:"Recarregar",dados:FAIXA_BARATA,alvo:"eu",ef:{recarga:6,recurso:{t:"cartucho",n:3}}},
        {n:"Ato Final",alvo:"in",ef:{dano:0.8,perfura:1,critSempre:1,revelaRaio:4}}]},

/* ─────────── SUPORTE ─────────── */

mirrha:{n:"Emerson Emo",ep:"a Trilha Sonora",pos:"sup",cls:"Suporte",ref:"Lulu / Janna",
  vida:20,poder:2,arm:2,alc:3,movMax:4,
  ideia:"Transforma coisa ruim em vantagem: quanto mais o time dele apanha, mais forte ele cura.",
  pas:{id:"tristeza",n:"Tristeza",
       d:"Ganha 1 Tristeza quando um aliado sofre dano (máx 5). Cura e escudo dele levam +1 por Tristeza."},
  habs:[{n:"Ombro Amigo",alvo:"al",ef:{escudo:4,cura:5,gastaTristeza:1}},
        {n:"Empresta o Fone",dados:FAIXA_BARATA,alvo:"al",ef:{doar:1,limpa:1}},
        {n:"Ninguém Me Entende",dados:FAIXA_ULT_SUP,alvo:"al",ef:{revive:1,cura:7,escudo:5,
           condAliadosPerto:[{t:"tenacidade",tu:2}]}}]},

torvald:{n:"Torvald",ep:"a Corrente",pos:"sup",cls:"Suporte",ref:"Thresh / Nautilus",
  vida:22,poder:3,arm:3,alc:1,movMax:3,
  ideia:"Colhe alma de quem morre por perto e endurece a partida inteira. Começa frágil, termina muro.",
  pas:{id:"almasNaLanterna",n:"Almas na Lanterna",
       d:"Cada herói que morre a até 3 casas dele dá +1 de Armadura permanente, até +5."},
  habs:[{n:"Ward",alvo:"eu",ef:{ward:1}},
        {n:"Gancho",alvo:"in",ef:{dano:1,puxar:3,alcExtra:2,cond:[{t:"lentidao",tu:1}]}},
        {n:"Cerco",alvo:"eu",ef:{danoVizinhos:1,prendeVizinhos:1,escudoAliados:5}}]},

gorm:{n:"Caramêlo 2.0",ep:"o Cachorro Pilotado",pos:"sup",cls:"Suporte",ref:"Braum / Alistar",
  vida:25,poder:3,arm:4,alc:1,movMax:3,
  ideia:"Corpo na frente. Aliado colado nele custa 2 de dano a menos para o adversário.",
  pas:{id:"guardaCorpo",n:"Guarda-Corpo",
       d:"Aliado colado nele sofre 2 de dano a menos."},
  habs:[{n:"Latido",alvo:"in",alc:1,ef:{dano:1,empurrar:1,cond:[{t:"lentidao",tu:1}]}},
        {n:"Escudo de Pelo",dados:FAIXA_BARATA,alvo:"al",alc:2,ef:{escudo:4,cond:[{t:"tenacidade",tu:2}]}},
        {n:"Latido Caótico",alvo:"eu",ef:{danoVizinhos:1,prendeVizinhos:1,empurraVizinhos:1}}]},

vidra:{n:"Vidra",ep:"a Vidente",pos:"sup",cls:"Suporte",ref:"Karma / Janna",
  vida:18,poder:2,arm:2,alc:3,movMax:4,
  ideia:"A resposta ao invisível. Ela não bate forte: ela diz onde o outro está.",
  pas:{id:"videncia",n:"Vidência",
       d:"No início do turno dela, o inimigo escondido mais próximo (até 4 casas) fica Revelado."},
  habs:[{n:"Presságio",alvo:"eu",ef:{ward:1,revelaRaio:3}},
        {n:"Empréstimo",dados:FAIXA_BARATA,alvo:"al",ef:{doar:1}},
        {n:"Vento Contrário",dados:FAIXA_ULT_SUP,alvo:"al",ef:{escudo:5,empurraDoAlvo:1,cond:[{t:"tenacidade",tu:2}]}}]}
};

/* O catálogo virou UM bloco na v45. Ele era partido em HEROIS_BASE (os 10 que
   moravam no index.html) e HEROIS_NOVOS (os 10 da v0.4) por história, não por
   regra — e a reformulação dos kits tocou os vinte igualmente, então a divisão
   passou a esconder o que interessa: a rota. As duas constantes continuam
   exportadas porque o guia e os testes as pedem pelo nome. */
const HEROIS_NOVOS = {};

/* ═══════════ O CATÁLOGO COMPLETO ═══════════
   É isto que jogo/index.html e guia/index.html consomem. 20 heróis, 4 por rota. */
const HEROIS = Object.assign({}, HEROIS_BASE, HEROIS_NOVOS);

/* Traduz o objeto de efeito do motor para português de manual.
   Existe aqui, e não no guia, porque guia/ e cartas/ precisam do MESMO texto. */
/* Nome curto de uma condição, com ícone — usado no texto de carta e no guia */
function condTxt(c){
  const d=CONDS[c.t]; if(!d)return c.t;
  const q = d.pilha ? (c.st>1?` ×${c.st}`:"")
                    : (c.tu>1?` por ${c.tu} turnos`:"");
  return `${d.ico} <b>${d.n}</b>${q}`;
}
function textoHab(hb){
  const e = hb.ef, p = [];
  /* v46 — o alcance só aparece quando é PRÓPRIO da habilidade. Repetir o alcance
     do herói em toda linha seria ruído: o número já está na ficha dele. O que o
     jogador precisa saber é onde a habilidade DISCORDA do herói. */
  if(hb.alc===1)      p.push("<b>Corpo a corpo</b> — só em quem está colado, e item de alcance não muda isso");
  else if(hb.alc>1)   p.push(`<b>Alcance ${hb.alc}</b> (próprio desta habilidade)`);
  if(e.dano)           p.push(`Dano = <b>Força + Poder − Armadura</b>${e.dano>1?`, <b>${e.dano} vezes</b>`:""}`);
  if(e.danoFixo)       p.push(`Dano fixo de <b>${e.danoFixo}</b>, ignora a Força`);
  if(e.perfura)        p.push("<b>Perfurante</b> — <b>ignora a Armadura</b> do alvo. "
                              +"Em troca, escala mais devagar que uma Ultimate comum");
  if(e.extra)          p.push(`<b>+${e.extra}</b> de dano`);
  if(e.custoVida)      p.push(`<b>Paga ${e.custoVida} da própria vida</b>`);
  if(e.bonusFerido)    p.push(`<b>+${e.bonusFerido}</b> se o alvo já estiver ferido`);
  if(e.bonusCond)      p.push(`<b>+${e.bonusCond.dano}</b> se o alvo estiver ${condTxt({t:e.bonusCond.t})}`);
  if(e.bonusPorRecurso)p.push(`<b>+${e.bonusPorRecurso.dano}</b> por ${RECURSOS[e.bonusPorRecurso.t].ico} `
                              +`<b>${RECURSOS[e.bonusPorRecurso.t].n}</b> acumulada, e <b>gasta tudo</b>`);
  if(e.consome)        p.push(`<b>Consome</b> o ${condTxt({t:e.consome.t})} do alvo: `
                              +`<b>+${e.consome.danoPorStack}</b> de dano por acúmulo`);
  if(e.drena)          p.push("<b>Drena</b> — cura o mesmo tanto que causou de dano");
  if(e.executa)        p.push(`Elimina na hora um alvo com <b>${e.executa}</b> ou menos de vida`);
  if(e.execPorStack)   p.push(`e o limiar sobe <b>+${e.execPorStack.v}</b> por acúmulo de `
                              +`${condTxt({t:e.execPorStack.t})} no alvo`);
  if(e.execSeCond)     p.push(`limiar <b>+${e.execSeCond.v}</b> se o alvo estiver ${condTxt({t:e.execSeCond.t})}`);
  if(e.critSe)         p.push(`<b>CRÍTICO</b> (${COND_NUM.critico}×) ${{
                                isolado:"se o alvo não tiver aliado a 2 casas",
                                eraInvisivel:"se ele atacou estando Invisível",
                                controlado:"contra alvo Preso, Atordoado ou Lento",
                                marcado:"contra alvo Marcado"}[e.critSe]||""}`);
  if(e.critSempre)     p.push(`<b>Sempre CRÍTICO</b> (${COND_NUM.critico}×)`);
  if(e.area)           p.push("Atinge também os vizinhos do alvo");
  if(e.danoVizinhos)   p.push("Atinge <b>todos</b> os inimigos adjacentes");
  if(e.danoRaio)       p.push(`Atinge todos os inimigos a até <b>${e.danoRaio}</b> casas`);
  if(e.escudo)         p.push(`Escudo de <b>Força + ${e.escudo}</b>`);
  if(e.escudoAliados)  p.push(`Escudo de <b>${e.escudoAliados}</b> em cada aliado adjacente`);
  if(e.cura)           p.push(`Cura <b>${e.cura}</b>`);
  if(e.gastaTristeza)  p.push("<b>+1</b> na cura e no escudo por 🖤 <b>Tristeza</b>, e <b>gasta tudo</b>");
  if(e.ouro)           p.push(`<b>+${e.ouro}</b> de ouro`);
  if(e.ouroSeMatar)    p.push(`<b>+${e.ouroSeMatar}</b> de ouro se matar`);
  if(e.recarga)        p.push(`O próximo golpe leva <b>+${e.recarga}</b>`);
  if(e.recurso)        p.push(`Enche ${RECURSOS[e.recurso.t].ico} <b>${RECURSOS[e.recurso.t].n}</b> `
                              +`até <b>${e.recurso.n}</b>`);
  if(e.alcanceTurno)   p.push(`<b>Alcance +${e.alcanceTurno}</b> até o próximo turno dele`);
  if(e.intocavel)      p.push("Fica <b>intocável</b> até o próximo turno");
  if(e.ward)           p.push("<b>Ward</b> — posta um olho aqui: acende 3 de raio por 3 rodadas");
  if(e.revelaRaio)     p.push(`<b>Revela</b> todo inimigo a até <b>${e.revelaRaio}</b> casas — `
                              +"inclusive no mato e sob Invisibilidade");
  if(e.revive)         p.push("Um aliado morto <b>volta 1 rodada antes</b>");
  if(e.copia)          p.push("<b>COPIA</b> — repete contra o alvo a última habilidade inimiga "
                              +"registrada pela Jurisprudência, com o Poder dele. "
                              +"<b>Ultimate inimiga nunca entra</b>; sem registro, vira dano em raio");
  if(e.troca)          p.push("<b>Troca de lugar</b> com o alvo");
  if(e.baneEu)         p.push(`${CONDS.banido.ico} <b>Ele mesmo é Banido</b> por 1 turno: sai do tabuleiro `
                              +"e volta no mesmo lugar no início do próprio turno");
  if(e.recuaLivre)     p.push(`<b>Recua até ${e.recuaLivre} casas</b> de graça, sem gastar movimento`);
  if(e.cond)           p.push("Aplica " + e.cond.map(condTxt).join(" e "));
  if(e.condEu)         p.push("Ele mesmo ganha " + e.condEu.map(condTxt).join(" e "));
  if(e.condVizinhos)   p.push("Aplica em <b>todos</b> os inimigos adjacentes: " + e.condVizinhos.map(condTxt).join(" e "));
  if(e.condRaio)       p.push("Aplica em <b>todos</b> os inimigos no raio: " + e.condRaio.map(condTxt).join(" e "));
  if(e.condAliadosPerto)p.push("Aplica nos aliados adjacentes: " + e.condAliadosPerto.map(condTxt).join(" e "));
  if(e.condSeNaZona)   p.push("Aplica <b>só se o alvo estiver dentro de uma zona dele</b>: "
                              + e.condSeNaZona.map(condTxt).join(" e "));
  if(e.espalha)        p.push(`Se o alvo estiver ${condTxt({t:e.espalha.t})}, `
                              +"<b>espalha</b> para os vizinhos dele");
  if(e.limpa)          p.push(`<b>Limpa ${e.limpa}</b> condição ruim do alvo`);
  if(e.limpaEu)        p.push("<b>Limpa todas</b> as condições ruins dele mesmo");
  if(e.limpaAliados)   p.push(`<b>Limpa ${e.limpaAliados}</b> condição ruim de cada aliado adjacente`);
  if(e.dot)            p.push(`<b>${e.dot.tipo==="veneno"?"Envenena":"Faz sangrar"}</b> o alvo`);
  if(e.zona)           p.push(`<b>Zona</b> — cobre <b>${e.zona.raio||1}</b> de raio pelos `
                              +`<b>2 próximos turnos do adversário</b>: quem começar o turno dentro `
                              +(e.zona.cond ? `recebe ${condTxt(e.zona.cond)}`
                                            : `fica <b>${e.zona.tipo==="veneno"?"Envenenado":"Sangrando"}</b>`));
  if(e.doar)           p.push("<b>Doa este dado</b> para um aliado usar como se fosse dele");
  if(e.puxar)          p.push(`Puxa o alvo <b>${e.puxar}</b> ${e.puxar>1?"casas":"casa"} na sua direção`);
  if(e.empurrar)       p.push(`Empurra o alvo <b>${e.empurrar}</b> casa`);
  if(e.empurraVizinhos)p.push("Empurra <b>todos</b> os inimigos adjacentes 1 casa");
  if(e.empurraDoAlvo)  p.push("Empurra 1 casa <b>todo inimigo colado no aliado</b>");
  if(e.prende)         p.push("<b>Prende</b> o alvo nesta rodada");
  if(e.prendeVizinhos) p.push("<b>Prende</b> todos os inimigos adjacentes");
  if(e.alcExtra)       p.push(`Alcance <b>+${e.alcExtra}</b> nesta habilidade`);
  if(e.semAlcance)     p.push("<b>Sem limite de alcance</b> — atinge qualquer casa do mapa");
  return p.join(" · ") || "—";
}
const TEXTO_PATAMAR =
  "<b>Patamares</b> — a cada <b>20 de ouro</b> na mão, <b>+2 de Poder</b> para sempre. Até 3 vezes.";

/* ═══════════ AS ROTAS: NOME E COR ═══════════
   Quarta lista divergente encontrada na v48, e a última: a cor de cada rota
   morava em `jogo/jogo.js` (POS), no guia (--rota-*) e em `cartas/` — e a de
   `cartas/` era outra (#7E9E6F contra #6E8F6A no Topo, #4F8F86 contra #4F7F7A
   na Selva, e assim por diante). Perto o bastante para ninguém apontar, longe o
   bastante para a mesma rota ter duas cores em duas telas do mesmo site.

   Aqui, uma vez só. Motor, guia e cartas leem daqui. */
const POS_ROTA = {
  topo: {n:"Topo",     cor:"#6E8F6A"},
  selva:{n:"Selva",    cor:"#4F7F7A"},
  meio: {n:"Meio",     cor:"#5D7EA8"},
  adc:  {n:"Atirador", cor:"#8A7CAE"},
  sup:  {n:"Suporte",  cor:"#A87F92"}
};

/* a Força mínima é a personalidade da classe — o guia explica a partir daqui */
/* v49: a personalidade da classe deixou de ser "que Força ela exige" — todo
   mundo exige a mesma coisa agora, 1–2 / 3–5 / 6. O que separa uma classe da
   outra passou a ser O QUE CADA FAIXA COMPRA no kit dela, e onde ela foge do
   padrão (a segunda `barata` 2–5, a `cara` 4–5, a Ultimate de suporte 5–6). */
const CLASSES = [
  ["Tanque",    "faixa padrão, segunda de utilidade", "Consistente. Qualquer dado faz trabalho: no 1–2 ele bate, no 3–5 ele segura, no 6 ele vira o combate."],
  ["Lutador",   "faixa padrão, tudo em dano",         "Compromete-se. O 3–5 é o que entra na briga; o 6 é o que fecha."],
  ["Assassino", "segunda `barata` 2–5",               "Alta variância no lugar certo: a mobilidade sai com quase qualquer dado, e o que mata só com 6."],
  ["Mago",      "segunda `cara` 4–5",                 "Tudo ou nada. O básico sai sempre; o controle forte pede dado grande e a Ultimate pede o 6."],
  ["Atirador",  "faixa padrão, escala com ouro",      "Dano sustentado. Depende menos da faixa e mais de ter farmado."],
  ["Suporte",   "Ultimate 5–6, e doa o próprio dado", "Faz o outro jogar melhor — e a Ultimate dele precisa chegar a tempo, por isso sai com 5 também."]
];

/* ═══════════ ITENS — os 12 originais ═══════════
   Moravam dentro de jogo/jogo.js até a v48. Vieram para cá pelo mesmo motivo
   que os heróis vieram na v0.4: com metade da loja em cada arquivo, o guia
   acabou mantendo uma terceira lista escrita à mão, com preços e efeitos de
   outra versão. Fonte única de verdade, como manda o CLAUDE.md.

   `o` é o preço, em três faixas desde a v48: 12 simples · 18 intermediário ·
   24 forte. `movMax` sobe o TETO de casas por turno do portador, não devolve
   movimento. */
const ITENS_BASE = [
 {id:"eclipse",  n:"Lâmina do Eclipse", o:18, d:"+2 de Poder",                        ef:{poder:2}},
 {id:"cetro",    n:"Cetro Cinéreo",     o:18, d:"+2 de Poder e +1 de Alcance",        ef:{poder:2,alc:1}},
 {id:"basalto",  n:"Coração de Basalto",o:12, d:"+4 de Vida máxima",                  ef:{vida:4}},
 {id:"egide",    n:"Égide do Juramento",o:12, d:"+2 de Armadura",                     ef:{arm:2}},
 {id:"manto",    n:"Manto de Cinzas",   o:12, d:"+1 de Armadura e +2 de Vida",        ef:{arm:1,vida:2}},
 {id:"passos",   n:"Passos do Vento",   o:12, d:"Ágil: a 1ª casa andada é grátis, e +1 de Movimento máximo", ef:{agil:1,movMax:1}},
 {id:"ampulheta",n:"Ampulheta Rachada", o:18, d:"+1 no Dado Mestre e +1 de Movimento máximo", ef:{mov:1,movMax:1}},
 {id:"garra",    n:"Garra do Faminto",  o:18, d:"Cura 2 sempre que causar dano",      ef:{roubo:2}},
 {id:"coroa",    n:"Coroa do Comando",  o:12, d:"Aliados adjacentes ganham +1 de Poder", ef:{aura:1}},
 {id:"selo",     n:"Selo da Ruína",     o:12, d:"RESPOSTA — quem você atinge não é curado por 1 rodada", ef:{antiCura:1}},
 {id:"espinho",  n:"Cota do Espinho",   o:18, d:"RESPOSTA — devolve 2 a quem atacar de perto", ef:{espinho:2}},
 {id:"veu",      n:"Véu Prismático",    o:18, d:"RESPOSTA — anula a próxima Ultimate que te atingir", ef:{veu:1}}
];

/* ═══════════ ITENS — 10 novos (loja passa a 22) ═══════════ */
const ITENS_NOVOS = [
 {id:"presagio",  n:"Presságio de Ferro", o:24, d:"+3 de Armadura e +3 de Vida",        ef:{arm:3,vida:5}},
 {id:"runa",      n:"Runa do Vazio",      o:24, d:"+4 de Poder",                        ef:{poder:4}},
 {id:"lente",     n:"Lente de Âmbar",     o:18, d:"+1 de Alcance e +2 de Poder",     ef:{alc:1,poder:2}},
 {id:"botas",     n:"Botas Rúnicas",      o:18, d:"Ágil, +1 no Dado Mestre e +1 de Movimento máximo", ef:{agil:1,mov:1,movMax:1}},
 {id:"calice",    n:"Cálice Partido",     o:24, d:"Cura 3 ao causar dano; +2 de Vida",  ef:{roubo:5,vida:2}},
 {id:"elmo",      n:"Elmo do Comando",    o:18, d:"Aliados adjacentes +1 Poder; +2 Arm",ef:{aura:1,arm:2}},
 {id:"espectro",  n:"Manto do Espectro",  o:18, d:"Bloqueia uma Ultimate; +1 Armadura", ef:{veu:1,arm:1}},
 {id:"grilhao",   n:"Grilhão de Cinzas",  o:18, d:"Impede cura no alvo; +2 de Poder",   ef:{antiCura:1,poder:2}},
 {id:"couraca",   n:"Couraça de Ossos",   o:24, d:"Devolve 3 de dano; +2 de Vida",      ef:{espinho:5,vida:2}},
 {id:"ampuldour", n:"Ampulheta Dourada",  o:24, d:"+2 no Dado Mestre e +1 de Movimento máximo", ef:{mov:2,movMax:1}}
];

/* ═══════════ DECK DE COMANDO — 30 cartas ═══════════
   Compre 1 no início do seu turno · mão máxima 3 · usadas vão pro cemitério.
   `quando`: "turno" (só no seu) | "reacao" (no turno do adversário)
   Os efeitos abaixo AINDA NÃO estão implementados no motor — ver docs/04-draft-e-deck.md
*/
const DECK = [
 /* DADO — conserta a rolagem ruim */
 {id:"segunda",  n:"Segunda Chance",   fam:"dado",     copias:3, quando:"turno",
  d:"Re-role um dado de ação.",                                  ef:{rerolar:1}},
 {id:"maofirme", n:"Mão Firme",        fam:"dado",     copias:3, quando:"turno",
  d:"Ajuste um dado de ação em ±1.",                             ef:{ajustar:1}},
 {id:"improviso",n:"Improviso",        fam:"dado",     copias:2, quando:"turno",
  d:"Descarte um dado de ação: ganhe o dobro do valor em movimento.", ef:{dadoParaMov:2}},

 /* TEMPO — compra uma jogada a mais */
 {id:"respiro",  n:"Respiro",          fam:"tempo",    copias:2, quando:"turno",
  d:"+2 de movimento nesta rodada.",                             ef:{movExtra:2}},
 {id:"adiantar", n:"Adiantar",         fam:"tempo",    copias:2, quando:"turno",
  d:"Role um dado de ação a mais.",                              ef:{dadoExtra:1}},
 {id:"dobradinha",n:"Dobradinha",      fam:"tempo",    copias:1, quando:"turno",
  d:"Um herói que já agiu pode receber outro dado.",             ef:{reativar:1}},

 /* REAÇÃO — no turno do adversário */
 {id:"recuo",    n:"Recuo",            fam:"reacao",   copias:2, quando:"reacao",
  d:"Escolha uma casa vizinha: seu herói recua 1, de graça.",     ef:{moverReacao:1}},
 {id:"anteparo", n:"Anteparo",         fam:"reacao",   copias:2, quando:"reacao",
  d:"Anule 5 de dano de um golpe.",                              ef:{anularDano:5}},
 {id:"contra",   n:"Contra-emboscada", fam:"reacao",   copias:2, quando:"reacao",
  d:"Revele todos os heróis inimigos escondidos agora.",           ef:{revelarCaca:1}},

 /* MAPA — peça, onda e visão */
 {id:"sinal",    n:"Sinalizador",      fam:"mapa",     copias:2, quando:"turno",
  d:"Posta uma ward: acende 3 de raio por 3 rodadas.",             ef:{ward:1}},
 {id:"convocar", n:"Convocar",         fam:"mapa",     copias:2, quando:"turno",
  d:"Teletransporte um herói seu para a sua base.",              ef:{recall:1}},
 {id:"pressao",  n:"Pressão",          fam:"mapa",     copias:2, quando:"turno",
  d:"Avance a Frente de Onda 1 casa numa rota.",                 ef:{empurrarOnda:1}},

 /* ECONOMIA — ouro e desconto */
 {id:"pilhagem", n:"Pilhagem",         fam:"economia", copias:2, quando:"turno",
  d:"+10 de ouro para um herói.",                                ef:{ouro:10}},
 {id:"barganha", n:"Barganha",         fam:"economia", copias:2, quando:"turno",
  d:"O próximo item custa 8 a menos.",                           ef:{desconto:8}},
 {id:"heranca",  n:"Herança",          fam:"economia", copias:1, quando:"turno",
  d:"Recupere uma carta do cemitério.",                          ef:{doCemiterio:1}},

 /* BUFF — reforço temporário, dura até o início do seu próximo turno.
    Mudou na v16: "até o fim da rodada" dava ao segundo jogador uma janela
    menor que a do primeiro. Ver docs/patch-notes.md. */
 {id:"furia",    n:"Fúria",            fam:"buff",     copias:3, quando:"turno",
  d:"Um herói seu ganha +3 de Poder até o seu próximo turno.",     ef:{buffPoder:3}},
 {id:"muralha",  n:"Pele de Pedra",    fam:"buff",     copias:3, quando:"turno",
  d:"Um herói seu ganha +3 de Armadura até o seu próximo turno.",  ef:{buffArm:3}},
 {id:"talha",    n:"Talha Rúnica",     fam:"buff",     copias:2, quando:"turno",
  d:"Um herói seu ganha 9 de escudo.",                            ef:{buffEscudo:9}},
 {id:"passolev", n:"Passo Leve",       fam:"buff",     copias:2, quando:"turno",
  d:"Um herói seu fica Ágil até o seu próximo turno.",             ef:{buffAgil:1}},

 /* ITEM — equipamento sem passar pela loja */
 {id:"achado",   n:"Achado de Guerra", fam:"item",     copias:3, quando:"turno",
  d:"Um herói na base equipa um item INTERMEDIÁRIO, de graça.", ef:{itemGratis:18}},
 {id:"forja",    n:"Forja de Campo",   fam:"item",     copias:2, quando:"turno",
  d:"Escolha 1 de 3 itens SIMPLES, onde estiver.",                  ef:{itemGratis:12,ondeEstiver:1}},
 {id:"relicario",n:"Relicário",        fam:"item",     copias:1, quando:"turno",
  d:"Um herói ganha um 4º slot de item nesta partida.",            ef:{slotExtra:1}}
];

/* baralho embaralhado, respeitando as cópias */
function montaDeck(){
  const b=[];
  DECK.forEach(c=>{ for(let i=0;i<c.copias;i++) b.push(c.id); });
  for(let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; }
  return b;
}

/* ═══════════ DRAFT ═══════════
   Ordem de escolha por rota, alternando quem começa (ver docs/04-draft-e-deck.md) */
const ORDEM_DRAFT=[
  {rota:"topo", primeiro:0}, {rota:"selva",primeiro:1}, {rota:"meio",primeiro:0},
  {rota:"adc",  primeiro:1}, {rota:"sup",  primeiro:0}
];
const BANS=1;   /* por jogador */

if(typeof module!=="undefined")
  module.exports={HEROIS,HEROIS_BASE,HEROIS_NOVOS,CLASSES,textoHab,faixaHab,textoFaixaHab,condTxt,TEXTO_PATAMAR,
                CONDS,COND_NUM,RECURSOS,POS_ROTA,FAIXA_SLOT,ITENS_BASE,ITENS_NOVOS,DECK,montaDeck,ORDEM_DRAFT,BANS};
