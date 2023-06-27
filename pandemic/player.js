"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(game, name, role, location) {
        this.game = game;
        this.name = name;
        this.role = role;
        this.cards = [];
        this.state = "inactive";
        this.location = this.game.cities.getCityByName(location);
    }
    takeCards(n = 1) {
        const cardsTaken = this.game.playerCardDrawPile.take(n);
        for (const card of cardsTaken) {
            if (card.type === "player") {
                this.cards.push(card);
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
