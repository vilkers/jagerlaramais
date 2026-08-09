/* ═══════════════════════════════════════════════════════════════════
   JAGERLARAMAIS — expansão de conteúdo
   10 heróis novos (pool fecha em 20, QUATRO por rota) · 10 itens · deck de 46

   O pool foi cortado de 45 para 20 em v0.4: quatro heróis por rota, cada um
   com um arquétipo distinto, TODOS com arte. Pool grande sem arte só fazia
   o draft demorar. Ver docs/patch-notes.md.

   Efeitos de herói e item usam SOMENTE o vocabulário que o motor já executa
   (ver jogo/index.html → usaHab e bonus).
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════ OS 10 ORIGINAIS ═══════════
   Moraram dentro de jogo/index.html até a v0.4. Vieram para cá porque o guia
   mantinha uma segunda lista, com números de outra versão — dois catálogos,
   uma verdade só. Agora jogo e guia leem daqui. */
const HEROIS_BASE = {

vharn:{n:"Vharn",ep:"o Muro de Ferro",pos:"topo",cls:"Tanque",ref:"Ornn / Sion",
  vida:14,poder:2,arm:3,alc:1,
  habs:[{n:"Golpe de Escudo",f:1,alvo:"in",ef:{dano:1}},
        {n:"Provocar",f:3,alvo:"in",ef:{dano:1,puxar:1,prende:1}},
        {n:"Muralha",f:6,alvo:"eu",ef:{escudo:6,prendeVizinhos:1}}]},

kaross:{n:"Kaross",ep:"o Carrasco",pos:"topo",cls:"Lutador",ref:"Darius",
  vida:12,poder:3,arm:2,alc:1,
  habs:[{n:"Talho",f:1,alvo:"in",ef:{dano:1,bonusFerido:3}},
        {n:"Puxada",f:3,alvo:"in",ef:{dano:1,puxar:1}},
        {n:"Execução",f:5,alvo:"in",ef:{dano:1,executa:5}}]},

nyx:{n:"Nyx",ep:"a Presa Silenciosa",pos:"selva",cls:"Assassino",ref:"Kha'Zix / Rengar",
  vida:9,poder:4,arm:1,alc:1,agil:1,
  habs:[{n:"Bote",f:1,alvo:"in",ef:{dano:1,extra:2}},
        {n:"Sombra",f:3,alvo:"eu",ef:{intocavel:1}},
        {n:"Caçada",f:5,alvo:"in",ef:{dano:2}}]},

grumo:{n:"Grumo",ep:"o Devorador",pos:"selva",cls:"Tanque",ref:"Sejuani / Zac",
  vida:13,poder:2,arm:3,alc:1,
  habs:[{n:"Investida",f:1,alvo:"in",ef:{dano:1,empurrar:1}},
        {n:"Digerir",f:2,alvo:"eu",ef:{cura:4,ouro:3}},
        {n:"Avalanche",f:5,alvo:"eu",ef:{danoVizinhos:1,prendeVizinhos:1}}]},

solenne:{n:"Solenne",ep:"a Voz do Arcano",pos:"meio",cls:"Mago",ref:"Lux / Syndra",
  vida:9,poder:3,arm:1,alc:3,
  habs:[{n:"Feixe",f:1,alvo:"in",ef:{dano:1}},
        {n:"Prisma",f:4,alvo:"in",ef:{dano:1,area:1}},
        {n:"Julgamento",f:6,alvo:"in",ef:{danoFixo:11}}]},

zhet:{n:"Zhet",ep:"a Lâmina de Três Sombras",pos:"meio",cls:"Assassino",ref:"Zed / Talon",
  vida:9,poder:4,arm:1,alc:1,agil:1,
  habs:[{n:"Estocada",f:1,alvo:"in",ef:{dano:1}},
        {n:"Eco",f:2,alvo:"in",ef:{marca:4}},
        {n:"Trio de Sombras",f:5,alvo:"in",ef:{dano:1,area:1}}]},

vesper:{n:"Vesper",ep:"a Pontaria Final",pos:"adc",cls:"Atirador",ref:"Jinx / Kog'Maw",
  vida:9,poder:3,arm:1,alc:3,patamar:1,
  habs:[{n:"Tiro",f:1,alvo:"in",ef:{dano:1}},
        {n:"Recarregar",f:2,alvo:"eu",ef:{recarga:4}},
        {n:"Chuva de Ferro",f:5,alvo:"eu",ef:{danoRaio:3}}]},

cael:{n:"Cael",ep:"o Cobrador",pos:"adc",cls:"Atirador",ref:"Caitlyn / Draven",
  vida:9,poder:3,arm:1,alc:3,
  habs:[{n:"Cobrança",f:1,alvo:"in",ef:{dano:1,ouroSeMatar:2}},
        {n:"Armadilha",f:2,alvo:"in",ef:{dano:1,extra:2}},
        {n:"Sentença",f:5,alvo:"in",ef:{danoFixo:9,semAlcance:1}}]},

mirrha:{n:"Mirrha",ep:"a Guardiã de Ecos",pos:"sup",cls:"Suporte",ref:"Lulu / Janna",
  vida:11,poder:1,arm:2,alc:2,
  habs:[{n:"Sopro",f:1,alvo:"al",ef:{escudo:2}},
        {n:"Doar Dado",f:1,alvo:"al",ef:{doar:1}},
        {n:"Eco",f:4,alvo:"al",ef:{revive:1}}]},

torvald:{n:"Torvald",ep:"a Corrente",pos:"sup",cls:"Suporte",ref:"Thresh / Nautilus",
  vida:12,poder:2,arm:3,alc:1,
  habs:[{n:"Ward",f:1,alvo:"eu",ef:{ward:1}},
        {n:"Gancho",f:3,alvo:"in",ef:{dano:1,puxar:3,alcExtra:2}},
        {n:"Cerco",f:5,alvo:"eu",ef:{danoVizinhos:1,prendeVizinhos:1}}]}
};

const HEROIS_NOVOS = {

/* ─────────── TOPO · A Ilha · 4 arquétipos ─────────── */
/* vharn = tanque de controle · kaross = executor */

ilva:{n:"Ilva",ep:"a Portadora",pos:"topo",cls:"Mago",ref:"Gwen / Mordekaiser",
  vida:11,poder:4,arm:2,alc:2,
  habs:[{n:"Chama Espectral",f:1,alvo:"in",ef:{dano:1}},
        {n:"Véu de Névoa",f:3,alvo:"eu",ef:{escudo:3}},
        {n:"Ceifa",f:5,alvo:"in",ef:{dano:1,area:1}}]},

xhera:{n:"Xhera",ep:"a Insaciável",pos:"topo",cls:"Lutador",ref:"Aatrox / Riven",
  vida:12,poder:4,arm:2,alc:1,
  habs:[{n:"Lâmina Sedenta",f:1,alvo:"in",ef:{dano:1,cura:2}},
        {n:"Investir",f:3,alvo:"in",ef:{dano:1,puxar:1}},
        {n:"Sede Final",f:5,alvo:"in",ef:{dano:1,cura:5,bonusFerido:3}}]},

/* ─────────── SELVA · O Caçador · 4 arquétipos ─────────── */
/* nyx = assassino · grumo = tanque que farma  (ambos em jogo/index.html) */

kurr:{n:"Kurr",ep:"o Rastreador",pos:"selva",cls:"Assassino",ref:"Nidalee / Elise",
  vida:10,poder:4,arm:1,alc:2,agil:1,
  habs:[{n:"Lança Farpada",f:1,alvo:"in",ef:{dano:1}},
        {n:"Rastro",f:2,alvo:"in",ef:{marca:4}},
        {n:"Salto Mortal",f:5,alvo:"in",ef:{dano:1,extra:4}}]},

pyk:{n:"Pyk",ep:"o Coveiro",pos:"selva",cls:"Assassino",ref:"Pyke",
  vida:10,poder:4,arm:2,alc:2,agil:1,
  habs:[{n:"Arpão",f:1,alvo:"in",ef:{dano:1}},
        {n:"Puxada Funda",f:3,alvo:"in",ef:{dano:1,puxar:3,alcExtra:2}},
        {n:"Cova",f:5,alvo:"in",ef:{dano:1,executa:7,ouroSeMatar:3}}]},

/* ─────────── MEIO · O Relógio · 4 arquétipos ─────────── */
/* solenne = artilharia · zhet = assassino  (ambos em jogo/index.html) */

nira:{n:"Nira",ep:"a Tecelã",pos:"meio",cls:"Mago",ref:"Orianna / Anivia",
  vida:10,poder:3,arm:1,alc:3,
  habs:[{n:"Fio de Luz",f:1,alvo:"in",ef:{dano:1}},
        {n:"Emaranhar",f:3,alvo:"in",ef:{dano:1,prende:1}},
        {n:"Tapeçaria",f:5,alvo:"in",ef:{dano:1,area:1}}]},

arden:{n:"Arden",ep:"o Juiz",pos:"meio",cls:"Mago",ref:"Swain / Cassiopeia",
  vida:12,poder:3,arm:2,alc:2,
  habs:[{n:"Sentença",f:1,alvo:"in",ef:{dano:1}},
        {n:"Drenar",f:2,alvo:"in",ef:{dano:1,cura:3}},
        {n:"Tribunal",f:5,alvo:"eu",ef:{danoRaio:3}}]},

/* ─────────── ATIRADOR · O Investimento · 4 arquétipos ─────────── */
/* vesper = sustentado · cael = armadilheiro  (ambos em jogo/index.html) */

nessa:{n:"Nessa",ep:"a Rápida",pos:"adc",cls:"Atirador",ref:"Vayne / Kai'Sa",
  vida:8,poder:3,arm:1,alc:3,patamar:1,agil:1,
  habs:[{n:"Virote",f:1,alvo:"in",ef:{dano:1}},
        {n:"Reposicionar",f:2,alvo:"eu",ef:{escudo:2}},
        {n:"Perfurar",f:5,alvo:"in",ef:{dano:1,executa:5}}]},

corvo:{n:"Corvo",ep:"o Marcador",pos:"adc",cls:"Atirador",ref:"Jhin / Senna",
  vida:9,poder:4,arm:1,alc:4,patamar:1,
  habs:[{n:"Tiro Marcado",f:1,alvo:"in",ef:{dano:1,marca:3}},
        {n:"Recarregar",f:2,alvo:"eu",ef:{recarga:4}},
        {n:"Ato Final",f:5,alvo:"in",ef:{danoFixo:10,semAlcance:1}}]},

/* ─────────── SUPORTE · A Memória · 4 arquétipos ─────────── */
/* mirrha = curandeira · torvald = gancho com visão  (ambos em jogo/index.html) */

gorm:{n:"Gorm",ep:"o Portão",pos:"sup",cls:"Suporte",ref:"Braum / Alistar",
  vida:14,poder:2,arm:4,alc:1,
  habs:[{n:"Empurrão",f:1,alvo:"in",ef:{dano:1,empurrar:1}},
        {n:"Anteparo",f:1,alvo:"al",ef:{escudo:4}},
        {n:"Barreira",f:5,alvo:"eu",ef:{danoVizinhos:1,prendeVizinhos:1}}]},

vidra:{n:"Vidra",ep:"a Vidente",pos:"sup",cls:"Suporte",ref:"Karma / Janna",
  vida:10,poder:2,arm:2,alc:3,
  habs:[{n:"Presságio",f:1,alvo:"eu",ef:{ward:1}},
        {n:"Empréstimo",f:1,alvo:"al",ef:{doar:1}},
        {n:"Vento Contrário",f:4,alvo:"al",ef:{escudo:5,revive:1}}]}
};

/* ═══════════ O CATÁLOGO COMPLETO ═══════════
   É isto que jogo/index.html e guia/index.html consomem. 20 heróis, 4 por rota. */
const HEROIS = Object.assign({}, HEROIS_BASE, HEROIS_NOVOS);

/* Traduz o objeto de efeito do motor para português de manual.
   Existe aqui, e não no guia, porque guia/ e cartas/ precisam do MESMO texto. */
function textoHab(hb){
  const e = hb.ef, p = [];
  if(e.dano)           p.push(`Dano = <b>Força + Poder − Armadura</b>${e.dano>1?`, <b>${e.dano} vezes</b>`:""}`);
  if(e.danoFixo)       p.push(`Dano fixo de <b>${e.danoFixo}</b>, ignora a Força`);
  if(e.extra)          p.push(`<b>+${e.extra}</b> de dano`);
  if(e.bonusFerido)    p.push(`<b>+${e.bonusFerido}</b> se o alvo já estiver ferido`);
  if(e.executa)        p.push(`Elimina na hora um alvo com <b>${e.executa}</b> ou menos de vida`);
  if(e.area)           p.push("Atinge também os vizinhos do alvo");
  if(e.danoVizinhos)   p.push("Atinge <b>todos</b> os inimigos adjacentes");
  if(e.danoRaio)       p.push(`Atinge todos os inimigos a até <b>${e.danoRaio}</b> casas`);
  if(e.escudo)         p.push(`Escudo de <b>Força + ${e.escudo}</b>`);
  if(e.cura)           p.push(`Cura <b>${e.cura}</b>`);
  if(e.ouro)           p.push(`<b>+${e.ouro}</b> de ouro`);
  if(e.ouroSeMatar)    p.push(`<b>+${e.ouroSeMatar}</b> de ouro se matar`);
  if(e.recarga)        p.push(`O próximo golpe leva <b>+${e.recarga}</b>`);
  if(e.intocavel)      p.push("Fica <b>intocável</b> até o próximo turno");
  if(e.ward)           p.push("<b>Ward</b> — revela a carta do Caçador inimigo antes dela virar");
  if(e.revive)         p.push("Um aliado morto <b>volta 1 rodada antes</b>");
  if(e.marca)          p.push(`<b>Marca</b> o alvo: o próximo dano nele leva +${e.marca}`);
  if(e.doar)           p.push("<b>Doa este dado</b> para um aliado usar como se fosse dele");
  if(e.puxar)          p.push(`Puxa o alvo <b>${e.puxar}</b> ${e.puxar>1?"casas":"casa"} na sua direção`);
  if(e.empurrar)       p.push(`Empurra o alvo <b>${e.empurrar}</b> casa`);
  if(e.prende)         p.push("<b>Prende</b> o alvo nesta rodada");
  if(e.prendeVizinhos) p.push("<b>Prende</b> todos os inimigos adjacentes");
  if(e.alcExtra)       p.push(`Alcance <b>+${e.alcExtra}</b> nesta habilidade`);
  if(e.semAlcance)     p.push("<b>Sem limite de alcance</b> — atinge qualquer casa do mapa");
  return p.join(" · ") || "—";
}
const TEXTO_PATAMAR =
  "<b>Patamares</b> — a cada <b>10 de ouro</b> acumulado, <b>+2 de Poder</b> para sempre. Até 3 vezes.";

/* a Força mínima é a personalidade da classe — o guia explica a partir daqui */
const CLASSES = [
  ["Tanque",    "Força 1+ no essencial",        "Consistente. Qualquer dado faz o trabalho — só a ultimate pede 5 ou 6."],
  ["Lutador",   "Força 3+ e 5+",                "Compromete-se. Precisa de dado médio para entrar e alto para fechar."],
  ["Assassino", "Força 5+ no que mata",         "Alta variância. Com dado alto, mata alguém. Com dado baixo, se esconde."],
  ["Mago",      "Força 1+ e 5+ ou 6",           "Tudo ou nada. O básico sai sempre; a ultimate só com dado alto."],
  ["Atirador",  "Força 1+, escala com ouro",    "Dano sustentado. Não depende do dado — depende de ter farmado."],
  ["Suporte",   "Força 1+, e doa o próprio dado","Faz o outro jogar melhor. Nunca fica sem nada para fazer."]
];

/* ═══════════ ITENS — 10 novos (loja passa a 22) ═══════════ */
const ITENS_NOVOS = [
 {id:"presagio",  n:"Presságio de Ferro", o:8, d:"+3 de Armadura e +3 de Vida",        ef:{arm:3,vida:3}},
 {id:"runa",      n:"Runa do Vazio",      o:8, d:"+4 de Poder",                        ef:{poder:4}},
 {id:"lente",     n:"Lente de Âmbar",     o:7, d:"+2 de Alcance",                      ef:{alc:2}},
 {id:"botas",     n:"Botas Rúnicas",      o:6, d:"Ágil e +1 no Dado Mestre",           ef:{agil:1,mov:1}},
 {id:"calice",    n:"Cálice Partido",     o:8, d:"Cura 3 ao causar dano; +2 de Vida",  ef:{roubo:3,vida:2}},
 {id:"elmo",      n:"Elmo do Comando",    o:7, d:"Aliados adjacentes +1 Poder; +2 Arm",ef:{aura:1,arm:2}},
 {id:"espectro",  n:"Manto do Espectro",  o:7, d:"Bloqueia uma Ultimate; +1 Armadura", ef:{veu:1,arm:1}},
 {id:"grilhao",   n:"Grilhão de Cinzas",  o:7, d:"Impede cura no alvo; +2 de Poder",   ef:{antiCura:1,poder:2}},
 {id:"couraca",   n:"Couraça de Ossos",   o:8, d:"Devolve 3 de dano; +2 de Vida",      ef:{espinho:3,vida:2}},
 {id:"ampuldour", n:"Ampulheta Dourada",  o:9, d:"+2 no Dado Mestre, toda rodada",     ef:{mov:2}}
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
  d:"Mova um herói seu 1 casa.",                                 ef:{moverReacao:1}},
 {id:"anteparo", n:"Anteparo",         fam:"reacao",   copias:2, quando:"reacao",
  d:"Anule 3 de dano de um golpe.",                              ef:{anularDano:3}},
 {id:"contra",   n:"Contra-emboscada", fam:"reacao",   copias:2, quando:"reacao",
  d:"Revele a carta do Caçador inimigo agora.",                  ef:{revelarCaca:1}},

 /* MAPA — peça, onda e visão */
 {id:"sinal",    n:"Sinalizador",      fam:"mapa",     copias:2, quando:"turno",
  d:"Ward: revela o Caçador inimigo na próxima revelação.",       ef:{ward:1}},
 {id:"convocar", n:"Convocar",         fam:"mapa",     copias:2, quando:"turno",
  d:"Teletransporte um herói seu para a sua base.",              ef:{recall:1}},
 {id:"pressao",  n:"Pressão",          fam:"mapa",     copias:2, quando:"turno",
  d:"Avance a Frente de Onda 1 casa numa rota.",                 ef:{empurrarOnda:1}},

 /* ECONOMIA — ouro e desconto */
 {id:"pilhagem", n:"Pilhagem",         fam:"economia", copias:2, quando:"turno",
  d:"+4 de ouro para um herói.",                                 ef:{ouro:4}},
 {id:"barganha", n:"Barganha",         fam:"economia", copias:2, quando:"turno",
  d:"O próximo item custa 3 a menos.",                           ef:{desconto:3}},
 {id:"heranca",  n:"Herança",          fam:"economia", copias:1, quando:"turno",
  d:"Recupere uma carta do cemitério.",                          ef:{doCemiterio:1}},

 /* BUFF — reforço temporário, dura até o fim da rodada */
 {id:"furia",    n:"Fúria",            fam:"buff",     copias:3, quando:"turno",
  d:"Um herói seu ganha +3 de Poder até o fim da rodada.",        ef:{buffPoder:3}},
 {id:"muralha",  n:"Pele de Pedra",    fam:"buff",     copias:3, quando:"turno",
  d:"Um herói seu ganha +3 de Armadura até o fim da rodada.",     ef:{buffArm:3}},
 {id:"talha",    n:"Talha Rúnica",     fam:"buff",     copias:2, quando:"turno",
  d:"Um herói seu ganha 5 de escudo.",                            ef:{buffEscudo:5}},
 {id:"passolev", n:"Passo Leve",       fam:"buff",     copias:2, quando:"turno",
  d:"Um herói seu fica Ágil até o fim da rodada.",                ef:{buffAgil:1}},

 /* ITEM — equipamento sem passar pela loja */
 {id:"achado",   n:"Achado de Guerra", fam:"item",     copias:3, quando:"turno",
  d:"Um herói na base equipa um item de até 6 de ouro, de graça.", ef:{itemGratis:6}},
 {id:"forja",    n:"Forja de Campo",   fam:"item",     copias:2, quando:"turno",
  d:"Um herói equipa um item de até 5 de ouro onde estiver.",      ef:{itemGratis:5,ondeEstiver:1}},
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
  module.exports={HEROIS,HEROIS_BASE,HEROIS_NOVOS,CLASSES,textoHab,TEXTO_PATAMAR,ITENS_NOVOS,DECK,montaDeck,ORDEM_DRAFT,BANS};
