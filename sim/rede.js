/* O SERVIDOR DE SALAS SEGURA O QUE PROMETE?

   Não mede balanceamento: mede se o modo online é seguro e se ele funciona.
   As perguntas, em ordem de importância:

     · UM LADO CONSEGUE LER O OUTRO? É a única pergunta que, se a resposta for
       "sim", cancela o modo inteiro — a névoa vira decoração e o gank acaba;
     · a senha protege? código sem senha entra? senha errada entra?
     · dá para jogar fora do próprio turno?
     · dá para mexer no herói do adversário?
     · a partida ANDA — dois clientes de verdade fazem jogada e o estado chega?

   Roda contra o servidor de verdade, subido numa porta efêmera:

     node sim/rede.js                                                          */

const { servidor } = require("../servidor/sala.js");

let passou = 0, falhou = 0;
const falhas = [];
/* CÃO DE GUARDA. Teste de rede espera coisa que pode não chegar, e um `await`
   pendurado não falha — ele trava o corredor inteiro sem dizer qual foi. Com
   prazo, o travamento vira falha com nome, que é o mínimo para consertar. */
async function teste(nome, fn, ms = 5000) {
  try {
    await Promise.race([fn(), new Promise((_, rej) =>
      setTimeout(() => rej(new Error(`travou — passou de ${ms}ms sem terminar`)), ms))]);
    passou++; console.log(`  \x1b[32m✓\x1b[0m ${nome}`);
  } catch (e) { falhou++; falhas.push(nome); console.log(`  \x1b[31m✗\x1b[0m ${nome}\n      ${e.message}`); }
  finally { abertos.splice(0).forEach(r => { try { r.destroy(); } catch (_) {} }); }
}
const ok = (c, m) => { if (!c) throw new Error(m); };
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m} — esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`); };

let BASE;
const post = async (rota, corpo) => {
  const r = await fetch(BASE + rota, { method: "POST",
    headers: { "content-type": "application/json" }, body: JSON.stringify(corpo) });
  return { status: r.status, corpo: await r.json() };
};

/* abre o SSE e devolve uma função que espera o PRÓXIMO estado */
/* O CANAL DE TESTE USA `http.get`, E NÃO `fetch`.

   O `fetch` do Node compartilha um pool de conexões por origem, e um stream SSE
   segura a conexão enquanto vive. Com dois canais por sala e uma sala por teste,
   por volta do 17º o POST seguinte não conseguia socket e ficava pendurado — que
   parecia bug de regra e não era. `abort()` também não devolvia o socket a tempo.

   `http.get` dá o socket na mão: `destroy()` fecha na hora, e a suíte deixa de
   depender do humor de um pool que ela não controla. */
const http = require("http");
const abertos = [];

function ouve(sala, lado, seg) {
  const fila = [], esperando = [];
  const u = new URL(`${BASE}/eventos`);
  u.searchParams.set("sala", sala);
  u.searchParams.set("lado", lado);
  u.searchParams.set("segredo", seg);

  let req = null;
  const pronto = new Promise((res, rej) => {
    req = http.get(u, r => {
      if (r.statusCode !== 200) { rej(new Error("canal recusado: " + r.statusCode)); return; }
      let buf = "";
      r.setEncoding("utf8");
      r.on("data", c => {
        buf += c;
        let i;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const linha = buf.slice(0, i); buf = buf.slice(i + 2);
          const m = /^data: (.*)$/m.exec(linha); if (!m) continue;
          let pacote; try { pacote = JSON.parse(m[1]); } catch (_) { continue; }
          if (esperando.length) esperando.shift()(pacote); else fila.push(pacote);
        }
      });
      res();
    });
    req.on("error", () => res());          /* fechado de propósito não é falha */
  });
  abertos.push(req);

  const proximo = () => new Promise(res => fila.length ? res(fila.shift()) : esperando.push(res));
  return {
    pronto, proximo,
    /* esvazia o que já chegou — `empurra` dispara na entrada do segundo jogador E
       na abertura de cada canal, então a fila começa com eventos velhos e um
       teste que lê "o próximo" pode estar lendo o passado */
    drena: () => { fila.length = 0; },
    /* espera um estado que satisfaça `pred`, com prazo */
    ateQue: async (pred, ms = 3000) => {
      const fim = Date.now() + ms;
      for (;;) {
        const resto = fim - Date.now();
        if (resto <= 0) throw new Error("o estado esperado não chegou a tempo");
        const p = await Promise.race([proximo(),
          new Promise(r => setTimeout(() => r(null), resto))]);
        if (!p) throw new Error("o estado esperado não chegou a tempo");
        if (pred(p)) return p;
      }
    },
    fecha: () => { try { req.destroy(); } catch (_) {} },
  };
}

(async () => {
  await new Promise(r => servidor.listen(0, r));
  BASE = `http://localhost:${servidor.address().port}`;
  console.log(`\n  JAGERLARAMAIS · o servidor de salas\n  ${BASE}\n`);

  /* ─────────── senha e entrada ─────────── */

  await teste("criar sala devolve código de 6 e o lado 0", async () => {
    const { corpo } = await post("/criar", { senha: "abelha" });
    eq(corpo.sala.length, 6, "o código não tem 6 caracteres");
    eq(corpo.lado, 0, "quem cria não é o lado 0");
    ok(corpo.segredo && corpo.segredo.length >= 32, "o segredo veio curto demais");
    ok(!/[01OIL]/.test(corpo.sala), "o código usa caractere ambíguo — ele vai ser ditado em voz alta");
  });

  await teste("senha curta demais é recusada", async () => {
    const { status } = await post("/criar", { senha: "ab" });
    eq(status, 400, "aceitou senha de 2 caracteres");
  });

  await teste("entrar com a senha certa dá o lado 1", async () => {
    const a = (await post("/criar", { senha: "abelha" })).corpo;
    const { status, corpo } = await post("/entrar", { sala: a.sala, senha: "abelha" });
    eq(status, 200, "não entrou com a senha certa");
    eq(corpo.lado, 1, "quem entra não é o lado 1");
    ok(corpo.segredo !== a.segredo, "os dois jogadores receberam o mesmo segredo");
  });

  await teste("SENHA ERRADA NÃO ENTRA", async () => {
    const a = (await post("/criar", { senha: "abelha" })).corpo;
    const { status } = await post("/entrar", { sala: a.sala, senha: "abelhA" });
    eq(status, 400, "entrou com a senha errada");
  });

  await teste("sala que não existe não abre", async () => {
    const { status } = await post("/entrar", { sala: "ZZZZZZ", senha: "abelha" });
    eq(status, 400, "entrou numa sala inexistente");
  });

  await teste("a terceira pessoa não entra", async () => {
    const a = (await post("/criar", { senha: "abelha" })).corpo;
    await post("/entrar", { sala: a.sala, senha: "abelha" });
    const { status } = await post("/entrar", { sala: a.sala, senha: "abelha" });
    eq(status, 400, "entrou um terceiro jogador na sala");
  });

  await teste("o código não diferencia maiúscula — ele vai ser digitado à mão", async () => {
    const a = (await post("/criar", { senha: "abelha" })).corpo;
    const { status } = await post("/entrar", { sala: a.sala.toLowerCase(), senha: "abelha" });
    eq(status, 200, "o código em minúscula não funcionou");
  });

  /* ─────────── a névoa, que é o motivo de tudo ─────────── */

  async function mesa() {
    const a = (await post("/criar", { senha: "abelha" })).corpo;
    const b = (await post("/entrar", { sala: a.sala, senha: "abelha" })).corpo;
    const oa = ouve(a.sala, 0, a.segredo), ob = ouve(b.sala, 1, b.segredo);
    await oa.pronto; await ob.pronto;
    const ea = await oa.proximo(), eb = await ob.proximo();
    return { a, b, oa, ob, ea, eb };
  }

  await teste("O LADO 0 NÃO LÊ A POSIÇÃO DO CAÇADOR ESCONDIDO DO LADO 1", async () => {
    const { ea, eb, oa, ob } = await mesa();
    const cacadorDele = eb.estado.times[1].herois.find(h => h.pos);   /* como ELE se vê */
    ok(cacadorDele, "o lado 1 não enxerga os próprios heróis");
    const mesmoNoMeu = ea.estado.times[1].herois.find(h => h.id === cacadorDele.id);
    ok(mesmoNoMeu, "o herói inimigo sumiu da lista — ele deve existir, só sem posição");
    if (mesmoNoMeu.oculto)
      eq(mesmoNoMeu.pos, null, "o herói veio marcado como oculto MAS com posição");
    oa.fecha(); ob.fecha();
  });

  await teste("nenhuma casa escondida do inimigo aparece no meu estado", async () => {
    const { ea, eb, oa, ob } = await mesa();
    const meu = JSON.stringify(ea.estado);
    const ocultos = ea.estado.times[1].herois.filter(h => h.oculto);
    ok(ocultos.length, "cenário fraco: nenhum inimigo está escondido no início");
    ocultos.forEach(h => {
      const real = eb.estado.times[1].herois.find(x => x.id === h.id);
      ok(real && real.pos, "o lado 1 não sabe onde o próprio herói está");
      ok(!meu.includes(`"pos":[${real.pos[0]},${real.pos[1]}]`)
         || ea.estado.times[0].herois.some(m => m.pos[0] === real.pos[0] && m.pos[1] === real.pos[1]),
         `a casa [${real.pos}] do ${h.n} escondido vazou no meu estado`);
    });
    oa.fecha(); ob.fecha();
  });

  await teste("a rotação secreta do outro não chega para mim", async () => {
    const { ea, oa, ob } = await mesa();
    if (ea.estado.rotacao) eq(ea.estado.rotacao[1], null, "a escolha do Caçador dele veio junto");
    oa.fecha(); ob.fecha();
  });

  /* ─────────── as travas ─────────── */

  await teste("NÃO DÁ PARA JOGAR FORA DO SEU TURNO", async () => {
    const { a, b, ea, oa, ob } = await mesa();
    const foraDaVez = ea.estado.vez === 0 ? b : a;
    const { status, corpo } = await post("/jogada",
      { sala: a.sala, segredo: foraDaVez.segredo, acao: "encerrar" });
    eq(status, 400, "encerrou o turno do adversário");
    ok(/vez/.test(corpo.erro), `a recusa não explica o motivo: ${corpo.erro}`);
    oa.fecha(); ob.fecha();
  });

  await teste("NÃO DÁ PARA MEXER NO HERÓI DO ADVERSÁRIO", async () => {
    const { a, ea, eb, oa, ob } = await mesa();
    const daVez = ea.estado.vez === 0 ? a : null;
    if (!daVez) { oa.fecha(); ob.fecha(); return; }        /* sorteou o outro lado */
    const heroiDele = eb.estado.times[1].herois[0];
    const { status } = await post("/jogada", { sala: a.sala, segredo: a.segredo,
      acao: "habilidade", dados: { heroi: heroiDele.id, slot: 0, alvo: "eu" } });
    eq(status, 400, "moveu uma peça do adversário");
    oa.fecha(); ob.fecha();
  });

  await teste("segredo inválido não joga", async () => {
    const { a, oa, ob } = await mesa();
    const { status } = await post("/jogada",
      { sala: a.sala, segredo: "f".repeat(48), acao: "encerrar" });
    eq(status, 400, "jogou com segredo inventado");
    oa.fecha(); ob.fecha();
  });

  await teste("segredo do outro não serve para ler o meu canal", async () => {
    const a = (await post("/criar", { senha: "abelha" })).corpo;
    const b = (await post("/entrar", { sala: a.sala, senha: "abelha" })).corpo;
    const r = await fetch(`${BASE}/eventos?sala=${a.sala}&lado=0&segredo=${b.segredo}`);
    eq(r.status, 400, "o lado 1 abriu o canal do lado 0 com o próprio segredo");
  });

  /* ─────────── a partida anda ─────────── */

  await teste("encerrar turno chega no outro lado, e a vez vira", async () => {
    const { a, b, ea, oa, ob } = await mesa();
    const daVez = ea.estado.vez === 0 ? a : b;
    const vezAntes = ea.estado.vez;
    oa.drena(); ob.drena();
    const { status } = await post("/jogada",
      { sala: a.sala, segredo: daVez.segredo, acao: "encerrar" });
    eq(status, 200, "o dono da vez não conseguiu encerrar");
    /* o teste vale pelo OUTRO lado: o que importa é que a jogada de um chega no
       canal do outro sem ele pedir nada */
    const dep = await ob.ateQue(p => p.estado.vez !== vezAntes || p.estado.rodada > ea.estado.rodada);
    ok(dep, "a vez não virou no canal do adversário depois do encerrar");
    oa.fecha(); ob.fecha();
  });

  await teste("os dois recebem o MESMO placar público — só a névoa difere", async () => {
    const { ea, eb, oa, ob } = await mesa();
    eq(ea.estado.rodada, eb.estado.rodada, "a rodada divergiu entre os dois lados");
    eq(ea.estado.nexus.join(","), eb.estado.nexus.join(","), "a vida do Nexus divergiu");
    eq(ea.estado.torres.length, eb.estado.torres.length, "o número de torres divergiu");
    oa.fecha(); ob.fecha();
  });

  await teste("comprar na loja passa pelo servidor e o ouro sai", async () => {
    const { a, b, ea, oa, ob } = await mesa();
    const eu = ea.estado.vez === 0 ? a : b;
    const meuLado = ea.estado.vez;
    const est = meuLado === 0 ? ea.estado : (await ob.proximo()).estado;
    const h = est.times[meuLado].herois[0];
    /* o servidor é a fonte: dou ouro nele, não no cliente */
    const { salas } = require("../servidor/sala.js");
    const g = salas.get(a.sala).g;
    g.J.times[meuLado].herois[0].ouro = 60;
    g.J.times[meuLado].herois[0].pos = [...g.BASE[meuLado][0]];
    oa.drena(); ob.drena();
    const { status, corpo } = await post("/jogada", { sala: a.sala, segredo: eu.segredo,
      acao: "item", dados: { heroi: h.id, id: "eclipse" } });
    eq(status, 200, `a compra foi recusada: ${corpo.erro}`);
    eq(g.J.times[meuLado].herois[0].itens.includes("eclipse"), true, "o item não foi equipado");
    ok(g.J.times[meuLado].herois[0].ouro < 60, "comprou de graça");
    oa.fecha(); ob.fecha();
  }, 15000);   /* prazo maior: este monta sala, motor e loja — é o mais pesado da suíte */

  await teste("NÃO DÁ PARA MIRAR EM QUEM VOCÊ NÃO ENXERGA", async () => {
    const { a, b, ea, oa, ob } = await mesa();
    const { salas } = require("../servidor/sala.js");
    const g = salas.get(a.sala).g;
    const meuLado = g.J.vez;
    const eu = meuLado === 0 ? a : b;
    /* escondo um inimigo no mato mais longe que existir */
    const alvo = g.J.times[1 - meuLado].herois[1];
    let melhor = null, longe = -1;
    for (let r = 0; r < g.LINS; r++) for (let c = 0; c < g.COLS; c++) {
      if (!g.noTab(c, r) || !g.ehMato(c, r) || g.em(c, r)) continue;
      const d = Math.min(...g.J.times[meuLado].herois.map(h => g.dist(c, r, ...h.pos)));
      if (d > longe) { longe = d; melhor = [c, r]; }
    }
    alvo.pos = [...melhor];
    g.J.times[meuLado].wards = [];
    ok(!g.visivelPara(alvo, meuLado), "cenário inválido: o alvo está visível");
    const meu = g.J.times[meuLado].herois[0];
    const { status, corpo } = await post("/jogada", { sala: a.sala, segredo: eu.segredo,
      acao: "habilidade", dados: { heroi: meu.id, slot: 0, alvo: alvo.id } });
    eq(status, 400, "acertou um herói que ele não enxerga — a névoa não vale para mirar");
    ok(/enxerga/.test(corpo.erro || ""), `a recusa não explica: ${corpo.erro}`);
    oa.fecha(); ob.fecha();
  });

  await teste("ação desconhecida é recusada — a lista é fechada", async () => {
    const { a, b, ea, oa, ob } = await mesa();
    const eu = ea.estado.vez === 0 ? a : b;
    const { status } = await post("/jogada",
      { sala: a.sala, segredo: eu.segredo, acao: "aplicaEstado", dados: { J: {} } });
    eq(status, 400, "o servidor aceitou uma ação que não está na lista");
    oa.fecha(); ob.fecha();
  });

  console.log(`\n  ${passou} passaram · ${falhou} falharam\n`);
  if (falhou) falhas.forEach(f => console.log("    · " + f));
  servidor.close();
  process.exit(falhou ? 1 : 0);
})();
