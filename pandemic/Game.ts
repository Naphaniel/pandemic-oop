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

type State = "setting-up" | "in-progress" | "lost" | "won" | "abandoned";
type Difficulty = "introduction" | "normal" | "heroic";

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

interface GameSettingUp {
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

interface GameInProgress extends SetupGame {
  complete(outcome: "abandoned"): GameCompleted;
}

interface GameCompleted {
  readonly state: State;
}

export type Game = GameSettingUp | GameInProgress | GameCompleted;

export const Game = {
  initialise(): GameSettingUp {
    return ConcreteGame.initialise();
  },
};

class ConcreteGame implements PlayerObserver, DiseaseObserver {
  private static nextId: number = 0;

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

  public static initialise(): GameSettingUp {
    return new ConcreteGame();
  }

  get researchStationsPlaced(): number {
    return this.cityNetwork.researchStations.length;
  }

  get players(): readonly InactivePlayer[] {
    return Array.from(this.internalPlayers.values());
  }

  get playerCount(): number {
    return this.internalPlayers.size;
  }

  assignRandomRole(): Role {
    const idx = Math.floor(Math.random() * this.availableRoles.length);
    return this.availableRoles.splice(idx, 1)[0];
  }

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

  removePlayer(name: string): this {
    const player = this.internalPlayers.get(name);
    if (player !== undefined) {
      this.availableRoles.push(player.role);
      player.removeObserver(this);
    }
    this.internalPlayers.delete(name);
    return this;
  }

  withDifficulty(
    difficulty: Difficulty
  ): this & { readonly difficulty: Difficulty } {
    this.difficulty = difficulty;
    return this;
  }

  withPlayingOrder(
    names: string[]
  ): this & { readonly playingOrder: readonly string[] } {
    const playerNames = this.players.map((player) => player.name);
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== this.playerCount) {
      throw new Error(
        `Cannot set playing order: ${names}. Names do not match registered players ${playerNames}`
      );
    }
    if (!names.every((val) => playerNames.includes(val))) {
      throw new Error(
        `Cannot set playing order to: ${names}. Cannot set order for non-existing players`
      );
    }
    this.playingOrder = names;
    return this;
  }

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

  setupPlayerCards(): void {
    const cardsToTake =
      this.playerCount === 4 ? 2 : this.playerCount === 3 ? 3 : 4;
    this.playerCardDrawPile.shuffle();
    for (const [_, player] of this.internalPlayers) {
      player.drawCards(cardsToTake);
    }
  }

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

  setupCards(): void {
    this.setupPlayerCards();
    this.setupEpidemicCards();
    this.setupInfectionCards();
  }

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
    return this;
  }

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

  player(name: string): ActivePlayer | InactivePlayer {
    const player = this.internalPlayers.get(name);
    if (player === undefined) {
      throw new Error("Cannot get player: ${name}. Player does not exist");
    }
    return player;
  }

  onEightOutbreaks(): void {
    this.complete("lost");
  }

  onNoDiseaseCubes(): void {
    this.complete("lost");
  }

  onAllDiseasesCured(): void {
    this.complete("won");
  }

  onTurnStart(_: Player): void {}

  onTurnEnd(_: Player): void {
    this.nextPlayerTurn();
  }

  onNoPlayerCards(): void {
    this.complete("lost");
  }

  complete(outcome: "lost" | "won" | "abandoned"): GameCompleted {
    for (const player of this.internalPlayers.values()) {
      player.state = "inactive";
    }
    this.state = outcome;
    return this;
  }
}
