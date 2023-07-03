import { CardStack, EpidemicCard, InfectionCard, PlayerCard } from "./Card";
import { City, CityName, ReadonlyCity, CityNetwork } from "./City";
import { DiseaseManager, DiseaseType } from "./Disease";

/**
 * Cannot act on player if no actions left error.
 */
const cannotActOnPlayerError = (player: Player): Error =>
  new Error(
    `Cannot act on player: ${player.name}. No actions left or it is not their turn`
  );

/**
 * Cannot move player as player is already at location error.
 */
const playerAlreadyAtCityError = (player: Player): Error =>
  new Error(
    `Invalid move. ${player.name} is already at ${player.location.name}`
  );

/**
 * Cannot move player as player does not neighbour city error.
 */
const playerDoesNotNeighbourCityError = (
  player: Player,
  city: City | CityName
): Error =>
  new Error(
    `Invalid move. ${player.location.name} does not neighbour ${
      typeof city === "string" ? city : city.name
    }`
  );

/**
 * Cannot move player as player does not have required card error.
 */
const playerDoesNotHaveCardError = (
  player: Player,
  city: City | CityName
): Error =>
  new Error(
    `Invalid move. ${player.name} does not have needed city card (${
      typeof city === "string" ? city : city.name
    }) to act.`
  );

/**
 * Cannot move player as city does not have a research station error.
 */
const playersCityDoesNotHaveResearchStationError = (
  player: Player,
  city: CityName
): Error =>
  new Error(
    `Invalid move. ${player.name}'s current city (${player.location.name})` +
      ` or ${city} does not have  a research station`
  );

/**
 * Type of {@link Player} states.
 *
 * @remarks
 * @see use in {@link Player.state}.
 */
type State = "active" | "inactive";

/**
 * Type of {@link Player} roles.
 *
 * @remarks
 * @see use in {@link Player.role}
 */
export type Role =
  | "dispatcher"
  | "operations-expert"
  | "scientist"
  | "medic"
  | "researcher"
  | "infector";

/**
 * External interface used as part of the **Observer (pub-sub) Pattern**
 * Classes that implement this interface will fulfill this contract and can
 * be considered as {@link PlayerObserver}. Classes that are registered as
 * {@link PlayerObserver} will be notified on 3 events related to Players.
 * In this case, the Game state classs implements this interface to determine
 * win/loss game states and player turns.
 *
 * Following this approarch means that the {@link PlayerObserver} is not
 * strongly coupled through a strong reference to an observer (such as the game)
 * and instead we can simply send events to anyone registered.
 */
export interface PlayerObserver {
  onTurnStart(player: Player): void;
  onTurnEnd(player: Player): void;
  onNoPlayerCards(): void;
}

/**
 * Exported interface representing a basic {@link Player} exposing members
 * relevant to all {@link State}:
 * - {@link Player.name}, readonly player name.
 * - {@link Player.role}, readonly player role.
 * - {@link Player.location}, readonly players location.
 * - {@link Player.state}, readonly players state.
 * - {@link Player.cards}, readonly array containing the players hand.
 * - {@link Player.hasTooManyCards}, readonly boolean flag determining if the
 *   player has too many cards.
 * - {@link Player.isActionable}, readonly boolean flag determining whether the
 *   player can perform an action.
 *
 * @remarks
 * In a similar pattern to {@link ConcreteGame} we use some form of the
 * **State Pattern** to only expose relevant members based on the Players state.
 *
 * @see {@link ActivePlayer} and {@link InactivePlayer} for those types of player.
 */
export interface BasicPlayer {
  readonly name: string;
  readonly role: Role;
  readonly location: ReadonlyCity;
  readonly state: State;
  readonly cards: readonly PlayerCard[];
  readonly hasTooManyCards: boolean;
  readonly isActionable: boolean;
}

/**
 * Type of {@link Player} active stages.
 *
 * @remarks
 * We use a similar **State Pattern** here like we use in {@link ConcreteGame}
 * to progress through the lifecycle of a player. However, instead of using
 * the companion object pattern here to avoid exposing the concrete implementation,
 * we use multiple interfaces {@link ActionStage}, {@link DrawStage}, {@link InfectorStage}
 * and {@link InactiveStage} to only expose the members that are relevant to each
 * stage.
 */
export type ActivePlayer = ActionStage | DrawStage | InfectorStage;
export type InactivePlayer = InactiveStage;

/**
 * Interface of a {@link ActivePlayer} that is in the action stage of their turn.
 *
 * Extends {@link BasicPlayer} to further expose:
 * - {@link Player.movesTakenInTurn}, readonly number of turns taken this turn.
 * - {@link Player.discardcards}, discards cards from the players hand.
 * - {@link Player.driveTo}, moves a player to a neighbouring city.
 * - {@link Player.takeDirectFlightTo}, move a player to a city given a card.
 * - {@link Player.takeCharterFlightTo}, move a player to a city given a card.
 * - {@link Player.takeShuttleFlightTo}, move a player to a city with a research station.
 * - {@link Player.buildResearchStation}, build a research station at a city.
 * - {@link Player.cureDisease}, cure a disease.
 * - {@link Player.treatDisease}, treat a disease.
 * - {@link Player.shareKnowledgeWith}, share a card with another player.
 * - {@link Player.pass}, pass an action.
 *
 * We also expose **State Pattern** methods for lifecycle management:
 * - {@link Player.finishActionStage}, to progress the player to {@link DrawStage}.
 *
 * @remarks
 * Note in this interface we also have the methods returning an instance of the
 * object they are of, `this`, allowing these builder pattern methods to be
 * chained. This is an example of the **Fluent Interface/API** pattern.
 */
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

/**
 * Interface of a {@link ActivePlayer} that is in the draw stage of their turn.
 *
 * Extends {@link BasicPlayer} to further expose:
 * - {@link Player.playerCardsDrawnInTurn}, readonly number of cards taken this turn.
 * - {@link Player.drawCards}, draw cards from the player draw pile.
 * - {@link Player.discardcards}, discards cards from the players hand.
 *
 * We also expose **State Pattern** methods for lifecycle management:
 * - {@link Player.finishDrawStage}, to progress the player to {@link InfectorStage}.
 *
 * @remarks
 * Note in this interface we also have the methods returning an instance of the
 * object they are of, `this`, allowing these builder pattern methods to be
 * chained. This is an example of the **Fluent Interface/API** pattern.
 */
interface DrawStage extends BasicPlayer {
  readonly playerCardsDrawnInTurn: number;
  drawCards(n: number): DrawStage;
  discardCards(...cards: PlayerCard[]): this;
  finishDrawStage(): InfectorStage;
}

/**
 * Interface of a {@link ActivePlayer} that is in the draw stage of their turn.
 *
 * Extends {@link BasicPlayer} to further expose:
 * - {@link Player.hasDrawnInfectionCards}, readonly flag checking whether infection
 *   cards have been drawn this turn.
 * - {@link Player.drawInfectionCards}, draw cards from the infection draw pile.
 *
 * We also expose **State Pattern** methods for lifecycle management:
 * - {@link Player.endTurn}, to progress the player to {@link InactiveStage}.
 *
 * @remarks
 * Note in this interface we also have the methods returning an instance of the
 * object they are of, `this`, allowing these builder pattern methods to be
 * chained. This is an example of the **Fluent Interface/API** pattern.
 */
interface InfectorStage extends BasicPlayer {
  readonly hasDrawnInfectionCards: boolean;
  drawInfectionCards(): InfectorStage;
  endTurn(): InactiveStage;
}

/**
 * Interface of a {@link InactivePlayer}.
 *
 * Exposes **State Pattern** methods for lifecycle management:
 * - {@link Player.startTurn}, to progress the player to {@link ActionStage}.
 *
 * @remarks
 * Note in this interface we also have the methods returning an instance of the
 * object they are of, `this`, allowing these builder pattern methods to be
 * chained. This is an example of the **Fluent Interface/API** pattern.
 */
interface InactiveStage extends BasicPlayer {
  startTurn(): ActionStage;
}

/**
 * Helper type to support using dependency injection of the game config into
 * the player object rather than creating a hard reference.
 */
type GameConfig = {
  cityNetwork: CityNetwork;
  diseaseManager: DiseaseManager;
  playerCardDrawPile: CardStack<PlayerCard | EpidemicCard>;
  playerCardDiscardedPile: CardStack<PlayerCard | EpidemicCard>;
  infectionCardDrawPile: CardStack<InfectionCard>;
  infectionCardDiscardedPile: CardStack<InfectionCard>;
};

/**
 * Class implementing all the logic and state for the Players within the game.
 *
 * @remarks
 * This is a public facing object therefore we must be concious of what we
 * expose to consumers whilst making the class easy to extend and maintain.
 *
 * In this class we showcase the following patterns:
 * - **State Pattern**: to only expose members that are relevant to player stage.
 * - **Fluent Interface/API Pattern**: to allow player methods to be chained together.
 * - **Observer (Publisher-Subscriber) Pattern**: to notify all observers of
 *   player turns and no cards remaining events.
 *
 * Rather than creating different classes for each state/type of player, we
 * opt to use composition and interfaces to represent each type of player. This,
 * supported by the **State Pattern** by not exposing the {@link Player} class
 * directly but instead exposing it through controllable interfaces represented
 * by the type union of {@link ActivePlayer} and {@link InactivePlayer}. This gives
 * us the same level of encapsulation that inheritance would give us, but without
 * the tightly coupled classes in the inheritance tree.
 *
 * Due to this pattern, we do not need to use access modifiers to encapsulate
 * {@link Player} members which means we also do not need to keep a private
 * member alongside a public getter/setter to support modifying the class internally.
 */
export class Player
  implements ActionStage, DrawStage, InfectorStage, InactiveStage
{
  /**
   * Constant static variable used to config max number of actions per turn.
   */
  static readonly MAX_ACTIONS_PER_TURN = 4;

  /**
   * Class properties safely exposed through the {@link ActivePlayer} and
   * {@link InactivePlayer} tagged union.
   */
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

  /**
   * Gets whether the player is actionable.
   *
   * @returns `true` if the player is actionable, `false` otherwise.
   */
  get isActionable(): boolean {
    return (
      this.state === "active" &&
      this.movesTakenInTurn < Player.MAX_ACTIONS_PER_TURN
    );
  }

  /**
   * Gets whether the player has too many cards.
   *
   * @returns `true` if the player has too many cards, `false` otherwise.
   */
  get hasTooManyCards(): boolean {
    return this.cards.length > 7;
  }

  /**
   * Public constructor is OK as player instances are only created inside the library.
   *
   * @param name - The name of the player.
   * @param role - The role of the player.
   * @param location - Starting city of the player.
   * @param gameConfig - Necessary config from the game the player is a part of.
   */
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

  // ---- UTILS & ACCESSORS ----

  /**
   * Checks whether the player is making a valid movement.
   *
   * @params city - The city to check movement to.
   * @throws {Error} if the player is not actionable.
   * @throws {Error} if the player is already at the city.
   */
  checkValidMovement(city: City | CityName): void {
    if (!this.isActionable) {
      throw cannotActOnPlayerError(this);
    }
    if (!this.isPlayerAtDifferentCity(city)) {
      throw playerAlreadyAtCityError(this);
    }
  }

  /**
   * Checks whether the player has too many cards in their hand.
   *
   * @throws {Error} if the player has too many cards.
   */
  checkValidNumberOfCards(): void {
    if (this.hasTooManyCards) {
      throw new Error(
        `Player has too many card: ${this.cards.length}. Please discard ${
          this.cards.length - 7
        } cards`
      );
    }
  }

  /**
   * Checks whether the player is at different city to the one given.
   *
   * @param city - The city to compare to.
   * @returns `true` if the player is at a different city, `false` otherwise.
   */
  isPlayerAtDifferentCity(city: City | CityName): boolean {
    return typeof city === "string"
      ? city !== this.location.name
      : city !== this.location;
  }

  /**
   * Discards cards from the players hand onto the player discard pile.
   *
   * @param cards - The card/s to remove from the hand.
   * @returns A reference to the player instance.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   */
  discardCards(...cards: PlayerCard[]): this {
    this.cards = this.cards.filter((card) => !cards.includes(card));
    for (const card of cards) {
      this.playerCardDiscardedPile.put(card);
    }
    return this;
  }

  /**
   * Helper method to store callback used as a predicate in an `Array.find` method.
   * To find a card of a specific city in the players hand.
   *
   * @param city - The city to search for in the players hand.
   * @returns a function to be used as the predicate in a find method.
   */
  cardForCityPredicate(city: City | CityName): (card: PlayerCard) => boolean {
    return (card: PlayerCard) => {
      if (card.city === undefined) {
        return false;
      }
      return typeof city === "string"
        ? card.city === city
        : card.city === city.name;
    };
  }

  /**
   * Helper method to store callback used as a predicate in an `Array.find` method.
   * To find a card of a specific disease type in the players hand.
   *
   * @param diseaseType - The disease type to search for in the players hand.
   * @returns a function to be used as the predicate in a find method.
   */
  cardForDiseaseTypePredicate(
    diseaseType: DiseaseType
  ): (card: PlayerCard) => boolean {
    return (card: PlayerCard) => {
      if (card.diseaseType === undefined) {
        return false;
      }
      return card.diseaseType === diseaseType;
    };
  }

  // ---- STATE PATTERN ----

  /**
   * **State Pattern** method to start a players turn.
   *
   * @returns A reference to the player instance as an {@link ActionStage}..
   * @throws {Error} if it is not the players turn.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   *
   * Following the **Observer Pattern* all observers of {@link Player} are notified.
   * Promoting a loose coupling between the {@link Player} and its observers.
   *
   * This is a **State Pattern** method which will transition the {@link Player}
   * from the {@link InactiveStage} stage to {@link ActionStage} stage if criteria is met.
   * This is the first stage of the {@link ActivePlayer} lifecycle and only methods
   * available to the action stage will be exposed.
   */
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

  /**
   * **State Pattern** method to end a players turn.
   *
   * @returns A reference to the player instance.
   * @throws {Error} if the player has not finished their turn as infector.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   *
   * Following the **Observer Pattern* all observers of {@link Player} are notified.
   * Promoting a loose coupling between the {@link Player} and its observers.
   *
   * This is a **State Pattern** method which will transition the {@link Player}
   * from the {@link InfectorStage} stage to {@link InactiveStage} stage if criteria is met.
   * This is the only stage of the {@link InactivePlayer} lifecycle and only methods
   * available will be to start turn.
   */
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

  /**
   * **State Pattern** method to finish action stage.
   *
   * @remarks
   * This is a **State Pattern** method which will transition the {@link Player}
   * from the {@link ActionStage} stage to {@link DrawStage} stage if criteria is met.
   * This is the second stage of the {@link ActivePlayer} lifecycle and only
   * draw stage methods will be available.
   */
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

  /**
   * **State Pattern** method to finish draw stage.
   *
   * @remarks
   * This is a **State Pattern** method which will transition the {@link Player}
   * from the {@link DrawStage} stage to {@link InfectorStage} stage if criteria is met.
   * This is the final stage of the {@link ActivePlayer} lifecycle and only
   * infector stage methods will be available.
   */
  finishDrawStage(): InfectorStage {
    if (this.playerCardsDrawnInTurn < 2) {
      throw new Error(
        `Cannot finish draw stage. ${this.name} has not taken 2 cards`
      );
    }
    return this;
  }

  // ---- OBSERVER PATTERN ----

  /**
   * Registers an observer to {@link Player}.
   *
   * @param observer - The observer to register.
   *
   * @remarks
   * Required plumbing for the **Observer (pub/sub) Pattern**.
   * This method is not exposed through interfaces so it cannot be misused.
   */
  registerObserver(observer: PlayerObserver): void {
    this.observers.push(observer);
  }

  /**
   * Removes an observer from {@link Player}.
   *
   * @param observer - The observer to remove.
   *
   * @remarks
   * Required plumbing for the **Observer (pub/sub) Pattern**.
   * This method is not exposed through interfaces so it cannot be misused.
   */
  removeObserver(observer: PlayerObserver): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Notifies all observers that there are no player cards left in the draw pile.
   *
   * @remarks
   * Part of the **Observer (pub/sub) Pattern** where all observers of {@link Player}
   * are notified. Promoting a loose coupling between the {@link Player} and its observers.
   */
  notifyNoPlayerCards(): void {
    for (const observer of this.observers) {
      observer.onNoPlayerCards();
    }
  }

  /**
   * Notifies all observers that a player has started their turn.
   *
   * @remarks
   * Part of the **Observer (pub/sub) Pattern** where all observers of {@link Player}
   * are notified. Promoting a loose coupling between the {@link Player} and its observers.
   */
  notifyStartTurn(): void {
    for (const observer of this.observers) {
      observer.onTurnStart(this);
    }
  }

  /**
   * Notifies all observers that a player has ended their turn.
   *
   * @remarks
   * Part of the **Observer (pub/sub) Pattern** where all observers of {@link Player}
   * are notified. Promoting a loose coupling between the {@link Player} and its observers.
   */
  notifyEndTurn(): void {
    for (const observer of this.observers) {
      observer.onTurnEnd(this);
    }
  }

  // ---- ACTION STAGE ----

  /**
   * Move the player to a neighbouring city.
   *
   * @param city - The city to move to.
   * @returns A reference to the player instance as an {@link ActionStage}.
   * @throws {Error} if the city to move to is not a neighbouring city.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   */
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

  /**
   * Move the player to a another city with a card.
   *
   * @param city - The city to move to.
   * @returns A reference to the player instance as an {@link ActionStage}.
   * @throws {Error} if the player does not have a card to move to the city.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   */
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

  /**
   * Move the player to a another city with a card of the current city.
   *
   * @param city - The city to move to.
   * @returns A reference to the player instance as an {@link ActionStage}.
   * @throws {Error} if the player does not have a card of the current city.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   */
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

  /**
   * Move the player to a another city with a research station.
   *
   * @param city - The city to move to.
   * @returns A reference to the player instance as an {@link ActionStage}.
   * @throws {Error} if the city does not have a researchStation.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   */
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

  /**
   * Build a research station at the current city.
   *
   * @param replaceCity - Optional, if there are not enough research stations
   * to place, the player must replace an existing one.
   * @returns A reference to the player instance as an {@link ActionStage}.
   * @throws {Error} if the player is not actionable.
   * @throws {Error} the player does not have the card.
   * @throws {Error} if there are no research stations left to place and no
   * replacement is given.
   * @throws {Error} if the city with a research station to replace does not
   * have a research station.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   */
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

  /**
   * Cure a disease.
   *
   * @param diseaseType - The type of disease to cure.
   * @returns A reference to the player instance as an {@link ActionStage}.
   * @throws {Error} if the player is not actionable.
   * @throws {Error} if the current city does not have a research station.
   * @throws {Error} if the player does not have enough cards to cure a disease.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   */
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

  /**
   * Treat a disease.
   *
   * @param diseaseType - The type of disease to treat.
   * @returns A reference to the player instance as an {@link ActionStage}.
   * @throws {Error} if the player is not actionable.
   * @throws {Error} if the city is not infected with the disease to treat.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   */
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

  /**
   * Share knowledge by transfering a card to another player.
   *
   * @param player - The card to give to another player.
   * @param researcherCard - Optional, if the player is a researcher they
   * can share any card.
   * @returns A reference to the player instance as an {@link ActionStage}.
   * @throws {Error} if the player is not actionable.
   * @throws {Error} if the two players are in a different location.
   * @throws {Error} if the player does not have a card for the current location.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   */
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

  /**
   * Pass an action.
   *
   * @returns A reference to the player instance as an {@link ActionStage}.
   * @throws {Error} if the player is not actionable.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   */
  pass(): ActionStage {
    if (!this.isActionable) {
      throw cannotActOnPlayerError(this);
    }
    this.checkValidNumberOfCards();
    this.movesTakenInTurn++;
    return this;
  }

  // ---- DRAW STAGE ----

  /**
   * Draw one or multiple cards from the player draw pile.
   *
   * @param n - The number of cards to draw.
   * @returns A reference to the player instance as a {@link DrawStage}.
   * @throws {Error} if the player does not have enough draws remaining.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   *
   * If the player draw pile is empty when the player attempts to draw a card,
   * following the **Observer Pattern* all observers of {@link Player} are notified.
   * Promoting a loose coupling between the {@link Player} and its observers.
   */
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

  // ---- INFECTOR STAGE ----

  /**
   * Draw infection cards from the infection draw pile.
   *
   * @returns A reference to the player instance as an {@link InfectorStage}.
   * @throws {Error} if the player has already drawn infection cards.
   *
   * @remarks
   * We utilise the **Fluent Interface/API pattern** by returning an instance
   * of the type to allow method chaining with other methods.
   */
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
}
