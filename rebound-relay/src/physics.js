/* Pure, seeded simulation. Browser timing, storage, input, and effects live elsewhere. */
(function(root){
  'use strict';
  const C=Object.freeze({width:960,height:640,step:1/120,duration:90,playerRadius:23,ballRadius:13,
    acceleration:1750,braking:8.5,movingDrag:2.8,playerSpeed:340,boostSpeed:560,boostImpulse:260,
    boostDuration:.28,boostCooldown:1,ballDrag:.055,wallRestitution:.98,bumperRestitution:.88,
    playerMass:3,maxTravel:4,targetMargin:36,targetSeparation:240,scoreLock:.2});
  const DIFFICULTIES=Object.freeze({
    easy:Object.freeze({id:'easy',name:'Chill',goalHalf:100,ballMin:150,ballMax:600,launchSpeed:200}),
    normal:Object.freeze({id:'normal',name:'Relay',goalHalf:76,ballMin:230,ballMax:820,launchSpeed:290}),
    hard:Object.freeze({id:'hard',name:'Overdrive',goalHalf:48,ballMin:320,ballMax:1050,launchSpeed:390})
  });
  const WALLS=['NORTH','EAST','SOUTH','WEST'];
  function clampSpeed(body,max){const n=Math.hypot(body.vx,body.vy);if(n>max){body.vx*=max/n;body.vy*=max/n;}}
  function countBanks(mask){let count=0;for(let i=0;i<4;i++)count+=(mask>>i)&1;return count;}
  // Clean-shot scoring: only the first preceding contact with each wall costs 100.
  // A scored contact is handled before bank(), so it does not deduct points.
  function shotValue(mask){return 500-100*countBanks(mask);}
  function random(g){let n=g.rngState;n^=n<<13;n^=n>>>17;n^=n<<5;g.rngState=n>>>0;return g.rngState/2**32;}
  function targetPoint(wall,center){return [{x:center,y:C.ballRadius},{x:C.width-C.ballRadius,y:center},{x:center,y:C.height-C.ballRadius},{x:C.ballRadius,y:center}][wall];}
  function targetDistance(g,wall,center){
    const tangent=wall%2?g.ball.y:g.ball.x;
    const nearest=Math.max(center-g.rules.goalHalf,Math.min(center+g.rules.goalHalf,tangent));
    const point=targetPoint(wall,nearest);return Math.hypot(point.x-g.ball.x,point.y-g.ball.y);
  }
  function chooseTarget(g,separate){
    const length=g.activeGoal%2?C.height:C.width;
    const low=C.targetMargin+g.rules.goalHalf,high=length-low;
    let center=low+random(g)*(high-low);
    if(separate){
      for(let i=0;i<12&&targetDistance(g,g.activeGoal,center)<C.targetSeparation;i++)center=low+random(g)*(high-low);
      if(targetDistance(g,g.activeGoal,center)<C.targetSeparation)center=targetDistance(g,g.activeGoal,low)>targetDistance(g,g.activeGoal,high)?low:high;
    }
    g.goalCenter=center;
  }
  function newGame(difficulty='normal',seed=0x721a5e){
    if(!Object.hasOwn(DIFFICULTIES,difficulty))throw new RangeError('Unknown difficulty');
    const g={status:'ready',difficulty,rules:DIFFICULTIES[difficulty],rngState:(seed>>>0)||0x721a5e,
      time:C.duration,score:0,goals:0,activeGoal:0,goalCenter:480,bankMask:0,scoreLock:0,lastScoredWall:-1,
      boostCooldown:0,boostRemaining:0,facing:{x:0,y:-1},ballHeading:{x:0,y:-1},events:[],
      player:{x:480,y:435,vx:0,vy:0,r:C.playerRadius},ball:{x:480,y:320,vx:0,vy:0,r:C.ballRadius}};
    chooseTarget(g,false);
    const angle=-Math.PI/2+(random(g)-.5)*1.8;
    g.ball.vx=Math.cos(angle)*g.rules.launchSpeed;g.ball.vy=Math.sin(angle)*g.rules.launchSpeed;
    g.ballHeading={x:Math.cos(angle),y:Math.sin(angle)};return g;
  }
  function start(g){if(g.status==='ready')g.status='running';}
  function pause(g){if(g.status==='running'){g.status='paused';return true;}return false;}
  function resume(g){if(g.status==='paused')g.status='running';}
  function keepBallMoving(g){
    const b=g.ball,n=Math.hypot(b.vx,b.vy);
    if(n>1e-8){g.ballHeading.x=b.vx/n;g.ballHeading.y=b.vy/n;}
    const speed=Math.max(g.rules.ballMin,Math.min(g.rules.ballMax,n));
    b.vx=g.ballHeading.x*speed;b.vy=g.ballHeading.y*speed;
  }
  function scoreGoal(g,wall){
    const points=shotValue(g.bankMask),x=g.ball.x,y=g.ball.y;
    g.score+=points;g.goals++;g.bankMask=0;g.scoreLock=C.scoreLock;g.lastScoredWall=wall;
    g.activeGoal=(wall+1)%4;chooseTarget(g,true);
    g.events.push({type:'goal',points,x,y,wall,goal:g.activeGoal,center:g.goalCenter});
  }
  function bank(g,wall,body){
    if(body!==g.ball||g.scoreLock>0&&wall===g.lastScoredWall)return;
    const fresh=!(g.bankMask&(1<<wall));g.bankMask|=1<<wall;
    g.events.push({type:'bank',wall,fresh,x:body.x,y:body.y});
  }
  function fitsGoal(g,tangent,radius){return Math.abs(tangent-g.goalCenter)<=g.rules.goalHalf-radius;}
  function walls(g,body,oldX,oldY,allowGoals){
    const r=body.r;
    const tests=[
      {wall:0,axis:'y',v:'vy',boundary:r,sign:-1,old:oldY,oldT:oldX,tangent:body.x},
      {wall:1,axis:'x',v:'vx',boundary:C.width-r,sign:1,old:oldX,oldT:oldY,tangent:body.y},
      {wall:2,axis:'y',v:'vy',boundary:C.height-r,sign:1,old:oldY,oldT:oldX,tangent:body.x},
      {wall:3,axis:'x',v:'vx',boundary:r,sign:-1,old:oldX,oldT:oldY,tangent:body.y}];
    for(const t of tests){
      if((body[t.axis]-t.boundary)*t.sign<=0)continue;
      const incoming=body[t.v]*t.sign>0,delta=body[t.axis]-t.old;
      const fraction=delta?Math.max(0,Math.min(1,(t.boundary-t.old)/delta)):1;
      const tangent=t.oldT+(t.tangent-t.oldT)*fraction;
      const scoring=allowGoals&&body===g.ball&&incoming&&g.scoreLock<=0&&t.wall===g.activeGoal&&fitsGoal(g,tangent,r);
      body[t.axis]=t.boundary;
      if(scoring){body[t.v]*=-1;scoreGoal(g,t.wall);}
      else if(incoming){
        const impact=Math.abs(body[t.v]);body[t.v]*=-C.wallRestitution;bank(g,t.wall,body);
        if(body===g.player&&impact>180)g.events.push({type:'player-wall',strength:Math.min(1,impact/C.boostSpeed),x:body.x,y:body.y});
      }
    }
  }
  function bump(g){
    const p=g.player,b=g.ball,dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy),separation=p.r+b.r;
    if(d>=separation)return;
    const nx=d>1e-9?dx/d:g.facing.x,ny=d>1e-9?dy/d:g.facing.y;
    const overlap=separation-d+.001,playerShare=1/(C.playerMass+1),ballShare=C.playerMass/(C.playerMass+1);
    p.x-=nx*overlap*playerShare;p.y-=ny*overlap*playerShare;b.x+=nx*overlap*ballShare;b.y+=ny*overlap*ballShare;
    const relative=(b.vx-p.vx)*nx+(b.vy-p.vy)*ny;if(relative>=0)return;
    const impulse=-(1+C.bumperRestitution)*relative/(1+1/C.playerMass);
    p.vx-=impulse*nx/C.playerMass;p.vy-=impulse*ny/C.playerMass;b.vx+=impulse*nx;b.vy+=impulse*ny;
    clampSpeed(p,C.boostSpeed);keepBallMoving(g);
    g.events.push({type:'bump',strength:Math.min(1,impulse/700),x:b.x,y:b.y});
  }
  function step(g,input={},dt=C.step){
    if(g.status!=='running')return;
    if(!Number.isFinite(dt)||dt<=0||dt>C.step+1e-9)throw new RangeError('Use fixed steps of at most 1/120 second.');
    const liveDt=Math.min(dt,g.time),p=g.player,b=g.ball;
    g.boostCooldown=Math.max(0,g.boostCooldown-liveDt);g.boostRemaining=Math.max(0,g.boostRemaining-liveDt);g.scoreLock=Math.max(0,g.scoreLock-liveDt);
    let x=Number.isFinite(input.x)?input.x:0,y=Number.isFinite(input.y)?input.y:0;
    const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
    const moving=length>.05;
    if(moving){const n=Math.hypot(x,y);g.facing.x=x/n;g.facing.y=y/n;}else{x=0;y=0;}
    const drag=Math.exp(-(moving?C.movingDrag:C.braking)*liveDt);
    p.vx=p.vx*drag+x*C.acceleration*liveDt;p.vy=p.vy*drag+y*C.acceleration*liveDt;
    if(input.boost&&g.boostCooldown<=1e-8){p.vx+=g.facing.x*C.boostImpulse;p.vy+=g.facing.y*C.boostImpulse;g.boostCooldown=1;g.boostRemaining=C.boostDuration;g.events.push({type:'boost',x:p.x,y:p.y});}
    clampSpeed(p,g.boostRemaining>0?C.boostSpeed:C.playerSpeed);
    const ballDrag=Math.exp(-C.ballDrag*liveDt);b.vx*=ballDrag;b.vy*=ballDrag;keepBallMoving(g);
    const substeps=Math.max(1,Math.ceil((C.boostSpeed+g.rules.ballMax)*liveDt/C.maxTravel)),h=liveDt/substeps;
    for(let i=0;i<substeps;i++){
      const oldPX=p.x,oldPY=p.y,oldBX=b.x,oldBY=b.y;
      p.x+=p.vx*h;p.y+=p.vy*h;b.x+=b.vx*h;b.y+=b.vy*h;
      walls(g,p,oldPX,oldPY,false);walls(g,b,oldBX,oldBY,true);
      const contactX=b.x,contactY=b.y;bump(g);walls(g,p,p.x,p.y,false);walls(g,b,contactX,contactY,true);keepBallMoving(g);
    }
    g.time=Math.max(0,g.time-liveDt);
    if(g.time<1e-8){g.time=0;g.status='over';g.events.push({type:'end'});}
  }
  const API=Object.freeze({C,DIFFICULTIES,WALLS,newGame,start,pause,resume,step,countBanks,shotValue,targetPoint,targetDistance});
  if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.ReboundPhysics=API;
})(globalThis);
