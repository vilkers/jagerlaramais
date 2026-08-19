/* Medição dedicada ao DESLOCAMENTO — quantas casas um herói realmente atravessa
   num turno, e o que um teto por herói cortaria.

   Existe por causa do relato: *"no final da partida alguns heróis acumulam
   movimento suficiente para atravessar uma parcela enorme do mapa numa jogada
   só"*. A pergunta de desenho não é "qual o movimento médio" — é **onde está a
   cauda**, porque é a cauda que apaga posicionamento, rota e emboscada.

   COMO MEDE, e por que assim: `h.andou` é zerado no início do turno do dono
   (`expiraDoTime`) e soma casa a casa em `moveAte`. Ler de fora só vale no
   instante entre "o turno acabou" e "encerraTurno" — que é exatamente onde o
   gancho `aoFimDeTurno` do agente entra. Instrumentar o motor por dentro não
   funciona neste harness (ver §3.5 do HANDOFF), e mediria zero com convicção.

   O AGENTE NÃO É UM JOGADOR. Ele move ao acaso e quase nunca empilha o bolso do
   time num herói só, então a média dele é PISO, não retrato. Por isso o script
   também imprime o TETO ESTRUTURAL: quanto o motor deixaria um herói andar se
   alguém quisesse — que é o número que o relato descreve.

     node sim/movimento.js            → 200 partidas
     node sim/movimento.js 400        → 400                                    */

const { carrega } = require("./motor.js");
const { jogaUma, resume } = require("./agente.js");

const n = parseInt(process.argv[2], 10) || 200;
const ctx = carrega();

const andadas = [];           /* uma entrada por herói-turno em que ele andou */
const porRodada = new Map();  /* rodada → maior caminhada vista naquela rodada */
const tetos = [];             /* teto estrutural por turno: o bolso inteiro num herói */

const t0 = Date.now();
let partidas = 0;
for (let i = 0; i < n; i++) {
  const res = jogaUma(ctx, {
    aoFimDeTurno: (g, t) => {
      g.J.times[t].herois.forEach(h => {
        if (h.morto) return;
        if (h.andou > 0) {
          andadas.push(h.andou);
          const r = g.J.rodada;
          porRodada.set(r, Math.max(porRodada.get(r) || 0, h.andou));
        }
      });
    }
  });
  if (res.terminou) partidas++;
}

/* ---------- teto estrutural: o que o motor PERMITE ----------
   Uma partida a mais, olhando o bolso do time no início de cada turno: Dado
   Mestre + todos os dados de ação convertidos. É o teto que um jogador que
   queira empilhar tudo num herói alcança hoje. */
const g2 = carrega();
g2.simMode = true;
g2.comeca(false, false);
for (let passo = 0; passo < 400 && g2.J.fim === null && g2.J.rodada <= 30; passo++) {
  if (g2.J.fase !== "jogando") break;
  const bolso = g2.J.mov.rest + g2.J.dados.filter(d => !d.usado).reduce((a, d) => a + d.v, 0);
  tetos.push({ rodada: g2.J.rodada, bolso });
  g2.limpaModo(); g2.selHeroi = null; g2.encerraTurno();
}

const r = resume(andadas);
const faixa = v => andadas.filter(x => x >= v).length / andadas.length * 100;

console.log(`\n  JAGERLARAMAIS · deslocamento · ${partidas}/${n} partidas`
          + `  em ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
console.log(`  CAMINHADA POR HERÓI-TURNO (agente quase-aleatório — isto é PISO)`);
console.log(`    amostras ${r.n}  ·  mediana ${r.mediana}  ·  média ${r.media}  ·  máximo ${r.max}`);
[3, 4, 5, 6, 7, 8].forEach(v =>
  console.log(`    andou ${v} ou mais: ${faixa(v).toFixed(1)}%`));

const tardias = [...porRodada.entries()].filter(([r]) => r >= 15).map(([, v]) => v);
const cedo = [...porRodada.entries()].filter(([r]) => r < 15).map(([, v]) => v);
if (cedo.length && tardias.length) {
  console.log(`\n  A CAUDA CRESCE COM A PARTIDA (maior caminhada vista na rodada)`);
  console.log(`    até a rodada 14   mediana ${resume(cedo).mediana}  máximo ${resume(cedo).max}`);
  console.log(`    da rodada 15 em diante  mediana ${resume(tardias).mediana}`
            + `  máximo ${resume(tardias).max}`);
}

const bolsoTardio = tetos.filter(x => x.rodada >= 15).map(x => x.bolso);
const bolsoCedo = tetos.filter(x => x.rodada < 15).map(x => x.bolso);
console.log(`\n  TETO ESTRUTURAL — o bolso do time inteiro gasto num herói só`);
if (bolsoCedo.length) console.log(`    rodadas 1–14   mediana ${resume(bolsoCedo).mediana}`
                                + `  máximo ${resume(bolsoCedo).max}`);
if (bolsoTardio.length) console.log(`    rodada 15+     mediana ${resume(bolsoTardio).mediana}`
                                  + `  máximo ${resume(bolsoTardio).max}`);
console.log(`    (referência: base a base são 15 casas; o vão entre as duas torres`);
console.log(`     exteriores de uma rota são 6)\n`);
