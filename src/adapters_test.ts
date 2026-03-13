import { assertEquals, assertThrows } from "jsr:@std/assert";
import { ANTHROPIC_MODELS, createAdapter, PROVIDER_NAMES } from "./adapters.ts";

Deno.test("PROVIDER_NAMES contains anthropic", () => {
    assertEquals(PROVIDER_NAMES, ["anthropic"]);
});

Deno.test("ANTHROPIC_MODELS is a non-empty array of strings", () => {
    assertEquals(Array.isArray(ANTHROPIC_MODELS), true);
    assertEquals(ANTHROPIC_MODELS.length > 0, true);
    for (const model of ANTHROPIC_MODELS) {
        assertEquals(typeof model, "string");
    }
});

Deno.test("createAdapter returns an adapter for valid provider/model", () => {
    const adapter = createAdapter("anthropic", "claude-haiku-4-5");
    assertEquals(typeof adapter, "object");
    assertEquals(adapter !== null, true);
});

Deno.test("createAdapter throws for invalid provider", () => {
    assertThrows(
        // deno-lint-ignore no-explicit-any
        () => createAdapter("openai" as any, "gpt-4" as any),
        Error,
        "Unknown provider",
    );
});
