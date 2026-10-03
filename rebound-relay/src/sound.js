(function(root){
  'use strict';
  root.createReboundSound=function(muted=false){
    let context=null,lastHit=-1;const voices=new Set();
    async function unlock(){
      if(muted)return;
      try{if(!context){const Audio=root.AudioContext||root.webkitAudioContext;if(Audio)context=new Audio();}if(context?.state==='suspended')await context.resume();}catch{context=null;}
    }
    function tone(frequency,duration=.07,delay=0,type='sine',volume=.035){
      if(muted||!context||context.state!=='running'||voices.size>=8)return;
      const now=context.currentTime+delay,osc=context.createOscillator(),gain=context.createGain();
      osc.type=type;osc.frequency.setValueAtTime(frequency,now);osc.frequency.exponentialRampToValueAtTime(Math.max(40,frequency*.8),now+duration);
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      osc.connect(gain);gain.connect(context.destination);voices.add(osc);osc.onended=()=>{osc.disconnect();gain.disconnect();voices.delete(osc);};osc.start(now);osc.stop(now+duration+.01);
    }
    function handle(e){
      if(muted||!context)return;
      if(e.type==='goal'){tone(523,.1,0,'triangle',.05);tone(659,.1,.07,'triangle',.045);tone(784,.14,.14,'triangle',.04);}
      else if(e.type==='boost')tone(190,.09,0,'triangle',.035);
      else if((e.type==='bump'||e.type==='player-wall')&&e.strength>.28&&context.currentTime-lastHit>.06){lastHit=context.currentTime;tone(100+e.strength*150,.06,0,'sine',.04);}
      else if(e.type==='bank'&&e.fresh)tone(330,.035,0,'sine',.018);
    }
    async function setMuted(value){muted=Boolean(value);if(muted&&context){for(const osc of voices){try{osc.stop(context.currentTime);}catch{}osc.disconnect();}voices.clear();if(context.state==='running')try{await context.suspend();}catch{}}else if(!muted)await unlock();}
    return {unlock,handle,setMuted,get muted(){return muted;},get state(){return context?.state||'uninitialized';}};
  };
})(globalThis);
