import { Game } from "./pandemic";

const game = Game.initialise()
  .removePlayer("")
  .withPlayer("nathan")
  .withPlayer("jake")
  .withPlayingOrder(["nathan", "jake"])
  .start();

const [player1, player2, player3] = game.players;

console.log(player1.location);
console.log(player1.cards);
console.log("");
console.log(game.playerCardDrawPile.contents);
console.log("");
console.log(game.playerCardDiscardedPile.contents);

player1.startTurn().takeDirectFlightTo("london").takeShuttleFlightTo("london");

console.log("AFTERM FLIGHT");
console.log(player1.location);
console.log(player1.cards);
console.log("");
console.log(game.playerCardDrawPile.contents);
console.log("");
console.log(game.playerCardDiscardedPile.contents);
