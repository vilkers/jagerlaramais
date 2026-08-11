#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   sync-imagens.mjs — mantém as duas pastas web idênticas.

   Por que existem duas: a mesma página é publicada por duas hospedagens.
     public/images/  → o Next/Sites serve daqui (pasta padrão dele)
     images/         → o GitHub Pages serve daqui, ao lado do index.html
   Esquecer um lado dá imagem quebrada só em uma das publicações, que é o tipo
   de bug que ninguém vê até alguém abrir o link no celular.

   public/images é a pasta de autoria. images é o espelho.

   Uso:  node visual-lab/scripts/sync-imagens.mjs
         node visual-lab/scripts/sync-imagens.mjs --checa   (não copia, só acusa)
   ═══════════════════════════════════════════════════════════════════ */

import { readdirSync, copyFileSync, statSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AQUI = dirname(fileURLToPath(import.meta.url));
const LAB = join(AQUI, "..");
const FONTE = join(LAB, "public", "images");
const ESPELHO = join(LAB, "images");
const SO_CHECA = process.argv.includes("--checa");

if (!existsSync(ESPELHO)) mkdirSync(ESPELHO, { recursive: true });

const naFonte = new Set(readdirSync(FONTE));
const noEspelho = new Set(readdirSync(ESPELHO));

let copiados = 0;
for (const arq of naFonte) {
  const de = join(FONTE, arq);
  const para = join(ESPELHO, arq);
  const precisa = !existsSync(para) || statSync(de).size !== statSync(para).size;
  if (!precisa) continue;
  if (SO_CHECA) console.warn(`aviso  images/${arq} está desatualizada ou faltando`);
  else copyFileSync(de, para);
  copiados++;
}

const sobrando = [...noEspelho].filter((a) => !naFonte.has(a));
for (const arq of sobrando) console.warn(`aviso  images/${arq} não existe em public/images — apague ou promova`);

/* Órfã = está no disco e ninguém referencia. Cada uma pesa no clone e no Pages. */
const fontes = [join(LAB, "app", "page.tsx"), join(LAB, "index.html"), join(LAB, "dados", "criacao.json")]
  .filter(existsSync)
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

const orfas = [...naFonte].filter((a) => !fontes.includes(a));
let peso = 0;
for (const arq of orfas) peso += statSync(join(FONTE, arq)).size;
for (const arq of orfas) console.warn(`órfã   ${arq} (${(statSync(join(FONTE, arq)).size / 1024).toFixed(0)} KB) — ninguém referencia`);

const total = [...naFonte].reduce((s, a) => s + statSync(join(FONTE, a)).size, 0);
console.log(
  `${naFonte.size} imagens · ${(total / 1024 / 1024).toFixed(1)} MB por pasta · ` +
    `${SO_CHECA ? `${copiados} fora de sincronia` : `${copiados} copiada(s)`} · ` +
    `${orfas.length} órfã(s)${orfas.length ? ` somando ${(peso / 1024 / 1024).toFixed(1)} MB` : ""}`,
);

if (SO_CHECA && (copiados || sobrando.length)) process.exit(1);
