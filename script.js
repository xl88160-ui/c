const moon=document.getElementById("moon");
let clicks=0;

moon.addEventListener("click",()=>{
  clicks++;
  moon.classList.remove("grow1","grow2","grow3");
  moon.classList.add("grow"+Math.min(clicks,3));
  if(clicks>=3) setTimeout(showDinoGame,650);
});

function showDinoGame(){
  if(document.getElementById("dinoGame")) return;
  const game=document.createElement("div");
  game.id="dinoGame";
  game.innerHTML=`
    <div class="gameMoon"></div>
    <div class="gameStars"></div>
    <div class="gameHud">
      <span>HI <b id="hiScore">00000</b></span>
      <span>SCORE <b id="score">00000</b></span>
      <span>🥮 <b id="cakeScore">00</b></span>
    </div>
    <div class="gameTip">空格 / ↑ / 点击屏幕跳跃　·　吃月饼得分　·　撞到障碍结束</div>
    <canvas id="gameCanvas"></canvas>`;
  document.body.appendChild(game);
  requestAnimationFrame(()=>game.classList.add("show"));
  startDinoGame();
}

function startDinoGame(){
  const canvas=document.getElementById("gameCanvas");
  const ctx=canvas.getContext("2d");
  const scoreEl=document.getElementById("score");
  const hiEl=document.getElementById("hiScore");
  const cakeEl=document.getElementById("cakeScore");

  let dpr=1,w=0,h=0,ground=0,dino,obstacles,cakes,clouds,score,cakeScore,gameOver,last,raf;
  const BEST_KEY="midAutumnDinoBest";
  let best=Number(localStorage.getItem(BEST_KEY)||0);

  function resize(){
    const r=canvas.getBoundingClientRect();
    w=Math.max(320,r.width); h=Math.max(260,r.height);
    dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.floor(w*dpr); canvas.height=Math.floor(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ground=h-72;
  }
  function reset(){
    obstacles=[];cakes=[];clouds=[];score=0;cakeScore=0;gameOver=false;
    last=performance.now();
    dino={x:58,y:ground-48,w:44,h:48,vy:0,duck:false,frame:0};
    for(let i=0;i<5;i++) clouds.push({x:i*230+80,y:55+(i%3)*42,s:0.65+(i%3)*0.12});
    scoreEl.textContent="00000";cakeEl.textContent="00";hiEl.textContent=String(best).padStart(5,"0");
  }

  function jump(){
    if(gameOver){reset();return}
    if(dino.y>=ground-dino.h-2){dino.vy=-710}
  }
  function duck(on){dino.duck=on && !gameOver}

  addEventListener("keydown",e=>{
    if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();jump()}
    if(e.code==="ArrowDown"){e.preventDefault();duck(true)}
  });
  addEventListener("keyup",e=>{if(e.code==="ArrowDown")duck(false)});
  canvas.addEventListener("pointerdown",jump);
  resize();addEventListener("resize",resize);
  reset();

  function roundRect(x,y,ww,hh,r){
    ctx.beginPath();ctx.roundRect(x,y,ww,hh,r);ctx.fill();
  }

  function drawMoon(){
    const r=Math.min(105,w*.13);
    const x=w-r-55,y=90;
    ctx.save();
    ctx.shadowColor="#ffd45a";ctx.shadowBlur=55;
    ctx.fillStyle="#ffe59a";ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle="#d9b85f";
    [[-.3,-.2,.14],[.2,-.35,.1],[-.28,.32,.12],[.28,.2,.16],[.05,.08,.08]].forEach(([dx,dy,rr])=>{
      ctx.beginPath();ctx.arc(x+dx*r*2,y+dy*r*2,rr*r,0,Math.PI*2);ctx.fill();
    });
    ctx.restore();
  }

  function drawCloud(c){
    ctx.fillStyle="#fff1c255";
    ctx.beginPath();ctx.arc(c.x,c.y,16*c.s,0,Math.PI*2);ctx.arc(c.x+22*c.s,c.y-7*c.s,21*c.s,0,Math.PI*2);ctx.arc(c.x+48*c.s,c.y,15*c.s,0,Math.PI*2);ctx.fill();
    ctx.fillRect(c.x-5*c.s,c.y,c.s*58,c.s*10);
  }

  function drawGround(){
    ctx.fillStyle="#f8e6b0";ctx.fillRect(0,ground,w,3);
    ctx.fillStyle="#d8b873";ctx.fillRect(0,ground+3,w,2);
    const off=(performance.now()/8)%32;
    ctx.fillStyle="#b88f4d";
    for(let x=-off;x<w;x+=32) ctx.fillRect(x,ground+14,18,2);
  }

  function drawDino(){
    const x=dino.x,y=dino.y;
    ctx.save();
    ctx.translate(Math.round(x),Math.round(y));
    ctx.fillStyle="#302b25";
    if(dino.duck){
      ctx.fillRect(5,22,34,17);ctx.fillRect(30,10,14,18);ctx.fillRect(0,26,10,8);
      ctx.fillRect(11,39,6,9);ctx.fillRect(31,39,6,9);
      ctx.fillStyle="#f6df9b";ctx.fillRect(36,14,4,4);
    }else{
      ctx.fillRect(10,13,27,28);ctx.fillRect(28,4,16,25);ctx.fillRect(2,21,10,10);
      ctx.fillRect(13,39,7,9);ctx.fillRect(31,39,7,9);
      ctx.fillStyle="#f6df9b";ctx.fillRect(37,10,4,4);ctx.fillRect(42,18,7,3);
    }
    ctx.restore();
  }

  function drawCactus(o){
    ctx.fillStyle="#314b2f";
    ctx.fillRect(o.x,o.y,o.w,o.h);
    if(o.type===1){
      ctx.fillRect(o.x-7,o.y+15,7,22);ctx.fillRect(o.x-11,o.y+15,11,7);
      ctx.fillRect(o.x+o.w,o.y+25,7,19);ctx.fillRect(o.x+o.w,o.y+25,11,7);
    }else{
      ctx.fillRect(o.x-7,o.y+22,7,18);ctx.fillRect(o.x-11,o.y+22,11,7);
    }
  }

  function drawBird(o){
    ctx.fillStyle="#4a3c32";
    ctx.fillRect(o.x,o.y+5,26,4);
    ctx.fillRect(o.x+7,o.y+1,7,4);
    ctx.fillRect(o.x+19,o.y+9,7,4);
  }

  function drawMooncake(c){
    const cx=c.x+c.w/2,cy=c.y+c.h/2;
    ctx.save();
    ctx.shadowColor="#ffd65c";ctx.shadowBlur=16;
    ctx.fillStyle="#f6bd45";
    ctx.beginPath();ctx.arc(cx,cy,c.w/2,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    ctx.strokeStyle="#fff0a6";ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(cx,cy,c.w*.34,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#8d5a25";ctx.font="bold 12px serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("月",cx,cy+1);
    ctx.restore();
  }

  function hit(a,b,pad=3){
    return a.x+pad<b.x+b.w-pad&&a.x+a.w-pad>b.x+pad&&a.y+pad<b.y+b.h-pad&&a.y+a.h-pad>b.y+pad;
  }

  function spawn(){
    const lastO=obstacles[obstacles.length-1];
    if(!lastO||lastO.x<w-260-Math.random()*160){
      const size=34+Math.random()*18;
      obstacles.push({x:w+30,y:ground-size,w:size*.55,h:size,type:Math.random()<.55?1:2,kind:"cactus"});
    }
    if(score>90 && Math.random()<.012){
      obstacles.push({x:w+30,y:ground-105-Math.random()*45,w:28,h:16,kind:"bird"});
    }
    const lastC=cakes[cakes.length-1];
    if(!lastC||lastC.x<w-170-Math.random()*220){
      cakes.push({x:w+90+Math.random()*180,y:ground-90-Math.random()*105,w:30,h:30,spin:0});
    }
  }

  function update(dt){
    dino.frame+=dt*12;
    dino.vy+=1900*dt;dino.y+=dino.vy*dt;
    const dh=dino.duck?38:48;
    if(dino.y>ground-dh){dino.y=ground-dh;dino.vy=0}
    const speed=300+Math.min(score*2.2,230);
    obstacles.forEach(o=>o.x-=speed*dt);
    cakes.forEach(c=>{c.x-=speed*dt;c.spin+=dt*5});
    clouds.forEach(c=>{c.x-=speed*.12*dt;if(c.x<-100)c.x=w+80});
    obstacles=obstacles.filter(o=>o.x>-80);
    cakes=cakes.filter(c=>c.x>-60);
    for(const o of obstacles) if(hit(dino,{x:o.x,y:o.y,w:o.w,h:o.h},5)){gameOver=true;break}
    cakes=cakes.filter(c=>{
      if(hit(dino,c,1)){cakeScore++;score+=25;cakeEl.textContent=String(cakeScore).padStart(2,"0");return false}
      return true;
    });
    score+=dt*10;
    const shown=Math.floor(score);
    scoreEl.textContent=String(shown).padStart(5,"0");
    if(shown>best){best=shown;localStorage.setItem(BEST_KEY,String(best));hiEl.textContent=String(best).padStart(5,"0")}
    spawn();
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    const g=ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,"#191a2e");g.addColorStop(.5,"#403c50");g.addColorStop(1,"#d4a85d");
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    drawMoon();
    clouds.forEach(drawCloud);
    cakes.forEach(drawMooncake);
    obstacles.forEach(o=>o.kind==="bird"?drawBird(o):drawCactus(o));
    drawGround();
    drawDino();
    if(gameOver){
      ctx.fillStyle="#19130c99";ctx.fillRect(0,0,w,h);
      ctx.fillStyle="#fff3c4";ctx.textAlign="center";
      ctx.font="bold 28px monospace";ctx.fillText("GAME OVER",w/2,h/2-8);
      ctx.font="14px Microsoft YaHei";ctx.fillText("点击屏幕重新开始",w/2,h/2+25);
      ctx.textAlign="left";
    }
  }

  function loop(now){
    const dt=Math.min((now-last)/1000,.035);last=now;
    if(!gameOver)update(dt);
    draw();
    raf=requestAnimationFrame(loop);
  }
  raf=requestAnimationFrame(loop);
}
