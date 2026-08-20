/* Teste do CENÁRIO do tabuleiro — as casas, o mato, a sucata desenhados por
   cima do terreno.

   Cenário é enfeite, e enfeite quebra jogo de três jeitos conhecidos. Este
   arquivo existe para pegar os três:

   1. ARMADILHA DO getBBox. O `viewBox` do mapa sai de `getBBox()`, não de
      número escrito no HTML. Uma peça que escape do próprio hexágono infla a
      caixa e ENCOLHE O MAPA INTEIRO — já aconteceu uma vez, com um anel de
      raio 3 em volta da ward. Toda peça de cenário tem de caber dentro do
      hexágono dela.

   2. CLIQUE ROUBADO. O alvo de movimento é o <polygon> da casa. Peça de
      cenário desenhada por cima que aceite ponteiro come o toque, e o jogador
      fica sem entender por que não anda.

   3. NÉVOA VAZADA. Casa que o jogador não enxerga não pode entregar o que tem
      dentro. O cenário obedece à mesma névoa do resto, ou vira radar de graça.

   O cenário é FUNÇÃO PURA de (c,r): mesma casa, mesmo desenho, sempre. Casa
   que o jogador decorou não pode mudar de cara entre uma partida e outra —
   e é isso que torna este teste possível sem navegador.

   Uso:  node sim/cenario.js                                                    */

const { carrega } = require("./motor.js");

let passou = 0, falhou = 0;
const ok = (nome, cond, extra) => {
  if (cond) { passou++; console.log("  \x1b[32m✓\x1b[0m " + nome); }
  else { falhou++; console.log("  \x1b[31m✗\x1b[0m " + nome + (extra ? "\n      " + extra : "")); }
};

const G = carrega();
const { cenarioDa, centro, R_HEX, COLS, LINS, noTab, ehMato, ladoDoRio, ehRio, ruido } = G.__ponte;

/* O limite honesto é o INRAIO, não o raio. O hexágono é apontado: o raio vai
   até o vértice, e uma peça a essa distância na direção do lado já saiu da
   casa. Inraio = R·√3/2 é o maior círculo que cabe dentro do hexágono. */
const INRAIO = R_HEX * Math.sqrt(3) / 2;

console.log("\nCENÁRIO DO TABULEIRO\n");

/* ---------- 1 · nada escapa do hexágono ---------- */
{
  let pior = 0, ondePior = null, total = 0;
  for (let r = 0; r < LINS; r++) for (let c = 0; c < COLS; c++) {
    if (!noTab(c, r)) continue;
    const [cx, cy] = centro(c, r);
    for (const p of cenarioDa(c, r)) {
      total++;
      /* raio de cada peça: o ponto mais distante que ela pinta */
      const d = Math.hypot(p.x - cx, p.y - cy) + (p.raio || 0);
      if (d > pior) { pior = d; ondePior = c + "," + r + " (" + p.tipo + ")"; }
    }
  }
  ok("o cenário desenha alguma coisa", total > 100, "peças: " + total);
  ok("nenhuma peça escapa do hexágono (armadilha do getBBox)",
     pior <= INRAIO,
     "pior alcance " + pior.toFixed(1) + " > inraio=" + INRAIO.toFixed(1) + " em " + ondePior);
}

/* ---------- 2 · determinismo ---------- */
{
  const a = JSON.stringify(cenarioDa(3, 4));
  const b = JSON.stringify(cenarioDa(3, 4));
  ok("a mesma casa desenha igual sempre", a === b);
  const outra = JSON.stringify(cenarioDa(4, 3));
  ok("casas diferentes desenham diferente", a !== outra);
}

/* ---------- 3 · os dois mundos ---------- */
{
  let casasF = 0, casasV = 0, ferroF = 0, ferroV = 0, hexF = 0, hexV = 0;
  /* barraco de lata é vocabulário de ferro velho, não de casa pintada — a
     primeira versão deste teste contava os dois como "casa" e por isso não
     enxergava a diferença entre as duas margens */
  const eCasa  = p => p.tipo === "casa" || p.tipo === "varal";
  const eFerro = p => p.tipo === "contentor" || p.tipo === "tambor"
                   || p.tipo === "sucata"    || p.tipo === "barraco";
  for (let r = 0; r < LINS; r++) for (let c = 0; c < COLS; c++) {
    if (!noTab(c, r) || ehRio(c, r)) continue;
    const pecas = cenarioDa(c, r);
    if (ladoDoRio(c, r) > 0) { hexF++; casasF += pecas.filter(eCasa).length; ferroF += pecas.filter(eFerro).length; }
    else                     { hexV++; casasV += pecas.filter(eCasa).length; ferroV += pecas.filter(eFerro).length; }
  }
  ok("o rio divide o tabuleiro em duas metades do mesmo tamanho",
     Math.abs(hexF - hexV) <= 1, "favela " + hexF + " · ferro velho " + hexV);
  ok("a margem azul é onde moram as casas pintadas", casasF > casasV * 2,
     "casas: favela " + casasF + " · ferro velho " + casasV);
  ok("a margem carmim é onde mora a sucata", ferroV > ferroF * 2,
     "sucata: ferro velho " + ferroV + " · favela " + ferroF);
  ok("os dois lados têm cenário de verdade", casasF > 6 && ferroV > 6,
     "casas " + casasF + " · sucata " + ferroV);
}

/* ---------- 4 · cenário não come clique ---------- */
{
  const todas = [];
  for (let r = 0; r < LINS; r++) for (let c = 0; c < COLS; c++)
    if (noTab(c, r)) todas.push(...cenarioDa(c, r));
  ok("nenhuma peça de cenário se declara clicável",
     todas.every(p => !p.clicavel && !p.onclick));
}

/* ---------- 5 · O RUÍDO PRECISA SER RUÍDO ----------
   O desenho todo é sorteado por `_cRnd(casa, semente)`. Uma semente que não
   espalhe faz uma regra inteira nunca disparar — sem erro e sem aviso.

   ACONTECEU: a versão de uma rodada de mistura devolvia, para a semente 90,
   nada acima de 0,64 em nenhuma das 121 casas. A regra que decidia quais casas
   de rota recebem construção estava escrita `> .64`, e o resultado foi rota
   inteira sem cenário — parecendo escolha de design, não defeito.

   Este teste varre 128 sementes e cobra dispersão de verdade em cada uma. */
{
  const ruins = [];
  for (let s = 0; s < 128; s++) {
    let n = 0, soma = 0, min = 1, max = 0;
    for (let r = 0; r < LINS; r++) for (let c = 0; c < COLS; c++) {
      if (!noTab(c, r)) continue;
      const v = ruido(c, r, s);
      n++; soma += v; min = Math.min(min, v); max = Math.max(max, v);
    }
    const media = soma / n;
    if (media < .38 || media > .62 || min > .10 || max < .90)
      ruins.push(s + " (média " + media.toFixed(2) + ", " + min.toFixed(2) + "–" + max.toFixed(2) + ")");
  }
  ok("as 128 sementes de ruído espalham pelo tabuleiro", ruins.length === 0,
     "degeneradas: " + ruins.slice(0, 6).join(" · "));
}

/* ---------- 5 · ORÇAMENTO DE RUÍDO ----------
   A queixa foi literal: *"o mapa muito carregado de informação, de casas no
   cenário"*. E estava certa — 94% das casas de rota tinham construção, então
   nenhuma dizia nada e todas disputavam leitura com herói, torre, névoa e
   alvo de movimento.

   Cenário é FUNDO. O tabuleiro precisa de chão vazio do mesmo jeito que um
   texto precisa de margem: é o vazio que faz o cheio significar alguma coisa.
   Estes três números são o orçamento, e existem para impedir que a próxima
   rodada de "ficou bonito, põe mais" volte a encher tudo. */
{
  const constr = p => p.tipo === "casa" || p.tipo === "barraco" || p.tipo === "contentor";
  let rota = 0, comConstr = 0, vazias = 0, maiorRota = 0;
  for (let r = 0; r < LINS; r++) for (let c = 0; c < COLS; c++) {
    if (!noTab(c, r) || ehRio(c, r) || ehMato(c, r)) continue;
    const pc = cenarioDa(c, r);
    rota++;
    if (pc.some(constr)) comConstr++;
    if (!pc.length) vazias++;
    maiorRota = Math.max(maiorRota, pc.length);
  }
  const pct = Math.round(comConstr / rota * 100);
  ok("menos de 40% das casas de rota têm construção", pct < 40,
     pct + "% têm construção (" + comConstr + " de " + rota + ")");
  ok("pelo menos um terço das casas de rota fica vazia", vazias >= rota / 3,
     "só " + vazias + " vazias de " + rota);
  ok("nenhuma casa de rota passa de 2 peças", maiorRota <= 2, "maior: " + maiorRota);
}

/* NÃO existe aqui um teste de "guia e jogo pintam igual": sim/testes.js já
   tem um, cobrindo cinco tokens em vez de três. Dois testes disputando o mesmo
   trabalho é pior que um — quando um quebra, ninguém sabe qual é o dono da
   regra. Se este arquivo for o lugar certo um dia, o de lá é que sai. */

console.log("\n  " + passou + " passaram · " + falhou + " falharam\n");
process.exit(falhou ? 1 : 0);
