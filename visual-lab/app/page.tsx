"use client";

import Link from "next/link";
import { useState } from "react";
import { heroes } from "./heroes/data";

const stages = ["CONCEPT", "SHEET", "VERSÃO 3D", "CARTA", "VÍDEO"];
const territories = [
  ["01", "CONJUNTO FORTALEZA", "TOPO", "Prédios empilhados, caixas-d’água e fortalezas de condomínio."],
  ["02", "FERRO-VELHO VIVO", "SELVA", "Sucata biotecnológica que cresce, caça e recicla invasores."],
  ["03", "PRAÇA DA TRANSMISSÃO", "MEIO", "O centro nervoso onde antenas disputam a última frequência da Várzea."],
  ["04", "TERRITÓRIO EM REVISÃO", "BOT", "Espaço reservado para a identidade narrativa da rota, sem herdar o conceito descartado de Frete."],
  ["05", "VAZANTE LUMINOSA", "RIO", "Um vazamento impossível divide o mapa e alimenta suas criaturas."],
];
const monsters = [
  ["ARUTO", "GALO DE CONCRETO", "Objetivo inicial", "Uma ave de obra que acorda a arena no grito e quebra cobertura no peito."],
  ["DRAGÃO", "REI-RATO DA FIAÇÃO", "Objetivo elemental", "Devora cabos, cospe curto-circuitos e muda o comportamento da Vazante."],
  ["BARÃO", "BOI DE OUTDOOR", "Objetivo maior", "Uma massa de lona, ferragem e propaganda esquecida que avança sem freio."],
];

export default function Home() {
  const [filter, setFilter] = useState("TODOS");
  const filtered = filter === "TODOS" ? heroes : heroes.filter((hero) => hero.role.includes(filter));

  return (
    <main>
      <header>
        <a className="logo" href="#top">JAGER<span>LARA</span>MAIS</a>
        <nav><a href="#lore">LORE</a><a href="#mapa">MAPA</a><a href="#roster">HERÓIS</a><a href="#monstros">MONSTROS</a><a href="#itens">ITENS</a></nav>
        <span className="edition"><i /> VISUAL GUIDE · 03 EM PRODUÇÃO</span>
      </header>

      <section className="hero" id="top">
        <div className="grid-glow" />
        <p className="eyebrow">GUIA CRIATIVO EM CONSTRUÇÃO · AGOSTO 2026</p>
        <h1>FANTASIA<br/><em>DO IMPROVISO.</em></h1>
        <p className="hero-copy">Um mundo feito de pessoas, criaturas e objetos descartados por outras realidades. Aqui, o cotidiano ganha escala épica — e toda gambiarra pode virar lenda.</p>
        <div className="score"><strong>03</strong><span>HERÓIS<br/>EM PRODUÇÃO</span><strong>05</strong><span>ETAPAS<br/>POR HERÓI</span></div>
        <a className="down" href="#universo">ABRIR O SISTEMA ↓</a>
      </section>

      <section className="lore" id="lore">
        <div className="lore-title"><span>01 / LORE CANÔNICA · V0.2</span><h2>A COLISÃO<br/>NÃO DESTRUIU<br/>O MUNDO.<br/><i>REMENDOU.</i></h2></div>
        <div className="lore-body">
          <p className="lead">Quando realidades incompatíveis se chocaram, seus restos se acumularam numa periferia impossível: <b>A Várzea do Fim.</b></p>
          <p>Ali, bairros, criaturas, memórias e objetos descartados foram costurados pela mesma energia que alimenta o Nexus. Ninguém é “o escolhido”. Os heróis são gente comum que aprendeu a transformar escassez em linguagem, gambiarra em poder e defeito em assinatura.</p>
          <blockquote>“Se o universo jogou fora, a Várzea dá um jeito.”</blockquote>
          <div className="canon"><article><b>O CONFLITO</b><p>Facções disputam o Nexus porque ele pode estabilizar a Várzea — ou reescrever quem pertence a ela.</p></article><article><b>O TOM</b><p>Comédia irreverente na superfície; afeto, perda e pertencimento sustentam cada absurdo.</p></article><article><b>A REGRA</b><p>Todo poder nasce de uma solução cotidiana levada a uma escala ridiculamente épica.</p></article></div>
        </div>
      </section>

      <section className="worldmap" id="mapa">
        <div className="map-intro"><span>02 / MAPA · EM REDESIGN</span><h2>A VÁRZEA<br/>DO FIM</h2><p>O mapa mantém a leitura tática atual, mas cada rota ganha identidade narrativa, habitantes e materiais próprios.</p></div>
        <div className="map-board"><img src="/images/mapa-atual.jpg" srcSet="/images/mapa-atual-700.jpg 700w, /images/mapa-atual-1200.jpg 1200w, /images/mapa-atual.jpg 1400w" sizes="(max-width: 620px) calc(100vw - 36px), 92vw" alt="Mapa atual do jogo, base para o redesign da Várzea do Fim" loading="lazy" decoding="async"/><div className="construction">⚒ MAPA ATUAL<br/><b>REDESIGN EM CONSTRUÇÃO</b></div></div>
        <div className="territories">{territories.map(([id,name,route,copy]) => <article key={id}><b>{id}</b><small>{route}</small><h3>{name}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="manifest" id="universo">
        <div className="section-head"><span>03 / UNIVERSO</span><h2>O MUNDO NÃO É<br/>UM MULTIVERSO.<br/><i>É UM REMENDO.</i></h2><p>A Várzea do Fim existe onde realidades quebradas foram costuradas. Seus habitantes não foram escolhidos: sobreviveram porque aprenderam a transformar sobra em poder.</p></div>
        <div className="formula">
          <article><b>70%</b><h3>ARQUÉTIPO<br/>RECONHECÍVEL</h3><p>Avó, criança, pombo, camelô, síndico. A leitura começa em algo humano e imediato.</p></article>
          <article><b>20%</b><h3>OBSESSÃO<br/>ABSURDA</h3><p>Um único exagero domina a silhueta, a arma, a personalidade e o kit.</p></article>
          <article><b>10%</b><h3>CICATRIZ<br/>DE LORE</h3><p>Todo personagem carrega um detalhe que revela o que perdeu na Colisão.</p></article>
        </div>
      </section>

      <section className="system" id="sistema">
        <div className="section-head light"><span>04 / CHARACTER ART GUIDE</span><h2>DISTINTOS<br/>NO CONCEITO.<br/><i>UNIDOS</i> NO CRAFT.</h2><p>O sistema visual controla a família sem uniformizar o elenco.</p></div>
        <div className="principles">
          <article><span>01</span><h3>SILHUETA PRIMEIRO</h3><p>Uma grande forma dominante, uma secundária e poucos detalhes terciários.</p></article>
          <article><span>02</span><h3>VOLUME TOYÉTICO</h3><p>Anatomia estilizada, peso claro e proporções capazes de virar miniatura.</p></article>
          <article><span>03</span><h3>MATERIAL COM MEMÓRIA</h3><p>Madeira, azulejo, plástico, tecido e sucata contam história antes do texto.</p></article>
          <article><span>04</span><h3>HÍBRIDO 3D + PINTURA</h3><p>Design tridimensional legível com acabamento ilustrado e luz de key art.</p></article>
          <article><span>05</span><h3>COR DE FUNÇÃO</h3><p>A rota aparece como acento tático. Nunca domina a identidade do personagem.</p></article>
          <article><span>06</span><h3>EXPRESSÃO AUTORAL</h3><p>Rosto, gesto e arma precisam comunicar personalidade sem depender da lore.</p></article>
        </div>
      </section>

      <section className="roster" id="roster">
        <div className="roster-top"><div><span>05 / ROSTER GERAL</span><h2>PRIMEIRO TIME.<br/>NOVA FAMÍLIA.</h2></div><p>Entre pela ficha de cada personagem para acompanhar assets, decisões e bloqueios ao longo das cinco etapas oficiais.</p></div>
        <div className="roster-summary"><b>03</b> PERSONAGENS ATIVOS <span/> <b>05</b> ETAPAS <span/> <b>01</b> REFERÊNCIA-MATRIZ</div>
        <div className="filters">{["TODOS", "TOPO", "SELVA", "MEIO"].map((item) => <button key={item} data-filter={item} className={filter === item ? "on" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
        <div className="roster-grid">
          {filtered.map((hero) => {
            const content = <>
              <div className="slot-image">{hero.thumbnail ? <img src={hero.thumbnail} alt={hero.name} loading="lazy" decoding="async" /> : <span>{hero.id}</span>}</div>
              <div className="slot-meta">
                <small>{hero.id} · {hero.role}</small><h3>{hero.name}</h3><p>{hero.title}</p>
                <div className="slot-progress"><span><i style={{ width: `${(hero.progress / 5) * 100}%` }} /></span><small>{hero.progress}/5 COM ASSET</small></div>
                <em>{hero.currentStage}</em><b>{hero.status}</b>
              </div>
            </>;
            const className = `hero-slot ${hero.thumbnail ? "complete" : ""}`;
            const style = { "--route": hero.color } as React.CSSProperties;
            return hero.progress > 0
              ? <Link className={`${className} hero-slot-link`} href={`/heroes/${hero.slug}`} data-role={hero.role} key={hero.id} style={style}>{content}</Link>
              : <article className={className} data-role={hero.role} key={hero.id} style={style}>{content}</article>;
          })}
        </div>
      </section>

      <section className="bestiary" id="monstros">
        <div className="section-head light"><span>06 / BESTIÁRIO</span><h2>O MAPA<br/>TAMBÉM<br/><i>ATACA.</i></h2><p>Os monstros preservam a função mecânica dos objetivos atuais; nomes, lore e arte são a camada criativa em validação.</p></div>
        <div className="monster-grid">{monsters.map(([legacy,name,role,copy],i)=><article key={name}><div className="monster-mark"><span>?</span><b>0{i+1}</b></div><small>{legacy} → {role}</small><h3>{name}</h3><p>{copy}</p><em>⚒ CONCEITO · ARTE PENDENTE</em></article>)}</div>
      </section>

      <section className="items" id="itens">
        <div className="items-head"><div><span>07 / ARSENAL DA GAMBIARRA</span><h2>22 ITENS.<br/>ZERO GENÉRICOS.</h2></div><p>Cada item deverá parecer encontrado na Várzea, revelar seu uso pela silhueta e conversar visualmente com os heróis — sem alterar seus números até a atualização mecânica fechar.</p></div>
        <div className="item-grid">{Array.from({length:22},(_,i)=><article key={i}><b>?</b><span>{String(i+1).padStart(2,"0")}</span><small>⚒ EM CONSTRUÇÃO</small></article>)}</div>
      </section>

      <section className="cards">
        <div className="section-head"><span>08 / ASSETS DE PERSONAGEM</span><h2>DO CONCEPT<br/>PARA A CARTA.</h2><p>A mesma identidade atravessa sheet, versão 3D, carta contextualizada e vídeo curto.</p></div>
        <div className="formats"><article><b>02</b><h3>SHEET</h3><p>Views consistentes do personagem, expressões autorais e objeto isolado quando necessário.</p><span>01 APROVADA · 02 EM REVISÃO</span></article><article><b>03</b><h3>VERSÃO 3D</h3><p>Uma versão colorida e duas clay, sempre com base hexagonal padronizada.</p><span>03 PARA REFAZER</span></article><article><b>04</b><h3>CARTA</h3><p>Personagem contextualizado com acting, personalidade e território próprios.</p><span>01 APROVADA · 02 PENDENTES</span></article><article><b>05</b><h3>VÍDEO</h3><p>Animação curta derivada diretamente da imagem aprovada da carta.</p><span>03 PENDENTES</span></article></div>
      </section>

      <section className="deliverables">
        <div className="section-head"><span>09 / KIT DE CADA HERÓI</span><h2>CINCO ETAPAS.<br/>UMA IDENTIDADE.</h2><p>Cada etapa congela decisões para a seguinte. Nenhum asset corrige sozinho uma base inconsistente.</p></div>
        <div className="stage-list">{stages.map((stage, i) => <div key={stage}><b>{String(i + 1).padStart(2, "0")}</b><strong>{stage}</strong><span>{["01 MATRIZ · 02 EM REVISÃO", "01 APROVADA · 02 EM REVISÃO", "03 PARA REFAZER", "01 APROVADA · 02 PENDENTES", "03 PENDENTES"][i]}</span></div>)}</div>
      </section>

      <section className="roadmap" id="roadmap">
        <span>10 / CORTE PARA IMPLEMENTAÇÃO</span><h2>PRIMEIRO<br/><i>O CRAFT.</i><br/>DEPOIS O JOGO.</h2>
        <div className="milestones"><article className="active"><b>01</b><strong>Referência-matriz</strong><p>Dona Chinela define o nível de 3D, luz, materiais e acabamento do elenco.</p><span>APROVADA</span></article><article><b>03</b><strong>Primeira família</strong><p>Dona Chinela, P.O.M.B.O. e Catarino fecham o novo pipeline de cinco etapas.</p><span>EM CURSO</span></article><article><b>10</b><strong>Guia implementável</strong><p>Dez heróis, cartas, UI, versões 3D e vídeos aprovados.</p><span>MARCO</span></article><article><b>20</b><strong>Roster completo</strong><p>Substituição total do elenco, seguida por itens e expansões.</p><span>FUTURO</span></article></div>
      </section>

      <footer><a className="logo" href="#top">JAGER<span>LARA</span>MAIS</a><p>VISUAL GUIDE · DOCUMENTO VIVO</p><a href="https://vilkers.github.io/jagerlaramais/" target="_blank" rel="noreferrer">ABRIR JOGO ↗</a></footer>
    </main>
  );
}
