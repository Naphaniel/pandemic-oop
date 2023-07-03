import { CardStack, EpidemicCard, InfectionCard, PlayerCard } from "./Card";
import { City, CityName, ReadonlyCity, CityNetwork } from "./City";
import { DiseaseManager, DiseaseType } from "./Disease";

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

export interface PlayerObserver {
  onTurnStart(player: Player): void;
  onTurnEnd(player: Player): void;
  onNoPlayerCards(): void;
}

export interface BasicPlayer {
  readonly name: string;
  readonly role: Role;
  readonly location: ReadonlyCity;
  readonly state: State;
  readonly cards: readonly PlayerCard[];
  readonly hasTooManyCards: boolean;
  readonly isActionable: boolean;
}

interface ActionStage extends BasicPlayer {
  readonly movesTakenInTurn: number;
  discardCards(...cards: PlayerCard[]): this;
  driveTo(city: City | ReadonlyCity | CityName): ActionStage;
  takeDirectFlightTo(city: City | ReadonlyCity | CityName): ActionStage;
  takeCharterFlightTo(city: City | ReadonlyCity | CityName): ActionStage;
  takeShuttleFlightTo(city: City | ReadonlyCity | CityName): ActionStage;
  buildResearchStation(
    replaceCity?: City | ReadonlyCity | CityName
  ): ActionStage;
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

type GameConfig = {
  cityNetwork: CityNetwork;
  diseaseManager: DiseaseManager;
  playerCardDrawPile: CardStack<PlayerCard | EpidemicCard>;
  playerCardDiscardedPile: CardStack<PlayerCard | EpidemicCard>;
  infectionCardDrawPile: CardStack<InfectionCard>;
  infectionCardDiscardedPile: CardStack<InfectionCard>;
};

export class Player
  implements ActionStage, DrawStage, InfectorStage, InactiveStage
{
  static readonly MAX_ACTIONS_PER_TURN = 4;

  observers: PlayerObserver[];
  cards: PlayerCard[];
  location: City;
  state: State;
  cityNetwork: CityNetwork;
  diseaseManager: DiseaseManager;
  playerCardDrawPile: CardStack<PlayerCard | EpidemicCard>;
  playerCardDiscardedPile: CardStack<PlayerCard | EpidemicCard>;
  infectionCardDrawPile: CardStack<InfectionCard>;
  infectionCardDiscardedPile: CardStack<InfectionCard>;
  movesTakenInTurn: number;
  playerCardsDrawnInTurn: number;
  hasDrawnInfectionCards: boolean;

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
    public name: string,
    public role: Role,
    location: CityName,
    gameConfig: GameConfig
  ) {
    this.observers = [];
    this.cards = [];
    this.state = "inactive";
    this.movesTakenInTurn = 0;
    this.playerCardsDrawnInTurn = 0;
    this.hasDrawnInfectionCards = false;

    this.cityNetwork = gameConfig.cityNetwork;
    this.diseaseManager = gameConfig.diseaseManager;
    this.playerCardDrawPile = gameConfig.playerCardDrawPile;
    this.playerCardDiscardedPile = gameConfig.playerCardDiscardedPile;
    this.infectionCardDrawPile = gameConfig.infectionCardDrawPile;
    this.infectionCardDiscardedPile = gameConfig.infectionCardDiscardedPile;

    this.location = this.cityNetwork.getCityByName(location);
  }

  registerObserver(observer: PlayerObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: PlayerObserver): void {
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
    this.cards = this.cards.filter((card) => !cards.includes(card));
    for (const card of cards) {
      this.playerCardDiscardedPile.put(card);
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
    if (this.playerCardDrawPile.contents.length < n) {
      this.notifyNoPlayerCards();
    }
    const cardsTaken = this.playerCardDrawPile.take(n);
    for (const card of cardsTaken) {
      if (card.type === "player") {
        this.cards.push(card);
      }
      if (card.type === "epidemic") {
        const [infectionCard] = this.infectionCardDrawPile.take();
        const city = this.cityNetwork.getCityByName(infectionCard.city);
        this.diseaseManager.epidemicAt(city, infectionCard.diseaseType, 3);
        this.playerCardDiscardedPile.put(card);
        this.infectionCardDiscardedPile.shuffle();
        const combinedInfectionPile = CardStack.merge<InfectionCard>([
          this.infectionCardDiscardedPile,
          this.infectionCardDrawPile,
        ]);
        this.infectionCardDrawPile = combinedInfectionPile;
        this.infectionCardDiscardedPile.clear();
      }
    }
    this.playerCardsDrawnInTurn += n;
    return this;
  }

  notifyNoPlayerCards(): void {
    for (const observer of this.observers) {
      observer.onNoPlayerCards();
    }
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
    if (!this.cityNetwork.areCitiesNeighbours(this.location, city)) {
      throw playerDoesNotNeighbourCityError(this, city);
    }
    const newCity =
      typeof city === "string" ? this.cityNetwork.getCityByName(city) : city;
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
      typeof city === "string" ? this.cityNetwork.getCityByName(city) : city;
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
      typeof city === "string" ? this.cityNetwork.getCityByName(city) : city;
    this.location = newCity;
    this.discardCards(card);
    this.movesTakenInTurn++;
    return this;
  }

  takeShuttleFlightTo(city: City | CityName): ActionStage {
    this.checkValidNumberOfCards();
    this.checkValidMovement(city);
    const newCity =
      typeof city === "string" ? this.cityNetwork.getCityByName(city) : city;
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
    if (this.cityNetwork.researchStationsPlaced > 6) {
      if (replaceCity === undefined) {
        throw new Error(
          `Cannot place research station at: ${this.location.name}. ` +
            "No research stations left to place. "
        );
      }
      const newCity =
        typeof replaceCity === "string"
          ? this.cityNetwork.getCityByName(replaceCity)
          : replaceCity;
      if (!newCity.hasResearchStation) {
        throw new Error(
          `Cannot place research station at: ${this.location.name}. ${newCity.name}` +
            "does not have a research station to replace"
        );
      }
      newCity.hasResearchStation = false;
    }
    if (card !== undefined) {
      this.discardCards(card);
    }
    this.location.hasResearchStation = true;
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
    this.diseaseManager.cureDisease(diseaseType);
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
    this.diseaseManager.treatDiseaseAt(
      this.location,
      diseaseType,
      this.role === "medic"
        ? this.location.diseaseCubeCount.get(diseaseType)
        : 1
    );
    if (
      !(
        this.role === "medic" &&
        this.diseaseManager.getStateOf(diseaseType) === "cured"
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
    const infectionCards = this.infectionCardDrawPile.take(
      this.diseaseManager.infectionRate
    );
    for (const card of infectionCards) {
      const { city: cityName, diseaseType } = card;
      const city = this.cityNetwork.getCityByName(cityName);
      this.diseaseManager.infect(city, diseaseType);
      this.infectionCardDiscardedPile.put(card);
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
