# brick 🧱

If you want to build a proper house, you need good bricks.

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
# Create global config at ~/.config/brick/config.toml
brick config --init

# Create repo-local config (.brick.toml) for issue tracking
brick init
```

## LLM Support

The `--smart` flag on `commit` and `branch` commands sends context to an LLM and returns a
suggestion for you to review, edit, or regenerate before applying.

Currently supported providers:

| Provider    | Models                                                     |
| ----------- | ---------------------------------------------------------- |
| `anthropic` | `claude-opus-4-5`, `claude-sonnet-4-5`, `claude-haiku-4-5` |

The default model is `claude-haiku-4-5` (fast and cheap). You can switch models interactively during
a `--smart` session, or set a different default in your config.

Requires the provider's API key as an environment variable:

- Anthropic: `ANTHROPIC_API_KEY`

## Usage

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
```

## Configuration

### Global (`~/.config/brick/config.toml`)

```toml
provider = "anthropic"
model = "claude-haiku-4-5"
models = ["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5"]
summary_length = 72
history_count = 10
```

### Repo-local (`.brick.toml`)

```toml
use_lazygit = true
commit_types = ["feat", "fix", "docs", "style", "refactor", "test", "chore", "ci", "perf", "revert"]
issue_pattern = "(\\w+-\\d+)"
issue_prefix = ""
```

When `issue_pattern` matches the current branch name, the extracted issue ID is prepended to commit
messages automatically. `commit_types` can be customised per repo. Set `use_lazygit = false` to
disable the lazygit staging prompt.

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
