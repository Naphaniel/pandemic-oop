dex.# pandemic-oop
Assignment for OOP Jun 2023

# How to run
The `tsconfig.json`file has been provided therefore compiling and running the application is trivial.

To simply compile the TypeScript into JavaScript you can run:
1. In root directory run `tsc`
  
Otherwise, to compile and run the application on watch mode do the following:
1. `npm install`
2. `npm run start`
This will start the application starting from `index.ts` as an entry point.

The game is playable by importing the Game module and initialising a new game with `Gme.Initialise()` and configuring.

The game rules, the types in the code and the documentation should make it self-explanatory of how to play.

Below is an example, 

```ts
import { Game } from "./pandemic";

const game = Game.initialise()
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
```
