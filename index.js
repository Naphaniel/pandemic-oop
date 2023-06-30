"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pandemic_1 = require("./pandemic");
const game = pandemic_1.Game.initialise()
    .withPlayer("nathan")
    .withPlayer("jake")
    .withPlayer("blod")
    .withPlayingOrder(["nathan", "jake", "blod"])
    .start();
const [player1, player2, player3] = game.players;
const city = game.cityNetwork.getCityByName("london");
player1
    .startTurn()
    .driveTo(city)
    .pass()
    .pass()
    .pass()
    .finishActionStage()
    .drawCards(2)
    .finishDrawStage()
    .drawInfectionCards()
    .endTurn();
