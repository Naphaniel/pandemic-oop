import { Game } from "./pandemic";

const game = Game.initialise()
  .withDifficulty("normal")
  .withPlayer("nathan")
  .withPlayer("blod")
  .withPlayer("jeff")
  .removePlayer("nathan")
  .withPlayer("d")
  .withPlayer("jake");

const y = game.start();
