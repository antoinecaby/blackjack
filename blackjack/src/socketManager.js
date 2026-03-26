/**
 * SocketManager.js - Gestion des sockets du backend
 * Un seul fichier pour tous les événements
 */

import { io } from "socket.io-client";

// Connexion au serveur
const socket = io("http://localhost:3000", {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// État global du jeu
export const gameState = {
  players: [],
  dealer: null,
  currentPlayer: null,
};

// ============================================================================
// ÉVÉNEMENTS DE CONNEXION
// ============================================================================

socket.on("connect", () => {
  console.log("[CONNECT] Connecté au serveur socket.io");
  updateDisplay("status", "Connecté");
});

socket.on("disconnect", () => {
  console.log("[DISCONNECT] Déconnecté du serveur");
  updateDisplay("status", "Déconnecté");
});

socket.on("connected", () => {
  console.log("[READY] Socket prêt");
});

// ============================================================================
// ÉVÉNEMENTS REJOINDRE LA PARTIE
// ============================================================================

socket.on("JOIN_GAME_SUCCESS", (data) => {
  console.log("[JOIN_GAME_SUCCESS] Rejoint la partie:", data.playerId);
  gameState.currentPlayer = data.playerId;
  updateDisplay("status", "Vous avez rejoint la partie");
});

socket.on("JOIN_GAME_FAILED", (data) => {
  console.error("[JOIN_GAME_FAILED] Impossible de rejoindre:", data.message);
  updateDisplay("status", data.message);
});

// ============================================================================
// ÉVÉNEMENTS DÉMARRAGE DE LA PARTIE
// ============================================================================

socket.on("GAME_STARTED", (data) => {
  console.log("[GAME_STARTED] Partie démarrée");
  gameState.players = data.players || [];
  gameState.dealer = { hand: data.dealer || [] };

  updateDisplay("status", "Partie démarrée");
  renderGame();
  showButtons("hit", "stand");
});

socket.on("SELECT_AS_VALUE", (data) => {
  console.log("[SELECT_AS_VALUE] Choisir valeur As");
  const value = confirm("As = 11 ? (OK=11, Annuler=1)") ? 11 : 1;
  socket.emit("APPLY_AS_VALUE", data.playerId, data.card.suit, value);
  updateDisplay("status", `Vous avez choisi ${value}`);
});

// ============================================================================
// ÉVÉNEMENTS ACTIONS JOUEUR
// ============================================================================

socket.on("CARD_RECEIVED", (data) => {
  console.log("[CARD_RECEIVED] Carte reçue:", data.card?.alias);
  updatePlayerState(data);
  renderGame();
  updateDisplay("status", `Carte: ${data.card?.alias || "?"}`);
});

socket.on("PLAYER_BUST", (data) => {
  console.log("[PLAYER_BUST] Bust");
  updatePlayerState(data);
  renderGame();
  updateDisplay("status", "Vous avez busté");
});

socket.on("PLAYER_BLACKJACK", (data) => {
  console.log("[PLAYER_BLACKJACK] Blackjack");
  updatePlayerState(data);
  renderGame();
  updateDisplay("status", "Blackjack");
});

socket.on("PLAYER_STOOD", (data) => {
  console.log("[PLAYER_STOOD] Stand");
  updatePlayerState(data);
  renderGame();
  updateDisplay("status", "Vous avez stand");
});

// ============================================================================
// ÉVÉNEMENTS DEALER
// ============================================================================

socket.on("DEALER_BUST", (data) => {
  console.log("[DEALER_BUST] Dealer bust");
  if (gameState.dealer) gameState.dealer.status = "bust";
  renderGame();
  updateDisplay("status", "Dealer a busté");
});

socket.on("DEALER_STOOD", (data) => {
  console.log("[DEALER_STOOD] Dealer stand");
  if (gameState.dealer) gameState.dealer.status = "stood";
  renderGame();
  updateDisplay("status", "Dealer a stand");
});

// ============================================================================
// ÉVÉNEMENTS RÉSULTATS
// ============================================================================

socket.on("PLAYER_WIN", (data) => {
  console.log("[PLAYER_WIN] Victoire");
  renderGame();
  updateDisplay("status", "Vous avez gagné");
  showButtons("play-again");
});

socket.on("PLAYER_LOST", (data) => {
  console.log("[PLAYER_LOST] Défaite");
  renderGame();
  updateDisplay("status", "Vous avez perdu");
  showButtons("play-again");
});

socket.on("PLAYER_DRAW", (data) => {
  console.log("[PLAYER_DRAW] Égalité");
  renderGame();
  updateDisplay("status", "Égalité");
  showButtons("play-again");
});

// ============================================================================
// AUTRES ÉVÉNEMENTS
// ============================================================================

socket.on("BALANCE_UPDATED", (data) => {
  console.log("[BALANCE_UPDATED] Solde:", data.balance);
  updateDisplay("balance", `$${data.balance}`);
});

socket.on("ERROR", (data) => {
  console.error("[ERROR]", data.message);
  updateDisplay("status", data.message);
});

// ============================================================================
// FONCTIONS D'ÉMISSION (appeler depuis les boutons HTML)
// ============================================================================

export function joinGame(playerId, playerName) {
  console.log("[EMIT] joinGame");
  socket.emit("JOIN_GAME", playerId, playerName);
}

export function startGame() {
  console.log("[EMIT] startGame");
  socket.emit("START_GAME");
}

export function playerHit() {
  console.log("[EMIT] playerHit");
  socket.emit("HIT", gameState.currentPlayer);
}

export function playerStand() {
  console.log("[EMIT] playerStand");
  socket.emit("STAND", gameState.currentPlayer);
}

export function playAgain(playerId, playerName) {
  console.log("[EMIT] playAgain");
  socket.emit("PLAY_AGAIN", playerId, playerName);
}

// ============================================================================
// UTILITAIRES D'AFFICHAGE
// ============================================================================

function updatePlayerState(data) {
  if (!data.playerId) return;
  const player = gameState.players.find((p) => p.id === data.playerId);
  if (player) {
    player.score = data.score || 0;
    player.status = data.status || "playing";
    if (data.hand) player.hand = data.hand;
  }
}

function renderGame() {
  const html = `
    <div style="display:flex;gap:20px;margin:20px 0">
      <div>
        <h3>Dealer</h3>
        <p>Main: ${gameState.dealer?.hand?.map((c) => c?.alias || "?").join(", ") || "—"}</p>
      </div>
      <div>
        <h3>Vous</h3>
        ${gameState.players
          .map(
            (p) => `
          <p><strong>${p.id}</strong></p>
          <p>Main: ${p.hand?.map((c) => c?.alias || "?").join(", ") || "—"}</p>
          <p>Score: ${p.score || 0}</p>
          <p style="color:${p.status === "bust" ? "red" : p.status === "stood" ? "green" : "blue"}">
            ${p.status || "?"}
          </p>
        `
          )
          .join("")}
      </div>
    </div>
  `;
  updateDisplay("game-display", html);
}

function updateDisplay(id, content) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[WARN] Élément #${id} non trouvé`);
    return;
  }

  if (typeof content === "string" && content.includes("<")) {
    el.innerHTML = content;
  } else {
    el.textContent = content;
  }
}

function showButtons(...names) {
  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.style.display = "none";
  });

  names.forEach((name) => {
    const btn = document.querySelector(`[data-action="${name}"]`);
    if (btn) btn.style.display = "inline-block";
  });
}

export default socket;
