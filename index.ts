import { Game } from "./pandemic";

const game = Game.initialise()
  .removePlayer("")
  .withPlayer("nathan")
  .removePlayer("nathan")
  .withPlayer("jake")
  .withPlayer("nathan")
  .withPlayingOrder(["nathan", "jake"])
  .start();

console.log(game.playingOrder);
const [player1, player2, player3] = game.players;
