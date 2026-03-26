import { registerSocketHandlers } from "./socket/registerSocketHandlers.js";

export default function initSocket(io, game) {
  const playersBySocketId = new Map();

  io.on("connect", (socket) => {
    console.log("Un joueur connecté");
    socket.emit("connected");
    registerSocketHandlers({ io, socket, game, playersBySocketId });
  });
}
