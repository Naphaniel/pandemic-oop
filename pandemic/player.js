"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    get cards() {
        return this._cards;
    }
    constructor(game, name, role, location) {
        this.game = game;
        this.name = name;
        this.role = role;
        this.location = this.game.cities.getCityByName(location);
        this._cards = [];
        this.state = "inactive";
    }
    takeCards(n = 1) {
        const cardsTaken = this.game.playerCardDrawPile.take(n);
        for (const card of cardsTaken) {
            if (card.type === "player") {
                this._cards.push(card);
            }
        }
    }
    startTurn() {
        if (this !== this.game.currentActivePlayer) {
            throw new Error(`Cannot start turn for player: ${this.name}. It is not their turn`);
        }
        return this;
    }
    endTurn() {
        if (this === this.game.currentActivePlayer) {
            throw new Error(`Cannot end turn for player: ${this.name}. It is still their`);
        }
        return this;
    }
}
exports.Player = Player;
