import { Groq as _Groq } from "groq-sdk";
import { Contestant, TicTacToeGame } from "./TicTacToeGame.mjs"

async function main() {
    let prompt1 = `We are going to play tic-tac-toe. The game is played in a 3-by-3 board, and the goal is to get 3 of your pieces in a row (vertically, horizontally, or diagonally) before your opponent. Your opponent will try to do the same. In each turn you will get a message with the current status of the board in the parameter called \"gameStatus\". The format of gameStatus is a list containing 3 lists, each of the 3 sub-lists represents a horizontal row in the board. Dots represent empty squares that you may play. The squares are numbered 1 to 3, so that the first element of the list is 1-1, and the last element of the first sub-list is 1-3 (row=1, column=3). The center of the board is the second element in the second sublist (row=2, column=2). Don't play in positions of the board that are already occupied, only moves to empty spaces (those marked with a dot) are allowed. The positions marked by 'O' or 'X' are already played, and trying to play them again is illegal, so don't do it! If you try to play an illegal move, you will lose your turn and your opponent will play.  
    For selecting your move, follow the following logic:
    - Identify empty squares in the board (those marked by a dot). Those are the only ones you can play.
    - If the center of the board hasn't already been played, play it!
    - If any move will give you three in a row, play it.
    - If any move would give your adversary three in a row, play it.
    - If none of the previous, play any of the empty positions.
    `;
    let prompt2 = `We are going to play tic-tac-toe. The game is played in a 3-by-3 board, and the goal is to get 3 of your pieces in a row (vertically, horizontally, or diagonally) before your opponent. Your opponent will try to do the same. In each turn you will get a message with the current status of the board in the parameter called \"gameStatus\". The format of gameStatus is a list containing 3 lists, each of the 3 sub-lists represents a horizontal row in the board. Dots represent empty squares that you may play. The squares are numbered 1 to 3, so that the first element of the list is 1-1, and the last element of the first sub-list is 1-3 (row=1, column=3). The center of the board is the second element in the second sublist (row=2, column=2). Don't play in positions of the board that are already occupied, only moves to empty spaces (those marked with a dot) are allowed. The positions marked by 'O' or 'X' are already played, and trying to play them again is illegal, so don't do it! If you try to play an illegal move, you will lose your turn and your opponent will play.  
    For selecting your move, follow the following logic:
    - Identify empty squares in the board (those marked by a dot). Those are the only ones you can play.
    - Choose an empty position at random.
    `;
    let prompt3 = "Always play 3,3 no matter what!"
    const game = new TicTacToeGame(new Contestant(1, 'llama3-70b-8192', prompt1), new Contestant(2, "llama3-70b-8192", prompt2));
    const result = await game.gameLoop();
    console.log(game.board);
    console.log("Final result: " + result.winner);
    console.log("=== HISTORY ===\n" + JSON.stringify(result.history, null, 4));
}

main();
