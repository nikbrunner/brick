import { Command } from "@cliffy/command";
import { stringify as stringifyYaml } from "@std/yaml";
import * as colors from "@std/fmt/colors";
import { loadConfig } from "../config/loader.ts";
import { GlobalConfigSchema } from "../config/schema.ts";
import { generateJsonSchema } from "../config/json-schema.ts";

const CONFIG_DIR = `${Deno.env.get("HOME")}/.config/brick`;
const CONFIG_PATH = `${CONFIG_DIR}/config.yml`;
const SCHEMA_PATH = `${CONFIG_DIR}/schema.json`;

async function writeSchema(): Promise<void> {
    await Deno.mkdir(CONFIG_DIR, { recursive: true });
    const schema = generateJsonSchema();
    await Deno.writeTextFile(SCHEMA_PATH, schema);
    console.log(colors.green(`Schema written to ${SCHEMA_PATH}`));
}

async function initGlobalConfig(): Promise<void> {
    try {
        await Deno.stat(CONFIG_PATH);
        console.error(colors.yellow(`Config already exists at ${CONFIG_PATH}`));
        console.error("Delete it first if you want to regenerate.");
        Deno.exit(1);
    } catch {
        // File doesn't exist, proceed
    }

    await Deno.mkdir(CONFIG_DIR, { recursive: true });

    const defaults = GlobalConfigSchema.parse({});
    const yamlContent = stringifyYaml(defaults as Record<string, unknown>);
    const schemaLine = `# yaml-language-server: $schema=${SCHEMA_PATH}\n`;

    await Deno.writeTextFile(CONFIG_PATH, schemaLine + yamlContent);
    console.log(colors.green(`Config written to ${CONFIG_PATH}`));

    await writeSchema();
}

async function showConfig(): Promise<void> {
    const config = await loadConfig();
    console.log(stringifyYaml(config as Record<string, unknown>));
}

export const configCommand = new Command()
    .description("Manage global configuration")
    .option("--init", "Create default global config")
    .option("--schema", "Regenerate JSON Schema file")
    .option("--show", "Show resolved config")
    .action(async (options) => {
        if (options.init) {
            await initGlobalConfig();
        } else if (options.schema) {
            await writeSchema();
        } else if (options.show) {
            await showConfig();
        } else {
            console.error("Use --init, --schema, or --show. See --help for details.");
            Deno.exit(1);
        }
    });
