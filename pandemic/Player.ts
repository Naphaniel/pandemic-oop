import { CardStack, InfectionCard, PlayerCard } from "./Card";
import { City, CityName, StateOnlyCity } from "./City";
import { DiseaseType } from "./Disease";
import { PlayerAccessibleGame } from "./Game";

const cannotActOnPlayerError = (player: Player): Error =>
  new Error(
    `Cannot act on player: ${player.name}. No actions left or it is not their turn`
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

export type Role =
  | "dispatcher"
  | "operations-expert"
  | "scientist"
  | "medic"
  | "researcher"
  | "infector";

export interface TurnObserver {
  onTurnStart(player: Player): void;
  onTurnEnd(player: Player): void;
}

export interface ObservablePlayer {
  registerObserver(observer: TurnObserver): void;
  removeObserver(observer: TurnObserver): void;
  notifyStartTurn(): void;
  notifyEndTurn(): void;
}

export interface BasicPlayer {
  readonly name: string;
  readonly role: Role;
  readonly location: StateOnlyCity;
  readonly state: State;
  readonly cards: readonly PlayerCard[];
  get hasTooManyCards(): boolean;
  get isActionable(): boolean;
}

interface ActionStage extends BasicPlayer {
  readonly movesTakenInTurn: number;
  discardCards(...cards: PlayerCard[]): this;
  driveTo(city: City | CityName): ActionStage;
  takeDirectFlightTo(city: City | CityName): ActionStage;
  takeCharterFlightTo(city: City | CityName): ActionStage;
  takeShuttleFlightTo(city: City | CityName): ActionStage;
  buildResearchStation(replaceCity?: City | CityName): ActionStage;
  cureDisease(diseaseType: DiseaseType): ActionStage;
  treatDisease(diseaseType: DiseaseType): ActionStage;
  shareKnowledgeWith(player: InactiveStage, card: PlayerCard): ActionStage;
  pass(): ActionStage;
  finishActionStage(): DrawStage;
}

interface DrawStage extends BasicPlayer {
  readonly playerCardsDrawnInTurn: number;
  drawCards(n: number): DrawStage;
  discardCards(...cards: PlayerCard[]): this;
  finishDrawStage(): InfectorStage;
}

interface InfectorStage extends BasicPlayer {
  readonly hasDrawnInfectionCards: boolean;
  drawInfectionCards(): InfectorStage;
  endTurn(): InactiveStage;
}

interface InactiveStage extends BasicPlayer {
  startTurn(): ActionStage;
}

export type ActivePlayer = ActionStage | DrawStage | InfectorStage;
export type InactivePlayer = InactiveStage;

export class Player
  implements
    ActionStage,
    DrawStage,
    InfectorStage,
    InactiveStage,
    ObservablePlayer
{
  static readonly MAX_ACTIONS_PER_TURN = 4;

  observers: TurnObserver[] = [];

  cards: PlayerCard[] = [];
  location: City;
  state: State = "inactive";
  movesTakenInTurn = 0;
  playerCardsDrawnInTurn = 0;
  hasDrawnInfectionCards = false;

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

  registerObserver(observer: TurnObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: TurnObserver): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
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

  discardCards(...cards: PlayerCard[]): this {
    if (!this.hasTooManyCards) {
      throw new Error(
        "Cannot discard cards. You can only discard if you have > 7"
      );
    }
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

  drawCards(n: number = 1): DrawStage {
    this.checkValidNumberOfCards();
    if (this.playerCardsDrawnInTurn + n > 2 && this.state === "active") {
      throw new Error(
        `Cannot draw ${n} cards. Only ${
          2 - this.playerCardsDrawnInTurn
        } draws left`
      );
    }
    if (this.game.playerCardDrawPile.contents.length < n) {
      // GAME OVER - what do here?
      throw new Error("GAME OVER!");
    }
    const cardsTaken = this.game.playerCardDrawPile.take(n);
    for (const card of cardsTaken) {
      if (card.type === "player") {
        this.cards.push(card);
      }
      if (card.type === "epidemic") {
        const [infectionCard] = this.game.infectionCardDrawPile.take();
        const city = this.game.cities.getCityByName(infectionCard.city);
        this.game.diseaseManager.epidemicAt(city, infectionCard.diseaseType, 3);
        this.game.playerCardDiscardedPile.put(card);
        this.game.infectionCardDiscardedPile.shuffle();
        const combinedInfectionPile = CardStack.merge<InfectionCard>([
          this.game.infectionCardDiscardedPile,
          this.game.infectionCardDrawPile,
        ]);
        this.game.infectionCardDrawPile = combinedInfectionPile;
        this.game.infectionCardDiscardedPile.clear();
      }
    }
    this.playerCardsDrawnInTurn += n;
    return this;
  }

  startTurn(): ActionStage {
    if (!this.isActionable) {
      throw new Error(
        `Cannot start turn for player: ${this.name}. It is not their turn`
      );
    }
    this.notifyStartTurn();
    this.playerCardsDrawnInTurn = 0;
    this.movesTakenInTurn = 0;
    return this;
  }

  notifyStartTurn(): void {
    for (const observer of this.observers) {
      observer.onTurnStart(this);
    }
  }

  endTurn(): InactiveStage {
    if (!this.hasDrawnInfectionCards) {
      throw new Error(
        `Cannot end turn. ${this.name} has not drawn infection cards`
      );
    }
    this.notifyEndTurn();
    this.state = "inactive";
    return this;
  }

  notifyEndTurn(): void {
    for (const observer of this.observers) {
      observer.onTurnEnd(this);
    }
  }

  driveTo(city: City | CityName): ActionStage {
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

  takeDirectFlightTo(city: City | CityName): ActionStage {
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

  takeCharterFlightTo(city: City | CityName): ActionStage {
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

  takeShuttleFlightTo(city: City | CityName): ActionStage {
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

  buildResearchStation(replaceCity?: City | CityName): ActionStage {
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

  cureDisease(diseaseType: DiseaseType): ActionStage {
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

  treatDisease(diseaseType: DiseaseType): ActionStage {
    this.checkValidNumberOfCards();
    if (!this.isActionable) {
      throw cannotActOnPlayerError(this);
    }
    if (!this.location.isInfectedWith(diseaseType)) {
      throw new Error(
        `Cannot treat disease. ${this.location.name} is not infected with ${diseaseType}`
      );
    }
    this.game.diseaseManager.treatDiseaseAt(
      this.location,
      diseaseType,
      this.role === "medic"
        ? this.location.diseaseCubeCount.get(diseaseType)
        : 1
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
    player: InactiveStage & { cards: PlayerCard[] },
    researcherCard?: PlayerCard
  ): ActionStage {
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

  pass(): ActionStage {
    if (!this.isActionable) {
      throw cannotActOnPlayerError(this);
    }
    this.checkValidNumberOfCards();
    this.movesTakenInTurn++;
    return this;
  }

  drawInfectionCards(): InfectorStage {
    if (this.hasDrawnInfectionCards) {
      throw new Error(
        `Cannot draw infection cards. ${this.name} has already taken cards`
      );
    }
    const infectionCards = this.game.infectionCardDrawPile.take(
      this.game.diseaseManager.infectionRate
    );
    for (const card of infectionCards) {
      const { city: cityName, diseaseType } = card;
      const city = this.game.cities.getCityByName(cityName);
      this.game.diseaseManager.infect(city, diseaseType);
      this.game.infectionCardDiscardedPile.put(card);
      this.hasDrawnInfectionCards = true;
    }
    return this;
  }

  finishActionStage(): DrawStage {
    if (this.isActionable) {
      throw new Error(
        `Cannot finish action stage. ${this.name} has ${
          Player.MAX_ACTIONS_PER_TURN - this.movesTakenInTurn
        } moves left`
      );
    }
    return this;
  }

  finishDrawStage(): InfectorStage {
    if (this.playerCardsDrawnInTurn < 2) {
      throw new Error(
        `Cannot finish draw stage. ${this.name} has not taken 2 cards`
      );
    }
    return this;
  }
}
