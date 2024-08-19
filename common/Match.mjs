export class Contestant {
    constructor(id, model, script) {
        this.id = id;
        this.model = model;
        this.script = script;
    }
}

export class Tool {
    constructor(name, specification, func) {
        this.name = name;
        this.specification = specification;
        this.func = func;
    }
}

export class Match {
    constructor(contestant1, contestant2) {
        if (this.constructor == Match) {
            throw new Error("Class is of abstract type and can't be instantiated.");
        };
    }

    async gameLoop() {
        throw new Error("gameLoop method needs to be implemented.");

    }
}