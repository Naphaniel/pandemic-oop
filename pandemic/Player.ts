/*
 * Functionality of Player Module
 *
 * get card from player draw pile
 * discard card from hand and into discard pile
 *
 * Keep track of number of actions used each turn (4 max)
 *
 *
 * Potentially use state pattern to remove actions after 4 actions done
 *
 * Basic Actions:
 *  (Drive) Move to neighoburing city
 *  (Direct flight) Move to a specific city
 *  (Charter Flight) Move to a specific city
 *  (Shuttle Flight) move to a city with research station
 *  Pass
 *
 * Special Actions
 *   Dispatcher - move another player
 *   cure disease
 *
 *
 *  Store location of pawn (city)
 *
 *  Give a from hand to another player
 *
 *  Infectors draw from inection pile
 *  Infectors can add cube to cities
 *
 */

// potentially refaactor like user class in marketplace app and use game as listing example

import { PlayerCard } from "./CardStack";
import { CityName } from "./CityNetwork";

const NoActionsAvailableError = (playerName: string) =>
  new Error(
    `Cannot perform action on ${playerName}. Player is inactive or no actions remaining this turn.`
  );

type Role =
  | "unassigned"
  | "dispatcher"
  | "operations-expert"
  | "scientist"
  | "medic"
  | "researcher";

type State = "active" | "inactive" | "infector";

interface DraftPlayer {
  withRole(role: Role): this & { readonly role: Role };
  withStartingLocation(city: CityName): this & { readonly location: CityName };
  ready(): ActivePlayer;
}

interface Actions {
  drive(): this;
  takeDirectFlight(): void;
  takeCharterFlight(): void;
  takeShuttleFlight(): void;
  buildResearchStation(): void;
  discoverCure(): void;
  treatDisease(): void;
  shareKnowledge(): void;
  pass(): void;
}

interface CompletePlayer {
  readonly playerName: string;
  readonly actionsTaken: number;
  readonly cards: PlayerCard[];
  readonly location: CityName;
  readonly role: Role;
  readonly actionable: boolean;
}

const CompletePlayerProps: readonly (keyof CompletePlayer)[] = [
  "playerName",
  "actionsTaken",
  "cards",
  "location",
  "role",
  "actionable",
];

interface ActivePlayer extends CompletePlayer, Actions {
  readonly state: "active";
  becomeInfector(): InfectorPlayer;
  endTurn(): InactivePlayer;
}

interface InactivePlayer extends CompletePlayer {
  readonly state: "inactive";
}

interface InfectorPlayer extends CompletePlayer {
  readonly state: "infector";
  infect(): void;
}

export type Player =
  | DraftPlayer
  | ActivePlayer
  | InactivePlayer
  | InfectorPlayer;

export const Player = {
  create(playerName: string): DraftPlayer {
    return ConcretePlayer.create(playerName);
  },
};

class ConcretePlayer {
  public static readonly maxActionsPerTurn = 4;

  actionsTaken = 0;
  cards: PlayerCard[] = [];
  location?: CityName;
  role?: Role;
  state?: State;

  get actionable() {
    return (
      this.actionsTaken < ConcretePlayer.maxActionsPerTurn &&
      this.state === "active"
    );
  }

  private constructor(public readonly playerName: string) {}

  static create(playerName: string): DraftPlayer {
    return new ConcretePlayer(playerName);
  }

  withRole(role: Role): this & { readonly role: Role } {
    this.role = role;
    return this as this & { readonly role: Role };
  }

  withStartingLocation(city: CityName): this & { readonly location: CityName } {
    // TODO: construct city object
    this.location = city;
    return this as this & { readonly location: CityName };
  }

  takeCards(n: number): this & { readonly cards: readonly PlayerCard[] } {
    // TODO: construct card object
    for (let i = 0; i < n; i++) {
      this.cards.push({ name: `card ${i}`, type: "player", action: "" });
    }
    return this as this & { readonly cards: readonly PlayerCard[] };
  }

  ready(): ActivePlayer {
    for (const prop of CompletePlayerProps) {
      if (this[prop] === undefined) {
        throw new Error(`Cannot ready player, missing prop ${prop}`);
      }
    }
    this.state = "active";
    return this as ActivePlayer;
  }

  becomeInfector(): InfectorPlayer {
    this.state = "infector";
    return this as InfectorPlayer;
  }

  endTurn(): InactivePlayer {
    this.state = "inactive";
    return this as InactivePlayer;
  }

  drive(): this {
    if (!this.actionable) {
      throw NoActionsAvailableError(this.playerName);
    }
    // TODO
    this.actionsTaken++;
    return this;
  }

  takeDirectFlight(): this {
    if (!this.actionable) {
      throw NoActionsAvailableError(this.playerName);
    }
    // TODO
    this.actionsTaken++;
    return this;
  }

  takeCharterFlight(): this {
    if (!this.actionable) {
      throw NoActionsAvailableError(this.playerName);
    }
    // TODO
    this.actionsTaken++;
    return this;
  }

  takeShuttleFlight(): this {
    if (!this.actionable) {
      throw NoActionsAvailableError(this.playerName);
    }
    // TODO
    this.actionsTaken++;
    return this;
  }

  buildResearchStation(): void {
    if (!this.actionable) {
      throw NoActionsAvailableError(this.playerName);
    }
    // TODO
    this.actionsTaken++;
  }

  discoverCure(): void {
    if (!this.actionable) {
      throw NoActionsAvailableError(this.playerName);
    }
    // TODO
    this.actionsTaken++;
  }

  treatDisease(): void {
    if (!this.actionable) {
      throw NoActionsAvailableError(this.playerName);
    }
    // TODO
    this.actionsTaken++;
  }

  shareKnowledge(): void {
    if (!this.actionable) {
      throw NoActionsAvailableError(this.playerName);
    }
    // TODO
    this.actionsTaken++;
  }

  pass(): void {
    if (!this.actionable) {
      throw NoActionsAvailableError(this.playerName);
    }
    // TODO
    this.actionsTaken++;
  }

  infect(): void {}
}
