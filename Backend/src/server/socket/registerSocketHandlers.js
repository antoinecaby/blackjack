import {
  emitDealerStateIfNeeded,
  emitGameResultsIfReady,
  emitGameStarted,
  emitInitialCardSend,
} from "./emitters.js";
import { getHitEventName } from "./events.js";

export function registerSocketHandlers({
  io,
  socket,
  game,
  playersBySocketId,
}) {
  socket.on("JOIN_GAME", (playerId, name) => {
    const result = game.addPlayer(playerId, name);
    if (!result.success) {
      console.log(
        `Le joueur ${playerId} est déjà dans la partie ou la table est pleine`,
      );
      socket.emit("JOIN_GAME_FAILED", { message: result.message });
      return;
    }

    playersBySocketId.set(socket.id, {
      socketId: socket.id,
      playerId,
      name,
    });
    console.log(`Le joueur ${playerId} a rejoint la partie`);
    socket.emit("JOIN_GAME_SUCCESS", { playerId });
  });

  socket.on("START_GAME", () => {
    game.start();
    console.log("Game started");
    emitGameStarted(io, game);
  });

  socket.on("PLAY_AGAIN", (playerId, name) => {
    game.restart(playerId, name);
    console.log(`Player ${playerId} wants to play again: RESET`);
    emitGameStarted(io, game);
  });

  socket.on("WAITING_INITIAL_CARDS", () => {
    console.log("Le client attend les cartes initiales");
    game.dealInitialCards();
    emitInitialCardSend(io, game);
  });

  socket.on("INITIAL_CARDS_RECEIVED", (playerId) => {
    let player = game.players.find((p) => p.id === playerId);
  });

  socket.on("HIT", (playerId) => {
    console.log(playerId, "demande une carte");
    const result = game.playerHit(playerId);

    const event = getHitEventName(result.status);
    io.emit(event, result);

    console.log(
      `Le joueur ${playerId} a tiré une carte`,
      result.status,
      result.score,
      result.card.alias,
      result.card.value,
    );

    emitDealerStateIfNeeded(io, game);
    emitGameResultsIfReady(io, game);
  });

  socket.on("STAND", (playerId) => {
    const result = game.playerStand(playerId);

    io.emit("PLAYER_STOOD", result);

    console.log(`Le joueur ${playerId} a choisi de rester`);

    emitDealerStateIfNeeded(io, game);
    emitGameResultsIfReady(io, game);
  });

  socket.on("DEALER_PLAY", () => {
    game.dealerPlay();
    console.log("Le dealer joue");
  });

  socket.on("disconnect", (reason) => {
    const player = playersBySocketId.get(socket.id);
    playersBySocketId.delete(socket.id);

    if (!player) {
      console.log("Socket déconnecté sans joueur associé :", reason);
      return;
    }

    console.log(`Un joueur (${player.name}) s'est deconncté : `, reason);
    game.removePlayer(player.playerId);
  });
}
