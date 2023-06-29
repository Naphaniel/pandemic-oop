"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const path_1 = __importDefault(require("path"));
const City_1 = require("./City");
const Player_1 = require("./Player");
const Card_1 = require("./Card");
const Disease_1 = require("./Disease");
const CITY_DATA_FILE_PATH = path_1.default.resolve(__dirname, "data/cities.json");
const PLAYER_CARD_DATA_FILE_PATH = path_1.default.resolve(__dirname, "data/playerCards.json");
const INFECTION_CARD_DATA_FILE_PATH = path_1.default.resolve(__dirname, "data/infectionCards.json");
const EPIDEMIC_CARD_DATA_FILE_PATH = path_1.default.resolve(__dirname, "data/epidemicCards.json");
const setupGameProps = [
    "state",
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
        this.difficulty = "normal";
        this.cities = City_1.CityNetwork.buildFromFile(CITY_DATA_FILE_PATH);
        this.diseaseManager = new Disease_1.DiseaseManager(this.cities);
        this.playerCardDrawPile = Card_1.CardStack.buildFromFile(PLAYER_CARD_DATA_FILE_PATH);
        this.playerCardDiscardedPile = Card_1.CardStack.buildEmptyStack();
        this.infectionCardDrawPile = Card_1.CardStack.buildFromFile(INFECTION_CARD_DATA_FILE_PATH);
        this.infectionCardDiscardedPile = Card_1.CardStack.buildEmptyStack();
        this.epidemicCardPile = Card_1.CardStack.buildFromFile(EPIDEMIC_CARD_DATA_FILE_PATH);
        this.availableRoles = [
            "medic",
            "scientist",
            "dispatcher",
            "researcher",
            "operations-expert",
        ];
        this.internalPlayers = new Map();
        this.playingOrder = [];
    }
    static initialise() {
        return new ConcreteGame();
    }
    get researchStationsPlaced() {
        return this.cities.researchStations.length;
    }
    get players() {
        return Array.from(this.internalPlayers.values());
    }
    get playerCount() {
        return this.internalPlayers.size;
    }
    assignRandomRole() {
        const idx = Math.floor(Math.random() * this.availableRoles.length);
        return this.availableRoles.splice(idx, 1)[0];
    }
    withPlayer(name) {
        if (this.internalPlayers.has(name)) {
            throw new Error(`Player with name '${name}' already exists`);
        }
        if (this.playerCount >= 4) {
            throw new Error("Cannot add player. Can only have 4 players");
        }
        const player = new Player_1.Player(this, name, this.assignRandomRole(), "atalanta");
        this.internalPlayers.set(name, player);
        return this;
    }
    removePlayer(name) {
        const player = this.internalPlayers.get(name);
        if (player !== undefined) {
            this.availableRoles.push(player.role);
        }
        this.internalPlayers.delete(name);
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
        this.playingOrder = names;
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
        for (const [_, player] of this.internalPlayers) {
            player.drawCards(cardsToTake);
        }
    }
    setupEpidemicCards() {
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
        this.playerCardDrawPile = Card_1.CardStack.merge(splitCardPiles);
    }
    setupInfectionCards() {
        this.infectionCardDrawPile.shuffle();
        for (let i = 3; i > 0; i--) {
            for (const infectionCard of this.infectionCardDrawPile.take(3)) {
                const { city: cityName, diseaseType } = infectionCard;
                const city = this.cities.getCityByName(cityName);
                this.diseaseManager.infect(city, diseaseType, i);
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
        if (this.playingOrder.length !== this.playerCount) {
            this.playingOrder = Array.from(this.internalPlayers.keys());
        }
        const firstPlayer = this.internalPlayers.get(this.playingOrder[0]);
        if (firstPlayer === undefined) {
            throw new Error(`Cannot get player. Player does not exist`);
        }
        this.setupCards();
        firstPlayer.state = "active";
        this.currentActivePlayer = firstPlayer;
        this.cities.getCityByName("atalanta").buildResearchStation();
        this.state = "in-progress";
        return this;
    }
    player(name) {
        const player = this.internalPlayers.get(name);
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
