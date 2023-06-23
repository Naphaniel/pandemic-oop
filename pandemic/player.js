"use strict";
/*
 * Functionality of Player Module
 *
 * get card from player draw pile
 * discard card from hand and into discard pile
 *
 * Keep track of number of actions used each turn (4 max)
 *
 *
 * Potentially use state pattern to remove actions after 4 actions done
 *
 * Basic Actions:
 *  (Drive) Move to neighoburing city
 *  (Direct flight) Move to a specific city
 *  (Charter Flight) Move to a specific city
 *  (Shuttle Flight) move to a city with research station
 *  Pass
 *
 * Special Actions
 *   Dispatcher - move another player
 *   cure disease
 *
 *
 *  Store location of pawn (city)
 *
 *  Give a from hand to another player
 *
 *  Infectors draw from inection pile
 *  Infectors can add cube to cities
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const NoActionsAvailableError = (playerName) => new Error(`Cannot perform action on ${playerName}. Player is inactive or no actions remaining this turn.`);
const CompletePlayerProps = [
    "playerName",
    "actionsTaken",
    "cards",
    "location",
    "role",
    "actionable",
];
exports.Player = {
    create(playerName) {
        return ConcretePlayer.create(playerName);
    },
};
class ConcretePlayer {
    get actionable() {
        return (this.actionsTaken < ConcretePlayer.maxActionsPerTurn &&
            this.state === "active");
    }
    constructor(playerName) {
        this.playerName = playerName;
        this.actionsTaken = 0;
        this.cards = [];
    }
    static create(playerName) {
        return new ConcretePlayer(playerName);
    }
    withRole(role) {
        this.role = role;
        return this;
    }
    withStartingLocation(city) {
        // TODO: construct city object
        this.location = city;
        return this;
    }
    takeCards(n) {
        // TODO: construct card object
        for (let i = 0; i < n; i++) {
            this.cards.push({ name: `card ${i}`, type: "player", action: "" });
        }
        return this;
    }
    ready() {
        for (const prop of CompletePlayerProps) {
            if (this[prop] === undefined) {
                throw new Error(`Cannot ready player, missing prop ${prop}`);
            }
        }
        this.state = "active";
        return this;
    }
    becomeInfector() {
        this.state = "infector";
        return this;
    }
    endTurn() {
        this.state = "inactive";
        return this;
    }
    drive() {
        if (!this.actionable) {
            throw NoActionsAvailableError(this.playerName);
        }
        // TODO
        this.actionsTaken++;
        return this;
    }
    takeDirectFlight() {
        if (!this.actionable) {
            throw NoActionsAvailableError(this.playerName);
        }
        // TODO
        this.actionsTaken++;
        return this;
    }
    takeCharterFlight() {
        if (!this.actionable) {
            throw NoActionsAvailableError(this.playerName);
        }
        // TODO
        this.actionsTaken++;
        return this;
    }
    takeShuttleFlight() {
        if (!this.actionable) {
            throw NoActionsAvailableError(this.playerName);
        }
        // TODO
        this.actionsTaken++;
        return this;
    }
    buildResearchStation() {
        if (!this.actionable) {
            throw NoActionsAvailableError(this.playerName);
        }
        // TODO
        this.actionsTaken++;
    }
    discoverCure() {
        if (!this.actionable) {
            throw NoActionsAvailableError(this.playerName);
        }
        // TODO
        this.actionsTaken++;
    }
    treatDisease() {
        if (!this.actionable) {
            throw NoActionsAvailableError(this.playerName);
        }
        // TODO
        this.actionsTaken++;
    }
    shareKnowledge() {
        if (!this.actionable) {
            throw NoActionsAvailableError(this.playerName);
        }
        // TODO
        this.actionsTaken++;
    }
    pass() {
        if (!this.actionable) {
            throw NoActionsAvailableError(this.playerName);
        }
        // TODO
        this.actionsTaken++;
    }
    infect() { }
}
ConcretePlayer.maxActionsPerTurn = 4;
