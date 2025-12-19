const socket = new WebSocket("wss://rpg-multiplayer-server.onrender.com");

function register() {
  socket.send(JSON.stringify({
    type: "register",
    user: user.value,
    pass: pass.value
  }));
}

function login() {
  socket.send(JSON.stringify({
    type: "login",
    user: user.value,
    pass: pass.value
  }));
}

socket.onmessage = e => {
  const d = JSON.parse(e.data);
  if (d.ok === "Logado") {
    localStorage.player = JSON.stringify(d.player);
    location.href = "game.html";
  }
  if (d.error) alert(d.error);
};
