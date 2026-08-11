#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   gerar-dados.mjs — junta a camada criativa com o catálogo do jogo.

   ENTRADA   visual-lab/dados/criacao.json   (escrito à mão: lore, arte, status)
             data/catalogo.js                (FONTE DE VERDADE dos números)
   SAÍDA     visual-lab/dados/personagens.json

   Por que existe: o Visual Guide mostra a carta do personagem com atributos.
   Se esses números forem digitados no guide, nasce o quarto catálogo divergente
   (ver CLAUDE.md). Aqui eles são DERIVADOS, e o script quebra se divergirem.

   Uso:  node visual-lab/scripts/gerar-dados.mjs
         node visual-lab/scripts/gerar-dados.mjs --checa   (não escreve, só valida)
   ═══════════════════════════════════════════════════════════════════ */

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AQUI = dirname(fileURLToPath(import.meta.url));
const LAB = join(AQUI, "..");
const RAIZ = join(LAB, "..");

const require = createRequire(import.meta.url);
const catalogo = require(join(RAIZ, "data", "catalogo.js"));
const { HEROIS, textoHab, TEXTO_PATAMAR } = catalogo;

const criacao = JSON.parse(readFileSync(join(LAB, "dados", "criacao.json"), "utf8"));

const SO_CHECA = process.argv.includes("--checa");
const erros = [];
const avisos = [];

/* A rota criativa usa o nome que o jogador lê; o catálogo usa a sigla interna. */
const ROTA_PARA_POS = { TOPO: "topo", SELVA: "selva", MEIO: "meio", ATIRADOR: "adc", SUPORTE: "sup" };

/* Onde as derivadas web moram, para conferir se o arquivo citado existe mesmo. */
const PASTAS_WEB = [join(LAB, "images"), join(LAB, "public", "images")];

const ETAPAS = criacao.etapas.map((e) => e.id);

function atributosDe(heroi) {
  const a = [
    { chave: "vida", rotulo: "VIDA", valor: heroi.vida },
    { chave: "poder", rotulo: "PODER", valor: heroi.poder },
    { chave: "arm", rotulo: "ARMADURA", valor: heroi.arm },
    { chave: "alc", rotulo: "ALCANCE", valor: heroi.alc },
  ];
  return a.map((x) => ({ ...x, texto: String(x.valor).padStart(2, "0") }));
}

function marcasDe(heroi) {
  const m = [];
  if (heroi.agil) m.push({ chave: "agil", rotulo: "ÁGIL", texto: "Anda uma casa a mais." });
  if (heroi.patamar) m.push({ chave: "patamar", rotulo: "PATAMARES", texto: TEXTO_PATAMAR.replace(/<[^>]+>/g, "") });
  return m;
}

const personagens = criacao.personagens.map((p) => {
  const ref = p.catalogo?.id ? HEROIS[p.catalogo.id] : null;

  if (p.catalogo?.id && !ref) {
    erros.push(`${p.slug}: catalogo.id "${p.catalogo.id}" não existe em data/catalogo.js`);
  }

  if (ref) {
    const posEsperada = ROTA_PARA_POS[p.rota];
    if (posEsperada && ref.pos !== posEsperada) {
      erros.push(
        `${p.slug}: rota "${p.rota}" (=${posEsperada}) não bate com ${p.catalogo.id}.pos "${ref.pos}"`,
      );
    }
    if (p.classe && ref.cls.toUpperCase() !== p.classe.toUpperCase()) {
      erros.push(`${p.slug}: classe "${p.classe}" não bate com ${p.catalogo.id}.cls "${ref.cls}"`);
    }
    if (p.skillsNome.length && p.skillsNome.length !== ref.habs.length) {
      erros.push(
        `${p.slug}: ${p.skillsNome.length} nomes de skill para ${ref.habs.length} habilidades em ${p.catalogo.id}`,
      );
    }
  }

  /* Etapas: todas as seis declaradas, nem uma a mais. */
  const declaradas = Object.keys(p.assets ?? {});
  for (const id of ETAPAS) if (!declaradas.includes(id)) erros.push(`${p.slug}: falta a etapa ${id} em assets`);
  for (const id of declaradas) if (!ETAPAS.includes(id)) erros.push(`${p.slug}: etapa desconhecida "${id}" em assets`);

  /* Arquivo citado que não existe em disco é o erro que mais some sem avisar. */
  const assets = {};
  for (const [id, a] of Object.entries(p.assets ?? {})) {
    for (const arq of a.arquivos ?? []) {
      const faltando = PASTAS_WEB.filter((dir) => !existsSync(join(dir, arq)));
      if (faltando.length === PASTAS_WEB.length) {
        erros.push(`${p.slug} etapa ${id}: arquivo "${arq}" não existe em nenhuma pasta web`);
      } else if (faltando.length) {
        avisos.push(
          `${p.slug} etapa ${id}: "${arq}" só está em uma das pastas web — rode scripts/sync-imagens.mjs`,
        );
      }
    }
    if (a.estado === "pronto" && !(a.arquivos ?? []).length) {
      avisos.push(
        `${p.slug} etapa ${id}: marcada "pronto" e sem arquivo no repositório${
          (a.nuvem ?? []).length ? ` (existe na nuvem: ${a.nuvem.join(", ")})` : ""
        }`,
      );
    }
    assets[id] = { ...a, arquivos: a.arquivos ?? [], nuvem: a.nuvem ?? [] };
  }

  const feitas = ETAPAS.filter((id) => assets[id]?.estado === "pronto").length;

  return {
    ...p,
    atributos: ref ? atributosDe(ref) : null,
    marcas: ref ? marcasDe(ref) : [],
    skills: ref
      ? ref.habs.map((h, i) => ({
          tecla: ["Q", "W", "R"][i] ?? String(i + 1),
          nome: p.skillsNome[i] || h.n,
          nomeMecanico: h.n,
          forca: h.f,
          alvo: h.alvo,
          texto: textoHab(h).replace(/<[^>]+>/g, ""),
          batizada: Boolean(p.skillsNome[i]),
        }))
      : [],
    referenciaCatalogo: ref ? { id: p.catalogo.id, nome: ref.n, epiteto: ref.ep } : null,
    progresso: { feitas, total: ETAPAS.length },
    assets,
  };
});

const totalEtapas = personagens.length * ETAPAS.length;
const feitasEtapas = personagens.reduce((s, p) => s + p.progresso.feitas, 0);

const saida = {
  _gerado: "NÃO EDITE À MÃO. Saída de visual-lab/scripts/gerar-dados.mjs.",
  _fontes: ["visual-lab/dados/criacao.json", "data/catalogo.js"],
  versao: criacao.versao,
  etapas: criacao.etapas,
  personagens,
  slotsAbertos: criacao.slotsAbertos,
  progresso: {
    personagens: personagens.length,
    slotsAbertos: criacao.slotsAbertos.reduce((s, x) => s + x.quantidade, 0),
    etapasFeitas: feitasEtapas,
    etapasTotais: totalEtapas,
  },
};

for (const a of avisos) console.warn(`aviso  ${a}`);

if (erros.length) {
  for (const e of erros) console.error(`ERRO   ${e}`);
  console.error(`\n${erros.length} erro(s). Nada foi escrito.`);
  process.exit(1);
}

if (SO_CHECA) {
  console.log(`ok — ${personagens.length} personagens, ${feitasEtapas}/${totalEtapas} etapas prontas, ${avisos.length} aviso(s).`);
} else {
  const destino = join(LAB, "dados", "personagens.json");
  writeFileSync(destino, JSON.stringify(saida, null, 2) + "\n");
  console.log(`escrito dados/personagens.json — ${personagens.length} personagens, ${feitasEtapas}/${totalEtapas} etapas prontas.`);
}
