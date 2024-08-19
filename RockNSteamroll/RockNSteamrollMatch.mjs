import Groq from "groq-sdk";
import { Match, Contestant, Tool } from "../common/Match.mjs";

const groq = new Groq.Groq({ apiKey: process.env.GROQ_API_KEY });

const plays = {
    P: "Paper",
    S: "Scissors",
    R: "Rock",
    " ": "Invalid"
};

export class RockNSteamrollMatch extends Match {
    constructor(contestant1, contestant2) {
        super(contestant1, contestant2);
        this.cont1 = contestant1;
        this.cont2 = contestant2;
        this.toolSpecs = [{
            type: "function",
            function: {
                name: "make_move",
                description: "Make a choice: Rock, Paper or Scissors",
                parameters: {
                    type: "object",
                    properties: {
                        choice: {
                            type: "string",
                            description: "R for Rock, P for Paper, S for Scissors",
                        }
                    },
                    required: ["choice"]
                }
            }
        }];
        this.cont1.choices = [];
        this.cont2.choices = [];
        this.cont1.points = [];
        this.cont2.points = [];
        this.cont1.getTotalPoints = this.cont2.getTotalPoints = function () { return this.points.reduce((partial, a) => partial + a, 0); }
    }

    getHistoryMessages() {
        let histMess1 = "", histMess2 = "";
        for (let turn = 0; turn < this.cont1.choices.length; turn++) {
            let res1, res2;
            if (this.cont1.points[turn] > this.cont2.points[turn]) {
                res1 = `You won and scored ${this.cont1.points[turn]} point${this.cont1.points[turn] == 1 ? "" : "s"}.`;
                res2 = `Your opponent won and scored ${this.cont1.points[turn]} point${this.cont1.points[turn] == 1 ? "" : "s"}.`;
            } else if (this.cont1.points[turn] < this.cont2.points[turn]) {
                res1 = `Your opponent won and scored ${this.cont2.points[turn]} point${this.cont2.points[turn] == 1 ? "" : "s"}.`;
                res2 = `You won and scored ${this.cont2.points[turn]} point${this.cont2.points[turn] == 1 ? "" : "s"}.`;
            } else res1 = res2 = "Draw."
            histMess1 += `Turn ${turn + 1}: You played ${plays[this.cont1.choices[turn]]}. Your opponent played ${plays[this.cont2.choices[turn]]}. ${res1}\n`;
            histMess2 += `Turn ${turn + 1}: You played ${plays[this.cont2.choices[turn]]}. Your opponent played ${plays[this.cont1.choices[turn]]}. ${res2}\n`;
        }
        let totalScore1 = this.cont1.getTotalPoints();
        let totalScore2 = this.cont2.getTotalPoints(); //this.cont2.points.reduce((partial, a) => partial + a, 0);
        histMess1 += `You have ${totalScore1} points. Your Opponent has ${totalScore2} points.`;
        histMess2 += `You have ${totalScore2} points. Your Opponent has ${totalScore1} points.`;
        return { histMess1, histMess2 };
    }

    getMove(llmResponse) {
        if (!llmResponse.choices[0].message.tool_calls)
            return " ";

        const f = llmResponse.choices[0].message.tool_calls[0].function;
        if (f.name != "make_move") return " ";
        const args = JSON.parse(f.arguments);
        if (!["R", "P", "S"].includes(args.choice)) return " ";
        return args.choice;
    }

    scorePlay(move1, move2) {
        this.cont1.choices.push(move1);
        this.cont2.choices.push(move2);
        if (move1 === move2) {
            this.cont1.points.push(0);
            this.cont2.points.push(0);
        } else if (move1 === "R") {
            if (move2 === "P") {
                this.cont1.points.push(0);
                this.cont2.points.push(1);
            } else if (move2 === "S") {
                this.cont1.points.push(5);
                this.cont2.points.push(0);
            } else {
                this.cont1.points.push(1); // Rock will only score 5 against scissors.
                this.cont2.points.push(0);
            }
        } else if (move1 === "P") {
            if (move2 === "S") {
                this.cont1.points.push(0);
                this.cont2.points.push(1);
            } else {
                this.cont1.points.push(1);
                this.cont2.points.push(0);
            }
        } else if (move1 === "S") {
            if (move2 === "R") {
                this.cont1.points.push(0);
                this.cont2.points.push(5);
            } else {
                this.cont1.points.push(1);
                this.cont2.points.push(0);
            }
        } else {
            this.cont1.points.push(0);
            this.cont2.points.push(1); // Even if it's Rock. Rock will only score 5 against scissors.
        }

    }

    async gameLoop() {
        let messages1, messages2;
        messages1 = [
            {
                role: "system",
                content: this.cont1.script,
            }];

        messages2 = [
            {
                role: "system",
                content: this.cont2.script,
            }];

        for (let i = 0; i < 5; i++) {
            if (i == 0) {
                messages1.push({
                    role: "user",
                    content: "Turn 1. What will be your first choice?"
                });
                messages2.push({
                    role: "user",
                    content: "Turn 1. What will be your first choice?"
                });
            } else {
                let { histMess1, histMess2 } = this.getHistoryMessages();
                messages1.push({
                    role: "user",
                    content: `The game up to this point:\n${histMess1}\nThis is turn ${i + 1}. What will be your next choice?`
                });
                messages2.push({
                    role: "user",
                    content: `The game up to this point:\n${histMess2}\nThis is turn ${i + 1}. What will be your next choice?`
                });
            }

            console.log("Messages1: " + JSON.stringify(messages1));
            console.log("Messages2: " + JSON.stringify(messages2));

            // We should be able to do better and call both in parallel, as they are independent
            const resp1 = await groq.chat.completions.create({
                messages: messages1,
                model: this.cont1.model,
                tools: this.toolSpecs
            })
            const move1 = this.getMove(resp1);

            const resp2 = await groq.chat.completions.create({
                messages: messages2,
                model: this.cont2.model,
                tools: this.toolSpecs
            })
            const move2 = this.getMove(resp2);

            console.log("Resp1: " + JSON.stringify(resp1));
            console.log("Resp2: " + JSON.stringify(resp2));

            this.scorePlay(move1, move2);
            if (this.cont1.getTotalPoints() >= 5 || this.cont2.getTotalPoints() >= 5) break;

            messages1.pop();
            messages2.pop();
        }

        let winner = null;
        if (this.cont1.getTotalPoints() > this.cont2.getTotalPoints())
            winner = this.cont1.id;
        else if (this.cont1.getTotalPoints() < this.cont2.getTotalPoints())
            winner = this.cont2.id;

        return {
            winner: winner,
            history: {
                choices1: this.cont1.choices,
                choices2: this.cont2.choices,
                points1: this.cont1.points,
                points2: this.cont2.points
            }
        };
    }
}
