/* JAGERLARAMAIS v0.8 — patch isolado de playtest. Não altera o jogo original. */
let aiMode=false;

const CAMPOS=[
  {id:'a1',t:0,pos:[2,2],ouro:2},{id:'a2',t:0,pos:[2,8],ouro:2},
  {id:'b1',t:1,pos:[8,2],ouro:2},{id:'b2',t:1,pos:[8,8],ouro:2},
  {id:'neutro',t:-1,pos:[5,5],ouro:3}
];

const st=document.createElement('style');
st.textContent=`
#mapa .camp-bg{fill:#101a15;stroke:#8a6a2f;stroke-width:1.5}
#mapa .camp-core{fill:#d4a24c;opacity:.9}
#mapa .camp.neutro .camp-core{fill:#e8f0ea}
#mapa .camp-txt,#mapa .camp-cd{font-family:var(--mono);font-size:5px;text-anchor:middle;fill:#d4a24c;pointer-events:none}
#mapa .camp-cd{fill:#9db1a6;font-size:6px}
#telacx .ai-tag{display:inline-block;border:1px solid var(--brass);color:var(--brass);border-radius:99px;padding:3px 8px;font:11px var(--mono);margin-bottom:8px}
`;
document.head.appendChild(st);

function inicializaCampos(){
  J.camps=CAMPOS.map(c=>({...c,respawn:0,ativo:1}));
}
function campEm(c,r){ return (J.camps||[]).find(cp=>cp.ativo&&cp.pos[0]===c&&cp.pos[1]===r); }
function coletaAcampamento(h){
  if(!h||!J.camps)return;
  const cp=campEm(...h.pos); if(!cp)return;
  cp.ativo=0; cp.respawn=3;
  const invasao=cp.t!==-1&&cp.t!==h.t;
  const ganho=cp.ouro+(invasao?1:0); h.ouro+=ganho;
  reg(invasao?'b':(h.t?'c':'a'), invasao?`${h.n} roubou a selva adversária (+${ganho} ouro)`:`${h.n} farmou acampamento (+${ganho} ouro)`);
}
function atualizaCampos(){
  (J.camps||[]).forEach(cp=>{ if(cp.respawn>0){cp.respawn--; if(cp.respawn===0)cp.ativo=1;} });
}

const _novo=novo;
novo=function(){ _novo(); inicializaCampos(); pinta(); };

const _moveAte=moveAte;
moveAte=function(c,r){
  const h=selHeroi; const antes=h?[...h.pos]:null;
  _moveAte(c,r);
  if(h&&antes&&(h.pos[0]!==antes[0]||h.pos[1]!==antes[1])){ coletaAcampamento(h); pinta(); }
};

const _fimDaRodada=fimDaRodada;
fimDaRodada=function(){ _fimDaRodada(); atualizaCampos(); pinta(); };

const _desenhaMapa=desenhaMapa;
desenhaMapa=function(){
  _desenhaMapa();
  if(!J.camps)return;
  const g=document.createElementNS('http://www.w3.org/2000/svg','g');
  J.camps.forEach(cp=>{
    const [x,y]=centro(...cp.pos);
    if(cp.ativo){
      const gg=el('g',{class:'camp'+(cp.t===-1?' neutro':'')});
      gg.appendChild(el('circle',{cx:x,cy:y,r:7.2,class:'camp-bg'}));
      gg.appendChild(el('circle',{cx:x,cy:y,r:4.4,class:'camp-core'}));
      const tx=el('text',{x:x,y:y+11,class:'camp-txt'}); tx.textContent=cp.t===-1?'N':(cp.t===0?'A':'C'); gg.appendChild(tx); g.appendChild(gg);
    }else if(cp.respawn>0){
      const tx=el('text',{x:x,y:y+3,class:'camp-cd'}); tx.textContent='R'+cp.respawn; g.appendChild(tx);
    }
  });
  svg.appendChild(g);
};

function iaEscolheAlvo(h){
  if(alvoNexus!==null)return {tipo:'nexus',v:alvoNexus};
  if(alvosTorre.length)return {tipo:'torre',v:alvosTorre.slice().sort((a,b)=>a.vida-b.vida)[0]};
  if(alvosEpico.length)return {tipo:'epico',v:alvosEpico[0]};
  const inimigos=alvos.filter(x=>x.t!==h.t&&!x.morto);
  if(inimigos.length)return {tipo:'heroi',v:inimigos.slice().sort((a,b)=>a.vida-b.vida)[0]};
  return null;
}
function scoreDestino(h,p){
  const inim=J.times[0].herois.filter(o=>!o.morto);
  const alvo=inim.slice().sort((u,v)=>dist(...p,...u.pos)-dist(...p,...v.pos))[0];
  const camps=(J.camps||[]).filter(c=>c.ativo);
  const camp=camps.slice().sort((u,v)=>dist(...p,...u.pos)-dist(...p,...v.pos))[0];
  const da=alvo?dist(...p,...alvo.pos):20, dc=camp?dist(...p,...camp.pos):20;
  return Math.min(da*2,dc*1.25);
}
function iaExecutaTurno(){
  if(!aiMode||J.fim!==null||J.fase!=='jogando'||J.vez!==1)return;
  let guard=0;
  while(guard++<30&&J.fim===null){
    let jogou=false;
    for(const h of vivos(1)){
      if(h.agiu)continue;
      for(let i=0;i<h.habs.length;i++){
        const hb=h.habs[i], d=dadoPara(hb); if(d===null)continue;
        selHeroi=h; limpaModo(); selHeroi=h; iniciaHab(i);
        const alvo=iaEscolheAlvo(h);
        if(alvo){
          if(alvo.tipo==='nexus')atacaNexus(alvo.v);
          else if(alvo.tipo==='torre')atacaTorre(alvo.v);
          else if(alvo.tipo==='epico')atacaEpico(alvo.v);
          else confirmaHab(alvo.v);
          jogou=true; break;
        }
        limpaModo(); selHeroi=null;
      }
      if(jogou)break;
    }
    if(jogou)continue;
    if(J.mov.rest>0){
      const candidatos=vivos(1).filter(h=>!h.preso);
      if(candidatos.length){
        const h=candidatos.slice().sort((a,b)=>scoreDestino(a,a.pos)-scoreDestino(b,b.pos))[0];
        selHeroi=h; modo='mover'; calcula();
        if(mover.length){
          const destino=mover.slice().sort((a,b)=>scoreDestino(h,a)-scoreDestino(h,b))[0];
          moveAte(...destino); jogou=true;
        }
      }
    }
    if(!jogou)break;
  }
  limpaModo(); selHeroi=null;
  if(J.fim===null)encerraTurno();
}

const _perguntaCaca=perguntaCaca;
perguntaCaca=function(t,depois){
  if(aiMode&&t===1){
    const op=['selva','topo','meio','baixo']; J.times[1].caca=op[Math.floor(Math.random()*op.length)]; J.times[1].cacaRevelada=null; return depois();
  }
  return _perguntaCaca(t,depois);
};

const _iniciaTurno=iniciaTurno;
iniciaTurno=function(){
  _iniciaTurno();
  if(aiMode&&J.vez===1&&J.fase==='jogando'&&J.fim===null) setTimeout(iaExecutaTurno,350);
};

const _telaAbertura=telaAbertura;
telaAbertura=function(){
  abre(`<span class="ai-tag">PLAYTEST v0.8 · ISOLADO</span><span class="et">Um MOBA de mesa</span><h2>JAGER<br>LARAMAIS</h2>
    <p>Teste experimental: <b>2 acampamentos por lado + 1 neutro</b> e adversário controlado por IA.</p>
    <button class="grande" id="btIA" style="background:#315B52">Jogar contra a IA</button>
    <button class="grande" id="btOriginal" style="background:none;border:1px solid var(--line);color:var(--ink-2)">Partida rápida sem IA</button>`,()=>{});
  G('btIA').onclick=()=>{ aiMode=true; TIMES=[['vharn','nyx','solenne','vesper','mirrha'],['kaross','grumo','zhet','cael','torvald']]; comeca(false,false); };
  G('btOriginal').onclick=()=>{ aiMode=false; comeca(false,false); };
};

globalThis.__JAGER_PLAYTEST__={get ai(){return aiMode},get state(){return J}};
telaAbertura();
