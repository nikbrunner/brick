import { git, gitOrThrow } from "./exec.ts";

export async function commit(message: string): Promise<void> {
    await gitOrThrow("commit", "-m", message);
}

export async function push(): Promise<{ success: boolean; output: string }> {
    const result = await git("push");
    return {
        success: result.success,
        output: result.success ? result.stdout : result.stderr,
    };
}

export async function forcePush(): Promise<void> {
    await gitOrThrow("push", "--force-with-lease");
}

export async function switchToNewBranch(name: string): Promise<void> {
    await gitOrThrow("switch", "-c", name);
}
