/* Medição dedicada à ECONOMIA — quanto ouro entra, e contra o que ele é gasto.

   Existe porque "está muito barato" é uma frase que nenhuma das outras medições
   responde. A bateria mede estrutura, o epicos mede objetivo, o habs mede
   habilidade — e nenhum deles olha para a torneira.

   O ponto cego que este script assume e declara: o agente da bateria NÃO
   COMPRA. Isso não invalida a medida, muda o que ela é. Sem compras, o ouro
   acumulado no fim da partida é exatamente a RENDA BRUTA de um herói — que é o
   lado da conta que o desenho controla. O outro lado (o preço) é conhecido e
   fixo, então dá para pôr os dois lado a lado sem simular escolha nenhuma:

     renda por herói numa partida   ×   custo de tudo que ele pode comprar

   Se a renda paga o catálogo inteiro várias vezes, o problema não é o preço de
   um item — é a torneira. Foi o aviso deixado na v22 e o relato do playtest
   ("tá muito barato") bate com ele.

     node sim/ouro.js          → 400 partidas
     node sim/ouro.js 1500     → 1500
     node sim/ouro.js 800 farma=2   → e as variantes da bateria                */

const { carrega } = require("./motor.js");
const { jogaUma, resume } = require("./agente.js");

const args = process.argv.slice(2);
const n = parseInt(args[0], 10) || 400;
const opcoes = Object.fromEntries(args.slice(1).map(a => {
  const p = a.split("=");
  if (p.length !== 2) { console.error(`argumento inválido: "${a}"`); process.exit(1); }
  return p;
}));

const trocas = [];
/* as duas pontas da torneira, para o grupo poder testar antes de decidir */
if (opcoes.farma !== undefined)
  trocas.push([/h\.ouro \+= h\.agiu\?1:3;/, `h.ouro += h.agiu?1:${+opcoes.farma};`]);
if (opcoes.agiu !== undefined)
  trocas.push([/h\.ouro \+= h\.agiu\?1:3;/, `h.ouro += h.agiu?${+opcoes.agiu}:3;`]);
if (opcoes.matar !== undefined)
  trocas.push([/quem\.ouro\+=4;/, `quem.ouro+=${+opcoes.matar};`]);

const rotulo = Object.keys(opcoes).length
  ? Object.entries(opcoes).map(([k, v]) => `${k}=${v}`).join(" ") : "build atual";

const ctx = carrega(trocas);
const t0 = Date.now();
const porHeroi = [], porPartida = [], duracoes = [];

for (let i = 0; i < n; i++) {
  const res = jogaUma(ctx);
  if (!res.terminou) continue;
  duracoes.push(res.rodadas);
  let soma = 0;
  ctx.J.times.forEach(tm => tm.herois.forEach(h => { porHeroi.push(h.ouro); soma += h.ouro; }));
  porPartida.push(soma);
}

/* ---------- o outro lado da conta, lido do próprio catálogo ---------- */
const precos = ctx.ITENS.map(it => it.o).sort((a, b) => a - b);
const CAP = 3;                                    // inventário padrão
const buildBarato = precos.slice(0, CAP).reduce((a, b) => a + b, 0);
const buildCaro = precos.slice(-CAP).reduce((a, b) => a + b, 0);
const catalogoInteiro = precos.reduce((a, b) => a + b, 0);

const r = resume(porHeroi);
const rp = resume(porPartida);
const med = resume(duracoes).mediana;

console.log(`\n  JAGERLARAMAIS · economia · ${rotulo}`);
console.log(`  ${duracoes.length}/${n} partidas em ${((Date.now() - t0) / 1000).toFixed(1)}s`
          + `  ·  duração mediana ${med} rodadas\n`);
console.log(`  RENDA (o agente não compra, então isto é a renda bruta)`);
console.log(`    por herói, na partida inteira   mediana ${r.mediana}  (${r.min}–${r.max})`);
console.log(`    na partida, somando os dois times  mediana ${rp.mediana}`);
console.log(`    por herói, por rodada           ${(r.mediana / med).toFixed(2)}\n`);
console.log(`  PREÇO (${ctx.ITENS.length} itens na loja, inventário de ${CAP})`);
console.log(`    build completo mais barato       ${buildBarato}`);
console.log(`    build completo mais caro         ${buildCaro}`);
console.log(`    a loja INTEIRA                   ${catalogoInteiro}\n`);

const sobra = r.mediana - buildCaro;
const vezes = (r.mediana / buildCaro).toFixed(1);
console.log(`  VEREDITO`);
console.log(`    um herói termina a partida com ${r.mediana} de ouro e o build mais caro`);
console.log(`    que ele consegue vestir custa ${buildCaro} — ele paga o próprio build ${vezes}×`);
console.log(`    e ainda sobra ${sobra}.`);
if (r.mediana >= catalogoInteiro)
  console.log(`    → UM HERÓI SOZINHO paga a loja inteira (${catalogoInteiro}). A torneira é o problema,`);
else if (+vezes >= 2)
  console.log(`    → renda paga o build ${vezes}× — sobra dinheiro sem destino. A torneira é o problema,`);
else if (+vezes < 1)
  console.log(`    → renda NÃO paga um build completo — o preço é que está alto,`);
else
  console.log(`    → renda e preço estão na mesma ordem de grandeza,`);
console.log(`      e mexer no preço de um item não muda isso.\n`);
