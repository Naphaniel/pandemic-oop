"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pandemic_1 = require("./pandemic");
const game = pandemic_1.Game.initialise()
    .withDifficulty("normal")
    .withPlayer("nathan")
    .withPlayer("blod")
    .withPlayer("jeff")
    .removePlayer("nathan")
    .withPlayer("d")
    .withPlayer("jake");
const y = game.start();
