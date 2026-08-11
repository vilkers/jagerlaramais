/* JAGERLARAMAIS — entrada da aplicação.
   Draft, abertura e inicialização da partida hotseat. */

/* ══════════════════ DRAFT ══════════════════ */
let dr=null;
function iniciaDraft(depois){
  dr={fase:"ban", passo:0, bans:[], times:[[],[]], aoFim:depois};
  telaDraft();
}

function telaDraft(){
  const ORDEM=typeof ORDEM_DRAFT!=="undefined"?ORDEM_DRAFT:
    [{rota:"topo",primeiro:0},{rota:"selva",primeiro:1},{rota:"meio",primeiro:0},
     {rota:"adc",primeiro:1},{rota:"sup",primeiro:0}];
  const NOMEROTA={topo:"Topo",selva:"Selva",meio:"Meio",adc:"Atirador",sup:"Suporte"};

  if(dr.fase==="ban"){
    const t=dr.passo;                       /* A bane, depois B bane */
    const lista=Object.keys(CATALOGO);
    /* com 4 heróis por rota, dois bans na mesma rota zerariam o counterpick dela */
    const rotasBanidas=dr.bans.map(id=>CATALOGO[id].pos);
    abre(`<div id="dr">
      <div class="dr-cab"><span class="et">Banimento · ${dr.passo+1} de 2</span>
        <h3 class="t${t}">${NOMES[t]} bane</h3>
        <p>Tire da partida um herói que você não quer ver do outro lado.
        ${rotasBanidas.length?"<br>Uma rota só pode perder um herói.":""}</p></div>
      <div class="dr-grade">${lista.map(id=>{const h=CATALOGO[id];
        const ban=dr.bans.includes(id)||rotasBanidas.includes(h.pos);
        return `<button class="dr-h${ban?" ban":""}" data-id="${id}" ${ban?"disabled":""}>
          <img src="${RETRATO(id)}" alt=""><div class="dn">${h.n}</div>
          <div class="dr2">${NOMEROTA[h.pos]}</div></button>`;}).join("")}</div>
      </div>`);
  } else if(dr.fase==="pick"){
    const et=ORDEM[Math.floor(dr.passo/2)];
    const t = dr.passo%2===0 ? et.primeiro : 1-et.primeiro;
    const rota=et.rota;
    const jaTem=id=>dr.times[0].includes(id)||dr.times[1].includes(id)||dr.bans.includes(id);
    const opcoes=Object.keys(CATALOGO).filter(id=>CATALOGO[id].pos===rota);
    const advers=dr.times[1-t][Math.floor(dr.passo/2)];
    abre(`<div id="dr">
      <div class="dr-cab"><span class="et">${NOMEROTA[rota]} · escolha ${dr.passo+1} de 10</span>
        <h3 class="t${t}">${NOMES[t]} escolhe</h3>
        <p>${advers?`O adversário levou <b>${CATALOGO[advers].n}</b> — escolha o counter.`
                   :"Você escolhe primeiro nesta rota."}</p></div>
      <div class="dr-grade">${opcoes.map(id=>{const h=CATALOGO[id],fora=jaTem(id);
        return `<button class="dr-h${fora?" tomado":""}" data-id="${id}" ${fora?"disabled":""}>
          <img src="${RETRATO(id)}" alt=""><div class="dn">${h.n}</div>
          <div class="dr2">${h.ep||""}</div></button>`;}).join("")}</div>
      <div class="dr-times">
        ${[0,1].map(x=>dr.times[x].map(id=>
          `<span class="dr-chip t${x}"><img src="${RETRATO(id)}" alt="">${CATALOGO[id].n}</span>`).join("")).join("")}
      </div></div>`);
  }
  document.querySelectorAll(".dr-h").forEach(b=>b.onclick=()=>{
    const id=b.dataset.id; vibra(10);
    if(dr.fase==="ban"){
      dr.bans.push(id); dr.passo++;
      if(dr.passo>=2){ dr.fase="pick"; dr.passo=0; }
    }else{
      const et=ORDEM[Math.floor(dr.passo/2)];
      const t = dr.passo%2===0 ? et.primeiro : 1-et.primeiro;
      dr.times[t].push(id); dr.passo++;
      if(dr.passo>=10){ fecha(); return dr.aoFim(dr.times); }
    }
    telaDraft();
  });
}

/* ══════════════════ BOOT ══════════════════ */
function partida(comTutorial){
  baralho = typeof montaDeck!=="undefined" ? montaDeck() : [];
  cemiterio=[]; maos=[[],[]]; descontos=[0,0];
  if(comTutorial) iniciaTutorial();   /* fica no painel, atrás das telas de fluxo */
  novo();                             /* dispara a fase de comando oculto */
  pinta();
}
function comeca(comTutorial,comDraft){
  if(!comDraft) return partida(comTutorial);
  iniciaDraft(times=>{ TIMES=times; partida(comTutorial); });
}
function telaAbertura(){
  abre(`<span class="et">Um MOBA de mesa para dois</span><h2>JAGER<br>LARAMAIS</h2>
    <p>Cada um comanda <b>cinco heróis</b> — no mesmo aparelho.</p>
    <button class="grande" id="ok">Jogar o tutorial</button>
    <button class="grande" id="btDraft">Partida com draft</button>
    <button class="grande" id="btDireto"
      style="background:none;border:1px solid var(--line);color:var(--ink-2)">Partida rápida</button>`,
    ()=>comeca(true,false));
  G("btDraft").onclick=()=>comeca(false,true);
  G("btDireto").onclick=()=>comeca(false,false);
}
telaAbertura();
