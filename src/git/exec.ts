/**
 * Thin wrapper around Deno.Command for running git commands.
 * This is the ONLY file that shells out to git.
 */

export interface GitResult {
    stdout: string;
    stderr: string;
    success: boolean;
    code: number;
}

export async function git(...args: string[]): Promise<GitResult> {
    const command = new Deno.Command("git", {
        args,
        stdout: "piped",
        stderr: "piped",
    });

    const output = await command.output();
    const decoder = new TextDecoder();

    return {
        stdout: decoder.decode(output.stdout).trim(),
        stderr: decoder.decode(output.stderr).trim(),
        success: output.success,
        code: output.code,
    };
}

export async function gitOrThrow(...args: string[]): Promise<string> {
    const result = await git(...args);
    if (!result.success) {
        throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
    }
    return result.stdout;
}
