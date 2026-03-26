import { calculateHandValue } from "../domain/Rules.js";

export default function initSocket(io, game) {
  let playerList = [];

  io.on("connect", (socket) => {
    const emitGameStarted = () => {
      io.emit("GAME_STARTED", {
        players: game.players,
        dealer: game.dealer.hand,
      });
    };

    const emitDealerStateIfNeeded = () => {
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
    };

    const emitGameResultsIfReady = () => {
      const resultGame = game.calulateResults();
      if (resultGame == null) {
        return;
      }

      console.log("Envoyer les résultats de la partie au client");

      const resultEvents = {
        win: "PLAYER_WIN",
        lost: "PLAYER_LOST",
        draw: "PLAYER_DRAW",
      };

      Object.entries(resultEvents).forEach(([status, eventName]) => {
        if (resultGame.some((player) => player.status === status)) {
          console.log(`Envoyer le résultat de ${status} au client`);
          io.emit(eventName, resultGame);
        }
      });
    };

    console.log("Un joueur connecté");
    socket.emit("connected");

    socket.on("JOIN_GAME", (playerId, name) => {
      console.log(`[SOCKET] JOIN_GAME: ${playerId} - ${name}`);
      let result = game.addPlayer(playerId, name);
      if (!result.success) {
        console.log(`[SOCKET] ❌ Impossible d'ajouter ${playerId}: ${result.message}`);
        socket.emit("JOIN_GAME_FAILED", { message: result.message });
        return;
      }

      playerList.push({
        socketId: socket.id,
        playerId: playerId,
        name: name,
      });
      console.log(`[SOCKET] ✅ Joueur ${playerId} ajouté. Total: ${game.players.length}`);
      socket.emit("JOIN_GAME_SUCCESS", { playerId });
    });

    socket.on("START_GAME", () => {
      game.start();
      console.log("Game started");
      let playerWithAs = game.players.find((player) => {
        return player.hand.find((card) => card.isAs());
      });

      if (playerWithAs) {
        io.emit("SELECT_AS_VALUE", {
          status: "playing",
          player: playerWithAs,
          card: playerWithAs.hand.find((card) => card.isAs()),
        });
      } else {
        game.players.forEach((player) => {
          console.log("joueur:", player.name, calculateHandValue(player.hand));
        });
        console.log("dealer:", calculateHandValue(game.dealer.hand));
        emitGameStarted();
      }
    });

    socket.on("DEAL", (data) => {
      console.log("[SOCKET] ⭐ DEAL reçu:", data);
      const { playerId, betAmount } = data;
      
      console.log(`[SOCKET] DEAL - playerId: ${playerId}, bet: ${betAmount}`);
      console.log(`[SOCKET] Players actuels:`, game.players.map(p => ({ id: p.id, name: p.name })));
      
      // Vérifier que le joueur existe
      const player = game.players.find((p) => p.id === playerId);
      if (!player) {
        console.error(`[SOCKET] ❌ Joueur non trouvé: ${playerId}`);
        socket.emit("ERROR", { message: "Joueur non trouvé" });
        return;
      }

      console.log(`[SOCKET] ✅ Joueur trouvé: ${player.name}`);

      // Démarrer la partie (distribue les cartes)
      try {
        game.start();
        console.log("[SOCKET] ✅ game.start() exécuté");
      } catch (err) {
        console.error("[SOCKET] ❌ Erreur game.start():", err);
        socket.emit("ERROR", { message: "Erreur démarrage partie" });
        return;
      }
      
      console.log("[SOCKET] Cartes distribuées");
      
      // Vérifier s'il y a un As à gérer
      let playerWithAs = game.players.find((player) => {
        return player.hand.find((card) => card.isAs());
      });

      if (playerWithAs) {
        console.log(`[SOCKET] As détecté chez ${playerWithAs.name}`);
        io.emit("SELECT_AS_VALUE", {
          status: "playing",
          playerId: playerWithAs.id,
          player: playerWithAs,
          card: playerWithAs.hand.find((card) => card.isAs()),
        });
      } else {
        console.log("[SOCKET] ✅ Pas d'As, émission GAME_STARTED");
        // Envoyer les cartes initiales
        game.players.forEach((player) => {
          console.log(`[SOCKET] ${player.name}: ${player.hand.map(c => c.alias).join(", ")}`);
        });
        console.log(`[SOCKET] Dealer: ${game.dealer.hand.map(c => c.alias).join(", ")}`);
        
        io.emit("GAME_STARTED", {
          players: game.players,
          dealer: game.dealer.hand,
        });
        console.log("[SOCKET] ✅ GAME_STARTED émis");
      }
    });

    socket.on("PLAY_AGAIN", (playerId, name) => {
      game.restart(playerId, name);
      console.log(`Player ${playerId} wants to play again: RESET`);
      emitGameStarted();
    });

    socket.on("HIT", (playerId) => {
      let result = game.playerHit(playerId);

      if (result.status === "playing" && result.card.isAs()) {
        console.log("Le joueur doit choisir la valeur de l'as");
        socket.emit("SELECT_AS_VALUE", result);
      } else {
        let event = "";
        switch (result.status) {
          case "bust":
            event = "PLAYER_BUST";
            break;
          case "blackjack":
            event = "PLAYER_BLACKJACK";
            break;
          case "stood":
            event = "PLAYER_STOOD";
            break;
          default:
            event = "CARD_RECEIVED";
        }
        io.emit(event, result);

        console.log(
          `Le joueur ${playerId} a tiré une carte`,
          result.status,
          result.score,
          result.card.alias,
          result.card.value,
        );

        emitDealerStateIfNeeded();
        emitGameResultsIfReady();
      }
    });

    socket.on("APPLY_AS_VALUE", (playerId, cardSuit, value) => {
      game.applyAs(playerId, cardSuit, value);
    });

    socket.on("STAND", (playerId) => {
      const result = game.playerStand(playerId);

      io.emit("PLAYER_STOOD", result);

      console.log(`Le joueur ${playerId} a choisi de rester`);

      emitDealerStateIfNeeded();
      emitGameResultsIfReady();
    });

    socket.on("DEALER_PLAY", () => {
      game.dealerPlay();
      console.log("Le dealer joue");
    });

    socket.on("disconnect", (reason) => {
      const player = playerList.find((entry) => entry.socketId === socket.id);
      playerList = playerList.filter((entry) => entry.socketId !== socket.id);

      if (!player) {
        console.log("Socket déconnecté sans joueur associé :", reason);
        return;
      }

      console.log(`Un joueur (${player.name}) c'est deconncté : `, reason);
      game.removePlayer(player.playerId);
    });
  });
}
