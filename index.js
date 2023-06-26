"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pandemic_1 = require("./pandemic");
const game = pandemic_1.Game.initialise()
    .removePlayer("")
    .withPlayer("nathan")
    .removePlayer("nathan")
    .withPlayer("jake")
    .withPlayer("nathan")
    .withDifficulty("normal")
    .start();
const [player1, player2, player3] = game.players;
