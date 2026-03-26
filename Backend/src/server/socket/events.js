export const HIT_STATUS_EVENTS = {
  bust: "PLAYER_BUST",
  blackjack: "PLAYER_BLACKJACK",
  stood: "PLAYER_STOOD",
};

export const GAME_RESULT_EVENTS = {
  win: "PLAYER_WIN",
  lost: "PLAYER_LOST",
  draw: "PLAYER_DRAW",
};

export function getHitEventName(status) {
  return HIT_STATUS_EVENTS[status] ?? "CARD_RECEIVED";
}
