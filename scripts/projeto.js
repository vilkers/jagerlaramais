/* Sincroniza o retrato mecânico publicado e falha no CI quando README, regras,
   guia ou pacote de dados ficam atrás do motor. Sem dependências externas. */
const fs = require("node:fs");
const path = require("node:path");
const { carrega } = require("../sim/motor");
const PROJETO = require("../data/projeto");

const RAIZ = path.join(__dirname, "..");
const check = process.argv.includes("--check");
const ler = rel => fs.readFileSync(path.join(RAIZ, rel), "utf8");
let desatualizados = [];

function salva(rel, conteudo) {
  const abs = path.join(RAIZ, rel);
  const atual = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
  if (atual === conteudo) return;
  if (check) desatualizados.push(rel);
  else fs.writeFileSync(abs, conteudo);
}

function bloco(rel, nome, corpo) {
  const ini = `<!-- AUTO:${nome}:INICIO -->`;
  const fim = `<!-- AUTO:${nome}:FIM -->`;
  const fonte = ler(rel);
  const novo = `${ini}\n${corpo.trim()}\n${fim}`;
  const re = new RegExp(`${ini}[\\s\\S]*?${fim}`);
  if (!re.test(fonte)) throw new Error(`${rel}: marcadores ${nome} ausentes`);
  salva(rel, fonte.replace(re, novo));
}

const jogo = carrega();
jogo.novo();
const herois = Object.keys(require("../data/catalogo").HEROIS).length;
const cartas = require("../data/catalogo").DECK.reduce((n, c) => n + c.copias, 0);
const rotas = Object.fromEntries(Object.entries(jogo.ROTAS).map(([nome, casas]) => [nome, casas]));
const retrato = {
  projeto: PROJETO,
  mapa: {
    colunas: jogo.COLS, linhas: jogo.LINS, casas: [...jogo.NO_TAB], rio: [...jogo.RIO_S],
    bases: jogo.BASE, rotas, poco: jogo.POCO, torres: jogo.TORRES_DEF,
    acampamentos: jogo.J.camps.map(c => ({ id:c.id, time:c.t, pos:c.pos, ouro:c.ouro, respawn:3 }))
  },
  estruturas: { vidaTorre:jogo.VIDA_TORRE, vidaNexus:jogo.VIDA_NEXUS,
    danoTorre:jogo.DANO_TORRE, revideTorre:jogo.REVIDE_TORRE },
  epicos: { dragao:jogo.EPICO.dragao, barao:jogo.EPICO.barao,
    inicioDragao:jogo.R_DRAGAO, inicioBarao:jogo.R_BARAO,
    poderDragao:jogo.DRAGAO_PODER, poderBarao:jogo.BARAO_PODER,
    rodadasBarao:jogo.BARAO_RODADAS, golpeBasico:jogo.GOLPE_HAB, golpeUltimate:jogo.GOLPE_ULT },
  feitico: { alcanceLampejo:jogo.LAMPEJO_ALC, recarga:jogo.FEITICO_CD, curaRetorno:jogo.RETORNO_CURA },
  conteudo: { herois, itens:jogo.ITENS.length, cartas, itensCatalogo:jogo.ITENS }
};

const jsonSeguro=JSON.stringify(retrato, null, 2).replace(/[^\x00-\x7F]/g,
  c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,"0")}`);
salva("data/retrato.js",
  `/* GERADO por scripts/projeto.js. Nao editar a mao. */\nconst RETRATO_REGRAS = ${jsonSeguro};\n`);
salva("guia/index.html",ler("guia/index.html").replace(
  /\.\.\/data\/retrato\.js(?:\?v=[^"]+)?/,
  `../data/retrato.js?v=${encodeURIComponent(PROJETO.versao)}`));

const resumo = `> **Estado atual:** ${PROJETO.versao} — ${PROJETO.status}. ${PROJETO.modo}; modo contra IA desativado.\n>\n> **Conteúdo provisório:** ${PROJETO.conteudo}`;
bloco("README.md", "RESUMO", resumo);

const tabela = `| Retrato automático | Valor |\n|---|---|\n| Versão | **${PROJETO.versao}** — ${PROJETO.status} |\n| Modo jogável | **${PROJETO.modo}** · IA desativada |\n| Tabuleiro | **${jogo.N}×${jogo.N}** |\n| Conteúdo de teste | **${herois} heróis · ${jogo.ITENS.length} itens · ${cartas} cartas** |\n| Torres / Nexus | **${jogo.VIDA_TORRE} / ${jogo.VIDA_NEXUS} de vida** · golpe ${jogo.DANO_TORRE} · revide ${jogo.REVIDE_TORRE} |\n| Poço | Dragão ${jogo.EPICO.dragao.vida} de vida até R${jogo.R_BARAO}; Barão ${jogo.EPICO.barao.vida} depois |\n| Acampamentos | **${jogo.J.camps.length} fontes de ouro** · coleta ao entrar na casa · respawn 3 |`;
bloco("docs/ESTADO.md", "RETRATO", tabela);
bloco("docs/02-regras.md", "RETRATO", tabela);

if (desatualizados.length) {
  console.error(`Arquivos desatualizados: ${desatualizados.join(", ")}\nRode: npm run sync`);
  process.exit(1);
}
console.log(check ? "Documentação e retrato sincronizados." : "Documentação e retrato atualizados.");
