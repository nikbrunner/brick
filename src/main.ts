import { Command } from "@cliffy/command";
import * as colors from "@std/fmt/colors";
import { commitCommand } from "./commands/commit.ts";
import { branchCommand } from "./commands/branch.ts";
import { configCommand } from "./commands/config.ts";
import { initCommand } from "./commands/init.ts";

const main = new Command()
    .name("brick")
    .version("0.1.0")
    .description("AI-powered git operations")
    .command("commit", commitCommand)
    .command("branch", branchCommand)
    .command("config", configCommand)
    .command("init", initCommand);

try {
    await main.parse(Deno.args);
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(colors.red(`Error: ${message}`));
    Deno.exit(1);
}
