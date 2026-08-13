/* Os três níveis da IA jogam UM CONTRA O OUTRO.

   Existe porque "coloquei três dificuldades" é promessa até virar número. As
   outras medições deste projeto usam o agente da bateria, que joga quase ao
   acaso e NÃO é a IA do jogo — elas medem estrutura, e são cegas justamente
   para o que um nível de dificuldade muda: a qualidade da decisão.

   Este script dirige a IA DE VERDADE nos dois lados, cada um no seu nível, e
   pergunta a única coisa que importa: o Mestre ganha do Aprendiz? Se não ganhar,
   os níveis são rótulo.

   COMO ELE DIFERE DE `iaExecutaTurno`: aquele é `async` — tem pausa, fala e
   pintura entre os passos, e num harness sem navegador ele trava no primeiro
   `await` (ver o cabeçalho de sim/motor.js). Aqui o mesmo laço roda síncrono,
   na mesma ordem: gasta ouro, joga carta, age enquanto houver jogada acima do
   piso, senão move, senão converte dado em movimento, e por fim planta ward.

   O que este script NÃO mede: o quanto cada nível é DIVERTIDO. Vitória não é
   diversão — uma IA difícil que ganha sendo chata continua ruim. Isso é playtest.

     node sim/niveis.js                    → 300 partidas, Mestre × Aprendiz
     node sim/niveis.js 600                → 600
     node sim/niveis.js 400 dificil normal → o par que quiser                */

const { carrega } = require("./motor.js");

const args = process.argv.slice(2);
const n = parseInt(args[0], 10) || 300;
const nivelA = args[1] || "dificil";
const nivelB = args[2] || "facil";

const g = carrega();
g.simMode = true;

/* afinação sem editar o jogo: `facil.minimo=25 dificil.erro=0` etc. Serve para
   varrer os botões dos níveis antes de escolher um valor — que é como o resto
   deste projeto escolhe número. */
args.slice(3).forEach(a => {
  const [alvo, val] = a.split("=");
  const [nivel, campo] = (alvo || "").split(".");
  if (!g.NIVEIS_IA[nivel] || campo === undefined || val === undefined) {
    console.error(`ajuste inválido: "${a}" (use nivel.campo=valor)`); process.exit(1);
  }
  g.NIVEIS_IA[nivel][campo] = +val;
});
if (!g.NIVEIS_IA[nivelA] || !g.NIVEIS_IA[nivelB]) {
  console.error(`nível inválido. Existem: ${Object.keys(g.NIVEIS_IA).join(", ")}`);
  process.exit(1);
}

/* O turno da IA, síncrono — a mesma ordem de decisão de `iaExecutaTurno`. */
function turnoIA(lado, nivel) {
  g.nivelIA = nivel;
  const piso = g.NIVEIS_IA[nivel].minimo;
  g.iaCompra(lado);
  g.iaJogaCartas(lado);

  let guard = 0;
  while (guard++ < 45 && g.J.fim === null && g.J.vez === lado) {
    if (g.iaMelhorJogada(lado, piso)) continue;

    let moveu = false;
    for (const h of g.vivos(lado)) {
      const dest = g.iaDestino(h, lado);
      if (!dest || !dest.p) continue;
      g.limpaModo(); g.selHeroi = h; g.modo = "mover"; g.calcula();
      const d0 = g.dist(...h.pos, ...dest.p);
      const passo = g.mover
        .filter(p => g.dist(...p, ...dest.p) < d0)
        .sort((a, b) => g.dist(...a, ...dest.p) - g.dist(...b, ...dest.p))[0];
      if (passo) { g.moveAte(...passo); moveu = true; break; }
    }
    if (moveu) continue;
    if (g.iaPlanejaAlcance(lado)) continue;
    break;
  }
  g.iaPlantaWards(lado);
  if (g.J.fim === null) g.encerraTurno();
}

/* ---------- as partidas ---------- */
const t0 = Date.now();
let vitA = 0, vitB = 0, semFim = 0, rodadas = [];
/* o lado de cada nível ALTERNA a cada partida: sem isso o resultado misturaria
   "o Mestre é melhor" com "quem começa ganha mais", que este projeto já sabe
   valer uns 3 pontos. */
for (let i = 0; i < n; i++) {
  const ladoA = i % 2;                       // nivelA joga de AZUL nas pares
  g.comeca(false, false);
  let passos = 0;
  while (passos++ < 400 && g.J.fim === null && g.J.fase === "jogando") {
    turnoIA(g.J.vez, g.J.vez === ladoA ? nivelA : nivelB);
  }
  if (g.J.fim === null) { semFim++; continue; }
  rodadas.push(g.J.rodada);
  if (g.J.fim === ladoA) vitA++; else vitB++;
}

/* ---------- relatório ---------- */
const total = vitA + vitB;
const pct = x => (x / total * 100).toFixed(1) + "%";
const med = rodadas.slice().sort((a, b) => a - b)[Math.floor(rodadas.length / 2)];
const z = total ? (vitA - total / 2) / Math.sqrt(total * 0.25) : 0;

const A = g.NIVEIS_IA[nivelA], B = g.NIVEIS_IA[nivelB];
console.log(`\n  JAGERLARAMAIS · níveis da IA · ${A.n} × ${B.n}`);
console.log(`  ${total}/${n} partidas em ${((Date.now() - t0) / 1000).toFixed(1)}s`
          + (semFim ? `  (${semFim} sem fim)` : "") + `  ·  duração mediana ${med} rodadas\n`);
console.log(`    ${A.n.padEnd(10)} ${String(vitA).padStart(4)}  ${pct(vitA)}`);
console.log(`    ${B.n.padEnd(10)} ${String(vitB).padStart(4)}  ${pct(vitB)}`);
console.log(`    z = ${z.toFixed(2)}\n`);

if (Math.abs(z) < 2)
  console.log(`  → EMPATE dentro do ruído. ${A.n} e ${B.n} jogam igual —`
            + `\n    a diferença entre eles é rótulo, não comportamento.\n`);
else if (z > 0)
  console.log(`  → ${A.n} ganha de ${B.n}, e a diferença é real.\n`);
else
  console.log(`  → ${B.n} ganha de ${A.n} — os níveis estão INVERTIDOS.\n`);
