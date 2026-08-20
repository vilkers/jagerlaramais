/* A FAIXA EXATA MUDOU O QUE, EXATAMENTE?

   A v49 trocou "Força mínima" (um 6 pagava qualquer habilidade) por FAIXA EXATA
   (1–2 básica, 3–5 do meio, 6 Ultimate). O pedido era de sensação — *"não é 1-2
   ou mais, é só 1 ou 2 e acabou"* —, mas sensação boa com número ruim continua
   sendo número ruim, e três coisas podiam quebrar:

     · DADO MORTO. Se um dado cai numa faixa que ninguém do time consegue usar,
       ele vira turno perdido — e turno perdido é o pior tipo de azar, porque o
       jogador não escolheu nada. É o risco central da regra;
     · ULTIMATE RARA DEMAIS. Antes, todo dado 5 e 6 abria Ultimate. Agora só o 6.
       Se a conta cair demais, a partida vira troca de básicas;
     · PARTIDA MAIS LONGA. Menos Ultimate e básica mais fraca podem esticar o
       jogo sem que ninguém tenha pedido isso.

   Este script mede os três LADO A LADO na mesma execução: a regra nova contra a
   regra velha, com o MESMO catálogo e os MESMOS heróis. A regra velha é
   reconstruída por troca de texto — `dadoServe` volta a ser "vale o piso da
   faixa ou mais" —, que é exatamente o que a v48 fazia com os `f:` do catálogo.

   Por que A/B na mesma execução e não "roda, anota, muda, roda de novo": duração
   medida assim tem ±6 rodadas de ruído em n=120. Já aconteceu neste projeto —
   o mesmo build deu 44, 48 e 50. Um número solto aqui não decide nada.

     node sim/faixas.js          → 200 partidas de cada lado
     node sim/faixas.js 400      → 400 de cada
     node sim/faixas.js 200 facil                                                */

const { carrega } = require("./motor.js");

const n = parseInt(process.argv[2], 10) || 200;
const nivel = process.argv[3] || "dificil";

/* a v48: o dado vale se for do piso da faixa PRA CIMA */
const TROCA_VELHA = [[
  /const dadoServe=\(hb,quem,v\)=>faixaDeHab\(hb,quem\)\.includes\(v\);/,
  "const dadoServe=(hb,quem,v)=>v>=Math.min(...faixaDeHab(hb,quem));"
]];

const ROTAS = ["topo", "selva", "meio", "adc", "sup"];

function mede(g, sementes) {
  g.simMode = true;
  const danos = [];                  // todo dano de herói em herói
  let dadosMortos = 0, dadosVistos = 0, rodadas = 0, terminadas = 0;
  let ultsTotais = 0, meiosTotais = 0, basicasTotais = 0;

  /* QUANTAS ULTIMATES SAEM POR PARTIDA — lido do registro da partida, e não de
     um contador enfiado no motor. Motivo já conhecido aqui: o motor roda dentro
     de um `vm`, e envolver uma função pela ponte não muda quem as funções
     internas chamam — contador assim dá zero com muita convicção. O registro é
     o que o jogador leu na tela, então é a fonte certa. */
  function contaDoRegistro() {
    const nomes = {};
    g.todos().forEach(h => h.habs.forEach((hb, i) => { nomes[hb.n] = i; }));
    g.J.log.forEach(l => {
      const m = /usa (.+?) \(Força/.exec(l.txt || "");
      if (!m) return;
      const slot = nomes[m[1]];
      if (slot === 2) ultsTotais++;
      else if (slot === 1) meiosTotais++;
      else if (slot === 0) basicasTotais++;
    });
  }

  /* Um dado está MORTO quando nenhum herói vivo do lado da vez consegue gastá-lo
     em nada — nem habilidade, nem movimento. É a conta que importa: o motor deixa
     virar movimento, e por isso "fora da faixa" não é sinônimo de perdido. */
  function olhaMao(lado) {
    g.J.dados.forEach(d => {
      if (d.usado) return;
      dadosVistos++;
      const alguem = g.vivos(lado).some(h =>
        !h.agiu && h.habs.some(hb => g.dadoServe(hb, h, d.v)));
      if (!alguem) dadosMortos++;
    });
  }

  function turnoIA(lado) {
    g.nivelIA = nivel;
    const piso = g.NIVEIS_IA[nivel].minimo;
    g.iaCompra(lado);
    g.iaJogaCartas(lado);
    olhaMao(lado);

    const vidaAntes = new Map(g.todos().map(h => [h.id + ":" + h.t, h.vida]));
    const agiuAntes = new Map(g.todos().map(h => [h.id + ":" + h.t, h.agiu]));

    let guarda = 0;
    while (guarda++ < 45 && g.J.fim === null && g.J.vez === lado) {
      if (g.iaMelhorJogada(lado, piso)) continue;
      let moveu = false;
      for (const h of g.vivos(lado)) {
        const dest = g.iaDestino(h, lado);
        if (!dest || !dest.p) continue;
        g.limpaModo(); g.selHeroi = h; g.modo = "mover"; g.calcula();
        const d0 = g.dist(...h.pos, ...dest.p);
        const passo = g.mover
          .filter(p => g.dist(...p, ...dest.p) < d0)
          .sort((a, b) => g.dist(...a, ...dest.p) - g.dist(...b, ...dest.p))[0];
        if (passo) { g.moveAte(...passo); moveu = true; break; }
      }
      if (moveu) continue;
      if (g.iaPlanejaAlcance(lado)) continue;
      break;
    }
    /* quanto de vida saiu deste turno, e de quais slots — lido do tabuleiro, que
       é o único jeito honesto aqui: o motor roda dentro de um `vm` e trocar
       função pela ponte não muda quem as funções internas chamam */
    g.todos().forEach(h => {
      const k = h.id + ":" + h.t;
      const dif = (vidaAntes.get(k) || 0) - h.vida;
      if (dif > 0) danos.push(dif);
    });
    g.iaPlantaWards(lado);
    if (g.J.fim === null) g.encerraTurno();
    return agiuAntes;
  }

  for (let p = 0; p < n; p++) {
    g.TIMES = sementes[p];
    g.comeca(false, false);
    let passos = 0;
    while (passos++ < 400 && g.J.fim === null && g.J.fase === "jogando") turnoIA(g.J.vez);
    rodadas += g.J.rodada;
    if (g.J.fim !== null) terminadas++;
    contaDoRegistro();
  }
  return { rodadas: rodadas / n, terminadas, danos, dadosMortos, dadosVistos,
           ults: ultsTotais / n, meios: meiosTotais / n, basicas: basicasTotais / n };
}

/* MESMOS times nos dois lados do A/B: comparar builds com drafts diferentes é
   comparar drafts. As sementes são sorteadas uma vez e usadas duas. */
const base = carrega();
base.simMode = true; base.novo();
const sementes = [];
for (let p = 0; p < n; p++) {
  const t0 = [], t1 = [];
  ROTAS.forEach(r => {
    const pool = Object.keys(base.CATALOGO).filter(id => base.CATALOGO[id].pos === r);
    const emb = pool.slice().sort(() => Math.random() - 0.5);
    t0.push(emb[0]); t1.push(emb[1] || emb[0]);
  });
  sementes.push([t0, t1]);
}

const inicio = Date.now();
const nova  = mede(carrega(), sementes);
const velha = mede(carrega(TROCA_VELHA), sementes);
const seg = ((Date.now() - inicio) / 1000).toFixed(1);

const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)] || 0; };
const mediaDe = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length) : 0;
const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) + "%" : "—";

const linha = (rot, f) => `    ${rot.padEnd(30)} ${String(f(velha)).padStart(9)}  ${String(f(nova)).padStart(9)}`;

console.log(`\n  JAGERLARAMAIS · a faixa exata do dado · IA ${nivel}`);
console.log(`  ${n} partidas de cada lado, MESMOS times, em ${seg}s\n`);
console.log(`    ${"".padEnd(30)} ${"v48".padStart(9)}  ${"v49".padStart(9)}`);
console.log(`    ${"".padEnd(30)} ${"(≥ piso)".padStart(9)}  ${"(faixa)".padStart(9)}`);
console.log(linha("duração média (rodadas)", r => r.rodadas.toFixed(1)));
console.log(linha("Ultimates por partida", r => r.ults.toFixed(1)));
console.log(linha("habilidades do meio, por partida", r => r.meios.toFixed(1)));
console.log(linha("básicas por partida", r => r.basicas.toFixed(1)));
console.log(linha("Ultimate como % dos golpes", r => pct(r.ults, r.ults + r.meios + r.basicas)));
console.log(linha("partidas que terminaram", r => pct(r.terminadas, n)));
console.log(linha("dado que ninguém podia usar", r => pct(r.dadosMortos, r.dadosVistos)));
console.log(linha("dano por golpe — média", r => mediaDe(r.danos).toFixed(1)));
console.log(linha("dano por golpe — mediana", r => med(r.danos)));
console.log(linha("dano por golpe — máximo", r => Math.max(0, ...r.danos)));
console.log(`
  COMO LER. "Dado que ninguém podia usar" é o número que decide se a regra é
  boa: ele conta o dado que, no momento em que a mão foi olhada, não pagava
  habilidade nenhuma de nenhum herói disponível. Ele NÃO some do jogo — vira
  movimento pelo botão "→ mover" —, mas é a fração de dado que deixou de ser
  escolha e virou consolação. Se ela subir muito da v48 para a v49, a faixa
  exata está cobrando caro demais.

  Duração e dano são contexto: básica mais fraca tende a alongar, Ultimate presa
  ao 6 tende a alongar, e a soma das duas é o que interessa — não cada uma.\n`);
