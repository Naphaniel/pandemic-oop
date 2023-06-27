import { PlayerCard } from "./CardStack";
import { City, CityName } from "./CityNetwork";
import { PlayerAccessibleGame } from "./Game";

type State = "active" | "inactive";

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
  readonly location: City;
  readonly state: State;
  get cards(): readonly PlayerCard[];
}

export interface ActivePlayer extends BasicPlayer {
  takeCards(n: number): void;
  startTurn(): Omit<ActivePlayer, "startTurn">;
  endTurn(): Omit<InactivePlayer, "endTurn">;
}

export interface InactivePlayer extends BasicPlayer {
  startTurn(): Omit<ActivePlayer, "startTurn">;
  endTurn(): Omit<InactivePlayer, "endTurn">;
}

export class Player implements ActivePlayer, InactivePlayer {
  _cards: PlayerCard[] = [];
  location: City;
  state: State = "inactive";

  get cards(): readonly PlayerCard[] {
    return this._cards;
  }

  constructor(
    public game: PlayerAccessibleGame,
    public name: string,
    public role: Role,
    location: CityName
  ) {
    this.location = this.game.cities.getCityByName(location);
  }

  takeCards(n: number = 1): void {
    const cardsTaken = this.game.playerCardDrawPile.take(n);
    for (const card of cardsTaken) {
      if (card.type === "player") {
        this._cards.push(card);
      }
    }
  }

  startTurn(): Omit<ActivePlayer, "startTurn"> {
    if (this !== this.game.currentActivePlayer) {
      throw new Error(
        `Cannot start turn for player: ${this.name}. It is not their turn`
      );
    }
    return this as Omit<ActivePlayer, "startTurn">;
  }

  endTurn(): Omit<InactivePlayer, "endTurn"> {
    if (this === this.game.currentActivePlayer) {
      throw new Error(
        `Cannot end turn for player: ${this.name}. It is still their`
      );
    }
    return this as Omit<InactivePlayer, "endTurn">;
  }
}
