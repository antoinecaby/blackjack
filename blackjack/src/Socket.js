import { io } from "socket.io-client";
import ImageView from "./Manager/ImageView";
import { getCard } from "./Manager/AssetsManager";
import Scene from "./Scene";

export const socket = io("http://localhost:3000");

socket.on("connected", () => {
  console.log("Connecté au serveur");
  socket.emit("JOIN_GAME", "p1"); // Envoyer un message de test au serveur
  socket.emit("START_GAME"); // Envoyer un message de test au serveur
  socket.on("GAME_STARTED", (data) => {
    socket.emit("WAITING_INITIAL_CARDS");
  });
});

// socket.on("disconnect", () => {
//   socket.emit("disconnect", "p1");
// });

socket.on("HIT", (carte) => {});
socket.on("CARD_RECEIVED", (data) => {
  console.log("Carte reçue du serveur", data);
});
socket.on("GAME_STARTED", (data) => {
  console.log("Partie commencée avec les joueurs:", data);
});

function hit() {
  socket.emit("HIT");
}
