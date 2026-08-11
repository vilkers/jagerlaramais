/* JAGERLARAMAIS — Deck de Comando.
   Compra, mão, descarte e efeitos das cartas durante a partida. */

/* ══════════════════ DECK DE COMANDO ══════════════════ */
const CARTA=typeof DECK!=="undefined"?Object.fromEntries(DECK.map(c=>[c.id,c])):{};

/* rede de segurança: se faltar arte, desenha a inicial sobre a cor da rota.
   Com o pool em 20 heróis, todos têm retrato — isso só protege contra id novo sem imagem. */
function retratoProv(id){
  const h=CATALOGO[id]||{n:"?",pos:"topo"};
  const cor=(POS[h.pos]||{cor:"#6C817C"}).cor;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${cor}" stop-opacity=".55"/>
      <stop offset="1" stop-color="#0B120F"/></linearGradient></defs>
    <rect width="100" height="100" fill="url(#g)"/>
    <text x="50" y="66" font-family="Avenir Next Condensed,Impact,sans-serif" font-size="52"
      font-weight="700" fill="#E8F0EA" fill-opacity=".82" text-anchor="middle">${h.n[0]}</text></svg>`;
  return "data:image/svg+xml;utf8,"+encodeURIComponent(svg);
}
const RETRATO=id=>ARTE[id]||retratoProv(id);
/* Item sem arte vira selo de latão com a inicial. Sem isso, os 10 itens de
   ITENS_NOVOS entrariam na loja com `src="undefined"` e ícone quebrado. */
function itemProv(id){
  const n=(ITEM[id]||{n:"?"}).n;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#18251F"/>
    <circle cx="50" cy="50" r="31" fill="none" stroke="#8A6A2F" stroke-width="4"/>
    <text x="50" y="64" font-family="Copperplate,Georgia,serif" font-size="38"
      fill="#D4A24C" text-anchor="middle">${n[0]}</text></svg>`;
  return "data:image/svg+xml;utf8,"+encodeURIComponent(svg);
}
const ARTE_I = typeof ARTE_ITEM!=="undefined" ? ARTE_ITEM : {};
const RETRATO_ITEM=id=>ARTE_I[id]||itemProv(id);
/* mesma rede de segurança para os monstros do poço */
const ARTE_M = typeof ARTE_MONSTRO!=="undefined" ? ARTE_MONSTRO : {};
const RETRATO_EPICO=id=>ARTE_M[id]||("data:image/svg+xml;utf8,"+encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#1B2A24"/>
    <text x="50" y="68" font-family="Impact,sans-serif" font-size="60" fill="#D4A24C"
      text-anchor="middle">${(EPICO[id]||{n:"?"}).n[0]}</text></svg>`));
const COR_FAM={dado:"#D4A24C",tempo:"#5B93B8",reacao:"#B75C52",mapa:"#6E8F6A",
               economia:"#A87F92",buff:"#8A7CAE",item:"#4F7F7A"};
const ARTE_C = typeof ARTE_CARTA!=="undefined" ? ARTE_CARTA : {};
/* face da carta em tamanho grande — usada na compra e em qualquer tela de revelação */
function faceCarta(id){
  const c=CARTA[id];
  return `<div class="cartona" style="--fam:${COR_FAM[c.fam]}">
    ${ARTE_C[id]?`<img src="${ARTE_C[id]}" alt="">`:""}
    <div class="cx"><div class="fam">${c.fam}</div>
      <div class="cn">${c.n}</div><div class="cd">${c.d}</div></div></div>`;
}
let baralho=[], cemiterio=[], maos=[[],[]], descontos=[0,0];

/* Buffs temporários escrevem nos campos que o motor já soma (extraPoder, arm, agil)
   e guardam o quanto aplicaram, para devolver no fim da rodada.
   poderTotal/armTotal/ehAgil são const no motor — não dá para envolvê-las. */
function aplicaBuff(h,campo,v){
  if(campo==="poder"){ h.extraPoder+=v; h.buffP=(h.buffP||0)+v; }
  if(campo==="arm"){ h.arm+=v; h.buffA=(h.buffA||0)+v; }
  if(campo==="agil"){ if(!h.agil){ h.agil=1; h.buffAgil=1; } }
}
function limpaBuffs(){
  todos().forEach(h=>{
    if(h.buffP){ h.extraPoder-=h.buffP; h.buffP=0; }
    if(h.buffA){ h.arm-=h.buffA; h.buffA=0; }
    if(h.buffAgil){ h.agil=0; h.buffAgil=0; }
  });
}

function compra(t){
  if(!baralho.length){ baralho=cemiterio.splice(0).sort(()=>Math.random()-.5);
    if(baralho.length) reg("b","o baralho foi reembaralhado"); }
  if(!baralho.length) return null;
  const c=baralho.pop(); maos[t].push(c);
  if(maos[t].length>3){ const fora=maos[t].shift(); cemiterio.push(fora);
    reg(t?"c":"a",`mão cheia — ${CARTA[fora].n} foi descartada`); }
  return c;
}
function podeJogar(id){
  const c=CARTA[id], ef=c.ef;
  const dLivre=dadoSel!==null&&!J.dados[dadoSel].usado;
  if(ef.rerolar||ef.ajustar||ef.dadoParaMov) return dLivre;
  if(ef.buffPoder||ef.buffArm||ef.buffEscudo||ef.buffAgil||ef.ouro||ef.recall||
     ef.reativar||ef.anularDano||ef.moverReacao||ef.slotExtra) return !!selHeroi&&!selHeroi.morto;
  if(ef.itemGratis) return !!selHeroi&&!selHeroi.morto&&(ef.ondeEstiver||naBase(selHeroi));
  if(ef.doCemiterio) return cemiterio.length>0;
  return true;
}
function jogaCarta(id){
  const c=CARTA[id], ef=c.ef, t=J.vez, h=selHeroi;
  if(!podeJogar(id)) return toast("não dá para jogar agora","morte");
  let msg=c.n;

  if(ef.rerolar){ J.dados[dadoSel].v=rolaAcao(); msg+=` → ${J.dados[dadoSel].v}`; }
  if(ef.ajustar){ const d=J.dados[dadoSel]; d.v=Math.min(6,d.v+1); msg+=` → ${d.v}`; }
  if(ef.dadoParaMov){ const d=J.dados[dadoSel]; d.usado=1;
    J.mov.rest+=d.v*2; J.mov.v+=d.v*2; dadoSel=null; msg+=` → +${d.v*2} de movimento`; }
  if(ef.movExtra){ J.mov.rest+=ef.movExtra; J.mov.v+=ef.movExtra; }
  if(ef.moverReacao){ J.mov.rest+=1; J.mov.v+=1; }
  if(ef.dadoExtra){ const v=rolaAcao();
    J.dados.push({v,usado:0,extra:1}); msg+=` → dado ${v}`; }
  if(ef.reativar){ h.agiu=0; msg+=` → ${h.n} pode agir de novo`; }
  if(ef.buffPoder){ aplicaBuff(h,"poder",ef.buffPoder); msg+=` → ${h.n} +${ef.buffPoder} de Poder`; }
  if(ef.buffArm){ aplicaBuff(h,"arm",ef.buffArm); msg+=` → ${h.n} +${ef.buffArm} de Armadura`; }
  if(ef.buffEscudo||ef.anularDano){ const v=ef.buffEscudo||ef.anularDano;
    h.esc+=v; fx(h.pos,"⛨"+v,"esc"); msg+=` → escudo ${v} em ${h.n}`; }
  if(ef.buffAgil){ aplicaBuff(h,"agil",1); msg+=` → ${h.n} está ágil`; }
  if(ef.ouro){ h.ouro+=ef.ouro; msg+=` → ${h.n} +${ef.ouro} de ouro`; }
  if(ef.desconto){ descontos[t]+=ef.desconto; }
  if(ef.slotExtra){ h.slots=(h.slots||3)+1; msg+=` → ${h.n} tem ${h.slots} slots`; }
  if(ef.recall){ h.pos=[...BASE[t][0]]; desempilha(); msg+=` → ${h.n} volta à base`; }
  if(ef.ward){ J.times[t].ward=1; const z=J.times[1-t].caca;
    msg+=z?` → Caçador inimigo vai ao ${z.toUpperCase()}`:" → ward posta"; }
  if(ef.revelarCaca){ const z=J.times[1-t].caca;
    J.times[1-t].cacaRevelada=z; msg+=z?` → Caçador inimigo no ${z.toUpperCase()}`:" → nada escondido"; }
  if(ef.empurrarOnda){
    const rota=["topo","meio","baixo"][Math.floor(Math.random()*3)];
    J.frentes[rota]=limitaFrente(rota, J.frentes[rota]+(t===0?1:-1));
    msg+=` → onda do ${rota} avança`; }
  if(ef.itemGratis){
    const opc=ITENS.filter(i=>i.o<=ef.itemGratis&&!h.itens.includes(i.id));
    if(opc.length&&h.itens.length<(h.slots||3)){
      const it=opc[Math.floor(Math.random()*opc.length)];
      h.itens.push(it.id); if(it.ef.vida){h.vidaMax+=it.ef.vida;h.vida+=it.ef.vida;}
      msg+=` → ${h.n} equipa ${it.n}`;
    } else msg+=" → sem item disponível";
  }
  if(ef.doCemiterio){ const volta=cemiterio.pop(); maos[t].push(volta);
    msg+=` → recuperou ${CARTA[volta].n}`; }

  maos[t]=maos[t].filter(x=>x!==id); cemiterio.push(id);
  reg(t?"c":"a",msg); toast(c.n,""); vibra(12);
  calcula(); pinta(); if(sheetAberto==="Cartas") abreMao();
}
function abreMao(){
  const t=J.vez, mao=maos[t];
  const corpo = !mao.length
    ? `<p style="color:var(--ink-3);font-size:13.5px;margin:0;line-height:1.5">
         Mão vazia. Você compra <b style="color:var(--brass)">1 carta</b> no início de cada turno.</p>`
    : `<div class="mao">${mao.map(id=>{const c=CARTA[id],ok=podeJogar(id);
        return `<button class="ct${ok?"":" off"}" style="--fam:${COR_FAM[c.fam]}" data-c="${id}" ${ok?"":"disabled"}>
          ${ARTE_C[id]?`<img class="th" src="${ARTE_C[id]}" alt="">`:""}
          <div style="flex:1"><div class="fam">${c.fam}</div><div class="cn">${c.n}</div>
          <div class="cd">${c.d}</div></div></button>`;}).join("")}</div>`;
  abreSheet("Cartas",
    `<div class="deckinfo"><span>baralho ${baralho.length}</span><span>cemitério ${cemiterio.length}</span>
      <span>mão ${mao.length}/3</span></div>`+corpo+
    (mao.length&&!selHeroi?`<p style="color:var(--ink-3);font-size:12px;margin:12px 0 0">
       Cartas que afetam um herói pedem que ele esteja <b style="color:var(--brass)">selecionado</b>.</p>`:""));
  G("shCorpo").querySelectorAll(".ct").forEach(b=>b.onclick=()=>jogaCarta(b.dataset.c));
}
