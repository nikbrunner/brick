import { chat } from "@tanstack/ai";
import { createAdapter, type ProviderName } from "../adapters.ts";
import type { MergedConfig } from "../config/schema.ts";

export async function generate(
    prompt: string,
    model: string,
    config: MergedConfig,
): Promise<string> {
    const adapter = createAdapter(config.provider as ProviderName, model);

    const stream = chat({
        adapter,
        messages: [{ role: "user", content: prompt }],
    });

    let text = "";
    for await (const chunk of stream) {
        if (chunk.type === "TEXT_MESSAGE_CONTENT") {
            text += chunk.delta;
        }
    }

    return text.trim();
}
