"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Hero } from "./data";
import { publishedHeroes } from "./data";

export default function HeroDetail({ hero }: { hero: Hero }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const stage = hero.stages[active];
  const heroIndex = publishedHeroes.findIndex((item) => item.slug === hero.slug);
  const previous = publishedHeroes[(heroIndex - 1 + publishedHeroes.length) % publishedHeroes.length];
  const next = publishedHeroes[(heroIndex + 1) % publishedHeroes.length];

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("stage");
    const index = hero.stages.findIndex((item) => item.id === requested);
    if (index >= 0) queueMicrotask(() => setActive(index));
  }, [hero.stages]);

  useEffect(() => {
    if (!lightbox) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setLightbox(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [lightbox]);

  function selectStage(index: number) {
    setActive(index);
    setLightbox(false);
    const url = new URL(window.location.href);
    url.searchParams.set("stage", hero.stages[index].id);
    window.history.replaceState({}, "", url);
  }

  return (
    <main className="detail-page" style={{ "--route": hero.color } as React.CSSProperties}>
      <header className="detail-header">
        <Link className="logo" href="/">JAGER<span>LARA</span>MAIS</Link>
        <Link className="back-link" href="/#roster">← VOLTAR AO ROSTER</Link>
        <span className="edition"><i /> {hero.progress}/5 COM ASSET</span>
      </header>

      <section className="hero-overview">
        <div className="hero-overview-art">{hero.thumbnail && <img src={hero.thumbnail} alt={hero.name} />}</div>
        <div className="hero-overview-copy">
          <span className="hero-kicker">HERÓI {hero.id} · {hero.role}</span>
          <h1>{hero.name}</h1><h2>{hero.title}</h2>
          <p>{hero.summary}</p>
          <div className="hero-status"><b>{hero.status}</b><span>{hero.currentStage}</span></div>
          <div className="hero-progress"><span><i style={{ width: `${(hero.progress / 5) * 100}%` }} /></span><b>{hero.progress} DE 5 ETAPAS COM ASSET</b></div>
        </div>
      </section>

      <nav className="stage-nav" aria-label="Etapas do personagem">
        {hero.stages.map((item, index) => <button key={item.id} className={index === active ? "on" : ""} onClick={() => selectStage(index)} aria-current={index === active ? "step" : undefined}><small>{item.id}</small>{item.navLabel}</button>)}
      </nav>

      <section className="stage-panel">
        <div className={`stage-media ${stage.image ? "has-image" : "empty-stage"}`}>
          {stage.image ? <button onClick={() => setLightbox(true)} aria-label={`Ampliar ${stage.label}`}><img className={stage.fit || "contain"} src={stage.image} alt={stage.alt || stage.label} /><span>AMPLIAR ↗</span></button> : <div><b>{stage.id}</b><strong>ASSET AINDA NÃO GERADO</strong><p>Esta etapa só abre quando os requisitos anteriores estiverem validados.</p></div>}
        </div>
        <div className="stage-copy">
          <span className="stage-number">ETAPA {stage.id} / 05</span>
          <h2>{stage.label}</h2>
          <b className={`stage-state state-${stage.status.toLowerCase().replaceAll(" ", "-")}`}>{stage.status}</b>
          <p>{stage.note}</p>
          <div className="stage-actions">
            <button disabled={active === 0} onClick={() => selectStage(active - 1)}>← ANTERIOR</button>
            <button disabled={active === hero.stages.length - 1} onClick={() => selectStage(active + 1)}>PRÓXIMA →</button>
          </div>
        </div>
      </section>

      <div className="hero-pager">
        <Link href={`/heroes/${previous.slug}`}><small>PERSONAGEM ANTERIOR</small><b>← {previous.name}</b></Link>
        <Link href={`/heroes/${next.slug}`}><small>PRÓXIMO PERSONAGEM</small><b>{next.name} →</b></Link>
      </div>

      <footer><Link className="logo" href="/">JAGER<span>LARA</span>MAIS</Link><p>VISUAL GUIDE · DOCUMENTO VIVO</p><Link href="/#roster">VOLTAR AO ROSTER ↑</Link></footer>

      {lightbox && stage.image && <div className="lightbox" role="dialog" aria-modal="true" aria-label={stage.label} onClick={() => setLightbox(false)}><button aria-label="Fechar imagem">FECHAR ×</button><img src={stage.image} alt={stage.alt || stage.label} onClick={(event) => event.stopPropagation()} /></div>}
    </main>
  );
}
