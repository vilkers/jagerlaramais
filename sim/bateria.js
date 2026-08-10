/* Roda N partidas de uma variante e imprime o resumo.

   Uso:
     node sim/bateria.js                    → build atual, 200 partidas
     node sim/bateria.js 500                → build atual, 500 partidas
     node sim/bateria.js 300 torre=2        → e daí em diante, variantes

   Variantes disponíveis:
     comp=N      ouro extra por herói para o SEGUNDO jogador (compensação)
     mapa=N      lado do tabuleiro (7 hoje; 9 dá rota de 14, 11 dá rota de 18)
     torre=N     vida da torre
     mov=EXPR    fórmula do Dado Mestre (ex.: mov=2d10, mov=1d20, mov=1d6)
     acao=N      faces do dado de ação (6 hoje, 8 na proposta do Matheus)          */

const { carrega } = require("./motor");
const { jogaUma, resume, assimetria } = require("./agente");

const args = process.argv.slice(2);
const n = parseInt(args[0], 10) || 200;
/* Falha alto em argumento malformado. Descartar em silêncio faz a bateria rodar
   o build atual achando que rodou a variante — e o número parece válido. */
const opcoes = Object.fromEntries(args.slice(1).map(a => {
  const p = a.split("=");
  if (p.length !== 2 || !p[0] || !p[1]) {
    console.error(`\n  argumento inválido: "${a}"  — use chave=valor, um por argumento`);
    console.error(`  atenção: no zsh, "mov=2d10 acao=8" entre aspas vira UM argumento\n`);
    process.exit(1);
  }
  return p;
}));

function rolagem(expr) {                       // "2d10" → "(1+Math.floor(...))*2 somados"
  const m = /^(\d+)d(\d+)$/.exec(expr);
  if (!m) throw new Error("fórmula de dado inválida: " + expr);
  const [, qtd, faces] = m;
  return Array.from({ length: +qtd },
    () => `(1+Math.floor(Math.random()*${faces}))`).join("+");
}

const trocas = [];
if (opcoes.alterna) trocas.push([/J\.rodada\+\+; reg\("r",/,
                                 `J.primeiro=1-J.primeiro; J.rodada++; reg("r",`]);
if (opcoes.mapa)  trocas.push([/^const N=\d+;$/m, `const N=${+opcoes.mapa};`]);
if (opcoes.torre) trocas.push([/const VIDA_TORRE=\d+/, `const VIDA_TORRE=${+opcoes.torre}`]);
if (opcoes.mov)   trocas.push([/const m=1\+Math\.floor\(Math\.random\(\)\*6\)\+extra;/,
                               `const m=${rolagem(opcoes.mov)}+extra;`]);
if (opcoes.acao)  trocas.push([/J\.dados=\[0,1,2\]\.map\(\(\)=>\(\{v:1\+Math\.floor\(Math\.random\(\)\*6\),usado:0\}\)\);/,
                               `J.dados=[0,1,2].map(()=>({v:1+Math.floor(Math.random()*${+opcoes.acao}),usado:0}));`]);

const rotulo = Object.keys(opcoes).length
  ? Object.entries(opcoes).map(([k, v]) => `${k}=${v}`).join(" ")
  : "build atual";

/* compensação para o SEGUNDO jogador, aplicada depois que a partida monta.
   Não passa por troca de texto: é estado, não regra escrita no arquivo. */
const comp = opcoes.comp ? +opcoes.comp : 0;
const aoIniciar = comp
  ? g => g.J.times[1].herois.forEach(h => { h.ouro += comp; })
  : null;

const ctx = carrega(trocas);
const t0 = Date.now();
const jogos = [];
let naoTerminou = 0;

for (let i = 0; i < n; i++) {
  const r = jogaUma(ctx, { aoIniciar });
  r.terminou ? jogos.push(r) : naoTerminou++;
}

const rodadas = resume(jogos.map(j => j.rodadas));
const assim = assimetria(jogos.filter(j => j.vencedor === 0).length,
                         jogos.filter(j => j.vencedor === 1).length);
const media = campo => +(jogos.reduce((a, j) => a + j[campo], 0) / jogos.length).toFixed(1);

console.log(`\n  JAGERLARAMAIS · ${rotulo}`);
console.log(`  ${jogos.length}/${n} partidas concluídas em ${((Date.now() - t0) / 1000).toFixed(1)}s`
          + (naoTerminou ? `  (${naoTerminou} estouraram o teto)` : ""));
console.log(`\n  rodadas    mediana ${rodadas.mediana}   média ${rodadas.media}   `
          + `faixa ${rodadas.min}–${rodadas.max}`);
console.log(`  por partida  ${media("acoes")} ações · ${media("torresCaidas")}/12 torres · `
          + `${media("golpesTorre")} golpes de herói em torre`);
console.log(`  quem começa  ${assim.taxa} de vitórias (${assim.primeiro}×${assim.segundo}, z=${assim.z})`
          + `  ${assim.significativo ? "← VANTAGEM REAL" : "— dentro do ruído"}`);
console.log("");
