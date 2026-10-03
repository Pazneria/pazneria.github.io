(function(){
  'use strict';
  const P=ReboundPhysics,C=P.C,$=id=>document.getElementById(id);
  const canvas=$('arena'),ctx=canvas.getContext('2d');
  let storage=null;try{storage=localStorage;}catch{}
  const records=ReboundRecords.createRecords(storage);
  function preference(name,fallback){try{const v=storage?.getItem('rebound-relay:v02:'+name);return v===null||v===undefined?fallback:JSON.parse(v);}catch{return fallback;}}
  function savePreference(name,value){try{storage?.setItem('rebound-relay:v02:'+name,JSON.stringify(value));}catch{}}
  const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
  let reduced=preference('reduced',motionQuery.matches)===true,muted=preference('muted',false)===true;
  let difficulty=preference('difficulty','normal');if(typeof difficulty!=='string'||!Object.hasOwn(P.DIFFICULTIES,difficulty))difficulty='normal';
  function seed(){try{return crypto.getRandomValues(new Uint32Array(1))[0];}catch{return Date.now()>>>0;}}
  let game=P.newGame(difficulty,seed()),feedback=ReboundFeedback.createFeedback(reduced),shownBest=records.best(difficulty);
  const sound=createReboundSound(muted);
  let accumulator=0,lastTime=null,pendingBoost=false,runEpoch=0,ballTrail=[],playerTrail=[],result=null;
  const input=createReboundInput(action);
  function ready(mode){
    difficulty=mode;savePreference('difficulty',mode);game=P.newGame(mode,seed());feedback=ReboundFeedback.createFeedback(reduced);shownBest=records.best(difficulty);
    input.clear();pendingBoost=false;accumulator=0;lastTime=null;ballTrail=[];playerTrail=[];result=null;syncOverlay();render();
  }
  function reset(){
    game=P.newGame(difficulty,seed());P.start(game);feedback=ReboundFeedback.createFeedback(reduced);shownBest=records.best(difficulty);
    input.clear();pendingBoost=false;accumulator=0;lastTime=null;ballTrail=[];playerTrail=[];result=null;runEpoch++;syncOverlay();canvas.focus({preventScroll:true});
  }
  function action(type){
    if(type==='restart'){sound.unlock();reset();return;}
    if(type==='background'){
      if(P.pause(game)){input.clear();pendingBoost=false;accumulator=0;lastTime=null;syncOverlay(true);}return;
    }
    if(type==='start'){
      if(document.hidden)return;sound.unlock();
      if(game.status==='ready'||game.status==='over')reset();
      else if(game.status==='paused'){P.resume(game);input.clear();pendingBoost=false;accumulator=0;lastTime=null;syncOverlay();canvas.focus({preventScroll:true});}return;
    }
    if(type==='pause'){
      if(game.status==='running'){P.pause(game);input.clear();pendingBoost=false;accumulator=0;lastTime=null;syncOverlay();}
      else if(game.status==='paused')action('start');
    }
  }
  function syncSettings(){
    $('sound').textContent=muted?'Sound: off':'Sound: on';$('sound').setAttribute('aria-pressed',String(!muted));
    $('motion').textContent=reduced?'Calm: on':'Calm: off';$('motion').setAttribute('aria-pressed',String(reduced));
    $('motion').setAttribute('aria-label','Reduced motion: '+(reduced?'on':'off'));
    const locked=game.status==='running'||game.status==='paused';
    $('difficulty-help').textContent=locked?'Difficulty locked · finish this run to change':'Choose a difficulty · click or tap a button';
    for(const button of $('difficulty').children){
      const selected=button.dataset.difficulty===difficulty;
      button.setAttribute('aria-pressed',String(selected));
      button.querySelector('.choice-state').textContent=selected?'Selected':'Select';
      button.disabled=locked;
    }
  }
  function syncOverlay(background=false){
    $('overlay').hidden=game.status==='running';$('pause').disabled=game.status==='ready'||game.status==='over';
    $('pause').innerHTML=game.status==='paused'?'Resume <kbd>Esc</kbd>':'Pause <kbd>Esc</kbd>';
    $('pause').setAttribute('aria-label',game.status==='paused'?'Resume game':'Pause game');
    $('instructions').hidden=game.status!=='ready';syncSettings();
    if(game.status==='ready'){
      $('overlay-eyebrow').textContent='90 SECONDS. MAKE THEM COUNT.';$('overlay-title').textContent='Keep the rally alive.';
      $('overlay-copy').innerHTML='Knock the ball into the <b>green target</b>. A clean shot scores <b>500</b>. Each different wall the ball touches first costs 100; repeat walls are free. The next target moves clockwise.';
      $('start').innerHTML='Start 90-second run <span>↗</span>';$('overlay-note').textContent='Choose your difficulty above. Release to brake. Each mode has its own best.';
    }else if(game.status==='paused'){
      $('overlay-eyebrow').textContent='TAKE A BREATHER';$('overlay-title').textContent='Run paused';
      $('overlay-copy').textContent=background?'Paused while the game was in the background. Resume when you are ready.':'The clock is stopped. Your ball, shot value, and position are waiting.';
      $('start').innerHTML='Resume run <span>→</span>';$('overlay-note').textContent='Esc or Enter to resume · R to restart this difficulty';
    }else if(game.status==='over'){
      $('overlay-eyebrow').textContent=result?.isNew?'NEW '+game.rules.name.toUpperCase()+' BEST':'RELAY COMPLETE';
      $('overlay-title').textContent=game.score.toLocaleString()+' points';
      $('overlay-copy').textContent=game.goals+' goals in '+game.rules.name+'. '+(result?.persistent?'Local best: ':'Tab best: ')+(result?.best||0)+'. Choose a mode above or chase another run.';
      $('start').innerHTML='Play again <span>↗</span>';$('overlay-note').textContent='Enter or R to play again · Each difficulty keeps its own best';
      $('announce').textContent='Run complete. '+game.score+' points in '+game.rules.name+'.';
    }
  }
  $('difficulty').addEventListener('click',e=>{const b=e.target.closest('[data-difficulty]');if(b&&!b.disabled&&(game.status==='ready'||game.status==='over'))ready(b.dataset.difficulty);});
  $('guide').addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space')e.stopPropagation();});
  $('sound').addEventListener('click',()=>{muted=!muted;savePreference('muted',muted);sound.setMuted(muted);syncSettings();if(game.status==='running')canvas.focus({preventScroll:true});});
  function setReduced(value,persist=true){reduced=Boolean(value);feedback.setReduced(reduced);ballTrail=[];playerTrail=[];if(persist)savePreference('reduced',reduced);syncSettings();}
  $('motion').addEventListener('click',()=>{setReduced(!reduced);if(game.status==='running')canvas.focus({preventScroll:true});});
  motionQuery.addEventListener('change',e=>{if(preference('reduced',null)===null)setReduced(e.matches,false);});
  function handleEvents(){
    for(const e of game.events){
      feedback.handle(e);sound.handle(e);
      if(e.type==='goal')$('announce').textContent=e.points+' points. '+P.WALLS[e.goal]+' target is live.';
      if(e.type==='end'){result=records.record(game.difficulty,game.score);shownBest=result.best;input.clear();pendingBoost=false;syncOverlay();}
    }
    game.events.length=0;
  }
  const TAU=Math.PI*2,INK='#23124a',PAPER='#fffaf0',LIME='#a8f03c',SUN='#ffc738',CORAL='#ff5a6e',CYAN='#35d8f0';
  const DISPLAY='"Arial Rounded MT Bold","Arial Rounded MT",Nunito,"Varela Round","Segoe UI Black","Segoe UI",system-ui,sans-serif';
  // Point on a wall: t runs along the wall, d is the inward distance from it.
  function wallPoint(w,t,d){return w===0?[t,d]:w===1?[C.width-d,t]:w===2?[t,C.height-d]:[d,t];}
  function wallPath(w,a,b,d){const p=wallPoint(w,a,d),q=wallPoint(w,b,d);ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);}
  function roundRect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
  // Static violet court, linework, center emblem and banked rails: painted once and blitted each frame.
  const floor=document.createElement('canvas');floor.width=C.width;floor.height=C.height;
  (function paintFloor(){
    const g=floor.getContext('2d'),W=C.width,H=C.height,cx=W/2,cy=H/2,RAIL=14;
    let fill=g.createLinearGradient(0,0,0,H);fill.addColorStop(0,'#5646da');fill.addColorStop(1,'#4636c0');g.fillStyle=fill;g.fillRect(0,0,W,H);
    // Faint sunburst rays radiating from the emblem.
    g.fillStyle='#ffffff09';for(let i=0;i<24;i+=2){const a=i*TAU/24;g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,W,a,a+TAU/24);g.closePath();g.fill();}
    // Court zones: deeper end lanes and coral corner pockets.
    g.fillStyle='#2c1f9a38';g.fillRect(0,0,160,H);g.fillRect(W-160,0,160,H);
    g.fillStyle='#ff5a6e2e';for(const [x,y,a] of [[0,0,0],[W,0,Math.PI/2],[W,H,Math.PI],[0,H,Math.PI*1.5]]){g.beginPath();g.moveTo(x,y);g.arc(x,y,92,a,a+Math.PI/2);g.closePath();g.fill();}
    // Big graphic court lines.
    g.lineCap='round';g.lineJoin='round';g.strokeStyle='#fff4dc40';g.lineWidth=5;
    roundRect(g,34,34,W-68,H-68,26);g.stroke();
    g.beginPath();g.moveTo(cx,34);g.lineTo(cx,H-34);g.moveTo(160,34);g.lineTo(160,H-34);g.moveTo(W-160,34);g.lineTo(W-160,H-34);g.stroke();
    g.beginPath();g.arc(160,cy,86,-Math.PI/2,Math.PI/2);g.stroke();g.beginPath();g.arc(W-160,cy,86,Math.PI/2,Math.PI*1.5);g.stroke();
    g.strokeStyle='#ff8c9a73';g.lineWidth=4;for(const [x,y,a] of [[0,0,0],[W,0,Math.PI/2],[W,H,Math.PI],[0,H,Math.PI*1.5]]){g.beginPath();g.arc(x,y,92,a+.08,a+Math.PI/2-.08);g.stroke();}
    // Center emblem: clockwise relay arrows show where the next gate travels.
    g.fillStyle='#3a2ba8';g.beginPath();g.arc(cx,cy,104,0,TAU);g.fill();
    g.strokeStyle='#fff4dc59';g.lineWidth=6;g.stroke();
    g.strokeStyle='#8b7ff5';g.lineWidth=3;g.beginPath();g.arc(cx,cy,60,0,TAU);g.stroke();
    g.strokeStyle='#fff4dc8c';g.fillStyle='#fff4dc8c';g.lineWidth=8;
    for(let k=0;k<4;k++){
      const s=k*Math.PI/2-Math.PI/2+.28,e=s+Math.PI/2-.72,r=82;g.beginPath();g.arc(cx,cy,r,s,e);g.stroke();
      const px=cx+Math.cos(e)*r,py=cy+Math.sin(e)*r,tx=-Math.sin(e),ty=Math.cos(e),nx=Math.cos(e),ny=Math.sin(e);
      g.beginPath();g.moveTo(px+tx*16,py+ty*16);g.lineTo(px+nx*11,py+ny*11);g.lineTo(px-nx*11,py-ny*11);g.closePath();g.fill();
    }
    g.font='800 20px '+DISPLAY;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff4dc99';
    for(const [t,x,y] of [['N',cx,cy-36],['E',cx+36,cy],['S',cx,cy+36],['W',cx-36,cy]])g.fillText(t,x,y);
    g.fillStyle='#fff4dc66';g.beginPath();g.arc(cx,cy,6,0,TAU);g.fill();
    // Inner shade under each rail for depth.
    for(const [x0,y0,x1,y1,rx,ry,rw,rh] of [[0,RAIL,0,RAIL+26,0,RAIL,W,26],[0,H-RAIL,0,H-RAIL-26,0,H-RAIL-26,W,26],[RAIL,0,RAIL+26,0,RAIL,0,26,H],[W-RAIL,0,W-RAIL-26,0,W-RAIL-26,0,26,H]]){
      fill=g.createLinearGradient(x0,y0,x1,y1);fill.addColorStop(0,'#150a3059');fill.addColorStop(1,'#150a3000');g.fillStyle=fill;g.fillRect(rx,ry,rw,rh);
    }
    // Banked rails: ink bumper band, violet lip, cream rim and bolts.
    g.fillStyle=INK;g.fillRect(0,0,W,RAIL);g.fillRect(0,H-RAIL,W,RAIL);g.fillRect(0,0,RAIL,H);g.fillRect(W-RAIL,0,RAIL,H);
    g.strokeStyle='#8e80ff';g.lineWidth=3;g.strokeRect(RAIL+1.5,RAIL+1.5,W-2*RAIL-3,H-2*RAIL-3);
    g.strokeStyle='#fff4dc30';g.lineWidth=2;g.strokeRect(5,5,W-10,H-10);
    g.fillStyle='#7a6cf0';g.beginPath();
    for(let x=80;x<W;x+=80){g.moveTo(x+2.4,9);g.arc(x,9,2.4,0,TAU);g.moveTo(x+2.4,H-9);g.arc(x,H-9,2.4,0,TAU);}
    for(let y=80;y<H;y+=80){g.moveTo(11.4,y);g.arc(9,y,2.4,0,TAU);g.moveTo(W-6.6,y);g.arc(W-9,y,2.4,0,TAU);}
    g.fill();
    // Coral corner bumpers (targets always sit at least 36px from a corner).
    for(const [x,y,a] of [[0,0,0],[W,0,Math.PI/2],[W,H,Math.PI],[0,H,Math.PI*1.5]]){
      g.beginPath();g.moveTo(x,y);g.arc(x,y,32,a,a+Math.PI/2);g.closePath();g.fillStyle=CORAL;g.fill();g.strokeStyle=INK;g.lineWidth=3;g.stroke();
      g.beginPath();g.arc(x,y,23,a+.35,a+Math.PI/2-.35);g.strokeStyle='#ffc2ca';g.lineWidth=3;g.stroke();
    }
  })();
  const ballHalo=ctx.createRadialGradient(0,0,C.ballRadius*.8,0,0,C.ballRadius*2.2);ballHalo.addColorStop(0,'#ffe27a66');ballHalo.addColorStop(1,'#ffe27a00');
  const ballBody=ctx.createRadialGradient(-4,-5,1,0,0,C.ballRadius);ballBody.addColorStop(0,'#fffbe0');ballBody.addColorStop(.45,'#ffd84a');ballBody.addColorStop(1,'#ff9f1c');
  const shell=ctx.createLinearGradient(0,-21,0,15);shell.addColorStop(0,'#ff9aa6');shell.addColorStop(.5,CORAL);shell.addColorStop(1,'#e8405a');
  const visor=ctx.createLinearGradient(0,-15,0,0);visor.addColorStop(0,'#b8f6ff');visor.addColorStop(1,'#1fb4d6');
  function drawGate(wall,center,half){
    const a=center-half,b=center+half,[nx,ny]=[[0,1],[-1,0],[0,-1],[1,0]][wall],[ox,oy]=wallPoint(wall,center,0);
    const wash=ctx.createLinearGradient(ox,oy,ox+nx*96,oy+ny*96);wash.addColorStop(0,'#a8f03c59');wash.addColorStop(1,'#a8f03c00');
    const p=wallPoint(wall,a,0),q=wallPoint(wall,b,96);ctx.fillStyle=wash;ctx.fillRect(Math.min(p[0],q[0]),Math.min(p[1],q[1]),Math.abs(q[0]-p[0]),Math.abs(q[1]-p[1]));
    ctx.save();ctx.lineCap='butt';ctx.lineJoin='round';
    // Lime mouth over the rail with an ink keyline on its inner edge.
    ctx.beginPath();wallPath(wall,a,b,9);ctx.strokeStyle=INK;ctx.lineWidth=22;ctx.stroke();
    ctx.beginPath();wallPath(wall,a,b,8);ctx.strokeStyle=LIME;ctx.lineWidth=14;ctx.stroke();
    ctx.beginPath();wallPath(wall,a+6,b-6,11);ctx.strokeStyle='#eaffc4';ctx.lineWidth=3;ctx.stroke();
    // Bold cream endcaps with ink outlines.
    ctx.lineCap='round';
    for(const t of [a,b]){const s=wallPoint(wall,t,3),e=wallPoint(wall,t,28);ctx.beginPath();ctx.moveTo(s[0],s[1]);ctx.lineTo(e[0],e[1]);ctx.strokeStyle=INK;ctx.lineWidth=14;ctx.stroke();ctx.strokeStyle=PAPER;ctx.lineWidth=7;ctx.stroke();}
    // Chevrons pointing into the gate.
    for(const [d,alpha] of [[44,1],[64,.55]]){
      const [x,y]=wallPoint(wall,center,d);ctx.globalAlpha=alpha;ctx.save();ctx.translate(x,y);ctx.rotate(wall*Math.PI/2);
      ctx.beginPath();ctx.moveTo(-12,5);ctx.lineTo(0,-6);ctx.lineTo(12,5);ctx.strokeStyle=INK;ctx.lineWidth=10;ctx.stroke();ctx.strokeStyle=LIME;ctx.lineWidth=5;ctx.stroke();ctx.restore();
    }
    ctx.restore();
  }
  // Hoverbug: solid body parts fit inside the collision radius; only boost flames extend past it.
  function drawPlayer(p,boosting){
    ctx.save();ctx.translate(p.x,p.y);
    ctx.rotate(Math.atan2(game.facing.y,game.facing.x)+Math.PI/2);
    if(boosting){
      for(const s of [-1,1]){
        ctx.fillStyle='#35d8f0b3';ctx.beginPath();ctx.moveTo(s*10-7,17);ctx.lineTo(s*10,p.r+22);ctx.lineTo(s*10+7,17);ctx.closePath();ctx.fill();
        ctx.fillStyle=PAPER;ctx.beginPath();ctx.moveTo(s*10-3.5,18);ctx.lineTo(s*10,p.r+12);ctx.lineTo(s*10+3.5,18);ctx.closePath();ctx.fill();
      }
    }
    ctx.lineJoin='round';ctx.lineCap='round';
    // Twin rear jet pods.
    for(const s of [-1,1]){
      roundRect(ctx,s>0?4:-16,0,12,18,6);ctx.fillStyle=PAPER;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.stroke();
      ctx.fillStyle=boosting?CYAN:'#3a2ba8';ctx.beginPath();ctx.ellipse(s*10,14,3.5,2.5,0,0,TAU);ctx.fill();
    }
    // Teardrop shell with the nose pointing along the facing direction.
    ctx.beginPath();ctx.moveTo(0,-21);ctx.bezierCurveTo(9,-20,16,-8,15,3);ctx.bezierCurveTo(14,12,8,15,0,15);ctx.bezierCurveTo(-8,15,-14,12,-15,3);ctx.bezierCurveTo(-16,-8,-9,-20,0,-21);ctx.closePath();
    ctx.fillStyle=shell;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-7,10);ctx.lineTo(0,4);ctx.lineTo(7,10);ctx.strokeStyle=PAPER;ctx.lineWidth=3.5;ctx.stroke();
    // Visor face looking forward.
    ctx.beginPath();ctx.ellipse(0,-7,8,7.5,0,0,TAU);ctx.fillStyle=visor;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.stroke();
    ctx.fillStyle=INK;ctx.beginPath();ctx.arc(-3.2,-9,2.1,0,TAU);ctx.arc(3.2,-9,2.1,0,TAU);ctx.fill();
    ctx.fillStyle=PAPER;ctx.beginPath();ctx.arc(-3.8,-9.8,.8,0,TAU);ctx.arc(2.6,-9.8,.8,0,TAU);ctx.fill();
    ctx.beginPath();ctx.arc(0,-17.5,2.6,0,TAU);ctx.fillStyle=PAPER;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
  }
  function render(dt=0){
    if(game.status==='running')feedback.tick(dt);
    const f=feedback.state;
    ctx.fillStyle=INK;ctx.fillRect(0,0,C.width,C.height);ctx.save();ctx.translate(f.shakeX,f.shakeY);
    ctx.drawImage(floor,0,0);
    const wall=game.activeGoal,center=game.goalCenter,half=game.rules.goalHalf;
    // Walls the ball has already touched (each costs 100) get a dashed coral cost stripe in the rail, mirroring the N/E/S/W chips.
    ctx.beginPath();for(let w=0;w<4;w++)if(game.bankMask&(1<<w))wallPath(w,40,(w%2?C.height:C.width)-40,7);
    ctx.setLineDash([18,10]);ctx.strokeStyle=CORAL;ctx.lineWidth=7;ctx.stroke();ctx.setLineDash([]);
    drawGate(wall,center,half);
    if(game.status==='running'&&!reduced){
      for(const [trail,body] of [[ballTrail,game.ball],[playerTrail,game.player]]){
        for(const dot of trail)dot.age+=dt;while(trail.length&&trail[0].age>.2)trail.shift();trail.push({x:body.x,y:body.y,age:0});if(trail.length>30)trail.shift();
      }
    }
    for(const [trail,color,r] of [[ballTrail,'255,199,56',6],[playerTrail,'255,90,110',10]])for(const dot of trail){ctx.fillStyle='rgba('+color+','+Math.max(0,.24*(1-dot.age/.2))+')';ctx.beginPath();ctx.arc(dot.x,dot.y,r,0,TAU);ctx.fill();}
    for(const ring of f.rings){ctx.globalAlpha=1-ring.age/ring.life;ctx.beginPath();ctx.arc(ring.x,ring.y,25+ring.age*60,0,TAU);ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle=CYAN;ctx.lineWidth=3;ctx.stroke();}ctx.globalAlpha=1;
    for(const particle of f.particles){ctx.globalAlpha=1-particle.age/particle.life;ctx.fillStyle=INK;ctx.fillRect(particle.x-3,particle.y-3,6,6);ctx.fillStyle=particle.color;ctx.fillRect(particle.x-2,particle.y-2,4,4);}ctx.globalAlpha=1;
    const b=game.ball,p=game.player,boosting=game.boostRemaining>0;
    // Ball: sunny body with an ink keyline so it stays distinct from the lime gate and coral hoverbug.
    ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle=ballHalo;ctx.beginPath();ctx.arc(0,0,b.r*2.2,0,TAU);ctx.fill();
    ctx.fillStyle=ballBody;ctx.beginPath();ctx.arc(0,0,b.r-1.25,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,b.r*.55,.9,2.4);ctx.strokeStyle='#c8620f';ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();ctx.lineCap='butt';ctx.restore();
    drawPlayer(p,boosting);
    ctx.restore();
    for(const label of f.labels){
      ctx.globalAlpha=Math.min(1,(label.life-label.age)/.25);ctx.font='800 44px '+DISPLAY;ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=9;ctx.strokeStyle=INK;
      const y=label.y-(reduced?0:label.age*28),text='+'+label.points;ctx.strokeText(text,label.x,y+5);ctx.strokeText(text,label.x,y);ctx.fillStyle=SUN;ctx.fillText(text,label.x,y);
    }ctx.globalAlpha=1;
    $('score').textContent=String(game.score).padStart(5,'0');$('timer').textContent=game.time.toFixed(1);$('timer').parentElement.classList.toggle('urgent',game.time<=10);
    $('timer').parentElement.style.setProperty('--p',Math.max(0,Math.min(1,game.time/C.duration)).toFixed(4));
    $('charge').textContent=P.shotValue(game.bankMask);
    for(const chip of $('banks').children)chip.classList.toggle('hit',Boolean(game.bankMask&(1<<Number(chip.dataset.wall))));
    const touched=P.countBanks(game.bankMask);$('charge').classList.toggle('docked',touched>0);
    $('banks').setAttribute('aria-label',touched?touched+' different '+(touched===1?'wall':'walls')+' touched, minus '+touched*100:'No walls touched; clean shot');
    $('boost-fill').style.transform='scaleX('+(1-game.boostCooldown)+')';$('boost-label').textContent=game.boostCooldown>0?'BOOST '+game.boostCooldown.toFixed(1)+'s':'BOOST READY';
    $('boost-label').parentElement.classList.toggle('cooling',game.boostCooldown>0);$('boost').classList.toggle('cooling',game.boostCooldown>0);
    $('best').textContent=shownBest;$('best-caption').textContent=records.persistent?'Local best':'Tab best';$('mode').textContent=game.rules.name;
  }
  function frame(now){
    if(lastTime===null)lastTime=now;const elapsed=Math.min(.1,Math.max(0,(now-lastTime)/1000));lastTime=now;
    if(game.status==='running'){
      const controls=input.sample();pendingBoost ||= controls.boost;accumulator+=elapsed;
      while(accumulator>=C.step&&game.status==='running'){P.step(game,{x:controls.x,y:controls.y,boost:pendingBoost});pendingBoost=false;accumulator-=C.step;handleEvents();}
    }else{input.clear();pendingBoost=false;accumulator=0;}
    render(elapsed);requestAnimationFrame(frame);
  }
  if(new URLSearchParams(location.search).has('test'))window.reboundTest={
    get state(){return game;},input,action,render,handleEvents,ready,setReduced,records,sound,
    get feedback(){return feedback.state;},get epoch(){return runEpoch;}
  };
  syncOverlay();render();requestAnimationFrame(frame);
})();
