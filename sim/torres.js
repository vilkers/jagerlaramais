/* A TORRE VOLTOU A SER OBJETIVO, OU VIROU ESPONJA?

   Nasceu do relato: *"está muito fácil derrubar torres"* — e da regra que o
   pedido pôs junto: creep presente, o herói pressiona; sem creep, a torre pune.
   §49 é a régua deste script: a resistência da torre tem de vir de **vida +
   creep + risco + dano variável**, e não de obrigar vinte golpes.

   O que mede, e por quê:

     · QUANDO A PRIMEIRA TORRE CAI, e como ela caiu (onda ou herói). Se caírem
       todas pela onda, o herói não tem papel no objetivo; se caírem todas por
       herói, a onda virou enfeite;
     · GOLPES DE HERÓI POR TORRE e o dano médio de cada golpe. É o número que
       responde "ficou fácil demais?" e "virou esponja?" ao mesmo tempo;
     · MERGULHO SEM CREEP — quantas vezes um herói termina o turno dentro da
       zona de uma torre inimiga sem a Frente de Onda apoiando. Zero significa
       que a regra nova nunca acontece na mesa e é texto morto; alto demais
       significa que a IA não aprendeu a recuar (§51).

   Dirige a **IA de verdade** nos dois lados, sorteando os vinte heróis — é a
   mesma máquina de `sim/condicoes.js`, e pelo mesmo motivo: o agente
   quase-aleatório não mergulha, não cerca e não recua, então ele mediria um
   jogo que ninguém joga.

     node sim/torres.js            → 120 partidas
     node sim/torres.js 300        → 300
     node sim/torres.js 120 facil  → com a IA no nível Aprendiz                */

const { carrega } = require("./motor.js");
const { resume } = require("./agente.js");

const n = parseInt(process.argv[2], 10) || 120;
const nivel = process.argv[3] || "dificil";

/* variantes, para escolher número com dado na mão em vez de opinião:
     node sim/torres.js 120 dificil arm=5 torre=18 onda=6 */
const opc = {};
process.argv.slice(4).forEach(a => { const [k, v] = a.split("="); opc[k] = v; });
const trocas = [];
if (opc.arm)   trocas.push([/const ARM_ESTRUTURA=\d+/, `const ARM_ESTRUTURA=${+opc.arm}`]);
if (opc.torre) trocas.push([/const VIDA_TORRE=\d+/, `const VIDA_TORRE=${+opc.torre}`]);
if (opc.onda)  trocas.push([/const ONDA_GOLPE=\d+/, `const ONDA_GOLPE=${+opc.onda}`]);
if (opc.tiro)  trocas.push([/const TIRO_TORRE=\d+/, `const TIRO_TORRE=${+opc.tiro}`]);
/* nexus=off → como era antes da v49: as três rotas cobram do Nexus na mesma
   virada, e ele podia ir de 3 a 0 (ou a −2) sem ninguém jogar no meio */
if (opc.nexus === "off")
  trocas.push([/if\(nexusNoInicio\[lado\]>=2&&J\.nexus\[lado\]<=1\) return;/, ""]);

const g = carrega(trocas);
g.simMode = true;
if (!g.NIVEIS_IA[nivel]) {
  console.error(`nível inválido. Existem: ${Object.keys(g.NIVEIS_IA).join(", ")}`);
  process.exit(1);
}

const primeiraTorre = [], golpesPorTorre = [], danoPorGolpe = [], duracoes = [];
let mergulhos = 0, partidasComMergulho = 0, tirosPossiveis = 0;
let torresPorHeroi = 0, torresPorOnda = 0, torresCaidas = 0;

/* estado observado de fora, torre a torre */
let vidaAnterior = new Map(), golpesNesta = new Map(), houveMergulho = false;

function chave(tr) { return tr.rota + ":" + tr.t + ":" + tr.i; }

/* olha as torres ANTES e DEPOIS de uma ação de herói para separar o golpe de
   herói do dano da onda: a onda só cobra na virada da rodada, e a virada é a
   única hora em que várias torres perdem vida de uma vez */
function fotografa() {
  const m = new Map();
  g.J.torres.forEach(tr => m.set(chave(tr), tr.vida));
  return m;
}
function contabiliza(antes, porHeroi) {
  g.J.torres.forEach(tr => {
    const k = chave(tr), v0 = antes.get(k);
    if (v0 === undefined || tr.vida >= v0) return;
    if (porHeroi) {
      danoPorGolpe.push(v0 - tr.vida);
      golpesNesta.set(k, (golpesNesta.get(k) || 0) + 1);
    }
    if (v0 > 0 && tr.vida <= 0) {
      torresCaidas++;
      if (porHeroi) torresPorHeroi++; else torresPorOnda++;
      golpesPorTorre.push(golpesNesta.get(k) || 0);
      if (primeiraTorre.length === 0 || primeiraTorre[primeiraTorre.length - 1].p !== partida)
        primeiraTorre.push({ p: partida, r: g.J.rodada });
    }
  });
}

function turnoIA(lado) {
  g.nivelIA = nivel;
  const piso = g.NIVEIS_IA[nivel].minimo;
  g.iaCompra(lado);
  g.iaJogaCartas(lado);

  let guarda = 0;
  while (guarda++ < 45 && g.J.fim === null && g.J.vez === lado) {
    const antes = fotografa();
    const agiu = g.iaMelhorJogada(lado, piso);
    contabiliza(antes, true);
    if (agiu) continue;
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
  g.iaRecuaDeTorre(lado);
  g.iaPlantaWards(lado);

  /* O MERGULHO SEM CREEP, medido exatamente onde a regra cobra: com o turno
     feito e antes de `encerraTurno`. `torreQueAmeaca` é a mesma função que o
     motor usa para disparar — se ela devolve torre, a torre vai atirar. */
  g.vivos(lado).forEach(h => {
    if (g.torreQueAmeaca(h)) { mergulhos++; houveMergulho = true; }
  });
  tirosPossiveis++;

  if (g.J.fim === null) {
    const antes = fotografa();
    g.encerraTurno();
    contabiliza(antes, false);          /* o que caiu na virada foi a onda */
  }
}

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

let partida = 0, terminadas = 0;
const inicio = Date.now();
for (partida = 0; partida < n; partida++) {
  golpesNesta = new Map(); houveMergulho = false;
  g.TIMES = sorteiaTimes();
  g.comeca(false, false);
  let passos = 0;
  while (passos++ < 400 && g.J.fim === null && g.J.fase === "jogando") turnoIA(g.J.vez);
  duracoes.push(g.J.rodada);
  if (g.J.fim !== null) terminadas++;
  if (houveMergulho) partidasComMergulho++;
}
const seg = ((Date.now() - inicio) / 1000).toFixed(1);
const med = v => (v.length ? resume(v).mediana : "—");
const mediaDe = v => (v.length ? resume(v).media : "—");

const rotulo = Object.keys(opc).length ? "  [" + Object.entries(opc).map(([k, v]) => k + "=" + v).join(" ") + "]" : "";
console.log(`\n  JAGERLARAMAIS · a torre como objetivo · IA ${g.NIVEIS_IA[nivel].n}${rotulo}`);
console.log(`  ${n} partidas em ${seg}s · ${terminadas} terminaram`
          + ` · duração mediana ${med(duracoes)} rodadas\n`);
console.log(`  A TORRE  (vida ${g.VIDA_TORRE} · armadura ${g.ARM_ESTRUTURA}`
          + ` · onda ${g.ONDA_GOLPE} por degrau)`);
console.log(`    torres caídas por partida        ${(torresCaidas / n).toFixed(1)}/12`);
console.log(`    caíram pela ONDA                 ${torresCaidas ? (torresPorOnda / torresCaidas * 100).toFixed(0) : "—"}%`);
console.log(`    caíram por GOLPE DE HERÓI        ${torresCaidas ? (torresPorHeroi / torresCaidas * 100).toFixed(0) : "—"}%`);
console.log(`    primeira torre cai na rodada     mediana ${med(primeiraTorre.map(x => x.r))}`);
console.log(`\n  O GOLPE DE HERÓI`);
console.log(`    golpes de herói por torre caída  média ${mediaDe(golpesPorTorre)}`);
console.log(`    dano por golpe                   média ${mediaDe(danoPorGolpe)}`
          + `  (mín ${danoPorGolpe.length ? resume(danoPorGolpe).min : "—"}`
          + ` · máx ${danoPorGolpe.length ? resume(danoPorGolpe).max : "—"})`);
console.log(`\n  MERGULHO SEM CREEP  (a torre atira)`);
console.log(`    heróis punidos por partida       ${(mergulhos / n).toFixed(1)}`);
console.log(`    partidas com pelo menos um       ${(partidasComMergulho / n * 100).toFixed(0)}%`);
console.log(`\n  Leitura: zero mergulho significa que a regra nova nunca acontece na mesa.`);
console.log(`  Muito mergulho com a IA no nível difícil significa que ela não aprendeu a`);
console.log(`  recuar (§51). E "golpes por torre" é a régua de §49: a torre precisa ser`);
console.log(`  objetivo que exige comprometimento, não esponja de HP.\n`);
