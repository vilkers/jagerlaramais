#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   publicar-estatico.mjs — gera o Visual Guide que o GitHub Pages serve.

   O PROBLEMA QUE ISSO RESOLVE
   O Guide é publicado em dois lugares com regras diferentes:
     · Sites/ChatGPT serve o app na RAIZ  → caminho absoluto "/assets/x" funciona
     · GitHub Pages serve em /jagerlaramais/visual-lab/ → o mesmo caminho vira 404
   O index.html publicado era um instantâneo corrigido à mão. Corrigiram as imagens
   e esqueceram as fontes: o CSS ainda pede url(/assets/*.woff2), que no Pages
   resolve para vilkers.github.io/assets/ e não existe. Resultado: as três fontes da
   marca nunca carregaram no site público, e o H1 estourava em fonte de sistema.

   Este script renderiza a rota pelo worker do build e reescreve TODO caminho
   absoluto para relativo — HTML e CSS. Rode sempre depois de mexer em app/.

   Uso:  npm run build && node scripts/publicar-estatico.mjs
   ═══════════════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync, readdirSync, rmSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const AQUI = dirname(fileURLToPath(import.meta.url));
const LAB = join(AQUI, "..");
const DIST_SERVER = join(LAB, "dist", "server", "index.js");
const DIST_ASSETS = join(LAB, "dist", "client", "assets");
const ASSETS = join(LAB, "assets");

if (!existsSync(DIST_SERVER)) {
  console.error("dist/ não existe. Rode `npm run build` antes.");
  process.exit(1);
}

/* ── 1. renderiza a home pelo worker do build ──────────────────────── */

const url = new URL(`file://${DIST_SERVER}`);
url.searchParams.set("publicar", String(Date.now()));
const { default: worker } = await import(url.href);

const resposta = await worker.fetch(
  new Request("http://localhost/", { headers: { accept: "text/html" } }),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);

if (resposta.status !== 200) {
  console.error(`worker respondeu ${resposta.status} para "/"`);
  process.exit(1);
}

let html = await resposta.text();

/* ── 2. absoluto → relativo no HTML ────────────────────────────────── */

const antes = html;
html = html
  .replace(/(["'(])\/(assets\/)/g, "$1$2")
  .replace(/(["'(])\/(images\/)/g, "$1$2")
  .replace(/(["'(])\/(favicon\.svg)/g, "$1$2");
/* srcset traz vários caminhos separados por vírgula, fora de aspas */
html = html.replace(/(srcSet|srcset)="([^"]*)"/g, (_m, attr, v) =>
  `${attr}="${v.replace(/(^|,\s*)\/images\//g, "$1images/")}"`,
);

if (html === antes) console.warn("aviso  nenhum caminho absoluto encontrado no HTML — confira o build");

if (/(href|src)="\/[^/]/.test(html)) {
  console.error("ERRO   sobrou caminho absoluto no HTML:");
  for (const m of html.match(/(href|src)="\/[^"]*"/g) ?? []) console.error(`       ${m}`);
  process.exit(1);
}

/* ── 3. tira a hidratação: o que o Pages serve é documento, não app ──

   O build embute o bootstrap RSC e os modulepreload do React. No Pages não há
   servidor para completar o fluxo, e o React ainda brigaria com o static.js pelo
   mesmo clique. Sai tudo; entra o static.js, que refaz a interação em 12 linhas. */

const scriptsFora = (html.match(/<script\b(?![^>]*\bsrc="static\.js")[^>]*>[\s\S]*?<\/script>/g) ?? []).length;
html = html.replace(/<script\b(?![^>]*\bsrc="static\.js")[^>]*>[\s\S]*?<\/script>/g, "");
const preloadsFora = (html.match(/<link rel="modulepreload"[^>]*>/g) ?? []).length;
html = html.replace(/<link rel="modulepreload"[^>]*>/g, "");

if (!html.includes("static.js")) {
  html = html.replace("</body>", '<script src="static.js"></script></body>');
}

/* ── 4. copia os assets do build e conserta as fontes dentro do CSS ── */

if (!existsSync(ASSETS)) mkdirSync(ASSETS, { recursive: true });
for (const arq of readdirSync(ASSETS)) rmSync(join(ASSETS, arq));

let fontesCorrigidas = 0;
for (const arq of readdirSync(DIST_ASSETS)) {
  const de = join(DIST_ASSETS, arq);
  const para = join(ASSETS, arq);
  if (extname(arq) === ".js") {
    continue; /* sem hidratação, o bundle do React não é servido */
  }
  if (extname(arq) === ".css") {
    const css = readFileSync(de, "utf8");
    /* url(/assets/x.woff2) → url(./x.woff2): o CSS já mora dentro de assets/ */
    const corrigido = css.replace(/url\(\/assets\//g, "url(./");
    fontesCorrigidas += (css.match(/url\(\/assets\//g) ?? []).length;
    writeFileSync(para, corrigido);
  } else {
    copyFileSync(de, para);
  }
}

if (!fontesCorrigidas) {
  console.warn("aviso  nenhuma url(/assets/) no CSS — ou já veio relativa, ou as fontes sumiram");
}

/* ── 5. arquivos soltos que o Pages serve da mesma pasta ───────────── */

for (const arq of ["favicon.svg", "file.svg", "globe.svg", "window.svg"]) {
  const de = join(LAB, "public", arq);
  if (existsSync(de)) copyFileSync(de, join(LAB, arq));
}

writeFileSync(join(LAB, "index.html"), html);

console.log(
  `publicado index.html (${(html.length / 1024).toFixed(1)} KB) · ` +
    `${readdirSync(ASSETS).length} assets · ${fontesCorrigidas} url de fonte corrigida · ` +
    `${scriptsFora} script(s) e ${preloadsFora} modulepreload de hidratação removidos`,
);
