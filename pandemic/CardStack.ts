import fs from "fs";

import { Stack } from "./Stack";

type CardType = "player" | "infection";

interface Card {
  readonly name: string;
  readonly type: CardType;
  readonly action: string;
}

export interface PlayerCard extends Card {
  readonly type: "player";
}
export interface InfectionCard extends Card {
  readonly type: "infection";
}

export class CardStack<T extends Card> {
  private readonly stack: Stack<T>;

  private constructor() {
    this.stack = new Stack<T>();
  }

  static buildFromFile<T extends Card>(path: string): CardStack<T> {
    const cardStack = new CardStack<T>();

    const jsonData = fs.readFileSync(path, "utf-8");
    const data: T[] = JSON.parse(jsonData);

    cardStack.stack.push(...data);

    return cardStack;
  }

  static buildEmptyStack<T extends Card>(): CardStack<T> {
    return new CardStack<T>();
  }

  *[Symbol.iterator](): IterableIterator<T> {
    for (const item of this.stack) {
      yield item;
    }
  }
}
