const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { carrega } = require("./motor");

function novoJogo() {
  const jogo = carrega();
  jogo.comeca(false, false);
  return jogo;
}

test("turnos seguem AZUL, CARMIM, AZUL, CARMIM", () => {
  const jogo = novoJogo();
  const ordem = [jogo.J.vez];
  const rodadas = [jogo.J.rodada];

  for (let i = 0; i < 4; i++) {
    jogo.encerraTurno();
    ordem.push(jogo.J.vez);
    rodadas.push(jogo.J.rodada);
  }

  assert.deepEqual(ordem, [0, 1, 0, 1, 0]);
  assert.deepEqual(rodadas, [1, 1, 2, 2, 3]);
});

test("Poço fica em [8,8] no tabuleiro 11×11", () => {
  const jogo = novoJogo();
  assert.deepEqual([...jogo.POCO], [8, 8]);
});

test("produto carrega fontes separadas e não expõe o modo contra IA", () => {
  const raiz = path.join(__dirname, "..");
  const index = fs.readFileSync(path.join(raiz, "jogo/index.html"), "utf8");
  const boot = fs.readFileSync(path.join(raiz, "jogo/jogo.js"), "utf8");
  const ordem = ["motor.js", "interface.js", "cartas.js", "jogo.js"]
    .map(nome => index.indexOf(`<script src="${nome}"></script>`));

  assert.ok(ordem.every(i => i >= 0));
  assert.deepEqual([...ordem].sort((a, b) => a - b), ordem);
  assert.doesNotMatch(index + boot, /btIA|btPularIA|Jogar contra a IA|__JAGER_AI__/);
});

test("uma torre aceita mais de um golpe na mesma rodada", () => {
  const jogo = novoJogo();
  const torre = jogo.J.torres.find(t => t.t === 1);
  const [primeiro, segundo] = jogo.J.times[0].herois;
  torre.vida = 5;
  jogo.J.dados = [{ v: 6, usado: 0 }, { v: 6, usado: 0 }];

  jogo.selHeroi = primeiro;
  jogo.habAtual = 0;
  jogo.atacaTorre(torre);

  jogo.selHeroi = segundo;
  jogo.habAtual = 0;
  jogo.atacaTorre(torre);

  assert.equal(torre.vida, 3);
  assert.equal("batida" in torre, false);
});

test("escudo absorve o valor disponível, deixa passar o excedente e expira", () => {
  const jogo = novoJogo();
  const atacante = jogo.J.times[0].herois[0];
  const alvo = jogo.J.times[1].herois[0];
  alvo.vida = 10;
  alvo.vidaMax = 10;
  alvo.arm = 0;
  alvo.itens = [];
  alvo.esc = 5;

  jogo.aplicaDano(atacante, alvo, 7, "teste", false);

  assert.equal(alvo.esc, 0);
  assert.equal(alvo.vida, 8);

  alvo.esc = 4;
  jogo.fimDaRodada();
  assert.equal(alvo.esc, 0);
});

test("último golpe no Dragão concede a Herança", () => {
  const jogo = novoJogo();
  const heroi = jogo.J.times[0].herois[0];
  jogo.J.poco = { id: "dragao", vida: 1, vidaMax: 8, volta: 0 };
  jogo.J.dados = [{ v: 6, usado: 0 }];
  jogo.selHeroi = heroi;
  jogo.habAtual = 0;

  jogo.atacaEpico(jogo.J.poco);

  assert.equal(jogo.J.poco.vida, 0);
  assert.equal(jogo.J.times[0].dragoes, 1);
  assert.ok(jogo.J.times[0].herois.every(h => h.extraPoder >= 1));
});
