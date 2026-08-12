/* Roda N partidas de uma variante e imprime o resumo.

   ─────────────────────────────────────────────────────────────────────────────
   O QUE ESTA BATERIA NÃO CONSEGUE MEDIR — leia antes de confiar no número.

   O agente escolhe herói e habilidade quase ao acaso. Isso faz dela um bom
   instrumento para ESTRUTURA — geometria, regra de onda, posição de torre, ritmo —
   e um instrumento CEGO para AGÊNCIA: qualquer mecânica cujo valor dependa de o
   jogador escolher bem passa despercebida.

   Isso foi medido, não suposto. Dando à Retomada 1, 2 e 3 dados extras por grau de
   atraso — até 6 dados a mais por turno — a vitória de quem começa ficou em 52,2%,
   53,0% e 52,9% contra 52,9% sem nada. Resposta-dose completamente plana: dado a
   mais não vira vitória na mão de quem joga ao acaso.

   Consequência prática: `quem começa` é confiável para mudança de mapa, de torre e
   de onda. Para épico, Retomada, Prioridade, Placas, itens e cartas, ele mede só o
   CUSTO (dado gasto, dano levado) e não o PRÊMIO. O sintoma é fácil de reconhecer:
   na medição do poço, o time que levava 62% dos épicos perdia a partida.
   Essas mecânicas se validam em playtest humano. Ver docs/patch-notes.md, v0.5.5.
   ─────────────────────────────────────────────────────────────────────────────

   Uso:
     node sim/bateria.js                    → build atual, 200 partidas
     node sim/bateria.js 500                → build atual, 500 partidas
     node sim/bateria.js 300 torre=2        → e daí em diante, variantes

   Variantes disponíveis:
     comp=N      ouro extra por herói para o SEGUNDO jogador (compensação)
     mapa=N      lado do tabuleiro (8 hoje; 9 dá rota de 14, 11 dá rota de 18)
     torre=N     vida da torre
     mov=EXPR    fórmula do Dado Mestre (ex.: mov=2d10, mov=1d20, mov=1d6)
     acao=N      faces do dado de ação (6 hoje, 8 na proposta do Matheus)
     epico=off   o poço nunca abre — nem Dragão nem Barão descem
     retomada=off  desliga o freio de bola de neve (nada de dado extra por atraso)
     revide=off  o morador do poço não cobra pedágio de quem bate nele
     dragao=N    rodada a partir da qual o Dragão desce (5 hoje)
     barao=N     rodada a partir da qual quem desce é o Barão (8 hoje)
     vdragao=N   vida do Dragão · vbarao=N vida do Barão
     heranca=N   Poder por Dragão levado · furia=N Poder da Fúria do Barão
     ondas=off   a Fúria do Barão para de empurrar as ondas sozinha                */

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

/* épico e retomada saem por troca de texto para que a medição "sem" seja o build
   antigo de verdade, e não o novo com o efeito zerado por estado. */
if (opcoes.epico === "off")
  trocas.push([/if\(p\.vida<=0&&J\.rodada>=p\.volta\)\{/, "if(false){"]);
if (opcoes.retomada === "off")
  trocas.push([/const atraso=t=>\{ const d=perigo\(t\)-perigo\(1-t\); return d>=4\?2:d>=2\?1:0; \};/,
               "const atraso=t=>0;"]);
if (opcoes.dragao) trocas.push([/const R_DRAGAO=\d+/, `const R_DRAGAO=${+opcoes.dragao}`]);
if (opcoes.barao)  trocas.push([/R_BARAO=\d+/, `R_BARAO=${+opcoes.barao}`]);
if (opcoes.vdragao) trocas.push([/n:"Dragão", vida:\d+/, `n:"Dragão", vida:${+opcoes.vdragao}`]);
if (opcoes.vbarao)  trocas.push([/n:"Barão",  vida:\d+/, `n:"Barão",  vida:${+opcoes.vbarao}`]);
if (opcoes.revide === "off")
  trocas.push([/const levou=Math\.min\(d\.revide,h\.vida-1\);/, "const levou=0;"]);
/* presença, não verdade: heranca=0 é a variante mais interessante das duas */
if (opcoes.heranca !== undefined)
  trocas.push([/const DRAGAO_PODER=\d+/, `const DRAGAO_PODER=${+opcoes.heranca}`]);
if (opcoes.escudobarao !== undefined)
  trocas.push([/const BARAO_ESCUDO=\d+/, `const BARAO_ESCUDO=${+opcoes.escudobarao}`]);
if (opcoes.ondas === "off") trocas.push([/d\+=furia\[0\]-furia\[1\];/, ""]);

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
          + `${media("golpesTorre")} golpes de herói em torre · ${media("golpesNexus")} no Nexus`);
const soma = campo => +(jogos.reduce((a, j) => a + j[campo][0] + j[campo][1], 0) / jogos.length).toFixed(2);
console.log(`  épicos       ${soma("dragoes")} Dragões · ${soma("baroes")} Barões · `
          + `${media("golpesEpico")} golpes de herói em épico`);
console.log(`  quem começa  ${assim.taxa} de vitórias (${assim.primeiro}×${assim.segundo}, z=${assim.z})`
          + `  ${assim.significativo ? "← VANTAGEM REAL" : "— dentro do ruído"}`);
console.log("");
