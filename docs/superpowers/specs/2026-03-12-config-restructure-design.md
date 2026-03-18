# Brick Config & Provider Restructure

## Problem

The current architecture has inverted dependencies and unnecessary abstractions:

1. **Config schema depends on provider files** — `schema.ts` imports `getAllModels()` and
   `PROVIDER_NAMES` from `providers/index.ts` to build the zod schema. The schema should define the
   shape; valid values should come from `@tanstack/ai-*` directly.
2. **Defaults are untyped** — `defaults.ts` exports raw `as const` values. Defaults should satisfy
   the config type, not define it.
3. **Custom provider abstraction is redundant** — `providers/` wraps `@tanstack/ai-anthropic` with a
   hand-rolled `Provider` interface, adding indirection without value. TanStack AI's adapter
   factories already provide full type safety.
4. **`ai/client.ts` misuses `chat()`** — passes `stream: false` (not a valid option), casts the
   result as string. `chat()` returns an async iterable of AG-UI events that must be iterated to
   collect text.

## Goals

- Config type drives defaults, not the other way around
- Remove the `providers/` abstraction — use TanStack AI adapters directly
- Correct `chat()` usage per TanStack AI's AG-UI streaming protocol
- Add `brick config --init` (global config) and `brick init` (repo config) commands
- Generate a JSON Schema from zod for YAML editor autocomplete
- Clean up sloppy/redundant code throughout

## Design

### 1. Adapter Map — `src/adapters.ts`

Replaces `src/providers/` (both files). A plain object mapping provider names to adapter factories:

```typescript
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
    }
}
```

Adding a new provider (e.g. OpenAI):

1. `deno add npm:@tanstack/ai-openai`
2. Add `openai: OPENAI_MODELS` to `PROVIDER_MODELS`
3. Add a case to `createAdapter`

No interfaces, no wrappers, no registry pattern.

### 2. Config Schema — `src/config/schema.ts`

Schema defines the config shape. Valid provider and model values come from the adapter map:

```typescript
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

export const MergedConfigSchema = GlobalConfigSchema.merge(RepoConfigSchema);

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;
export type RepoConfig = z.infer<typeof RepoConfigSchema>;
export type MergedConfig = z.infer<typeof MergedConfigSchema>;
```

### 3. Defaults Removed

Defaults are now inline in the zod schema via `.default()`. No separate `defaults.ts` file. The
schema is the single source of truth for both shape and defaults.

### 4. Config Loader — `src/config/loader.ts`

Stays structurally the same. Reads YAML, validates with zod, merges global + repo config. Remove the
`defaults.ts` import.

### 5. AI Client — `src/ai/client.ts`

Corrected to use TanStack AI's streaming protocol properly:

```typescript
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
```

The manual retry logic is removed. Anthropic 529 (overloaded) errors will now propagate to the
command layer. A retry wrapper can be added later if needed — but it should wrap `generate()` from
the outside, not be interleaved with stream collection.

### 6. Commands

#### `brick config --init`

Creates `~/.config/black-atom/shiplog/config.yml` with defaults and a YAML schema reference:

The `$schema` path uses the resolved absolute path (not `~`), since most YAML language servers don't
expand tilde:

```yaml
# yaml-language-server: $schema=/Users/<user>/.config/brick/schema.json
provider: anthropic
model: claude-haiku-4-5
models:
    - claude-opus-4-5
    - claude-sonnet-4-5
    - claude-haiku-4-5
summaryLength: 72
historyCount: 10
```

Also generates `~/.config/black-atom/shiplog/schema.json` from the zod schema.

#### `brick config --schema`

Regenerates `~/.config/black-atom/shiplog/schema.json` from the current zod schema. Useful after updating brick
(new providers/models).

#### `brick config --show`

Prints the resolved config (global + repo merged) to stdout.

#### `brick init`

Creates `.shiplog.toml` in the current repo with repo-specific fields:

```yaml
# yaml-language-server: $schema=/Users/<user>/.config/brick/schema.json
# issuePattern: "(\\w+-\\d+)"
# issuePrefix: ""
```

### 7. Schema Generation — `src/config/json-schema.ts`

Uses zod v4's built-in `z.toJSONSchema()` — no external dependency needed:

```typescript
import { z } from "zod";
import { MergedConfigSchema } from "./schema.ts";

export function generateJsonSchema(): string {
    const schema = z.toJSONSchema(MergedConfigSchema);
    return JSON.stringify(schema, null, 2);
}
```

The schema is written to `~/.config/black-atom/shiplog/schema.json`.

### 8. `main.ts` — Git Guard Fix

The current `globalAction` runs `isGitRepo()` before every subcommand. `brick config --init` and
`brick config --schema` must work outside a git repo. Move the git check into the commands that need
it (`commit`, `branch`, `init`) instead of running it globally.

### 9. Deno Permissions

The compile task in `deno.json` needs `--allow-write` for config/schema file generation:

```
"compile": "deno compile --allow-run --allow-read --allow-env --allow-net --allow-write --output brick src/main.ts"
```

The `dev` task needs the same addition.

### 10. Code Cleanup

Secondary goal — clean up issues found during review:

- **`ai/client.ts`**: Remove `stream: false` (invalid), remove manual retry loop, use proper AG-UI
  event iteration
- **`commands/commit.ts`**: `generate()` signature simplifies — no longer needs full `MergedConfig`,
  just provider + model. But we keep passing config for now to avoid over-refactoring.
- **`ai/prompts.ts`**: `_branch` unused destructured variable — remove the destructuring alias

## File Changes Summary

| Action | File                         | Notes                            |
| ------ | ---------------------------- | -------------------------------- |
| Delete | `src/providers/anthropic.ts` | Replaced by `src/adapters.ts`    |
| Delete | `src/providers/index.ts`     | Replaced by `src/adapters.ts`    |
| Delete | `src/config/defaults.ts`     | Defaults inline in schema        |
| Create | `src/adapters.ts`            | Adapter map + factory            |
| Create | `src/config/json-schema.ts`  | JSON Schema generation           |
| Create | `src/commands/config.ts`     | `brick config` command           |
| Create | `src/commands/init.ts`       | `brick init` command             |
| Modify | `src/config/schema.ts`       | Use adapter map, inline defaults |
| Modify | `src/config/loader.ts`       | Remove defaults import           |
| Modify | `src/ai/client.ts`           | Correct chat() usage             |
| Modify | `src/ai/prompts.ts`          | Remove `_branch` alias           |
| Modify | `src/main.ts`                | Register new commands            |
| Modify | `deno.json`                  | Add `--allow-write` to tasks     |

## Dependencies

No new dependencies. Zod v4's built-in `z.toJSONSchema()` handles JSON Schema generation.

## Out of Scope

- Supporting additional providers beyond anthropic (structure supports it, implementation deferred)
- Streaming output to terminal in real-time (collect full text, display after)
- Config file migration tooling
