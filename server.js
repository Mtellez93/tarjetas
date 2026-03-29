const express = require("express");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

const DATA_FILE = "data.json";

function readData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Crear tarjeta
app.post("/create", (req, res) => {
  const { name, template } = req.body;
  let data = readData();

  if (data.find(c => c.name === name)) {
    return res.status(400).send("Ya existe");
  }

  data.push({ name, template });
  saveData(data);

  res.send("Creada");
});

// Obtener tarjeta
app.get("/card/:name", (req, res) => {
  let data = readData();
  let card = data.find(c => c.name === req.params.name);

  if (!card) return res.status(404).send("No existe");

  res.json(card);
});

// Guardar cambios colaborativos
app.post("/join", (req, res) => {
  const { name, template } = req.body;

  let data = readData();
  let card = data.find(c => c.name === name);

  if (!card) return res.status(404).send("No existe");

  card.template = template;
  saveData(data);

  res.send("Actualizado");
});

// SOCKET.IO
io.on("connection", (socket) => {

  socket.on("join-card", (cardName) => {
    socket.join(cardName);
  });

  socket.on("canvas-update", ({ cardName, data }) => {
    socket.to(cardName).emit("canvas-update", data);
  });

});

server.listen(3000, () => console.log("Servidor en http://localhost:3000"));
