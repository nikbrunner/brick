import { assertEquals } from "jsr:@std/assert";
import { CONFIG_DIR, GLOBAL_CONFIG_PATH, REPO_CONFIG_NAME, SCHEMA_PATH } from "./paths.ts";

Deno.test("CONFIG_DIR points to ~/.config/brick", () => {
    const home = Deno.env.get("HOME");
    assertEquals(CONFIG_DIR, `${home}/.config/brick`);
});

Deno.test("GLOBAL_CONFIG_PATH is config.yml inside CONFIG_DIR", () => {
    assertEquals(GLOBAL_CONFIG_PATH, `${CONFIG_DIR}/config.yml`);
});

Deno.test("SCHEMA_PATH is schema.json inside CONFIG_DIR", () => {
    assertEquals(SCHEMA_PATH, `${CONFIG_DIR}/schema.json`);
});

Deno.test("REPO_CONFIG_NAME is .brick.yml", () => {
    assertEquals(REPO_CONFIG_NAME, ".brick.yml");
});
