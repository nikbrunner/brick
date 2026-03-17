---
name: about:brick
description: Brick project context — architecture, history, and the original repo script it replaces
user-invocable: false
---

# Brick — Project Context

## What It Is

Brick is an AI-powered git CLI tool built with Deno 2.x and TypeScript. It generates commit messages
and branch names via LLM providers (currently Anthropic).

## Origin

Brick is a re-invention of the `repo` bash script from
[nikbrunner/dots](https://github.com/nikbrunner/dots) at `common/.local/bin/repo`. The bash script
provided AI-powered commit and branch operations using direct `curl` calls to the Anthropic API or
Claude Code CLI. Brick replaces this with a typed, extensible Deno CLI.

Key differences from the original `repo` script:

- Typed config with Zod validation instead of hardcoded bash variables
- Provider abstraction via TanStack AI instead of raw curl/CLI calls
- Proper CLI framework (Cliffy) instead of manual arg parsing
- TOML config files (global + per-repo) instead of in-script constants
- Extensible provider pattern (designed for multi-provider support)

## Archived Code

The `archive/v1-bash` branch contains the original bash implementation that was the first version of
brick. This code is deprecated and preserved for reference only.

## Architecture

```
src/
  main.ts           → Entry point, Cliffy command registration
  commands/          → commit.ts, branch.ts — CLI command definitions
  ai/                → client.ts (LLM interaction), prompts.ts (prompt templates)
  providers/         → index.ts (registry), anthropic.ts (TanStack AI adapter)
  config/            → schema.ts (Zod), loader.ts (TOML)
  git/               → diff.ts, exec.ts, operations.ts
  ui/                → prompts.ts (interactive user prompts via Cliffy)
```

## Config

- Global: `~/.config/brick/config.toml`
- Per-repo: `.brick.toml` in repo root
- Schema: `src/config/schema.ts` — validates with Zod v4
- Merge order: defaults → global → repo
