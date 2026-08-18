/* O DRAFT DA IA REPETE SEMPRE O MESMO?

   Nasceu do relato: *"a IA sempre bane e escolhe praticamente os mesmos
   heróis"*. Era verdade e a causa era única — ela ordenava por
   `vida + poder×2 + arm×1,5 + ruído×2` e pegava o primeiro. O ruído de ±2 não
   chega perto da distância entre os chassis, então a ordem era sempre a mesma.

   Este script roda drafts inteiros SEM TELA: a escolha da IA virou função pura
   (`iaEscolheDraft`) e o passo virou porta única (`draftAplica`), então dá para
   simular os dez picks e os dois bans em memória.

   O QUE ELE MEDE, e o que cada número quer dizer:

     · FREQUÊNCIA de cada herói, por rota. Com 4 heróis por rota, um sorteio
       perfeitamente liso daria 50% para cada um (cada rota é escolhida duas
       vezes, uma por time). O alvo NÃO é 50% — é não haver herói em 100% e
       herói em 0%: a IA deve pender para o melhor sem nunca ser previsível;
     · FREQUÊNCIA de banimento;
     · COMPOSIÇÕES DISTINTAS em N drafts. É a medida direta de "o draft é
       previsível?".

     node sim/draft.js            → 200 drafts
     node sim/draft.js 30         → os 30 que o pedido exige
     node sim/draft.js 200 facil  → com a IA no nível Aprendiz                 */

const { carrega } = require("./motor.js");

const n = parseInt(process.argv[2], 10) || 200;
const nivel = process.argv[3] || "normal";

const g = carrega();
g.simMode = true;
g.aiMode = true;
if (!g.NIVEIS_IA[nivel]) {
  console.error(`nível inválido. Existem: ${Object.keys(g.NIVEIS_IA).join(", ")}`);
  process.exit(1);
}
g.nivelIA = nivel;
/* varredura: node sim/draft.js 200 normal k=4 peso=2 */
process.argv.slice(4).forEach(a => {
  const [c, v] = a.split("=");
  if (c === "k") g.NIVEIS_IA[nivel].draftK = +v;
  if (c === "peso") g.NIVEIS_IA[nivel].draftPeso = +v;
});

const picks = {}, bans = {}, composicoes = new Set();
const ROTAS = ["topo", "selva", "meio", "adc", "sup"];

for (let i = 0; i < n; i++) {
  /* um draft inteiro, IA dos dois lados: é o pior caso para a variedade —
     se ela repetir, repete duas vezes por draft */
  g.dr = { fase: "ban", passo: 0, bans: [], times: [[], []], aoFim: null };
  let guarda = 0;
  while (guarda++ < 40) {
    const t = g.draftTurnoAtual();
    const id = g.iaEscolheDraft(g.dr.fase === "ban" ? t : t);
    if (!id) break;
    if (g.dr.fase === "ban") bans[id] = (bans[id] || 0) + 1;
    else picks[id] = (picks[id] || 0) + 1;
    if (g.draftAplica(id)) break;
  }
  composicoes.add(g.dr.times.map(x => x.slice().sort().join("+")).join(" | "));
}

const pct = x => ((x || 0) / (n * 2) * 100).toFixed(0).padStart(3) + "%";
const pctBan = x => ((x || 0) / (n * 2) * 100).toFixed(0).padStart(3) + "%";
const w = (s, k) => String(s).padEnd(k).slice(0, k);

console.log(`\n  JAGERLARAMAIS · variedade do draft da IA · ${g.NIVEIS_IA[nivel].n}`
          + `  ·  ${n} drafts\n`);
console.log("  ROTA     HERÓI                    ESCOLHIDO   BANIDO");
ROTAS.forEach(r => {
  Object.keys(g.CATALOGO).filter(id => g.CATALOGO[id].pos === r).forEach((id, k) => {
    console.log(`  ${w(k === 0 ? r.toUpperCase() : "", 9)}${w(g.CATALOGO[id].n, 25)}`
              + `${pct(picks[id])}      ${pctBan(bans[id])}`
              + (!picks[id] ? "   ← NUNCA ESCOLHIDO" : ""));
  });
});

const usados = Object.keys(picks).length;
console.log(`\n  heróis que apareceram em algum time   ${usados}/20`);
console.log(`  heróis que apareceram em algum ban    ${Object.keys(bans).length}/20`);
console.log(`  composições distintas em ${n} drafts     ${composicoes.size}`);
const maior = Math.max(...Object.values(picks));
const dono = Object.keys(picks).find(id => picks[id] === maior);
console.log(`  herói mais escolhido                  ${g.CATALOGO[dono].n} `
          + `(${(maior / (n * 2) * 100).toFixed(0)}% dos slots da rota dele)\n`);
console.log("  Leitura: com 4 heróis por rota e 2 escolhas por rota em cada draft, um");
console.log("  sorteio liso daria 50% para cada. 100% é o defeito relatado; 50% redondo");
console.log("  em todos seria a IA jogando dado, que §15 proíbe. O saudável é pender");
console.log("  para os melhores sem nunca fechar a porta de nenhum.\n");
