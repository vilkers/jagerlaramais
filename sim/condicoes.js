/* AS CONDIÇÕES E OS RECURSOS APARECEM NA MESA?

   A v45 deu doze condições, vinte passivas e seis recursos de personagem ao jogo.
   "Está implementado" e "acontece numa partida" são coisas diferentes, e a
   diferença é o que este script mede: ele dirige a IA DE VERDADE nos dois lados,
   sorteando os vinte heróis, e olha o tabuleiro ao fim de cada turno.

   PARA QUE SERVE, na prática:

     · condição que aparece em 0% das partidas é código morto — ou o custo está
       alto demais, ou a IA não sabe usá-la (§29), ou o herói nunca chega perto de
       ninguém. Nos três casos é defeito, e nos três a resposta é diferente;
     · condição que cobre o tabuleiro inteiro virou clima. Individualidade demais
       é sopa: se todo mundo está sempre lento, ninguém é "o que deixa lento";
     · recurso cujo PICO nunca chega ao teto do registro tem teto decorativo — e
       aí ou o teto desce, ou a mecânica que o enche precisa ser mais barata.

   Passiva que nunca dispara é texto na carta, mas ATENÇÃO: a do Torvald depende de
   alguém morrer perto e a do Arden depende de tomar golpe. As duas podem passar
   uma partida calada e ainda assim estar certas. É a ORDEM DE GRANDEZA que
   interessa, nunca o número exato.

   Ele NÃO mede equilíbrio (isso é sim/bateria.js com times=espelho) nem se a
   mecânica é divertida (isso é playtest). Mede presença.

     node sim/condicoes.js            → 120 partidas
     node sim/condicoes.js 400        → 400
     node sim/condicoes.js 120 facil  → com a IA no nível Aprendiz              */

const { carrega } = require("./motor.js");

const n = parseInt(process.argv[2], 10) || 120;
const nivel = process.argv[3] || "dificil";

const g = carrega();
g.simMode = true;
if (!g.NIVEIS_IA[nivel]) {
  console.error(`nível inválido. Existem: ${Object.keys(g.NIVEIS_IA).join(", ")}`);
  process.exit(1);
}

/* ---------- os contadores ----------
   POR OBSERVAÇÃO, e não por espionagem. A primeira versão trocava `aplicaCond`
   por um invólucro que contava — e não funcionou: no harness de Node o motor roda
   dentro de um `vm` próprio, e substituir a função na PONTE não muda quem as
   funções internas chamam. Os contadores davam zero em tudo, que é exatamente o
   tipo de medição que mente com convicção.

   Aqui a conta é feita OLHANDO O TABULEIRO ao fim de cada turno: quantos heróis
   carregam cada condição, quanto cada recurso acumulou. É mais honesto para a
   pergunta que este script faz — "isto aparece na mesa?" —, porque mede o que o
   jogador veria, não o que o motor chamou. */
const turnosCom = {}, partidasCom = {}, picoDe = {}, recPico = {};
const vistoNaPartida = new Set();
let turnosObservados = 0;

function observa() {
  turnosObservados++;
  const agora = {};
  g.todos().forEach(h => {
    if (h.morto) return;
    (h.conds || []).forEach(c => {
      agora[c.t] = (agora[c.t] || 0) + 1;
      picoDe[c.t] = Math.max(picoDe[c.t] || 0, c.st || c.tu || 1);
    });
    Object.entries(h.rec || {}).forEach(([t, q]) => {
      if (!q) return;
      recPico[t] = Math.max(recPico[t] || 0, q);
      vistoNaPartida.add("r:" + t);
    });
    if (h.autos) vistoNaPartida.add("r:autos");
  });
  Object.entries(agora).forEach(([t, q]) => {
    turnosCom[t] = (turnosCom[t] || 0) + q;
    vistoNaPartida.add("c:" + t);
  });
}

/* O turno da IA, síncrono — a mesma ordem de decisão de `iaExecutaTurno`.
   Copiado de sim/niveis.js de propósito: aquele script mede quem ganha, este mede
   o que acontece, e cada um sobrevive à edição do outro. */
function turnoIA(lado) {
  g.nivelIA = nivel;
  const piso = g.NIVEIS_IA[nivel].minimo;
  g.iaCompra(lado);
  g.iaJogaCartas(lado);

  let guarda = 0;
  while (guarda++ < 45 && g.J.fim === null && g.J.vez === lado) {
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
  observa();
  if (g.J.fim === null) g.encerraTurno();
}

/* sorteia dez dos vinte, um por rota de cada lado — as condições precisam de
   PORTADORES variados, e medir sempre o mesmo confronto mediria o confronto */
const ROTAS = ["topo", "selva", "meio", "adc", "sup"];
function sorteiaTimes() {
  const t0 = [], t1 = [];
  ROTAS.forEach(r => {
    const pool = Object.keys(g.CATALOGO).filter(id => g.CATALOGO[id].pos === r);
    const emb = pool.slice().sort(() => Math.random() - 0.5);
    t0.push(emb[0]); t1.push(emb[1] || emb[0]);
  });
  return [t0, t1];
}

let rodadasTotais = 0, terminadas = 0;
const inicio = Date.now();
for (let p = 0; p < n; p++) {
  vistoNaPartida.clear();
  g.TIMES = sorteiaTimes();
  g.comeca(false, false);
  let passos = 0;
  while (passos++ < 400 && g.J.fim === null && g.J.fase === "jogando") turnoIA(g.J.vez);
  rodadasTotais += g.J.rodada;
  if (g.J.fim !== null) terminadas++;
  vistoNaPartida.forEach(x => { partidasCom[x] = (partidasCom[x] || 0) + 1; });
}
const seg = ((Date.now() - inicio) / 1000).toFixed(1);

/* ---------- relatório ---------- */
const por = x => (x / n).toFixed(1);
const pct = x => ((x / n) * 100).toFixed(0) + "%";
const w = (s, k) => String(s).padEnd(k).slice(0, k);

console.log(`\n  JAGERLARAMAIS · condições e recursos na mesa · IA ${g.NIVEIS_IA[nivel].n}`);
console.log(`  ${n} partidas em ${seg}s · duração média ${(rodadasTotais / n).toFixed(1)} rodadas`
          + ` · ${terminadas} terminaram · ${turnosObservados} turnos observados\n`);

console.log("  CONDIÇÃO              heróis-turno   partidas em    pico");
console.log("                        por partida    que apareceu   visto");
Object.keys(g.CONDS).sort((a, b) => (turnosCom[b] || 0) - (turnosCom[a] || 0)).forEach(t => {
  const q = turnosCom[t] || 0;
  console.log(`  ${w(g.CONDS[t].ico + " " + g.CONDS[t].n, 22)}${w(por(q), 15)}`
            + `${w(pct(partidasCom["c:" + t] || 0), 15)}${picoDe[t] || 0}`
            + (q === 0 ? "   ← NUNCA APARECEU" : ""));
});

console.log("\n  RECURSO DE PERSONAGEM     partidas em que apareceu   pico visto");
Object.keys(g.RECURSOS).forEach(t => {
  console.log(`  ${w(g.RECURSOS[t].ico + " " + g.RECURSOS[t].n, 26)}`
            + `${w(pct(partidasCom["r:" + t] || 0), 26)}${recPico[t] || 0}/${g.RECURSOS[t].max}`
            + ((partidasCom["r:" + t] || 0) === 0 ? "   ← NUNCA APARECEU" : ""));
});
console.log(`  ${w("⚖ Autos do Juiz", 26)}${pct(partidasCom["r:autos"] || 0)}`);

console.log("\n  Leitura: \"heróis-turno por partida\" é a soma de heróis carregando a");
console.log("  condição, contada ao fim de cada turno. Zero é código morto — ou o custo");
console.log("  está alto, ou a IA não sabe usar (§29), ou o herói nunca encosta em");
console.log("  ninguém. Alto demais e a condição deixou de ser assinatura: virou clima.");
console.log("  PICO diz se o teto do registro é alcançado na prática, ou se é enfeite.\n");
