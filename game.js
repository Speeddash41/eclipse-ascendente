/*********************************
 CONFIG GERAL
*********************************/
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const WS_URL = "wss://SEU_SERVIDOR_RENDER.onrender.com";
const ws = new WebSocket(WS_URL);

let myId = null;
let players = {};
let monsters = {};
let keys = {};
let mobile = { up:false,down:false,left:false,right:false,atk:false };
let myPlayer = null;

/*********************************
 INPUT PC
*********************************/
addEventListener("keydown", e=> keys[e.key]=true);
addEventListener("keyup", e=> keys[e.key]=false);

/*********************************
 INPUT MOBILE
*********************************/
function btn(t,x,y,p){
  let b=document.createElement("button");
  b.innerText=t;
  b.style.position="fixed";
  b.style.left=x+"px";
  b.style.top=y+"px";
  b.style.opacity=0.6;
  b.onpointerdown=()=>mobile[p]=true;
  b.onpointerup=()=>mobile[p]=false;
  document.body.appendChild(b);
}
btn("↑",60,innerHeight-170,"up");
btn("↓",60,innerHeight-90,"down");
btn("←",10,innerHeight-130,"left");
btn("→",110,innerHeight-130,"right");
btn("⚔",innerWidth-90,innerHeight-120,"atk");

/*********************************
 CLASSES (ORIGINAIS)
*********************************/
const CLASSES={
  "Void Blade":{hp:120,atk:18,spd:3,skill:"dash"},
  "Aether Mage":{hp:80,atk:30,spd:2,skill:"blast"},
  "Stone Warden":{hp:180,atk:12,spd:1.8,skill:"shield"}
};

/*********************************
 CONEXÃO SERVIDOR
*********************************/
ws.onmessage=e=>{
  const d=JSON.parse(e.data);

  if(d.init){
    myId=d.id;
    players=d.players;
    monsters=d.monsters;
    myPlayer=players[myId];
  }
  if(d.sync){
    players=d.players;
    monsters=d.monsters;
  }
};

/*********************************
 MOVIMENTO
*********************************/
function move(){
  if(!myPlayer) return;
  let dx=0,dy=0;
  if(keys.w||mobile.up)dy--;
  if(keys.s||mobile.down)dy++;
  if(keys.a||mobile.left)dx--;
  if(keys.d||mobile.right)dx++;
  let l=Math.hypot(dx,dy);
  if(l){dx/=l;dy/=l;}
  myPlayer.x+=dx*myPlayer.spd;
  myPlayer.y+=dy*myPlayer.spd;
}

/*********************************
 ATAQUE
*********************************/
function attack(){
  if(!myPlayer) return;
  if(!keys[" "]&&!mobile.atk) return;

  for(let i in monsters){
    let m=monsters[i];
    let d=Math.hypot(myPlayer.x-m.x,myPlayer.y-m.y);
    if(d<40 && m.hp>0){
      m.hp-=myPlayer.atk;
      if(m.hp<=0){
        myPlayer.exp+=m.exp;
        myPlayer.gold+=m.gold;
      }
    }
  }
}

/*********************************
 SKILLS
*********************************/
function skill(){
  if(!myPlayer) return;
  if(!keys["e"]) return;

  if(myPlayer.class==="Void Blade"){
    myPlayer.x+=Math.cos(myPlayer.dir)*120;
    myPlayer.y+=Math.sin(myPlayer.dir)*120;
  }
  if(myPlayer.class==="Aether Mage"){
    myPlayer.atk+=20;
    setTimeout(()=>myPlayer.atk-=20,2000);
  }
  if(myPlayer.class==="Stone Warden"){
    myPlayer.def=999;
    setTimeout(()=>myPlayer.def=0,3000);
  }
}

/*********************************
 LEVEL UP (SOLO STYLE)
*********************************/
function levelUp(){
  if(myPlayer.exp>=myPlayer.level*100){
    myPlayer.exp=0;
    myPlayer.level++;
    myPlayer.maxHp+=15;
    myPlayer.atk+=3;
    myPlayer.hp=myPlayer.maxHp;
  }
}

/*********************************
 SISTEMA ADM
*********************************/
function admin(){
  if(!myPlayer.admin) return;
  if(keys.k) myPlayer.atk=999;
  if(keys.l) myPlayer.level=99;
  if(keys.i) myPlayer.inv.push("Item ADM");
}

/*********************************
 UPDATE
*********************************/
function update(){
  move();
  attack();
  skill();
  levelUp();
  admin();

  ws.send(JSON.stringify({
    type:"update",
    player:myPlayer
  }));
}

/*********************************
 DRAW
*********************************/
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(let i in monsters){
    let m=monsters[i];
    if(m.hp<=0) continue;
    ctx.fillStyle="purple";
    ctx.fillRect(m.x,m.y,28,28);
  }

  for(let i in players){
    let p=players[i];
    ctx.fillStyle=i===myId?"cyan":"red";
    ctx.fillRect(p.x,p.y,30,30);
    ctx.fillStyle="#fff";
    ctx.fillText(`Lv${p.level}`,p.x,p.y-4);
  }

  if(myPlayer){
    ctx.fillText(`HP ${myPlayer.hp}/${myPlayer.maxHp}`,10,20);
    ctx.fillText(`LV ${myPlayer.level}`,10,40);
    ctx.fillText(`EXP ${myPlayer.exp}`,10,60);
    ctx.fillText(`Gold ${myPlayer.gold}`,10,80);
    if(myPlayer.admin) ctx.fillText("ADM",10,100);
  }
}

/*********************************
 LOOP
*********************************/
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
