# Brick

AI-powered git CLI — generates commit messages and branch names via LLM.

## Install

Requires [Deno 2.x](https://deno.com/) and an `ANTHROPIC_API_KEY` environment variable.

```sh
git clone https://github.com/nikbrunner/brick.git
cd brick
deno task install
```

This installs `brick` globally via `deno install`. Changes to source take effect immediately — no
rebuild needed.

For a standalone binary instead:

```sh
deno task compile
cp brick ~/.local/bin/  # or anywhere on PATH
```

## Setup

```sh
# Create global config at ~/.config/brick/config.yml
brick config --init

# Create repo-local config (.brick.yml) for issue tracking
brick init
```

## Usage

### Commit

```sh
# Open lazygit for manual commit
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

### Branch

```sh
# Create branch directly
brick branch my-feature

# AI-generated branch name from description
brick branch --smart "fix the login validation bug"

# Auto-confirm
brick branch --smart --yes "add user dashboard"
```

### Config

```sh
# Show resolved config (global + repo merged)
brick config --show

# Regenerate JSON Schema (for YAML editor autocomplete)
brick config --schema
```

## Configuration

### Global (`~/.config/brick/config.yml`)

```yaml
# yaml-language-server: $schema=/Users/you/.config/brick/schema.json
provider: anthropic
model: claude-haiku-4-5
models:
    - claude-opus-4-5
    - claude-sonnet-4-5
    - claude-haiku-4-5
summaryLength: 72
historyCount: 10
```

### Repo-local (`.brick.yml`)

```yaml
# yaml-language-server: $schema=/Users/you/.config/brick/schema.json
issuePattern: "(\w+-\d+)"
issuePrefix: ""
```

When `issuePattern` matches the current branch name, the extracted issue ID is prepended to commit
messages automatically.

## Development

```sh
deno task test     # Run tests
deno task check    # Type-check
deno task lint     # Lint
deno task fmt      # Format
```

## Stack

- [Deno 2.x](https://deno.com/) — runtime
- [TanStack AI](https://tanstack.com/ai) + `@tanstack/ai-anthropic` — LLM abstraction
- [Zod v4](https://zod.dev/) — config schema validation
- [Cliffy](https://cliffy.io/) — CLI framework and interactive prompts
