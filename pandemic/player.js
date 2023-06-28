"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const cannotActOnPlayerError = (player) => new Error(`Cannot act on player: ${player.name}. No actions lef or player is inactive`);
const playerAlreadyAtCityError = (player) => new Error(`Invalid move. ${player.name} is already at ${player.location.name}`);
const playerDoesNotNeighbourCityError = (player, city) => new Error(`Invalid move. ${player.location.name} does not neighbour ${typeof city === "string" ? city : city.name}`);
const playerDoesNotHaveCardError = (player, city) => new Error(`Invalid move. ${player.name} does not have needed city card (${typeof city === "string" ? city : city.name}) to act.`);
const playersCityDoesNotHaveResearchStationError = (player, city) => new Error(`Invalid move. ${player.name}'s current city (${player.location.name})` +
    ` or ${city} does not have  a research station`);
class Player {
    get isActionable() {
        return (this.state === "active" &&
            this.movesTakenInTurn < Player.MAX_ACTIONS_PER_TURN);
    }
    get hasTooManyCards() {
        return this.cards.length > 7;
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
    checkValidNumberOfCards() {
        if (this.hasTooManyCards) {
            throw new Error(`Player has too many card: ${this.cards.length}. Please discard ${this.cards.length - 7} cards`);
        }
    }
    discardCards(...cards) {
        this.cards = this.cards.filter((card) => !cards.includes(card));
        for (const card of cards) {
            this.game.playerCardDiscardedPile.put(card);
        }
        return this;
    }
    cardForCityPredicate(city) {
        return (card) => {
            if (card.city === undefined) {
                return false;
            }
            return typeof city === "string"
                ? card.city === city
                : card.city === city.name;
        };
    }
    cardForDiseaseTypePredicate(diseaseType) {
        return (card) => {
            if (card.diseaseType === undefined) {
                return false;
            }
            return card.diseaseType === diseaseType;
        };
    }
    drawCards(n = 1) {
        this.checkValidNumberOfCards();
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
        this.checkValidNumberOfCards();
        if (this === this.game.currentActivePlayer) {
            throw new Error(`Cannot end turn for player: ${this.name}. It is still their`);
        }
        return this;
    }
    driveTo(city) {
        this.checkValidNumberOfCards();
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
        this.checkValidNumberOfCards();
        this.checkValidMovement(city);
        const card = this.cards.find(this.cardForCityPredicate(city));
        if (card === undefined) {
            throw playerDoesNotHaveCardError(this, city);
        }
        const newCity = typeof city === "string" ? this.game.cities.getCityByName(city) : city;
        this.location = newCity;
        this.discardCards(card);
        this.movesTakenInTurn++;
        return this;
    }
    takeCharterFlightTo(city) {
        this.checkValidNumberOfCards();
        this.checkValidMovement(city);
        const card = this.cards.find(this.cardForCityPredicate(this.location));
        if (card === undefined) {
            throw playerDoesNotHaveCardError(this, city);
        }
        const newCity = typeof city === "string" ? this.game.cities.getCityByName(city) : city;
        this.location = newCity;
        this.discardCards(card);
        this.movesTakenInTurn++;
        return this;
    }
    takeShuttleFlightTo(city) {
        this.checkValidNumberOfCards();
        this.checkValidMovement(city);
        const newCity = typeof city === "string" ? this.game.cities.getCityByName(city) : city;
        if (!this.location.hasResearchStation || !newCity.hasResearchStation) {
            throw playersCityDoesNotHaveResearchStationError(this, newCity.name);
        }
        this.location = newCity;
        this.movesTakenInTurn++;
        return this;
    }
    buildResearchStation(replaceCity) {
        this.checkValidNumberOfCards();
        if (!this.isActionable) {
            throw cannotActOnPlayerError(this);
        }
        const card = this.cards.find(this.cardForCityPredicate(this.location));
        if (card === undefined && this.role !== "operations-expert") {
            if (card === undefined) {
                throw playerDoesNotHaveCardError(this, this.location);
            }
        }
        if (this.game.researchStationsPlaced > 6) {
            if (replaceCity === undefined) {
                throw new Error(`Cannot place research station at: ${this.location.name}. ` +
                    "No research stations left to place. ");
            }
            const newCity = typeof replaceCity === "string"
                ? this.game.cities.getCityByName(replaceCity)
                : replaceCity;
            if (!newCity.hasResearchStation) {
                throw new Error(`Cannot place research station at: ${this.location.name}. ${newCity.name}` +
                    "does not have a research station to replace");
            }
            newCity.removeResearchStation();
        }
        if (card !== undefined) {
            this.discardCards(card);
        }
        this.location.buildResearchStation();
        this.movesTakenInTurn++;
        return this;
    }
    cureDisease(diseaseType) {
        this.checkValidNumberOfCards();
        if (!this.isActionable) {
            throw cannotActOnPlayerError(this);
        }
        if (!this.location.hasResearchStation) {
            throw new Error(`Cannot cure disease. ${this.location.name} does not have a research station`);
        }
        const cards = this.cards.filter(this.cardForDiseaseTypePredicate(diseaseType));
        if (!(cards.length >= 5 || (this.role === "scientist" && cards.length >= 4))) {
            throw new Error(`Cannot cure disease. Not enough cards to cure ${diseaseType}`);
        }
        this.game.diseaseManager.cureDisease(diseaseType);
        this.discardCards(...cards);
        this.movesTakenInTurn++;
        return this;
    }
    treatDisease() {
        this.checkValidNumberOfCards();
        if (!this.isActionable) {
            throw cannotActOnPlayerError(this);
        }
        const { diseaseCubeCount, diseaseType } = this.location;
        this.game.diseaseManager.treatDiseaseAt(this.location, this.role === "medic" ? diseaseCubeCount : 1);
        if (!(this.role === "medic" &&
            this.game.diseaseManager.stateOf(diseaseType) === "cured")) {
            this.movesTakenInTurn++;
        }
        return this;
    }
    shareKnowledgeWith(player, researcherCard) {
        this.checkValidNumberOfCards();
        if (!this.isActionable) {
            throw cannotActOnPlayerError(this);
        }
        if (this.location !== player.location) {
            throw new Error(`Cannot share knowledge between ${this.name} and ${player.name}.` +
                "Players are a in different locations");
        }
        const card = this.role === "researcher" && researcherCard !== undefined
            ? this.cards.find((card) => card === researcherCard)
            : this.cards.find(this.cardForCityPredicate(this.location));
        if (card === undefined) {
            throw new Error(`Cannot share knowledge between ${this.name} and ${player.name}.` +
                `Player does not have card for ${this.location.name}`);
        }
        this.cards.splice(this.cards.indexOf(card), 1);
        player.cards.unshift(card);
        this.movesTakenInTurn++;
        return this;
    }
    pass() {
        this.checkValidNumberOfCards();
        this.movesTakenInTurn++;
        return this;
    }
}
exports.Player = Player;
Player.MAX_ACTIONS_PER_TURN = 4;
