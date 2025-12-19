<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>RPG Online</title>
<style>
body{margin:0;background:#000;color:#fff;font-family:Arial}
#login,#gameArea{display:none;text-align:center}
input,button{margin:5px;padding:8px}
canvas{display:block;margin:auto;background:#111}
#ui{position:fixed;top:10px;left:10px}
</style>
</head>
<body>

<!-- LOGIN -->
<div id="login">
  <h2>RPG Online</h2>
  <input id="user" placeholder="Usuário"><br>
  <input id="pass" type="password" placeholder="Senha"><br>
  <button onclick="login()">Entrar</button>
  <button onclick="register()">Criar Conta</button>
</div>

<!-- GAME -->
<div id="gameArea">
  <canvas id="game" width="800" height="450"></canvas>
  <div id="ui">
    <div id="hp"></div>
    <div id="level"></div>
    <div>1 Nova | 2 Dash</div>
  </div>
</div>

<script>
/*************** CONFIG ***************/
const SERVER_URL = "wss://rpg-multiplayer-server.onrender.com";
const socket = new WebSocket(SERVER_URL);

/*************** AUTH ***************/
function login(){
  socket.send(JSON.stringify({
    type:"login",
    user:user.value,
    pass:pass.value
  }));
}

function register(){
  socket.send(JSON.stringify({
    type:"register",
    user:user.value,
    pass:pass.value
  }));
}

/*************** GAME STATE ***************/
let myPlayer=null;
let players={};
let keys={};
let lastSend=0;

/*************** CANVAS ***************/
const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

/*************** INPUT ***************/
document.addEventListener("keydown",e=>keys[e.key]=true);
document.addEventListener("keyup",e=>keys[e.key]=false);
canvas.addEventListener("touchmove",e=>{
  const t=e.touches[0];
  myPlayer.x=t.clientX-canvas.offsetLeft;
  myPlayer.y=t.clientY-canvas.offsetTop;
});

/*************** BOSS ***************/
let boss={x:400,y:200,hp:1000,alive:true};

/*************** SOCKET ***************/
socket.onmessage=e=>{
  const d=JSON.parse(e.data);

  if(d.ok==="Logado"){
    myPlayer=d.player;
    login.style.display="none";
    gameArea.style.display="block";
    loop();
  }

  if(d.error) alert(d.error);

  if(!d.ok && !d.error){
    players=d;
  }
};

/*************** GAME LOGIC ***************/
function move(){
  if(!myPlayer) return;
  if(keys["w"]) myPlayer.y-=3;
  if(keys["s"]) myPlayer.y+=3;
  if(keys["a"]) myPlayer.x-=3;
  if(keys["d"]) myPlayer.x+=3;
}

function skillNova(){
  socket.send(JSON.stringify({skill:"nova"}));
  myPlayer.xp+=10;
}

function skillDash(){
  myPlayer.x+=80;
}

function attackBoss(){
  if(!boss.alive) return;
  const d=Math.hypot(myPlayer.x-boss.x,myPlayer.y-boss.y);
  if(d<80){
    boss.hp-=5;
    if(boss.hp<=0) boss.alive=false;
  }
}

function levelUp(){
  if(myPlayer.xp>=100){
    myPlayer.level++;
    myPlayer.xp=0;
    myPlayer.maxHp+=20;
    myPlayer.hp=myPlayer.maxHp;
  }
}

/*************** DRAW ***************/
function draw(){
  ctx.clearRect(0,0,800,450);
  ctx.fillStyle="#222";
  ctx.fillRect(0,0,800,450);

  if(boss.alive){
    ctx.fillStyle="purple";
    ctx.fillRect(boss.x-20,boss.y-20,40,40);
  }

  for(let id in players){
    const p=players[id];
    ctx.fillStyle="red";
    ctx.fillRect(p.x-10,p.y-10,20,20);
  }

  ctx.fillStyle="cyan";
  ctx.fillRect(myPlayer.x-10,myPlayer.y-10,20,20);
}

/*************** UI ***************/
function ui(){
  hp.innerText=`HP ${myPlayer.hp}/${myPlayer.maxHp}`;
  level.innerText=`Lv ${myPlayer.level}`;
}

/*************** LOOP ***************/
function loop(){
  move();
  attackBoss();
  levelUp();
  ui();
  draw();

  if(keys["1"]) skillNova();
  if(keys["2"]) skillDash();

  if(Date.now()-lastSend>50){
    socket.send(JSON.stringify({
      type:"update",
      player:myPlayer
    }));
    lastSend=Date.now();
  }

  requestAnimationFrame(loop);
}

/*************** START ***************/
login.style.display="block";
</script>
</body>
</html>
