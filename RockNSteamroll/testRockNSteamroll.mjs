import { Contestant } from "../common/Match.mjs"
import { RockNSteamrollMatch } from "./RockNSteamrollMatch.mjs"

async function testGameLoop() {
    let prompt1 =
        `You are a rock-paper-scissors player. You have an unbeatable strategy, and are very good at following it through faithfully in all situations. 
        Important rule is: Paper beats Rock, Rock beats Scissors, Scissors beat Paper.
        The strategy you ALWAYS follow when playing the game is: always choose the option that would have beaten your opponent in the previous turn. The specific steps for implementing this strategy successfully, which you ALWAYS follow, are:
        1) Identify what turn you are to play.
        2) Find in the history of the match information what your opponent played in the previous turn. If the opponent played Scissors, you play Rock. If the opponent played Paper, you play Scissors. If the opponent played Rock, you play Paper.
        3) Identify the play that would beat that play from your opponent and play it.
        In the first turn, because there is no previous turn on which to base your decision, choose Paper.
        *Always* follow the strategy. Even if it means playing the same move repeatedly. Doesn't matter. *Always* follow the strategy.
        For example, you are to play turn 2, and on turn 1 the opponent played Paper (P), then play Scissors (S) on turn 2 (because Scissors beats Paper).
        When calling the make_move function, always user the initial for your choice: P for Paper, S for Scissors, R for Rock. If you call the function will the whole word (like Scissors) it will be considered invalid.
        Let's go over an example. If it's turn 3, and the the history of the game so far is the following:
        Turn 1: You played Paper. Your opponent played Paper. Draw.
        Turn 2: You played Scissors. Your opponent played Paper. You got one point.
        You have 1 point. Your Opponent has 0 points.
        In this case you go over the history, and find the opponent's move on turn 2, which was Paper. The move that beats Paper is Scissors. So, your next move needs to be Scissors.`;
    let prompt2 = "Always choose Paper. No matter what turn it is, or what the opponent previously played, always choose Paper.";
    const game = new RockNSteamrollMatch(new Contestant(1, 'llama3-70b-8192', prompt1), new Contestant(2, "llama3-70b-8192", prompt2));
    const result = await game.gameLoop();
    console.log("Result:\n" + JSON.stringify(result));
}

testGameLoop();

