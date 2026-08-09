/* ═══════════════════════════════════════════════════════════════
   Índice de arte do Jagerlaramais — geradas via Magnific.

   Os caminhos são relativos ao HTML que carrega este arquivo
   (jogo/, guia/ e cartas/ estão todos um nível abaixo da raiz).

   herois/web/ e cartas/ são as versões leves usadas em tela.
   herois/ e itens/ (raiz) guardam o original em alta.
   ═══════════════════════════════════════════════════════════════ */

const ARTE = {};

["vharn","kaross","ilva","xhera",
 "nyx","grumo","kurr","pyk",
 "solenne","zhet","nira","arden",
 "vesper","cael","nessa","corvo",
 "mirrha","torvald","gorm","vidra"
].forEach(id => ARTE[id] = `../arte/herois/web/${id}.jpg`);

["eclipse","cetro","basalto","egide","manto","passos",
 "ampulheta","garra","coroa","selo","espinho","veu"
].forEach(id => ARTE[id] = `../arte/itens/web/${id}.jpg`);

/* cartas do Deck de Comando — chave = id da carta em data/catalogo.js */
const ARTE_CARTA = {};
["segunda","maofirme","improviso",
 "respiro","adiantar","dobradinha",
 "recuo","anteparo","contra",
 "sinal","convocar","pressao",
 "pilhagem","barganha","heranca",
 "furia","muralha","talha","passolev",
 "achado","forja","relicario"
].forEach(id => ARTE_CARTA[id] = `../arte/cartas/${id}.jpg`);

const ARTE_MAPA = "../arte/mapa/mapa.jpg";

const ARTE_MONSTRO = {
  barao:  "../arte/monstros/barao.jpg",
  dragao: "../arte/monstros/dragao.jpg",
  arauto: "../arte/monstros/arauto.jpg"
};
