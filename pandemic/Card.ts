import fs from "fs";
import { Stack } from "./Stack";
import { CityName } from "./City";
import { DiseaseType } from "./Disease";
import { DeepReadonly } from "./Utils";

type CardType = "player" | "infection" | "epidemic";
export type ReadonlyCardPile<T extends Card> = Pick<
  DeepReadonly<CardStack<T>>,
  "contents"
>;

interface Card {
  readonly id: string;
  readonly type: CardType;
}

export interface PlayerCard extends Card {
  readonly type: "player";
  readonly city?: CityName;
  readonly diseaseType?: DiseaseType;
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
    return new CardStack<T>().withStack(stack);
  }

  static merge<T extends Card>(cardStacks: CardStack<T>[]): CardStack<T> {
    const stacks = cardStacks.map((cardStack) => cardStack.stack);
    const mergedStack = Stack.mergeStacks(stacks);
    return CardStack.buildFromExistingStack(mergedStack);
  }

  private constructor(private stack = new Stack<T>()) {}

  get contents(): readonly T[] {
    return [...this.stack];
  }

  withStack(stack: Stack<T>): this {
    this.stack = stack;
    return this;
  }

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
    if (n <= 0) {
      return [];
    }
    return this.stack.popMultiple(n);
  }

  clear(): void {
    this.stack.clear();
  }

  *[Symbol.iterator](): IterableIterator<T> {
    yield* this.stack;
  }
}
