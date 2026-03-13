import { anthropicText } from "@tanstack/ai-anthropic";
import { ANTHROPIC_MODELS, type AnthropicChatModel } from "@tanstack/ai-anthropic";

export const PROVIDER_MODELS = {
    anthropic: ANTHROPIC_MODELS,
} as const;

export type ProviderName = keyof typeof PROVIDER_MODELS;

export function createAdapter(provider: ProviderName, model: string) {
    switch (provider) {
        case "anthropic":
            return anthropicText(model as AnthropicChatModel);
        default: {
            const _exhaustive: never = provider;
            throw new Error(`Unknown provider: ${_exhaustive}`);
        }
    }
}
