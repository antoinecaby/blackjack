export default class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.isRevealed = false;
    this.aceValue = 11;
  }

  reveal() {
    this.isRevealed = true;
  }

  setAceValue(value) {
    this.aceValue = value;
  }
}
