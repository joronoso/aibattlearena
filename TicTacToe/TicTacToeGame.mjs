import Groq from "groq-sdk";

const groq = new Groq.Groq({ apiKey: process.env.GROQ_API_KEY });

class Contestant {
    constructor(id, model, script) {
        this.id = id;
        this.model = model;
        this.script = script;
    }
}

class Tool {
    constructor(name, specification, func) {
        this.name = name;
        this.specification = specification;
        this.func = func;
    }
}

class TicTacToeLLM {
    constructor(game, model, id, systemPrompt, toolset, info, color) {
        this.game = game;
        this.model = model;
        this.id = id;
        this.messages = [
            {
                role: "system",
                content: systemPrompt,
            }];
        this.toolset = toolset;
        this.info = info;
        this.color = color;
        this.toolSpecs = toolset.map((o) => o.specification);
    }

    async makeMove(gameStatus) {
        this.messages[1] = {
            role: "user",
            content: JSON.stringify(gameStatus)
        };
        const response = await groq.chat.completions.create({
            messages: this.messages,
            model: this.model,
            tools: this.toolSpecs
        });
        if (response.choices[0].message.tool_calls) {
            const f = response.choices[0].message.tool_calls[0].function;
            if (f.name != "make_move") this.lastMoveInfo = "Invalid tool name.";
            else {
                this.lastMoveInfo = this.toolset[0].func(this, JSON.parse(f.arguments));
            }
        } else this.lastMoveInfo = "No tool was called";
        this.game.logMessage(this.lastMoveInfo, this, response.choices[0].message.tool_calls?.[0]?.function?.name, JSON.parse(response.choices[0].message.tool_calls?.[0]?.function?.arguments));
    }
}

class TicTacToeGame {

    logMessage(message, llm, tool, params) {
        this.history.push({
            tool: tool,
            params: params,
            player_color: llm.color,
            player_id: llm.id,
            message: message,
            board: JSON.parse(JSON.stringify(this.board)) // Deep copy
        })
    }

    makeMove(llm, params) {
        if (!params.row || !params.column)
            return "Illegal parameters.";

        const row = Number(params.row);
        const column = Number(params.column);
        if (!row || !column || !Number.isInteger(row) || !Number.isInteger(column))
            return "Parameters must be integers.";

        if (this.board[row - 1][column - 1] !== ".")
            return "Position already played.";

        this.board[row - 1][column - 1] = llm.color;
        return "Move played successfully";
    }

    constructor(contestant1, contestant2) {
        const toolset = [
            new Tool("make_move", {
                "type": "function",
                "function": {
                    "name": "make_move",
                    "description": "Make a move",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "row": {
                                "type": "integer",
                                "description": "Row number of the move to make. Possible values are between 1 and 3",
                            },
                            "column": {
                                "type": "integer",
                                "description": "Column of the move to make. Possible values are between 1 and 3",
                            }
                        },
                        "required": ["row", "column"],
                    },
                },
            }, (() => {
                const a = (llm, params) => {
                    return this.makeMove(llm, params);
                }
                return a;
            })())
        ];

        // Randomize who plays first
        let llm1, llm2;
        if (Math.random() < 0.5) {
            llm1 = new TicTacToeLLM(this, contestant1.model, contestant1.id, contestant1.script, toolset, "You play X. What's your next move?", "X");
            llm2 = new TicTacToeLLM(this, contestant2.model, contestant2.id, contestant2.script, toolset, "You play O. What's your next move?", "O");
        } else {
            llm1 = new TicTacToeLLM(this, contestant2.model, contestant2.id, contestant2.script, toolset, "You play X. What's your next move?", "X");
            llm2 = new TicTacToeLLM(this, contestant1.model, contestant1.id, contestant1.script, toolset, "You play O. What's your next move?", "O");
        }
        this.llms = [llm1, llm2];
        this.board = [[".", ".", "."], [".", ".", "."], [".", ".", "."]];
        this.history = [];
    }

    async gameLoop() {
        let gameEnd = null;

        for (let i = 0; i < 5 && !gameEnd; i++) {
            for (let llm of this.llms) {
                await llm.makeMove(this.board);
                gameEnd = this.checkGameEnd();
                if (gameEnd) break;
            }
        }

        //console.log("=== MESSAGES 1 ===\n" + JSON.stringify(this.llms[0].messages, null, 4));
        //console.log("=== MESSAGES 2 ===\n" + JSON.stringify(this.llms[1].messages, null, 4));

        if (!gameEnd || gameEnd == "D") return { winner: null, history: this.history };
        if (gameEnd == this.llms[0].color) return { winner: this.llms[0].id, history: this.history };
        return { winner: this.llms[1].id, history: this.history };
    }

    checkGameEnd() {
        if (this.board[0][0] !== "." && this.board[0][0] === this.board[1][0] && this.board[0][0] === this.board[2][0])
            return this.board[0][0];

        if (this.board[0][1] !== "." && this.board[0][1] === this.board[1][1] && this.board[0][1] === this.board[2][1])
            return this.board[0][1];

        if (this.board[0][2] !== "." && this.board[0][2] === this.board[1][2] && this.board[0][2] === this.board[2][2])
            return this.board[0][2];

        if (this.board[0][0] !== "." && this.board[0][0] === this.board[0][1] && this.board[0][0] === this.board[0][2])
            return this.board[0][0];

        if (this.board[1][0] !== "." && this.board[1][0] === this.board[1][1] && this.board[1][0] === this.board[1][2])
            return this.board[1][0];

        if (this.board[2][0] !== "." && this.board[2][0] === this.board[2][1] && this.board[2][0] === this.board[2][2])
            return this.board[1][0];

        if (this.board[0][0] !== "." && this.board[0][0] === this.board[1][1] && this.board[0][0] === this.board[2][2])
            return this.board[0][0];

        if (this.board[0][2] !== "." && this.board[0][2] === this.board[1][1] && this.board[0][2] === this.board[2][0])
            return this.board[0][2];


        if (this.board[0][0] !== "." && this.board[0][1] !== "." && this.board[0][2] !== "." &&
            this.board[1][0] !== "." && this.board[1][1] !== "." && this.board[1][2] !== "." &&
            this.board[2][0] !== "." && this.board[2][1] !== "." && this.board[2][2] !== ".")
            return "D"; // Draw

        return null;
    }

}

export { Contestant, TicTacToeGame };