/* ══════════════════════════════════════════════════════════════════
   JAGERLARAMAIS · SERVIDOR DE SALAS
   ══════════════════════════════════════════════════════════════════

   Pedido: *"crie um modo pvp com salas onde eu coloco a senha da sala e jogo
   com o amigo que a criou"*.

   ── POR QUE ELE EXISTE, e por que é AUTORITATIVO ──

   Sala é servidor: não existe "criar sala" sem alguém no meio dizendo *esta sala
   existe e você é o segundo a entrar nela*. Mas ser autoritativo é uma escolha
   separada e mais cara, e ela se justifica por uma coisa só: A NÉVOA.

   Se o servidor fosse um relay burro repassando o `J` inteiro, qualquer um dos
   dois abriria o console e leria a posição do Caçador escondido. Rotação
   secreta, emboscada e blefe de gank — que são o jogo — virariam questão de
   honra. Aqui o `J` de verdade mora NESTE processo, e cada lado recebe só
   `estadoPara(lado)`.

   ── UM MOTOR SÓ ──

   Este servidor não reimplementa regra nenhuma. Ele carrega `jogo/jogo.js` pelo
   mesmo `sim/motor.js` que a suíte de testes usa: mesma geometria, mesmas
   habilidades, mesmo `encerraTurno`. Regra que muda no jogo muda aqui junto, por
   construção — e é a razão de o hotseat e o online nunca poderem divergir.

   ── ZERO DEPENDÊNCIA, E POR QUÊ ──

   `http` e `crypto` do próprio Node, nada de npm. Não é purismo: o projeto todo
   é vanilla e a regra existe para o jogo abrir com duplo clique. O hotseat
   continua abrindo — quem depende de coisa ligada é só o modo online.

   Transporte: **SSE + POST**, não WebSocket. Um jogo de turnos manda um estado
   de ~11 KB a cada jogada; SSE resolve isso com a EventSource do próprio
   navegador e sem handshake, e POST leva a jogada. WebSocket sem biblioteca
   custaria ~150 linhas de parsing de frame para ganhar latência que um jogo de
   tabuleiro não usa.

   ── COMO SUBIR ──

     node servidor/sala.js                 → porta 8787
     PORT=3000 node servidor/sala.js       → outra porta

   Em qualquer lugar que rode Node: Deno Deploy, Fly, Render, Railway, uma
   máquina na sua rede. Sem banco: sala é memória, e partida abandonada some.  */

const http = require("http");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { carrega } = require(path.join(__dirname, "..", "sim", "motor.js"));

const PORTA = +process.env.PORT || 8787;

/* ---------- as salas ----------
   Memória e só. Uma partida de 40 rodadas dura minutos, e persistir estado de
   jogo em disco pediria migração a cada versão do motor — o custo não paga. */
const salas = new Map();

const CODIGO = () => {
  /* seis caracteres sem 0/O/1/I/L: este código vai ser DITADO em voz alta ou
     mandado por mensagem, e um zero lido como ó é a sala que não abre */
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => abc[crypto.randomInt(abc.length)]).join("");
};
const segredo = () => crypto.randomBytes(24).toString("hex");

/* senha nunca é guardada em claro: se este processo cair num log, ela não vai
   junto. É sal por sala + sha256 — não é cofre de banco, é higiene mínima. */
function selaSenha(senha, sal) {
  return crypto.createHash("sha256").update(sal + "·" + String(senha)).digest("hex");
}
/* comparação em tempo constante: sem isso o tempo de resposta vira oráculo */
function iguais(a, b) {
  const A = Buffer.from(String(a)), B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

/* SENHA OPCIONAL (v56). O pedido foi direto: *"apenas criando a sala e passando
   o código"*. A senha era uma segunda coisa para ditar, e ela não estava
   comprando segurança nova — o CÓDIGO já é um segredo de 6 caracteres num
   alfabeto de 31, ~887 milhões de combinações, numa sala que vive 2h, aceita
   UM segundo jogador e depois fecha. Quem quiser senha ainda pode mandar uma;
   sem ela, `selo` é nulo e a sala abre só com o código. */
function novaSala(senha) {
  const sal = crypto.randomBytes(8).toString("hex");
  const g = carrega();
  g.simMode = true;                     /* pula a tela de escolha do Caçador */
  /* O SERVIDOR NÃO TEM TELA, e é isso que permite ele chamar as MESMAS funções
     que os botões chamam em vez de reimplementar cada regra. `confirma` abre uma
     caixa e só executa no "Confirmar"; aqui a intenção já veio do cliente, que
     confirmou lá. Sem este stub, prioridade e re-rolagem ficariam de fora do
     online — ou eu teria de copiar a regra delas, que é como se cria a segunda
     implementação que diverge na versão seguinte. */
  g.confirma = (_t, _x, aoSim) => aoSim();
  g.novo();
  const sala = {
    codigo: CODIGO(), sal, selo: senha ? selaSenha(senha, sal) : null,
    g, criada: Date.now(), mexida: Date.now(),
    lados: [null, null],                /* segredo de cada jogador */
    ouvintes: [],                       /* {lado, res} */
  };
  salas.set(sala.codigo, sala);
  return sala;
}

/* manda para CADA ouvinte o estado que aquele lado tem direito de ver.
   É aqui que a névoa deixa de ser pintura e passa a ser regra. */
function empurra(sala) {
  sala.mexida = Date.now();
  sala.ouvintes = sala.ouvintes.filter(o => !o.res.writableEnded);
  for (const o of sala.ouvintes) {
    const estado = sala.g.estadoPara(o.lado);
    const pacote = JSON.stringify({ lado: o.lado, estado, cheia: sala.lados.every(Boolean) });
    try { o.res.write(`data: ${pacote}\n\n`); } catch (_) { /* saiu no meio */ }
  }
}

/* ---------- FREIO DE TENTATIVA ----------
   Com a senha opcional, o código da sala passou a ser o único segredo, e um
   segredo único merece um freio: sem ele alguém varre códigos até cair numa
   sala aberta. Não é rate limit de produção — é o suficiente para que varrer
   887 milhões de códigos deixe de ser um laço de `for`.

   Conta ERRO, não requisição: quem acerta o código na primeira não vê nada
   disto. A janela zera sozinha, então um dedo pesado no teclado não prende
   ninguém para sempre. */
const ERROS_MAX = 30, JANELA_ERRO = 10 * 60 * 1000;
const erros = new Map();                 /* ip -> {n, ate} */
function anotaErro(ip) {
  const agora = Date.now();
  const e = erros.get(ip);
  if (!e || agora > e.ate) { erros.set(ip, { n: 1, ate: agora + JANELA_ERRO }); return; }
  e.n++;
}
function travado(ip) {
  const e = erros.get(ip);
  return !!e && Date.now() <= e.ate && e.n >= ERROS_MAX;
}
const deQuem = req => String(req.socket.remoteAddress || "?");

/* sala parada há 2h vai embora — sem isso a memória cresce para sempre */
setInterval(() => {
  const agora = Date.now();
  for (const [cod, s] of salas)
    if (agora - s.mexida > 2 * 60 * 60 * 1000) salas.delete(cod);
  for (const [ip, e] of erros) if (agora > e.ate) erros.delete(ip);
}, 10 * 60 * 1000).unref();

/* ---------- as jogadas que o cliente pode pedir ----------
   LISTA FECHADA, de propósito. O cliente manda a INTENÇÃO ("usar a habilidade 2
   no herói X"), nunca o estado. Se ele mandasse estado, o servidor autoritativo
   não serviria para nada — bastaria mentir no envio. */
const ACOES = {
  mover(g, lado, d) {
    const h = achaHeroi(g, lado, d.heroi);
    g.limpaModo(); g.selHeroi = h; g.modo = "mover"; g.calcula();
    ok(g.mover.some(p => p[0] === d.para[0] && p[1] === d.para[1]), "casa fora do alcance");
    g.moveAte(d.para[0], d.para[1]);
  },

  habilidade(g, lado, d) {
    const h = achaHeroi(g, lado, d.heroi);
    g.limpaModo(); g.selHeroi = h; g.iniciaHab(d.slot);
    if (d.alvo === "eu") { if (g.habAtual === null) g.habAtual = d.slot; g.confirmaHab(h); return; }
    const alvo = g.todos().find(x => x.id === d.alvo);
    ok(alvo, "alvo não existe");
    /* a névoa também vale para MIRAR: não dá para acertar quem você não vê */
    ok(alvo.t === lado || g.visivelPara(alvo, lado), "você não enxerga esse alvo");
    g.confirmaHab(alvo);
  },

  /* torre, Nexus e poço não são heróis e têm caminho próprio no motor */
  estrutura(g, lado, d) {
    const h = achaHeroi(g, lado, d.heroi);
    g.limpaModo(); g.selHeroi = h; g.iniciaHab(d.slot);
    if (d.tipo === "torre") {
      const tr = g.J.torres.find(x => x.rota === d.rota && x.i === d.i && x.t === 1 - lado);
      ok(tr && tr.vida > 0, "essa torre não existe ou já caiu");
      g.atacaTorre(tr);
    } else if (d.tipo === "nexus") {
      ok(d.lado === 1 - lado, "o Nexus é o seu");
      g.atacaNexus(d.lado);
    } else if (d.tipo === "epico") {
      g.atacaEpico(g.J.poco);
    } else ok(false, "estrutura desconhecida");
  },

  converterDado(g, lado, d) {
    ok(Number.isInteger(d.i), "índice de dado inválido");
    g.dadoSel = d.i;
    ok(g.converteDado(d.i) !== false, "esse dado não pode virar movimento");
  },

  rerolar(g, lado, d) { g.dadoSel = d.i; g.rerola(); },
  ajustar(g, lado, d) { g.dadoSel = d.i; g.ajustaDado(d.delta > 0 ? 1 : -1); },
  prioridade(g) { g.usaPrioridade(); },

  /* os quatro sumidouros de ouro: placa, prioridade, reforço, sentinela */
  gasto(g, lado, d) {
    const h = achaHeroi(g, lado, d.heroi);
    ok(g.usaGasto(d.id, h, lado), "esse gasto não pôde ser feito agora");
  },
  /* item de loja — outra regra e outra função; confundir as duas foi o primeiro
     erro que este servidor cometeu, e o teste é que apontou */
  item(g, lado, d) {
    const h = achaHeroi(g, lado, d.heroi);
    ok(g.compraItem(h, d.id, lado), "não dá para comprar esse item agora");
  },
  vender(g, lado, d) {
    const h = achaHeroi(g, lado, d.heroi);
    g.vendeItem(h, d.item, lado);
  },
  ward(g, lado, d) { g.plantaSentinela(achaHeroi(g, lado, d.heroi)); },
  carta(g, lado, d) { g.selHeroi = d.heroi ? achaHeroi(g, lado, d.heroi) : null; g.jogaCarta(d.id); },

  /* os dois feitiços do time. Carga é UMA e serve a qualquer herói, então a
     trava de "é seu?" é a mesma dos outros: o herói tem de ser do seu lado. */
  lampejo(g, lado, d) {
    const h = achaHeroi(g, lado, d.heroi);
    g.limpaModo(); g.selHeroi = h; g.modo = "lampejo"; g.calcula();
    ok(g.mover.some(p => p[0] === d.para[0] && p[1] === d.para[1]), "lampejo fora do alcance");
    g.lampejaAte(d.para[0], d.para[1]);
  },
  retorno(g, lado, d) { g.selHeroi = achaHeroi(g, lado, d.heroi); g.usaRetorno(); },

  encerrar(g) { g.encerraTurno(); },
  rotacao(g, lado, d) { g.escolheRotacao(lado, d.regiao); },
};

function achaHeroi(g, lado, id) {
  const h = g.J.times[lado].herois.find(x => x.id === id);
  ok(h, "esse herói não é seu");
  return h;
}
function ok(c, m) { if (!c) { const e = new Error(m); e.doCliente = 1; throw e; } }

/* ---------- HTTP ---------- */
function corpo(req) {
  return new Promise((res, rej) => {
    let d = ""; let n = 0;
    req.on("data", c => { n += c.length; if (n > 64 * 1024) { rej(new Error("corpo grande demais")); req.destroy(); } d += c; });
    req.on("end", () => { try { res(d ? JSON.parse(d) : {}); } catch (e) { rej(e); } });
    req.on("error", rej);
  });
}
const manda = (res, cod, obj) => {
  res.writeHead(cod, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
};

/* estático, e SÓ o que o jogo precisa. A lista é fechada de propósito: um
   servidor de sala que serve o disco inteiro é um servidor de arquivos com
   sotaque, e este processo vai rodar na máquina de alguém. */
const RAIZ_SITE = path.join(__dirname, "..");
const PASTAS_OK = ["jogo", "data", "arte"];
const TIPOS = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
                ".css":"text/css; charset=utf-8", ".jpg":"image/jpeg", ".png":"image/png",
                ".svg":"image/svg+xml", ".webp":"image/webp" };

function serveArquivo(caminho, res) {
  let rel = decodeURIComponent(caminho).replace(/^\/+/, "");
  /* A RAIZ REDIRECIONA, não serve o arquivo direto. `jogo/index.html` pede
     `jogo.js` e `estilo.css` por caminho RELATIVO; servido em `/`, o navegador
     iria buscá-los em `/jogo.js` e a página subia sem motor. Em `/jogo/` os
     mesmos caminhos caem no lugar certo. */
  if (rel === "" || rel === "jogo") {
    res.writeHead(302, { location: "/jogo/" });
    return res.end();
  }
  if (rel === "jogo/") rel = "jogo/index.html";
  const abs = path.resolve(RAIZ_SITE, rel);
  /* nada de subir de pasta: `..` no caminho é a primeira coisa que se tenta */
  const dentro = PASTAS_OK.some(p => abs.startsWith(path.join(RAIZ_SITE, p) + path.sep));
  if (!dentro) return manda(res, 404, { erro: "não existe" });
  fs.readFile(abs, (e, d) => {
    if (e) return manda(res, 404, { erro: "não existe" });
    res.writeHead(200, { "content-type": TIPOS[path.extname(abs)] || "application/octet-stream",
                         "cache-control": "no-cache" });
    res.end(d);
  });
}

const servidor = http.createServer(async (req, res) => {
  /* o jogo é servido de outro lugar (GitHub Pages), então CORS é obrigatório */
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "content-type");
  if (req.method === "OPTIONS") return res.end();

  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "POST" && url.pathname === "/criar") {
      const { senha } = await corpo(req);
      /* senha VAZIA é o caminho normal agora. Se vier uma, ela ainda precisa
         valer alguma coisa — senha de 2 letras é pior que nenhuma, porque
         parece proteção. */
      ok(!senha || String(senha).length >= 3, "a senha precisa de pelo menos 3 caracteres");
      const sala = novaSala(senha || "");
      sala.lados[0] = segredo();
      return manda(res, 200, { sala: sala.codigo, lado: 0, segredo: sala.lados[0] });
    }

    if (req.method === "POST" && url.pathname === "/entrar") {
      const { sala: cod, senha } = await corpo(req);
      const ip = deQuem(req);
      ok(!travado(ip), "tentativa demais — espere alguns minutos");
      const sala = salas.get(String(cod || "").toUpperCase());
      if (!sala) { anotaErro(ip); ok(false, "sala não existe"); }
      /* sala sem senha abre só com o código — é o caso comum desde a v56 */
      if (sala.selo && !iguais(selaSenha(senha, sala.sal), sala.selo)) {
        anotaErro(ip); ok(false, "senha errada");
      }
      ok(!sala.lados[1], "essa sala já tem dois jogadores");
      sala.lados[1] = segredo();
      const r = { sala: sala.codigo, lado: 1, segredo: sala.lados[1] };
      manda(res, 200, r);
      empurra(sala);                       /* avisa quem estava esperando */
      return;
    }

    if (req.method === "GET" && url.pathname === "/eventos") {
      const sala = salas.get(String(url.searchParams.get("sala") || "").toUpperCase());
      ok(sala, "sala não existe");
      const lado = +url.searchParams.get("lado");
      ok(sala.lados[lado] && iguais(sala.lados[lado], url.searchParams.get("segredo") || ""),
         "segredo inválido");
      res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8",
                           "cache-control": "no-cache", connection: "keep-alive" });
      res.write(":\n\n");
      sala.ouvintes.push({ lado, res });
      req.on("close", () => { sala.ouvintes = sala.ouvintes.filter(o => o.res !== res); });
      empurra(sala);
      return;
    }

    if (req.method === "POST" && url.pathname === "/jogada") {
      const { sala: cod, segredo: seg, acao, dados } = await corpo(req);
      const sala = salas.get(String(cod || "").toUpperCase());
      ok(sala, "sala não existe");
      const lado = sala.lados.findIndex(s => s && iguais(s, seg || ""));
      ok(lado >= 0, "segredo inválido");
      ok(sala.lados.every(Boolean), "esperando o segundo jogador");
      const g = sala.g;
      ok(g.J.fim === null, "a partida acabou");
      /* A TRAVA QUE FAZ O AUTORITATIVO VALER: fora do seu turno, nada. */
      ok(acao === "rotacao" || g.J.vez === lado, "não é a sua vez");
      const fn = ACOES[acao];
      ok(fn, "ação desconhecida");
      fn(g, lado, dados || {});
      manda(res, 200, { ok: 1 });
      empurra(sala);
      return;
    }

    if (url.pathname === "/saude") return manda(res, 200, { ok: 1, salas: salas.size });

    /* ── O SERVIDOR TAMBÉM SERVE O JOGO, e isto não é conveniência ──

       O primeiro relato depois de a sala existir foi "tá dando erro pra criar
       sala". Não era o servidor: a página vinha do GitHub Pages, em HTTPS, e
       apontava para um servidor em HTTP num IP de rede. O navegador BLOQUEIA
       isso (mixed content) antes de a chamada sair — e nenhum ajuste no
       servidor resolveria, porque a requisição nunca chega nele.

       Servindo o jogo daqui, a página e a sala passam a ter a MESMA origem: sem
       mixed content, sem CORS, e o endereço do servidor deixa de precisar ser
       digitado. Vira um comando e uma URL para os dois jogadores. */
    if (req.method === "GET") return serveArquivo(url.pathname, res);
    manda(res, 404, { erro: "não existe" });
  } catch (e) {
    manda(res, e.doCliente ? 400 : 500, { erro: e.doCliente ? e.message : "erro no servidor" });
    if (!e.doCliente) console.error(e);
  }
});

if (require.main === module)
  servidor.listen(PORTA, () => {
    const ips = [];
    try {
      const nets = require("os").networkInterfaces();
      for (const n of Object.values(nets)) for (const i of n||[])
        if (i.family === "IPv4" && !i.internal) ips.push(i.address);
    } catch (_) {}
    console.log(`\n  JAGERLARAMAIS · sala aberta\n`);
    console.log(`  neste aparelho:  http://localhost:${PORTA}`);
    ips.forEach(ip => console.log(`  na sua rede:     http://${ip}:${PORTA}   <- abra este nos dois celulares`));
    console.log(`\n  Abra esse endereço no navegador dos DOIS jogadores e toque em`);
    console.log(`  "Jogar com um amigo · sala". O campo de endereço já vem preenchido.\n`);
  });

/* `erros` sai daqui só para o teste do freio poder zerar a janela depois de
   estourá-la de propósito — sem isso ele derrubaria todos os testes seguintes,
   que entram em sala do mesmo IP. */
module.exports = { servidor, salas, novaSala, erros, ERROS_MAX };
