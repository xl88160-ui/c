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
    <div class="gameCard">
      <div class="gameTitle">🌕 中秋小恐龙 · 月下跑酷</div>
      <div class="gameScore">SCORE <span id="score">00000</span></div>
      <canvas id="gameCanvas"></canvas>
      <div class="gameTip">点击屏幕 / 空格键跳跃 · 撞到月饼就结束</div>
    </div>`;
  document.body.appendChild(game);
  requestAnimationFrame(()=>game.classList.add("show"));
  startDinoGame();
}

function startDinoGame(){
  const canvas=document.getElementById("gameCanvas");
  const ctx=canvas.getContext("2d");
  const scoreEl=document.getElementById("score");
  let dpr=Math.min(devicePixelRatio||1,2),w,h,ground,dino,obstacles,score,gameOver,last,raf;

  function resize(){
    const r=canvas.getBoundingClientRect();
    w=r.width;h=r.height;canvas.width=w*dpr;canvas.height=h*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);ground=h-62;
    if(!dino)dino={x:55,y:ground-46,vy:0,w:38,h:46};
  }
  resize();addEventListener("resize",resize);

  function reset(){
    obstacles=[];score=0;gameOver=false;last=performance.now();
    dino={x:55,y:ground-46,vy:0,w:38,h:46};
  }
  function jump(){
    if(gameOver){reset();return}
    if(dino.y>=ground-dino.h-1)dino.vy=-620;
  }
  addEventListener("keydown",e=>{if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();jump()}});
  canvas.addEventListener("pointerdown",jump);
  reset();

  function drawBackground(){
    ctx.clearRect(0,0,w,h);
    const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#17264c");g.addColorStop(1,"#070b18");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#ffffff99";
    for(let i=0;i<35;i++){const x=(i*83)%w,y=35+(i*47)%(ground-100);ctx.fillRect(x,y,1.5,1.5)}
    ctx.fillStyle="#dfe5d0";ctx.beginPath();ctx.ellipse(100,ground+12,115,28,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#b7c59f";ctx.fillRect(0,ground,w,4);
  }
  function drawDino(){
    const x=dino.x,y=dino.y;
    ctx.fillStyle="#f3f0d0";
    ctx.fillRect(x+9,y+12,25,25);ctx.fillRect(x+24,y+2,17,23);
    ctx.fillRect(x+1,y+20,10,8);ctx.fillRect(x+13,y+35,7,12);ctx.fillRect(x+29,y+35,7,12);
    ctx.fillStyle="#222";ctx.fillRect(x+34,y+8,4,4);ctx.fillRect(x+40,y+17,6,3);
  }
  function drawMooncake(o){
    ctx.fillStyle="#d7a84f";ctx.beginPath();ctx.roundRect(o.x,o.y,o.w,o.h,7);ctx.fill();
    ctx.fillStyle="#ffe39a";ctx.font="bold 12px serif";ctx.fillText("月",o.x+8,o.y+16);
  }
  function collide(a,b){
    return a.x+6<b.x+b.w-4&&a.x+a.w-4>b.x+4&&a.y+5<b.y+b.h&&a.y+a.h>b.y+3;
  }
  function loop(now){
    const dt=Math.min((now-last)/1000,.035);last=now;
    if(!gameOver){
      dino.vy+=1550*dt;dino.y+=dino.vy*dt;
      if(dino.y>ground-dino.h){dino.y=ground-dino.h;dino.vy=0}
      if(!obstacles.length||obstacles[obstacles.length-1].x<w-230){
        const size=28+Math.random()*10;obstacles.push({x:w+20,y:ground-size,w:size+8,h:size});
      }
      const speed=260+Math.min(score*.12,170);
      obstacles.forEach(o=>o.x-=speed*dt);
      obstacles=obstacles.filter(o=>o.x>-60);
      obstacles.forEach(o=>{if(collide(dino,o))gameOver=true});
      score+=dt*10;scoreEl.textContent=Math.floor(score).toString().padStart(5,"0");
    }
    drawBackground();obstacles.forEach(drawMooncake);drawDino();
    if(gameOver){
      ctx.fillStyle="#050814aa";ctx.fillRect(0,0,w,h);
      ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="bold 30px Microsoft YaHei";
      ctx.fillText("月饼撞到了！",w/2,h/2-12);ctx.font="15px Microsoft YaHei";
      ctx.fillText("点击屏幕重新开始",w/2,h/2+22);ctx.textAlign="left";
    }
    raf=requestAnimationFrame(loop);
  }
  raf=requestAnimationFrame(loop);
}
