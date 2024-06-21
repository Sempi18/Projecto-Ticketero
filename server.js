// server.js

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const moment = require("moment");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3001;

// Manejo de tickets
let nextTicketNumber = 1;
let queue = [];
let ticketsPerDay = {};

// Middleware para servir archivos estáticos
app.use(express.static("public"));

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// API para obtener los últimos 3 tickets
app.get("/ultimos", (req, res) => {
  const ultimosTres = queue.slice(-3).reverse();
  res.json(ultimosTres);
});

// Función para llamar un ticket
function llamarTicket() {
  if (queue.length > 0) {
    const ticket = queue.shift();
    io.emit("ticket_llamado", ticket);

    // Registrar en tickets atendidos por día
    const today = moment().format("YYYY-MM-DD");
    if (!ticketsPerDay[today]) {
      ticketsPerDay[today] = 1;
    } else {
      ticketsPerDay[today]++;
    }

    console.log(`Ticket ${ticket} llamado.`);
    return ticket;
  }
  return null;
}

// Intervalo para llamar tickets cada 5 segundos
setInterval(() => {
  const ticketLlamado = llamarTicket();
  if (ticketLlamado !== null) {
    io.emit("actualizar_ultimos");
  }
}, 5000);

// Configuración de Socket.IO
io.on("connection", (socket) => {
  console.log("Nueva conexión:", socket.id);

  // Evento cuando se solicita el número del próximo ticket
  socket.on("solicitar_ticket", () => {
    const ticketActual = nextTicketNumber++;
    queue.push(ticketActual);
    io.emit("nuevo_ticket", ticketActual);
    console.log(`Nuevo ticket generado: ${ticketActual}`);
  });

  // Evento para obtener los últimos tickets
  socket.on("obtener_ultimos", () => {
    const ultimosTres = queue.slice(-3).reverse();
    socket.emit("ultimos_tickets", ultimosTres);
  });

  // Evento para obtener la cantidad de tickets atendidos por día
  socket.on("obtener_tickets_por_dia", () => {
    socket.emit("tickets_por_dia", ticketsPerDay);
  });
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
