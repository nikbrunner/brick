# Rename brick → shiplog & Move to Black Atom Industries

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the CLI from "brick" to "shiplog", update config paths to
`~/.config/black-atom/shiplog/`, and move the repo to the `black-atom-industries` GitHub org.

**Architecture:** Find-and-replace all "brick" references across source, config, docs, and CI.
Update config directory from `~/.config/brick/` to `~/.config/black-atom/shiplog/` (matching
livery's `~/.config/black-atom/livery/` pattern). Create repo under BAI org, push, archive old repo.

**Tech Stack:** Deno 2.x, TypeScript, GitHub CLI

---

## File Map

| Action        | File                                                            | What changes                             |
| ------------- | --------------------------------------------------------------- | ---------------------------------------- |
| Modify        | `deno.json`                                                     | Package name, install/compile task names |
| Modify        | `src/main.ts`                                                   | CLI `.name("shiplog")`                   |
| Modify        | `src/config/paths.ts`                                           | Config dir, config filenames, schema URL |
| Modify        | `src/config/paths_test.ts`                                      | All path assertions                      |
| Modify        | `src/config/loader.ts`                                          | Schema URL reference                     |
| Modify        | `src/config/loader_test.ts`                                     | `.brick.toml` → `.shiplog.toml`          |
| Modify        | `src/commands/init.ts`                                          | `.brick.toml` in description             |
| Modify        | `src/commands/branch.ts`                                        | Error message CLI name                   |
| Modify        | `.gitignore`                                                    | Binary name                              |
| Modify        | `.github/workflows/release.yml`                                 | Binary artifact name                     |
| Modify        | `README.md`                                                     | All references                           |
| Modify        | `CHANGELOG.md`                                                  | GitHub URLs                              |
| Modify        | `.claude/CLAUDE.md`                                             | Project description, config paths        |
| Rename+Modify | `.claude/skills/about-brick/` → `.claude/skills/about-shiplog/` | All references                           |
| Modify        | `docs/superpowers/plans/*.md`                                   | Historical references (light touch)      |
| Modify        | `schema.json`                                                   | `$id` URL if present                     |
| Modify        | `.github/release-please-config.json`                            | If contains repo name                    |

---

### Task 1: Rename core source references

**Files:**

- Modify: `src/main.ts:9`
- Modify: `src/config/paths.ts:1-11`
- Modify: `src/config/loader.ts:42`
- Modify: `src/commands/init.ts:7`
- Modify: `src/commands/branch.ts:47`

- [ ] **Step 1: Update `src/config/paths.ts`**

```typescript
const HOME = Deno.env.get("HOME") ?? "";

export const CONFIG_DIR = `${HOME}/.config/black-atom/shiplog`;
export const GLOBAL_CONFIG_PATH = `${CONFIG_DIR}/config.toml`;
export const REPO_CONFIG_NAME = ".shiplog.toml";
export const REMOTE_SCHEMA_URL =
    "https://raw.githubusercontent.com/black-atom-industries/shiplog/main/schema.json";
```

> **Breaking change:** Legacy migration paths removed. Old `~/.config/brick/` config will be moved
> to new location in Task 5.

- [ ] **Step 2: Update `src/main.ts`**

Change `.name("brick")` → `.name("shiplog")`

- [ ] **Step 3: Update `src/config/loader.ts`**

Change GitHub URL from `nikbrunner/brick` → `black-atom-industries/shiplog`

- [ ] **Step 4: Update `src/commands/init.ts`**

Change `.brick.toml` → `.shiplog.toml` in description

- [ ] **Step 5: Update `src/commands/branch.ts`**

Change `'brick branch` → `'shiplog branch` in error message

- [ ] **Step 6: Run tests to verify nothing breaks**

Run: `deno test --allow-read --allow-env --allow-write` Expected: Some test failures (paths_test and
loader_test still reference old names — fixed in Task 2)

- [ ] **Step 7: Commit**

```bash
git add src/main.ts src/config/paths.ts src/config/loader.ts src/commands/init.ts src/commands/branch.ts
git commit -m "refactor: rename brick to shiplog in core source"
```

---

### Task 2: Update tests

**Files:**

- Modify: `src/config/paths_test.ts`
- Modify: `src/config/loader_test.ts`

- [ ] **Step 1: Update `src/config/paths_test.ts`**

Replace all `brick` references with `shiplog` and update config dir to `black-atom/shiplog`.

- [ ] **Step 2: Update `src/config/loader_test.ts`**

Replace `.brick.toml` → `.shiplog.toml`

- [ ] **Step 3: Run tests**

Run: `deno test --allow-read --allow-env --allow-write` Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add src/config/paths_test.ts src/config/loader_test.ts
git commit -m "test: update test assertions for shiplog rename"
```

---

### Task 3: Update project config files

**Files:**

- Modify: `deno.json:3,8,9`
- Modify: `.gitignore:2`
- Modify: `.github/workflows/release.yml:40`
- Modify: `.github/release-please-config.json`
- Modify: `.github/.release-please-manifest.json`
- Modify: `schema.json`

- [ ] **Step 1: Update `deno.json`**

- `"name": "@nikbrunner/brick"` → `"name": "@black-atom-industries/shiplog"`
- `--name brick` → `--name shiplog` (install task)
- `--output brick` → `--output shiplog` (compile task)

- [ ] **Step 2: Update `.gitignore`**

Change `brick` → `shiplog` (compiled binary entry)

- [ ] **Step 3: Update `.github/workflows/release.yml`**

Change `files: brick` → `files: shiplog`

- [ ] **Step 4: Update `schema.json`**

Update `$id` if it references `nikbrunner/brick`

- [ ] **Step 5: Update release-please config if needed**

Check `.github/release-please-config.json` and `.github/.release-please-manifest.json` for repo
references.

- [ ] **Step 6: Commit**

```bash
git add deno.json .gitignore .github/ schema.json
git commit -m "build: update project config for shiplog rename"
```

---

### Task 4: Update documentation

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `.claude/CLAUDE.md`
- Rename: `.claude/skills/about-brick/` → `.claude/skills/about-shiplog/`
- Modify: `.claude/skills/about-shiplog/SKILL.md`

- [ ] **Step 1: Update `README.md`**

Replace all `brick` → `shiplog`, `nikbrunner/brick` → `black-atom-industries/shiplog`,
`~/.config/brick` → `~/.config/black-atom/shiplog`, `.brick.toml` → `.shiplog.toml`

- [ ] **Step 2: Update `CHANGELOG.md`**

Replace GitHub URLs `nikbrunner/brick` → `black-atom-industries/shiplog`

- [ ] **Step 3: Update `.claude/CLAUDE.md`**

Update project description, config paths, and per-repo config name.

- [ ] **Step 4: Rename and update skill**

```bash
mv .claude/skills/about-brick .claude/skills/about-shiplog
```

Update `.claude/skills/about-shiplog/SKILL.md` — replace all brick references, update paths, update
architecture description to reflect BAI org.

- [ ] **Step 5: Update historical plan docs (light touch)**

In `docs/superpowers/plans/*.md`, update only config path references that could cause confusion.
These are historical — don't rewrite everything.

- [ ] **Step 6: Commit**

```bash
git add README.md CHANGELOG.md .claude/ docs/
git commit -m "docs: update all documentation for shiplog rename"
```

---

### Task 5: Migrate user config (local machine)

- [ ] **Step 1: Create new config directory**

```bash
mkdir -p ~/.config/black-atom/shiplog
```

- [ ] **Step 2: Copy existing config if present**

```bash
cp ~/.config/brick/config.toml ~/.config/black-atom/shiplog/config.toml 2>/dev/null || true
```

- [ ] **Step 3: Verify config loads from new path**

Run:
`deno run --allow-run --allow-read --allow-env --allow-net --allow-write src/main.ts config show`

- [ ] **Step 4: Reinstall CLI**

Run: `deno task install` Verify: `which shiplog` should show the new binary name

---

### Task 6: GitHub migration

- [ ] **Step 1: Create repo under BAI org**

```bash
gh repo create black-atom-industries/shiplog --public --description "AI-powered git CLI — generates commit messages and branch names via LLM"
```

- [ ] **Step 2: Update git remote**

```bash
git remote set-url origin https://github.com/black-atom-industries/shiplog.git
```

- [ ] **Step 3: Push all branches and tags**

```bash
git push -u origin main
git push origin --tags
```

- [ ] **Step 4: Archive old repo**

```bash
gh repo edit nikbrunner/brick --description "Moved to black-atom-industries/shiplog" --homepage "https://github.com/black-atom-industries/shiplog"
gh repo archive nikbrunner/brick --yes
```

---

### Task 7: Update external references

- [ ] **Step 1: Update the `about-brick` skill in global Claude config**

Update `/Users/nbr/.claude/skills/` if there's a global reference to brick. The project-level skill
was already renamed in Task 4.

- [ ] **Step 2: Update memory files**

Check `/Users/nbr/.claude/projects/` for any brick-specific memory files that need updating.

- [ ] **Step 3: Move local repo directory**

```bash
mv ~/repos/nikbrunner/brick ~/repos/black-atom-industries/shiplog
```
