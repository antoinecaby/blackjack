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
      socket.emit("JOIN_GAME_FAILED", { message: result.message });
      return;
    }

    playersBySocketId.set(socket.id, {
      socketId: socket.id,
      playerId,
      name,
    });

    socket.emit("JOIN_GAME_SUCCESS", { playerId });
  });

  socket.on("START_GAME", () => {
    game.start();
    emitGameStarted(io, game);
  });

  socket.on("PLAY_AGAIN", (playerId, name) => {
    game.restart(playerId, name);
    emitGameStarted(io, game);
  });

  socket.on("WAITING_INITIAL_CARDS", () => {
    game.dealInitialCards();
    emitInitialCardSend(io, game);
  });

  socket.on("INITIAL_CARDS_RECEIVED", () => {});

  socket.on("HIT", (playerId) => {
    const result = game.playerHit(playerId);

    if (!result) {
      return;
    }

    const event = getHitEventName(result.status);
    io.emit(event, result);

    emitDealerStateIfNeeded(io, game);
    emitGameResultsIfReady(io, game);
  });

  socket.on("STAND", (playerId) => {
    const result = game.playerStand(playerId);

    if (!result) {
      return;
    }

    io.emit("PLAYER_STOOD", result);

    emitDealerStateIfNeeded(io, game);
    emitGameResultsIfReady(io, game);
  });

  socket.on("DEALER_PLAY", () => {
    emitDealerStateIfNeeded(io, game);
    emitGameResultsIfReady(io, game);
  });

  socket.on("disconnect", (reason) => {
    const player = playersBySocketId.get(socket.id);
    playersBySocketId.delete(socket.id);

    if (!player) {
      console.log("Socket déconnecté sans joueur associé :", reason);
      return;
    }

    console.log(`Un joueur (${player.name}) s'est déconnecté :`, reason);
    game.removePlayer(player.playerId);
  });
}
