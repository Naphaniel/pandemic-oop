"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const cannotActOnPlayerError = (player) => new Error(`Cannot act on player: ${player.name}. No actions lef or player is inactive`);
const playerAlreadyAtCityError = (player) => new Error(`Invalid move. ${player.name} is already at ${player.location.name}`);
const playerDoesNotNeighbourCityError = (player, city) => new Error(`Invalid move. ${player.location.name} does not neighbour ${typeof city === "string" ? city : city.name}`);
const playerDoesNotHaveCardError = (player, city) => new Error(`Invalid move. ${player.name} does not have the card to travel to ${typeof city === "string" ? city : city.name}`);
const playersCityDoesNotHaveResearchStationError = (player) => new Error(`Invalid move. ${player.name}'s current city (${player.location.name})` +
    "does not have  a research station");
class Player {
    get isActionable() {
        return (this.state === "active" &&
            this.movesTakenInTurn < Player.MAX_ACTIONS_PER_TURN);
    }
    constructor(game, name, role, location) {
        this.game = game;
        this.name = name;
        this.role = role;
        this.cards = [];
        this.state = "inactive";
        this.movesTakenInTurn = 0;
        this.location = this.game.cities.getCityByName(location);
    }
    isPlayerAtDifferentCity(city) {
        return typeof city === "string"
            ? city !== this.location.name
            : city !== this.location;
    }
    checkValidMovement(city) {
        if (!this.isActionable) {
            throw cannotActOnPlayerError(this);
        }
        if (!this.isPlayerAtDifferentCity(city)) {
            throw playerAlreadyAtCityError(this);
        }
    }
    discardCard(card) {
        this.cards.splice(this.cards.indexOf(card), 1);
        this.game.playerCardDiscardedPile.put(card);
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
    driveTo(city) {
        this.checkValidMovement(city);
        if (!this.game.cities.areCitiesNeighbours(this.location, city)) {
            throw playerDoesNotNeighbourCityError(this, city);
        }
        const newCity = typeof city === "string" ? this.game.cities.getCityByName(city) : city;
        this.location = newCity;
        this.movesTakenInTurn++;
        return this;
    }
    takeDirectFlightTo(city) {
        this.checkValidMovement(city);
        const card = this.cards.find((card) => {
            if (card.city === undefined) {
                return false;
            }
            return typeof city === "string"
                ? card.city === city
                : card.city === city.name;
        });
        if (card === undefined) {
            throw playerDoesNotHaveCardError(this, city);
        }
        const newCity = typeof city === "string" ? this.game.cities.getCityByName(city) : city;
        this.location = newCity;
        this.discardCard(card);
        this.movesTakenInTurn++;
        return this;
    }
    takeCharterFlightTo(city) {
        this.checkValidMovement(city);
        const card = this.cards.find((card) => {
            if (card.city === undefined) {
                return false;
            }
            return card.city === this.location.name;
        });
        if (card === undefined) {
            throw playerDoesNotHaveCardError(this, city);
        }
        const newCity = typeof city === "string" ? this.game.cities.getCityByName(city) : city;
        this.location = newCity;
        this.discardCard(card);
        this.movesTakenInTurn++;
        return this;
    }
    takeShuttleFlightTo(city) {
        this.checkValidMovement(city);
        if (!this.location.hasResearchStation) {
            throw playersCityDoesNotHaveResearchStationError(this);
        }
        const newCity = typeof city === "string" ? this.game.cities.getCityByName(city) : city;
        this.location = newCity;
        this.movesTakenInTurn++;
        return this;
    }
    pass() {
        this.movesTakenInTurn++;
        return this;
    }
}
exports.Player = Player;
Player.MAX_ACTIONS_PER_TURN = 4;
