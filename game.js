/*********************************
 CONFIG
**********************************/
const SERVER_URL = "wss://rpg-multiplayer-server.onrender.com";
const socket = new WebSocket(SERVER_URL);

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 450;

/*********************************
 UTIL
**********************************/
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/*********************************
 JOGADOR / CLASSES
**********************************/
const CLASSES = {
  tank:   { maxHp: 180, speed: 2.5 },
  mage:  { maxHp: 100, speed: 3.0 },
  rogue: { maxHp: 120, speed: 3.8 }
};

let myPlayer = {
  x: 400, y: 300,
  hp: 120, maxHp: 120,
  level: 1, xp: 0,
  room: "lobby",
  cls: "rogue",
  name: "Player"
};

function applyClass(cls){
  myPlayer.cls = cls;
  myPlayer.maxHp = CLASSES[cls].maxHp;
  myPlayer.hp = myPlayer.maxHp;
}

/*********************************
 ESTADO GLOBAL
**********************************/
let players = {};
let keys = {};
let lastSend = 0;

/*********************************
 INPUT
**********************************/
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Mobile
canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  myPlayer.x = t.clientX - canvas.offsetLeft;
  myPlayer.y = t.clientY - canvas.offsetTop;
});

/*********************************
 SOCKET
**********************************/
socket.onmessage = e => {
  try { players = JSON.parse(e.data); } catch {}
};

/*********************************
 MOVIMENTO
**********************************/
function move(){
  const spd = CLASSES[myPlayer.cls].speed;
  if (keys["w"]) myPlayer.y -= spd;
  if (keys["s"]) myPlayer.y += spd;
  if (keys["a"]) myPlayer.x -= spd;
  if (keys["d"]) myPlayer.x += spd;
  myPlayer.x = clamp(myPlayer.x, 10, canvas.width-10);
  myPlayer.y = clamp(myPlayer.y, 10, canvas.height-10);
}

/*********************************
 SKILLS (BALANCEADAS)
**********************************/
let cdNova = 0, cdDash = 0;

function skillNova(){
  if (cdNova > 0) return;
  socket.send(JSON.stringify({ skill:"nova" }));
  myPlayer.xp += 10;
  cdNova = 180; // cooldown
}

function skillDash(){
  if (cdDash > 0) return;
  myPlayer.x += 80;
  cdDash = 120;
}

/*********************************
 BOSS COOP
**********************************/
let boss = { x:400, y:200, hp:1500, alive:true };

function attackBoss(){
  if (!boss.alive || myPlayer.room !== "dungeon1") return;
  if (dist(myPlayer, boss) < 90){
    socket.send(JSON.stringify({ hitBoss:true }));
    boss.hp -= (myPlayer.cls==="tank"?3:5);
    myPlayer.xp += 5;
    if (boss.hp <= 0) boss.alive = false;
  }
}

/*********************************
 LEVEL / PROGRESSÃO
**********************************/
function levelUp(){
  if (myPlayer.xp >= 100){
    myPlayer.level++;
    myPlayer.xp = 0;
    myPlayer.maxHp += 20;
    myPlayer.hp = myPlayer.maxHp;
  }
}

/*********************************
 SALAS / DUNGEONS
**********************************/
function rooms(){
  if (myPlayer.room==="lobby" && myPlayer.x>760){
    myPlayer.room="dungeon1"; myPlayer.x=40;
  }
  if (myPlayer.room==="dungeon1" && myPlayer.x<20){
    myPlayer.room="lobby"; myPlayer.x=760;
  }
}

/*********************************
 CHAT (SIMPLES)
**********************************/
function sendChat(msg){
  socket.send(JSON.stringify({ chat: msg, name: myPlayer.name }));
}

/*********************************
 UI
**********************************/
function ui(){
  document.getElementById("hp").innerText =
    `HP ${myPlayer.hp}/${myPlayer.maxHp}`;
  document.getElementById("level").innerText =
    `Lv ${myPlayer.level} (${myPlayer.cls})`;
}

/*********************************
 DESENHO
**********************************/
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // mapa
  ctx.fillStyle="#222";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // boss
  if (boss.alive && myPlayer.room==="dungeon1"){
    ctx.fillStyle="purple";
    ctx.fillRect(boss.x-20,boss.y-20,40,40);
  }

  // outros jogadores
  for (let id in players){
    const p = players[id];
    if (p.room!==myPlayer.room) continue;
    ctx.fillStyle="red";
    ctx.fillRect(p.x-10,p.y-10,20,20);
  }

  // player local
  ctx.fillStyle="cyan";
  ctx.fillRect(myPlayer.x-10,myPlayer.y-10,20,20);
}

/*********************************
 LOOP
**********************************/
function loop(){
  move();
  rooms();
  attackBoss();
  levelUp();
  ui();
  draw();

  if (cdNova>0) cdNova--;
  if (cdDash>0) cdDash--;

  // skills
  if (keys["1"]) skillNova();
  if (keys["2"]) skillDash();

  // sync (20x/s)
  if (Date.now()-lastSend>50 && socket.readyState===1){
    socket.send(JSON.stringify(myPlayer));
    lastSend=Date.now();
  }
  requestAnimationFrame(loop);
}

// classe inicial
applyClass("rogue");
loop();
