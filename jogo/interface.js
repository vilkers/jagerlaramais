/* JAGERLARAMAIS — interface e interação.
   Renderização do mapa, gestos, painéis, tutorial e fluxo visual da partida. */

/* ══════════════════ BASE VISUAL ══════════════════ */
const NS="http://www.w3.org/2000/svg";
const el=(t,a={})=>{const e=document.createElementNS(NS,t);for(const q in a)e.setAttribute(q,a[q]);return e;};
const svg=document.getElementById("mapa");
/* O viewBox sai da geometria, não de número escrito no HTML: trocar `N` tem que
   redesenhar o mapa inteiro sem ninguém lembrar de ajustar o SVG à mão. Mede só
   as casas que existem — a borda sem par não entra e não vira margem morta. */
(()=>{ let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){ if(!noTab(c,r))continue;
    const[x,y]=centro(c,r); x0=Math.min(x0,x-R);y0=Math.min(y0,y-R);x1=Math.max(x1,x+R);y1=Math.max(y1,y+R); }
  const m=6;
  svg.setAttribute("viewBox",`${(x0-m).toFixed(1)} ${(y0-m).toFixed(1)} ${(x1-x0+2*m).toFixed(1)} ${(y1-y0+2*m).toFixed(1)}`);
})();
const palco=document.getElementById("palco");
const G=id=>document.getElementById(id);
function vibra(p){ if(navigator.vibrate) try{navigator.vibrate(p);}catch(e){} }

/* ícones por natureza da habilidade — lidos do próprio efeito, sem tabela paralela */
const ICO={
  espada:"M6 18L18 6M14 6h4v4M7 15l2 2",
  mira:"M12 3v3M12 18v3M3 12h3M18 12h3M12 7a5 5 0 100 10 5 5 0 000-10",
  raio:"M13 3L6 13h5l-1 8 7-10h-5z",
  escudo:"M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z",
  cruz:"M12 6v12M6 12h12",
  corrente:"M10 8h4a4 4 0 010 8h-4a4 4 0 010-8M9 12h6",
  olho:"M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6",
  estrela:"M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z",
  dado:"M5 5h14v14H5zM9 9h.01M15 9h.01M9 15h.01M15 15h.01",
  passos:"M12 20V6M6 12l6-6 6 6",
  oculto:"M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M6.5 6.6C4 8.2 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.3-.9",
  casa:"M4 11l8-7 8 7v9h-6v-5h-4v5H4z"
};
function iconeDe(hb){
  const e=hb.ef;
  if(e.ward) return ICO.olho;
  if(e.intocavel) return ICO.oculto;
  if(e.doar) return ICO.dado;
  if(e.revive) return ICO.cruz;
  if(e.escudo) return ICO.escudo;
  if(e.cura) return ICO.cruz;
  if(e.danoVizinhos||e.danoRaio||e.area) return ICO.estrela;
  if(e.danoFixo) return ICO.raio;
  if(e.puxar||e.empurrar||e.prende||e.prendeVizinhos||e.marca) return ICO.corrente;
  if(e.dano) return ICO.espada;
  return ICO.passos;
}
const svgIco=(d,cls="")=>`<svg viewBox="0 0 24 24" class="${cls}"><path d="${d}"/></svg>`;

/* descrição legível do efeito — o jogador nunca precisa decorar */
function descreve(h,hb,F){
  const e=hb.ef, p=poderTotal(h);
  const t=[];
  if(e.danoFixo) t.push(`${e.danoFixo} de dano`);
  else if(e.dano){
    const base=F!=null?Math.round(F*e.dano)+p+(e.extra||0):null;
    t.push(base!=null?`~${base} de dano`:`Força + ${p} de dano`);
  }
  if(e.area) t.push("respinga nos vizinhos");
  if(e.danoVizinhos) t.push("dano em todos os vizinhos");
  if(e.danoRaio) t.push(`dano em todos até ${e.danoRaio} casas`);
  if(e.escudo) t.push(`escudo ${F!=null?F+e.escudo:"Força+"+e.escudo}`);
  if(e.cura) t.push(`cura ${e.cura}`);
  if(e.ouro) t.push(`+${e.ouro} de ouro`);
  if(e.recarga) t.push(`próximo golpe +${e.recarga}`);
  if(e.intocavel) t.push("fica intocável");
  if(e.ward) t.push("revela o Caçador inimigo");
  if(e.revive) t.push("acelera o respawn de um aliado");
  if(e.marca) t.push(`marca: próximo dano +${e.marca}`);
  if(e.doar) t.push("passa este dado a um aliado");
  if(e.puxar) t.push("puxa");
  if(e.empurrar) t.push("empurra");
  if(e.prende||e.prendeVizinhos) t.push("prende");
  if(e.executa) t.push(`executa com ${e.executa} de vida ou menos`);
  if(e.bonusFerido) t.push(`+${e.bonusFerido} em alvo ferido`);
  if(e.semAlcance) t.push("qualquer distância");
  return t.join(" · ")||"—";
}

/* ══════════════════ EFEITOS DE TELA ══════════════════ */
function fx(pos,txt,tipo){
  const [x,y]=centro(...pos);
  let px,py;
  try{
    const pt=svg.createSVGPoint(); pt.x=x; pt.y=y;
    const sp=pt.matrixTransform(svg.getScreenCTM());
    const pr=palco.getBoundingClientRect();
    px=sp.x-pr.left; py=sp.y-pr.top;
  }catch(e){ return; }
  const d=document.createElement("div");
  d.className="flut "+tipo; d.textContent=txt;
  d.style.left=px+"px"; d.style.top=py+"px";
  G("fx").appendChild(d);
  setTimeout(()=>d.remove(),1050);
}
function toast(txt,tipo){
  const d=document.createElement("div");
  d.className="tst"+(tipo?" "+tipo:""); d.textContent=txt;
  G("toast").appendChild(d);
  setTimeout(()=>d.remove(),2300);
}
function tremer(h){
  agendaAnim(()=>{
    const g=svg.querySelector(`[data-peca="${h.t}-${h.id}"]`);
    if(!g)return;
    g.classList.remove("treme"); void g.getBBox(); g.classList.add("treme");
    setTimeout(()=>g.classList.remove("treme"),360);
  });
}
function fotografa(){ return new Map(todos().map(h=>[h,{v:h.vida,e:h.esc,m:h.morto}])); }
function revela(snap){
  let bateu=false;
  todos().forEach(h=>{
    const s=snap.get(h); if(!s)return;
    const dv=h.vida-s.v;
    if(dv<0){ fx(h.pos,dv,"dano"); tremer(h); bateu=true; }
    else if(dv>0) fx(h.pos,"+"+dv,"cura");
    const de=h.esc-s.e;
    if(de>0) fx(h.pos,"⛨+"+de,"esc");
    else if(de<0){ fx(h.pos,"⛨"+de,"esc"); tremer(h); bateu=true; }
    if(h.morto&&!s.m){ fx(h.pos,"☠","morte"); toast(h.n+" caiu","morte"); vibra([35,55,35]); }
  });
  if(bateu) vibra(18);
}
const _usaHab=usaHab;
usaHab=function(alvo){
  const s=fotografa();
  /* posição capturada ANTES: puxar e empurrar mudam o alvo de casa no meio do golpe */
  const quem=ativo&&ativo.h, onde=alvo&&alvo!==quem&&alvo.pos?[...alvo.pos]:null;
  _usaHab(alvo); revela(s);
  if(quem&&onde) agendaAnim(()=>animaAtaque(quem,onde));
};
const _revelaCaca=revelaCaca;
revelaCaca=function(t){
  const z=J.times[t].caca, s=fotografa();
  _revelaCaca(t);
  if(z&&z!=="selva"&&!J.fim) toast("GANK NO "+z.toUpperCase(),"gank");
  revela(s);
};

/* Fila de animação da peça. `pinta()` refaz o SVG inteiro (svg.textContent=""), e
   tudo que era aplicado à peça ANTES dele morria junto — foi por isso que `tremer`
   nunca apareceu na tela: era chamado de `revela()`, que roda antes do redesenho de
   `confirmaHab`. Agendar e disparar no fim de `pinta()` conserta isso de uma vez. */
let animPend=[];
function agendaAnim(fn){ animPend.push(fn); }
function rodaAnims(){
  if(!animPend.length)return;
  const fila=animPend; animPend=[];
  requestAnimationFrame(()=>fila.forEach(f=>{ try{ f(); }catch(e){} }));
}
/* O golpe: a peça avança meio caminho na direção do alvo e volta. Vale para herói,
   torre, Nexus e poço — o alvo entra como posição, não como objeto, justamente para
   estrutura poder usar a mesma animação. O avanço é limitado a pouco mais de meio
   hexágono para o atirador de alcance 3 não atravessar o tabuleiro em 380ms. */
function animaAtaque(quem,pos){
  const g=svg.querySelector(`[data-peca="${quem.t}-${quem.id}"]`);
  if(!g||!pos)return;
  const [x0,y0]=centro(...quem.pos), [x1,y1]=centro(...pos);
  const dx=x1-x0, dy=y1-y0, n=Math.hypot(dx,dy);
  if(!n)return;
  const esc=(()=>{ try{ const m=svg.getScreenCTM(); return m?m.a:1; }catch(e){ return 1; } })();
  const av=Math.min(n*0.5, R*0.62)*esc;
  try{
    g.animate([{transform:"none",offset:0},
               {transform:`translate(${dx/n*av}px,${dy/n*av}px)`,offset:.38},
               {transform:"none",offset:1}],
      {duration:380,easing:"cubic-bezier(.2,.85,.3,1)"});
  }catch(e){}
}
let animandoDe=null;
function animaMovimento(h,de){
  const g=svg.querySelector(`[data-peca="${h.t}-${h.id}"]`);
  if(!g||!de)return;
  const [x0,y0]=centro(...de), [x1,y1]=centro(...h.pos);
  const esc=(()=>{ try{ const m=svg.getScreenCTM(); return m?m.a:1; }catch(e){ return 1; } })();
  try{
    g.animate([{transform:`translate(${(x0-x1)*esc}px,${(y0-y1)*esc}px)`},{transform:"none"}],
      {duration:300,easing:"cubic-bezier(.3,.9,.3,1)"});
  }catch(e){}
}

/* ══════════════════ TELAS ══════════════════ */
function abre(html,aoOk){
  G("tela").classList.add("on");
  G("telacx").innerHTML=html;
  const b=G("ok"); if(b&&aoOk)b.onclick=aoOk;
}
function fecha(){ G("tela").classList.remove("on"); }

let sheetAberto=null;
function abreSheet(tit,html){
  sheetAberto=tit; G("shTit").textContent=tit; G("shCorpo").innerHTML=html;
  G("sheet").classList.add("on"); G("veu").classList.add("on");
}
function fechaSheet(){ sheetAberto=null; G("sheet").classList.remove("on"); G("veu").classList.remove("on"); }
G("shX").onclick=fechaSheet; G("veu").onclick=fechaSheet;

/* ══════════════════ ESTADO DE INTERAÇÃO ══════════════════
   Um modo por vez. Nunca dois gestos disputando o mesmo toque.
   null → só olhando | "mover" → escolhendo casa | "mirar" → escolhendo alvo        */
let modo=null, habAtual=null, confirmar=null;

function limpaModo(){ modo=null; habAtual=null; confirmar=null; ativo=null; habSel=null; calcula(); }
function cancela(){ limpaModo(); selHeroi=null; pinta(); }

function calcula(){
  mover=[]; alvos=[]; alvosTorre=[]; alvosEpico=[]; alvoNexus=null;
  if(modo==="mover"&&selHeroi&&!selHeroi.morto&&selHeroi.t===J.vez&&!selHeroi.preso&&J.mov.rest>0){
    const teto=J.mov.rest+(ehAgil(selHeroi)?1:0);
    for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
      if(!noTab(c,r)||em(c,r))continue;   // casa fora do tabuleiro não é destino
      const d=dist(...selHeroi.pos,c,r);
      if(d>0&&d<=teto) mover.push([c,r]);
    }
  }
  /* o Lampejo pinta as mesmas casas verdes do mover, mas com outra régua:
     ignora movimento restante e ignora `preso`. Só não atravessa para dentro
     da base inimiga — de lá o Nexus ficaria a um salto de distância. */
  if(modo==="lampejo"&&selHeroi&&!selHeroi.morto&&selHeroi.t===J.vez&&temFeitico(selHeroi.t)){
    for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
      if(!noTab(c,r)||em(c,r))continue;
      if(BASE_S.get(k(c,r))===1-selHeroi.t)continue;
      const d=dist(...selHeroi.pos,c,r);
      if(d>0&&d<=LAMPEJO_ALC) mover.push([c,r]);
    }
  }
  if(modo==="mirar"&&selHeroi&&habAtual!==null){
    const h=selHeroi, hb=h.habs[habAtual], alc=alcTotal(h)+(hb.ef.alcExtra||0);
    alvos=todos().filter(o=>{
      if(o.morto)return false;
      if(hb.alvo==="in"&&(o.t===h.t||o.intoc))return false;
      if(hb.alvo==="al"&&(o.t!==h.t||o===h))return false;
            if(hb.alvo==="eu")return o===h;
      return hb.ef.semAlcance||dist(...h.pos,...o.pos)<=alc;
    });
    alvosTorre=torresAoAlcance(h,hb,alc);
    alvosEpico=epicosAoAlcance(h,hb,alc);
    alvoNexus=nexusAoAlcance(h,hb,alc);
  }
}
/* O épico não tem dono, então não tem a trava da onda que a torre tem: qualquer um
   bate, a qualquer hora, quantas vezes quiser. É de propósito — o último golpe leva
   o prêmio inteiro, e é essa janela que transforma o objetivo em briga. */
function epicosAoAlcance(h,hb,alc){
  if(!(hb.ef.dano||hb.ef.danoFixo)||hb.alvo!=="in") return [];
  if(J.poco.vida<=0) return [];
  return (hb.ef.semAlcance||dist(...h.pos,...POCO)<=alc) ? [J.poco] : [];
}
/* A torre EXPOSTA de uma rota: a mais avançada que ainda está de pé. Enquanto
   ela vive, a de trás não aceita golpe — senão dava para passar por fora da
   linha de frente e bater direto na porta da base. Time 0 avança para índice
   maior, time 1 para índice menor: por isso os dois extremos. */
function torreExposta(rota,t){
  const vivas=J.torres.filter(x=>x.rota===rota&&x.t===t&&x.vida>0);
  if(!vivas.length) return null;
  return vivas.reduce((a,b)=>((t===0?b.i>a.i:b.i<a.i)?b:a));
}
/* Até a v0.6 havia aqui `if(J.frentes[tr.rota]!==tr.i) return false;` — a torre
   só aceitava golpe de herói com a ONDA em cima dela. Na prática o herói nunca
   cercava: esperava o creep chegar. Agora quem decide é a posição do herói, e a
   onda voltou a ser o que devia ser — pressão constante, não permissão. */
function torresAoAlcance(h,hb,alc){
  if(!(hb.ef.dano||hb.ef.danoFixo)||hb.alvo!=="in") return [];
  return J.torres.filter(tr=>{
    if(tr.t===h.t||tr.vida<=0) return false;
    if(torreExposta(tr.rota,tr.t)!==tr) return false;
    return hb.ef.semAlcance||dist(...h.pos,...ROTAS[tr.rota][tr.i])<=alc;
  });
}

/* O Nexus só fica exposto quando uma rota INTEIRA daquele lado cai — as duas
   torres da rota no chão. É o que separa "invadir" de "ganhar por atalho":
   sem isso um assassino veloz correria para a base na rodada 2. */
const rotaAberta=t=>Object.keys(ROTAS).some(nome=>
  !J.torres.some(x=>x.rota===nome&&x.t===t&&x.vida>0));
function nexusAoAlcance(h,hb,alc){
  if(!(hb.ef.dano||hb.ef.danoFixo)||hb.alvo!=="in") return null;
  const lado=1-h.t;
  if(J.nexus[lado]<=0||J.nexusBatido[lado]) return null;
  if(!rotaAberta(lado)) return null;
  const d=Math.min(...BASE[lado].map(([c,r])=>dist(...h.pos,c,r)));
  return (hb.ef.semAlcance||d<=alc) ? lado : null;
}

/* dado que será gasto: o escolhido à mão, senão o menor que atende */
function dadoPara(hb){
  if(dadoSel!==null&&!J.dados[dadoSel].usado&&J.dados[dadoSel].v>=hb.f
     &&(!J.dados[dadoSel].dono||J.dados[dadoSel].dono===selHeroi?.id)) return dadoSel;
  let melhor=null;
  J.dados.forEach((d,i)=>{
    if(d.usado||d.v<hb.f||(d.dono&&d.dono!==selHeroi?.id))return;
    if(melhor===null||d.v<J.dados[melhor].v) melhor=i;
  });
  return melhor;
}

function escolheHeroi(h){
  if(cliqueBloqueado||J.fase!=="jogando")return;
  if(modo==="mirar"&&alvos.includes(h)) return confirmaHab(h);
  if(h.t!==J.vez||h.morto){ // inspeciona o adversário sem mudar de estado
    abreCarta(h); return;
  }
  limpaModo();
  selHeroi = selHeroi===h ? null : h;
  pinta();
}
function iniciaMover(){
  if(!selHeroi||J.mov.rest<=0)return;
  if(selHeroi.preso) return toast("preso nesta rodada","morte");
  modo = modo==="mover" ? null : "mover";
  habAtual=null; confirmar=null; calcula(); vibra(8); pinta();
}
function iniciaHab(i){
  if(!selHeroi)return;
  /* um dado de ação por herói por rodada. É o que o manual sempre prometeu:
     3 dados para 5 heróis, e quem fica de fora farma 3. Sem esta trava dava
     para empilhar os 3 dados no mesmo herói e atacar três vezes. */
  if(selHeroi.agiu) return toast("já agiu nesta rodada","morte");
  const hb=selHeroi.habs[i];
  const d=dadoPara(hb);
  if(d===null) return toast("nenhum dado chega a Força "+hb.f,"morte");
  if(confirmar===i) return confirmaHab(hb.alvo==="eu"?selHeroi:null);
  modo="mirar"; habAtual=i; calcula();
  if(hb.alvo==="eu"){ confirmar=i; vibra(8); return pinta(); }
  if(!alvos.length&&!alvosTorre.length&&!alvosEpico.length&&alvoNexus===null){
    limpaModo(); pinta();
    return toast(hb.alvo==="al"?"nenhum aliado no alcance":"ninguém no alcance","morte");
  }
  confirmar=null; vibra(8); pinta();
}
function confirmaHab(alvo){
  if(!selHeroi||habAtual===null)return;
  const hb=selHeroi.habs[habAtual];
  const di=dadoPara(hb);
  if(di===null)return;
  const d=J.dados[di];
  d.usado=1; selHeroi.agiu=1;
  ativo={h:selHeroi,forca:d.v,seis:d.v===6};
  habSel=habAtual;
  reg(J.vez?"c":"a",`${selHeroi.n} usa ${hb.n} com o dado ${d.v}`);
  dadoSel=null; vibra(14);
  usaHab(alvo||selHeroi);
  modo=null; habAtual=null; confirmar=null; ativo=null; habSel=null;
  calcula(); pinta();
}
/* O golpe na torre não passa por usaHab: torre não tem armadura, escudo nem status.
   Cada dado ofensivo disponível pode causar um golpe; não há trava por torre. */
function atacaTorre(tr){
  if(!selHeroi||habAtual===null)return;
  const h=selHeroi, hb=h.habs[habAtual], di=dadoPara(hb);
  if(di===null)return;
  J.dados[di].usado=1; h.agiu=1; dadoSel=null; vibra(16);

  tr.vida-=DANO_TORRE;
  agendaAnim(()=>animaAtaque(h,ROTAS[tr.rota][tr.i]));
  reg(J.vez?"c":"a",`${h.n} bate na torre do ${tr.rota} com ${hb.n} `+
      `(${Math.max(0,tr.vida)}/${VIDA_TORRE})`);
  fx(ROTAS[tr.rota][tr.i],"-"+DANO_TORRE,"dano");

  if(tr.vida<=0){
    reg("b",`TORRE CAIU — ${tr.rota}, lado ${NOMES[tr.t]}`);
    toast("TORRE CAIU","gank"); vibra([40,60,40]);
  }else{
    /* o revide nunca mata: a torre é pedágio, não morte sem autor —
       senão `mata()` ficaria sem quem creditar o ouro */
    const levou=Math.min(REVIDE_TORRE,h.vida-1);
    if(levou>0){ h.vida-=levou; reg("b",`a torre revida — ${levou} em ${h.n}`);
      fx(h.pos,-levou,"dano"); tremer(h); }
  }
  modo=null; habAtual=null; confirmar=null; ativo=null; habSel=null;
  calcula(); pinta();
}

/* O Nexus, pela mesma porta da torre: dano fixo de 1, um golpe por rodada, e sem
   revide — quem chegou até aqui já pagou o pedágio das duas torres da rota.
   Até a v0.6 não existia caminho nenhum: só a onda derrubava Nexus, e a partida
   terminava sem que ninguém desse o golpe final. */
function atacaNexus(lado){
  if(!selHeroi||habAtual===null)return;
  const h=selHeroi, hb=h.habs[habAtual], di=dadoPara(hb);
  if(di===null)return;
  J.dados[di].usado=1; h.agiu=1; dadoSel=null; vibra(18);

  J.nexus[lado]--; J.nexusBatido[lado]=1;
  agendaAnim(()=>animaAtaque(h,BASE[lado][0]));
  reg(J.vez?"c":"a",`${h.n} golpeia o NEXUS ${NOMES[lado]} com ${hb.n} `+
      `(${Math.max(0,J.nexus[lado])}/${VIDA_NEXUS})`);
  fx(BASE[lado][0],"-1","dano");

  if(J.nexus[lado]<=0){
    J.fim=1-lado; J.motivoFim=`Nexus ${NOMES[lado]} destruído por ${h.n}.`;
    reg("b",`NEXUS ${NOMES[lado]} DESTRUÍDO`);
    toast("NEXUS DESTRUÍDO","gank"); vibra([60,80,60]);
  }else{ toast("NEXUS EM "+J.nexus[lado],"gank"); }
  modo=null; habAtual=null; confirmar=null; ativo=null; habSel=null;
  calcula(); pinta();
}

/* mesma porta da torre: dano fixo, sem armadura e sem status — mas sem a trava de
   um golpe por rodada, e com o prêmio indo para quem der o último. */
function atacaEpico(ep){
  if(!selHeroi||habAtual===null)return;
  const h=selHeroi, hb=h.habs[habAtual], di=dadoPara(hb);
  if(di===null)return;
  const d=EPICO[ep.id];
  J.dados[di].usado=1; h.agiu=1; dadoSel=null; vibra(16);

  /* A ultimate vale por duas. Antes todo golpe tirava 1, e a consequência era que
     a habilidade básica de Força 1 era o jeito mais barato de matar o épico — o
     objetivo grande premiava o dado pequeno. Com 2, derrubar o poço em uma rodada
     exige que alguém queime a ultimate nele em vez de num herói: é a escolha que
     faz o objetivo pesar. Testado na mesa antes de entrar. */
  const golpe = habAtual===2 ? GOLPE_ULT : GOLPE_HAB;
  ep.vida-=golpe;
  agendaAnim(()=>animaAtaque(h,POCO));
  reg(J.vez?"c":"a",`${h.n} golpeia o ${d.n} com ${hb.n} (−${golpe}) `
     +`(${Math.max(0,ep.vida)}/${ep.vidaMax})`);
  fx(POCO,"-"+golpe,"dano");

  if(ep.vida<=0) levaEpico(ep,h.t);
  else{
    /* o revide nunca mata, pelo mesmo motivo da torre: `mata()` precisa de autor
       para creditar o ouro, e monstro neutro não é autor. */
    const levou=Math.min(d.revide,h.vida-1);
    if(levou>0){ h.vida-=levou; reg("b",`o ${d.n} revida — ${levou} em ${h.n}`);
      fx(h.pos,-levou,"dano"); tremer(h); }
  }
  modo=null; habAtual=null; confirmar=null; ativo=null; habSel=null;
  calcula(); pinta();
}
/* Dragão compõe para sempre, Barão queima em duas rodadas. O Poder entra por
   `extraPoder` — nunca por poderTotal, que é const e mata o script inteiro. */
function levaEpico(ep,t){
  const tm=J.times[t];
  ep.volta=J.rodada+EPICO[ep.id].volta;
  if(ep.id==="dragao"){
    tm.dragoes++;
    tm.herois.forEach(h=>h.extraPoder+=DRAGAO_PODER);
    reg("b",`${NOMES[t]} levou o Dragão — Herança do Dragão ${tm.dragoes}`
           +` (+${DRAGAO_PODER} de Poder no time, para sempre)`);
  }else{
    if(!tm.barao) tm.herois.forEach(h=>h.extraPoder+=BARAO_PODER);
    tm.barao=BARAO_RODADAS; tm.baroes++;
    reg("b",`${NOMES[t]} levou o Barão — Fúria por ${BARAO_RODADAS} rodadas`
           +` (+${BARAO_PODER} de Poder e as ondas avançam sozinhas)`);
  }
  toast(EPICO[ep.id].n.toUpperCase()+" É DO "+NOMES[t],"gank"); vibra([40,60,40,60,80]);
}

/* ══════════════════ ARRASTAR PARA MOVER ══════════════════ */
/* Pegar o herói, arrastar e soltar na casa. O caminho antigo continua inteiro —
   tocar, abrir o comando, tocar MOVER, tocar a casa: o arrasto só nasce depois que
   o dedo anda LIMIAR px, e antes disso tudo é toque normal.

   Os eventos ficam no <svg>, não na peça. `pinta()` reconstrói o mapa inteiro toda
   vez, e um handler preso à peça morreria junto com ela no meio do arrasto —
   inclusive o `setPointerCapture`, que é o que garante receber o `pointerup` mesmo
   se o dedo sair de cima do elemento. */
const LIMIAR_ARRASTO=7;
let arr=null, cliqueBloqueado=false;

function paraSVG(ev){
  const ctm=svg.getScreenCTM(); if(!ctm) return null;
  const p=svg.createSVGPoint(); p.x=ev.clientX; p.y=ev.clientY;
  const q=p.matrixTransform(ctm.inverse());
  return [q.x,q.y];
}
/* casa sob o dedo: a mais próxima em coordenada de mapa, com folga de um raio.
   Folga generosa é de propósito — dedo não é cursor. */
function hexSob(ev){
  const p=paraSVG(ev); if(!p) return null;
  let melhor=null,d0=Infinity;
  for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
    if(!noTab(c,r))continue;             // o dedo não pode mirar casa que não existe
    const[x,y]=centro(c,r), d=(x-p[0])**2+(y-p[1])**2;
    if(d<d0){ d0=d; melhor=[c,r]; }
  }
  return d0<=(R*1.1)**2 ? melhor : null;
}
const podeArrastar=h=>h&&!h.morto&&h.t===J.vez&&J.fase==="jogando"
  &&!h.preso&&J.mov.rest>0&&!sheetAberto;

function heroiDaPeca(no){
  const d=no&&no.getAttribute("data-peca"); if(!d) return null;
  const i=d.indexOf("-");
  return J.times[+d.slice(0,i)].herois.find(x=>x.id===d.slice(i+1));
}
function marcaArrasto(ev,destino){
  svg.querySelectorAll(".hx.sob").forEach(e=>e.classList.remove("sob"));
  if(destino){
    const e=svg.querySelector(`[data-hex="${k(...destino)}"]`);
    if(e) e.classList.add("sob");
  }
  const g=svg.querySelector(`[data-peca="${arr.h.t}-${arr.h.id}"]`);
  const p=paraSVG(ev); if(!g||!p) return;
  const[x,y]=centro(...arr.h.pos);
  g.setAttribute("transform",`translate(${(p[0]-x).toFixed(1)} ${(p[1]-y).toFixed(1)})`);
  g.classList.add("arrastada");
}
svg.addEventListener("pointerdown",ev=>{
  const alvo=ev.target.closest?ev.target.closest(".peca"):null;
  const h=heroiDaPeca(alvo);
  if(!podeArrastar(h))return;
  arr={h,x0:ev.clientX,y0:ev.clientY,pid:ev.pointerId,ativo:false,destino:null};
});
svg.addEventListener("pointermove",ev=>{
  if(!arr||ev.pointerId!==arr.pid)return;
  if(!arr.ativo){
    if(Math.hypot(ev.clientX-arr.x0,ev.clientY-arr.y0)<LIMIAR_ARRASTO)return;
    arr.ativo=true;
    try{ svg.setPointerCapture(arr.pid); }catch(e){}
    /* NÃO chamar pinta() aqui. Selecionar o herói faz o painel de comando crescer,
       o palco encolher e o mapa inteiro se redimensionar — no meio do gesto, com o
       dedo encostado. Medido: a casa sob o dedo mudava de [0,5] para [0,7] só por
       causa disso. O alcance é calculado sem tocar na tela e as casas são realçadas
       na marra, direto nos polígonos que já estão no DOM. */
    const selAntes=selHeroi, modoAntes=modo;
    selHeroi=arr.h; modo="mover"; calcula();
    arr.alcance=mover.slice();
    selHeroi=selAntes; modo=modoAntes; calcula();
    const s=new Set(arr.alcance.map(p=>k(...p)));
    svg.querySelectorAll(".hx").forEach(e=>
      e.classList.toggle("mover",s.has(e.getAttribute("data-hex"))));
    svg.classList.add("arrastando"); vibra(8);
  }
  ev.preventDefault();
  const alvo=hexSob(ev);
  arr.destino = alvo&&arr.alcance.some(([c,r])=>c===alvo[0]&&r===alvo[1]) ? alvo : null;
  marcaArrasto(ev,arr.destino);
});
function soltaArrasto(ev){
  if(!arr||ev.pointerId!==arr.pid)return;
  const a=arr; arr=null;
  try{ svg.releasePointerCapture(a.pid); }catch(e){}
  svg.classList.remove("arrastando");
  svg.querySelectorAll(".hx.sob").forEach(e=>e.classList.remove("sob"));
  if(!a.ativo)return;                       /* foi toque simples: deixa o clique seguir */
  /* o navegador ainda dispara um `click` depois do arrasto; sem esta trava ele
     abriria o comando do herói ou moveria de novo por cima do que acabou de sair */
  cliqueBloqueado=true; setTimeout(()=>{cliqueBloqueado=false;},350);
  /* só agora o herói é selecionado de fato: é o `pinta()` do fim que abre o painel,
     e aí a mudança de layout já não atrapalha gesto nenhum */
  if(a.destino){ limpaModo(); selHeroi=a.h; moveAte(...a.destino); }
  else pinta();
}
svg.addEventListener("pointerup",soltaArrasto);
svg.addEventListener("pointercancel",soltaArrasto);

const _moveAte=moveAte;
moveAte=function(c,r){
  if(!selHeroi)return;
  if(modo==="lampejo") return lampejaAte(c,r);
  const de=[...selHeroi.pos];
  _moveAte(c,r);
  modo=null; calcula(); pinta();
  animaMovimento(selHeroi,de);
};

/* ══════════════════ MAPA ══════════════════ */
/* O dedo não mira no desenho, mira no hexágono. A peça do herói é desenhada com raio
   9,6 e a torre é um quadrado de 12 — no aparelho isso vira alvo de 25px e de 22px,
   contra os 44px de referência (e de 12px num celular de 667 de altura, medido).
   Este círculo invisível leva o alvo até a borda do hexágono sem mudar nada do desenho.
   15,5 é o teto: os centros vizinhos ficam a sqrt(3)*R ≈ 32,9 um do outro, então
   raio 16,45 já encostaria no vizinho e roubaria o toque dele. */
const R_TOQUE=15.5;
const alvoDeToque=(g,x,y,aoTocar)=>{
  const c=el("circle",{cx:x,cy:y,r:R_TOQUE,class:"toque"});
  if(aoTocar) c.onclick=aoTocar;
  g.appendChild(c);
  return c;
};
function desenhaMapa(){
  svg.textContent="";
  const gH=el("g"),gE=el("g"),gM=el("g"),gP=el("g");
  const moverS=new Set(mover.map(p=>k(...p)));

  for(let r=0;r<LINS;r++)for(let c=0;c<COLS;c++){
    if(!noTab(c,r))continue;            // casa sem par no espelho não existe no tabuleiro
    let cls="hx ";
    if(BASE_S.has(k(c,r)))cls+="base"+BASE_S.get(k(c,r));
    else if(k(c,r)===POCO_K)cls+="poco";
    else if(LANE.has(k(c,r)))cls+="rota";
    else if(RIO_S.has(k(c,r)))cls+="rio";
    else cls+="selva";
    if(moverS.has(k(c,r)))cls+=" mover";
    const p=[];for(let i=0;i<6;i++){const a=Math.PI/180*(60*i-90);const[x,y]=centro(c,r);
      p.push((x+R*Math.cos(a)).toFixed(1)+","+(y+R*Math.sin(a)).toFixed(1));}
    const hx=el("polygon",{points:p.join(" "),class:cls,"data-hex":k(c,r)});
    if(moverS.has(k(c,r))) hx.onclick=()=>{ if(cliqueBloqueado)return; vibra(9); moveAte(c,r); };
    gH.appendChild(hx);
  }
  [[BASE[0][0],L_TOPO,BASE[1][0]],[BASE[0][1],L_MEIO,BASE[1][1]],[BASE[0][1],L_BOT,BASE[1][1]]]
    .forEach(([a,l,b])=>gE.appendChild(el("polyline",
      {points:[a,...l,b].map(p=>centro(...p).map(n=>n.toFixed(1)).join(",")).join(" "),class:"estrada"})));

  /* acampamentos: 2 de cada lado + 1 neutro disputável. Farmar é feito ao
     pisar na casa; isso transforma o caminho do Caçador em uma escolha de macro. */
  J.camps.forEach(cp=>{
    const [x,y]=centro(...cp.pos);
    if(cp.ativo){
      const g=el("g",{class:"camp"+(cp.t===-1?" neutro":"")});
      g.appendChild(el("circle",{cx:x,cy:y,r:7.2,class:"camp-bg"}));
      g.appendChild(el("circle",{cx:x,cy:y,r:4.4,class:"camp-core"}));
      const tx=el("text",{x:x,y:y+11,class:"camp-txt"}); tx.textContent=cp.t===-1?"NEUTRO":(cp.t===0?"AZUL":"CARMIM"); g.appendChild(tx);
      gM.appendChild(g);
    } else if(cp.respawn>0){
      const tx=el("text",{x:x,y:y+3,class:"camp-cd"}); tx.textContent="R"+cp.respawn; gM.appendChild(tx);
    }
  });

  const torreS=new Set(alvosTorre);
  J.torres.forEach(t=>{
    const[x,y]=centro(...ROTAS[t.rota][t.i]);
    const mirando=torreS.has(t);
    if(mirando) gM.appendChild(el("circle",{cx:x,cy:y,r:12.6,class:"mira-torre"}));
    const rc=el("rect",{x:x-6,y:y-6,width:12,height:12,transform:`rotate(45 ${x} ${y})`,
      class:"torre t"+t.t+(t.vida<=0?" caiu":"")+(mirando?" alvo":"")});
    if(mirando) rc.onclick=()=>{vibra(10);atacaTorre(t);};
    gM.appendChild(rc);
    if(mirando) alvoDeToque(gM,x,y,()=>{vibra(10);atacaTorre(t);});
    if(t.vida>0){const v=el("text",{x:x,y:y+2.2,class:"tvida"});v.textContent=t.vida;gM.appendChild(v);}
  });
  Object.entries(ROTAS).forEach(([nome,l])=>{
    const[x,y]=centro(...l[Math.max(0,Math.min(l.length-1,J.frentes[nome]))]);
    gM.appendChild(el("circle",{cx:x,cy:y,r:14,class:"frente"}));
  });

  /* o poço: retrato do morador e a vida por baixo. Vazio, ele mostra a rodada em
     que o próximo desce — o relógio da partida só vale se estiver visível. */
  (()=>{
    const ep=J.poco, [x,y]=centro(...POCO);
    if(ep.vida<=0){
      const g=el("g",{class:"poco-vazio"});
      g.appendChild(el("circle",{cx:x,cy:y,r:9}));
      const t=el("text",{x:x,y:y+3});t.textContent="R"+ep.volta;g.appendChild(t);
      return gM.appendChild(g);
    }
    const mirando=alvosEpico.includes(ep);
    const g=el("g",{class:"epico"+(mirando?" alvo":""),role:"img"});
    g.setAttribute("aria-label",`${EPICO[ep.id].n}, ${ep.vida} de vida`);
    if(mirando) g.appendChild(el("circle",{cx:x,cy:y,r:13.4,class:"mira-torre"}));
    g.appendChild(el("circle",{cx:x,cy:y,r:10.4,class:"fundo"}));
    const cid="cl-poco";
    const cp=el("clipPath",{id:cid});
    cp.appendChild(el("circle",{cx:x,cy:y,r:9}));
    const ip=el("image",{x:x-9,y:y-9,width:18,height:18,
      "clip-path":`url(#${cid})`,preserveAspectRatio:"xMidYMid slice"});
    ip.setAttribute("href",RETRATO_EPICO(ep.id));
    g.append(cp,ip);
    g.appendChild(el("circle",{cx:x,cy:y,r:10.4,class:"anel"}));
    const v=el("text",{x:x,y:y+15.6,class:"epvida"});v.textContent=ep.vida;g.appendChild(v);
    if(mirando){ g.onclick=()=>{vibra(10);atacaEpico(ep);}; alvoDeToque(g,x,y); }
    gM.appendChild(g);
  })();
  [0,1].forEach(t=>{
    const[x,y]=centro(...BASE[t][0]);
    const mirando=alvoNexus===t;
    if(mirando) gM.appendChild(el("circle",{cx:x,cy:y,r:14,class:"mira-torre"}));
    const nx=el("circle",{cx:x,cy:y,r:10.5,class:"nexus t"+t+(mirando?" alvo":"")});
    if(mirando) nx.onclick=()=>{vibra(12);atacaNexus(t);};
    gM.appendChild(nx);
    if(mirando) alvoDeToque(gM,x,y,()=>{vibra(12);atacaNexus(t);});
    const v=el("text",{x:x,y:y+2.4,class:"tvida"});v.textContent=Math.max(0,J.nexus[t]);gM.appendChild(v);
  });
  const rot=(txt,x,y)=>{const g=el("g",{class:"rotulo"}),w=txt.length*5.4+13;
    g.appendChild(el("rect",{x:x-w/2,y:y-6.5,width:w,height:13,rx:2}));
    const t=el("text",{x:x,y:y+2.2});t.textContent=txt;g.appendChild(t);gM.appendChild(g);};
  rot("TOPO",centro(...L_TOPO[6])[0],11);
  rot("BAIXO",centro(...L_BOT[2])[0],275);
  rot("MEIO",...centro(3,2));

  const alvoS=new Set(alvos.map(o=>o.id+o.t));
  todos().filter(h=>!h.morto).forEach(h=>{
    const[x,y]=centro(...h.pos);
    const ehAlvo=alvoS.has(h.id+h.t), ehSel=selHeroi===h;
    const foco=tutFoco==="peca:"+h.id;
    const g=el("g",{class:"peca t"+h.t+(ehSel?" sel":"")+(ehAlvo?" alvo":"")+(foco?" foco":""),
      tabindex:"0",role:"button","data-peca":h.t+"-"+h.id});
    g.setAttribute("aria-label",`${h.n}, ${h.vida} de vida${h.esc?`, ${h.esc} de escudo`:""}`);
    alvoDeToque(g,x,y);                       // primeiro filho: o alvo vale o hexágono
    if(ehAlvo) g.appendChild(el("circle",{cx:x,cy:y,r:12.6,class:"mira"}));
    g.appendChild(el("circle",{cx:x,cy:y,r:9.6,class:"fundo"}));
    const cid="cl-"+h.t+h.id;
    const cp=el("clipPath",{id:cid});
    cp.appendChild(el("circle",{cx:x,cy:y,r:8.2}));
    const ip=el("image",{x:x-8.2,y:y-8.2,width:16.4,height:16.4,
      "clip-path":`url(#${cid})`,preserveAspectRatio:"xMidYMin slice"});
    ip.setAttribute("href",RETRATO(h.id));
    g.append(cp,ip);
    g.appendChild(el("circle",{cx:x,cy:y,r:9.6,class:"anel"}));

    const pc=Math.max(0,h.vida)/h.vidaMax, LB=17;
    const bg=el("g",{class:"barravida"});
    bg.appendChild(el("rect",{x:x-LB/2,y:y+10.4,width:LB,height:2.6,rx:1.3,fill:"#000","fill-opacity":".55"}));
    bg.appendChild(el("rect",{x:x-LB/2,y:y+10.4,width:(LB*pc).toFixed(2),height:2.6,rx:1.3,
      fill:pc>.5?"var(--vivo)":pc>.25?"var(--brass)":"var(--dano)"}));
    if(h.esc>0) bg.appendChild(el("rect",{x:x-LB/2,y:y+10.4,
      width:(LB*Math.min(1,h.esc/h.vidaMax)).toFixed(2),height:2.6,rx:1.3,
      fill:"var(--brass)","fill-opacity":".85"}));
    g.appendChild(bg);

    if(h.itens.length){
      g.append(el("circle",{cx:x+7.4,cy:y-7.4,r:3.6,class:"selo"}));
      const bt=el("text",{x:x+7.4,y:y-5.8,class:"selotxt"}); bt.textContent=h.itens.length; g.append(bt);
    }
    g.onclick=()=>escolheHeroi(h);
    g.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();escolheHeroi(h);}};
    gP.appendChild(g);
  });
  svg.append(gH,gE,gM,gP);
  const b=svg.getBBox();
  svg.setAttribute("viewBox",
    `${(b.x-5).toFixed(1)} ${(b.y-5).toFixed(1)} ${(b.width+10).toFixed(1)} ${(b.height+10).toFixed(1)}`);
}

/* ══════════════════ CARTA ══════════════════ */
function abreCarta(h){
  const P=POS[CATALOGO[h.id].pos];
  abreSheet(h.n,`
    <div class="carta-g" style="--pos:${P.cor}">
      <div class="arte"><img src="${RETRATO(h.id)}" alt=""><div class="grad"></div>
        <div class="id"><div class="nm">${h.n}</div><div class="ep">${P.n} · ${NOMES[h.t]}</div></div></div>
      <div class="faixa">
        <div><div class="k">Vida</div><div class="v">${Math.max(0,h.vida)}/${h.vidaMax}${h.esc?` +⛨${h.esc}`:""}</div></div>
        <div><div class="k">Poder</div><div class="v">${poderTotal(h)}</div></div>
        <div><div class="k">Armad.</div><div class="v">${armTotal(h)}</div></div>
        <div><div class="k">Alcance</div><div class="v">${alcTotal(h)}</div></div>
      </div>
      <div class="lista">
        ${h.habs.map(hb=>`<div class="hb2">${svgIco(iconeDe(hb))}
          <div><span class="n">${hb.n}</span><span class="d">${descreve(h,hb)}</span></div>
          <span class="f">Força ${hb.f}${hb.f===6?"":"+"}</span></div>`).join("")}
      </div>
      ${h.itens.length?`<div class="itens-g">${h.itens.map(i=>
        `<figure><img src="${RETRATO_ITEM(i)}" alt=""><figcaption>${ITEM[i].n}</figcaption></figure>`).join("")}</div>`:""}
      <div class="rodape">${ehAgil(h)?"ágil · 1ª casa grátis · ":""}${CATALOGO[h.id].patamar?"escala por ouro · ":""}ouro ${h.ouro}</div>
    </div>`);
}

/* ══════════════════ FICHAS / LOJA / LOG ══════════════════ */
function fichaHTML(h,meu){
  const pc=Math.max(0,h.vida)/h.vidaMax*100, esc=Math.min(100-pc,h.esc/h.vidaMax*100);
  const P=POS[CATALOGO[h.id].pos];
  const selos=[
    h.morto?`<span class="selo-est mal">volta em ${h.morto}</span>`:"",
    h.preso?'<span class="selo-est mal">preso</span>':"",
    h.intoc?'<span class="selo-est">intocável</span>':"",
    h.recarga?'<span class="selo-est">carregado</span>':"",
    h.marca?'<span class="selo-est mal">marcado</span>':"",
    h.pat?`<span class="selo-est">patamar ${h.pat}</span>`:""
  ].join("");
  return `<div class="fic${h.morto?" morto":""}${selHeroi===h?" sel":""}"
       style="--pos:${P.cor}" data-sel="${h.t}-${h.id}">
    <img class="rosto" src="${RETRATO(h.id)}" alt="">
    <div class="col">
      <div class="l1"><span class="nm">${h.n}</span><span class="ps">${P.n}</span>
        ${meu&&!h.agiu&&!h.morto&&J.fase==="jogando"?'<span class="farm">FARM +3</span>':""}</div>
      <div class="vb"><i style="width:${pc}%"></i><i class="esc" style="width:${esc}%"></i></div>
      <div class="l3"><span>♥ <b>${Math.max(0,h.vida)}</b>/${h.vidaMax}</span>
        <span>⚔ <b>${poderTotal(h)}</b></span><span>⛨ <b>${armTotal(h)}</b>${h.esc?` + <b>${h.esc}</b> escudo`:""}</span>
        <span>◈ <b>${h.ouro}</b></span></div>
      ${h.itens.length?`<div class="itens">${h.itens.map(i=>
        `<img src="${RETRATO_ITEM(i)}" title="${ITEM[i].n}" alt="">`).join("")}</div>`:""}
      ${selos?`<div class="itens">${selos}</div>`:""}
    </div></div>`;
}
function abreTime(){
  const meu=J.vez, out=1-meu, tm=J.times[meu];
  const btPrio = tm.prio&&J.fase==="jogando"
    ? `<button class="grande" id="btPrioReal" style="margin-bottom:12px;font-size:15px;padding:13px">
         ⚡ Usar prioridade — rolar +1 dado (${tm.prio})</button>` : "";
  abreSheet("Time", btPrio+
    `<div class="fichas">${J.times[meu].herois.map(h=>fichaHTML(h,true)).join("")}</div>
     <div style="font-family:var(--carto);font-size:9px;letter-spacing:.2em;text-transform:uppercase;
       color:var(--ink-3);margin:16px 0 8px">Adversário · ${NOMES[out]}</div>
     <div class="fichas">${J.times[out].herois.map(h=>fichaHTML(h,false)).join("")}</div>`);
  G("shCorpo").querySelectorAll("[data-sel]").forEach(e=>e.onclick=()=>{
    const[t,id]=e.dataset.sel.split("-");
    const h=J.times[+t].herois.find(x=>x.id===id);
    if(+t===J.vez&&!h.morto){ limpaModo(); selHeroi=h; fechaSheet(); pinta(); }
    else abreCarta(h);
  });
  const bp=G("btPrioReal"); if(bp) bp.onclick=()=>{ usaPrioridade(); fechaSheet(); };
}
function abreLog(){
  abreSheet("Histórico",
    `<div class="linhas">${J.log.slice(0,70).map(l=>`<div class="${l.cls}">${l.txt}</div>`).join("")}</div>`);
}
function abreLoja(){
  const t=J.vez, tm=J.times[t];
  /* morto está na base esperando respawn — é a janela de compra clássica de MOBA.
     A regra sempre disse "na base ou morto"; o filtro é que excluía o morto. */
  const naLoja=tm.herois.filter(h=>h.morto||naBase(h));
  if(!naLoja.length){
    abreSheet("Loja fechada",
      `<p style="color:var(--ink-2);font-size:14px;line-height:1.55;margin:0">
        Só compra quem está <b style="color:var(--ink)">na própria base</b> ou morto.
        Gaste movimento para voltar — é o custo real de fazer compras no meio da partida.</p>`);
    return;
  }
  let quem=lojaHeroi&&naLoja.includes(lojaHeroi)?lojaHeroi:naLoja[0];
  lojaHeroi=quem;
  const abas=naLoja.map(h=>`<button class="abaH${h===quem?" on":""}" data-h="${h.id}">
      <img src="${RETRATO(h.id)}" alt=""><span>${h.n}</span><i>${h.ouro}◈</i></button>`).join("");
  const cards=ITENS.map(it=>{
    const preco=Math.max(0,it.o-descontos[t]);
    const tem=quem.itens.includes(it.id), cheio=quem.itens.length>=(quem.slots||3), pode=quem.ouro>=preco&&!tem&&!cheio;
    return `<button class="itC${pode?"":" off"}${tem?" tem":""}" data-i="${it.id}" ${pode?"":"disabled"}>
      <img src="${RETRATO_ITEM(it.id)}" alt=""><span class="iN">${it.n}</span>
      <span class="iD">${it.d}</span>
      <span class="iO">${tem?"comprado":cheio?(quem.slots||3)+" slots cheios":preco+" ◈"+(descontos[t]?" (-"+descontos[t]+")":"")}</span></button>`;
  }).join("");
  abreSheet("Loja",`<div class="abas">${abas}</div><div class="prat">${cards}</div>`);
  G("shCorpo").querySelectorAll(".abaH").forEach(b=>b.onclick=()=>{
    lojaHeroi=tm.herois.find(h=>h.id===b.dataset.h); abreLoja(); });
  G("shCorpo").querySelectorAll(".itC").forEach(b=>b.onclick=()=>{
    const it=ITEM[b.dataset.i];
    const preco=Math.max(0,it.o-descontos[t]);
    if(quem.ouro<preco||quem.itens.includes(it.id)||quem.itens.length>=(quem.slots||3))return;
    quem.ouro-=preco; quem.itens.push(it.id);
    if(descontos[t]){ descontos[t]=0; }
    if(it.ef.vida){ quem.vidaMax+=it.ef.vida; quem.vida+=it.ef.vida; }
    reg(t?"c":"a",`${quem.n} compra ${it.n} (−${preco} de ouro)`);
    toast(it.n,""); vibra(12); abreLoja(); pinta(); });
}

/* ══════════════════ MANUAL ══════════════════ */
function abreManual(){
  abreSheet("Manual",`<div class="man">
    <section class="destaque"><h4>O que você é</h4>
      <p>Você não controla um herói: você é o <b>técnico</b> de cinco. Vence quem derrubar o Nexus adversário — e o caminho até lá é <b>empurrar uma rota</b>, derrubando as torres.</p></section>
    <section><h4>1 · O Dado Mestre move o time todo</h4>
      <p>Um dado por rodada. O valor é o total de casas que os seus <b>cinco</b> heróis andam <b>juntos</b>.</p>
      <p>Tirou 4? São 4 casas no total: quatro com um herói, ou uma com quatro heróis. Aproximar o assassino custa o recuo do atirador.</p></section>
    <section><h4>2 · Três dados de ação, cinco heróis</h4>
      <p>Cada dado alocado num herói vira a <b>Força</b> da habilidade. Toda habilidade tem uma Força mínima.</p>
      <table><tr><td>Habilidades básicas</td><td>Força 1+</td></tr>
      <tr><td>Habilidades de controle</td><td>Força 3+</td></tr>
      <tr><td>Ultimates</td><td>Força 5+ ou 6</td></tr></table>
      <p style="margin-top:7px">Precisa de mais movimento? <b>Vire um dado de ação em movimento</b> pelo botão <b>→ mover</b>.</p></section>
    <section class="destaque"><h4>Feitiços de invocador</h4>
      <p>O time tem <b>uma carga</b>, não um feitiço por herói. Ela não gasta dado nem movimento, serve a <b>qualquer</b> um dos cinco, e volta <b>3 rodadas</b> depois de usada.</p>
      <table><tr><td><b>Lampejo</b></td><td>salta até 2 casas e escapa de <i>preso</i></td></tr>
      <tr><td><b>Retorno</b></td><td>volta à base e recupera 3</td></tr></table>
      <p style="margin-top:7px">Como a carga é uma só, a pergunta nunca é <i>posso?</i> — é <b>quem merece</b>. E vale contar a do adversário: feitiço gasto é informação.</p>
      <p>O Retorno é <b>interrompido por inimigo colado</b>. Quem foi pego não escapa de graça.</p></section>
    <section class="destaque"><h4>3 · Quem não age, enriquece</h4>
      <p>Herói que recebe dado ganha <b>1 de ouro</b>. Quem fica de fora <b>farma 3</b>. Como só três dos cinco recebem ação, dois sempre estão enriquecendo. <b>Agir custa dinheiro.</b></p></section>
    <section class="destaque"><h4>Escudo temporário</h4><p>Escudo absorve dano antes da vida e expira no fim da rodada. A ficha mostra separadamente quanto foi absorvido e quanto atravessou.</p></section><section><h4>Combate</h4>
      <p>Sem rolagem extra — o dado já foi rolado.</p>
      <table><tr><td>Dano</td><td>Força + Poder − Armadura</td></tr>
      <tr><td>Dado 6 natural</td><td>Crítico</td></tr>
      <tr><td>Morte</td><td>volta em 2 rodadas</td></tr>
      <tr><td>Quem matou</td><td>+4 de ouro</td></tr></table></section>
    <section><h4>As cinco posições</h4>
      <p><b>Topo</b> — sozinho lá em cima. Dominar a rota dá <b>Placas</b>: 1 ajusta um dado em ±1, 2 re-rolam. É a sua única fonte de controle sobre a sorte.</p>
      <p><b>Farm</b> — o Caçador. A intenção dele é <b>escondida</b> no início da rodada. Ele se move normalmente com o <b>Dado Mestre</b>. Se alcançar a rota declarada, arma o <b>gank</b>: +2 de Força.</p>
      <p><b>Meio</b> — a rota mais curta. Dominar dá <b>Prioridade</b>: gaste para rolar <b>um dado de ação a mais</b>, quando quiser.</p>
      <p><b>Atirador</b> — frágil e caro, mas escala: a cada 10 de ouro ganha +2 de Poder. Perto do Suporte, ganha escudo e dano.</p>
      <p><b>Suporte</b> — escuda, doa o próprio dado, e a <b>Ward</b> revela o Caçador inimigo antes da hora.</p></section>
    <section class="destaque"><h4>Regra de mesa · presença na rota</h4>
      <p>Um herói só conta para empurrar uma rota depois de <b>passar da própria Torre Exterior</b>. Antes dela, está em desenvolvimento e não gera Top/Meio/Bot. Mais heróis ativos que o rival: a onda anda 1. Empate: não anda.</p></section>
    <section><h4>Torres, ondas e Nexus</h4>
      <p>Cada rota tem uma <b>Frente de Onda</b> (o círculo tracejado). Ela desliza para o lado de quem tem mais heróis vivos naquela rota, e bate na torre onde encosta.</p>
      <p>Torre tem <b>3 de vida</b>. A onda tira 1 por rodada, e o golpe de herói tira <b>1</b> — qualquer habilidade ofensiva, inclusive a Ultimate. Torre não é poço: quem quer derrubar mais rápido junta heróis, não gasta a Ultimate.</p>
      <p><b>Você também derruba torre.</b> Se a sua onda já está encostada nela, ela vira alvo de habilidade: mira vermelha, um toque, <b>1 de dano</b>. A torre <b>revida 2</b> e pode receber vários golpes na rodada, desde que você tenha dados e heróis aptos para atacar.</p>
      <p>Torres caídas abrem a rota. Rota aberta, a onda bate no <b>Nexus</b>. Zerou, acabou.</p></section>
    <section><h4>O Poço — Dragão e Barão</h4>
      <p>Há <b>um poço</b> no meio do mapa, em terreno de ninguém, e ele <b>muda de morador</b>. Vazio, mostra a rodada em que o próximo desce — esse é o relógio da partida.</p>
      <p>Até a rodada 8 quem desce é o <b>Dragão</b>: <b>8 de vida</b>, revida 1. Levar dá a <b>Herança do Dragão</b> — <b>+1 de Poder em todo o time, para sempre</b>, e <b>acumula</b> a cada Dragão. Ele volta 3 rodadas depois de cair.</p>
      <p>Da rodada 8 em diante quem desce é o <b>Barão</b>: <b>14 de vida</b>, revida 2. Levar dá a <b>Fúria</b> por <b>2 rodadas</b> — +2 de Poder no time e <b>as três ondas avançam sozinhas</b>, com herói na rota ou sem. É o botão de ponto-sem-volta.</p>
      <p>Bater no poço é como bater na torre — habilidade ofensiva básica causa 1 e Ultimate ofensiva causa 2 — só que <b>sem limite por rodada</b> e <b>sem dono</b>. Quem dá o <b>último golpe</b> leva o prêmio inteiro. É por isso que ninguém deixa o poço sozinho.</p></section>
    <section><h4>Plano de Caça</h4>
<p>No início da rodada, cada Caçador escolhe secretamente <b>TOP, MEIO, BAIXO ou FARM</b>. A ficha não move ninguém: todo deslocamento usa o Dado Mestre. Se chegar à rota declarada, a primeira habilidade ofensiva recebe <b>+2 Força</b>. FARM dá <b>+1 ouro</b> somente se o Caçador coletar um acampamento. Se não cumprir, perde o bônus. <b>Ward revela o Plano de Caça inimigo.</b></p></section>
    <section><h4>No aparelho</h4>
      <p><b>Arraste o herói para andar.</b> Encoste nele e puxe: as casas ao alcance acendem e a casa sob o dedo fica marcada. Soltou, andou. É o caminho mais rápido.</p>
      <p>Prefere tocar? Toque num herói seu → abre o <b>comando</b> dele, e de lá você escolhe <b>mover</b> ou uma <b>habilidade</b>. Os dois caminhos valem.</p>
      <p><b>Segure uma habilidade por meio segundo</b> e ela se explica: Força mínima, alvo, alcance, a regra por extenso e <b>o que sai com cada um dos dados que estão na mesa agora</b>. Funciona até nas habilidades apagadas — é quando mais se quer saber.</p>
      <p>O dado é escolhido sozinho: o menor que dá conta. Quer gastar um específico? Toque nele antes.</p>
      <p>O <b>✕</b> cancela sempre. Toque num herói inimigo para ver a carta dele.</p></section>
  </div>`);
}

/* ══════════════════ TUTORIAL ══════════════════ */
let tut=null, tutI=0, tutFoco=null;
const PASSOS=[
  {t:"Você comanda os cinco heróis azuis. Cada um joga um jogo diferente.<br><br>Toque em <b>VHARN</b>, o círculo azul lá no canto de baixo à esquerda.",
   foco:"peca:vharn", ok:()=>selHeroi&&selHeroi.id==="vharn"},
  {t:"Este é o <b>comando</b> dele. Aqui você decide o que esse herói faz na rodada.<br><br>Toque em <b>MOVER</b>.",
   foco:"bt:cmdMover", ok:()=>modo==="mover"},
  {t:"As casas douradas são onde ele alcança.<br><br>O <b>Dado Mestre</b> é o movimento do <b>time inteiro</b> — cada casa andada sai do mesmo bolso. Toque numa casa.",
   ok:()=>J.mov.rest<J.mov.v},
  {t:"Andou. Repare que o Dado Mestre diminuiu — é o orçamento comum dos cinco.<br><br>Agora a ação: toque em <b>GOLPE DE ESCUDO</b>.",
   foco:"bt:hab0", ok:()=>modo==="mirar"||J.dados.some(d=>d.usado)},
  {t:"O jogo já escolheu o <b>menor dado</b> que dá conta — os grandes ficam guardados para as ultimates.<br><br>Se houver alvo no alcance, ele fica com a mira vermelha. Toque nele. Se não houver, toque no <b>✕</b> e siga.",
   ok:()=>J.dados.some(d=>d.usado)},
  {t:"Você tem <b>3 dados de ação</b> e <b>5 heróis</b>. Nunca dá para todos.<br><br>E aqui está o truque: quem <b>não</b> recebe dado <b>farma 3 de ouro</b>, contra 1 de quem age. <b>Agir custa dinheiro.</b>",
   ok:null},
  {t:"Duas rotas mexem nos seus dados:<br><br><b>Topo</b> dá <b>Placas</b> — ajusta um dado em ±1 ou re-rola.<br><b>Meio</b> dá <b>Prioridade</b> — um dado de ação a mais.<br><br>Ganhar essas rotas é o que faz sua ultimate sair na hora certa.",
   ok:null},
  {t:"Por último: o <b>Caçador</b> da selva. No começo de cada rodada vocês dois escolhem em segredo para onde ele vai, e a carta só vira <b>no fim do turno do adversário</b>.<br><br>É o blefe do gank. Use.",
   ok:null},
  {t:"É isso. Encerre o turno e jogue.<br><br>O <b>?</b> lá em cima abre o manual completo a qualquer momento.",
   ok:null, fim:true}
];
function iniciaTutorial(){
  tut=true; tutI=0; mostraTut();
}
function mostraTut(){
  const box=G("tut"); if(!tut){ box.classList.remove("on"); tutFoco=null; return; }
  const p=PASSOS[tutI];
  tutFoco=p.foco||null;
  box.className="on";
  box.innerHTML=`<div class="pass">Tutorial · ${tutI+1} de ${PASSOS.length}</div>
    <div class="txt">${p.t}</div>
    <div class="bt"><button id="tutSair">Sair</button>
      ${p.ok?"":`<button class="ok" id="tutOk">${p.fim?"Jogar":"Entendi"}</button>`}</div>`;
  G("tutSair").onclick=()=>{ tut=null; mostraTut(); pinta(); };
  const b=G("tutOk"); if(b) b.onclick=()=>avancaTut();
  aplicaFoco();
}
function avancaTut(){
  tutI++;
  if(tutI>=PASSOS.length){ tut=null; }
  mostraTut(); pinta();
}
function checaTut(){
  if(!tut)return;
  const p=PASSOS[tutI];
  if(p.ok&&p.ok()) setTimeout(()=>avancaTut(),380);
}
function aplicaFoco(){
  document.querySelectorAll(".foco").forEach(e=>e.classList.remove("foco"));
  if(!tutFoco)return;
  if(tutFoco.startsWith("bt:")){ const e=G(tutFoco.slice(3)); if(e)e.classList.add("foco"); }
}

/* ══════════════════ RENDER ══════════════════ */
let assinaturaDados="";
function pinta(){
  const tm=J.times[J.vez];
  G("rod").textContent="R"+J.rodada;
  G("faixa").className="faixa t"+J.vez;
  G("quem").textContent=NOMES[J.vez];

  const ouro=tm.herois.reduce((a,h)=>a+h.ouro,0);
  const cacaTxt = tm.cacaRevelada ? `caçador: ${tm.cacaRevelada}`
      : (J.times[1-J.vez].ward&&tm.caca) ? `ward: ${tm.caca}` : null;
  G("pills").innerHTML=
    `<span>◈ <b>${ouro}</b></span>`+
    `<span class="${tm.placas?"on":""}">⬢ <b>${tm.placas}</b></span>`+
    (tm.prio?`<span class="on">⚡ <b>${tm.prio}</b></span>`:"")+
    (tm.dragoes?`<span class="on">herança <b>${tm.dragoes}</b></span>`:"")+
    (tm.barao?`<span class="on">fúria <b>${tm.barao}</b></span>`:"")+
    (tm.retomada?`<span class="on">retomada${tm.retomada>1?" <b>2</b>":""}</span>`:"")+
    `<span class="${tm.feitico?"on":""}">✦ ${tm.feitico?"feitiço":"<b>"+tm.feiticoCd+"</b>"}</span>`+
    (cacaTxt?`<span class="on">${cacaTxt}</span>`:"");

  const dm=G("ddm");
  dm.innerHTML=J.mov.rest+(J.mov.rest!==J.mov.v?`<small>de ${J.mov.v}</small>`:"");
  dm.className="dado mestre"+(J.mov.rest?"":" zero");

  const assina=J.dados.map(d=>d.v+(d.usado?"u":"")).join(",");
  const cx=G("dadosAcao");
  cx.innerHTML=J.dados.map((d,i)=>
    `<div class="dado${d.usado?" usado":""}${dadoSel===i?" sel":""}${d.v===6?" seis":""}${d.extra?" extra":""}"
      data-i="${i}">${d.v}</div>`).join("");
  if(assina!==assinaturaDados){
    cx.querySelectorAll(".dado").forEach((e,i)=>{
      e.classList.add("rola"); setTimeout(()=>e.classList.remove("rola"),320+i*40); });
    assinaturaDados=assina;
  }
  cx.querySelectorAll(".dado").forEach(e=>e.onclick=()=>{
    const i=+e.dataset.i;
    if(J.dados[i].usado||J.fase!=="jogando")return;
    dadoSel=dadoSel===i?null:i; vibra(8); pinta();
  });

  /* O placar de estruturas saiu do painel fixo e virou gaveta (botão ⌂ no
     cabeçalho). Motivo: com o tabuleiro maior o mapa é quem precisa do espaço
     vertical, e a vida das torres é consulta — olha-se de vez em quando, não o
     tempo todo. O que fica sempre à vista é só o aviso no botão, para ninguém
     perder a rota abrindo sem perceber. */
  (()=>{
    const bt=G("btEstr");
    if(!bt) return;
    bt.disabled = J.fase!=="jogando";
    /* aviso vermelho quando o SEU lado tem rota aberta — é o estado que muda a
       jogada agora. Dourado quando é o inimigo que abriu: oportunidade. */
    bt.classList.toggle("perigo", J.fase==="jogando"&&rotaAberta(J.vez));
    bt.classList.toggle("chance", J.fase==="jogando"&&!rotaAberta(J.vez)&&rotaAberta(1-J.vez));
  })();

  /* Um botão de feitiço lê igual a uma habilidade: nome, uma linha de regra, e o
   número da direita. Só que o número é a recarga, não a Força — por isso a classe
   `trava`, a mesma que a habilidade sem dado usa. Estado é o único idioma da UI. */
function feiticoBt(h,qual){
  const lampejo = qual==="lampejo";
  const cd = J.times[h.t].feitico ? 0 : J.times[h.t].feiticoCd;
  const colado = !lampejo && vizinhos(...h.pos).some(([vc,vr])=>{
    const o=em(vc,vr); return o&&o.t!==h.t; });
  const pode = !cd && J.fase==="jogando" && (lampejo || (!naBase(h)&&!colado));
  const linha = cd ? `feitiço do time gasto — volta em ${cd} ${cd>1?"rodadas":"rodada"}`
    : lampejo ? `salta até ${LAMPEJO_ALC} casas · gasta o feitiço do time`
    : colado ? "inimigo colado — interrompido"
    : naBase(h) ? "já está na própria base"
    : `volta à base e recupera ${RETORNO_CURA} · gasta o feitiço do time`;
  return `<button class="opc${modo==="lampejo"&&lampejo?" on":""}${pode?" pode":" naoPode"}"
      id="cmd${lampejo?"Lampejo":"Retorno"}" ${pode?"":"disabled"}>
    <span class="ico">${svgIco(lampejo?ICO.raio:ICO.casa)}</span>
    <span class="txt"><span class="t1">${lampejo?"Lampejo":"Retorno"}</span>
      <span class="t2">${linha}</span></span>
    <span class="mark${pode?"":" trava"}">${cd?cd:"◇"}</span>
  </button>`;
}

/* painel de comando — a peça central da correção de jogabilidade */
  const cmd=G("comando");
  if(selHeroi&&!selHeroi.morto){
    const h=selHeroi;
    const podeMover=J.mov.rest>0&&!h.preso;
    cmd.innerHTML=`
      <div class="cmd-cab">
        <img src="${RETRATO(h.id)}" alt="">
        <div><div class="nm">${h.n}</div>
          <div class="st"><span>♥ <b>${Math.max(0,h.vida)}</b></span><span>⚔ <b>${poderTotal(h)}</b></span>
            <span>⛨ <b>${armTotal(h)}</b>${h.esc?` +${h.esc}`:""}</span><span>◈ <b>${h.ouro}</b></span></div></div>
        <div class="dir"><button class="cmd-x carta" id="cmdCarta">carta</button>
          <button class="cmd-x" id="cmdX">✕</button></div>
      </div>
      <button class="opc${modo==="mover"?" on":""}${podeMover?" pode":""}" id="cmdMover" ${podeMover?"":"disabled"}>
        <span class="ico">${svgIco(ICO.passos)}</span>
        <span class="txt"><span class="t1">Mover</span>
          <span class="t2">${h.preso?"preso nesta rodada":
            podeMover?`até <b>${J.mov.rest+(ehAgil(h)?1:0)}</b> casas · sai do bolso do time`:"sem movimento restante"}</span></span>
        <span class="mark">${J.mov.rest}</span>
      </button>
      ${feiticoBt(h,"lampejo")}
      ${feiticoBt(h,"retorno")}
      ${h.habs.map((hb,i)=>{
        const di=dadoPara(hb), pode=di!==null&&!h.agiu;
        const emMira=modo==="mirar"&&habAtual===i;
        return `<button class="opc${emMira?" on":""}${pode?" pode":" naoPode"}" id="hab${i}">
          <span class="ico">${svgIco(iconeDe(hb))}</span>
          <span class="txt"><span class="t1">${hb.n}${confirmar===i?" — confirmar":""}</span>
            <span class="t2">${h.agiu?"já agiu nesta rodada":descreve(h,hb,di!==null?J.dados[di].v:null)}</span></span>
          <span class="mark${pode?"":" trava"}">${di!==null?J.dados[di].v:"F"+hb.f}</span>
        </button>`;
      }).join("")}`;
    G("cmdX").onclick=cancela;
    G("cmdCarta").onclick=()=>abreCarta(h);
    G("cmdMover").onclick=iniciaMover;
    G("cmdLampejo").onclick=iniciaLampejo;
    G("cmdRetorno").onclick=usaRetorno;
    h.habs.forEach((_,i)=>{
      const b=G("hab"+i); if(!b)return;
      b.onclick=()=>{ if(cliqueBloqueado)return; iniciaHab(i); };
      toqueLongo(b,()=>fichaHab(h,i));      // segurar explica, mesmo apagada
    });
  }else{
    cmd.innerHTML=`<div class="vaziomsg">${texto()}</div>`;
  }

  const dLivre = dadoSel!==null && !(J.dados[dadoSel]||{}).usado;
  G("btPlaca").disabled = tm.placas<1||!dLivre;
  G("btRerol").disabled = tm.placas<2||!dLivre;
  G("btConv").disabled = !dLivre;
  G("btPrio").disabled = !tm.prio || J.fase!=="jogando";
  G("btPrio").textContent = tm.prio ? `⚡ prioridade (${tm.prio})` : "⚡ prioridade";
  /* linha inteira some quando nenhum dos três serve — devolve altura ao mapa */
  G("extraBts").classList.toggle("ocioso",
    G("btPlaca").disabled && G("btRerol").disabled && G("btConv").disabled && G("btPrio").disabled);
  G("btLoja").classList.toggle("destaque",tm.herois.some(h=>h.morto||naBase(h)));
  G("btLoja").disabled=J.fase!=="jogando";
  G("btTime").innerHTML="Time"+(tm.prio?` <span class="bad">⚡${tm.prio}</span>`:"");
  const nMao=maos[J.vez].length, jogaveis=maos[J.vez].filter(podeJogar).length;
  G("btCartas").innerHTML="Cartas"+(nMao?` <span class="bad">${nMao}</span>`:"");
  G("btCartas").classList.toggle("destaque",jogaveis>0);
  G("btCartas").disabled=J.fase!=="jogando";
  G("btFim").disabled = J.fase!=="jogando";

  /* só desbota se realmente sobrar conteúdo para rolar */
  const cmdEl=G("comando");
  cmdEl.classList.toggle("rolando",cmdEl.scrollHeight>cmdEl.clientHeight+1);
  if(sheetAberto==="Time") abreTime();
  desenhaMapa();
  aplicaFoco();
  checaTut();
  rodaAnims();
}
function texto(){
  if(J.fim!==null)return `<b>${NOMES[J.fim]} venceu.</b>`;
  const livres=J.dados.filter(d=>!d.usado).length;
  if(!livres&&!J.mov.rest) return "Tudo gasto. <b>Encerre o turno.</b>";
  return `<b>${J.mov.rest}</b> de movimento · <b>${livres}</b> ${livres===1?"ação":"ações"}<br>`+
         `toque num herói seu para abrir o comando`;
}

/* ══════════════════ FLUXO ══════════════════ */
function perguntaCaca(t,depois){
  const cac=J.times[t].herois[1];
  abre(`
    <span class="et">Comando oculto · em segredo</span>
    <h2 class="t${t}">${NOMES[t]}</h2>
    <p>Para onde vai <b>${cac.n}</b>, seu Caçador?<br>
    A escolha fica virada para baixo e só é revelada no fim do turno do adversário.</p>
    <div class="zonas">
      <button class="zona" data-z="selva"><span class="zn">Farm</span><span class="zd">colete um acampamento · bônus +1</span></button>
      <button class="zona" data-z="topo"><span class="zn">Topo</span><span class="zd">gank · +2 de Força</span></button>
      <button class="zona" data-z="meio"><span class="zn">Meio</span><span class="zd">gank · +2 de Força</span></button>
      <button class="zona" data-z="baixo"><span class="zn">Baixo</span><span class="zd">gank · +2 de Força</span></button>
    </div>`);
  document.querySelectorAll(".zona").forEach(b=>b.onclick=()=>{
    J.times[t].caca=b.dataset.z; J.times[t].cacaRevelada=null; vibra(12);
    if(t===0) abre(`<span class="et">Passe o aparelho</span><h2 class="t1">${NOMES[1]}</h2>
        <p>A escolha do ${NOMES[0]} está virada para baixo.<br>Sua vez de esconder o Caçador.</p>
        <button class="grande" id="ok">Estou pronto</button>`,()=>depois());
    else depois();
  });
}
const _iniciaTurno=iniciaTurno;
iniciaTurno=function(){
  _iniciaTurno();
  limpaModo(); selHeroi=null;
  const nova=compra(J.vez);
  abre(`<span class="et">Passe o aparelho</span><h2 class="t${J.vez}">${NOMES[J.vez]}</h2>
    <p>É a sua vez. Ninguém mais deve estar olhando.</p>
    ${nova?`<span class="et" style="display:block;margin-bottom:2px">Você comprou</span>
        ${faceCarta(nova)}`:""}
    <button class="grande" id="ok">Começar meu turno</button>`,()=>{ fecha(); pinta(); });
};

/* buffs do deck duram até o fim da rodada */
const _fimDaRodada=fimDaRodada;
fimDaRodada=function(){ limpaBuffs(); _fimDaRodada(); };
/* A tela existia e só dizia quem venceu. Agora mostra o placar dos dois lados e o
   motivo — que hoje é sempre o Nexus, mas `J.motivoFim` já está plumbado para o dia
   em que o limite de rodadas entrar (ver docs/REVISAO-EXTERNA.md, item 3.3). */
function telaFim(){
  const v=J.fim, p=1-v;
  const linha=(rot,a,b)=>`<tr><th>${rot}</th>
    <td class="${a>=b?"mais":""}">${a}</td><td class="${b>=a?"mais":""}">${b}</td></tr>`;
  abre(`<span class="et">Fim de partida · rodada ${J.rodada}</span>
    <h2 class="t${v}">${NOMES[v]} venceu</h2>
    <p>${J.motivoFim||`Nexus ${NOMES[p]} destruído.`}</p>
    <table class="placar">
      <thead><tr><th></th><th class="t${v}">${NOMES[v]}</th><th class="t${p}">${NOMES[p]}</th></tr></thead>
      <tbody>
        ${linha("Nexus",Math.max(0,J.nexus[v]),Math.max(0,J.nexus[p]))}
        ${linha("Torres derrubadas",torresDerrubadas(v),torresDerrubadas(p))}
        ${linha("Ouro acumulado",ouroDoTime(v),ouroDoTime(p))}
      </tbody>
    </table>
    <button class="grande" id="ok">Nova partida</button>`,()=>{fecha();partida(false);});
  vibra([60,80,60,80,120]);
}
/* ══════════════════ FICHA DA HABILIDADE ══════════════════ */
/* Meio segundo de toque abre a regra por extenso e o resultado estimado PARA CADA
   DADO QUE ESTÁ NA MESA nesta rodada — que é a pergunta real do jogador ("com o 4
   que eu tenho, isso mata?"). Vale também para habilidade sem dado disponível: é
   justamente quando mais se quer saber o que ela faria. */
function toqueLongo(elem,aoSegurar){
  let t=null,x0=0,y0=0;
  const cancela=()=>{ if(t){clearTimeout(t);t=null;} };
  elem.addEventListener("pointerdown",e=>{
    x0=e.clientX; y0=e.clientY;
    t=setTimeout(()=>{ t=null; cliqueBloqueado=true;
      setTimeout(()=>{cliqueBloqueado=false;},350);
      vibra(18); aoSegurar(); },460);
  });
  elem.addEventListener("pointermove",e=>{
    if(t&&Math.hypot(e.clientX-x0,e.clientY-y0)>10) cancela();
  });
  ["pointerup","pointercancel","pointerleave"].forEach(ev=>elem.addEventListener(ev,cancela));
}
function fichaHab(h,i){
  const hb=h.habs[i];
  const ALVO={in:"um inimigo",al:"um aliado",eu:"você mesmo"};
  const alc=alcTotal(h)+(hb.ef.alcExtra||0);
  const alcTxt=hb.alvo==="eu"?"—":hb.ef.semAlcance?"o mapa inteiro":`${alc} ${alc===1?"casa":"casas"}`;
  const dados=J.dados.map(d=>{
    const gasto=d.usado, serve=!gasto&&d.v>=hb.f;
    return `<div class="fdl${serve?" ok":""}">
      <span class="fdd">${d.v}</span>
      <span class="fdt">${gasto?"já gasto nesta rodada"
        :serve?descreve(h,hb,d.v):`não chega à Força ${hb.f}`}</span></div>`;
  }).join("");
  abreSheet(hb.n,`
    <div class="fh-top">
      <span class="fh-et">${h.n} · ${POS[CATALOGO[h.id].pos].n}</span>
      <div class="fh-grade">
        <div><div class="k">Força mínima</div><div class="v">${hb.f}</div></div>
        <div><div class="k">Alvo</div><div class="v">${ALVO[hb.alvo]||hb.alvo}</div></div>
        <div><div class="k">Alcance</div><div class="v">${alcTxt}</div></div>
      </div>
    </div>
    <p class="fh-regra">${typeof textoHab==="function"?textoHab(hb):descreve(h,hb,null)}</p>
    <div class="fh-sub">Com os dados desta rodada</div>
    ${dados}
    ${h.agiu?'<p class="fh-nota">Este herói já agiu nesta rodada.</p>':""}`);
}

/* ══════════════════ FIM DE PARTIDA ══════════════════ */
const ouroDoTime=t=>J.times[t].herois.reduce((a,h)=>a+h.ouro,0);
const torresDerrubadas=t=>J.torres.filter(x=>x.t===1-t&&x.vida<=0).length;
function usaPrioridade(){
  const tm=J.times[J.vez];
  if(!tm.prio||J.fase!=="jogando")return;
  tm.prio--;
  const v=rolaAcao();
  J.dados.push({v,usado:0,extra:1});
  reg("b",`PRIORIDADE — ${NOMES[J.vez]} rola um dado a mais: ${v}`);
  toast("dado extra: "+v,""); vibra(14); pinta();
}

/* ══════════════════ BOTÕES ══════════════════ */
G("btTime").onclick=()=>{ sheetAberto==="Time"?fechaSheet():abreTime(); };
G("btPrio").onclick=()=>usaPrioridade();
G("btLoja").onclick=()=>{ sheetAberto&&sheetAberto.startsWith("Loja")?fechaSheet():abreLoja(); };
G("btCartas").onclick=()=>{ sheetAberto==="Cartas"?fechaSheet():abreMao(); };
/* Estruturas: uma linha por rota, dos dois lados, com a vida em bolinha e a
   torre que aceita golpe AGORA marcada. Na gaveta cabe o que não cabia no
   painel — em que passo da rota cada torre está, e por que o Nexus está ou não
   exposto. É consulta, não HUD: abre, decide onde cercar, fecha. */
function abreEstruturas(){
  const pip=(v,max)=>`<span class="pips">${
    Array.from({length:max},(_,i)=>`<i class="${i<v?"on":""}"></i>`).join("")}</span>`;
  const lado=t=>{
    const rotas=Object.keys(ROTAS).map(nome=>{
      const ts=J.torres.filter(x=>x.rota===nome&&x.t===t).sort((a,b)=>a.i-b.i);
      const exp=torreExposta(nome,t);
      const caiu=ts.every(x=>x.vida<=0);
      const torres=ts.map(x=>{
        if(x.vida<=0) return `<span class="tw caiu" title="passo ${x.i}">✕</span>`;
        const eu=x===exp;
        return `<span class="tw${eu?" exposta":""}" title="passo ${x.i}">`+
               `${pip(x.vida,VIDA_TORRE)}${eu?'<em>alvo</em>':""}</span>`;
      }).join("");
      return `<div class="er${caiu?" aberta":""}">
        <b>${nome.toUpperCase()}</b>
        ${caiu?'<span class="aviso">ROTA ABERTA</span>':torres}</div>`;
    }).join("");
    const aberta=rotaAberta(t), nx=Math.max(0,J.nexus[t]);
    return `<div class="ecol t${t}">
      <div class="ecab">${NOMES[t]}${t===J.vez?" <i>· sua vez</i>":""}</div>
      ${rotas}
      <div class="er nex${aberta?" exposto":""}">
        <b>NEXUS</b>${pip(nx,VIDA_NEXUS)}
        <span class="${aberta?"aviso":"ja"}">${aberta?"EXPOSTO":"protegido"}</span></div></div>`;
  };
  abreSheet("Estruturas",
    `<div id="estruturas">${lado(0)}${lado(1)}</div>
     <p class="est-nota">A torre marcada <b>alvo</b> é a única da rota que pode ser atingida
     agora — a de trás só depois que ela cair. O alvo atual aceita vários golpes na rodada.
     O <b>Nexus</b> só fica exposto quando uma rota
     inteira daquele lado cai, e aguenta um golpe de herói por rodada.</p>`);
}
G("btEstr").onclick=()=>{ sheetAberto==="Estruturas"?fechaSheet():abreEstruturas(); };
G("btLog").onclick=()=>{ sheetAberto==="Histórico"?fechaSheet():abreLog(); };
G("btAjuda").onclick=()=>{ sheetAberto==="Manual"?fechaSheet():abreManual(); };
G("btFim").onclick=()=>{
  if(J.fase!=="jogando")return;
  const livres=J.dados.filter(d=>!d.usado).length;
  if((livres||J.mov.rest)&&!G("btFim").dataset.confirma){
    G("btFim").dataset.confirma="1";
    G("btFim").textContent="Sobrou! Encerrar?";
    setTimeout(()=>{ const b=G("btFim"); if(b){ delete b.dataset.confirma; b.textContent="Encerrar"; } },2600);
    return toast(`sobrou ${J.mov.rest} de movimento e ${livres} ${livres===1?"ação":"ações"}`,"");
  }
  delete G("btFim").dataset.confirma; G("btFim").textContent="Encerrar";
  fechaSheet(); limpaModo(); selHeroi=null;
  encerraTurno(); pinta();
};
G("btConv").onclick=()=>{
  if(dadoSel===null||J.dados[dadoSel].usado)return;
  const d=J.dados[dadoSel]; d.usado=1; J.mov.rest+=d.v; J.mov.v+=d.v;
  reg(J.vez?"c":"a",`${NOMES[J.vez]} vira a ação ${d.v} em movimento (total ${J.mov.rest})`);
  toast("+"+d.v+" de movimento",""); vibra(12);
  dadoSel=null; calcula(); pinta();
};
G("btPlaca").onclick=()=>{ usaPlaca(1); toast("dado ajustado",""); vibra(10); };
G("btRerol").onclick=()=>{ rerola(); toast("dado re-rolado",""); vibra(10); };
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){ if(sheetAberto)return fechaSheet(); return cancela(); }
});
