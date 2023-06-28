import { PlayerCard } from "./Card";
import { City, CityName } from "./City";
import { DiseaseType } from "./Disease";
import { PlayerAccessibleGame } from "./Game";

const cannotActOnPlayerError = (player: Player): Error =>
  new Error(
    `Cannot act on player: ${player.name}. No actions lef or player is inactive`
  );

const playerAlreadyAtCityError = (player: Player): Error =>
  new Error(
    `Invalid move. ${player.name} is already at ${player.location.name}`
  );

const playerDoesNotNeighbourCityError = (
  player: Player,
  city: City | CityName
): Error =>
  new Error(
    `Invalid move. ${player.location.name} does not neighbour ${
      typeof city === "string" ? city : city.name
    }`
  );

const playerDoesNotHaveCardError = (
  player: Player,
  city: City | CityName
): Error =>
  new Error(
    `Invalid move. ${player.name} does not have needed city card (${
      typeof city === "string" ? city : city.name
    }) to act.`
  );

const playersCityDoesNotHaveResearchStationError = (
  player: Player,
  city: CityName
): Error =>
  new Error(
    `Invalid move. ${player.name}'s current city (${player.location.name})` +
      ` or ${city} does not have  a research station`
  );

type State = "active" | "inactive";

type StateOnlyCity = Readonly<
  Omit<City, "infect" | "buildResearchStation" | "removeResearchStation">
>;

export type Role =
  | "dispatcher"
  | "operations-expert"
  | "scientist"
  | "medic"
  | "researcher"
  | "infector";

export interface BasicPlayer {
  readonly name: string;
  readonly role: Role;
  readonly location: StateOnlyCity;
  readonly state: State;
  readonly cards: readonly PlayerCard[];
  get hasTooManyCards(): boolean;
  get isActionable(): boolean;
}

export interface ActivePlayer extends BasicPlayer {
  readonly movesTakenInTurn: number;
  drawCards(n: number): void;
  discardCards(...cards: PlayerCard[]): ActivePlayer;
  driveTo(city: City | CityName): ActivePlayer;
  takeDirectFlightTo(city: City | CityName): ActivePlayer;
  takeCharterFlightTo(city: City | CityName): ActivePlayer;
  takeShuttleFlightTo(city: City | CityName): ActivePlayer;
  buildResearchStation(replaceCity?: City | CityName): ActivePlayer;
  cureDisease(diseaseType: DiseaseType): ActivePlayer;
  treatDisease(): ActivePlayer;
  shareKnowledgeWith(player: InactivePlayer, card: PlayerCard): ActivePlayer;
  pass(): ActivePlayer;
  endTurn(): Omit<InactivePlayer, "endTurn">;
}

export interface InactivePlayer extends BasicPlayer {
  startTurn(): ActivePlayer;
}

export class Player implements ActivePlayer, InactivePlayer {
  static readonly MAX_ACTIONS_PER_TURN = 4;

  cards: PlayerCard[] = [];
  location: City;
  state: State = "inactive";
  movesTakenInTurn = 0;

  get isActionable(): boolean {
    return (
      this.state === "active" &&
      this.movesTakenInTurn < Player.MAX_ACTIONS_PER_TURN
    );
  }

  get hasTooManyCards(): boolean {
    return this.cards.length > 7;
  }

  constructor(
    public game: PlayerAccessibleGame,
    public name: string,
    public role: Role,
    location: CityName
  ) {
    this.location = this.game.cities.getCityByName(location);
  }

  isPlayerAtDifferentCity(city: City | CityName): boolean {
    return typeof city === "string"
      ? city !== this.location.name
      : city !== this.location;
  }

  checkValidMovement(city: City | CityName): void {
    if (!this.isActionable) {
      throw cannotActOnPlayerError(this);
    }
    if (!this.isPlayerAtDifferentCity(city)) {
      throw playerAlreadyAtCityError(this);
    }
  }

  checkValidNumberOfCards(): void {
    if (this.hasTooManyCards) {
      throw new Error(
        `Player has too many card: ${this.cards.length}. Please discard ${
          this.cards.length - 7
        } cards`
      );
    }
  }

  discardCards(...cards: PlayerCard[]): ActivePlayer {
    this.cards = this.cards.filter((card) => !cards.includes(card));
    for (const card of cards) {
      this.game.playerCardDiscardedPile.put(card);
    }
    return this;
  }

  cardForCityPredicate(city: City | CityName) {
    return (card: PlayerCard) => {
      if (card.city === undefined) {
        return false;
      }
      return typeof city === "string"
        ? card.city === city
        : card.city === city.name;
    };
  }

  cardForDiseaseTypePredicate(diseaseType: DiseaseType) {
    return (card: PlayerCard) => {
      if (card.diseaseType === undefined) {
        return false;
      }
      return card.diseaseType === diseaseType;
    };
  }

  drawCards(n: number = 1): void {
    this.checkValidNumberOfCards();
    const cardsTaken = this.game.playerCardDrawPile.take(n);
    for (const card of cardsTaken) {
      if (card.type === "player") {
        this.cards.push(card);
      }
    }
  }

  startTurn(): ActivePlayer {
    if (this !== this.game.currentActivePlayer) {
      throw new Error(
        `Cannot start turn for player: ${this.name}. It is not their turn`
      );
    }
    return this;
  }

  endTurn(): Omit<InactivePlayer, "endTurn"> {
    this.checkValidNumberOfCards();
    if (this === this.game.currentActivePlayer) {
      throw new Error(
        `Cannot end turn for player: ${this.name}. It is still their`
      );
    }
    return this;
  }

  driveTo(city: City | CityName): ActivePlayer {
    this.checkValidNumberOfCards();
    this.checkValidMovement(city);
    if (!this.game.cities.areCitiesNeighbours(this.location, city)) {
      throw playerDoesNotNeighbourCityError(this, city);
    }
    const newCity =
      typeof city === "string" ? this.game.cities.getCityByName(city) : city;
    this.location = newCity;
    this.movesTakenInTurn++;
    return this;
  }

  takeDirectFlightTo(city: City | CityName): ActivePlayer {
    this.checkValidNumberOfCards();
    this.checkValidMovement(city);
    const card = this.cards.find(this.cardForCityPredicate(city));
    if (card === undefined) {
      throw playerDoesNotHaveCardError(this, city);
    }
    const newCity =
      typeof city === "string" ? this.game.cities.getCityByName(city) : city;
    this.location = newCity;
    this.discardCards(card);
    this.movesTakenInTurn++;
    return this;
  }

  takeCharterFlightTo(city: City | CityName): ActivePlayer {
    this.checkValidNumberOfCards();
    this.checkValidMovement(city);
    const card = this.cards.find(this.cardForCityPredicate(this.location));
    if (card === undefined) {
      throw playerDoesNotHaveCardError(this, city);
    }
    const newCity =
      typeof city === "string" ? this.game.cities.getCityByName(city) : city;
    this.location = newCity;
    this.discardCards(card);
    this.movesTakenInTurn++;
    return this;
  }

  takeShuttleFlightTo(city: City | CityName): ActivePlayer {
    this.checkValidNumberOfCards();
    this.checkValidMovement(city);
    const newCity =
      typeof city === "string" ? this.game.cities.getCityByName(city) : city;
    if (!this.location.hasResearchStation || !newCity.hasResearchStation) {
      throw playersCityDoesNotHaveResearchStationError(this, newCity.name);
    }
    this.location = newCity;
    this.movesTakenInTurn++;
    return this;
  }

  buildResearchStation(replaceCity?: City | CityName): ActivePlayer {
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
        throw new Error(
          `Cannot place research station at: ${this.location.name}. ` +
            "No research stations left to place. "
        );
      }
      const newCity =
        typeof replaceCity === "string"
          ? this.game.cities.getCityByName(replaceCity)
          : replaceCity;
      if (!newCity.hasResearchStation) {
        throw new Error(
          `Cannot place research station at: ${this.location.name}. ${newCity.name}` +
            "does not have a research station to replace"
        );
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

  cureDisease(diseaseType: DiseaseType): ActivePlayer {
    this.checkValidNumberOfCards();
    if (!this.isActionable) {
      throw cannotActOnPlayerError(this);
    }
    if (!this.location.hasResearchStation) {
      throw new Error(
        `Cannot cure disease. ${this.location.name} does not have a research station`
      );
    }
    const cards = this.cards.filter(
      this.cardForDiseaseTypePredicate(diseaseType)
    );
    if (
      !(cards.length >= 5 || (this.role === "scientist" && cards.length >= 4))
    ) {
      throw new Error(
        `Cannot cure disease. Not enough cards to cure ${diseaseType}`
      );
    }
    this.game.diseaseManager.cureDisease(diseaseType);
    this.discardCards(...cards);
    this.movesTakenInTurn++;
    return this;
  }

  treatDisease(): ActivePlayer {
    this.checkValidNumberOfCards();
    if (!this.isActionable) {
      throw cannotActOnPlayerError(this);
    }
    const { diseaseCubeCount, diseaseType } = this.location;
    this.game.diseaseManager.treatDiseaseAt(
      this.location,
      this.role === "medic" ? diseaseCubeCount : 1
    );
    if (
      !(
        this.role === "medic" &&
        this.game.diseaseManager.stateOf(diseaseType) === "cured"
      )
    ) {
      this.movesTakenInTurn++;
    }
    return this;
  }

  shareKnowledgeWith(
    player: InactivePlayer & { cards: PlayerCard[] },
    researcherCard?: PlayerCard
  ): ActivePlayer {
    this.checkValidNumberOfCards();
    if (!this.isActionable) {
      throw cannotActOnPlayerError(this);
    }
    if (this.location !== player.location) {
      throw new Error(
        `Cannot share knowledge between ${this.name} and ${player.name}.` +
          "Players are a in different locations"
      );
    }
    const card =
      this.role === "researcher" && researcherCard !== undefined
        ? this.cards.find((card) => card === researcherCard)
        : this.cards.find(this.cardForCityPredicate(this.location));
    if (card === undefined) {
      throw new Error(
        `Cannot share knowledge between ${this.name} and ${player.name}.` +
          `Player does not have card for ${this.location.name}`
      );
    }
    this.cards.splice(this.cards.indexOf(card), 1);
    player.cards.unshift(card);
    this.movesTakenInTurn++;
    return this;
  }

  pass(): ActivePlayer {
    this.checkValidNumberOfCards();
    this.movesTakenInTurn++;
    return this;
  }
}
