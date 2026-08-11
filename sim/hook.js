/* Ponte entre o Claude Code e `sim/docs.js`.

   Roda como hook PostToolUse (ver `.claude/settings.json`): toda vez que alguém
   edita `jogo/jogo.js` ou `data/catalogo.js` numa sessão do Claude, este script
   confere a documentação e devolve o resultado para o modelo ler.

   Por que existe: a regra "rode `node sim/docs.js` depois de mexer em número" só
   vale se alguma coisa a executar sem ninguém lembrar. Regra que depende de memória
   humana é a mesma regra que deixou o README anunciando Nexus com 5 de vida.

   É em Node, e não em shell, porque os três usam sistemas diferentes — script .sh
   quebraria no Windows sem Git Bash.

   Entrada: o JSON do hook, por stdin.
   Saída:   JSON com `additionalContext` quando há divergência; silêncio quando não há.
   Nunca falha a edição: documentação divergente é aviso, não erro de código.        */

const { execFileSync } = require("child_process");
const path = require("path");

const OLHO_EM = [/jogo[\/\\]jogo\.js$/, /data[\/\\]catalogo\.js$/];
const RAIZ = path.join(__dirname, "..");

let bruto = "";
process.stdin.on("data", d => (bruto += d));
process.stdin.on("end", () => {
  let arquivo = "";
  try {
    const ev = JSON.parse(bruto || "{}");
    arquivo = (ev.tool_input && ev.tool_input.file_path)
           || (ev.tool_response && ev.tool_response.filePath) || "";
  } catch { /* payload estranho: não é problema do jogo, sai quieto */ }

  if (!arquivo || !OLHO_EM.some(re => re.test(arquivo))) process.exit(0);

  let saida, ok = true;
  try {
    saida = execFileSync(process.execPath, [path.join(RAIZ, "sim/docs.js")],
                         { cwd: RAIZ, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    ok = false;
    saida = (e.stdout || "") + (e.stderr || "");
  }
  if (ok) process.exit(0);                      // tudo de acordo: não polui a conversa

  const divergencias = saida.split("\n").filter(l => l.includes("✗")).join("\n");
  console.log(JSON.stringify({
    systemMessage: "A documentação divergiu do código — veja o detalhe na resposta.",
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext:
        `Você mudou ${path.basename(arquivo)} e a documentação ficou para trás:\n\n` +
        `${divergencias}\n\n` +
        `Conserte antes de seguir: \`node sim/docs.js --escrever\` acerta os números marcados; ` +
        `o resto é texto e precisa de leitura. E toda mudança de número vira patch note ` +
        `em docs/patch-notes.md, dizendo de quanto para quanto.`
    }
  }));
  process.exit(0);
});
