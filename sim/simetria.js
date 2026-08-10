/* Teste de simetria do tabuleiro.

   O mapa é 1v1: tudo que o time 0 tem, o time 1 tem que ter na posição girada
   em 180°. Se não tiver, um lado anda menos, chega antes ou bate de mais longe —
   e nenhuma medição de balanceamento depois disso significa coisa alguma.

   A ARMADILHA QUE ESTE TESTE EXISTE PARA PEGAR: espelhar com
   (COLS-1-c, LINS-1-r) parece rotação e não é, numa grade offset odd-r. As linhas
   ímpares são deslocadas meio hexágono, então a fórmula quebra a vizinhança
   justamente nelas. A rotação certa passa por coordenada cúbica: converte,
   faz 2*centro - p, converte de volta.

   A geometria do jogo.js é toda `const` de escopo de script, que não vira
   propriedade do global — por isso a ponte injetada abaixo, no mesmo molde da
   que o motor.js já usa para o estado da partida.

   Uso:  node sim/simetria.js
         node sim/simetria.js mapa=9                                                 */

const { carrega } = require("./motor");

const opcoes = {};
process.argv.slice(2).forEach(a => { const [k, v] = a.split("="); if (v !== undefined) opcoes[k] = v; });

const trocas = [];
if (opcoes.mapa) trocas.push([/^const N=\d+;$/m, `const N=${+opcoes.mapa};`]);
/* ponte da geometria: ancorada numa linha única que vem depois de tudo que interessa */
trocas.push([/const VIDA_TORRE=\d+, VIDA_NEXUS=\d+;/,
  `$&\n;globalThis.__geo={N,COLS,LINS,BASE,ROTAS,LANE,TORRES_DEF,vizinhos,dist,` +
  `NO_TAB:typeof NO_TAB!=="undefined"?NO_TAB:null};`]);

/* o contexto do vm tem global próprio: `__geo` chega pelo proxy que carrega() devolve */
const G = carrega(trocas).__geo;
const { N, COLS, LINS, BASE, ROTAS, LANE, TORRES_DEF, vizinhos, NO_TAB } = G;

/* ---------- rotação de 180° em coordenada cúbica ----------
   O eixo da rotação é ancorado nos dois cantos opostos, e não no "hexágono
   central": num tabuleiro de lado PAR o centro cai entre casas, e pedir o cubo
   de ((N-1)/2,(N-1)/2) devolve coordenada fracionária. Com A = canto + canto,
   espelho(p) = A - p é exato nas duas paridades.                                  */
const toCube = (c, r) => { const x = c - (r - (r & 1)) / 2; return [x, -x - r, r]; };
const fromCube = (x, y, z) => [x + (z - (z & 1)) / 2, z];
const A = toCube(0, 0).map((v, i) => v + toCube(COLS - 1, LINS - 1)[i]);
const espelho = (c, r) => {
  const p = toCube(c, r);
  return fromCube(A[0] - p[0], A[1] - p[1], A[2] - p[2]);
};

const k = (c, r) => c + "," + r;
const dentro = ([c, r]) => c >= 0 && c < COLS && r >= 0 && r < LINS;

/* ---------- 1. toda casa DO TABULEIRO tem par? ----------
   Tabuleiro não é o mesmo que retângulo: a partir da v0.6 o jogo declara em
   NO_TAB quais casas da grade existem de fato, e casa sem contraparte foi
   removida em vez de ficar valendo para um lado só. Sem NO_TAB (build antigo),
   o tabuleiro é o retângulo inteiro e a conta cai no caso de antes.               */
const noTab = NO_TAB ? (c, r) => NO_TAB.has(k(c, r)) : () => true;
const foraDoTab = [];
const semPar = [];
for (let r = 0; r < LINS; r++)
  for (let c = 0; c < COLS; c++) {
    if (!noTab(c, r)) { foraDoTab.push([c, r]); continue; }
    const e = espelho(c, r);
    if (!dentro(e) || !noTab(e[0], e[1])) semPar.push([c, r]);
  }

/* ---------- 2. topo e baixo são espelho um do outro? ---------- */
function comparaRotas(a, b) {
  const la = ROTAS[a], lb = ROTAS[b];
  if (la.length !== lb.length) return { ok: false, motivo: `comprimentos ${la.length} vs ${lb.length}` };
  const fora = [];
  la.forEach(([c, r], i) => {
    const e = espelho(c, r);
    const alvo = lb[lb.length - 1 - i];                 // a rota espelhada corre ao contrário
    if (!alvo || e[0] !== alvo[0] || e[1] !== alvo[1])
      fora.push(`${a}[${i}]=(${c},${r}) → espelho (${e}), mas ${b} tem (${alvo})`);
  });
  return { ok: fora.length === 0, fora };
}

/* ---------- 3. bases espelhadas? ---------- */
const baseFora = [];
BASE[0].forEach(([c, r]) => {
  const e = espelho(c, r);
  if (!BASE[1].some(([a, b]) => a === e[0] && b === e[1]))
    baseFora.push(`base0 (${c},${r}) → espelho (${e}) não existe na base1 [${BASE[1].map(p => `(${p})`).join(" ")}]`);
});

/* ---------- 4. torres a distâncias espelhadas da própria base ---------- */
const torreFora = [];
Object.keys(ROTAS).forEach(nome => {
  const l = ROTAS[nome];
  const d0 = TORRES_DEF.filter(t => t.rota === nome && t.t === 0).map(t => t.i).sort((a, b) => a - b);
  const d1 = TORRES_DEF.filter(t => t.rota === nome && t.t === 1).map(t => l.length - 1 - t.i).sort((a, b) => a - b);
  if (JSON.stringify(d0) !== JSON.stringify(d1))
    torreFora.push(`${nome}: time0 a ${d0.join("/")} passos da base · time1 a ${d1.join("/")}`);
});

/* ---------- 4b. a espinha é um caminho contínuo? ----------
   `frentes` guarda um ÍNDICE da espinha, e a onda anda de um índice para o
   seguinte. Se dois passos vizinhos na lista não forem vizinhos no tabuleiro, a
   onda atravessa o vão como se nada fosse. Já aconteceu: em N=11 a rota do meio
   nasceu partida em duas, com um vão de 3 casas, porque o tabuleiro não tinha
   casa fixa da rotação e a emenda só sabia costurar buraco de uma casa.         */
const rachaduras = [];
Object.entries(ROTAS).forEach(([nome, l]) => {
  for (let i = 1; i < l.length; i++) {
    const d = G.dist(...l[i - 1], ...l[i]);
    if (d > 1) rachaduras.push(`${nome}: passo ${i - 1} (${l[i - 1]}) → ${i} (${l[i]}) dista ${d}`);
  }
});

/* ---------- 5. largura da rota ----------
   Espinha = a lista ordenada de ROTAS (é ela que indexa torre e onda).
   Corredor = tudo que LANE marca com o nome da rota.
   Seção em cada passo = a própria casa + as casas de corredor vizinhas que não
   são espinha. Rota de 1 casa de largura dá 1 em todo passo.                      */
const espinhaDe = {};
Object.entries(ROTAS).forEach(([n, l]) => { espinhaDe[n] = new Set(l.map(([c, r]) => k(c, r))); });
const larguras = {};
Object.entries(ROTAS).forEach(([nome, l]) => {
  const corredor = [...LANE.entries()].filter(([, v]) => v === nome).length;
  const secoes = l.map(([c, r]) =>
    1 + vizinhos(c, r).filter(([a, b]) => LANE.get(k(a, b)) === nome && !espinhaDe[nome].has(k(a, b))).length);
  larguras[nome] = { espinha: l.length, corredor, min: Math.min(...secoes), max: Math.max(...secoes),
                     estreitos: secoes.filter(s => s < 2).length };
});

/* ---------- relatório ---------- */
const L = console.log;
L(`\n=== SIMETRIA DO TABULEIRO — N=${N} (${COLS}×${LINS}) ===\n`);

L(`1. Casas do tabuleiro: ${COLS * LINS - foraDoTab.length} de ${COLS * LINS} da grade` +
  `${foraDoTab.length ? `  (${foraDoTab.length} removidas por não terem par: ${foraDoTab.map(p => `(${p})`).join(" ")})` : ""}`);
L(`   Sem par no espelho: ${semPar.length ? semPar.length + "   <<< FALHA" : "0   ok"}`);
if (semPar.length) L(`   ${semPar.slice(0, 24).map(p => `(${p})`).join(" ")}${semPar.length > 24 ? ` (+${semPar.length - 24})` : ""}`);

L(`\n2. Rotas — comprimento da espinha: ${Object.entries(ROTAS).map(([n, l]) => `${n}=${l.length}`).join("  ")}`);
const tb = comparaRotas("topo", "baixo");
L(`   topo vs baixo: ${tb.ok ? "espelho exato   ok" : "FALHA — " + (tb.motivo || tb.fora.length + " casas fora do espelho")}`);
if (!tb.ok && tb.fora) tb.fora.slice(0, 5).forEach(f => L(`      ${f}`));

L(`\n3. Bases espelhadas: ${baseFora.length ? "FALHA" : "ok"}`);
baseFora.forEach(f => L(`      ${f}`));

L(`\n4. Torres a distâncias espelhadas da base: ${torreFora.length ? "FALHA" : "ok"}`);
torreFora.forEach(f => L(`      ${f}`));

L(`\n4b. Espinha contínua (passo vizinho na lista = vizinho no tabuleiro): ${rachaduras.length ? "FALHA" : "ok"}`);
rachaduras.forEach(f => L(`      ${f}`));

L(`\n5. Largura da rota:`);
Object.entries(larguras).forEach(([n, w]) =>
  L(`   ${n.padEnd(6)} espinha=${String(w.espinha).padStart(2)}  corredor=${String(w.corredor).padStart(3)}  seção min=${w.min} max=${w.max}` +
    `${w.min < 2 ? `   <<< ${w.estreitos} passo(s) com 1 casa` : ""}`));

const falhas = (semPar.length ? 1 : 0) + (tb.ok ? 0 : 1) + (baseFora.length ? 1 : 0) + (torreFora.length ? 1 : 0)
              + (rachaduras.length ? 1 : 0);
L(`\n${falhas ? falhas + " verificação(ões) falhando" : "tabuleiro simétrico"}\n`);
process.exit(falhas ? 1 : 0);
