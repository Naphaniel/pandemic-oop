"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pandemic_1 = require("./pandemic");
const game = pandemic_1.Game.initialise()
    .removePlayer("")
    .withPlayer("nathan")
    .withPlayer("jake")
    .withPlayer("blod")
    .withPlayingOrder(["nathan", "jake", "blod"])
    .start();
const [player1, player2, player3] = game.players;
player1
    .startTurn()
    .pass()
    .pass()
    .pass()
    .pass()
    .finishActionStage()
    .drawCards(2)
    .finishDrawStage()
    .drawInfectionCards()
    .endTurn();
