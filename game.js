/* =========================
   CONFIGURAÇÕES GERAIS
========================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 450;

/* ===== URL DO SERVIDOR ===== */
const socket = new WebSocket(
  "wss://rpg-multiplayer-server.onrender.com" // MUDE SE PRECISAR
);

/* =========================
   INPUT
========================= */

const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

/* Mobile */
canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  myPlayer.x = t.clientX - 10;
  myPlayer.y = t.clientY - 10;
});

/* =========================
   PLAYER LOCAL
========================= */

const myPlayer = {
  x: 400,
  y: 300,
  hp: 100,
  maxHp: 100,
  level: 1,
  xp: 0,
  room: "lobby"
};

let players = {};

/* =========================
   MAPAS / SALAS
========================= */

const rooms = {
  lobby: { w: 800, h: 450 },
  dungeon1: { w: 800, h: 450 }
};

/* =========================
   BOSS COOPERATIVO
========================= */

let boss = {
  x: 400,
  y: 200,
  hp: 1000,
  alive: true
};

/* =========================
   SKILLS
========================= */

let cooldownNova = 0;

function skillNova() {
  if (cooldownNova > 0) return;
  socket.send(JSON.stringify({ skill: "nova" }));
  cooldownNova = 120;
}

/* =========================
   WEBSOCKET
========================= */

socket.onmessage = e => {
  players = JSON.parse(e.data);
};

/* =========================
   UI
========================= */

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  ctx.fillText(`HP: ${myPlayer.hp}/${myPlayer.maxHp}`, 10, 20);
  ctx.fillText(`Level: ${myPlayer.level}`, 10, 40);
  ctx.fillText(`Sala: ${myPlayer.room}`, 10, 60);
  ctx.fillText(`Skill 1: Nova`, 10, 80);
}

/* =========================
   UPDATE
========================= */

function update() {
  /* Movimento */
  if (keys["w"] || keys["ArrowUp"]) myPlayer.y -= 3;
  if (keys["s"] || keys["ArrowDown"]) myPlayer.y += 3;
  if (keys["a"] || keys["ArrowLeft"]) myPlayer.x -= 3;
  if (keys["d"] || keys["ArrowRight"]) myPlayer.x += 3;

  /* Skill */
  if (keys["1"]) skillNova();

  /* Cooldowns */
  if (cooldownNova > 0) cooldownNova--;

  /* Porta para dungeon */
  if (myPlayer.room === "lobby" && myPlayer.x > 760) {
    myPlayer.room = "dungeon1";
    myPlayer.x = 50;
  }

  /* Enviar estado ao servidor */
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(myPlayer));
  }
}

/* =========================
   DRAW
========================= */

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* Fundo */
  ctx.fillStyle = myPlayer.room === "lobby" ? "#222" : "#330000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  /* Porta */
  if (myPlayer.room === "lobby") {
    ctx.fillStyle = "yellow";
    ctx.fillRect(780, 200, 20, 60);
  }

  /* Boss */
  if (myPlayer.room === "dungeon1" && boss.alive) {
    ctx.fillStyle = "purple";
    ctx.fillRect(boss.x - 25, boss.y - 25, 50, 50);

    ctx.fillStyle = "red";
    ctx.fillRect(300, 20, boss.hp / 2, 10);
  }

  /* Jogadores */
  for (let id in players) {
    const p = players[id];
    ctx.fillStyle = "red";
    ctx.fillRect(p.x, p.y, 20, 20);
  }

  drawUI();
}

/* =========================
   GAME LOOP
========================= */

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
