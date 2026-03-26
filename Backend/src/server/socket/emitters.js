import { calculateHandValue } from "../../domain/Rules.js";
import { GAME_RESULT_EVENTS } from "./events.js";

export function emitGameStarted(io, game) {
  io.emit("GAME_STARTED", {
    players: game.players,
    dealer: game.dealer.hand,
  });
}

export function emitDealerStateIfNeeded(io, game) {
  if (!game.dealerCanPlay()) {
    return;
  }

  const dealerResult = game.dealerPlay();
  if (dealerResult.status === "bust") {
    console.log("Le dealer a busté");
    io.emit("DEALER_BUST", dealerResult);
  } else if (dealerResult.status === "stood") {
    console.log("Le dealer a stand");
    io.emit("DEALER_STOOD", dealerResult);
  }
}

export function emitInitialCardSend(io, game) {
  io.emit("INITIAL_CARDS", {
    players: game.players,
    dealer: game.dealer.hand,
  });
}

export function emitCheckSecondInitialCard(io, game, playerId) {
  io.emit("CHECK_SECOND_INITIAL_CARD", {
    playerId,
    hasSecondCard:
      game.players.find((p) => p.id === playerId).hand.length === 2,
  });
}
export function emitGameResultsIfReady(io, game) {
  const resultGame = game.calulateResults();
  if (resultGame == null) {
    return;
  }

  console.log("Envoyer les résultats de la partie au client");

  Object.entries(GAME_RESULT_EVENTS).forEach(([status, eventName]) => {
    if (resultGame.some((player) => player.status === status)) {
      console.log(`Envoyer le résultat de ${status} au client`);
      io.emit(eventName, resultGame);
    }
  });
}

function findPlayerWithAs(game) {
  return game.players.find((player) => {
    return player.hand.find((card) => card.isAs());
  });
}
