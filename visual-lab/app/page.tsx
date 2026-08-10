"use client";

import { useState } from "react";

const roster = [
  { id: "01", name: "DONA CHINELA", title: "A ÚLTIMA PALAVRA", role: "TOPO · TANQUE", status: "APROVADA", image: "/images/dona-chinela-v1.jpeg", color: "#c8ff35" },
  { id: "02", name: "P.O.M.B.O.", title: "PRAGA ORBITAL", role: "SELVA · ASSASSINO", status: "CONCEITO", color: "#23d7a0" },
  { id: "03", name: "CATARINO", title: "O MENINO CONGESTIONADO", role: "MEIO · MAGO", status: "CONCEITO", color: "#8c6cff" },
  { id: "04", name: "FRETE", title: "ENTREGA ANTES DO FIM", role: "ATIRADOR", status: "CONCEITO", color: "#ff5f48" },
  { id: "05", name: "BEXIGA", title: "O MASCOTE QUE NÃO DESISTE", role: "SUPORTE", status: "CONCEITO", color: "#ff91c8" },
  ...Array.from({ length: 15 }, (_, i) => ({ id: String(i + 6).padStart(2, "0"), name: "SLOT ABERTO", title: "PERSONAGEM A CRIAR", role: ["TOPO", "SELVA", "MEIO", "ATIRADOR", "SUPORTE"][i % 5], status: "ABERTO", color: ["#c8ff35", "#23d7a0", "#8c6cff", "#ff5f48", "#ff91c8"][i % 5] })),
];

const stages = ["CONCEITO", "ARTE OFICIAL", "CHARACTER SHEET", "CARTA", "MINIATURA", "LOOP ANIMADO"];
const territories = [
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

export default function Home() {
  const [filter, setFilter] = useState("TODOS");
  const filtered = filter === "TODOS" ? roster : roster.filter((hero) => hero.role.includes(filter));

  return (
    <main>
      <header>
        <a className="logo" href="#top">JAGER<span>LARA</span>MAIS</a>
        <nav><a href="#lore">LORE</a><a href="#mapa">MAPA</a><a href="#roster">HERÓIS</a><a href="#monstros">MONSTROS</a><a href="#itens">ITENS</a></nav>
        <span className="edition"><i /> VISUAL GUIDE · 01/20</span>
      </header>

      <section className="hero" id="top">
        <div className="grid-glow" />
        <p className="eyebrow">GUIA CRIATIVO EM CONSTRUÇÃO · AGOSTO 2026</p>
        <h1>FANTASIA<br/><em>DO IMPROVISO.</em></h1>
        <p className="hero-copy">Um mundo feito de pessoas, criaturas e objetos descartados por outras realidades. Aqui, o cotidiano ganha escala épica — e toda gambiarra pode virar lenda.</p>
        <div className="score"><strong>01</strong><span>HERÓI<br/>APROVADO</span><strong>20</strong><span>SLOTS<br/>TOTAIS</span></div>
        <a className="down" href="#universo">ABRIR O SISTEMA ↓</a>
      </section>

      <section className="lore" id="lore">
        <div className="lore-title"><span>02 / LORE CANÔNICA · V0.2</span><h2>A COLISÃO<br/>NÃO DESTRUIU<br/>O MUNDO.<br/><i>REMENDOU.</i></h2></div>
        <div className="lore-body">
          <p className="lead">Quando realidades incompatíveis se chocaram, seus restos se acumularam numa periferia impossível: <b>A Várzea do Fim.</b></p>
          <p>Ali, bairros, criaturas, memórias e objetos descartados foram costurados pela mesma energia que alimenta o Nexus. Ninguém é “o escolhido”. Os heróis são gente comum que aprendeu a transformar escassez em linguagem, gambiarra em poder e defeito em assinatura.</p>
          <blockquote>“Se o universo jogou fora, a Várzea dá um jeito.”</blockquote>
          <div className="canon"><article><b>O CONFLITO</b><p>Facções disputam o Nexus porque ele pode estabilizar a Várzea — ou reescrever quem pertence a ela.</p></article><article><b>O TOM</b><p>Comédia irreverente na superfície; afeto, perda e pertencimento sustentam cada absurdo.</p></article><article><b>A REGRA</b><p>Todo poder nasce de uma solução cotidiana levada a uma escala ridiculamente épica.</p></article></div>
        </div>
      </section>

      <section className="worldmap" id="mapa">
        <div className="map-intro"><span>03 / MAPA · EM REDESIGN</span><h2>A VÁRZEA<br/>DO FIM</h2><p>O mapa mantém a leitura tática atual, mas cada rota ganha identidade narrativa, habitantes e materiais próprios.</p></div>
        <div className="map-board"><img src="/images/mapa-atual.jpg" alt="Mapa atual do jogo, base para o redesign da Várzea do Fim"/><div className="construction">⚒ MAPA ATUAL<br/><b>REDESIGN EM CONSTRUÇÃO</b></div></div>
        <div className="territories">{territories.map(([id,name,route,copy]) => <article key={id}><b>{id}</b><small>{route}</small><h3>{name}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="manifest" id="universo">
        <div className="section-head"><span>01 / UNIVERSO</span><h2>O MUNDO NÃO É<br/>UM MULTIVERSO.<br/><i>É UM REMENDO.</i></h2><p>A Várzea do Fim existe onde realidades quebradas foram costuradas. Seus habitantes não foram escolhidos: sobreviveram porque aprenderam a transformar sobra em poder.</p></div>
        <div className="formula">
          <article><b>70%</b><h3>ARQUÉTIPO<br/>RECONHECÍVEL</h3><p>Avó, criança, pombo, motoboy, mascote. A leitura começa em algo humano e imediato.</p></article>
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
        <div className="roster-top"><div><span>05 / ROSTER GERAL</span><h2>20 HERÓIS.<br/>UMA NOVA FAMÍLIA.</h2></div><p>O guia será considerado pronto para implementação quando os dez primeiros personagens e o sistema estético estiverem aprovados.</p></div>
        <div className="filters">{["TODOS", "TOPO", "SELVA", "MEIO", "ATIRADOR", "SUPORTE"].map((item) => <button key={item} data-filter={item} className={filter === item ? "on" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
        <div className="roster-grid">
          {filtered.map((hero) => <article className={`hero-slot ${hero.image ? "complete" : ""}`} data-role={hero.role} key={hero.id} style={{ "--route": hero.color } as React.CSSProperties}>
            <div className="slot-image">{hero.image ? <img src={hero.image} alt={hero.name} /> : <span>{hero.id}</span>}</div>
            <div className="slot-meta"><small>{hero.id} · {hero.role}</small><h3>{hero.name}</h3><p>{hero.title}</p><b>{hero.status}</b></div>
          </article>)}
        </div>
      </section>

      <section className="chinela" id="chinela">
        <div className="chinela-art"><img src="/images/dona-chinela-v1.jpeg" alt="Dona Chinela, primeira heroína oficial do novo universo"/><div className="approved">CHARACTER 01<br/><b>APPROVED</b></div></div>
        <div className="chinela-copy">
          <span>06 / PERSONAGEM-MATRIZ</span><h2>DONA<br/>CHINELA</h2><h3>A ÚLTIMA PALAVRA</h3><p>Uma avó aparentemente acolhedora que trata a arena como uma reunião de condomínio fora de controle. Seu tamanco mecânico, O Corretivo, foi reconstruído com madeira, pistões, azulejos e tudo que sobrou do edifício que ela salvou.</p>
          <div className="stats"><div><b>13</b><span>VIDA</span></div><div><b>03</b><span>PODER</span></div><div><b>03</b><span>ARMADURA</span></div><div><b>01</b><span>ALCANCE</span></div></div>
          <div className="skills"><article><b>Q</b><div><strong>TAMANCADA</strong><p>Dano corpo a corpo. O básico consistente da personagem.</p></div></article><article><b>W</b><div><strong>VEM CÁ, MEU FILHO</strong><p>Puxa o inimigo uma casa e o prende nesta rodada.</p></div></article><article><b>R</b><div><strong>CHINELO VOADOR</strong><p>Atinge e prende todos os inimigos adjacentes.</p></div></article></div>
        </div>
      </section>

      <section className="sheet-study">
        <div className="sheet-label"><span>06B / CHARACTER SHEET RENDERIZADO</span><h2>MESMA HEROÍNA.<br/><i>TODOS OS ÂNGULOS.</i></h2><p>Estudo premium para validar consistência antes da modelagem 3D. Frente, costas, perfil, expressões e construção do Corretivo preservam o acabamento da arte-matriz.</p><b>TESTE PARA SUA VALIDAÇÃO · NÃO FINAL</b></div>
        <img src="/images/dona-chinela-character-sheet-rendered.jpg" alt="Character sheet renderizado da Dona Chinela com vistas, expressões e detalhe do tamanco"/>
      </section>

      <section className="bestiary" id="monstros">
        <div className="section-head light"><span>07 / BESTIÁRIO</span><h2>O MAPA<br/>TAMBÉM<br/><i>ATACA.</i></h2><p>Os monstros preservam a função mecânica dos objetivos atuais; nomes, lore e arte são a camada criativa em validação.</p></div>
        <div className="monster-grid">{monsters.map(([legacy,name,role,copy],i)=><article key={name}><div className="monster-mark"><span>?</span><b>0{i+1}</b></div><small>{legacy} → {role}</small><h3>{name}</h3><p>{copy}</p><em>⚒ CONCEITO · ARTE PENDENTE</em></article>)}</div>
      </section>

      <section className="items" id="itens">
        <div className="items-head"><div><span>08 / ARSENAL DA GAMBIARRA</span><h2>22 ITENS.<br/>ZERO GENÉRICOS.</h2></div><p>Cada item deverá parecer encontrado na Várzea, revelar seu uso pela silhueta e conversar visualmente com os heróis — sem alterar seus números até a atualização mecânica fechar.</p></div>
        <div className="item-grid">{Array.from({length:22},(_,i)=><article key={i}><b>?</b><span>{String(i+1).padStart(2,"0")}</span><small>⚒ EM CONSTRUÇÃO</small></article>)}</div>
      </section>

      <section className="cards">
        <div className="section-head"><span>09 / CARTAS &amp; OBJETOS</span><h2>DO RETRATO<br/>PARA A MESA.</h2><p>A mesma identidade atravessa carta digital, loop animado e miniatura física hexagonal.</p></div>
        <div className="formats"><article><b>01</b><h3>CARTA HEROICA</h3><p>Acting contextual, ambiente da rota, moldura de função e leitura instantânea de stats.</p><span>⚒ EM CONSTRUÇÃO</span></article><article><b>02</b><h3>LOOP ANIMADO</h3><p>3–5 segundos: respiração, olhar, partículas e movimento secundário da arma.</p><span>PLANEJADO</span></article><article><b>03</b><h3>MINIATURA 3D</h3><p>Silhueta imprimível, apoio estrutural, arma legível e base hexagonal padronizada.</p><span>TESTE PENDENTE</span></article><article><b>04</b><h3>CHARACTER SHEET</h3><p>Prancha renderizada com vistas, expressões, materiais e detalhe da arma.</p><span>EM PRODUÇÃO</span></article></div>
      </section>

      <section className="deliverables">
        <div className="section-head"><span>10 / KIT DE CADA HERÓI</span><h2>NÃO BASTA<br/>TER UM RETRATO.</h2><p>Cada personagem só fecha quando atravessa o pipeline completo.</p></div>
        <div className="stage-list">{stages.map((stage, i) => <div key={stage}><b>{String(i + 1).padStart(2, "0")}</b><strong>{stage}</strong><span>{i < 2 ? "DONA CHINELA · OK" : "PENDENTE"}</span></div>)}</div>
      </section>

      <section className="roadmap" id="roadmap">
        <span>11 / CORTE PARA IMPLEMENTAÇÃO</span><h2>PRIMEIRO<br/><i>DEZ.</i><br/>DEPOIS O JOGO.</h2>
        <div className="milestones"><article className="active"><b>01</b><strong>Fundação</strong><p>Lore, sistema visual e Dona Chinela como personagem-matriz.</p><span>EM CURSO</span></article><article><b>05</b><strong>Primeiro time</strong><p>Um herói por rota, mapa e primeiros monstros.</p><span>PRÓXIMO</span></article><article><b>10</b><strong>Guia implementável</strong><p>Dez heróis, cartas, UI, miniaturas-piloto e loops aprovados.</p><span>MARCO</span></article><article><b>20</b><strong>Roster completo</strong><p>Substituição total do elenco, seguida por itens e expansões.</p><span>FUTURO</span></article></div>
      </section>

      <footer><a className="logo" href="#top">JAGER<span>LARA</span>MAIS</a><p>VISUAL GUIDE · DOCUMENTO VIVO</p><a href="https://vilkers.github.io/jagerlaramais/" target="_blank" rel="noreferrer">ABRIR JOGO ↗</a></footer>
    </main>
  );
}
