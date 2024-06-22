const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const turnList = [
  "Juancito Perez",
  "Joaquin Manez",
  "Giovanni Janne",
  "Nico Schlotterbeck",
  "Niklas Süle",
];
const attendedList = [];

app.use(express.static("./public"));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

server.listen(3000, () => {
  console.log("SERVER ON\n http://localhost:3000");
});

const sendLists = (alert) => {
  io.sockets.emit("ListaDeTurnos", {
    pendientes: turnList,
    atendidos: attendedList,
    alerta: alert,
  });
};

setInterval(() => {
  sendLists(false);
}, 60000);

io.on("connection", (socket) => {
  console.log("Usuario conectado");

  socket.on("VentanaTurnoActual", (data) => {
    console.log("VentanaTurnoActual");
    sendLists(false);
  });

  socket.on("AtenderTurno", (puesto) => {
    console.log("AtenderTurno");
    if (turnList.length > 0) {
      attendedList.unshift({
        nombre: turnList[0],
        puesto: puesto,
        hora: Date.now(),
      });
      turnList.shift();
      sendLists(true);
    }
  });

  socket.on("CrearTurno", (data) => {
    console.log("CrearTurno");
    turnList.push(data);
    sendLists(false);
  });
});
