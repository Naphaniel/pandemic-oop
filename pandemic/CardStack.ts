import fs from "fs";
import { Stack } from "./Stack";
import { CityName } from "./CityNetwork";
import { DiseaseType } from "./Disease";

type CardType = "player" | "infection" | "epidemic";

interface Card {
  readonly id: string;
  readonly type: CardType;
}

export interface PlayerCard extends Card {
  readonly type: "player";
}

export interface InfectionCard extends Card {
  readonly type: "infection";
  readonly city: CityName;
  readonly diseaseType: DiseaseType;
}

export interface EpidemicCard extends Card {
  readonly type: "epidemic";
}

export class CardStack<T extends Card> {
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

  static buildFromExistingStack<T extends Card>(stack: Stack<T>): CardStack<T> {
    return new CardStack<T>(stack);
  }

  static merge<T extends Card>(cardStacks: CardStack<T>[]): CardStack<T> {
    const stacks = cardStacks.map((cardStack) => cardStack.stack);
    const mergedStack = Stack.mergeStacks(stacks);
    return CardStack.buildFromExistingStack(mergedStack);
  }

  private constructor(private readonly stack = new Stack<T>()) {}

  put(card: T): void {
    this.stack.push(card);
  }

  shuffle(): void {
    this.stack.shuffle();
  }

  split(n: number): CardStack<T>[] {
    return Stack.splitStacks<T>(this.stack, n).map((stack) =>
      CardStack.buildFromExistingStack<T>(stack)
    );
  }

  take(n: number = 1): T[] {
    if (n < 0) {
      return [];
    }
    const cards: T[] = [];
    for (let i = 0; i < n; i++) {
      const card = this.stack.pop();
      if (card === undefined) {
        return cards;
      }
      cards.push(card);
    }
    return cards;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    for (const card of this.stack) {
      yield card;
    }
  }
}
