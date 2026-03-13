import { generateJsonSchema } from "../src/config/json-schema.ts";

await Deno.writeTextFile("schema.json", generateJsonSchema());
console.log("schema.json updated");
