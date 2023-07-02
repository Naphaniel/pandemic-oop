import fs from "fs";
import { Stack } from "./Stack";
import { CityName } from "./City";
import { DiseaseType } from "./Disease";
import { DeepReadonly } from "./Utils";

/**
 * Internal type used to represent the 3 types of card
 */

type CardType = "player" | "infection" | "epidemic";

/**
 * External type that provides readonly access to {@link CardStack} by
 * using in built type Pick and a custom type {@link DeepReadonly} that
 * recursively makes a type readonly. We further encapsulate the card stack
 * by only exposing the contents property of the card stack as readonly.
 */
export type ReadonlyCardPile<T extends Card> = Pick<
  DeepReadonly<CardStack<T>>,
  "contents"
>;

/**
 * A lightweight, immutable type to carry around Card data. This did not
 * need to be a class as it is low level data.
 *
 * We use this type as a 'super type/base type'. We do not export this type
 * but instead use {@link PlayerCard} {@link InfectionCard} and {@link EpidemicCard}
 * to provide immutable interfaces to the different types of card.
 *
 * Primarily accessed and used within the {@link CardStack} class.
 */
interface Card {
  readonly id: string;
  readonly type: CardType;
}

/**
 * Lightweight interface which exposes an interfact to interact with player cards.
 * Exposing additional city and disease type fields.
 */
export interface PlayerCard extends Card {
  readonly type: "player";
  readonly city?: CityName;
  readonly diseaseType?: DiseaseType;
}

/**
 * Lightweight interface which exposes an interfact to interact with infection cards.
 * Exposing additional city and disease type fields.
 */
export interface InfectionCard extends Card {
  readonly type: "infection";
  readonly city: CityName;
  readonly diseaseType: DiseaseType;
}

/**
 * Lightweight interface which exposes an interfact to interact with epidemic cards.
 * Although there are no additional fields exposed, we ensure that the type of
 * these cards can only be "epidemic" for better static type checking.
 */
export interface EpidemicCard extends Card {
  readonly type: "epidemic";
}

/**
 * Represents a generic stack of cards which in the domain of the pandemic game
 * represents the card piles on the board.
 *
 * @typeParam `T extends Card` - Type of card that is being stored in the card
 * stack. Either {@link PlayerCard}, {@link InfectionCard} or {@link EpidemicCard}
 *
 * @remarks
 * We decide not to use inheritance to implement {@link CardStack} from {@link Stack}
 * but instead use composition. We do this as we do not want to use all of
 * the functionality from {@link Stack} and the functionality we do want to
 * use has some additional logic (f.e taking multiple). We also aim to make
 * a data structure that is domain specific but makes use of a generic, reusuable
 * data strucutre.
 *
 * The time and space complexity of the {@link CardStack} is identical to
 * the {@link Stack} operations.
 *
 * We choose to use a {@link Stack} to represent the games card piles as we
 * want efficient access to the top card on the pile, and the ability to
 * efficiently add cards to the pile (i.e when a player discards a card) this
 * requirements aligns with what the {@link Stack} provides, after adding some
 * other requirements such as shuffling and merging.
 */
export class CardStack<T extends Card> {
  /**
   * Utility method to build a new {@link CardStack} of cards from the given JSON file.
   *
   * @typeParam `T extends Card` - The type of card stored in the {@link CardStack}.
   * @param path - File path to the data file.
   * @returns A new {@link CardStack} instance.
   *
   * @remarks
   * This static method allows us to construct a new {@link CardStack} with either a data
   * file or an empty {@link CardStack} from the {@link CardStack.constructor}. Seeding from a file
   * can automate a lot of setup.
   */
  static buildFromFile<T extends Card>(path: string): CardStack<T> {
    const cardStack = new CardStack<T>();
    const jsonData = fs.readFileSync(path, "utf-8");
    const data: T[] = JSON.parse(jsonData);
    cardStack.stack.push(...data);
    return cardStack;
  }

  /**
   * Utility method to build a new empty {@link CardStack} of cards.
   *
   * @typeParam `T extends Card` - The type of card stored in the {@link CardStack}.
   * @returns A new empty {@link CardStack} instance.
   */
  static buildEmptyStack<T extends Card>(): CardStack<T> {
    return new CardStack<T>();
  }

  /**
   * Utility method to build a new {@link CardStack} from a {@link Stack} of cards.
   *
   * @typeParam `T extends Card` - The type of card stored in the {@link CardStack}.
   * @param stack - A {@link Stack} to build a {@link CardStack} from.
   * @returns A new {@link CardStack} instance built from an existing {@link Stack}.
   */
  static buildFromExistingStack<T extends Card>(stack: Stack<T>): CardStack<T> {
    return new CardStack<T>().withStack(stack);
  }

  /**
   * Utility method to build a new CardStack by merging multiple CardStacks.
   *
   * @typeParam `T extends Card` - The type of card stored in the CardStack.
   * @param cardStacks - Array of {@link CardStack} to merge.
   * @returns A new {@link CardStack} which is built by combining {@link CardStack}.
   */
  static merge<T extends Card>(cardStacks: CardStack<T>[]): CardStack<T> {
    const stacks = cardStacks.map((cardStack) => cardStack.stack);
    const mergedStack = Stack.mergeStacks(stacks);
    return CardStack.buildFromExistingStack(mergedStack);
  }

  /**
   * Private constructor to enforce initialisation of {@link CardStack} through
   * static methods {@link CardStack.buildFromFile}, {@link CardStack.buildEmptyStack}
   * and {@link CardStack.buildFromExistingStack}. Also to enforce encapsulation.
   *
   * @param stack - The {@link Stack} to base the {@link CardStack} from. Defaulted
   * to an empty if not passed as an argument.
   *
   * We use constructor assignment to initialise an empty {@link Stack} which
   * will be our mutable, internal data store for the {@link CardStack}. It
   * is only possible to modify this through the class methods. Generally it
   * is only exposed externally through the {@link ReadonlyCardPile} type.
   */
  private constructor(private stack = new Stack<T>()) {}

  /**
   * Gets the cards stored in the {@link CardStack}.
   *
   * @returns An immutable, readonly array containing the cards in the {@link CardStack}.
   *
   * @remarks
   * We ensure that the return is immutable so the consumer cannot add
   * or modify the internal {@link Stack}. The cards are already readonly through
   * their interfaces.
   */
  get contents(): readonly T[] {
    return [...this.stack];
  }

  /**
   * Internal utility method used to build a {@link CardStack} from an existing
   * {@link Stack}.
   *
   * @param stack - The {@link Stack} to replace the current instances with.
   * @returns The current instance of {@link CardStack}
   *
   * @remarks
   * We use the utility function in {@link CardStack.buildFromExistingStack} instead of
   * assigning directly to avoid a strong link between the {@link CardStack} and {@link Stack}
   */
  private withStack(stack: Stack<T>): this {
    this.stack = stack;
    return this;
  }

  /**
   * Place a card onto the top of the {@link CardStack}
   *
   * @param card - The card to add to the {@link CardStack}
   */
  put(card: T): void {
    this.stack.push(card);
  }

  /**
   * Shuffles the {@link CardStack} in-place.
   */
  shuffle(): void {
    this.stack.shuffle();
  }

  /**
   * Split the {@link CardStack} into equal (where possible) {@link CardStack}
   * derivatives.
   *
   * @param n - The number of times to split the {@link CardStack}
   * @returns An array of newly created {@link CardStack}
   */
  split(n: number): CardStack<T>[] {
    return Stack.splitStacks<T>(this.stack, n).map((stack) =>
      CardStack.buildFromExistingStack<T>(stack)
    );
  }

  /**
   * Take one or multiple cards from the top of the {@link CardStack}.
   *
   * @param n - The number of cards to take. Defaults to 1 if no argument passed.
   * @returns An array containing the cards taken from the top of the {@link CardStack}
   */
  take(n: number = 1): T[] {
    if (n <= 0) {
      return [];
    }
    return this.stack.popMultiple(n);
  }

  /**
   * Empty the {@link CardStack}
   */
  clear(): void {
    this.stack.clear();
  }

  /**
   * Returns an iterator for all the cards in the {@link CardStack}, which enables iteration
   * using a `for...of` loop.
   *
   * @remarks
   * This enables consumers to iterate over the {@link CardStack} without being concerned
   * about the underlying implementation of the {@link CardStack}.
   */
  *[Symbol.iterator](): IterableIterator<T> {
    yield* this.stack;
  }
}
