import { z } from "zod";
import { MergedConfigSchema } from "./schema.ts";

export function generateJsonSchema(): string {
    const schema = z.toJSONSchema(MergedConfigSchema);
    return JSON.stringify(schema, null, 2);
}
