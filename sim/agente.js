/* Um jogador artificial simples e o laço de partida.

   Ele NÃO joga bem: escolhe herói e habilidade quase ao acaso. Serve para medir
   ritmo, travamento e assimetria estrutural — não para dizer se um herói é forte.
   Para isso é playtest humano.

   O que ele faz de proposital:
   - prefere agir a mover (3 em 4), senão o jogo nunca termina
   - só olha heróis que ainda não agiram, respeitando o limite de um dado por herói
   - bate em torre sempre que a torre estiver disponível, para exercitar o caminho novo
   - encerra o turno quando não sobra ação nem movimento útil                        */

function jogaUma(ctx, opc = {}) {
  const tetoPassos = opc.tetoPassos || 40000;
  const rnd = n => Math.floor(Math.random() * n);
  const g = ctx;

  g.comeca(false, false);
  if (opc.aoIniciar) opc.aoIniciar(g);

  let passos = 0, golpesTorre = 0, acoes = 0;

  while (passos++ < tetoPassos && g.J.fim === null) {
    if (g.J.fase !== "jogando") break;

    const vivos = g.J.times[g.J.vez].herois.filter(h => !h.morto);
    const podemAgir = vivos.filter(h => !h.agiu && h.habs.some(x => g.dadoPara(x) !== null));
    let fez = false;

    if (podemAgir.length && rnd(4)) {
      const h = podemAgir[rnd(podemAgir.length)];
      g.limpaModo(); g.selHeroi = h;
      const i = rnd(h.habs.length);
      if (g.dadoPara(h.habs[i]) !== null) {
        g.iniciaHab(i);
        if (g.modo === "mirar") {
          if (g.alvosTorre.length) { g.atacaTorre(g.alvosTorre[0]); golpesTorre++; fez = true; }
          else if (g.alvos.length) { g.confirmaHab(g.alvos[rnd(g.alvos.length)]); fez = true; }
          else g.limpaModo();
        }
      }
      if (fez) acoes++;
    }

    if (!fez && g.J.mov.rest > 0 && vivos.length) {
      const podem = vivos.filter(h => !h.preso);
      if (podem.length) {
        const h = podem[rnd(podem.length)];
        g.limpaModo(); g.selHeroi = h; g.modo = "mover"; g.calcula();
        if (g.mover.length) { g.moveAte(...g.mover[rnd(g.mover.length)]); fez = true; }
      }
    }

    if (!fez) { g.limpaModo(); g.selHeroi = null; g.encerraTurno(); }
  }

  return {
    terminou: g.J.fim !== null,
    vencedor: g.J.fim,
    rodadas: g.J.rodada,
    passos,
    golpesTorre,
    acoes,
    torresCaidas: g.J.torres.filter(t => t.vida <= 0).length,
    nexus: [...g.J.nexus]
  };
}

/* estatística mínima, para não repetir isso em todo script */
function resume(valores) {
  if (!valores.length) return null;
  const v = [...valores].sort((a, b) => a - b);
  const soma = v.reduce((a, b) => a + b, 0);
  return {
    n: v.length,
    min: v[0],
    max: v[v.length - 1],
    mediana: v[v.length >> 1],
    media: +(soma / v.length).toFixed(1)
  };
}

/* proporção de vitórias do primeiro jogador, com o z de um teste binomial
   contra 50%. |z| < 2 é ruído: não dá para afirmar vantagem. */
function assimetria(vitoriasA, vitoriasB) {
  const n = vitoriasA + vitoriasB;
  if (!n) return null;
  const p = vitoriasA / n;
  const z = (vitoriasA - n / 2) / Math.sqrt(n * 0.25);
  return { n, primeiro: vitoriasA, segundo: vitoriasB,
           taxa: (p * 100).toFixed(1) + "%", z: +z.toFixed(2),
           significativo: Math.abs(z) >= 2 };
}

module.exports = { jogaUma, resume, assimetria };
