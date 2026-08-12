export type CommandHandler = (args: string[]) => string;

export type CommandRegister = Record<string, CommandHandler>;

export const commands: CommandRegister = {
  help: () => `Available commands:
    - help: show this message
    - sudo: Super User DO
    - rm: remove files
    - clear: clean terminal screen
    - dont know. why u still there?
      get out!`,

  sudo: () => `nice try, this incident will be reported`,

  rm: (args) => {
    if (args[0] === "-rf" && (args[1] === "/*" || args[1] === "/")) {
      return "HEY WHAT YOU TRYING TO DO?? DONT MESS WITH MY WEBSITE";
    }
    if (!args[0]) {
      return "rm: missing an operand";
    }
    return `rm: ${args[0]} No such a file or directory`;
  },
};

export interface ProcessResult {
  output: string;
  isClearCommand: boolean;
}

export function executeCommand(
  rawInput: string,
  registry: CommandRegister,
): ProcessResult {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return { output: "", isClearCommand: false };
  }
  const parts = trimmed.split(/\s+/);
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (commandName === "clear") {
    return { output: "", isClearCommand: true };
  }

  const handler = registry[commandName];

  if (handler) {
    return { output: handler(args), isClearCommand: false };
  }

  return {
    output: `bagi-sh: command not found: ${commandName}. Type 'help' for available commands.`,
    isClearCommand: false,
  };
}
