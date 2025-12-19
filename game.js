/**********************
 CONFIGURAÇÃO GERAL
**********************/
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const WS_URL = "wss://rpg-multiplayer-server.onrender.com"; // TROQUE
const socket = new WebSocket(WS_URL);

let myId = null;
let players = {};
let keys = {};
let myPlayer = null;

/**********************
 CLASSES (ORIGINAIS)
**********************/
const CLASSES = {
  "Shadow Hunter": { hp: 120, atk: 18, spd: 3 },
  "Arc Mage": { hp: 80, atk: 30, spd: 2 },
  "Iron Guardian": { hp: 180, atk: 12, spd: 1.8 }
};

/**********************
 INPUT PC
**********************/
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

/**********************
 BOTÕES MOBILE
**********************/
const mobile = {
  up:false, down:false, left:false, right:false
};

function createButton(txt, x, y, prop){
  const b = document.createElement("button");
  b.innerText = txt;
  b.style.position = "fixed";
  b.style.left = x+"px";
  b.style.top = y+"px";
  b.style.opacity = 0.6;
  b.onpointerdown = ()=> mobile[prop]=true;
  b.onpointerup = ()=> mobile[prop]=false;
  document.body.appendChild(b);
}

createButton("↑", 60, window.innerHeight-160, "up");
createButton("↓", 60, window.innerHeight-80, "down");
createButton("←", 10, window.innerHeight-120, "left");
createButton("→", 110, window.innerHeight-120, "right");

/**********************
 CONEXÃO SERVIDOR
**********************/
socket.onmessage = e => {
  const data = JSON.parse(e.data);

  if(data.init){
    myId = data.id;
    players = data.players;
    myPlayer = players[myId];
  }

  if(data.update){
    players = data.players;
  }

  if(data.admin !== undefined){
    myPlayer.admin = data.admin;
  }
};

/**********************
 MOVIMENTO
**********************/
function movePlayer(){
  if(!myPlayer) return;

  let dx = 0, dy = 0;

  if(keys["w"] || mobile.up) dy--;
  if(keys["s"] || mobile.down) dy++;
  if(keys["a"] || mobile.left) dx--;
  if(keys["d"] || mobile.right) dx++;

  const len = Math.hypot(dx,dy);
  if(len>0){
    dx/=len; dy/=len;
  }

  myPlayer.x += dx * myPlayer.spd;
  myPlayer.y += dy * myPlayer.spd;
}

/**********************
 COMBATE
**********************/
function attack(){
  if(!myPlayer) return;
  if(!keys[" "] ) return;

  for(let id in players){
    if(id === myId) continue;
    const p = players[id];
    const d = Math.hypot(myPlayer.x-p.x, myPlayer.y-p.y);
    if(d < 40){
      p.hp -= myPlayer.atk;
      if(p.hp <= 0){
        myPlayer.exp += 50;
        p.hp = p.maxHp;
        p.x = Math.random()*canvas.width;
        p.y = Math.random()*canvas.height;
      }
    }
  }
}

/**********************
 LEVEL UP
**********************/
function levelUp(){
  if(myPlayer.exp >= myPlayer.level*100){
    myPlayer.exp = 0;
    myPlayer.level++;
    myPlayer.maxHp += 10;
    myPlayer.atk += 2;
    myPlayer.hp = myPlayer.maxHp;
  }
}

/**********************
 ADM
**********************/
function adminPowers(){
  if(!myPlayer.admin) return;

  if(keys["k"]){
    myPlayer.atk = 999;
  }
  if(keys["l"]){
    myPlayer.level = 99;
  }
}

/**********************
 UPDATE
**********************/
function update(){
  movePlayer();
  attack();
  levelUp();
  adminPowers();

  socket.send(JSON.stringify({
    type:"update",
    player:myPlayer
  }));
}

/**********************
 DRAW
**********************/
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(let id in players){
    const p = players[id];
    ctx.fillStyle = (id===myId) ? "cyan" : "red";
    ctx.fillRect(p.x, p.y, 30, 30);

    ctx.fillStyle = "white";
    ctx.fillText(
      `Lv${p.level}`,
      p.x,
      p.y-5
    );
  }

  if(myPlayer){
    ctx.fillText(`HP: ${myPlayer.hp}`, 10,20);
    ctx.fillText(`LV: ${myPlayer.level}`, 10,40);
    if(myPlayer.admin){
      ctx.fillText("ADM", 10,60);
    }
  }
}

/**********************
 LOOP
**********************/
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
