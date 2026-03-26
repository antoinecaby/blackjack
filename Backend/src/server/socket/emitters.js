import { GAME_RESULT_EVENTS } from "./events.js";

export function emitGameStarted(io, game) {
  io.emit("GAME_STARTED", game.getSnapshot());
}

export function emitDealerStateIfNeeded(io, game) {
  if (!game.dealerCanPlay()) {
    return;
  }

  const dealerResult = game.dealerPlay();

  if (dealerResult.status === "bust") {
    io.emit("DEALER_BUST", dealerResult);
  } else if (dealerResult.status === "stood") {
    io.emit("DEALER_STOOD", dealerResult);
  }
}

export function emitInitialCardSend(io, game) {
  io.emit("INITIAL_CARDS", game.getSnapshot());
}

export function emitGameResultsIfReady(io, game) {
  const resultGame = game.calulateResults();

  if (resultGame == null) {
    return;
  }

  Object.entries(GAME_RESULT_EVENTS).forEach(([status, eventName]) => {
    if (resultGame.some((player) => player.status === status)) {
      io.emit(eventName, resultGame);
    }
  });
}
