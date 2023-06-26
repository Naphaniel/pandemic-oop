import path from "path";

import { CityNetwork } from "./CityNetwork";
import {
  Player,
  Role,
  ActivePlayer,
  InactivePlayer,
  BasicPlayer,
} from "./Player";
import {
  PlayerCard,
  InfectionCard,
  CardStack,
  EpidemicCard,
} from "./CardStack";

const cityDataFilePath = path.resolve(__dirname, "data/cities.json");
const playerCardDataFilePath = path.resolve(__dirname, "data/playerCards.json");
const infectionCardDataFilePath = path.resolve(
  __dirname,
  "data/infectionCards.json"
);
const epidemicCardDataFilePath = path.resolve(
  __dirname,
  "data/epidemicCards.json"
);

type State = "setting-up" | "in-progress" | "completed";
type Difficulty = "introduction" | "normal" | "heroic";

interface GameSettingUp {
  withPlayer(name: string): this & {
    player(name: string): BasicPlayer;
    get players(): readonly BasicPlayer[];
  };
  withPlayingOrder(
    names: string[]
  ): this & { get playingOrder(): readonly string[] };
  withDifficulty(
    difficulty: Difficulty
  ): this & { readonly difficulty: Difficulty };
  removePlayer(name: string): this;
  start(): GameInProgress;
}

interface SetupGame {
  readonly state: State;
  readonly infectionRate: number;
  readonly outbreaks: number;
  readonly curesDiscovered: number;
  readonly researchStationsPlaced: number;
  readonly difficulty: Difficulty;
  get playingOrder(): readonly string[];
  get players(): readonly (ActivePlayer | InactivePlayer)[];
  player(name: string): ActivePlayer | InactivePlayer;
}

const setupGameProps: readonly (keyof SetupGame)[] = [
  "state",
  "infectionRate",
  "outbreaks",
  "curesDiscovered",
  "researchStationsPlaced",
  "difficulty",
] as const;

interface GameInProgress extends SetupGame {
  readonly state: "in-progress";
  complete(): GameCompleted;
}

interface GameCompleted extends SetupGame {
  readonly state: "completed";
}

export interface PlayerAccessibleGame {
  readonly playerCardDrawPile: CardStack<PlayerCard | EpidemicCard>;
  readonly playerCardDiscardedPile: CardStack<PlayerCard | EpidemicCard>;
  readonly cities: CityNetwork;
  get currentActivePlayer(): ActivePlayer;
}

export type Game =
  | GameSettingUp
  | GameInProgress
  | GameCompleted
  | PlayerAccessibleGame;

export const Game = {
  initialise(): GameSettingUp {
    return ConcreteGame.initialise();
  },
};

class ConcreteGame {
  static nextId: number = 0;

  id: number;
  state: State;
  difficulty?: Difficulty;

  infectionRate: number;
  outbreaks: number;
  curesDiscovered: number;
  researchStationsPlaced: number;

  cities: CityNetwork;

  playerCardDrawPile: CardStack<PlayerCard | EpidemicCard>;
  playerCardDiscardedPile: CardStack<PlayerCard | EpidemicCard>;
  infectionCardDrawPile: CardStack<InfectionCard>;
  infectionCardDiscardedPile: CardStack<InfectionCard>;
  epidemicCardPile: CardStack<EpidemicCard>;

  availableRoles: Role[];

  _players: Map<string, Player>;
  _playingOrder: string[];
  currentActivePlayer?: ActivePlayer;

  get players(): readonly (ActivePlayer | InactivePlayer)[] {
    return Array.from(this._players.values());
  }

  get playerCount(): number {
    return this._players.size;
  }

  get playingOrder(): readonly string[] {
    return this._playingOrder;
  }

  private constructor() {
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

    this.cities = CityNetwork.buildFromFile(cityDataFilePath);

    this.playerCardDrawPile = CardStack.buildFromFile<
      PlayerCard | EpidemicCard
    >(playerCardDataFilePath);
    this.playerCardDiscardedPile = CardStack.buildEmptyStack<PlayerCard>();
    this.infectionCardDrawPile = CardStack.buildFromFile<InfectionCard>(
      infectionCardDataFilePath
    );
    this.infectionCardDiscardedPile =
      CardStack.buildEmptyStack<InfectionCard>();
    this.epidemicCardPile = CardStack.buildFromFile<EpidemicCard>(
      epidemicCardDataFilePath
    );

    this._players = new Map<string, Player>();
    this._playingOrder = [];
  }

  public static initialise(): GameSettingUp {
    return new ConcreteGame();
  }

  assignRandomRole(): Role {
    const idx = Math.floor(Math.random() * this.availableRoles.length);
    return this.availableRoles.splice(idx, 1)[0];
  }

  withPlayer(name: string): this & {
    player(name: string): BasicPlayer;
    get players(): readonly BasicPlayer[];
  } {
    if (this._players.has(name)) {
      throw new Error(`Player with name '${name}' already exists`);
    }
    if (this.playerCount >= 4) {
      throw new Error("Cannot add player. Can only have 4 players");
    }

    const player = new Player(
      this as PlayerAccessibleGame,
      name,
      this.assignRandomRole(),
      "atalanta"
    );

    this._players.set(name, player);
    return this as this & {
      player(name: string): BasicPlayer;
      get players(): readonly BasicPlayer[];
    };
  }

  removePlayer(name: string): this {
    const player = this._players.get(name);
    if (player !== undefined) {
      this.availableRoles.push(player.role);
    }
    this._players.delete(name);
    return this;
  }

  withDifficulty(
    difficulty: Difficulty
  ): this & { readonly difficulty: Difficulty } {
    this.difficulty = difficulty;
    return this as this & { difficulty: Difficulty };
  }

  withPlayingOrder(
    names: string[]
  ): this & { get playingOrder(): readonly string[] } {
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
    this._playingOrder = names;
    return this as this & { get playingOrder(): readonly string[] };
  }

  validateGameState(): void {
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

    for (const [_, player] of this._players) {
      player.takeCards(cardsToTake);
    }
  }

  setupEpidemicCards(): void {
    if (this.difficulty === undefined) {
      throw new Error("Cannot deal epidemic cards. Difficulty not set.");
    }

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
        this.cities.infectCity(cityName, diseaseType, i);
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

    return this as GameInProgress;
  }

  player(name: string): ActivePlayer | InactivePlayer {
    const player = this._players.get(name);
    if (player === undefined) {
      throw new Error("Cannot get player: ${name}. Player does not exist");
    }
    return player;
  }

  complete(): GameCompleted {
    this.state = "completed";
    return this as GameCompleted;
  }
}
