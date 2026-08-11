/* Confere — e conserta — a documentação contra o código.

   O PROBLEMA QUE ISTO RESOLVE. Os números do jogo moram em `jogo/jogo.js` e
   `data/catalogo.js`, e eram copiados à mão para o README, as regras e o ESTADO.
   Copiar à mão funciona uma vez; na terceira versão a documentação anuncia um jogo
   que não existe. Medido no dia em que este script nasceu: o README dizia Nexus com
   5 de vida (o motor joga com 3), as regras descreviam uma torre que dependia da
   onda (mudou na v0.6.1) e o ESTADO punha o poço em [4,4] (só vale em N=8; em 11×11
   a dedução cai em [8,8]).

   COMO FUNCIONA. Número derivado do código vira MARCADOR no texto:

       A torre tem <!--n:vidaTorre-->3<!--/n--> de vida.

   O marcador é comentário HTML: some no GitHub e no navegador, o leitor vê só o "3".
   `node sim/docs.js` compara cada marcador com o valor real e falha se divergir;
   `node sim/docs.js --escrever` reescreve todos de uma vez.

   O QUE ELE NÃO FAZ, e não deve fingir que faz:
     · não confere PROSA. "a onda tira 1 por rodada" continua sendo responsabilidade
       de quem escreve — o marcador cobre o número, não a frase em volta dele;
     · não confere MEDIÇÃO (55,5% de quem começa, mediana de 19 rodadas). Isso não
       sai do código, sai de `sim/bateria.js`, e vem com n e data — ver docs/DOCUMENTACAO.md;
     · não toca em `docs/patch-notes.md`. Patch note é histórico append-only: os
       números dele SÃO o passado ("de 9×9 para 11×11") e reescrevê-los seria apagar
       a memória do projeto. Marcador ali é erro, e o script reclama.

   Uso:
     node sim/docs.js              → confere tudo, sai 1 se algo divergir
     node sim/docs.js --escrever   → atualiza os marcadores e depois confere         */

const fs = require("fs");
const path = require("path");
const { numeros } = require("./numeros");
const { RAIZ } = require("./motor");

const ESCREVER = process.argv.includes("--escrever");
const L = console.log;
const falhas = [];
const avisos = [];
const arrumados = [];
const erro = (arq, msg) => falhas.push(`${arq}: ${msg}`);

const ler = a => fs.readFileSync(path.join(RAIZ, a), "utf8");
const existe = a => fs.existsSync(path.join(RAIZ, a));

/* Arquivos que participam do sistema de marcadores. As páginas entram junto com os
   .md de propósito: o marcador é comentário HTML, funciona igual nos dois, e foi
   justamente o rótulo do guia que ficou anunciando v0.4 por três versões. */
const DOCS = ["README.md", "CLAUDE.md", "teste/LEIA.md",
  "index.html", "guia/index.html", "cartas/index.html",
  ...fs.readdirSync(path.join(RAIZ, "docs")).filter(f => f.endsWith(".md")).map(f => "docs/" + f)];
const SEM_MARCADOR = ["docs/patch-notes.md"];   // histórico: não se reescreve

const N = numeros();
const MARCADOR = () => /<!--n:([A-Za-z0-9]+)-->([\s\S]*?)<!--\/n-->/g;

/* Documentação que explica marcador precisa poder MOSTRAR um marcador. Em .md o
   exemplo mora em bloco cercado ou entre crases, e essas regiões passam intactas —
   sem isto, `docs/DOCUMENTACAO.md` reclamava do próprio exemplo de sintaxe.
   Só vale para .md: em HTML as crases são template literal do JavaScript. */
function substituiForaDeCodigo(txt, fn) {
  const CODIGO = /```[\s\S]*?```|`[^`\n]*`/g;
  let saida = "", i = 0, m;
  while ((m = CODIGO.exec(txt))) {
    saida += txt.slice(i, m.index).replace(MARCADOR(), fn) + m[0];
    i = m.index + m[0].length;
  }
  return saida + txt.slice(i).replace(MARCADOR(), fn);
}
/* quantos marcadores DE VERDADE o texto tem — o exemplo entre crases não conta */
function contaMarcadores(txt) {
  let n = 0;
  substituiForaDeCodigo(txt, todo => { n++; return todo; });
  return n;
}

/* ---------- 1. marcadores ---------- */
let vistos = 0;
for (const arq of DOCS) {
  const original = ler(arq);
  let novo = original, mudou = false;

  if (SEM_MARCADOR.includes(arq)) {
    /* o patch note PODE citar a sintaxe entre crases — foi o que a entrada da v0.6.3
       fez. O que não pode é marcador de verdade, que reescreveria o passado. */
    if (contaMarcadores(original))
      erro(arq, "tem marcador de número, e este arquivo é histórico append-only — remova");
    continue;
  }

  const troca = (todo, chave, valor) => {
    vistos++;
    if (!(chave in N)) {
      erro(arq, `marcador desconhecido "${chave}" — veja as chaves em \`node sim/numeros.js\``);
      return todo;
    }
    const certo = String(N[chave].valor);
    if (valor === certo) return todo;
    if (ESCREVER) {
      mudou = true;
      arrumados.push(`${arq}: ${chave} ${valor} → ${certo}`);
      return `<!--n:${chave}-->${certo}<!--/n-->`;
    }
    erro(arq, `${chave} está "${valor}" e o código diz "${certo}"  (${N[chave].de})`);
    return todo;
  };

  novo = arq.endsWith(".md") ? substituiForaDeCodigo(original, troca)
                             : original.replace(MARCADOR(), troca);
  if (mudou) fs.writeFileSync(path.join(RAIZ, arq), novo);
}

/* ---------- 2. a versão bate entre ESTADO e o topo do patch note? ---------- */
(() => {
  /* a versão do ESTADO é ela mesma um marcador, então o comentário entra no meio */
  const vEstado = /\*\*Versão:\*\*\s*(?:<!--n:versao-->)?(v[\d.]+)/.exec(ler("docs/ESTADO.md"));
  const vPatch = /^## (v[\d.]+)/m.exec(ler("docs/patch-notes.md"));
  if (!vEstado) return erro("docs/ESTADO.md", "não achei a linha `**Versão:** vX.Y`");
  if (!vPatch) return erro("docs/patch-notes.md", "não achei a primeira entrada `## vX.Y`");
  if (vEstado[1] !== vPatch[1])
    erro("docs/ESTADO.md", `diz ${vEstado[1]} e o patch note mais recente é ${vPatch[1]}`);
})();

/* ---------- 3. glossário: guia e doc falam a mesma língua ----------
   "Glossário é lei" só vale se existir UM glossário. O guia renderiza a lista dele;
   docs/glossario.md é o texto canônico. Termo que existe num e não no outro é o
   começo de uma discussão de regra no meio da partida. */
(() => {
  if (!existe("docs/glossario.md")) return erro("docs/glossario.md", "não existe (o CLAUDE.md manda ver este arquivo)");
  const txt = ler("docs/glossario.md");
  /* O glossário tem duas metades: os termos DE MESA, que o jogador precisa ver no
     guia, e os TERMOS INTERNOS (espinha, corredor, meio do vão), que são vocabulário
     de motor e não têm o que fazer num manual de jogador. Só a primeira metade é
     cobrada nos dois lados. */
  const corte = txt.indexOf("## Termos internos");
  const termos = t => new Set([...t.matchAll(/^\|\s*\*\*(.+?)\*\*/gm)].map(m => m[1].trim()));
  const deMesa = termos(corte < 0 ? txt : txt.slice(0, corte));
  const todos = termos(txt);

  const bloco = /const GLOSS = \[([\s\S]*?)\n\];/.exec(ler("guia/index.html"));
  if (!bloco) return erro("guia/index.html", "não achei a lista `const GLOSS = [`");
  const doGuia = new Set([...bloco[1].matchAll(/\["([^"]+)"/g)].map(m => m[1]));

  for (const t of doGuia) if (!todos.has(t)) erro("docs/glossario.md", `falta o termo "${t}", que o guia define`);
  for (const t of deMesa) if (!doGuia.has(t)) erro("guia/index.html", `falta o termo "${t}", que o glossário define como termo de mesa`);
})();

/* ---------- 4. fonte única: ninguém declara conteúdo fora do catálogo ----------
   A lei nº 1 do projeto. Já foi quebrada três vezes — e a última custou um guia
   anunciando "Ampulheta Rachada: re-rolar 1 dado por rodada" enquanto o item dava
   +1 no Dado Mestre. Este teste existe para que a quarta vez não passe. */
(() => {
  for (const arq of ["guia/index.html", "cartas/index.html"]) {
    const txt = ler(arq);
    for (const [re, oque, onde] of [
        [/const ITENS\s*=\s*\[/,        "lista própria de ITENS",            "data/catalogo.js"],
        [/const HEROIS\s*=\s*\{/,       "lista própria de HEROIS",           "data/catalogo.js"],
        /* o guia desenhou um 7×7 escrito à mão até a v0.6.4, com dois poços épicos
           e quatro acampamentos, enquanto o jogo estava em 11×11 com um poço só. */
        [/const (COLS|LINS|N)\s*=\s*\d/, "geometria própria de tabuleiro",    "data/mapa.js"],
        [/const LANE_(TOPO|BOT|MEIO)\s*=/, "rotas de tabuleiro escritas à mão", "data/mapa.js"]])
      if (re.test(txt))
        erro(arq, `declara ${oque} — isso mora em ${onde} e se lê de lá`);
  }
})();

/* ---------- 5. o catálogo só usa efeitos que o motor executa ----------
   Efeito inventado não quebra nada: a habilidade simplesmente NÃO FAZ NADA, em
   silêncio, e só aparece em playtest. O vocabulário é levantado do próprio jogo.js
   (todo `ef.x` e `e.x` que ele lê), então cresce sozinho quando o motor cresce. */
(() => {
  const jogo = ler("jogo/jogo.js");
  const vocab = new Set([...jogo.matchAll(/\be?f?\.([a-zA-Z]+)/g)].map(m => m[1]));
  const cat = require(path.join(RAIZ, "data/catalogo.js"));
  for (const [id, h] of Object.entries(cat.HEROIS))
    for (const hb of h.habs)
      for (const k of Object.keys(hb.ef))
        if (!vocab.has(k))
          erro("data/catalogo.js", `${id}/${hb.n}: efeito "${k}" não existe no motor — a habilidade não faria nada`);
  for (const c of cat.DECK)
    for (const k of Object.keys(c.ef))
      if (!vocab.has(k))
        erro("data/catalogo.js", `carta ${c.id}: efeito "${k}" não existe no motor`);
})();

/* ---------- 6. todo herói tem retrato ---------- */
(() => {
  const arte = ler("arte/imagens.js");
  const cat = require(path.join(RAIZ, "data/catalogo.js"));
  const faltam = Object.keys(cat.HEROIS).filter(id => !arte.includes(`"${id}"`));
  if (faltam.length)
    erro("arte/imagens.js", `sem retrato: ${faltam.join(", ")} — caem no selo de retratoProv()`);
})();

/* ---------- 7. pendências conhecidas ----------
   Não falham a build: são buracos já registrados, com dono e motivo. Aparecem toda
   vez para não virarem paisagem. Fechou? Tire a linha daqui e do docs/ESTADO.md. */
const PENDENCIAS = [
  ["data/catalogo.js", "3 cartas declaram `quando:\"reacao\"` e o motor nunca lê esse campo — " +
                       "só funcionam como escudo antecipado no próprio turno"]
];
/* A regra existe no CLAUDE.md desde sempre: "referência ao LoL é interna, nunca no
   produto". As duas páginas publicadas imprimem `ref. de kit: Ornn / Sion` em cada
   carta. Fica como aviso, e não como falha, porque tirar isso é decisão de produto
   dos três — não de quem roda o script. */
for (const arq of ["guia/index.html", "cartas/index.html"])
  if (/ref\. de kit/.test(ler(arq)))
    PENDENCIAS.push([arq, "imprime `ref. de kit` (a referência ao LoL) numa página publicada — " +
                          "o CLAUDE.md diz que essa referência é interna, nunca do produto"]);

for (const [arq, msg] of PENDENCIAS) avisos.push(`${arq}: ${msg}`);

/* ---------- relatório ---------- */
L(`\n=== DOCUMENTAÇÃO × CÓDIGO ===\n`);
L(`  ${DOCS.length} documentos · ${vistos} números marcados · ${Object.keys(N).length} números canônicos`);
if (arrumados.length) {
  L(`\n  atualizados:`);
  arrumados.forEach(a => L(`    ${a}`));
}
if (avisos.length) {
  L(`\n  pendências conhecidas (não falham):`);
  avisos.forEach(a => L(`    · ${a}`));
}
if (falhas.length) {
  L(`\n  ${falhas.length} divergência(s):`);
  falhas.forEach(f => L(`    ✗ ${f}`));
  L(`\n  Número de marcador conserta com:  node sim/docs.js --escrever`);
  L(`  O resto é texto — leia a linha e decida se quem mudou foi o doc ou o jogo.\n`);
  process.exit(1);
}
L(`\n  documentação de acordo com o código\n`);
