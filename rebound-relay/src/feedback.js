(function(root){
  'use strict';
  function createFeedback(reduced=false){
    const state={reduced,particles:[],labels:[],rings:[],shakeTime:0,shakePower:0,phase:0,shakeX:0,shakeY:0};
    let seed=3107;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
    function setReduced(value){state.reduced=Boolean(value);if(state.reduced){state.particles=[];state.rings=[];state.shakeTime=0;state.shakePower=0;state.shakeX=0;state.shakeY=0;}}
    function burst(x,y,count,color){if(state.reduced)return;for(let i=0;i<count&&state.particles.length<96;i++){const angle=random()*Math.PI*2,speed=45+random()*130;state.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life:.3+random()*.25,color});}}
    function shake(power,time){if(state.reduced)return;state.shakePower=Math.max(state.shakePower,power);state.shakeTime=Math.max(state.shakeTime,time);}
    function handle(e){
      if(e.type==='goal'){
        state.labels.push({x:Math.max(62,Math.min(898,e.x)),y:Math.max(48,Math.min(592,e.y)),points:e.points,age:0,life:1});
        burst(e.x,e.y,14,'#afff70');shake(2.8,.18);
      }else if(e.type==='bump'&&e.strength>.28){burst(e.x,e.y,5,'#ffd48b');if(e.strength>.5)shake(Math.min(4,e.strength*4),.13);}
      else if(e.type==='player-wall'&&e.strength>.45){burst(e.x,e.y,4,'#8be8eb');shake(e.strength*3,.12);}
      else if(e.type==='boost'&&!state.reduced)state.rings.push({x:e.x,y:e.y,age:0,life:.3});
      if(state.labels.length>8)state.labels.shift();if(state.rings.length>4)state.rings.shift();
    }
    function tick(dt){
      for(const list of[state.particles,state.labels,state.rings])for(const item of list){item.age+=dt;if(list===state.particles){item.x+=item.vx*dt;item.y+=item.vy*dt;}}
      state.particles=state.particles.filter(p=>p.age<p.life);state.labels=state.labels.filter(p=>p.age<p.life);state.rings=state.rings.filter(p=>p.age<p.life);
      state.shakeTime=Math.max(0,state.shakeTime-dt);state.phase+=dt;
      const amount=state.reduced?0:state.shakePower*Math.min(1,state.shakeTime/.18);
      state.shakeX=amount?Math.sin(state.phase*67)*amount:0;state.shakeY=amount?Math.cos(state.phase*53)*amount:0;
      if(!state.shakeTime)state.shakePower=0;
    }
    return {state,handle,tick,setReduced};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={createFeedback};else root.ReboundFeedback={createFeedback};
})(globalThis);
