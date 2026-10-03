/* Focused browser regression checks. Uses one installed, isolated headless Chromium. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),baseline=process.argv.includes('--record-baseline');
const out=path.resolve(process.env.REBOUND_CHECK_OUTPUT||path.join(os.tmpdir(),'rebound-relay-presentation-check'));
fs.mkdirSync(out,{recursive:true});
const browser=process.env.REBOUND_BROWSER||path.join(process.env.LOCALAPPDATA||'','ms-playwright','chromium_headless_shell-1217','chrome-headless-shell-win64','chrome-headless-shell.exe');
assert.ok(fs.existsSync(browser),'Set REBOUND_BROWSER to an installed Chromium executable.');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'rebound-presentation-'));
const child=spawn(browser,['--headless','--disable-gpu','--disable-background-networking','--disable-extensions','--no-first-run','--no-default-browser-check','--mute-audio','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
let stderr='',socket,nextId=1;child.stderr.on('data',d=>stderr+=d);
const pending=new Map(),errors=[],checks=[],layouts=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function send(method,params={}){return new Promise((resolve,reject)=>{const id=nextId++,timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},10000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function shot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,name),Buffer.from(r.data,'base64'));}
async function viewport(width,height,touch=false){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:touch});await send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:5});await sleep(50);}
(async()=>{
  try{
    const active=path.join(profile,'DevToolsActivePort');
    for(let i=0;i<100&&!fs.existsSync(active);i++){if(child.exitCode!==null)throw new Error(stderr);await sleep(50);}
    assert.ok(fs.existsSync(active),'Browser startup timeout');
    const port=fs.readFileSync(active,'utf8').split(/\r?\n/)[0];
    const target=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
    socket=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
    await send('Page.enable');await send('Runtime.enable');await viewport(1280,900);
    const url=new URL(process.env.REBOUND_CHECK_URL||pathToFileURL(path.join(root,'index.html')).href);url.searchParams.set('test','1');
    await send('Page.navigate',{url:url.href});
    for(let i=0;i<100;i++){if(await evaluate('Boolean(window.reboundTest)'))break;await sleep(50);}
    assert.equal(await evaluate('Boolean(window.reboundTest)'),true);
    const sprites=await evaluate(`(()=>{
      const t=reboundTest,g=t.state,c=document.getElementById('arena'),ctx=c.getContext('2d');t.setReduced(true);g.status='ready';
      const pixel=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data),positions=[[180,160],[480,320],[780,480]],rows=[];
      for(const [x,y] of positions){
        Object.assign(g.player,{x:850,y:560});Object.assign(g.ball,{x:80,y:560});t.render(0);const background=pixel(x+20,y);
        Object.assign(g.ball,{x,y});t.render(0);const halo=pixel(x+20,y),ballTop=pixel(x-4,y-5),ballEdge=pixel(x+8,y);
        Object.assign(g.ball,{x:80,y:560});Object.assign(g.player,{x,y});g.facing={x:0,y:-1};t.render(0);
        const shellTop=pixel(x+10,y-4),shellBottom=pixel(x+10,y+8),visorTop=pixel(x,y-12),visorBottom=pixel(x,y-3);
        g.facing={x:1,y:0};t.render(0);const rotatedVisorTop=pixel(x+12,y),rotatedVisorBottom=pixel(x+3,y);
        rows.push({x,y,background,halo,haloDelta:halo.slice(0,3).reduce((a,v,i)=>a+Math.abs(v-background[i]),0),ballTop,ballEdge,shellTop,shellBottom,visorTop,visorBottom,rotatedVisorTop,rotatedVisorBottom});
      }
      Object.assign(g.ball,{x:600,y:320});Object.assign(g.player,{x:400,y:320});g.facing={x:0,y:-1};t.render(0);
      return rows;
    })()`);
    const distance=(a,b)=>a.slice(0,3).reduce((sum,v,i)=>sum+Math.abs(v-b[i]),0);
    for(const row of sprites){
      assert.ok(row.haloDelta>10,'Halo must be visible away from origin: '+JSON.stringify(row));
      assert.ok(distance(row.ballTop,row.ballEdge)>40,'Ball shading must vary');
      assert.ok(distance(row.shellTop,row.shellBottom)>20,'Shell shading must vary');
      assert.ok(distance(row.visorTop,row.visorBottom)>30,'Visor shading must vary');
      assert.ok(distance(row.rotatedVisorTop,row.rotatedVisorBottom)>30,'Rotated visor shading must vary');
      for(const name of ['ballTop','ballEdge','shellTop','shellBottom','visorTop','visorBottom','rotatedVisorTop','rotatedVisorBottom'])assert.ok(row[name].every((v,i)=>Math.abs(v-sprites[0][name][i])<=2),'Shading should follow sprite position (2/255 raster rounding tolerance): '+name);
    }
    checks.push('Actual ball halo/body and player shell/visor keep their shading at three distant positions and after rotation');
    await shot('sprites.png');
    for(const [width,height,touch] of [[1280,360,false],[1280,390,false],[1280,420,false],[1280,421,false],[1280,480,false],[1280,600,false],[1280,720,false],[1280,900,false],[721,390,false],[721,420,false],[844,390,true],[390,844,true],[320,740,true]]){
      await viewport(width,height,touch);await evaluate('reboundTest.ready("normal");window.scrollTo(0,0)');
      const r=await evaluate(`(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();return {width:innerWidth,height:innerHeight,fine:matchMedia('(pointer: fine)').matches,arena:rect('#arena'),bezel:rect('.arena-wrap'),panel:rect('.panel'),start:rect('#start'),guide:rect('#guide'),scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight};})()`);
      layouts.push(r);
      if(!baseline){
        assert.equal(r.fine,!touch);
        assert.ok(r.arena.width>=250&&r.arena.height>=160,'Arena collapsed: '+JSON.stringify(r));
        assert.ok(r.scrollWidth<=width,'Horizontal overflow: '+JSON.stringify(r));
        assert.ok(r.panel.left>=r.arena.left&&r.panel.right<=r.arena.right&&r.panel.top>=r.arena.top&&r.panel.bottom<=r.arena.bottom,'Menu clipped: '+JSON.stringify(r));
        await evaluate('document.getElementById("start").scrollIntoView({block:"center"})');
        const b=await evaluate(`(()=>{const r=document.getElementById('start').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')?.id}})()`);
        assert.equal(b.hit,'start','Start is not reachable');
        await send('Input.dispatchMouseEvent',{type:'mousePressed',x:b.x,y:b.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:b.x,y:b.y,button:'left',clickCount:1});
        assert.equal(await evaluate('reboundTest.state.status'),'running');
        await evaluate('reboundTest.action("pause")');
        const t=await evaluate('reboundTest.state.time');await sleep(30);assert.equal(await evaluate('reboundTest.state.time'),t);
        checks.push(width+'x'+height+' '+(touch?'touch':'fine pointer')+' arena/menu and reachable Start/pause');
      }
      if(width===1280&&height===390)await shot('short-desktop.png');
    }
    assert.equal(errors.length,0,JSON.stringify(errors));
    const result={status:baseline?'baseline recorded':'passed',checks,passed:checks.length,sprites,layouts,runtimeExceptions:errors.length,url:url.href,mode:'One isolated hidden Chromium; user browser untouched.',limits:['Chromium emulation, not physical-device or all-engine verification.','Pixel checks sample actual rendered sprites, not just gradient construction.']};
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2)+'\n');
    fs.rmSync(path.join(out,'failure.txt'),{force:true});
    console.log(JSON.stringify({status:result.status,passed:result.passed,haloDeltas:sprites.map(s=>s.haloDelta),shortViewports:layouts.filter(r=>r.fine&&r.height<=420).map(r=>({width:r.width,height:r.height,arenaWidth:r.arena.width,arenaHeight:r.arena.height})),runtimeExceptions:errors.length}));
  }catch(e){console.error(e.stack);fs.writeFileSync(path.join(out,'failure.txt'),e.stack+'\n');process.exitCode=1;}
  finally{for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('Test ended'));}pending.clear();if(socket)socket.close();child.kill();await sleep(200);if(path.dirname(profile)===path.resolve(os.tmpdir())&&path.basename(profile).startsWith('rebound-presentation-'))fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});}
})();
