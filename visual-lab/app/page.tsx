"use client";

import { useState } from "react";
import dados from "../dados/personagens.json";

/* ─────────────────────────────────────────────────────────────────────
   Conteúdo de personagem NÃO se escreve aqui. Ele vem de
   dados/personagens.json, gerado por scripts/gerar-dados.mjs a partir de
   dados/criacao.json + data/catalogo.js. Atributo digitado à mão nesta
   página é como nasce catálogo divergente — ver CLAUDE.md.
   ───────────────────────────────────────────────────────────────────── */

type Personagem = (typeof dados.personagens)[number];

const ROTULO_ESTADO: Record<string, string> = {
  pronto: "PRONTO",
  estudo: "ESTUDO",
  refine: "REFINE",
  rejeitado: "REFAZER",
  falta: "FALTA",
};

const ROTULO_STATUS: Record<string, string> = {
  aprovada: "APROVADA",
  refine: "EM REFINE",
  craft: "EM CRAFT",
};

const territorios = [
  ["01", "CONJUNTO FORTALEZA", "TOPO", "Prédios empilhados, caixas-d’água e fortalezas de condomínio."],
  ["02", "FERRO-VELHO VIVO", "SELVA", "Sucata biotecnológica que cresce, caça e recicla invasores."],
  ["03", "PRAÇA DA TRANSMISSÃO", "MEIO", "O centro nervoso onde antenas disputam a última frequência da Várzea."],
  ["04", "CORREDOR DO FRETE", "BOT", "Viadutos, oficinas e rotas de entrega que nunca podem parar."],
  ["05", "VAZANTE LUMINOSA", "RIO", "Um vazamento impossível divide o mapa e alimenta suas criaturas."],
];

const monsters = [
  ["ARUTO", "GALO DE CONCRETO", "Objetivo inicial", "Uma ave de obra que acorda a arena no grito e quebra cobertura no peito."],
  ["DRAGÃO", "REI-RATO DA FIAÇÃO", "Objetivo elemental", "Devora cabos, cospe curto-circuitos e muda o comportamento da Vazante."],
  ["BARÃO", "BOI DE OUTDOOR", "Objetivo maior", "Uma massa de lona, ferragem e propaganda esquecida que avança sem freio."],
];

/* Em atirador e suporte a rota e a classe são a mesma palavra; não repita. */
function papelDe(p: Personagem) {
  return p.classe && p.classe !== p.rota ? `${p.rota} · ${p.classe}` : p.rota;
}

/* A melhor imagem que o personagem já tem, na ordem em que o kit amadurece. */
function retratoDe(p: Personagem) {
  for (const etapa of ["05", "02", "01", "03"]) {
    const arq = p.assets[etapa as keyof typeof p.assets]?.arquivos?.[0];
    if (arq) return `/images/${arq}`;
  }
  return null;
}

function temFicha(p: Personagem) {
  return Object.values(p.assets).some((a) => a.arquivos.length || a.nuvem.length);
}

/* ── a bolinha por etapa: o estado do kit legível antes de qualquer texto ── */
function Etapas({ p }: { p: Personagem }) {
  return (
    <div className="etapas" aria-label={`Kit: ${p.progresso.feitas} de ${p.progresso.total} etapas prontas`}>
      {dados.etapas.map((e) => {
        const estado = p.assets[e.id as keyof typeof p.assets]?.estado ?? "falta";
        return <i key={e.id} data-estado={estado} title={`${e.id} ${e.nome} — ${ROTULO_ESTADO[estado]}`} />;
      })}
      <b>
        {p.progresso.feitas}/{p.progresso.total}
      </b>
    </div>
  );
}

/* ── a carta: o que valida o personagem como peça de jogo ── */
function Carta({ p }: { p: Personagem }) {
  if (!p.atributos) {
    return (
      <div className="carta vazia">
        <b>SEM ATRIBUTOS</b>
        <p>Este personagem ainda não foi ligado a um herói do catálogo. Sem essa ligação não existe carta.</p>
      </div>
    );
  }

  const proposta = !p.catalogo.confirmado;

  return (
    <div className="carta" style={{ "--route": p.cor } as React.CSSProperties}>
      <div className="carta-topo">
        <small>{papelDe(p)}</small>
        <h4>{p.nome}</h4>
        <em>{p.epiteto}</em>
      </div>

      <div className="carta-atr">
        {p.atributos.map((a) => (
          <div key={a.chave}>
            <b>{a.texto}</b>
            <span>{a.rotulo}</span>
          </div>
        ))}
      </div>

      {p.marcas.length > 0 && (
        <div className="carta-marcas">
          {p.marcas.map((m) => (
            <span key={m.chave} title={m.texto}>
              {m.rotulo}
            </span>
          ))}
        </div>
      )}

      <div className="carta-skills">
        {p.skills.map((s) => (
          <article key={s.tecla}>
            <b>{s.tecla}</b>
            <div>
              <strong>
                {s.nome}
                {!s.batizada && <i> · nome mecânico, falta batizar</i>}
              </strong>
              <p>{s.texto}</p>
            </div>
            <span title="Força mínima do dado de ação">F{s.forca}</span>
          </article>
        ))}
      </div>

      <div className={`carta-fonte ${proposta ? "proposta" : ""}`}>
        {proposta ? "PROPOSTA · " : ""}números de <b>{p.referenciaCatalogo?.nome}</b> em data/catalogo.js
        {proposta ? " — confirmar a ligação" : ""}
      </div>
    </div>
  );
}

/* ── a ficha completa de um personagem ── */
function Ficha({ p }: { p: Personagem }) {
  const retrato = retratoDe(p);
  const video = p.assets["06"];
  const arqVideo = video?.arquivos?.find((a) => a.endsWith(".mp4"));
  const poster = video?.arquivos?.find((a) => a.includes("poster"));

  return (
    <section
      className={`ficha ${retrato ? "" : "sem-art"}`}
      id={`heroi-${p.slug}`}
      style={{ "--route": p.cor } as React.CSSProperties}
    >
      <div className="ficha-art">
        {retrato ? (
          <img src={retrato} alt={`${p.nome}, ${p.epiteto}`} loading="lazy" decoding="async" />
        ) : (
          <div className="ficha-sem-art">
            SEM ARTE — a etapa 01 ainda não tem arquivo no repositório
          </div>
        )}
        <span className="ficha-selo">{ROTULO_STATUS[p.status] ?? p.status.toUpperCase()}</span>
      </div>

      <div className="ficha-corpo">
        <div className="ficha-cabeca">
          <small>
            {p.ordem} · {papelDe(p)}
          </small>
          <h3>{p.nome}</h3>
          <em>{p.epiteto}</em>
          <Etapas p={p} />
          <p>{p.resumo}</p>
        </div>

        <Carta p={p} />

        <div className="ficha-video">
          <h5>CARTA ANIMADA</h5>
          {arqVideo ? (
            <video
              controls
              playsInline
              preload="none"
              poster={poster ? `/images/${poster}` : undefined}
              src={`/images/${arqVideo}`}
            />
          ) : (
            <p className="pendente">
              {video?.estado === "rejeitado"
                ? "Teste reprovado por deformar rosto e expressão. Refazer no Kling 3.0 usando a key art aprovada como primeiro frame."
                : "A etapa 06 só começa depois da key art aprovada. Ver PIPELINE-VISUAL.md."}
            </p>
          )}
        </div>

        <div className="ficha-kit">
          <h5>KIT DE PRODUÇÃO</h5>
          <ol>
            {dados.etapas.map((e) => {
              const a = p.assets[e.id as keyof typeof p.assets];
              const estado = a?.estado ?? "falta";
              const arq = a?.arquivos?.[0];
              return (
                <li key={e.id} data-estado={estado}>
                  <b>{e.id}</b>
                  <div>
                    <strong>{e.nome}</strong>
                    <p>{a?.obs || e.papel}</p>
                    {a?.nuvem?.length ? <code>nuvem: {a.nuvem.join(" · ")}</code> : null}
                  </div>
                  {arq ? (
                    <a href={`/images/${arq}`} target="_blank" rel="noreferrer">
                      ABRIR ↗
                    </a>
                  ) : (
                    <span>{ROTULO_ESTADO[estado]}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="ficha-lore">
          {p.territorio.nome && (
            <article>
              <b>TERRITÓRIO</b>
              <strong>{p.territorio.nome}</strong>
              <p>{p.territorio.descricao}</p>
            </article>
          )}
          {p.obsessao && (
            <article>
              <b>OBSESSÃO</b>
              <p>{p.obsessao}</p>
            </article>
          )}
          {p.arma.nome && (
            <article>
              <b>ARMA · {p.arma.nome}</b>
              <p>{p.arma.descricao}</p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [filter, setFilter] = useState("TODOS");
  const roster = dados.personagens;
  const filtrados = filter === "TODOS" ? roster : roster.filter((p) => p.rota === filter);
  const fichas = roster.filter(temFicha);
  const { etapasFeitas, etapasTotais, personagens: nPersonagens, slotsAbertos } = dados.progresso;

  return (
    <main>
      <header>
        <a className="logo" href="#top">
          JAGER<span>LARA</span>MAIS
        </a>
        <nav>
          <a href="#roster">HERÓIS</a>
          <a href="#lore">LORE</a>
          <a href="#mapa">MAPA</a>
          <a href="#monstros">MONSTROS</a>
          <a href="#roadmap">ROTA</a>
        </nav>
        <span className="edition">
          <i /> {etapasFeitas}/{etapasTotais} ETAPAS
        </span>
      </header>

      <section className="hero" id="top">
        <div className="grid-glow" />
        <p className="eyebrow">GUIA CRIATIVO EM CONSTRUÇÃO · AGOSTO 2026</p>
        <h1>
          FANTASIA
          <br />
          <em>DO IMPROVISO.</em>
        </h1>
        <p className="hero-copy">
          Um mundo feito de pessoas, criaturas e objetos descartados por outras realidades. Aqui, o cotidiano ganha
          escala épica — e toda gambiarra pode virar lenda.
        </p>
        <div className="score">
          <strong>{nPersonagens}</strong>
          <span>
            PERSONAGENS
            <br />
            EM PRODUÇÃO
          </span>
          <strong>
            {etapasFeitas}
            <i>/{etapasTotais}</i>
          </strong>
          <span>
            ETAPAS DE KIT
            <br />
            CONCLUÍDAS
          </span>
        </div>
        <a className="down" href="#roster">
          VER O ELENCO ↓
        </a>
      </section>

      <section className="roster" id="roster">
        <div className="roster-top">
          <div>
            <span>01 / ELENCO</span>
            <h2>
              CINCO EM PÉ.
              <br />
              QUINZE A CRIAR.
            </h2>
          </div>
          <p>
            Cada personagem só fecha quando atravessa as seis etapas do kit. O guia fica pronto para implementação
            quando os dez primeiros e o sistema estético estiverem aprovados.
          </p>
        </div>

        <div className="filters">
          {["TODOS", "TOPO", "SELVA", "MEIO", "ATIRADOR", "SUPORTE"].map((item) => (
            <button
              key={item}
              data-filter={item}
              className={filter === item ? "on" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="roster-grid">
          {filtrados.map((p) => {
            const retrato = retratoDe(p);
            const temDetalhe = temFicha(p);
            const Tag = temDetalhe ? "a" : "div";
            return (
              <Tag
                {...(temDetalhe ? { href: `#heroi-${p.slug}` } : {})}
                className={`hero-slot ${retrato ? "complete" : ""} ${temDetalhe ? "linkado" : ""}`}
                data-role={p.rota}
                key={p.slug}
                style={{ "--route": p.cor } as React.CSSProperties}
              >
                <div className="slot-image">
                  {retrato ? (
                    <img src={retrato} alt={p.nome} loading="lazy" decoding="async" />
                  ) : (
                    <span>{p.ordem}</span>
                  )}
                </div>
                <div className="slot-meta">
                  <small>
                    {p.ordem} · {papelDe(p)}
                  </small>
                  <h3>{p.nome}</h3>
                  <p>{p.epiteto}</p>
                  <Etapas p={p} />
                  <b>{temDetalhe ? "ABRIR FICHA →" : ROTULO_STATUS[p.status]}</b>
                </div>
              </Tag>
            );
          })}
        </div>

        <div className="slots-abertos">
          <b>{slotsAbertos}</b>
          <div>
            <strong>SLOTS ABERTOS</strong>
            <p>
              {dados.slotsAbertos.map((s) => `${s.quantidade} ${s.rota.toLowerCase()}`).join(" · ")}. Antes de gerar
              qualquer imagem, cada um precisa de lore, silhueta, obsessão, função, skills, materiais, território e
              assinatura de movimento.
            </p>
          </div>
        </div>
      </section>

      {fichas.map((p) => (
        <Ficha key={p.slug} p={p} />
      ))}

      <section className="lore" id="lore">
        <div className="lore-title">
          <span>02 / LORE CANÔNICA · V0.2</span>
          <h2>
            A COLISÃO
            <br />
            NÃO DESTRUIU
            <br />
            O MUNDO.
            <br />
            <i>REMENDOU.</i>
          </h2>
        </div>
        <div className="lore-body">
          <p className="lead">
            Quando realidades incompatíveis se chocaram, seus restos se acumularam numa periferia impossível:{" "}
            <b>A Várzea do Fim.</b>
          </p>
          <p>
            Ali, bairros, criaturas, memórias e objetos descartados foram costurados pela mesma energia que alimenta o
            Nexus. Ninguém é “o escolhido”. Os heróis são gente comum que aprendeu a transformar escassez em linguagem,
            gambiarra em poder e defeito em assinatura.
          </p>
          <blockquote>“Se o universo jogou fora, a Várzea dá um jeito.”</blockquote>
          <div className="canon">
            <article>
              <b>70% ARQUÉTIPO</b>
              <p>Avó, criança, pombo, motoboy, mascote. A leitura começa em algo humano e imediato.</p>
            </article>
            <article>
              <b>20% OBSESSÃO</b>
              <p>Um único exagero domina a silhueta, a arma, a personalidade e o kit.</p>
            </article>
            <article>
              <b>10% CICATRIZ</b>
              <p>Todo personagem carrega um detalhe que revela o que perdeu na Colisão.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="worldmap" id="mapa">
        <div className="map-intro">
          <span>03 / MAPA · EM REDESIGN</span>
          <h2>
            A VÁRZEA
            <br />
            DO FIM
          </h2>
          <p>
            O mapa mantém a leitura tática atual, mas cada rota ganha identidade narrativa, habitantes e materiais
            próprios.
          </p>
        </div>
        <div className="map-board">
          <img
            src="/images/mapa-atual.jpg"
            srcSet="/images/mapa-atual-700.jpg 700w, /images/mapa-atual-1200.jpg 1200w, /images/mapa-atual.jpg 1400w"
            sizes="(max-width: 620px) calc(100vw - 36px), 92vw"
            alt="Mapa atual do jogo, base para o redesign da Várzea do Fim"
            loading="lazy"
            decoding="async"
          />
          <div className="construction">
            ⚒ MAPA ATUAL
            <br />
            <b>REDESIGN EM CONSTRUÇÃO</b>
          </div>
        </div>
        <div className="territories">
          {territorios.map(([id, name, route, copy]) => (
            <article key={id}>
              <b>{id}</b>
              <small>{route}</small>
              <h3>{name}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bestiary" id="monstros">
        <div className="section-head light">
          <span>04 / BESTIÁRIO</span>
          <h2>
            O MAPA
            <br />
            TAMBÉM
            <br />
            <i>ATACA.</i>
          </h2>
          <p>
            Os monstros preservam a função mecânica dos objetivos atuais; nomes, lore e arte são a camada criativa em
            validação.
          </p>
        </div>
        <div className="monster-grid">
          {monsters.map(([legacy, name, role, copy], i) => (
            <article key={name}>
              <small>
                {String(i + 1).padStart(2, "0")} · {legacy} → {role}
              </small>
              <h3>{name}</h3>
              <p>{copy}</p>
              <em>⚒ CONCEITO · ARTE PENDENTE</em>
            </article>
          ))}
        </div>
      </section>

      <section className="roadmap" id="roadmap">
        <span>05 / CORTE PARA IMPLEMENTAÇÃO</span>
        <h2>
          PRIMEIRO
          <br />
          <i>DEZ.</i>
          <br />
          DEPOIS O JOGO.
        </h2>
        <div className="milestones">
          <article className="active">
            <b>01</b>
            <strong>Fundação</strong>
            <p>Lore, sistema visual e Dona Chinela como personagem-matriz.</p>
            <span>EM CURSO</span>
          </article>
          <article>
            <b>05</b>
            <strong>Primeiro time</strong>
            <p>Um herói por rota, mapa e primeiros monstros.</p>
            <span>PRÓXIMO</span>
          </article>
          <article>
            <b>10</b>
            <strong>Guia implementável</strong>
            <p>Dez heróis, cartas, UI, miniaturas-piloto e vídeos aprovados.</p>
            <span>MARCO</span>
          </article>
          <article>
            <b>20</b>
            <strong>Roster completo</strong>
            <p>Substituição total do elenco, seguida por itens e expansões.</p>
            <span>FUTURO</span>
          </article>
        </div>
        <p className="roadmap-nota">
          Itens ficam para depois dos dez heróis. Os 22 do jogo continuam valendo com os números atuais até a
          atualização mecânica fechar.
        </p>
      </section>

      <footer>
        <a className="logo" href="#top">
          JAGER<span>LARA</span>MAIS
        </a>
        <p>VISUAL GUIDE · DOCUMENTO VIVO</p>
        <a href="https://vilkers.github.io/jagerlaramais/" target="_blank" rel="noreferrer">
          ABRIR JOGO ↗
        </a>
      </footer>
    </main>
  );
}
