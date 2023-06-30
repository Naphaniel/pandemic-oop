export class Stack<T> {
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

  static mergeStacks<T>(stacks: Stack<T>[]): Stack<T> {
    const mergedStack = new Stack<T>();

    for (const stack of stacks) {
      while (!stack.isEmpty()) {
        mergedStack.push(stack.pop()!);
      }
    }

    return mergedStack;
  }

  private items: T[] = [];

  get size(): number {
    return this.items.length;
  }

  get top(): T | undefined {
    return this.items[this.size - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  push(item: T): void;
  push(...items: T[]): void;
  push(arg1: T | T[], ...args: T[]): void {
    if (Array.isArray(arg1)) {
      this.items.push(...arg1);
    } else {
      this.items.push(arg1, ...args);
    }
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  popMultiple(n: number): T[] {
    return this.items.splice(-n, n);
  }

  clear(): void {
    this.items = [];
  }

  shuffle(): void {
    for (let i = this.size - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
    }
  }

  toString(): string {
    return this.items.toString();
  }

  *[Symbol.iterator](): IterableIterator<T> {
    yield* this.items;
  }
}
