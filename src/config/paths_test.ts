import { assertEquals } from "jsr:@std/assert";
import { CONFIG_DIR, GLOBAL_CONFIG_PATH, REMOTE_SCHEMA_URL, REPO_CONFIG_NAME } from "./paths.ts";

Deno.test("CONFIG_DIR points to ~/.config/brick", () => {
    const home = Deno.env.get("HOME");
    assertEquals(CONFIG_DIR, `${home}/.config/brick`);
});

Deno.test("GLOBAL_CONFIG_PATH is config.toml inside CONFIG_DIR", () => {
    assertEquals(GLOBAL_CONFIG_PATH, `${CONFIG_DIR}/config.toml`);
});

Deno.test("REMOTE_SCHEMA_URL points to GitHub raw", () => {
    assertEquals(
        REMOTE_SCHEMA_URL,
        "https://raw.githubusercontent.com/nikbrunner/brick/main/schema.json",
    );
});

Deno.test("REPO_CONFIG_NAME is .brick.toml", () => {
    assertEquals(REPO_CONFIG_NAME, ".brick.toml");
});
