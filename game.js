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
#chat{position:fixed;bottom:10px;left:10px;width:220px}
#chatLog{height:120px;overflow:auto;background:#111;padding:5px}
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
<div id="gold"></div>
<div>1 Nova | 2 Dash</div>
</div>

<div id="chat">
<div id="chatLog"></div>
<input id="chatMsg" placeholder="chat">
<button onclick="sendChat()">Enviar</button>
</div>
</div>

<script>
/**************** CONFIG ****************/
const SERVER_URL="wss://rpg-multiplayer-server.onrender.com";
const socket=new WebSocket(SERVER_URL);

/**************** AUTH ****************/
function login(){
 socket.send(JSON.stringify({type:"login",user:user.value,pass:pass.value}));
}
function register(){
 socket.send(JSON.stringify({type:"register",user:user.value,pass:pass.value}));
}

/**************** GAME STATE ****************/
let myPlayer=null,players={},keys={},lastSend=0;
let boss={x:400,y:200,hp:2000,alive:true};

/**************** INPUT ****************/
document.addEventListener("keydown",e=>keys[e.key]=true);
document.addEventListener("keyup",e=>keys[e.key]=false);
game.addEventListener("touchmove",e=>{
 const t=e.touches[0];
 myPlayer.x=t.clientX-game.offsetLeft;
 myPlayer.y=t.clientY-game.offsetTop;
});

/**************** SOCKET ****************/
socket.onmessage=e=>{
 const d=JSON.parse(e.data);

 if(d.ok==="Logado"){
  myPlayer=d.player;
  myPlayer.gold??=0;
  myPlayer.inv??=[];
  login.style.display="none";
  gameArea.style.display="block";
  loop();
 }

 if(d.chat){
  chatLog.innerHTML+=`<div>${d.chat}</div>`;
  chatLog.scrollTop=9999;
 }

 if(!d.ok && !d.error && !d.chat){
  players=d;
 }

 if(d.error) alert(d.error);
};

/**************** MOVIMENTO ****************/
function move(){
 if(keys.w)myPlayer.y-=3;
 if(keys.s)myPlayer.y+=3;
 if(keys.a)myPlayer.x-=3;
 if(keys.d)myPlayer.x+=3;
}

/**************** SKILLS ****************/
function nova(){socket.send(JSON.stringify({skill:"nova"}));myPlayer.xp+=10;}
function dash(){myPlayer.x+=80;}

/**************** BOSS ****************/
function attackBoss(){
 if(!boss.alive)return;
 if(Math.hypot(myPlayer.x-boss.x,myPlayer.y-boss.y)<80){
  boss.hp-=5;
  myPlayer.xp+=5;
  if(boss.hp<=0){
   boss.alive=false;
   myPlayer.gold+=100;
   myPlayer.inv.push("Relíquia");
  }
 }
}

/**************** LEVEL ****************/
function levelUp(){
 if(myPlayer.xp>=100){
  myPlayer.level++;
  myPlayer.xp=0;
  myPlayer.maxHp+=20;
  myPlayer.hp=myPlayer.maxHp;
 }
}

/**************** CHAT ****************/
function sendChat(){
 socket.send(JSON.stringify({chat:user.value+": "+chatMsg.value}));
 chatMsg.value="";
}

/**************** UI ****************/
function ui(){
 hp.innerText=`HP ${myPlayer.hp}/${myPlayer.maxHp}`;
 level.innerText=`Lv ${myPlayer.level}`;
 gold.innerText=`Gold ${myPlayer.gold}`;
}

/**************** DRAW ****************/
const ctx=game.getContext("2d");
function draw(){
 ctx.clearRect(0,0,800,450);
 ctx.fillStyle="#222";ctx.fillRect(0,0,800,450);

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

/**************** LOOP ****************/
function loop(){
 move();
 attackBoss();
 levelUp();
 ui();
 draw();

 if(keys["1"])nova();
 if(keys["2"])dash();

 if(Date.now()-lastSend>50){
  socket.send(JSON.stringify({type:"update",player:myPlayer}));
  lastSend=Date.now();
 }
 requestAnimationFrame(loop);
}

/**************** START ****************/
login.style.display="block";
</script>
</body>
</html>
