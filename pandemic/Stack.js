"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
class Stack {
    get size() {
        return this._items.length;
    }
    constructor() {
        this._items = [];
    }
    isEmpty() {
        return this._items.length === 0;
    }
    push(arg1, ...args) {
        if (Array.isArray(arg1)) {
            this._items.push(...arg1);
        }
        else {
            this._items.push(arg1, ...args);
        }
    }
    pop() {
        return this._items.pop();
    }
    get top() {
        return this._items[this.size - 1];
    }
    clear() {
        this._items = [];
    }
    shuffle() {
        for (let i = this.size - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._items[i], this._items[j]] = [this._items[j], this._items[i]];
        }
    }
    toString() {
        return this._items.toString();
    }
    *[Symbol.iterator]() {
        for (const item of this._items) {
            yield item;
        }
    }
    static splitStacks(stack, n) {
        if (n < 1) {
            throw new Error("Invalid number of stacks. Number of stacks should be greater than 0.");
        }
        const stackSize = Math.ceil(stack.size / n);
        const stacks = [];
        for (let i = 0; i < stack.size; i += stackSize) {
            const newStack = new Stack();
            for (let j = i; j < i + stackSize && j < stack.size; j++) {
                newStack.push(stack._items[j]);
            }
            stacks.push(newStack);
        }
        return stacks;
    }
    static mergeStacks(stacks) {
        const mergedStack = new Stack();
        for (const stack of stacks) {
            while (!stack.isEmpty()) {
                mergedStack.push(stack.pop());
            }
        }
        return mergedStack;
    }
}
exports.Stack = Stack;
