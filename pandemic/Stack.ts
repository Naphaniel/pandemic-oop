export class Stack<T> {
  private _items: T[];

  get size() {
    return this._items.length;
  }

  constructor() {
    this._items = [];
  }

  isEmpty(): boolean {
    return this._items.length === 0;
  }

  push(item: T): void;
  push(...items: T[]): void;
  push(arg1: T | T[], ...args: T[]): void {
    if (Array.isArray(arg1)) {
      this._items.push(...arg1);
    } else {
      this._items.push(arg1, ...args);
    }
  }

  pop(): T | undefined {
    return this._items.pop();
  }

  get top(): T | undefined {
    return this._items[this.size - 1];
  }

  clear(): void {
    this._items = [];
  }

  shuffle(): void {
    for (let i = this.size - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._items[i], this._items[j]] = [this._items[j]!, this._items[i]!];
    }
  }

  toString(): string {
    return this._items.toString();
  }

  *[Symbol.iterator](): IterableIterator<T> {
    for (const item of this._items) {
      yield item;
    }
  }

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
      for (let j = i; j < i + stackSize && j < stack.size; j++) {
        newStack.push(stack._items[j]);
      }
      stacks.push(newStack);
    }

    return stacks;
  }

  static mergeStacks<T>(stacks: Stack<T>[]): Stack<T> {
    const mergedStack = new Stack<T>();

    for (const stack of stacks) {
      while (!stack.isEmpty()) {
        mergedStack.push(stack.pop() as T);
      }
    }

    return mergedStack;
  }
}
