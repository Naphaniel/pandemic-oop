import path from "path";
import { CityNetwork, ReadonlyCityNetwork } from "./City";
import {
  Player,
  Role,
  ActivePlayer,
  InactivePlayer,
  BasicPlayer,
  PlayerObserver,
} from "./Player";
import {
  PlayerCard,
  InfectionCard,
  CardStack,
  EpidemicCard,
  ReadonlyCardPile,
} from "./Card";
import {
  DiseaseManager,
  DiseaseObserver,
  ReadonlyDiseaseManager,
} from "./Disease";

/**
 * Internal constants used to hold file paths to build {@link CityNetwork}
 * and {@link CardStack}
 */
const CITY_DATA_FILE_PATH = path.resolve(__dirname, "data/cities.json");
const PLAYER_CARD_DATA_FILE_PATH = path.resolve(
  __dirname,
  "data/playerCards.json"
);
const INFECTION_CARD_DATA_FILE_PATH = path.resolve(
  __dirname,
  "data/infectionCards.json"
);
const EPIDEMIC_CARD_DATA_FILE_PATH = path.resolve(
  __dirname,
  "data/epidemicCards.json"
);

/**
 * Type of {@link ConcreteGame} states.
 *
 * @remarks
 * @see use in {@link SetupGame.state} and {@link ConcreteGame.state}.
 */
type State = "setting-up" | "in-progress" | "lost" | "won" | "abandoned";

/**
 * Type of {@link ConcreteGame} difficulty levels.
 *
 * @remarks
 * @see use in {@link SetupGame.difficulty} and {@link ConcreteGame.difficulty}.
 */
type Difficulty = "introduction" | "normal" | "heroic";

/**
 * Interface for a game that whose state is passed 'setting-up'.
 *
 * Exposes:
 * - {@link ConcreteGame.state}, to view readonly state.
 * - {@link ConcreteGame.diseaseManager}, a readonly disease manager.
 * - {@link ConcreteGame.difficulty}, to view readonly difficulty.
 * - {@link ConcreteGame.playingOrder}, a readonly list of playing order.
 * - {@link ConcreteGame.playerCardDrawPile}, a readonly card pile storing player
 *   and epidemic cards.
 * - {@link ConcreteGame.playerCardDiscardedPile}, a readonly card pile storing
 *   discarded player and epidemic cards.
 * - {@link ConcreteGame.infectionCardDrawPile}, a readonly card pile storing
 *   infection cards.
 * - {@link ConcreteGame.infectionCardDiscardedPile}, a readonly card pile storing
 *   discarded infection cards.
 * - {@link ConcreteGame.players}, a readonly array of immutable player objects.
 * - {@link ConcreteGame.cityNetwork}, a readonly view of the city network.
 * - {@link ConcreteGame.player}, a method to get a readonly version of a player.
 *
 * @remarks
 * We use this interface as a super type/interface (or parent) for the subsequent
 * game state interfaces.
 *
 * @see {@link GameSettingUp}, {@link GameInProgress} and {@link GameCompleted}.
 *
 * In this interface we choose what members and methods we want to expose
 * from {@link ConcreteGame} facade. Here we ensure everything is immutable to
 * avoid misuse of {@link ConcreteGame} data.
 */
interface SetupGame {
  readonly state: State;
  readonly diseaseManager: ReadonlyDiseaseManager;
  readonly difficulty: Difficulty;
  readonly playingOrder: readonly string[];
  readonly playerCardDrawPile: ReadonlyCardPile<PlayerCard | EpidemicCard>;
  readonly playerCardDiscardedPile: ReadonlyCardPile<PlayerCard | EpidemicCard>;
  readonly infectionCardDrawPile: ReadonlyCardPile<InfectionCard>;
  readonly infectionCardDiscardedPile: ReadonlyCardPile<InfectionCard>;
  readonly players: readonly InactivePlayer[];
  readonly cityNetwork: ReadonlyCityNetwork;
  player(name: string): ActivePlayer | InactivePlayer;
}

/**
 * Interface for a game that is being setup which is the first stage of
 * the games lifecycle.
 *
 * Prime usage is to expose **Builder Pattern** methods to set required fields
 * for a game that's ready to start:
 *
 * - {@link ConcreteGame.withPlayer}, to create and register players.
 * - {@link ConcreteGame.removePlayer}, to remove players.
 * - {@link ConcreteGame.withPlayingOrder}, to set the playing order.
 * - {@link ConcreteGame.withDifficulty}, to set the difficulty.
 *
 * We also expose **State Pattern* methods for lifecycle management:
 * - {@link ConcreteGame.start}, to progress a game to {@link GameInProgress} state.
 *
 * @remarks
 * Note in this interface we also have the methods returning an instance of the
 * object they are of, `this`, allowing these builder pattern methods to be
 * chained. This is an example of the **Fluent Interface/API** pattern.
 *
 * We also expose the field that has been set through a builder method in an
 * immutable form, another example of the **State Pattern** by only exposing
 * members we know exist.
 *
 */
interface GameSettingUp {
  readonly state: "setting-up";
  withPlayer(name: string): this & {
    player(name: string): BasicPlayer;
    get players(): readonly BasicPlayer[];
  };
  removePlayer(name: string): this;
  withPlayingOrder(
    names: string[]
  ): this & { readonly playingOrder: readonly string[] };
  withDifficulty(
    difficulty: Difficulty
  ): this & { readonly difficulty: Difficulty };
  start(): GameInProgress;
}

/**
 * Interface for a game that is in progress which is the intermediate state
 * of the games lifecycle.
 *
 * Extends {@link SetupGame} which ensures that all of the members of {@link SetupGame}
 * have been set through methods exposed by {@link GameSettingUp}
 *
 * We expose **State Pattern** methods for lifecycle management:
 * - {@link ConcreteGame.complete}, to progress a game to a {@link GameCompleted} state.
 *
 * @remarks
 * Note that the {@link ConcreteGame.complete} method exposed here only accepts
 * the outcome "abandoned". This is because at this stage the only way to move
 * to a {@link GameCompleted} state is to abandon the game. Winning and lost states
 * are determined programmatically by the Game.
 *
 */
interface GameInProgress extends SetupGame {
  readonly state: "in-progress";
  complete(outcome: "abandoned"): GameCompleted;
}

/**
 * Interface for a game that is completed. This is the final state of a games
 * lifecycle.
 *
 * @remarks
 * In this state, only the {@link State} of the game is exposed. Here you can
 * see whether the game is won or lost.
 */
interface GameCompleted {
  readonly state: "won" | "lost" | "abandoned";
}

/**
 * Exported type for a Game represented by a tagged union type pivoted on
 * {@link ConcreteGame.state}
 *
 * @remarks
 * To enable the **State Pattern**, we never expose the Game through {@link ConcreteGame}
 * class directly. Instead we expose it through this type or the members of this
 * tagged union, dependent on the game state/position in the lifecycle.
 */
export type Game = GameSettingUp | GameInProgress | GameCompleted;

/**
 * This object along with the type {@link Game} implements the **Companion Object Pattern**.
 * We effectively create a dummy `Game` class by making use of JavaScripts structural typing,
 * and by defining an object with the same name as the type {@link Game}. This enables us
 * to never expose {@link ConcreteGame} directly but instead expose a static method
 * {@link ConcreteGame.initialise} which we can use to create Game instances that we can
 * control the lifecycle & exposure of.
 */
export const Game = {
  initialise(): GameSettingUp {
    return ConcreteGame.initialise();
  },
};

/**
 * Class implementing all logic and state for the Pandemic Game API.
 *
 * @remarks
 * We implement the **Facade Pattern** by having only this class, exposed through
 * the {@link Game} object, visible to consumers. This is the Object that
 * consumers of our API will interact with to play the game.
 *
 * In this class we showcase the following patterns:
 * - **Builder Pattern**: to iteratively build upon a game object, in an imperative fashion.
 * - **State Pattern**: to only expose members that are relevant to each game state.
 * - **Fluent Interface/API Pattern**: to allow builder methods to be chained together.
 * - **Observer (Publisher-Subscriber) Pattern**: to implement methods to react
 *   notifications from other objects. To achieve this we implement {@link PlayerObserver}
 *   and {@link DiseaseObserver} interfaces.
 *
 * As we have impemented the **State Pattern** supported by the types within
 * the tagged union {@link Game}, {@link ConcreteGame} is never directly exposed.
 * This means that members that would usually require encapsulation logic or
 * access modifiers set, do not need these precuautions. If we were to do so,
 * we would need additional public setters/getters to manage the internal private state.
 * As the interfaces within {@link Game} make these members immutable, it is safe
 * to leave the members of {@link ConcreteGame} public and mutable.
 *
 * Finally to enforce the **State Pattern** we make the constructor of {@link ConcreteGame}
 * private so new instances can only be created through the static method {@link ConcreteGame.initialise}
 */
class ConcreteGame implements PlayerObserver, DiseaseObserver {
  /**
   * Constant variable used to keep track of the next game ID.
   */
  private static nextId: number = 0;

  /**
   * Class properties safely exposed through the {@link Game} tagged union
   * so do not need direct encapsulation.
   */
  id: number;
  state: State;
  difficulty: Difficulty;
  cityNetwork: CityNetwork;
  diseaseManager: DiseaseManager;
  playerCardDrawPile: CardStack<PlayerCard | EpidemicCard>;
  playerCardDiscardedPile: CardStack<PlayerCard | EpidemicCard>;
  infectionCardDrawPile: CardStack<InfectionCard>;
  infectionCardDiscardedPile: CardStack<InfectionCard>;
  epidemicCardPile: CardStack<EpidemicCard>;
  availableRoles: Role[];
  internalPlayers: Map<string, Player>;
  playingOrder: string[];
  currentPlayerIndex: number;

  /**
   * Gets number of research stations placed on the board.
   *
   * @returns the number of research stations placed on the board.
   */
  get researchStationsPlaced(): number {
    return this.cityNetwork.researchStationsPlaced;
  }

  /**
   * Gets all of the current registered players.
   *
   * @returns An array containing all of the current players.
   */
  get players(): readonly InactivePlayer[] {
    return [...this.internalPlayers.values()];
  }

  /**
   * Gets the number of players.
   *
   * @returns The number of registered players.
   */
  get playerCount(): number {
    return this.internalPlayers.size;
  }

  /**
   * Private constructor to enforce lifecycle management and encapsulation.
   *
   * @remarks
   * Supported through **State Pattern** and the tagged union {@link Game}.
   */
  private constructor() {
    this.id = ConcreteGame.nextId++;
    this.state = "setting-up";
    this.difficulty = "normal";
    this.cityNetwork = CityNetwork.buildFromFile(CITY_DATA_FILE_PATH);
    this.diseaseManager = new DiseaseManager(this.cityNetwork);
    this.playerCardDrawPile = CardStack.buildFromFile<
      PlayerCard | EpidemicCard
    >(PLAYER_CARD_DATA_FILE_PATH);
    this.playerCardDiscardedPile = CardStack.buildEmptyStack<PlayerCard>();
    this.infectionCardDrawPile = CardStack.buildFromFile<InfectionCard>(
      INFECTION_CARD_DATA_FILE_PATH
    );
    this.infectionCardDiscardedPile =
      CardStack.buildEmptyStack<InfectionCard>();
    this.epidemicCardPile = CardStack.buildFromFile<EpidemicCard>(
      EPIDEMIC_CARD_DATA_FILE_PATH
    );
    this.availableRoles = [
      "medic",
      "scientist",
      "dispatcher",
      "researcher",
      "operations-expert",
    ];
    this.internalPlayers = new Map<string, Player>();
    this.playingOrder = [];
    this.currentPlayerIndex = 0;
  }

  // ---- BUILDER PATTERN ----

  /**
   * **Builder Pattern** method to create a new player and add them to the game.
   *
   * @param name - The name of the player to add.
   * @returns A reference to the game instance along with newly exposed player methods.
   *
   * @remarks
   * We utilise three patterns here:
   * - **Builder Pattern**: Progressively building a configured game.
   * - **Fluent Interface/API pattern**: Returning an instance of the type to allow
   *   method chaining with other builder pattern methods.
   * - **State Pattern**: Loose form of only exposing properties/methods that are
   *   ready to be used. We can expect player to be set after this call.
   */
  withPlayer(name: string): this & {
    player(name: string): BasicPlayer;
    get players(): readonly BasicPlayer[];
  } {
    if (this.internalPlayers.has(name)) {
      throw new Error(`Player with name '${name}' already exists`);
    }
    if (this.playerCount >= 4) {
      throw new Error("Cannot add player. Can only have 4 players");
    }
    const player = new Player(name, this.assignRandomRole(), "atalanta", {
      cityNetwork: this.cityNetwork,
      diseaseManager: this.diseaseManager,
      playerCardDiscardedPile: this.playerCardDiscardedPile,
      playerCardDrawPile: this.playerCardDrawPile,
      infectionCardDiscardedPile: this.infectionCardDiscardedPile,
      infectionCardDrawPile: this.infectionCardDrawPile,
    });
    player.registerObserver(this);
    this.internalPlayers.set(name, player);
    return this;
  }

  /**
   * Method to remove a player from the game..
   *
   * @param name - The name of the player to remove.
   * @returns A reference to the game instance.
   *
   * @remarks
   * We utilise three patterns here:
   * - **Fluent Interface/API pattern**: Returning an instance of the type to allow
   *   method chaining with other builder pattern methods.
   */
  removePlayer(name: string): this {
    const player = this.internalPlayers.get(name);
    if (player !== undefined) {
      this.availableRoles.push(player.role);
      player.removeObserver(this);
    }
    this.internalPlayers.delete(name);
    return this;
  }

  /**
   * **Builder Pattern** method to set game difficulty.
   *
   * @param difficulty - The game difficulty.
   * @returns A reference to the game instance along with newly exposed difficulty property.
   *
   * @remarks
   * We utilise three patterns here:
   * - **Builder Pattern**: Progressively building a configured game.
   * - **Fluent Interface/API pattern**: Returning an instance of the type to allow
   *   method chaining with other builder pattern methods.
   * - **State Pattern**: Loose form of only exposing properties/methods that are
   *   ready to be used. We can expect difficulty to be set after this call.
   */
  withDifficulty(
    difficulty: Difficulty
  ): this & { readonly difficulty: Difficulty } {
    this.difficulty = difficulty;
    return this;
  }

  /**
   * **Builder Pattern** method to set game playing order.
   *
   * @param names- The order of player turns.
   * @returns A reference to the game instance along with newly exposed playing order property.
   * @throws {Error} if the names in {@link names} do not match the registered players.
   *
   * @remarks
   * We utilise three patterns here:
   * - **Builder Pattern**: Progressively building a configured game.
   * - **Fluent Interface/API pattern**: Returning an instance of the type to allow
   *   method chaining with other builder pattern methods.
   * - **State Pattern**: Loose form of only exposing properties/methods that are
   *   ready to be used. We can expect playingOrder to be set after this call.
   */
  withPlayingOrder(
    names: string[]
  ): this & { readonly playingOrder: readonly string[] } {
    const playerNames = this.players.map((player) => player.name);
    const uniqueNames = new Set(names);
    if (
      uniqueNames.size !== this.playerCount ||
      !names.every((val) => playerNames.includes(val))
    ) {
      throw new Error(
        `Cannot set playing order: ${names}. Names do not match registered players ${playerNames}`
      );
    }
    this.playingOrder = names;
    return this;
  }

  // ---- STATE PATTERN ----

  /**
   * **State Pattern* Static method to initialise a new game.
   *
   * @returns A new, empty, instance to {@link ConcreteGame} exposed through
   * {@link GameSettingUp}.
   *
   * @remarks
   * **State Pattern** method, the starting point of the games lifecycle. We
   * only expose methods here relevant to a non-setup game.
   */
  static initialise(): GameSettingUp {
    return new ConcreteGame() as GameSettingUp;
  }

  /**
   * **State Pattern* method to start the game.
   *
   * @remarks
   * This is a **State Pattern** method which will transition the {@link ConcreteGame}
   * from the {@link GameSettingUp} state to {@link GameInProgress} state if criteria is met.
   * This is the intermediate step of the game lifecycle and the majority of
   * gameplay methods will be available from this point onwards, as exposed through
   * {@link GameInProgress}.
   */
  start(): GameInProgress {
    this.validateGameState();
    this.diseaseManager.registerObserver(this);
    if (this.playingOrder.length !== this.playerCount) {
      this.playingOrder = Array.from(this.internalPlayers.keys());
    }
    this.setupCards();
    this.nextPlayerTurn();
    this.cityNetwork.getCityByName("atalanta").hasResearchStation = true;
    this.state = "in-progress";
    return this as GameInProgress;
  }

  /**
   * **State Pattern* method to complete the game.
   *
   * @remarks
   * This is a **State Pattern** method which will transition the {@link ConcreteGame}
   * from the {@link GameInProgress} state to {@link GameCompleted} state if criteria is met.
   * This is the final step of the game lifecycle and no gameplay methods will be
   * available from this point onwards, as exposed through {@link GameCompleted}.
   */
  complete(outcome: "lost" | "won" | "abandoned"): GameCompleted {
    for (const player of this.internalPlayers.values()) {
      player.state = "inactive";
    }
    this.state = outcome;
    return this as GameCompleted;
  }

  // ---- OBSERVER PATTERN ----

  /**
   * **Observer Pattern** method for responding to eight outbreak event
   * from {@link DiseaseManager}.
   */
  onEightOutbreaks(): void {
    this.complete("lost");
  }

  /**
   * **Observer Pattern** method for responding to no disease cubes event
   * from {@link DiseaseManager}.
   */
  onNoDiseaseCubes(): void {
    this.complete("lost");
  }

  /**
   * **Observer Pattern** method for responding to all diseases cured event
   * from {@link DiseaseManager}.
   */
  onAllDiseasesCured(): void {
    this.complete("won");
  }

  /**
   * **Observer Pattern** method for responding to on turn start event
   * from {@link Player}.
   */
  onTurnStart(_: Player): void {}

  /**
   * **Observer Pattern** method for responding to on turn end event
   * from {@link Player}.
   */
  onTurnEnd(_: Player): void {
    this.nextPlayerTurn();
  }

  /**
   * **Observer Pattern** method for responding to no player cards event
   * from {@link Player}.
   */
  onNoPlayerCards(): void {
    this.complete("lost");
  }

  // ---- GAME LOGIC ----

  /**
   * Utility function to get a random role from the remaining available roles.
   *
   * @returns A randomly selected, available {@link Role}.
   */
  assignRandomRole(): Role {
    const idx = Math.floor(Math.random() * this.availableRoles.length);
    return this.availableRoles.splice(idx, 1)[0];
  }

  /**
   * **State Pattern** helper which checks that all required properties have been set
   * before starting the game.
   *
   * @throws {Error} if the game is missing a property.
   * @throws {Error} if the game does not have enough players.
   */
  validateGameState(): void {
    const setupGameProps: (keyof SetupGame)[] = [
      "state",
      "difficulty",
      "playingOrder",
    ];
    for (const prop of setupGameProps) {
      if (this[prop] === undefined) {
        throw new Error(`Cannot start game. Missing property ${prop}`);
      }
    }
    if (this.playerCount < 2) {
      throw new Error(
        `Cannot start game. Not enough players. Currently ${this.playerCount} but need between 2 and 4`
      );
    }
  }

  /**
   * Deals appropriate number of of cards to each player based on player count.
   */
  setupPlayerCards(): void {
    const cardsToTake =
      this.playerCount === 4 ? 2 : this.playerCount === 3 ? 3 : 4;
    this.playerCardDrawPile.shuffle();
    for (const [_, player] of this.internalPlayers) {
      player.drawCards(cardsToTake);
    }
  }

  /**
   * Inserts epidemic cards into player draw pile based on game difficulty.
   */
  setupEpidemicCards(): void {
    const splitCount =
      this.difficulty === "introduction"
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
    this.playerCardDrawPile = CardStack.merge<PlayerCard | EpidemicCard>(
      splitCardPiles
    );
  }

  /**
   * Infects cities based on initial setup of infection cards.
   */
  setupInfectionCards(): void {
    this.infectionCardDrawPile.shuffle();
    for (let i = 3; i > 0; i--) {
      for (const infectionCard of this.infectionCardDrawPile.take(3)) {
        const { city: cityName, diseaseType } = infectionCard;
        const city = this.cityNetwork.getCityByName(cityName);
        this.diseaseManager.infect(city, diseaseType, i);
      }
    }
  }

  /**
   * Orchestrates setting up game cards.
   */
  setupCards(): void {
    this.setupPlayerCards();
    this.setupEpidemicCards();
    this.setupInfectionCards();
  }

  /**
   * Identifies and sets the next player as the active player, based on the
   * playing order.
   *
   * @throws {Error} If the next player does not exist.
   */
  nextPlayerTurn(): void {
    const player = this.internalPlayers.get(
      this.playingOrder[this.currentPlayerIndex]
    );
    if (player === undefined) {
      throw new Error(`Cannot get player. Player does not exist`);
    }
    player.state = "active";
    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.playingOrder.length;
  }

  /**
   * Get a single instance of a player with a known name.
   *
   * @throws {Error} if the player does not exist.
   */
  player(name: string): ActivePlayer | InactivePlayer {
    const player = this.internalPlayers.get(name);
    if (player === undefined) {
      throw new Error(`Cannot get player: ${name}. Player does not exist`);
    }
    return player;
  }
}
