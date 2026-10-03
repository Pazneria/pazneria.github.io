(function (root) {
  'use strict';
  root.createReboundInput = function (onAction) {
    const keys = new Set();
    const directions = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
    const handled = new Set([...directions,'Space','KeyR','Escape','Enter']);
    const stick=document.getElementById('stick'), pad=document.getElementById('joystick');
    let touchX=0, touchY=0, touchPointer=null, boostPointer=null, boostQueued=false;
    function clear() {
      keys.clear(); touchX=0; touchY=0; boostQueued=false;
      if (touchPointer!==null && pad.hasPointerCapture(touchPointer)) pad.releasePointerCapture(touchPointer);
      const boost=document.getElementById('boost');
      if (boostPointer!==null && boost.hasPointerCapture(boostPointer)) boost.releasePointerCapture(boostPointer);
      touchPointer=null; boostPointer=null; stick.style.transform='';
    }
    window.addEventListener('keydown', e => {
      if (!handled.has(e.code) || e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.code==='Space'||e.code==='Enter') && e.target.closest?.('button,input,select')) return;
      e.preventDefault();
      if (e.repeat) return;
      if (directions.has(e.code)) keys.add(e.code);
      else if (e.code==='Space') boostQueued=true;
      else onAction(e.code==='KeyR'?'restart':e.code==='Escape'?'pause':'start');
    });
    window.addEventListener('keyup', e => { keys.delete(e.code); });
    window.addEventListener('blur', () => { clear(); onAction('background'); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { clear(); onAction('background'); } });
    window.addEventListener('pagehide', () => { clear(); onAction('background'); });
    function moveStick(e) {
      const rect=pad.getBoundingClientRect(), radius=rect.width*0.36;
      let x=(e.clientX-(rect.left+rect.width/2))/radius, y=(e.clientY-(rect.top+rect.height/2))/radius;
      const length=Math.hypot(x,y);
      if (length>1) {x/=length;y/=length;}
      touchX=x;touchY=y;stick.style.transform=`translate(${x*radius}px,${y*radius}px)`;
    }
    pad.addEventListener('pointerdown',e=>{
      if (touchPointer!==null) return;
      e.preventDefault(); touchPointer=e.pointerId; pad.setPointerCapture(e.pointerId); moveStick(e);
    });
    pad.addEventListener('pointermove',e=>{if(e.pointerId===touchPointer)moveStick(e);});
    function releaseStick(e) { if(e.pointerId!==touchPointer)return;touchPointer=null;touchX=0;touchY=0;stick.style.transform=''; }
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>pad.addEventListener(type,releaseStick));
    const boost=document.getElementById('boost');
    boost.addEventListener('pointerdown',e=>{
      if(boostPointer!==null)return;e.preventDefault();boostPointer=e.pointerId;boost.setPointerCapture(e.pointerId);boostQueued=true;
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>boost.addEventListener(type,e=>{if(e.pointerId===boostPointer)boostPointer=null;}));
    document.getElementById('pause').addEventListener('click',()=>onAction('pause'));
    document.getElementById('restart').addEventListener('click',()=>onAction('restart'));
    document.getElementById('start').addEventListener('click',()=>onAction('start'));
    return {
      clear,
      sample() {
        let x=touchX+Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
        let y=touchY+Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
        const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
        const boost=boostQueued;boostQueued=false;return {x,y,boost};
      }
    };
  };
})(globalThis);
