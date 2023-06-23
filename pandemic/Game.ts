/*
 * Functionality of Game Module:
 *
 * Create, delete and get players
 *
 * Get and update outbreak indicator
 *
 * Get and update infection rate indicator
 *
 * Get and update cursed discovered indicator
 *
 * Get and put card onto infection draw pile
 *
 * Get and put card onto infection discard pile
 *
 * Get and put card onto player draw pile
 *
 * Get and put card donto player discard pile
 *
 * Get city from board
 *
 * Holds a count of placed research stations
 *
 * Need some kind of builder to setup the game
 */
import path from "path";

import { CityNetwork } from "./CityNetwork";
import { Player } from "./Player";
import { PlayerCard, InfectionCard, CardStack } from "./CardStack";

const cityDataFilePath = path.resolve(__dirname, "data/cities.json");
const playerCardDataFilePath = path.resolve(__dirname, "data/playerCards.json");
const infectionCardDataFilePath = path.resolve(
  __dirname,
  "data/infectionCards.json"
);

type State = "setting-up" | "in-progress" | "completed";
type Difficulty = "introduction" | "normal" | "heroic";

interface GameSettingUp {
  withPlayer(
    name: string
  ): this & { readonly players: ReadonlyMap<string, Player> };
  removePlayer(
    name: string
  ): this & { readonly players: ReadonlyMap<string, Player> };
  withDifficulty(
    difficulty: Difficulty
  ): this & { readonly difficulty: Difficulty };
  start(): GameInProgress;
}

interface SetupGame {
  readonly state: State;
  readonly infectionRate: number;
  readonly outbreaks: number;
  readonly curesDiscovered: number;
  readonly researchStationsPlaced: number;
  readonly difficulty: Difficulty;
}

const setupGameProps: readonly (keyof SetupGame)[] = [
  "state",
  "infectionRate",
  "outbreaks",
  "curesDiscovered",
  "researchStationsPlaced",
  "difficulty",
];

interface GameInProgress extends SetupGame {
  readonly state: "in-progress";
  complete(): GameCompleted;
}

interface GameCompleted extends SetupGame {
  readonly state: "completed";
}

export type Game = GameSettingUp | GameInProgress | GameCompleted;

export const Game = {
  initialise(): GameSettingUp {
    return ConcreteGame.initialise();
  },
};

class ConcreteGame {
  static nextId: number = 0;

  id: number;
  state: State;
  infectionRate: number;
  outbreaks: number;
  curesDiscovered: number;
  researchStationsPlaced: number;
  cities: CityNetwork;
  playerCardPile: CardStack<PlayerCard>;
  playerCardDiscardedPile: CardStack<PlayerCard>;
  infectionCardPile: CardStack<InfectionCard>;
  infectionCardDiscardedPile: CardStack<InfectionCard>;
  players: Map<string, Player>;
  difficulty?: Difficulty;

  private constructor() {
    this.id = ConcreteGame.nextId++;
    this.state = "setting-up";

    this.infectionRate = 0;
    this.outbreaks = 0;
    this.curesDiscovered = 0;
    this.researchStationsPlaced = 0;

    this.cities = CityNetwork.buildFromFile(cityDataFilePath);

    this.playerCardPile = CardStack.buildFromFile<PlayerCard>(
      playerCardDataFilePath
    );
    this.playerCardDiscardedPile = CardStack.buildEmptyStack<PlayerCard>();
    this.infectionCardPile = CardStack.buildFromFile<InfectionCard>(
      infectionCardDataFilePath
    );
    this.infectionCardDiscardedPile =
      CardStack.buildEmptyStack<InfectionCard>();

    this.players = new Map<string, Player>();
  }

  public static initialise(): GameSettingUp {
    return new ConcreteGame();
  }

  setup() {}

  withPlayer(
    name: string
  ): this & { readonly players: ReadonlyMap<string, Player> } {
    if (this.players.has(name)) {
      throw new Error(`Player with name '${name}' already exists`);
    }
    if (this.players.size >= 4) {
      throw new Error("Cannot add player. Can only have 4 players");
    }
    const newPlayer = Player.create(name)
      .withRole("unassigned")
      .withStartingLocation("atalanta")
      .ready();

    this.players.set(name, newPlayer);
    return this;
  }

  removePlayer(
    name: string
  ): this & { readonly players: ReadonlyMap<string, Player> } {
    this.players.delete(name);
    return this;
  }

  withDifficulty(
    difficulty: Difficulty
  ): this & { readonly difficulty: Difficulty } {
    this.difficulty = difficulty;
    return this as this & { difficulty: Difficulty };
  }

  start(): GameInProgress {
    for (const prop of setupGameProps) {
      if (this[prop] === undefined) {
        throw new Error(`Cannot start game. Missing property ${prop}`);
      }
    }
    if (this.players.size < 2) {
      throw new Error(
        `Cannot start game. Not enough players. Currently ${this.players.size} but need between 2 and 4`
      );
    }

    // hand out cards and setup setups
    // change state to in progress
    this.state = "in-progress";
    return this as GameInProgress;
  }

  complete(): GameCompleted {
    this.state = "completed";
    return this as GameCompleted;
  }
}
