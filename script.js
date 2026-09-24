const moon = document.getElementById("moon");
let clicks = 0;

moon.addEventListener("click", () => {
  clicks++;
  moon.classList.remove("grow1","grow2","grow3");
  moon.classList.add("grow" + Math.min(clicks, 3));
  if (clicks >= 3) setTimeout(showDinoGame, 500);
});

function showDinoGame(){
  if(document.getElementById("dinoGame")) return;

  const game = document.createElement("div");
  game.id = "dinoGame";
  game.innerHTML = `
    <div class="gameSky"></div>
    <div class="gameMoon"></div>
    <div class="gameClouds"></div>
    <div class="gameHud">
      <span>HI <b id="hiScore">00000</b></span>
      <span>SCORE <b id="score">00000</b></span>
      <span>🥮 <b id="cakeScore">00</b></span>
    </div>
    <canvas id="gameCanvas" aria-label="中秋小恐龙跑酷游戏"></canvas>
    <div class="gameStart">点击 / 空格 / ↑ 开始</div>
    <div class="gameTip">跳跃躲避仙人掌和飞鸟 · 吃月饼 +25 分</div>
  `;
  document.body.appendChild(game);
  requestAnimationFrame(() => game.classList.add("show"));
  startDinoGame();
}

function startDinoGame(){
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const hiEl = document.getElementById("hiScore");
  const cakeEl = document.getElementById("cakeScore");
  const startEl = document.querySelector(".gameStart");

  let dpr=1,w=0,h=0,ground=0;
  let dino, obstacles=[], cakes=[], clouds=[];
  let score=0, cakeScore=0, best=Number(localStorage.getItem("midAutumnDinoBest")||0);
  let running=false, gameOver=false, last=0, raf=0, elapsed=0;
  const BEST_KEY="midAutumnDinoBest";

  function resize(){
    const r=canvas.getBoundingClientRect();
    w=Math.max(320,r.width); h=Math.max(260,r.height);
    dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.floor(w*dpr);
    canvas.height=Math.floor(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ground=h-92;
    if(dino && !running){
      dino.y=ground-dino.h;
    }
  }

  function reset(){
    obstacles=[]; cakes=[]; clouds=[];
    score=0; cakeScore=0; elapsed=0; gameOver=false; running=false;
    dino={x:58,y:ground-54,w:46,h:54,vy:0,duck:false,leg:0};
    for(let i=0;i<6;i++) clouds.push({
      x:i*250+90,y:75+(i%3)*55,s:.75+(i%2)*.18
    });
    scoreEl.textContent="00000";
    cakeEl.textContent="00";
    hiEl.textContent=String(best).padStart(5,"0");
    startEl.textContent="点击 / 空格 / ↑ 开始";
    startEl.classList.remove("hide");
  }

  function begin(){
    if(gameOver){ reset(); }
    if(!running){
      running=true;
      startEl.classList.add("hide");
      last=performance.now();
      requestAnimationFrame(loop);
    }
  }

  function jump(){
    if(gameOver){ reset(); begin(); return; }
    begin();
    if(dino.y>=ground-dino.h-3) dino.vy=-735;
  }

  function setDuck(v){
    if(!running || gameOver) return;
    dino.duck=v;
    if(v && dino.y>=ground-dino.h-3) dino.y=ground-40;
  }

  addEventListener("keydown",e=>{
    if(e.code==="Space"||e.code==="ArrowUp"){
      e.preventDefault(); jump();
    }
    if(e.code==="ArrowDown"){
      e.preventDefault(); setDuck(true);
    }
  });
  addEventListener("keyup",e=>{
    if(e.code==="ArrowDown") setDuck(false);
  });
  canvas.addEventListener("pointerdown",jump);
  canvas.addEventListener("pointermove",e=>{
    if(e.buttons) setDuck(e.clientY>innerHeight*.72);
  });
  addEventListener("resize",resize);

  function drawDino(){
    const x=Math.round(dino.x), y=Math.round(dino.y);
    const bob=Math.sin(dino.leg)*1.5;
    ctx.save();
    ctx.translate(x,y+bob);
    ctx.fillStyle="#202020";

    if(dino.duck){
      // 更接近 Chrome 小恐龙的低头跑姿
      ctx.fillRect(5,18,34,18);
      ctx.fillRect(31,9,19,18);
      ctx.fillRect(0,24,10,10);
      ctx.fillRect(10,36,8,7);
      ctx.fillRect(32,36,8,7);
      ctx.fillRect(43,12,5,5);
      ctx.fillStyle="#f7f7f7";
      ctx.fillRect(44,12,3,3);
    }else{
      ctx.fillRect(11,13,28,31);
      ctx.fillRect(29,4,18,27);
      ctx.fillRect(3,23,10,10);
      ctx.fillRect(14,43,8,11);
      ctx.fillRect(32,43,8,11);
      ctx.fillRect(2,31,7,5);
      ctx.fillStyle="#f7f7f7";
      ctx.fillRect(40,10,4,4);
      ctx.fillStyle="#202020";
      ctx.fillRect(44,19,8,4);
      // 身体像素细节
      ctx.fillRect(19,18,4,4);
      ctx.fillRect(27,25,5,4);
    }
    ctx.restore();
  }

  function drawCactus(o){
    ctx.fillStyle="#2d4a30";
    const x=Math.round(o.x), y=Math.round(o.y);
    ctx.fillRect(x,y,o.w,o.h);
    ctx.fillRect(x-7,y+16,7,22);
    ctx.fillRect(x-11,y+16,11,7);
    if(o.big){
      ctx.fillRect(x+o.w,y+25,7,24);
      ctx.fillRect(x+o.w,y+25,11,7);
    }
  }

  function drawBird(o){
    ctx.fillStyle="#292929";
    const flap=Math.sin(elapsed*14)>0?0:4;
    ctx.fillRect(o.x,o.y+7,26,5);
    ctx.fillRect(o.x+8,o.y+2-flap,9,5);
    ctx.fillRect(o.x+18,o.y+11+flap,9,5);
    ctx.fillRect(o.x+24,o.y+7,8,4);
  }

  function drawMooncake(c){
    const cx=c.x+15, cy=c.y+15;
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(Math.sin(c.spin)*.08);
    ctx.shadowColor="#ffd86a"; ctx.shadowBlur=13;
    ctx.fillStyle="#e8ad45";
    ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.strokeStyle="#fff0b0"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle="#8a5828";
    ctx.font="bold 11px serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("月",0,1);
    ctx.restore();
  }

  function hit(a,b,p=5){
    return a.x+p<b.x+b.w-p && a.x+a.w-p>b.x+p &&
           a.y+p<b.y+b.h-p && a.y+a.h-p>b.y+p;
  }

  function spawn(){
    const speed=330+Math.min(score*1.8,280);
    const lastO=obstacles[obstacles.length-1];
    if(!lastO || lastO.x<w-300-Math.random()*230){
      const big=Math.random()<.38;
      const hh=big?58:42+Math.random()*18;
      obstacles.push({
        x:w+35,y:ground-hh,w:big?34:25,h:hh,big,kind:"cactus"
      });
    }

    if(score>100 && Math.random()<.014){
      const heights=[ground-112,ground-155,ground-82];
      const yy=heights[Math.floor(Math.random()*heights.length)];
      obstacles.push({x:w+40,y:yy,w:32,h:20,kind:"bird"});
    }

    const lastC=cakes[cakes.length-1];
    if(!lastC || lastC.x<w-230-Math.random()*300){
      cakes.push({
        x:w+100+Math.random()*220,
        y:ground-85-Math.random()*135,
        w:30,h:30,spin:Math.random()*6
      });
    }
  }

  function update(dt){
    elapsed+=dt;
    dino.leg+=dt*14;

    const dh=dino.duck?40:54;
    dino.vy+=2050*dt;
    dino.y+=dino.vy*dt;
    if(dino.y>ground-dh){dino.y=ground-dh;dino.vy=0}

    const speed=330+Math.min(score*1.8,280);
    obstacles.forEach(o=>o.x-=speed*dt);
    cakes.forEach(c=>{c.x-=speed*dt;c.spin+=dt*5});
    clouds.forEach(c=>{
      c.x-=speed*.09*dt;
      if(c.x<-120)c.x=w+120;
    });

    obstacles=obstacles.filter(o=>o.x>-90);
    cakes=cakes.filter(c=>c.x>-70);

    for(const o of obstacles){
      const box={x:o.x,y:o.y,w:o.w,h:o.h};
      if(hit(dino,box,dino.duck?4:6)){
        gameOver=true; running=false; startEl.textContent="GAME OVER · 点击 / 空格重新开始"; startEl.classList.remove("hide"); break;
      }
    }

    cakes=cakes.filter(c=>{
      if(hit(dino,c,0)){
        cakeScore++;
        score+=25;
        cakeEl.textContent=String(cakeScore).padStart(2,"0");
        return false;
      }
      return true;
    });

    score+=dt*10;
    const shown=Math.floor(score);
    scoreEl.textContent=String(shown).padStart(5,"0");
    if(shown>best){
      best=shown;
      localStorage.setItem(BEST_KEY,String(best));
      hiEl.textContent=String(best).padStart(5,"0");
    }
    spawn();
  }

  function drawSky(){
    const g=ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,"#071329");
    g.addColorStop(.52,"#101f3f");
    g.addColorStop(1,"#2c3150");
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);

    // 星星
    ctx.fillStyle="rgba(255,255,255,.75)";
    for(let i=0;i<55;i++){
      const x=(i*173)%w, y=25+((i*97)%Math.max(100,ground-140));
      ctx.fillRect(x,y,2,2);
    }

    clouds.forEach(c=>{
      ctx.fillStyle="rgba(245,241,221,.23)";
      ctx.beginPath();
      ctx.arc(c.x,c.y,15*c.s,0,Math.PI*2);
      ctx.arc(c.x+20*c.s,c.y-7*c.s,20*c.s,0,Math.PI*2);
      ctx.arc(c.x+44*c.s,c.y,14*c.s,0,Math.PI*2);
      ctx.fill();
      ctx.fillRect(c.x-5*c.s,c.y,55*c.s,8*c.s);
    });
  }

  function drawGround(){
    ctx.fillStyle="#eee9d4";
    ctx.fillRect(0,ground,w,3);
    ctx.fillStyle="#8d8d82";
    ctx.fillRect(0,ground+3,w,2);

    const off=(elapsed*speedForGround())%48;
    ctx.fillStyle="#77776f";
    for(let x=-off;x<w;x+=48){
      ctx.fillRect(x,ground+16,24,2);
      ctx.fillRect(x+31,ground+10,9,2);
    }
  }

  function speedForGround(){ return 330+Math.min(score*1.8,280); }

  function draw(){
    ctx.clearRect(0,0,w,h);
    drawSky();
    cakes.forEach(drawMooncake);
    obstacles.forEach(o=>o.kind==="bird"?drawBird(o):drawCactus(o));
    drawGround();
    drawDino();

    if(gameOver){
      ctx.fillStyle="rgba(255,255,255,.08)";
      ctx.fillRect(0,0,w,h);
    }
  }

  function loop(now){
    if(!running) { draw(); return; }
    const dt=Math.min((now-last)/1000,.035);
    last=now;
    update(dt);
    draw();
    raf=requestAnimationFrame(loop);
  }

  resize();
  reset();
  draw();
}
