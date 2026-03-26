import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import { connect } from "./framework/connexion.js";
import Game from "./domain/Game.js";
import initSocket from "./server/socket.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

let game = new Game();

initSocket(io, game);

const startServer = async () => {
  try {
    await connect();

    server.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error("Impossible de démarrer le serveur :", error);
    process.exit(1);
  }
};

startServer();
