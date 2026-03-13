import { z } from "zod";
import { PROVIDER_MODELS, type ProviderName } from "../adapters.ts";

const providerNames = Object.keys(PROVIDER_MODELS) as [ProviderName, ...ProviderName[]];
const allModels = Object.values(PROVIDER_MODELS).flat() as [string, ...string[]];

export const GlobalConfigSchema = z.object({
    provider: z.enum(providerNames).default("anthropic"),
    model: z.enum(allModels).default("claude-haiku-4-5"),
    models: z.array(z.enum(allModels)).default([
        "claude-opus-4-5",
        "claude-sonnet-4-5",
        "claude-haiku-4-5",
    ]),
    summaryLength: z.number().positive().default(72),
    historyCount: z.number().positive().default(10),
});

export const RepoConfigSchema = z.object({
    issuePattern: z.string().optional(),
    issuePrefix: z.string().optional(),
});

export const MergedConfigSchema = z.object({
    ...GlobalConfigSchema.shape,
    ...RepoConfigSchema.shape,
});

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;
export type RepoConfig = z.infer<typeof RepoConfigSchema>;
export type MergedConfig = z.infer<typeof MergedConfigSchema>;
