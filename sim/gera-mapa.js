/* GERA data/mapa.js — a planta do tabuleiro, derivada do MOTOR.

   Existe por causa de um defeito que o CLAUDE.md prevê em letras maiúsculas:
   o guia desenhava um mapa PRÓPRIO, escrito à mão, de **7 por 7**, com quatro
   acampamentos e dois covis separados. O tabuleiro de verdade é **11 por 11**,
   tem três acampamentos, UM poço que troca de morador e seis casas bloqueadas.
   Quem lia o manual aprendia uma planta que não existe.

   A solução não é copiar a geometria para o guia — seria o terceiro catálogo
   divergente. É DERIVAR do motor e gravar num arquivo que o guia lê, do mesmo
   jeito que ele já lê heróis, itens e condições de `data/catalogo.js`.

     node sim/gera-mapa.js        → reescreve data/mapa.js

   O teste `a planta publicada bate com a do motor` (em sim/testes.js) falha se
   alguém mexer no mapa e esquecer de rodar isto.                              */

const fs = require("fs");
const path = require("path");
const { carrega, RAIZ } = require("./motor.js");

function planta() {
  const g = carrega();
  g.simMode = true;
  g.novo();

  const k = (c, r) => c + "," + r;
  const casas = [];
  for (let r = 0; r < g.LINS; r++) for (let c = 0; c < g.COLS; c++) {
    if (!g.noTab(c, r)) continue;
    /* a MESMA classificação de `desenhaMapa`, na mesma ordem — base, poço,
       mato, rota, e o que sobra é rio */
    const base = [0, 1].find(t => g.BASE[t].some(([bc, br]) => bc === c && br === r));
    let t;
    if (base !== undefined) t = "base" + base;
    else if (g.POCO[0] === c && g.POCO[1] === r) t = "poco";
    else if (g.ehMato(c, r)) t = "selva";
    else if (g.LANE.has(k(c, r))) t = "rota";
    else t = "rio";
    casas.push([c, r, t, g.ehBloqueado(c, r) ? 1 : 0]);
  }

  return {
    cols: g.COLS,
    lins: g.LINS,
    casas,
    rotas: Object.fromEntries(Object.entries(g.ROTAS).map(([n, l]) => [n, l.map(p => [...p])])),
    torres: g.J.torres.map(t => ({ rota: t.rota, i: t.i, t: t.t, pos: [...g.ROTAS[t.rota][t.i]] })),
    bases: [g.BASE[0].map(p => [...p]), g.BASE[1].map(p => [...p])],
    poco: [...g.POCO],
    /* O acampamento NEUTRO é SORTEADO entre duas posições a cada partida — pinar
       a que calhou nesta seria publicar uma planta que muda sozinha, e o teste
       de regressão falharia dia sim, dia não. Publicamos os dois lugares
       possíveis, que é o que a regra de fato diz. */
    camps: g.J.camps.filter(c => c.t !== -1)
             .map(c => ({ id: c.id, t: c.t, pos: [...c.pos], ouro: c.ouro })),
    neutro: { ouro: (g.J.camps.find(c => c.t === -1) || {}).ouro,
              lados: g.CAMP_NEUTRO_LADOS.map(p => [...p]) },
    vidaTorre: g.VIDA_TORRE,
    vidaNexus: g.VIDA_NEXUS
  };
}

function escreve() {
  const p = planta();
  const linha = a => JSON.stringify(a);
  const txt = `/* PLANTA DO TABULEIRO — GERADO POR sim/gera-mapa.js. NÃO EDITE À MÃO.

   Derivado do motor (jogo/jogo.js) para que o guia desenhe o mapa que existe,
   e não uma cópia escrita à mão que envelhece sozinha. Para atualizar:

       node sim/gera-mapa.js

   \`casas\` é [coluna, linha, terreno, bloqueada]. O terreno usa exatamente a
   classificação de \`desenhaMapa\`: base0, base1, poco, selva, rota, rio. */
const MAPA = {
  cols: ${p.cols}, lins: ${p.lins},
  vidaTorre: ${p.vidaTorre}, vidaNexus: ${p.vidaNexus},
  poco: ${linha(p.poco)},
  bases: ${linha(p.bases)},
  casas: [
${p.casas.map(c => "    " + linha(c)).join(",\n")}
  ],
  rotas: {
${Object.entries(p.rotas).map(([n, l]) => `    ${n}: ${linha(l)}`).join(",\n")}
  },
  torres: [
${p.torres.map(t => "    " + JSON.stringify(t)).join(",\n")}
  ],
  camps: [
${p.camps.map(c => "    " + JSON.stringify(c)).join(",\n")}
  ],
  neutro: ${JSON.stringify(p.neutro)}
};
if (typeof module !== "undefined") module.exports = { MAPA };
`;
  fs.writeFileSync(path.join(RAIZ, "data/mapa.js"), txt);
  console.log(`  data/mapa.js — ${p.casas.length} casas, ${p.cols}x${p.lins}, `
            + `${p.torres.length} torres, ${p.camps.length} acampamentos, `
            + `${p.casas.filter(c => c[3]).length} bloqueadas`);
}

module.exports = { planta };
if (require.main === module) escreve();
