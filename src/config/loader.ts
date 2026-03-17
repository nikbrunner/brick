import { parse as parseToml } from "@std/toml";
import {
    GlobalConfigSchema,
    type MergedConfig,
    MergedConfigSchema,
    RepoConfigSchema,
} from "./schema.ts";
import {
    GLOBAL_CONFIG_PATH,
    LEGACY_GLOBAL_CONFIG_PATH,
    LEGACY_REPO_CONFIG_NAME,
    REPO_CONFIG_NAME,
} from "./paths.ts";

/** Convert snake_case keys to camelCase (single level, no recursion needed for flat config) */
function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        result[camelKey] = value;
    }
    return result;
}

async function readTomlFile(path: string): Promise<Record<string, unknown> | null> {
    try {
        const content = await Deno.readTextFile(path);
        const parsed = parseToml(content);
        return snakeToCamel(parsed as Record<string, unknown>);
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) return null;
        throw e;
    }
}

async function checkLegacyConfig(legacyPath: string, newPath: string): Promise<void> {
    try {
        await Deno.stat(legacyPath);
        console.warn(
            `⚠ Legacy config found: ${legacyPath}\n` +
                `  Brick now uses TOML. Rename it to ${newPath} and convert to TOML format.\n` +
                `  See: https://github.com/nikbrunner/brick#configuration`,
        );
    } catch {
        // No legacy file — nothing to warn about
    }
}

export async function loadConfig(): Promise<MergedConfig> {
    // Warn about legacy YAML configs
    await checkLegacyConfig(LEGACY_GLOBAL_CONFIG_PATH, GLOBAL_CONFIG_PATH);
    await checkLegacyConfig(LEGACY_REPO_CONFIG_NAME, REPO_CONFIG_NAME);

    const globalRaw = await readTomlFile(GLOBAL_CONFIG_PATH);
    const globalConfig = GlobalConfigSchema.parse(globalRaw ?? {});

    const repoRaw = await readTomlFile(REPO_CONFIG_NAME);
    const repoConfig = repoRaw ? RepoConfigSchema.parse(repoRaw) : {};

    return MergedConfigSchema.parse({ ...globalConfig, ...repoConfig });
}
