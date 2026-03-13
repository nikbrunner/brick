import { Confirm, Input, Select } from "@cliffy/prompt";
import * as colors from "@std/fmt/colors";
import type { MergedConfig } from "../config/schema.ts";
import { openInEditor } from "./prompts.ts";
import { commit } from "../git/operations.ts";

export interface CommitParts {
    type: string;
    scope: string;
    breaking: boolean;
    subject: string;
    body: string;
    footer: string;
}

export function buildCommitMessage(parts: CommitParts): string {
    const { type, scope, breaking, subject, body, footer } = parts;

    const scopePart = scope ? `(${scope})` : "";
    const breakingPart = breaking ? "!" : "";
    let message = `${type}${scopePart}${breakingPart}: ${subject}`;

    if (body) message += `\n\n${body}`;
    if (footer) message += `\n\n${footer}`;

    return message;
}

async function promptWithEditorEscape(message: string, initial = ""): Promise<string> {
    const value = await Input.prompt({
        message: `${message} (enter :e to open in $EDITOR)`,
        default: initial,
    });

    if (value === "\x07" || value.trim() === ":e") {
        const edited = await openInEditor(initial);
        return edited ?? initial;
    }

    return value;
}

export async function runGuidedCommit(config: MergedConfig): Promise<void> {
    // 1. Type
    const type = await Select.prompt({
        message: "Select commit type",
        search: true,
        options: config.commitTypes.map((t) => ({ name: t, value: t })),
    }) as string;

    // 2. Scope
    const scope = await Input.prompt({
        message: "Scope (optional, Enter to skip)",
    });

    // 3. Breaking change
    const breaking = await Confirm.prompt({
        message: "Breaking change?",
        default: false,
    });

    // 4. Subject
    let subject = "";
    while (!subject.trim()) {
        subject = await promptWithEditorEscape("Short description");
        if (!subject.trim()) {
            console.error(colors.red("Subject cannot be empty."));
        }
    }

    // 5. Body
    const body = await promptWithEditorEscape("Body (optional, Enter to skip)");

    // 6. Footer
    const footer = await promptWithEditorEscape(
        "Footer (optional — BREAKING CHANGE: ..., Closes #N)",
    );

    // 7. Preview
    const message = buildCommitMessage({
        type,
        scope: scope.trim(),
        breaking,
        subject: subject.trim(),
        body: body.trim(),
        footer: footer.trim(),
    });

    console.log("");
    console.log("Commit message:");
    console.log(colors.dim("─".repeat(40)));
    console.log(colors.yellow(message));
    console.log(colors.dim("─".repeat(40)));
    console.log("");

    // 8. Confirm
    const confirmed = await Confirm.prompt({ message: "Commit?", default: true });
    if (!confirmed) {
        console.log("Commit cancelled.");
        Deno.exit(1);
    }

    await commit(message);
    console.log(colors.green("\nChanges committed successfully!"));
}
