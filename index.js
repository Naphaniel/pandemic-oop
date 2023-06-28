"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pandemic_1 = require("./pandemic");
const game = pandemic_1.Game.initialise()
    .removePlayer("")
    .withPlayer("nathan")
    .withPlayer("jake")
    .withPlayingOrder(["nathan", "jake"])
    .start();
const [player1, player2, player3] = game.players;
console.log(player1.cards);
console.log(player2.cards);
console.log("");
console.log("");
player1.startTurn().pass().finishActionStage().finishDrawStage();
console.log(player1.cards);
console.log(player2.cards);
console.log(game.researchStationsPlaced);
