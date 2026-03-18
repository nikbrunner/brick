# Config & Provider Restructure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents
> available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`)
> syntax for tracking.

**Goal:** Remove the custom providers/ abstraction, flip config/defaults dependency so the zod
schema is the single source of truth, correct chat() usage, and add config/init commands with JSON
Schema generation for YAML editor autocomplete.

**Architecture:** Replace providers/ with a single adapters.ts that maps provider names to TanStack
AI adapter factories. Config schema defines shape + defaults inline via zod. Commands write
config/schema files to ~/.config/black-atom/shiplog/.

**Tech Stack:** Deno, @tanstack/ai, @tanstack/ai-anthropic, zod v4, @cliffy/command, @std/yaml

**Spec:** `docs/superpowers/specs/2026-03-12-config-restructure-design.md`

---

## Chunk 1: Core Restructure (adapters, schema, client)

### Task 1: Create adapter map

**Files:**

- Create: `src/adapters.ts`

- [ ] **Step 1: Create `src/adapters.ts`**

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

- [ ] **Step 2: Verify it type-checks**

Run: `deno check src/adapters.ts` Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/adapters.ts
git commit -m "feat: add adapter map replacing providers/ abstraction"
```

---

### Task 2: Rewrite config schema with inline defaults

**Files:**

- Modify: `src/config/schema.ts`

- [ ] **Step 1: Rewrite `src/config/schema.ts`**

Replace entire contents with:

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

- [ ] **Step 2: Verify it type-checks**

Run: `deno check src/config/schema.ts` Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/config/schema.ts
git commit -m "refactor: rewrite config schema with inline defaults from adapter map"
```

---

### Task 3: Rewrite AI client with correct chat() usage

**Files:**

- Modify: `src/ai/client.ts`

- [ ] **Step 1: Rewrite `src/ai/client.ts`**

Replace entire contents with:

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

- [ ] **Step 2: Verify it type-checks**

Run: `deno check src/ai/client.ts` Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/ai/client.ts
git commit -m "fix: correct chat() usage with AG-UI streaming protocol"
```

---

### Task 4: Clean up ai/prompts.ts

**Files:**

- Modify: `src/ai/prompts.ts`
- Modify: `src/commands/commit.ts`

**Important context:** `branch` is used in `src/commands/commit.ts` for `extractIssueId()` — do NOT
remove the `branch` variable from `generateCommitMessage`. Only remove it from `buildCommitPrompt`
where it's destructured but never used.

- [ ] **Step 1: Remove `branch` from `CommitPromptOptions` and `buildCommitPrompt`**

In `src/ai/prompts.ts`, remove `branch` from the `CommitPromptOptions` interface:

```typescript
interface CommitPromptOptions {
    diff: string;
    commitHistory: string;
    summaryLength: number;
    issueId?: string;
}
```

And update the destructuring in `buildCommitPrompt`:

```typescript
const { diff, commitHistory, summaryLength, issueId } = options;
```

- [ ] **Step 2: Stop passing `branch` to `buildCommitPrompt` in commit.ts**

In `src/commands/commit.ts`, in `generateCommitMessage`, change the `buildCommitPrompt` call from:

```typescript
const prompt = buildCommitPrompt({
    diff,
    branch,
    commitHistory: history,
    summaryLength: config.summaryLength,
    issueId,
});
```

to:

```typescript
const prompt = buildCommitPrompt({
    diff,
    commitHistory: history,
    summaryLength: config.summaryLength,
    issueId,
});
```

The `branch` variable is still fetched and used for `extractIssueId()` above — only the pass-through
to `buildCommitPrompt` is removed.

- [ ] **Step 3: Verify it type-checks**

Run: `deno check src/ai/prompts.ts src/commands/commit.ts` Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/ai/prompts.ts src/commands/commit.ts
git commit -m "refactor: remove unused branch param from buildCommitPrompt"
```

---

### Task 5: Delete old provider files and defaults

**Files:**

- Delete: `src/providers/anthropic.ts`
- Delete: `src/providers/index.ts`
- Delete: `src/config/defaults.ts`

- [ ] **Step 1: Delete the files**

```bash
rm src/providers/anthropic.ts src/providers/index.ts src/config/defaults.ts
rmdir src/providers
```

- [ ] **Step 2: Verify the full project type-checks**

Run: `deno check src/main.ts` Expected: No errors. All imports now resolve to adapters.ts and the
new schema.

- [ ] **Step 3: Run lint**

Run: `deno lint` Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "refactor: remove providers/ abstraction and defaults.ts"
```

---

## Chunk 2: Commands and Schema Generation

### Task 6: Add JSON Schema generation

**Depends on:** Task 2 (schema.ts must be rewritten first)

**Files:**

- Create: `src/config/json-schema.ts`

- [ ] **Step 1: Verify `z.toJSONSchema` is available**

Run: `deno eval "import { z } from 'zod'; console.log(typeof z.toJSONSchema)"` Expected: `function`

If this prints `undefined`, zod v4.3.6 doesn't have it — fall back to manually constructing the JSON
Schema or update zod. Stop and flag to the user.

- [ ] **Step 2: Create `src/config/json-schema.ts`**

```typescript
import { z } from "zod";
import { MergedConfigSchema } from "./schema.ts";

export function generateJsonSchema(): string {
    const schema = z.toJSONSchema(MergedConfigSchema);
    return JSON.stringify(schema, null, 2);
}
```

- [ ] **Step 3: Verify it type-checks**

Run: `deno check src/config/json-schema.ts` Expected: No errors

- [ ] **Step 4: Quick smoke test**

Run:
`deno eval "import { generateJsonSchema } from './src/config/json-schema.ts'; console.log(generateJsonSchema());"`
Expected: Valid JSON Schema output with provider enum, model enum, default values

- [ ] **Step 5: Commit**

```bash
git add src/config/json-schema.ts
git commit -m "feat: add JSON Schema generation from zod config schema"
```

---

### Task 7: Add `brick config` command

**Files:**

- Create: `src/commands/config.ts`

- [ ] **Step 1: Create `src/commands/config.ts`**

```typescript
import { Command } from "@cliffy/command";
import { stringify as stringifyYaml } from "@std/yaml";
import * as colors from "@std/fmt/colors";
import { loadConfig } from "../config/loader.ts";
import { GlobalConfigSchema } from "../config/schema.ts";
import { generateJsonSchema } from "../config/json-schema.ts";

const CONFIG_DIR = `${Deno.env.get("HOME")}/.config/brick`;
const CONFIG_PATH = `${CONFIG_DIR}/config.yml`;
const SCHEMA_PATH = `${CONFIG_DIR}/schema.json`;

async function writeSchema(): Promise<void> {
    await Deno.mkdir(CONFIG_DIR, { recursive: true });
    const schema = generateJsonSchema();
    await Deno.writeTextFile(SCHEMA_PATH, schema);
    console.log(colors.green(`Schema written to ${SCHEMA_PATH}`));
}

async function initGlobalConfig(): Promise<void> {
    try {
        await Deno.stat(CONFIG_PATH);
        console.error(colors.yellow(`Config already exists at ${CONFIG_PATH}`));
        console.error("Delete it first if you want to regenerate.");
        Deno.exit(1);
    } catch {
        // File doesn't exist, proceed
    }

    await Deno.mkdir(CONFIG_DIR, { recursive: true });

    const defaults = GlobalConfigSchema.parse({});
    const yamlContent = stringifyYaml(defaults as Record<string, unknown>);
    const schemaLine = `# yaml-language-server: $schema=${SCHEMA_PATH}\n`;

    await Deno.writeTextFile(CONFIG_PATH, schemaLine + yamlContent);
    console.log(colors.green(`Config written to ${CONFIG_PATH}`));

    await writeSchema();
}

async function showConfig(): Promise<void> {
    const config = await loadConfig();
    console.log(stringifyYaml(config as Record<string, unknown>));
}

export const configCommand = new Command()
    .description("Manage global configuration")
    .option("--init", "Create default global config")
    .option("--schema", "Regenerate JSON Schema file")
    .option("--show", "Show resolved config")
    .action(async (options) => {
        if (options.init) {
            await initGlobalConfig();
        } else if (options.schema) {
            await writeSchema();
        } else if (options.show) {
            await showConfig();
        } else {
            console.error("Use --init, --schema, or --show. See --help for details.");
            Deno.exit(1);
        }
    });
```

- [ ] **Step 2: Verify it type-checks**

Run: `deno check src/commands/config.ts` Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/commands/config.ts
git commit -m "feat: add brick config command (--init, --schema, --show)"
```

---

### Task 8: Add `brick init` command

**Files:**

- Create: `src/commands/init.ts`

- [ ] **Step 1: Create `src/commands/init.ts`**

```typescript
import { Command } from "@cliffy/command";
import * as colors from "@std/fmt/colors";
import { isGitRepo } from "../git/diff.ts";

const REPO_CONFIG_NAME = ".shiplog.toml";
const SCHEMA_PATH = `${Deno.env.get("HOME")}/.config/brick/schema.json`;

export const initCommand = new Command()
    .description("Create repo-local .shiplog.toml config")
    .action(async () => {
        if (!await isGitRepo()) {
            console.error(colors.red("Error: Not in a git repository"));
            Deno.exit(1);
        }

        try {
            await Deno.stat(REPO_CONFIG_NAME);
            console.error(colors.yellow(`${REPO_CONFIG_NAME} already exists`));
            console.error("Delete it first if you want to regenerate.");
            Deno.exit(1);
        } catch {
            // File doesn't exist, proceed
        }

        const content = [
            `# yaml-language-server: $schema=${SCHEMA_PATH}`,
            `# issuePattern: "(\\w+-\\d+)"`,
            `# issuePrefix: ""`,
            "",
        ].join("\n");

        await Deno.writeTextFile(REPO_CONFIG_NAME, content);
        console.log(colors.green(`Created ${REPO_CONFIG_NAME}`));
    });
```

- [ ] **Step 2: Verify it type-checks**

Run: `deno check src/commands/init.ts` Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/commands/init.ts
git commit -m "feat: add brick init command for repo-local config"
```

---

### Task 9: Update main.ts — register commands, fix git guard

**Files:**

- Modify: `src/main.ts`
- Modify: `src/commands/commit.ts`
- Modify: `src/commands/branch.ts`

- [ ] **Step 1: Add git guard to commit and branch commands**

In `src/commands/commit.ts`, add at the top of the `.action()` callback (before the
`if (!options.smart)` check):

```typescript
if (!await isGitRepo()) {
    console.error(colors.red("Error: Not in a git repository"));
    Deno.exit(1);
}
```

Add the import: `import { isGitRepo } from "../git/diff.ts";` (Note: `getStagedDiff`,
`getCurrentBranch`, `getCommitHistory` are already imported from `"../git/diff.ts"`, so add
`isGitRepo` to that import.)

In `src/commands/branch.ts`, add the same guard at the top of the `.action()` callback (before the
description check). Add `isGitRepo` import from `"../git/diff.ts"`.

- [ ] **Step 2: Rewrite `src/main.ts`**

```typescript
import { Command } from "@cliffy/command";
import { commitCommand } from "./commands/commit.ts";
import { branchCommand } from "./commands/branch.ts";
import { configCommand } from "./commands/config.ts";
import { initCommand } from "./commands/init.ts";

const main = new Command()
    .name("brick")
    .version("0.1.0")
    .description("AI-powered git operations")
    .command("commit", commitCommand)
    .command("branch", branchCommand)
    .command("config", configCommand)
    .command("init", initCommand);

await main.parse(Deno.args);
```

- [ ] **Step 3: Verify the full project type-checks**

Run: `deno check src/main.ts` Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/main.ts src/commands/commit.ts src/commands/branch.ts
git commit -m "feat: register config/init commands, move git guard to individual commands"
```

---

### Task 10: Update deno.json permissions

**Files:**

- Modify: `deno.json`

- [ ] **Step 1: Add `--allow-write` to dev and compile tasks**

In `deno.json`, update the tasks:

```json
"dev": "deno run --allow-run --allow-read --allow-env --allow-net --allow-write src/main.ts",
"compile": "deno compile --allow-run --allow-read --allow-env --allow-net --allow-write --output brick src/main.ts",
```

- [ ] **Step 2: Final full check**

Run: `deno check src/main.ts && deno lint && deno fmt --check` Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add deno.json
git commit -m "chore: add --allow-write permission to dev and compile tasks"
```

---

## Chunk 3: Smoke Test

### Task 11: End-to-end smoke test

- [ ] **Step 1: Test `brick config --init`**

Run: `rm -f ~/.config/black-atom/shiplog/config.yml ~/.config/black-atom/shiplog/schema.json && deno task dev config --init`
Expected: Creates config.yml and schema.json in ~/.config/black-atom/shiplog/

- [ ] **Step 2: Verify generated config**

Run: `cat ~/.config/black-atom/shiplog/config.yml` Expected: YAML with schema reference line, provider:
anthropic, model: claude-haiku-4-5, models list, summaryLength: 72, historyCount: 10

- [ ] **Step 3: Verify generated schema**

Run: `cat ~/.config/black-atom/shiplog/schema.json | python3 -m json.tool | head -30` Expected: Valid JSON Schema
with provider enum containing "anthropic", model enum containing claude model names

- [ ] **Step 4: Test `brick config --show`**

Run: `deno task dev config --show` Expected: Prints resolved config to stdout

- [ ] **Step 5: Test `brick config --schema`**

Run: `deno task dev config --schema` Expected: Regenerates schema.json, prints success message

- [ ] **Step 6: Test `brick init`**

Run in a git repo: `rm -f .shiplog.toml && deno task dev init` Expected: Creates .shiplog.toml with schema
reference and commented-out issue fields

- [ ] **Step 7: Test commit command still works**

Run (with staged changes): `deno task dev commit --smart` Expected: Generates commit message using
the adapter map and correct chat() streaming
