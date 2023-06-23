"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardStack = void 0;
const fs_1 = __importDefault(require("fs"));
const Stack_1 = require("./Stack");
class CardStack {
    constructor() {
        this.stack = new Stack_1.Stack();
    }
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
    *[Symbol.iterator]() {
        for (const item of this.stack) {
            yield item;
        }
    }
}
exports.CardStack = CardStack;
