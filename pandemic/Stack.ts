/**
 *  Represents a generic stack data structure.
 *
 *  @typeParam `T` - The type of items stored within the stack.
 *
 *  @remarks
 *  This generic data structure illustrates **parametric polymorphism** through
 *  generic types. The behaviour of the Stack datastructure is the same regardless
 *  of the data type it is storing.
 *
 *  Stack operations complexity:
 *    - Access specific element O(n)
 *    - Access top element O(1)
 *    - Search O(n)
 *    - Insertion of top O(1)
 *    - Deletion of top O(n)
 *
 */
export class Stack<T> {
  /**
   * Private mutable array of items stored in the stack.
   *
   * @remarks
   * Items in the stack are made private and are only accessible through getters
   * and other methods in {@link Stack} class,for **encapsulation**.
   */
  private items: T[] = [];

  /**
   * Gets the number of items in the stack.
   *
   * @Remarks
   * A getter is used to avoid accessing the internal data storage of items.
   * The value is also computed so a getter is suitable.
   */
  get size(): number {
    return this.items.length;
  }

  /**
   * Gets the item on the top of the stack without removing it.
   *
   * @returns The top item on the stack or `undefined` if the stack is empty.
   *
   * @remarks
   * A getter is used to avoid accessing the internal data storage of items.
   * The value is also computed so a getter is suitable.
   */
  get top(): T | undefined {
    return this.items[this.size - 1];
  }

  /**
   * Checks if the stack is empty.
   *
   * @returns 'true' if the stack is empty, otherwise 'false'.
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Pushes one or multiple items onto the top of the stack.
   *
   * @param item - Item to push onto the stack.
   * @param items - Items to push onto the stack.
   *
   * @remarks
   * Encorporates method signature overloading to support multiple parameters
   * for the same implementation to improve reusability.
   */
  push(item: T): void;
  push(...items: T[]): void;
  push(arg1: T | T[], ...args: T[]): void {
    if (Array.isArray(arg1)) {
      this.items.push(...arg1);
    } else {
      this.items.push(arg1, ...args);
    }
  }

  /**
   * Removes and returns the top item from the stack.
   *
   * @returns the item on the top of the stack, or `undefined` if the stack is empty.
   */
  pop(): T | undefined {
    return this.items.pop();
  }

  /**
   * Removes and returns a specific number of items from the top of the stack.
   *
   * @param n - The number of items to remove.
   * @returns An array containing the removed items.
   */
  popMultiple(n: number): T[] {
    return this.items.splice(-n, n);
  }

  /**
   * Removes all the items from the stack.
   */
  clear(): void {
    this.items = [];
  }

  /**
   * Implements the Fisher-Yates algorithm ({@link https://en.wikipedia.org/wiki/Fisher–Yates_shuffle})
   * to suffle the contents of the stack in place.
   */
  shuffle(): void {
    for (let i = this.size - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
    }
  }

  /**
   * Returns the string representation of the stack.
   *
   * @returns The string representation of the stack.
   */
  toString(): string {
    return this.items.toString();
  }

  /**
   * Returns an iterator for all the items in the stack, which enables iteration
   * using a `for...of` loop.
   *
   * @remarks
   * This enables consumers to iterate over the stack without being concerned
   * about the underlying implementation of the stack.
   */
  *[Symbol.iterator](): IterableIterator<T> {
    yield* this.items;
  }

  /**
   * Splits the given stack into multiple stack. This does not modify the stack
   * passed in, {@link stack}.
   *
   * @typeparam `T` - The type of items stored in the stack.
   * @param stack - The stack to be split.
   * @param n - The number of stacks to split {@link stack} into.
   * @returns An array of the created stacks.
   * @throws {Error} If the number of times {@link n} to split {@link stack}
   * is less than 1.
   *
   * @remarks
   * This method is static as it does not act on an instance specific instace
   * of a stack.
   */

  static splitStacks<T>(stack: Stack<T>, n: number): Stack<T>[] {
    if (n < 1) {
      throw new Error(
        "Invalid number of stacks. Number of stacks should be greater than 0."
      );
    }

    const stackSize = Math.ceil(stack.size / n);
    const stacks: Stack<T>[] = [];

    for (let i = 0; i < stack.size; i += stackSize) {
      const newStack = new Stack<T>();
      const end = Math.min(i + stackSize, stack.size);

      for (let j = i; j < end; j++) {
        newStack.push(stack.items[j]);
      }

      stacks.push(newStack);
    }

    return stacks;
  }

  /**
   * Merges an array of stacks into a new, single stack. By pushing them
   * ontop of each other
   *
   * @typeparam `T` - The type of items stored in the stacks.
   * @param stacks - The array of stacks to be merged.
   * @returns The newly ceeated merged stack.
   *
   * @remarks
   * This method is static as it does not act on an instance specific instace
   * of a stack.
   */
  static mergeStacks<T>(stacks: Stack<T>[]): Stack<T> {
    const mergedStack = new Stack<T>();

    for (const stack of stacks) {
      while (!stack.isEmpty()) {
        mergedStack.push(stack.pop()!);
      }
    }

    return mergedStack;
  }
}
