/* Empacota o jogo inteiro num ÚNICO arquivo .html, para quem vai avaliar poder
   baixar do GitHub e abrir com duplo clique — sem git, sem servidor, offline.

   Existe porque o GitHub não executa o jogo: um Pull Request mostra código, e o
   GitHub Pages publica só a `main`. Enquanto uma branch está em avaliação, este
   arquivo é o jeito de jogá-la.

   O que ele faz: lê os mesmos arquivos que `jogo/index.html` carrega, embute o
   CSS e os scripts, e troca cada caminho de imagem por um data: URI. O
   resultado não pede rede para nada.

   NÃO edite o .html gerado — ele é saída. Mexa na fonte e rode de novo:

     node teste/empacota.js                       → teste/JOGAR.html
     node teste/empacota.js meu-nome.html         → teste/meu-nome.html
     node teste/empacota.js /tmp/JOGAR.html       → caminho absoluto (CI)          */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const RAIZ = path.join(__dirname, "..");
const ler = p => fs.readFileSync(path.join(RAIZ, p), "utf8");
const destino = process.argv[2] || "JOGAR.html";
const saida = path.isAbsolute(destino) ? destino : path.join(__dirname, destino);

const TIPO = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
               ".webp": "image/webp", ".svg": "image/svg+xml" };

let embutidas = 0;
const faltando = [];
function paraDataURI(caminhoRelativoAoHTML) {
  /* os caminhos em arte/imagens.js são relativos a jogo/, que está um nível abaixo */
  const rel = caminhoRelativoAoHTML.replace(/^\.\.\//, "");
  const abs = path.join(RAIZ, rel);
  if (!fs.existsSync(abs)) { faltando.push(rel); return caminhoRelativoAoHTML; }
  embutidas++;
  const tipo = TIPO[path.extname(abs).toLowerCase()] || "application/octet-stream";
  return `data:${tipo};base64,${fs.readFileSync(abs).toString("base64")}`;
}

/* Os índices de arte são objetos montados por forEach, então não dá para trocar
   caminho por regex: avalia-se o arquivo e reserializa-se o resultado já com as
   imagens embutidas. Assim um índice novo entra sozinho, sem mexer aqui. */
const fonteImagens = ler("arte/imagens.js");
const NOMES = ["ARTE", "ARTE_CARTA", "ARTE_ITEM", "ARTE_MAPA", "ARTE_MONSTRO"];
const presentes = NOMES.filter(n => new RegExp(`\\b(const|let|var)\\s+${n}\\b`).test(fonteImagens));
const indices = new Function(`${fonteImagens}; return {${presentes.join(",")}};`)();

const converte = v =>
  typeof v === "string" ? paraDataURI(v)
  : (v && typeof v === "object") ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, converte(x)]))
  : v;

const imagensEmbutidas = Object.entries(indices)
  .map(([nome, valor]) => `const ${nome} = ${JSON.stringify(converte(valor))};`)
  .join("\n");

let html = ler("jogo/index.html");
html = html.replace(/<link rel="stylesheet" href="estilo\.css">/,
  `<style>\n${ler("jogo/estilo.css")}\n</style>`);
html = html.replace(
  /<script src="\.\.\/arte\/imagens\.js"><\/script>\s*<script src="\.\.\/data\/catalogo\.js"><\/script>\s*<script src="motor\.js"><\/script>\s*<script src="interface\.js"><\/script>\s*<script src="cartas\.js"><\/script>\s*<script src="jogo\.js"><\/script>/,
  [imagensEmbutidas, ler("data/catalogo.js"), ler("jogo/motor.js"),
    ler("jogo/interface.js"), ler("jogo/cartas.js"), ler("jogo/jogo.js")]
    .map(s => `<script>\n${s}\n</script>`).join("\n"));

/* Carimbo do commit de ORIGEM — o estado da fonte no momento de gerar. Por
   construção ele é o commit ANTERIOR ao que carrega este arquivo: gera-se,
   depois commita-se. Um carimbo "atrasado em um" é o esperado, não defeito. */
let carimbo = "";
try {
  carimbo = execSync("git log -1 --format=%h\\ %ad --date=short", { cwd: RAIZ }).toString().trim();
} catch { carimbo = "sem git"; }
html = `<!-- JAGERLARAMAIS — arquivo único gerado por teste/empacota.js
     commit ${carimbo}
     Gerado, não editado à mão. Para mudar o jogo, mexa na fonte e rode o script. -->\n${html}`;

fs.writeFileSync(saida, html);

const externos = (html.match(/<script src=|<link [^>]*href="(?!data:)/g) || []).length;
console.log(`  ${path.relative(RAIZ, saida)}`);
console.log(`  ${embutidas} imagens embutidas · ${(fs.statSync(saida).size / 1048576).toFixed(2)} MB · commit ${carimbo}`);
if (faltando.length) console.log(`  FALTANDO (${faltando.length}): ${faltando.slice(0, 6).join(", ")}`);
if (externos) { console.error(`  ERRO: sobraram ${externos} referências externas — o arquivo não é offline`); process.exit(1); }
console.log("  nenhuma referência externa — abre offline");
