import { assertEquals } from "jsr:@std/assert";
import { generateJsonSchema } from "./json-schema.ts";

Deno.test("generateJsonSchema - returns valid JSON", () => {
    const output = generateJsonSchema();
    const schema = JSON.parse(output);
    assertEquals(typeof schema, "object");
    assertEquals(schema.type, "object");
});

Deno.test("generateJsonSchema - includes provider enum", () => {
    const schema = JSON.parse(generateJsonSchema());
    const providerEnum = schema.properties.provider.enum;
    assertEquals(Array.isArray(providerEnum), true);
    assertEquals(providerEnum.includes("anthropic"), true);
});

Deno.test("generateJsonSchema - includes model enum with claude models", () => {
    const schema = JSON.parse(generateJsonSchema());
    const modelEnum = schema.properties.model.enum;
    assertEquals(Array.isArray(modelEnum), true);
    assertEquals(modelEnum.includes("claude-haiku-4-5"), true);
    assertEquals(modelEnum.includes("claude-sonnet-4-5"), true);
});

Deno.test("generateJsonSchema - includes defaults", () => {
    const schema = JSON.parse(generateJsonSchema());
    assertEquals(schema.properties.provider.default, "anthropic");
    assertEquals(schema.properties.model.default, "claude-haiku-4-5");
    assertEquals(schema.properties.summary_length.default, 72);
    assertEquals(schema.properties.history_count.default, 10);
});
