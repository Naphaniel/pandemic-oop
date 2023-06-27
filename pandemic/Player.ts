import { PlayerCard } from "./CardStack";
import { City, CityName } from "./CityNetwork";
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
    `Invalid move. ${player.name} does not have the card to travel to ${
      typeof city === "string" ? city : city.name
    }`
  );

const playersCityDoesNotHaveResearchStationError = (player: Player): Error =>
  new Error(
    `Invalid move. ${player.name}'s current city (${player.location.name})` +
      "does not have  a research station"
  );

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
  readonly location: Readonly<City>;
  readonly state: State;
  readonly cards: readonly PlayerCard[];
}

export interface ActivePlayer extends BasicPlayer {
  readonly movesTakenInTurn: number;
  takeCards(n: number): void;
  driveTo(city: City | CityName): Omit<ActivePlayer, "startTurn">;
  takeDirectFlightTo(city: City | CityName): Omit<ActivePlayer, "startTurn">;

  takeCharterFlightTo(city: City | CityName): Omit<ActivePlayer, "startTurn">;

  takeShuttleFlightTo(city: City | CityName): Omit<ActivePlayer, "startTurn">;

  pass(): Omit<ActivePlayer, "startTurn">;

  startTurn(): Omit<ActivePlayer, "startTurn">;
  endTurn(): Omit<InactivePlayer, "endTurn">;
}

export interface InactivePlayer extends BasicPlayer {
  startTurn(): Omit<ActivePlayer, "startTurn">;
  endTurn(): Omit<InactivePlayer, "endTurn">;
}

export class Player implements ActivePlayer, InactivePlayer {
  static readonly MAX_ACTIONS_PER_TURN = 4;

  cards: PlayerCard[] = [];
  location: City;
  state: State = "inactive";
  movesTakenInTurn = 0;

  get isActionable() {
    return (
      this.state === "active" &&
      this.movesTakenInTurn < Player.MAX_ACTIONS_PER_TURN
    );
  }

  constructor(
    public game: PlayerAccessibleGame,
    public name: string,
    public role: Role,
    location: CityName
  ) {
    this.location = this.game.cities.getCityByName(location);
  }

  private isPlayerAtDifferentCity(city: City | CityName): boolean {
    return typeof city === "string"
      ? city !== this.location.name
      : city !== this.location;
  }

  private checkValidMovement(city: City | CityName): void {
    if (!this.isActionable) {
      throw cannotActOnPlayerError(this);
    }
    if (!this.isPlayerAtDifferentCity(city)) {
      throw playerAlreadyAtCityError(this);
    }
  }

  private discardCard(card: PlayerCard): void {
    this.cards.splice(this.cards.indexOf(card), 1);
    this.game.playerCardDiscardedPile.put(card);
  }

  takeCards(n: number = 1): void {
    const cardsTaken = this.game.playerCardDrawPile.take(n);
    for (const card of cardsTaken) {
      if (card.type === "player") {
        this.cards.push(card);
      }
    }
  }

  startTurn(): Omit<ActivePlayer, "startTurn"> {
    if (this !== this.game.currentActivePlayer) {
      throw new Error(
        `Cannot start turn for player: ${this.name}. It is not their turn`
      );
    }
    return this;
  }

  endTurn(): Omit<InactivePlayer, "endTurn"> {
    if (this === this.game.currentActivePlayer) {
      throw new Error(
        `Cannot end turn for player: ${this.name}. It is still their`
      );
    }
    return this;
  }

  driveTo(city: City | CityName): Omit<ActivePlayer, "startTurn"> {
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

  takeDirectFlightTo(city: City | CityName): Omit<ActivePlayer, "startTurn"> {
    this.checkValidMovement(city);
    const card = this.cards.find((card) => {
      if (card.city === undefined) {
        return false;
      }
      return typeof city === "string"
        ? card.city === city
        : card.city === city.name;
    });
    if (card === undefined) {
      throw playerDoesNotHaveCardError(this, city);
    }
    const newCity =
      typeof city === "string" ? this.game.cities.getCityByName(city) : city;
    this.location = newCity;
    this.discardCard(card);
    this.movesTakenInTurn++;
    return this;
  }

  takeCharterFlightTo(city: City | CityName): Omit<ActivePlayer, "startTurn"> {
    this.checkValidMovement(city);
    const card = this.cards.find((card) => {
      if (card.city === undefined) {
        return false;
      }
      return card.city === this.location.name;
    });
    if (card === undefined) {
      throw playerDoesNotHaveCardError(this, city);
    }
    const newCity =
      typeof city === "string" ? this.game.cities.getCityByName(city) : city;
    this.location = newCity;
    this.discardCard(card);
    this.movesTakenInTurn++;
    return this;
  }

  takeShuttleFlightTo(city: City | CityName): Omit<ActivePlayer, "startTurn"> {
    this.checkValidMovement(city);
    if (!this.location.hasResearchStation) {
      throw playersCityDoesNotHaveResearchStationError(this);
    }
    const newCity =
      typeof city === "string" ? this.game.cities.getCityByName(city) : city;
    this.location = newCity;
    this.movesTakenInTurn++;
    return this;
  }

  pass(): Omit<ActivePlayer, "startTurn"> {
    this.movesTakenInTurn++;
    return this;
  }
}
