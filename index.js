"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pandemic_1 = require("./pandemic");
const game = pandemic_1.Game.initialise()
    .withPlayer("player 1")
    .withPlayer("player 2")
    .withPlayingOrder(["player 1", "player 2"])
    .withDifficulty("normal")
    .start();
const [player1, player2] = game.players;
player1
    .startTurn()
    .driveTo("london")
    .pass()
    .pass()
    .pass()
    .finishActionStage()
    .drawCards(2)
    .finishDrawStage()
    .drawInfectionCards()
    .endTurn();
player2
    .startTurn()
    .takeDirectFlightTo("london")
    .pass()
    .pass()
    .pass()
    .finishActionStage()
    .drawCards(2)
    .finishDrawStage()
    .drawInfectionCards()
    .endTurn();
