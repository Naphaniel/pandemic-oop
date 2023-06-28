import { Game } from "./pandemic";

const game = Game.initialise()
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

player1.startTurn().takeShuttleFlightTo("london");

console.log(player1.cards);
console.log(player2.cards);
console.log(game.researchStationsPlaced);
