import { ANTHROPIC_MODELS, type AnthropicChatModel, anthropicText } from "@tanstack/ai-anthropic";

export { ANTHROPIC_MODELS };

export const PROVIDER_NAMES = ["anthropic"] as const;

export type ProviderName = (typeof PROVIDER_NAMES)[number];

export type ModelName = AnthropicChatModel;

export function createAdapter(provider: ProviderName, model: ModelName) {
    switch (provider) {
        case "anthropic":
            return anthropicText(model);
        default: {
            const _exhaustive: never = provider;
            throw new Error(`Unknown provider: ${_exhaustive}`);
        }
    }
}
