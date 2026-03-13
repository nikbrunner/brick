# Commit Builder Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents
> available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`)
> syntax for tracking.

**Goal:** Replace `brick commit` (no args) with a full commitizen-style interactive builder that
guides the user through type, scope, breaking change, subject, body, and footer — with `Ctrl+G` to
open any field in `$EDITOR`.

**Architecture:** A new `src/ui/commit-builder.ts` module owns the guided flow and `openInEditor()`.
`src/commands/commit.ts` routes to it when no `--smart` flag is present. Two new config fields
(`useLazygit`, `commitTypes`) are added to `RepoConfigSchema`.

**Tech Stack:** Deno 2.x, `@cliffy/prompt` (Select, Input, Confirm, Toggle), `@std/fmt/colors`, Zod
v4.

---

## Chunk 1: Config schema additions

### Task 1: Add `useLazygit` and `commitTypes` to schema

**Files:**

- Modify: `src/config/schema.ts`
- Modify: `src/config/schema_test.ts`

**Default commit types:**

```
feat, fix, docs, style, refactor, test, chore, ci, perf, revert
```

- [ ] **Step 1: Write failing tests**

Add to `src/config/schema_test.ts`:

```typescript
Deno.test("RepoConfigSchema - useLazygit defaults to true", () => {
    const result = RepoConfigSchema.parse({});
    assertEquals(result.useLazygit, true);
});

Deno.test("RepoConfigSchema - commitTypes defaults to standard set", () => {
    const result = RepoConfigSchema.parse({});
    assertEquals(result.commitTypes.includes("feat"), true);
    assertEquals(result.commitTypes.includes("fix"), true);
    assertEquals(result.commitTypes.length, 10);
});

Deno.test("RepoConfigSchema - accepts custom commitTypes", () => {
    const result = RepoConfigSchema.parse({ commitTypes: ["feat", "fix", "custom"] });
    assertEquals(result.commitTypes, ["feat", "fix", "custom"]);
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
deno task test
```

Expected: 3 new tests fail.

- [ ] **Step 3: Add fields to `RepoConfigSchema`**

In `src/config/schema.ts`, update `RepoConfigSchema`:

```typescript
export const DEFAULT_COMMIT_TYPES = [
    "feat",
    "fix",
    "docs",
    "style",
    "refactor",
    "test",
    "chore",
    "ci",
    "perf",
    "revert",
] as const;

export const RepoConfigSchema = z.object({
    issuePattern: z.string().optional(),
    issuePrefix: z.string().optional(),
    useLazygit: z.boolean().default(true),
    commitTypes: z.array(z.string()).default([...DEFAULT_COMMIT_TYPES]),
});
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
deno task test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/config/schema.ts src/config/schema_test.ts
git commit -m "feat(config): add useLazygit and commitTypes to RepoConfigSchema"
```

---

## Chunk 2: `openInEditor` utility

### Task 2: Extract and generalise `openInEditor`

The existing `editMessage()` in `src/ui/prompts.ts` does exactly this but is message-specific.
Extract a generic version.

**Files:**

- Modify: `src/ui/prompts.ts` — replace `editMessage` body with a call to `openInEditor`
- No new test file needed — `openInEditor` is a side-effect function; covered by existing
  `editMessage` manual test path

- [ ] **Step 1: Extract `openInEditor` into `src/ui/prompts.ts`**

Add above `editMessage`:

```typescript
export async function openInEditor(content: string): Promise<string | null> {
    const tmpFile = await Deno.makeTempFile({ suffix: ".txt" });
    await Deno.writeTextFile(tmpFile, content);

    const editor = Deno.env.get("EDITOR") ?? "nvim";
    const command = new Deno.Command(editor, {
        args: [tmpFile],
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
    });

    const process = command.spawn();
    const status = await process.status;

    if (!status.success) {
        await Deno.remove(tmpFile).catch(() => {});
        return null;
    }

    try {
        const result = (await Deno.readTextFile(tmpFile)).trim();
        await Deno.remove(tmpFile).catch(() => {});
        return result || null;
    } finally {
        await Deno.remove(tmpFile).catch(() => {});
    }
}
```

Then simplify `editMessage` to:

```typescript
export async function editMessage(message: string): Promise<string | null> {
    return openInEditor(message);
}
```

- [ ] **Step 2: Run tests**

```bash
deno task test
```

Expected: all pass (no behaviour change).

- [ ] **Step 3: Commit**

```bash
git add src/ui/prompts.ts
git commit -m "refactor(ui): extract openInEditor from editMessage"
```

---

## Chunk 3: `buildCommitMessage` pure function

### Task 3: Pure assembly function with tests

**Files:**

- Create: `src/ui/commit-builder.ts`
- Create: `src/ui/commit-builder_test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/ui/commit-builder_test.ts`:

```typescript
import { assertEquals } from "jsr:@std/assert";
import { buildCommitMessage } from "./commit-builder.ts";

Deno.test("buildCommitMessage - type and subject only", () => {
    const result = buildCommitMessage({
        type: "feat",
        scope: "",
        breaking: false,
        subject: "add login page",
        body: "",
        footer: "",
    });
    assertEquals(result, "feat: add login page");
});

Deno.test("buildCommitMessage - with scope", () => {
    const result = buildCommitMessage({
        type: "fix",
        scope: "auth",
        breaking: false,
        subject: "handle expired tokens",
        body: "",
        footer: "",
    });
    assertEquals(result, "fix(auth): handle expired tokens");
});

Deno.test("buildCommitMessage - breaking change appends !", () => {
    const result = buildCommitMessage({
        type: "feat",
        scope: "api",
        breaking: true,
        subject: "remove v1 endpoints",
        body: "",
        footer: "",
    });
    assertEquals(result, "feat(api)!: remove v1 endpoints");
});

Deno.test("buildCommitMessage - with body", () => {
    const result = buildCommitMessage({
        type: "refactor",
        scope: "",
        breaking: false,
        subject: "simplify auth flow",
        body: "Reduces complexity by removing the intermediate layer.",
        footer: "",
    });
    assertEquals(
        result,
        "refactor: simplify auth flow\n\nReduces complexity by removing the intermediate layer.",
    );
});

Deno.test("buildCommitMessage - with footer", () => {
    const result = buildCommitMessage({
        type: "fix",
        scope: "",
        breaking: false,
        subject: "resolve crash on startup",
        body: "",
        footer: "Closes #42",
    });
    assertEquals(result, "fix: resolve crash on startup\n\nCloses #42");
});

Deno.test("buildCommitMessage - full message", () => {
    const result = buildCommitMessage({
        type: "feat",
        scope: "ui",
        breaking: true,
        subject: "redesign nav",
        body: "Complete overhaul of the navigation component.",
        footer: "BREAKING CHANGE: nav prop renamed to navigation\nCloses #99",
    });
    assertEquals(
        result,
        "feat(ui)!: redesign nav\n\nComplete overhaul of the navigation component.\n\nBREAKING CHANGE: nav prop renamed to navigation\nCloses #99",
    );
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
deno task test
```

Expected: 6 new tests fail with "Cannot resolve module".

- [ ] **Step 3: Create `src/ui/commit-builder.ts` with the pure function**

```typescript
export interface CommitParts {
    type: string;
    scope: string;
    breaking: boolean;
    subject: string;
    body: string;
    footer: string;
}

export function buildCommitMessage(parts: CommitParts): string {
    const { type, scope, breaking, subject, body, footer } = parts;

    const scopePart = scope ? `(${scope})` : "";
    const breakingPart = breaking ? "!" : "";
    let message = `${type}${scopePart}${breakingPart}: ${subject}`;

    if (body) message += `\n\n${body}`;
    if (footer) message += `\n\n${footer}`;

    return message;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
deno task test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/ui/commit-builder.ts src/ui/commit-builder_test.ts
git commit -m "feat(ui): add buildCommitMessage pure function with tests"
```

---

## Chunk 4: Interactive guided flow

### Task 4: `runGuidedCommit` in `commit-builder.ts`

**Files:**

- Modify: `src/ui/commit-builder.ts` — add `runGuidedCommit`
- No unit tests — interactive prompts are side effects; verified manually

`runGuidedCommit` is async and drives the full builder UX. It takes `MergedConfig` and returns the
final committed message or exits.

- [ ] **Step 1: Add imports to `src/ui/commit-builder.ts`**

```typescript
import { Confirm, Input, Select } from "@cliffy/prompt";
import * as colors from "@std/fmt/colors";
import type { MergedConfig } from "../config/schema.ts";
import { openInEditor } from "./prompts.ts";
import { commit } from "../git/operations.ts";
```

- [ ] **Step 2: Add `promptWithEditorEscape` helper**

This wraps any `Input` prompt to add `Ctrl+G` support:

```typescript
async function promptWithEditorEscape(message: string, initial = ""): Promise<string> {
    console.log(colors.dim(`  ${message} (Ctrl+G to open in $EDITOR)`));
    const value = await Input.prompt({
        message,
        default: initial,
        hint: "Ctrl+G → $EDITOR",
    });

    if (value === "\x07" || value.trim() === ":e") {
        const edited = await openInEditor(initial);
        return edited ?? initial;
    }

    return value;
}
```

> Note: Cliffy does not natively support `Ctrl+G` key binding on `Input`. The implementation should
> check if the raw value equals the ctrl-G character (`\x07`), or use `:e` as a text escape sequence
> as a fallback. If neither intercepts cleanly after testing, use a `Toggle` before each long-form
> field: "Open in editor? (y/N)".

- [ ] **Step 3: Add `runGuidedCommit`**

```typescript
export async function runGuidedCommit(config: MergedConfig): Promise<void> {
    // 1. Type
    const type = await Select.prompt({
        message: "Select commit type",
        options: config.commitTypes.map((t) => ({ name: t, value: t })),
    });

    // 2. Scope
    const scope = await Input.prompt({
        message: "Scope (optional, Enter to skip)",
    });

    // 3. Breaking change
    const breaking = await Confirm.prompt({
        message: "Breaking change?",
        default: false,
    });

    // 4. Subject
    const subject = await promptWithEditorEscape("Short description");
    if (!subject.trim()) {
        console.error(colors.red("Subject is required."));
        Deno.exit(1);
    }

    // 5. Body
    const body = await promptWithEditorEscape("Body (optional, Enter to skip)");

    // 6. Footer
    const footer = await promptWithEditorEscape(
        "Footer (optional — BREAKING CHANGE: ..., Closes #N)",
    );

    // 7. Preview
    const message = buildCommitMessage({
        type,
        scope: scope.trim(),
        breaking,
        subject: subject.trim(),
        body: body.trim(),
        footer: footer.trim(),
    });

    console.log("");
    console.log("Commit message:");
    console.log(colors.dim("─".repeat(40)));
    console.log(colors.yellow(message));
    console.log(colors.dim("─".repeat(40)));
    console.log("");

    // 8. Confirm
    const confirmed = await Confirm.prompt({ message: "Commit?", default: true });
    if (!confirmed) {
        console.log("Commit cancelled.");
        Deno.exit(1);
    }

    await commit(message);
    console.log(colors.green("\nChanges committed successfully!"));
}
```

- [ ] **Step 4: Run tests (to verify no regressions)**

```bash
deno task test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/ui/commit-builder.ts
git commit -m "feat(ui): add runGuidedCommit interactive flow"
```

---

## Chunk 5: Wire up command routing

### Task 5: Update `commit.ts` to route to guided builder

**Files:**

- Modify: `src/commands/commit.ts`

- [ ] **Step 1: Update `commit.ts` routing**

Replace the lazygit block (currently the no-`--smart` path) with:

```typescript
if (!options.smart) {
    await ensureStagedChanges(config.useLazygit);
    await runGuidedCommit(config);
    await handlePush(!!options.push, !!options.force);
    return;
}
```

Add import at top:

```typescript
import { runGuidedCommit } from "../ui/commit-builder.ts";
```

- [ ] **Step 2: Update `ensureStagedChanges` signature**

`ensureStagedChanges` currently always tries lazygit. Update it to accept a flag:

```typescript
async function ensureStagedChanges(useLazygit: boolean): Promise<void> {
    const diff = await getStagedDiff();
    if (diff) return;

    console.error(colors.yellow("No staged changes found."));

    if (useLazygit) {
        const opened = await askUserToOpenLazygit();
        if (opened) {
            const diffAfterStaging = await getStagedDiff();
            if (!diffAfterStaging) {
                console.log("No changes staged. Aborting.");
                Deno.exit(1);
            }
            return;
        }
    }

    console.error("Please stage your changes first.");
    Deno.exit(1);
}
```

Also update the existing `--smart` path to pass the flag:

```typescript
await ensureStagedChanges(config.useLazygit);
```

Note: `loadConfig()` must be called before `ensureStagedChanges` in both paths now. Move
`const config = await loadConfig()` to before the routing split.

- [ ] **Step 3: Remove the now-redundant lazygit-only block**

The old block:

```typescript
if (!options.smart) {
    if (!await isLazygitInstalled()) { ... }
    await openLazygit();
    return;
}
```

is replaced entirely by the new routing above.

- [ ] **Step 4: Run tests**

```bash
deno task test
```

Expected: all pass.

- [ ] **Step 5: Manual smoke test**

```bash
# Stage a file, then:
brick commit
# Should show type selector, then guided prompts
# Ctrl+G on subject should open $EDITOR

brick commit --smart
# Should behave exactly as before
```

- [ ] **Step 6: Commit**

```bash
git add src/commands/commit.ts
git commit -m "feat(commit): wire guided builder as default commit flow"
```

---

## Chunk 6: Update docs and schema

### Task 6: Update README and `.brick.yml` template

**Files:**

- Modify: `README.md`
- Modify: `src/commands/init.ts` — add `useLazygit` and `commitTypes` to generated `.brick.yml`

- [ ] **Step 1: Update `init.ts` template**

```typescript
const content = [
    `# yaml-language-server: $schema=${REMOTE_SCHEMA_URL}`,
    `# useLazygit: true`,
    `# commitTypes:`,
    `#   - feat`,
    `#   - fix`,
    `#   - docs`,
    `#   - style`,
    `#   - refactor`,
    `#   - test`,
    `#   - chore`,
    `#   - ci`,
    `#   - perf`,
    `#   - revert`,
    `# issuePattern: "(\\w+-\\d+)"`,
    `# issuePrefix: ""`,
    "",
].join("\n");
```

- [ ] **Step 2: Update README Usage section**

Replace the `brick commit` entry:

````markdown
### Commit

```sh
# Guided conventional commit builder (interactive)
brick commit

# AI-generated commit message (interactive)
brick commit --smart

# Auto-confirm the generated message
brick commit --smart --yes

# Commit and push
brick commit --smart --yes --push

# Force push (--force-with-lease)
brick commit --smart --yes --push --force
```
````

````
- [ ] **Step 3: Update schema.json**

```bash
deno task schema
````

- [ ] **Step 4: Run tests**

```bash
deno task test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add README.md src/commands/init.ts schema.json
git commit -m "docs: update README and init template for commit builder"
```
