/* Separa duas coisas que a bateria confundia.

   Em partida sem draft, TIMES é fixo: o time 0 sempre leva Vharn/Nyx/Solenne/
   Vesper/Mirrha e o time 1 sempre leva Kaross/Grumo/Zhet/Cael/Torvald. Então
   "quem começa ganha 60%" pode ser vantagem de ORDEM ou vantagem de ELENCO —
   os dois estão grudados na mesma medição.

   Aqui roda metade das partidas com os elencos trocados. Se a vitória seguir a
   posição, é ordem. Se seguir o elenco, é composição.

   Uso: node sim/ordem-vs-time.js [n]                                            */

const { carrega } = require("./motor");
const { jogaUma, assimetria } = require("./agente");

const n = parseInt(process.argv[2], 10) || 2000;
const g = carrega();
const ORIGINAL = g.TIMES.map(t => [...t]);
const TROCADO = [ORIGINAL[1], ORIGINAL[0]];

function roda(times, quantas) {
  g.TIMES = times.map(t => [...t]);
  let venceuPrimeiro = 0, venceuSegundo = 0, rodadas = [];
  for (let i = 0; i < quantas; i++) {
    const r = jogaUma(g);
    if (!r.terminou) continue;
    r.vencedor === 0 ? venceuPrimeiro++ : venceuSegundo++;
    rodadas.push(r.rodadas);
  }
  return { venceuPrimeiro, venceuSegundo };
}

const metade = Math.floor(n / 2);
const A = roda(ORIGINAL, metade);   // elenco A começa
const B = roda(TROCADO, metade);    // elenco B começa

/* vitórias de quem jogou primeiro, somando as duas metades: aqui o elenco
   está balanceado entre as posições, então o que sobra é só a ordem */
const ordem = assimetria(A.venceuPrimeiro + B.venceuPrimeiro,
                         A.venceuSegundo + B.venceuSegundo);

/* vitórias do elenco A, independente de posição: aqui a ordem está balanceada,
   o que sobra é só a composição */
const elenco = assimetria(A.venceuPrimeiro + B.venceuSegundo,
                          A.venceuSegundo + B.venceuPrimeiro);

const linha = (rot, r) =>
  `  ${rot.padEnd(26)} ${r.taxa.padStart(6)}  (${r.primeiro}×${r.segundo}, z=${String(r.z).padStart(6)})  `
  + (r.significativo ? "← REAL" : "— ruído");

console.log(`\n  ${metade * 2} partidas, elencos trocados na metade\n`);
console.log(linha("vantagem de ORDEM", ordem));
console.log(linha("vantagem de ELENCO (A)", elenco));
console.log(`\n  elenco A: ${ORIGINAL[0].join(", ")}`);
console.log(`  elenco B: ${ORIGINAL[1].join(", ")}\n`);
