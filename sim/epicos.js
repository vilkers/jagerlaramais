/* Medição dedicada ao poço épico — Dragão e Barão.

   Existe porque "o objetivo cria dilema?" é uma pergunta que a bateria geral
   responde mal: ela reporta só quantos épicos saíram, e isso não distingue
   "ninguém quis" de "ninguém conseguiu" de "apareceu tarde demais".

   As quatro perguntas que este script responde, uma coluna cada:

     APARECE   em que rodada o morador desce ao poço, e quantas partidas chegam
               a vê-lo (uma partida que acaba na rodada 7 nunca viu o Barão);
     ATACADO   quantos golpes ele leva por partida, e em quantas partidas leva
               pelo menos um — é a medida de INTERESSE;
     MORTO     em quantas partidas alguém fecha — é a medida de VIABILIDADE;
     VITÓRIA   taxa de vitória de quem levou — é a medida de RECOMPENSA.

   A leitura que interessa é o par ATACADO × MORTO. Muito atacado e pouco morto
   = caro demais. Pouco atacado = ou é irrelevante, ou aparece na hora errada.

     node sim/epicos.js            → 800 partidas
     node sim/epicos.js 2000       → 2000
     node sim/epicos.js 800 barao=6  → e daí em diante, as mesmas variantes da
                                       bateria (barao=N, vbarao=N, furia=N…)

   O agente é o mesmo da bateria: joga quase ao acaso. Ele mede ESTRUTURA
   (quando aparece, se dá para matar), e é cego para AGÊNCIA (se um humano
   largaria a torre para disputar). Ver o cabeçalho de sim/bateria.js.          */

const { carrega } = require("./motor.js");
const { jogaUma, resume } = require("./agente.js");

const args = process.argv.slice(2);
const n = parseInt(args[0], 10) || 800;
const opcoes = Object.fromEntries(args.slice(1).map(a => {
  const p = a.split("=");
  if (p.length !== 2) { console.error(`argumento inválido: "${a}"`); process.exit(1); }
  return p;
}));

const trocas = [];
if (opcoes.dragao)  trocas.push([/const R_DRAGAO=\d+/, `const R_DRAGAO=${+opcoes.dragao}`]);
if (opcoes.barao)   trocas.push([/R_BARAO=\d+/, `R_BARAO=${+opcoes.barao}`]);
if (opcoes.vdragao) trocas.push([/n:"Dragão", vida:\d+/, `n:"Dragão", vida:${+opcoes.vdragao}`]);
if (opcoes.vbarao)  trocas.push([/n:"Barão",  vida:\d+/, `n:"Barão",  vida:${+opcoes.vbarao}`]);
if (opcoes.escudobarao !== undefined)
  trocas.push([/const BARAO_ESCUDO=\d+/, `const BARAO_ESCUDO=${+opcoes.escudobarao}`]);
if (opcoes.heranca !== undefined)
  trocas.push([/const DRAGAO_PODER=\d+/, `const DRAGAO_PODER=${+opcoes.heranca}`]);
if (opcoes.duracao) trocas.push([/const BARAO_RODADAS=\d+/, `const BARAO_RODADAS=${+opcoes.duracao}`]);

const rotulo = Object.keys(opcoes).length
  ? Object.entries(opcoes).map(([k, v]) => `${k}=${v}`).join(" ") : "build atual";

/* ---------- leitura do log ----------
   O log é a única fonte que já registra tudo o que interessa, na ordem certa.
   Ele é `unshift`ado (mais novo primeiro), então lê-se ao contrário para o
   contador de rodada andar para frente. */
function extrai(g) {
  const linhas = g.J.log.map(l => l.txt).reverse();
  const r = {
    dragao: { apareceu: null, golpes: 0, mortes: 0, dono: null },
    barao:  { apareceu: null, golpes: 0, mortes: 0, dono: null }
  };
  let rodada = 1;
  for (const t of linhas) {
    const mr = /^— rodada (\d+)/.exec(t);
    if (mr) { rodada = +mr[1]; continue; }

    if (/^Dragão desceu ao poço/.test(t) && r.dragao.apareceu === null) r.dragao.apareceu = rodada;
    if (/^Barão desceu ao poço/.test(t)  && r.barao.apareceu  === null) r.barao.apareceu  = rodada;

    if (/golpeia o Dragão/.test(t)) r.dragao.golpes++;
    if (/golpeia o Barão/.test(t))  r.barao.golpes++;

    const md = /^(AZUL|CARMIM) levou o Dragão/.exec(t);
    if (md) { r.dragao.mortes++; r.dragao.dono = md[1] === "AZUL" ? 0 : 1; }
    const mb = /^(AZUL|CARMIM) levou o Barão/.exec(t);
    if (mb) { r.barao.mortes++; r.barao.dono = mb[1] === "AZUL" ? 0 : 1; }
  }
  return r;
}

const ctx = carrega(trocas);
const t0 = Date.now();
const partidas = [];
let naoTerminou = 0;

for (let i = 0; i < n; i++) {
  const res = jogaUma(ctx);
  if (!res.terminou) { naoTerminou++; continue; }
  partidas.push({ ...extrai(ctx), rodadas: res.rodadas, vencedor: res.vencedor });
}

/* ---------- relatório ---------- */
const pct = (a, b) => b ? (a / b * 100).toFixed(1) + "%" : "—";
const N = partidas.length;

console.log(`\n  JAGERLARAMAIS · poço épico · ${rotulo}`);
console.log(`  ${N}/${n} partidas concluídas em ${((Date.now() - t0) / 1000).toFixed(1)}s`
          + (naoTerminou ? `  (${naoTerminou} sem fim)` : ""));
console.log(`  duração mediana: ${resume(partidas.map(p => p.rodadas)).mediana} rodadas\n`);

for (const id of ["dragao", "barao"]) {
  const nome = id === "dragao" ? "DRAGÃO" : "BARÃO";
  const vistos = partidas.filter(p => p[id].apareceu !== null);
  const atacados = vistos.filter(p => p[id].golpes > 0);
  const mortos = partidas.filter(p => p[id].mortes > 0);
  const donos = mortos.filter(p => p[id].dono !== null);
  const ganhou = donos.filter(p => p[id].dono === p.vencedor).length;
  const apar = resume(vistos.map(p => p[id].apareceu));

  console.log(`  ${nome}`);
  console.log(`    aparece    em ${pct(vistos.length, N)} das partidas`
            + (apar ? ` · rodada mediana ${apar.mediana} (${apar.min}–${apar.max})` : ""));
  console.log(`    atacado    em ${pct(atacados.length, vistos.length)} das partidas em que apareceu`
            + ` · ${(vistos.reduce((a, p) => a + p[id].golpes, 0) / (vistos.length || 1)).toFixed(1)} golpes por partida`);
  console.log(`    morto      em ${pct(mortos.length, vistos.length)} das partidas em que apareceu`
            + ` · ${(partidas.reduce((a, p) => a + p[id].mortes, 0) / N).toFixed(2)} por partida`);
  console.log(`    vitória    ${pct(ganhou, donos.length)} de quem levou`
            + (donos.length < 30 ? `  ⚠ amostra pequena (${donos.length})` : ` (n=${donos.length})`));

  /* diagnóstico em uma linha, para não precisar interpretar a tabela */
  const taxaAtaque = vistos.length ? atacados.length / vistos.length : 0;
  const taxaMorte = vistos.length ? mortos.length / vistos.length : 0;
  let veredito;
  if (!vistos.length) veredito = "nunca chega a aparecer — a partida acaba antes";
  else if (taxaAtaque < 0.25) veredito = "quase ninguém tenta — irrelevante ou aparece na hora errada";
  else if (taxaMorte < 0.25) veredito = "muito tentado e pouco fechado — CARO DEMAIS";
  else if (taxaMorte > 0.8) veredito = "quase sempre cai — barato demais para ser objetivo";
  else veredito = "disputado e fechável — é objetivo de verdade";
  console.log(`    → ${veredito}\n`);
}
