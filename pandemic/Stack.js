"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
class Stack {
    constructor() {
        this.items = [];
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
                newStack.push(stack.items[j]);
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
    get size() {
        return this.items.length;
    }
    get top() {
        return this.items[this.size - 1];
    }
    isEmpty() {
        return this.items.length === 0;
    }
    push(arg1, ...args) {
        if (Array.isArray(arg1)) {
            this.items.push(...arg1);
        }
        else {
            this.items.push(arg1, ...args);
        }
    }
    pop() {
        return this.items.pop();
    }
    clear() {
        this.items = [];
    }
    shuffle() {
        for (let i = this.size - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
        }
    }
    toString() {
        return this.items.toString();
    }
    *[Symbol.iterator]() {
        for (const item of this.items) {
            yield item;
        }
    }
}
exports.Stack = Stack;
