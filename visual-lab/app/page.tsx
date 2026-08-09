"use client";

import { useState } from "react";

const ROUTES = [
  { n: "01", name: "TOPO", world: "FORTALEZA DE RUA", copy: "Brutalismo, esporte de contato e engenharia improvisada.", color: "#c8ff35" },
  { n: "02", name: "SELVA", world: "BIOMA MUTANTE", copy: "Criaturas, próteses orgânicas e tecnologia cultivada.", color: "#23d7a0" },
  { n: "03", name: "MEIO", world: "ARCANO POP", copy: "Magia como mídia: símbolos vivos, luz e espetáculo.", color: "#8c6cff" },
  { n: "04", name: "ATIRADOR", world: "KINÉTICA URBANA", copy: "Precisão, moda utilitária e energia em movimento.", color: "#ff5f48" },
  { n: "05", name: "SUPORTE", world: "RITUAL AFETIVO", copy: "Relíquias pessoais, memória e proteção coletiva.", color: "#ff91c8" },
];

const REFERENCES = [
  { name: "MADBOX", tag: "MUNDO 3D LÚDICO", image: "https://assets.awwwards.com/awards/sites_of_the_day/2021/10/madbox-1.jpg", href: "https://www.awwwards.com/sites/madbox" },
  { name: "UNKJD", tag: "PERSONAGEM + COR", image: "https://assets.awwwards.com/awards/element/2024/05/6633d365ba3ed946321129.jpg", href: "https://www.awwwards.com/sites/unkjd" },
  { name: "SQUARE", tag: "INTERFACE COMO JOGO", image: "https://assets.awwwards.com/awards/sites_of_the_day/2019/05/square-1.jpg", href: "https://www.awwwards.com/sites/square-interface-game" },
  { name: "INTERLAND", tag: "MAPA COMO CONVITE", image: "https://assets.awwwards.com/awards/external/2017/06/5943cc57708f7_static.jpeg", href: "https://www.awwwards.com/inspiration/tower-of-treasure-interland" },
];

export default function Home() {
  const [activeRoute, setActiveRoute] = useState(0);
  const route = ROUTES[activeRoute];

  return (
    <main style={{ "--active": route.color } as React.CSSProperties}>
      <header>
        <a className="logo" href="#top">JAGER<span>LARA</span>MAIS</a>
        <nav><a href="#mundo">MUNDO</a><a href="#tipo">TIPO</a><a href="#carta">CARTA</a><a href="#referencias">REFERÊNCIAS</a></nav>
        <span className="live"><i /> VISUAL LAB 02</span>
      </header>

      <section className="hero" id="top">
        <div className="orb orb-a" /><div className="orb orb-b" />
        <p className="kicker">DIREÇÃO RECOMENDADA · AGOSTO 2026</p>
        <h1><span>CINCO</span> MUNDOS.<br />UMA ARENA.</h1>
        <p className="hero-copy">O jogo deixa o medieval para trás. Cada rota vem de uma cultura, época e gênero diferente — unidas por silhueta, cor, luz e uma mesma energia competitiva.</p>
        <div className="manifesto"><b>NÃO É</b> “FORTNITE MEDIEVAL”<br/><b>É</b> FANTASIA DE COLISÃO</div>
        <a className="scroll" href="#mundo">ENTRAR NO SISTEMA ↓</a>
      </section>

      <section className="world" id="mundo">
        <div className="section-title"><span>01 / REGRA-MÃE</span><h2>DIFERENTES<br/>POR ORIGEM.<br/><i>IGUAIS</i> NO TRAÇO.</h2><p>A unidade não vem de vestir todo mundo com a mesma armadura. Vem de quatro decisões compartilhadas.</p></div>
        <div className="rules">
          <article><b>01</b><h3>SILHUETA<br/>TOYÉTICA</h3><p>Personagens reconhecíveis em dois segundos, mesmo pequenos na carta.</p></article>
          <article><b>02</b><h3>COR DE<br/>ROTA</h3><p>Cinco acentos cromáticos, um neutro escuro e luz de arena.</p></article>
          <article><b>03</b><h3>MATERIAL<br/>COM HISTÓRIA</h3><p>Plástico, cerâmica, tecido, relíquia e metal contam de onde cada um veio.</p></article>
          <article><b>04</b><h3>MARCA<br/>COMPETITIVA</h3><p>Números, emblemas e recortes fazem tudo pertencer ao mesmo campeonato.</p></article>
        </div>
      </section>

      <section className="routes">
        <div className="route-tabs">
          {ROUTES.map((r, i) => <button key={r.name} onClick={() => setActiveRoute(i)} className={i === activeRoute ? "active" : ""} style={{ "--route": r.color } as React.CSSProperties}><span>{r.n}</span><b>{r.name}</b></button>)}
        </div>
        <div className="route-stage">
          <div className="route-number">{route.n}</div>
          <div><p>{route.name} / CULTURA VISUAL</p><h2>{route.world}</h2><p className="route-copy">{route.copy}</p></div>
          <div className="route-tags"><span>FORMA GRÁFICA</span><span>3D ESTILIZADO</span><span>ALTO CONTRASTE</span></div>
        </div>
      </section>

      <section className="type-lab" id="tipo">
        <div className="section-title compact"><span>02 / VOZ TIPOGRÁFICA</span><h2>TIPO QUE<br/>TAMBÉM <i>JOGA.</i></h2><p>Uma família expressiva para impacto, outra cheia de detalhes para sistema e uma mono para números.</p></div>
        <div className="type-grid">
          <article className="type-anybody"><span>DISPLAY / ANYBODY VARIABLE</span><strong>JAGER<br/>LARAMAIS</strong><p>Largura variável transforma títulos em movimento, pressão e personalidade.</p></article>
          <article className="type-familjen"><span>INTERFACE / FAMILJEN GROTESK</span><strong>Vharn segura a rota.<br/>O time muda o mundo.</strong><p>Ink traps aparecem grandes e mantêm o texto afiado quando pequeno.</p></article>
          <article className="type-mono"><span>DADOS / SPLINE SANS MONO</span><div><b>14</b><small>VIDA</small><b>03</b><small>ARMADURA</small><b>01</b><small>ALCANCE</small></div></article>
        </div>
      </section>

      <section className="card-lab" id="carta">
        <div className="character">
          <img src="/images/vharn-collision.jpg" onError={(e) => { e.currentTarget.src = "/images/vharn-liga.jpg"; }} alt="Novo estudo visual de Vharn" />
          <div className="character-label"><span>01 · TOPO / TANQUE</span><h2>VHARN</h2><p>O BASTIÃO IMPROVISADO</p></div>
        </div>
        <article className="game-card">
          <div className="card-head"><span>JL / HERO 001</span><b>TOPO</b></div>
          <div className="card-image"><img src="/images/vharn-collision.jpg" onError={(e) => { e.currentTarget.src = "/images/vharn-liga.jpg"; }} alt=""/><strong>VHARN</strong></div>
          <div className="card-sub">O BASTIÃO IMPROVISADO <em>● TANQUE</em></div>
          <div className="card-stats"><span><b>14</b>VIDA</span><span><b>02</b>PODER</span><span><b>03</b>ARMAD.</span><span><b>01</b>ALCANCE</span></div>
          <div className="skill"><b>Q</b><p><strong>GOLPE DE ESCUDO</strong>Dano = Força + Poder − Armadura</p></div>
          <div className="skill ultimate"><b>R</b><p><strong>MURALHA</strong>Escudo +6. Prende inimigos adjacentes.</p></div>
        </article>
        <div className="card-notes"><span>03 / PROVA DE SISTEMA</span><h2>A CARTA NÃO É UMA MOLDURA.</h2><p>Ela é a transmissão do campeonato: personagem grande, informação rápida, cor de rota e gesto gráfico. A lore aparece em materiais e nomes — não em ornamento medieval.</p></div>
      </section>

      <section className="references" id="referencias">
        <div className="section-title compact"><span>04 / AWWWARDS SCOUTING</span><h2>O QUE <i>ROUBAR</i><br/>— COMO PRINCÍPIO.</h2><p>Não copiar estilos. Absorver como esses sites transformam navegação, cor, personagem e mapa em experiência.</p></div>
        <div className="reference-grid">{REFERENCES.map(ref => <a key={ref.name} href={ref.href} target="_blank" rel="noreferrer"><img src={ref.image} alt={`Referência ${ref.name}`} /><span>{ref.tag}</span><b>{ref.name} ↗</b></a>)}</div>
      </section>

      <section className="build">
        <span>05 / DIRECIONAL DE IMPLEMENTAÇÃO</span><h2>DO ESTUDO<br/>PARA O JOGO.</h2>
        <ol><li><b>01</b><strong>Tokens</strong><p>5 cores de rota, 3 famílias tipográficas, grid, raios e sombras.</p></li><li><b>02</b><strong>Kit piloto</strong><p>Vharn + 4 heróis, uma carta, um monstro e um quadrante do mapa.</p></li><li><b>03</b><strong>Pipeline</strong><p>Prompt-base, pose, luz, crop e controle de materiais por mundo.</p></li><li><b>04</b><strong>Rollout</strong><p>Substituição gradual de assets, sem alterar regra ou motor.</p></li></ol>
      </section>

      <footer><a className="logo" href="#top">JAGER<span>LARA</span>MAIS</a><p>VISUAL LAB · VILKER / VINICIUS / MATHEUS</p><a href="https://vilkers.github.io/jagerlaramais/" target="_blank" rel="noreferrer">ABRIR JOGO ↗</a></footer>
    </main>
  );
}
