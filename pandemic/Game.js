"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
/*
 * Functionality of Game Module:
 *
 * Create, delete and get players
 *
 * Get and update outbreak indicator
 *
 * Get and update infection rate indicator
 *
 * Get and update cursed discovered indicator
 *
 * Get and put card onto infection draw pile
 *
 * Get and put card onto infection discard pile
 *
 * Get and put card onto player draw pile
 *
 * Get and put card donto player discard pile
 *
 * Get city from board
 *
 * Holds a count of placed research stations
 *
 * Need some kind of builder to setup the game
 */
const path_1 = __importDefault(require("path"));
const CityNetwork_1 = require("./CityNetwork");
const Player_1 = require("./Player");
const CardStack_1 = require("./CardStack");
const cityDataFilePath = path_1.default.resolve(__dirname, "data/cities.json");
const playerCardDataFilePath = path_1.default.resolve(__dirname, "data/playerCards.json");
const infectionCardDataFilePath = path_1.default.resolve(__dirname, "data/infectionCards.json");
const setupGameProps = [
    "state",
    "infectionRate",
    "outbreaks",
    "curesDiscovered",
    "researchStationsPlaced",
    "difficulty",
];
exports.Game = {
    initialise() {
        return ConcreteGame.initialise();
    },
};
class ConcreteGame {
    constructor() {
        this.id = ConcreteGame.nextId++;
        this.state = "setting-up";
        this.infectionRate = 0;
        this.outbreaks = 0;
        this.curesDiscovered = 0;
        this.researchStationsPlaced = 0;
        this.cities = CityNetwork_1.CityNetwork.buildFromFile(cityDataFilePath);
        this.playerCardPile = CardStack_1.CardStack.buildFromFile(playerCardDataFilePath);
        this.playerCardDiscardedPile = CardStack_1.CardStack.buildEmptyStack();
        this.infectionCardPile = CardStack_1.CardStack.buildFromFile(infectionCardDataFilePath);
        this.infectionCardDiscardedPile =
            CardStack_1.CardStack.buildEmptyStack();
        this.players = new Map();
    }
    static initialise() {
        return new ConcreteGame();
    }
    setup() { }
    withPlayer(name) {
        if (this.players.has(name)) {
            throw new Error(`Player with name '${name}' already exists`);
        }
        if (this.players.size >= 4) {
            throw new Error("Cannot add player. Can only have 4 players");
        }
        const newPlayer = Player_1.Player.create(name)
            .withRole("unassigned")
            .withStartingLocation("atalanta")
            .ready();
        this.players.set(name, newPlayer);
        return this;
    }
    removePlayer(name) {
        this.players.delete(name);
        return this;
    }
    withDifficulty(difficulty) {
        this.difficulty = difficulty;
        return this;
    }
    start() {
        for (const prop of setupGameProps) {
            if (this[prop] === undefined) {
                throw new Error(`Cannot start game. Missing property ${prop}`);
            }
        }
        if (this.players.size < 2) {
            throw new Error(`Cannot start game. Not enough players. Currently ${this.players.size} but need between 2 and 4`);
        }
        // hand out cards and setup setups
        // change state to in progress
        this.state = "in-progress";
        return this;
    }
    complete() {
        this.state = "completed";
        return this;
    }
}
ConcreteGame.nextId = 0;
