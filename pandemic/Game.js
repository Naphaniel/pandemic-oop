"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const path_1 = __importDefault(require("path"));
const CityNetwork_1 = require("./CityNetwork");
const Player_1 = require("./Player");
const CardStack_1 = require("./CardStack");
const cityDataFilePath = path_1.default.resolve(__dirname, "data/cities.json");
const playerCardDataFilePath = path_1.default.resolve(__dirname, "data/playerCards.json");
const infectionCardDataFilePath = path_1.default.resolve(__dirname, "data/infectionCards.json");
const epidemicCardDataFilePath = path_1.default.resolve(__dirname, "data/epidemicCards.json");
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
    get players() {
        return Array.from(this._players.values());
    }
    get playerCount() {
        return this._players.size;
    }
    get playingOrder() {
        return this._playingOrder;
    }
    constructor() {
        this.id = ConcreteGame.nextId++;
        this.state = "setting-up";
        this.infectionRate = 0;
        this.outbreaks = 0;
        this.curesDiscovered = 0;
        this.researchStationsPlaced = 0;
        this.availableRoles = [
            "medic",
            "scientist",
            "dispatcher",
            "researcher",
            "operations-expert",
        ];
        this.cities = CityNetwork_1.CityNetwork.buildFromFile(cityDataFilePath);
        this.playerCardDrawPile = CardStack_1.CardStack.buildFromFile(playerCardDataFilePath);
        this.playerCardDiscardedPile = CardStack_1.CardStack.buildEmptyStack();
        this.infectionCardDrawPile = CardStack_1.CardStack.buildFromFile(infectionCardDataFilePath);
        this.infectionCardDiscardedPile =
            CardStack_1.CardStack.buildEmptyStack();
        this.epidemicCardPile = CardStack_1.CardStack.buildFromFile(epidemicCardDataFilePath);
        this._players = new Map();
        this._playingOrder = [];
    }
    static initialise() {
        return new ConcreteGame();
    }
    assignRandomRole() {
        const idx = Math.floor(Math.random() * this.availableRoles.length);
        return this.availableRoles.splice(idx, 1)[0];
    }
    withPlayer(name) {
        if (this._players.has(name)) {
            throw new Error(`Player with name '${name}' already exists`);
        }
        if (this.playerCount >= 4) {
            throw new Error("Cannot add player. Can only have 4 players");
        }
        const player = new Player_1.Player(this, name, this.assignRandomRole(), "atalanta");
        this._players.set(name, player);
        return this;
    }
    removePlayer(name) {
        const player = this._players.get(name);
        if (player !== undefined) {
            this.availableRoles.push(player.role);
        }
        this._players.delete(name);
        return this;
    }
    withDifficulty(difficulty) {
        this.difficulty = difficulty;
        return this;
    }
    withPlayingOrder(names) {
        const playerNames = this.players.map((player) => player.name);
        const uniqueNames = new Set(names);
        if (uniqueNames.size !== this.playerCount) {
            throw new Error(`Cannot set playing order: ${names}. Names do not match registered players ${playerNames}`);
        }
        if (!names.every((val) => playerNames.includes(val))) {
            throw new Error(`Cannot set playing order to: ${names}. Cannot set order for non-existing players`);
        }
        this._playingOrder = names;
        return this;
    }
    validateGameState() {
        for (const prop of setupGameProps) {
            if (this[prop] === undefined) {
                throw new Error(`Cannot start game. Missing property ${prop}`);
            }
        }
        if (this.playerCount < 2) {
            throw new Error(`Cannot start game. Not enough players. Currently ${this.playerCount} but need between 2 and 4`);
        }
    }
    setupPlayerCards() {
        const cardsToTake = this.playerCount === 4 ? 2 : this.playerCount === 3 ? 3 : 4;
        this.playerCardDrawPile.shuffle();
        for (const [_, player] of this._players) {
            player.takeCards(cardsToTake);
        }
    }
    setupEpidemicCards() {
        if (this.difficulty === undefined) {
            throw new Error("Cannot deal epidemic cards. Difficulty not set.");
        }
        const splitCount = this.difficulty === "introduction"
            ? 4
            : this.difficulty === "normal"
                ? 5
                : 6;
        const splitCardPiles = this.playerCardDrawPile.split(splitCount);
        for (const cardPile of splitCardPiles) {
            const epidemicCard = this.epidemicCardPile.take(1)[0];
            cardPile.put(epidemicCard);
            cardPile.shuffle();
        }
        this.playerCardDrawPile = CardStack_1.CardStack.merge(splitCardPiles);
    }
    setupInfectionCards() {
        this.infectionCardDrawPile.shuffle();
        for (let i = 3; i > 0; i--) {
            for (const infectionCard of this.infectionCardDrawPile.take(3)) {
                const { city: cityName, diseaseType } = infectionCard;
                this.cities.infectCity(cityName, diseaseType, i);
            }
        }
    }
    setupCards() {
        this.setupPlayerCards();
        this.setupEpidemicCards();
        this.setupInfectionCards();
    }
    start() {
        this.validateGameState();
        if (this._playingOrder.length !== this.playerCount) {
            this._playingOrder = Array.from(this._players.keys());
        }
        const firstPlayer = this._players.get(this._playingOrder[0]);
        if (firstPlayer === undefined) {
            throw new Error(`Cannot get player. Player does not exist`);
        }
        firstPlayer.state = "active";
        this.currentActivePlayer = firstPlayer;
        this.setupCards();
        this.state = "in-progress";
        return this;
    }
    player(name) {
        const player = this._players.get(name);
        if (player === undefined) {
            throw new Error("Cannot get player: ${name}. Player does not exist");
        }
        return player;
    }
    complete() {
        this.state = "completed";
        return this;
    }
}
ConcreteGame.nextId = 0;
