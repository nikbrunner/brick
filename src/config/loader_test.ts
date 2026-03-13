import { assertEquals } from "jsr:@std/assert";
import { stringify as stringifyYaml } from "@std/yaml";
import { loadConfig } from "./loader.ts";

async function withTempFiles(
    files: Record<string, unknown>,
    fn: () => Promise<void>,
): Promise<void> {
    const dir = await Deno.makeTempDir();
    const origCwd = Deno.cwd();
    Deno.chdir(dir);

    for (const [name, content] of Object.entries(files)) {
        await Deno.writeTextFile(name, stringifyYaml(content as Record<string, unknown>));
    }

    try {
        await fn();
    } finally {
        Deno.chdir(origCwd);
        await Deno.remove(dir, { recursive: true });
    }
}

Deno.test("loadConfig - returns defaults when no config files exist", async () => {
    const dir = await Deno.makeTempDir();
    const origCwd = Deno.cwd();
    Deno.chdir(dir);
    try {
        const config = await loadConfig();
        assertEquals(config.provider, "anthropic");
        assertEquals(config.model, "claude-haiku-4-5");
        assertEquals(config.summaryLength, 72);
        assertEquals(config.historyCount, 10);
        assertEquals(config.issuePattern, undefined);
        assertEquals(config.issuePrefix, undefined);
    } finally {
        Deno.chdir(origCwd);
        await Deno.remove(dir, { recursive: true });
    }
});

Deno.test("loadConfig - repo config merges over global config", async () => {
    await withTempFiles(
        { ".brick.yml": { issuePattern: "(PROJ-\\d+)", issuePrefix: "" } },
        async () => {
            const config = await loadConfig();
            assertEquals(config.issuePattern, "(PROJ-\\d+)");
            assertEquals(config.provider, "anthropic"); // global default preserved
        },
    );
});

Deno.test("loadConfig - repo config without global config uses defaults", async () => {
    await withTempFiles(
        { ".brick.yml": { issuePattern: "(DEV-\\d+)" } },
        async () => {
            const config = await loadConfig();
            assertEquals(config.issuePattern, "(DEV-\\d+)");
            assertEquals(config.summaryLength, 72);
        },
    );
});
