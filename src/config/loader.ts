import { parse as parseYaml } from "@std/yaml";
import {
    GlobalConfigSchema,
    type MergedConfig,
    MergedConfigSchema,
    RepoConfigSchema,
} from "./schema.ts";

const GLOBAL_CONFIG_PATH = `${Deno.env.get("HOME")}/.config/brick/config.yml`;
const REPO_CONFIG_NAME = ".brick.yml";

async function readYamlFile(path: string): Promise<Record<string, unknown> | null> {
    try {
        const content = await Deno.readTextFile(path);
        const parsed = parseYaml(content);
        return parsed as Record<string, unknown> ?? null;
    } catch {
        return null;
    }
}

export async function loadConfig(): Promise<MergedConfig> {
    const globalRaw = await readYamlFile(GLOBAL_CONFIG_PATH);
    const globalConfig = GlobalConfigSchema.parse(globalRaw ?? {});

    const repoRaw = await readYamlFile(REPO_CONFIG_NAME);
    const repoConfig = repoRaw ? RepoConfigSchema.parse(repoRaw) : {};

    return MergedConfigSchema.parse({ ...globalConfig, ...repoConfig });
}
