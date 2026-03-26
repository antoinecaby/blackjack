import Card from "./Card.js";
import Deck from "./Deck.js";
import Player from "./Player.js";
import {
  calculateHandValue,
  is21,
  isBlackjack,
  isBust,
  shouldDealerHit,
} from "./Rules.js";

export default class Game {
  constructor() {
    this.players = [];
    this.dealer = new Player(0, "Dealer");
    this.deck = new Deck();
  }
  addPlayer(id, name) {
    const playerExists = this.players.find((p) => p.id === id);
    if (playerExists) {
      return { success: false, message: "Le joueurs est déjà dans la partie" };
    }

    if (this.players.length >= 1) {
      return { success: false, message: "La table est pleine" };
    }

    const player = new Player(id, name);
    this.players.push(player);
    return { success: true, player };
  }

  removePlayer(id) {
    this.players = this.players.filter((player) => player.id !== id);
  }

  restart(playerId, name) {
    this.players.length = 0;
    this.addPlayer(playerId, name);
    this.start();
  }
  start() {
    this.dealer = new Player(0, "Dealer");
    this.deck = new Deck();

    this.dealInitialCards();
  }

  dealInitialCards() {
    this.deck.shuffle();
    this.players.forEach((player) => {
      this.playerHit(player.id);
      this.playerHit(player.id);
    });

    this.dealer.addCard(this.deck.draw());
    this.dealer.addCard(this.deck.draw());
    this.dealer.hand[0].reveal();
  }

  playerHit(playerId) {
    const player = this.players.find((p) => p.id === playerId);

    let result;
    let card = this.deck.draw();

    if (player && player.status === "playing") {
      if (card.isAs()) {
        result = {
          status: "playing",
          score: calculateHandValue(player.hand),
          card: card,
        };
      } else {
        player.addCard(card);

        let score = calculateHandValue(player.hand);

        if (isBust(player.hand)) {
          player.changeStatus("bust");
          result = { status: "bust", score: score, card: card };
        }

        if (isBlackjack(player.hand)) {
          player.changeStatus("blackjack");
          result = { status: "blackjack", score: score, card: card };
        }

        if (is21(player.hand)) {
          player.changeStatus("stood");
          result = { status: "stood", score: score, card: card };
        }
        result = {
          status: player.status,
          score: score ?? calculateHandValue(player.hand),
          card: card,
        };
      }
    } else card = {};

    result = {
      status: player.status,
      score: calculateHandValue(player.hand),
      card: card,
    };
    return result;
  }

  playerStand(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (player && player.status === "playing") {
      player.changeStatus("stood");
      console.log("Envoyer le résultat de stand au client");
      return { status: "stood", score: calculateHandValue(player.hand) };
    }
  }

  applyAs(playerId, cardSuit, value) {
    const player = this.players.find((p) => p.id === playerId);
    player.addCard(new Card(cardSuit, "A", value));
  }

  dealerPlay() {
    if (this.players.every((player) => player.status !== "playing")) {
      this.dealer.changeStatus("stood");
      return { status: "stood", score: calculateHandValue(this.dealer.hand) };
    }

    while (shouldDealerHit(this.dealer.hand)) {
      const card = this.deck.draw();
      if (card.isAs() && calculateHandValue(this.dealer.hand) > 10) {
        card.value = 1;
      } else card.value = card.rank === "A" ? 11 : card.value;

      this.dealer.addCard(card);
      if (isBust(this.dealer.hand)) {
        this.dealer.changeStatus("bust");
        return {
          status: "bust",
          score: calculateHandValue(this.dealer.hand),
          card: card,
        };
      }
    }
    if (this.dealer.status !== "bust") {
      this.dealer.changeStatus("stood");
      return {
        status: "stood",
        score: calculateHandValue(this.dealer.hand),
        card: card,
      };
    }
    return {
      status: this.dealer.status,
      score: calculateHandValue(this.dealer.hand),
      card: card,
    };
  }

  dealerCanPlay() {
    return (
      this.dealer.status === "playing" &&
      !this.players.some((player) => player.status === "playing")
    );
  }

  calulateResults() {
    if (this.players.some((player) => player.status === "playing")) {
      this.players.forEach((player) =>
        console.log(player.status, calculateHandValue(player.hand)),
      );
      return null;
    }

    let resultats = [];
    this.players.forEach((player) => {
      if (player.status === "bust") {
        player.changeStatus("lost");
        resultats.push({
          player: player.id,
          status: "lost",
          score: calculateHandValue(player.hand),
        });
      } else if (this.dealer.status === "bust") {
        player.changeStatus("win");
        resultats.push({
          player: player.id,
          status: "win",
          score: calculateHandValue(player.hand),
        });
      } else {
        if (
          calculateHandValue(player.hand) > calculateHandValue(this.dealer.hand)
        ) {
          player.changeStatus("win");
          resultats.push({
            player: player.id,
            status: "win",
            score: calculateHandValue(player.hand),
          });
        } else if (
          calculateHandValue(player.hand) < calculateHandValue(this.dealer.hand)
        ) {
          player.changeStatus("lost");
          resultats.push({
            player: player.id,
            status: "lost",
            score: calculateHandValue(player.hand),
          });
        } else {
          player.changeStatus("draw");
          resultats.push({
            player: player.id,
            status: "draw",
            score: calculateHandValue(player.hand),
          });
        }
      }
    });
    return resultats;
  }
}
