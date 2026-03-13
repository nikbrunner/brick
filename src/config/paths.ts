const HOME = Deno.env.get("HOME") ?? "";

export const CONFIG_DIR = `${HOME}/.config/brick`;
export const GLOBAL_CONFIG_PATH = `${CONFIG_DIR}/config.yml`;
export const REPO_CONFIG_NAME = ".brick.yml";
export const REMOTE_SCHEMA_URL =
    "https://raw.githubusercontent.com/nikbrunner/brick/main/schema.json";
