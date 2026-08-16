/* Vale a pena usar a habilidade, ou é melhor só bater com a básica?

   Existe porque "otimiza as habilidades de controle" é opinião até virar número.
   A régua é a única honesta que este jogo tem: com o MESMO dado, quanto a
   habilidade entrega comparada à básica DO PRÓPRIO HERÓI. Se a resposta for
   "menos", o jogador está pagando um dado mais raro por menos resultado — e
   nenhum texto de carta conserta isso.

   Tudo é convertido em pontos de vida, porque dano, cura e escudo fazem a mesma
   coisa na mesa: adiam a morte de alguém em um ponto. O que NÃO cabe em ponto de
   vida (prender, puxar, doar dado, executar) sai na coluna `utilidade`, e é
   justamente onde o número para de valer — ver a nota no fim da saída.

     node sim/habs.js         → área contada pegando 1 inimigo
     node sim/habs.js 2       → área contada pegando 2

   A escala vem do MOTOR (`escalaDe`), não de uma cópia local: quando a escala do
   controle ou da Ultimate mudar em jogo.js, esta medição acompanha sozinha.  */

const { carrega } = require("./motor.js");

const g = carrega();
const C = g.CATALOGO;
const ARM = 2;                          // armadura típica de alvo no meio da partida
const ALVOS = +process.argv[2] || 1;    // quantos inimigos a área pega

/* valor em pontos de vida de um efeito, com dado F, Poder P e a escala do slot */
function valor(ef, F, P, escala) {
  const golpe = mult => Math.max(1, Math.round(F * mult * escala) + P - ARM);
  let v = 0;
  /* perfurante não desconta armadura — `golpe()` desconta, então tem conta própria */
  if (ef.dano) v += ef.perfura
    ? Math.max(1, Math.round(F * ef.dano * escala) + P)
    : golpe(ef.dano);
  if (ef.danoFixo) v += ef.danoFixo;              // ignora armadura
  if (ef.extra) v += ef.extra;
  if (ef.escudo) v += F + ef.escudo;
  if (ef.cura) v += ef.cura;
  /* Valor GUARDADO vale metade. Marca e recarga só pagam se um segundo golpe
     acertar — o alvo certo, antes de expirar, com dado sobrando. Contar 100%
     fazia "guardar" empatar com "bater agora", que é justamente o engano que
     esta tabela existe para desfazer. */
  if (ef.marca) v += ef.marca * 0.5;      // no inimigo: ele anda, morre, muda de foco
  if (ef.recarga) v += ef.recarga * 0.7;  // em si mesmo: quem carrega escolhe quando disparar
  if (ef.danoVizinhos) v += golpe(ef.danoVizinhos) * ALVOS;
  if (ef.danoRaio) v += golpe(1) * ALVOS;
  if (ef.area) v += golpe(ef.dano || 1) * 0.5;    // respingo em ~meio alvo
  /* EFEITO COM PRAZO (v25). Vale o total, e vale CHEIO: ele não é valor
     guardado como a marca — não depende de um segundo golpe acertar, cobra
     sozinho no início de cada turno do alvo. E cobra por fora da armadura e do
     escudo, então nem entra na conta de `golpe()`, que desconta ARM.
     O único desconto é a morte do alvo antes de o prazo vencer, e a esse preço
     o dano já foi feito de outro jeito. */
  if (ef.dot) v += ef.dot.dano * ef.dot.rodadas;
  /* ZONA vale metade do que cobraria cheia: ela só paga se o adversário estiver
     (ou insistir em ficar) dentro. Território negado que o outro simplesmente
     contorna vale o contorno, não o dano — e contornar é o resultado comum. */
  if (ef.zona) v += ef.zona.dano * 2 * 0.5;
  return v;
}

/* o que não cabe em ponto de vida — a coluna onde o número para de valer */
function utilidade(ef) {
  const u = [];
  if (ef.prende || ef.prendeVizinhos) u.push("prende");
  if (ef.puxar) u.push("puxa");
  if (ef.empurrar) u.push("empurra");
  if (ef.intocavel) u.push("intocável");
  if (ef.doar) u.push("doa dado");
  if (ef.ward) u.push("ward");
  if (ef.executa) u.push("executa " + ef.executa);
  if (ef.revive) u.push("revive");
  if (ef.ouro || ef.ouroSeMatar) u.push("ouro");
  if (ef.alcExtra) u.push("+alcance");
  if (ef.bonusFerido) u.push("+ferido");
  return u.join(", ");
}

const linhas = [];
Object.entries(C).forEach(([id, h]) => {
  const P = h.poder;
  h.habs.forEach((hb, i) => {
    if (i === 0) return;                            // a básica é a régua
    const F = hb.f;                                 // no dado mínimo dela
    const basica = valor(h.habs[0].ef, F, P, g.escalaDe(0));
    const dela = valor(hb.ef, F, P, g.escalaDe(i));
    linhas.push({ n: h.n, slot: i, hab: hb.n, f: F,
                  basica: +basica.toFixed(1), dela: +dela.toFixed(1),
                  dif: +(dela - basica).toFixed(1), u: utilidade(hb.ef) });
  });
});

const w = (s, n) => String(s).padEnd(n).slice(0, n);
const num = (x, n) => String(x).padStart(n);
function tabela(titulo, slot) {
  console.log(`\n  ${titulo}\n`);
  console.log("  " + w("herói", 10) + w("habilidade", 17) + "F  básica  ela   dif   utilidade");
  linhas.filter(l => l.slot === slot).sort((a, b) => a.dif - b.dif).forEach(l =>
    console.log("  " + w(l.n, 10) + w(l.hab, 17) +
      `${l.f}   ${num(l.basica, 4)}  ${num(l.dela, 4)}  ${num(l.dif, 4)}   ${l.u}`));
}

console.log(`\n  JAGERLARAMAIS · habilidade contra a própria básica` +
            `\n  dado mínimo de cada uma · alvo com ${ARM} de armadura · área pegando ${ALVOS}` +
            `\n  escala: controle ×${g.ESCALA_CTRL} · Ultimate ×${g.ESCALA_ULT}`);
tabela("CONTROLE (slot do meio)", 1);
tabela("ULTIMATES", 2);

/* −0,5 e não 0: com meio ponto de folga a tabela para de acusar diferença que é
   só arredondamento, e o que sobra na lista é diferença de verdade. */
const ruins = linhas.filter(l => l.dif < -0.5 && !l.u);
console.log(`\n  ${ruins.length ? "SEM PAGAR O PRÓPRIO DADO (e sem utilidade que justifique):" : "nenhuma habilidade fica abaixo da própria básica sem utilidade que justifique"}`);
ruins.forEach(l => console.log(`    · ${l.n} — ${l.hab} (${l.dif})`));

console.log(`
  Onde este número NÃO vale: as linhas com utilidade. Doar Dado e Empréstimo
  aparecem em -10 e 0 porque devolvem uma AÇÃO INTEIRA a um aliado, e ação não
  cabe em ponto de vida. Sombra (intocável) e as que prendem valem o que a
  situação valer. A tabela serve para achar o que é ruim SEM desculpa.
`);
