/* DEFENDER É VIÁVEL, OU EMPURRAR TORRE GANHA SOZINHO?

   Nasceu do relato: *"tá muito fácil ganhar o jogo só empurrando torre, tem que
   ter uma forma de defender mais efetiva"*. Este script existe para transformar
   isso em número — e para ser a régua do antes e depois de qualquer mexida na
   defesa.

   O QUE ELE MEDE, e por que cada um:

     · COMO A PARTIDA TERMINA. Se quase tudo termina com a onda dando o golpe
       final, o jogador virou espectador do próprio objetivo. A v22 mediu 97,3%
       e criou a Última Muralha por causa disso;
     · O CERCO. Quantas rodadas uma torre sobrevive depois que a onda chega em
       cima dela, e com que vantagem de presença. É aqui que se vê se EMPATAR
       segura ou não — se o cerco anda com presença igual, defender não existe
       como jogada, existe como corrida por corpos;
     · A DEFESA QUE DEU CERTO. Quantas vezes o defensor conseguiu tirar a onda
       de cima da própria torre. Zero significa que a rota, uma vez perdida,
       está perdida;
     · A PRIMEIRA TORRE. Quantas vezes quem derruba a primeira leva a partida.
       Perto de 100% é bola de neve sem freio.

   Usa o agente quase-aleatório (mede ESTRUTURA, não escolha), que é o certo aqui:
   a pergunta é se a regra permite defender, não se a IA sabe defender.

     node sim/defesa.js          → 400 partidas
     node sim/defesa.js 1200     → 1200                                        */

const { carrega } = require("./motor.js");

const n = parseInt(process.argv[2], 10) || 400;

/* as mesmas chaves de `sim/bateria.js`, para os dois scripts falarem a mesma
   língua quando for hora de comparar builds:
     node sim/defesa.js 400 defensor=off   → como era antes da v47            */
const opc = {};
process.argv.slice(3).forEach(a => { const [k, v] = a.split("="); opc[k] = v; });
const trocas = [];
if (opc.defensor === "off") trocas.push([/if\(f!==undefined&&Math\.abs\(idx-f\)<=1\) return melhor;/, ""]);

const g = carrega(trocas);
g.simMode = true;

/* OBSERVAÇÃO NA VIRADA DA RODADA, de fora.

   Duas tentativas anteriores mediram errado, e as duas valem registro porque o
   erro é fácil de repetir:

     1. fotografar a presença ANTES de cada turno e comparar depois. A presença de
        cada time é congelada no fim do turno DELE (regra da v20), então o retrato
        já estava velho para um dos lados. Acusou "9,7% do dano com empate" numa
        build em que empate não podia causar dano nenhum;
     2. envolver `fimDaRodada`. Não pega: `g.fimDaRodada = ...` cai na PONTE, que
        expõe um invólucro próprio, e as chamadas internas continuam indo para a
        função original. É o mesmo tropeço que `sim/condicoes.js` já tinha levado.

   O que funciona é olhar de fora, no instante certo: fotografa a vida das torres
   ANTES de `encerraTurno`, e quando `J.rodada` muda, o cerco já resolveu — e
   `J.presenca` ainda guarda exatamente os números que ele usou. A torre sitiada é
   a que está no `J.frentes` NOVO, porque o cerco resolve depois de a onda andar. */
let fim = { onda: 0, heroi: 0, sem: 0 };
let danoComVantagem = 0, danoComEmpate = 0, segurou = 0, reparos = 0;
let cercosVistos = 0, defesasQueTiraramAOnda = 0;
let primeiraTorreVenceu = 0, partidasComTorre = 0;
let torresPorPartida = [], rodadasPorPartida = [];

for (let p = 0; p < n; p++) {
  g.comeca(false, false);
  let primeiraTorreDe = null;
  let passos = 0;
  while (passos++ < 4000 && g.J.fim === null && g.J.fase === "jogando") {
    const vez = g.J.vez;
    const livres = g.vivos(vez).filter(h => !h.agiu);
    if (livres.length && Math.random() < 0.75) {
      const h = livres[Math.floor(Math.random() * livres.length)];
      g.limpaModo(); g.selHeroi = h;
      const i = Math.floor(Math.random() * h.habs.length);
      if (g.dadoPara(h.habs[i]) !== null) {
        g.iniciaHab(i);
        if (g.modo === "mirar") {
          if (g.alvosTorre.length) g.atacaTorre(g.alvosTorre[0]);
          else if (g.alvos[0]) g.confirmaHab(g.alvos[0]);
          else g.limpaModo();
        }
      }
    }
    if (g.J.mov.rest > 0) {
      const vv = g.vivos(vez);
      const h = vv[Math.floor(Math.random() * vv.length)];
      if (h) {
        g.limpaModo(); g.selHeroi = h; g.modo = "mover"; g.calcula();
        const d = g.mover[Math.floor(Math.random() * g.mover.length)];
        if (d) g.moveAte(...d);
      }
    }
    g.limpaModo(); g.selHeroi = null;

    /* a foto, imediatamente antes da virada */
    const rodada0 = g.J.rodada;
    const vidas = new Map(g.J.torres.map(t => [t, t.vida]));
    const frenteAntes = { ...g.J.frentes };
    const caidasAntes = g.J.torres.filter(x => x.vida <= 0).length;

    g.encerraTurno();

    if (g.J.rodada === rodada0) continue;         // ainda é a mesma rodada
    Object.keys(g.ROTAS).forEach(nome => {
      const f = g.J.frentes[nome];
      const tr = g.J.torres.find(x => x.rota === nome && x.i === f);
      if (!tr) return;
      const v0 = vidas.get(tr);
      if (v0 === undefined || v0 <= 0) return;    // já estava no chão
      cercosVistos++;
      const atk = 1 - tr.t;
      const pressao = (g.J.presenca[atk][nome] || 0) - (g.J.presenca[tr.t][nome] || 0);
      if (tr.vida < v0) { if (pressao > 0) danoComVantagem++; else danoComEmpate++; }
      else { segurou++; if (frenteAntes[nome] === tr.i && f !== tr.i) defesasQueTiraramAOnda++; }
    });
    /* reparo: torre fora da onda que ganhou vida */
    g.J.torres.forEach(tr => {
      const v0 = vidas.get(tr);
      if (v0 !== undefined && tr.vida > v0 && v0 > 0) reparos++;
    });
    const caidas = g.J.torres.filter(x => x.vida <= 0);
    if (caidas.length > caidasAntes && primeiraTorreDe === null) primeiraTorreDe = caidas[0].t;
  }
  if (g.J.fim === null) { fim.sem++; continue; }
  if (/onda/i.test(g.J.motivoFim || "")) fim.onda++; else fim.heroi++;
  rodadasPorPartida.push(g.J.rodada);
  torresPorPartida.push(g.J.torres.filter(x => x.vida <= 0).length);
  if (primeiraTorreDe !== null) {
    partidasComTorre++;
    if (g.J.fim === 1 - primeiraTorreDe) primeiraTorreVenceu++;
  }
}

const med = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : "—";
const pct = (x, tot) => tot ? ((x / tot) * 100).toFixed(1) + "%" : "—";
const total = fim.onda + fim.heroi;

console.log(`\n  JAGERLARAMAIS · defender é viável?` + (trocas.length ? `  [${process.argv.slice(3).join(' ')}]` : ''));
console.log(`  ${n} partidas · ${fim.sem} sem fim · duração média ${med(rodadasPorPartida)} rodadas\n`);
console.log(`  COMO A PARTIDA TERMINA`);
console.log(`    pela ONDA    ${pct(fim.onda, total)}`);
console.log(`    por HERÓI    ${pct(fim.heroi, total)}`);
console.log(`\n  O CERCO — viradas com a onda em cima de uma torre viva: ${cercosVistos}`);
console.log(`    a torre levou dano com VANTAGEM de presença   ${pct(danoComVantagem, danoComVantagem + danoComEmpate)}`);
console.log(`    a torre levou dano com presença EMPATADA      ${pct(danoComEmpate, danoComVantagem + danoComEmpate)}`);
console.log(`    viradas em que a torre NÃO perdeu vida        ${segurou}  (${pct(segurou, cercosVistos)})`);
console.log(`    defesas que tiraram a onda de cima            ${defesasQueTiraramAOnda}`);
console.log(`    torres reparadas                              ${reparos}`);
console.log(`\n  BOLA DE NEVE`);
console.log(`    quem derruba a primeira torre vence           ${pct(primeiraTorreVenceu, partidasComTorre)}`);
console.log(`    torres caídas por partida                     ${med(torresPorPartida)}/12`);
console.log(`\n  Leitura: "quem derruba a primeira torre vence" é o número que responde ao`);
console.log(`  relato — perto de 100% significa que empurrar decide sozinho. E cuidado com`);
console.log(`  a intuição: DEFESA FORTE DEMAIS PROTEGE QUEM ESTÁ NA FRENTE, então buff de`);
console.log(`  defesa pode PIORAR a bola de neve. Medir sempre os dois eixos juntos.\n`);
