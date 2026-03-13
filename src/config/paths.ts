const HOME = Deno.env.get("HOME") ?? "";

export const CONFIG_DIR = `${HOME}/.config/brick`;
export const GLOBAL_CONFIG_PATH = `${CONFIG_DIR}/config.yml`;
export const SCHEMA_PATH = `${CONFIG_DIR}/schema.json`;
export const REPO_CONFIG_NAME = ".brick.yml";
