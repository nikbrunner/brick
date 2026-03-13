import { Command } from "@cliffy/command";
import * as colors from "@std/fmt/colors";
import { loadConfig } from "../config/loader.ts";
import type { MergedConfig } from "../config/schema.ts";
import { getCommitHistory, getCurrentBranch, getStagedDiff, isGitRepo } from "../git/diff.ts";
import { commit, forcePush, push } from "../git/operations.ts";
import { generate } from "../ai/client.ts";
import { buildCommitPrompt } from "../ai/prompts.ts";
import { confirmForcePush, editMessage, selectCommitAction, selectModel } from "../ui/prompts.ts";

function extractIssueId(branch: string, pattern?: string, prefix?: string): string | undefined {
    if (!pattern) return undefined;
    const match = branch.match(new RegExp(pattern, "i"));
    if (!match) return undefined;

    if (prefix && match[1]) {
        return `${prefix}${match[1]}`;
    }
    return match[0].toUpperCase();
}

async function isLazygitInstalled(): Promise<boolean> {
    try {
        const cmd = new Deno.Command("which", {
            args: ["lazygit"],
            stdout: "null",
            stderr: "null",
        });
        const { success } = await cmd.output();
        return success;
    } catch {
        return false;
    }
}

async function openLazygit(): Promise<void> {
    if (!await isLazygitInstalled()) {
        throw new Error("lazygit is not installed");
    }

    const command = new Deno.Command("lazygit", {
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
    });
    const process = command.spawn();
    const status = await process.status;
    if (!status.success) {
        throw new Error("lazygit exited with an error");
    }
}

async function ensureStagedChanges(): Promise<void> {
    const diff = await getStagedDiff();
    if (diff) return;

    console.error(colors.yellow("No staged changes found."));
    try {
        await openLazygit();
    } catch {
        console.error("Please stage your changes first.");
        Deno.exit(1);
    }

    const diffAfterStaging = await getStagedDiff();
    if (!diffAfterStaging) {
        console.log("No changes staged. Aborting.");
        Deno.exit(1);
    }
}

async function generateCommitMessage(
    model: MergedConfig["model"],
    config: MergedConfig,
): Promise<string> {
    const [diff, branch, history] = await Promise.all([
        getStagedDiff(),
        getCurrentBranch(),
        getCommitHistory(config.historyCount),
    ]);

    const issueId = extractIssueId(branch, config.issuePattern, config.issuePrefix);

    const prompt = buildCommitPrompt({
        diff,
        commitHistory: history,
        summaryLength: config.summaryLength,
        issueId,
    });

    console.error(`Generating with ${colors.cyan(model)}...`);
    const message = await generate(prompt, model, config.provider);
    return message.replace(/^["']|["']$/g, "").replace(/\r/g, "");
}

function displayMessage(message: string, model: string): void {
    console.log("");
    console.log(`Generated commit message (${colors.cyan(model)}):`);
    console.log(colors.dim("─".repeat(40)));
    console.log(colors.yellow(message));
    console.log(colors.dim("─".repeat(40)));
    console.log("");
}

async function handlePush(pushFlag: boolean, forceFlag: boolean): Promise<void> {
    if (!pushFlag) return;

    console.log("");
    console.log("Pushing to remote...");

    if (forceFlag) {
        await forcePush();
        console.log(colors.green("\nAll done! Changes committed and force pushed successfully!\n"));
        return;
    }

    const result = await push();
    if (result.success) {
        console.log(colors.green("\nAll done! Changes committed and pushed successfully!\n"));
        return;
    }

    console.log("");
    console.error(colors.red("Push failed:"));
    console.error(result.output);
    console.log("");

    if (await confirmForcePush()) {
        await forcePush();
        console.log(colors.green("\nAll done! Changes committed and force pushed successfully!\n"));
    } else {
        console.log("Push cancelled.");
        Deno.exit(1);
    }
}

export const commitCommand = new Command()
    .description("Commit changes (manual or AI-powered)")
    .option("-s, --smart", "Use AI to generate commit message")
    .option("-y, --yes", "Auto-confirm (with -s only)")
    .option("-p, --push", "Push after commit")
    .option("-f, --force", "Force push with --force-with-lease")
    .action(async (options) => {
        if (!await isGitRepo()) {
            console.error(colors.red("Error: Not in a git repository"));
            Deno.exit(1);
        }

        if (!options.smart) {
            try {
                await openLazygit();
            } catch {
                console.error(colors.red("Error: lazygit is not installed"));
                console.error("Install with: brew install lazygit");
                Deno.exit(1);
            }
            return;
        }

        const config = await loadConfig();
        let currentModel = config.model;
        await ensureStagedChanges();
        let commitMessage = await generateCommitMessage(currentModel, config);
        displayMessage(commitMessage, currentModel);

        if (options.yes) {
            console.log("Auto-committing (--yes flag)...");
            await commit(commitMessage);
            console.log(colors.green("\nChanges committed successfully!"));
            await handlePush(!!options.push, !!options.force);
            return;
        }

        // Interactive loop
        while (true) {
            const action = await selectCommitAction();

            switch (action) {
                case "commit":
                    console.log("\nCommitting changes...");
                    await commit(commitMessage);
                    console.log(colors.green("\nChanges committed successfully!"));
                    await handlePush(!!options.push, !!options.force);
                    return;

                case "edit": {
                    const edited = await editMessage(commitMessage);
                    if (edited) {
                        console.log("\nCommitting with edited message...");
                        await commit(edited);
                        console.log(colors.green("\nChanges committed successfully!"));
                        await handlePush(!!options.push, !!options.force);
                    } else {
                        console.log("Commit cancelled (empty message).");
                        Deno.exit(1);
                    }
                    return;
                }

                case "regenerate": {
                    const selected = await selectModel(config.models);
                    currentModel = selected;
                    try {
                        commitMessage = await generateCommitMessage(currentModel, config);
                        displayMessage(commitMessage, currentModel);
                    } catch (error) {
                        console.error(colors.red(`Failed to regenerate: ${error}`));
                        console.log("Using previous message.");
                    }
                    break;
                }

                case "cancel":
                    console.log("Commit cancelled.");
                    Deno.exit(1);
            }
        }
    });
