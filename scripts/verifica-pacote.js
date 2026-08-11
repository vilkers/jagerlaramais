/* Confirma que o pacote offline versionado representa as fontes atuais.
   O carimbo do commit é ignorado porque, por construção, ele fica um commit atrás. */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const RAIZ=path.join(__dirname,"..");
const atual=path.join(RAIZ,"teste/JOGAR.html");
const temporario=path.join(os.tmpdir(),`jagerlaramais-${process.pid}.html`);
const semCarimbo=html=>html.replace(/^<!-- JAGERLARAMAIS[\s\S]*?-->\n/,"");

try{
  const r=spawnSync(process.execPath,[path.join(RAIZ,"teste/empacota.js"),temporario],
    {cwd:RAIZ,encoding:"utf8"});
  if(r.status!==0){process.stderr.write(r.stdout+r.stderr);process.exit(r.status||1);}
  if(!fs.existsSync(atual)||semCarimbo(fs.readFileSync(atual,"utf8"))!==semCarimbo(fs.readFileSync(temporario,"utf8"))){
    console.error("teste/JOGAR.html está desatualizado. Rode: npm run atualizar");
    process.exitCode=1;
  }else console.log("Pacote offline sincronizado.");
}finally{
  if(fs.existsSync(temporario))fs.unlinkSync(temporario);
}
