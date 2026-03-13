import { gitOrThrow } from "./exec.ts";

export async function getStagedDiff(): Promise<string> {
    return await gitOrThrow("diff", "--staged");
}

export async function getCurrentBranch(): Promise<string> {
    return await gitOrThrow("rev-parse", "--abbrev-ref", "HEAD");
}

export async function getCommitHistory(count: number): Promise<string> {
    try {
        return await gitOrThrow("log", `-n`, `${count}`, "--format=%s%n%b", "HEAD");
    } catch {
        return "";
    }
}

export async function isGitRepo(): Promise<boolean> {
    try {
        await gitOrThrow("rev-parse", "--git-dir");
        return true;
    } catch {
        return false;
    }
}
