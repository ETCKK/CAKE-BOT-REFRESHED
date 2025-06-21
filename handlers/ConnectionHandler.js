class ConnectionHandler {
    static promptMemory = [];

    static addPrompt(prompt) {
        this.promptMemory.push(prompt);
    }

    static clearPrompts() {
        this.promptMemory = [];
    }

    static combinePrompts() {
        var combined = "";

        for (const prompt of this.promptMemory) {
            if (prompt) {
                combined += prompt + "\n";
            }
        }

        return combined;
    }

}

module.exports = ConnectionHandler;