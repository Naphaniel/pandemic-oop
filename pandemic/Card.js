"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardStack = void 0;
const fs_1 = __importDefault(require("fs"));
const Stack_1 = require("./Stack");
class CardStack {
    static buildFromFile(path) {
        const cardStack = new CardStack();
        const jsonData = fs_1.default.readFileSync(path, "utf-8");
        const data = JSON.parse(jsonData);
        cardStack.stack.push(...data);
        return cardStack;
    }
    static buildEmptyStack() {
        return new CardStack();
    }
    static buildFromExistingStack(stack) {
        return new CardStack().withStack(stack);
    }
    static merge(cardStacks) {
        const stacks = cardStacks.map((cardStack) => cardStack.stack);
        const mergedStack = Stack_1.Stack.mergeStacks(stacks);
        return CardStack.buildFromExistingStack(mergedStack);
    }
    constructor(stack = new Stack_1.Stack()) {
        this.stack = stack;
    }
    get contents() {
        return [...this.stack];
    }
    withStack(stack) {
        this.stack = stack;
        return this;
    }
    put(card) {
        this.stack.push(card);
    }
    shuffle() {
        this.stack.shuffle();
    }
    split(n) {
        return Stack_1.Stack.splitStacks(this.stack, n).map((stack) => CardStack.buildFromExistingStack(stack));
    }
    take(n = 1) {
        if (n <= 0) {
            return [];
        }
        return this.stack.popMultiple(n);
    }
    clear() {
        this.stack.clear();
    }
    *[Symbol.iterator]() {
        yield* this.stack;
    }
}
exports.CardStack = CardStack;
