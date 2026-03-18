const HOME = Deno.env.get("HOME") ?? "";

export const CONFIG_DIR = `${HOME}/.config/black-atom/shiplog`;
export const GLOBAL_CONFIG_PATH = `${CONFIG_DIR}/config.toml`;
export const REPO_CONFIG_NAME = ".shiplog.toml";
export const REMOTE_SCHEMA_URL =
    "https://raw.githubusercontent.com/black-atom-industries/shiplog/main/schema.json";
