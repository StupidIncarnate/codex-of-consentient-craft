# UNDER CONSTRUCTION FOR CLI PIVOT

# DungeonMaster: Keeper of the Codex of Consentient Craft 🗡️

Turn your Claude into a quest-driven development powerhouse! DungeonMaster adds fun, medieval-themed orchestration
commands that help AI agents work together efficiently on your coding quests.

## Preamble
Based on learnings and findings from repeated claude amnesia and hallucination sessions, as well as some really good information from https://github.com/davidkimai/Context-Engineering.

## Prerequisites

### Install (Linux)
- Install jq: https://jqlang.org/download/

### CLAUDE.md Optimization

For optimal dungeonmaster performance, prepare your CLAUDE.md files by stripping out:
- any role or identity instructions

They should contain **only** information about your project and coding standards and working methodologies.
Dungeonmaster agents have their own specialized identities and adding conflicting roles can degrade performance. If you
still need certain personality layers on Claude, consider making a slash command for
it: https://docs.anthropic.com/en/docs/claude-code/slash-commands

**Make sure you have nested CLAUDE.md files if code standards change between folders.** Each agent automatically inherits context from the directory it's working in, enabling seamless monorepo support without complex configuration.

### CLAUDE.md Loading Behavior

- **Directory Context**: Agents load CLAUDE.md from their working directory first
- **Parent Inheritance**: If no local CLAUDE.md exists, agents inherit from parent directories
- **Context Switching**: Sub-agents moving between directories automatically switches context
- **Link References**: Use `@folder/path` notation to reference shared standards documents

**Example Structure**:
```
project/
├── CLAUDE.md                    # Root project standards
├── frontend/
│   ├── CLAUDE.md               # React/TypeScript standards
│   └── components/
├── backend/
│   ├── CLAUDE.md               # Node.js/API standards -> @docs/api-standards.md
│   └── services/
└── docs/
    └── api-standards.md        # Shared API documentation standards
```

For more information on CLAUDE.md structure, take a look at this write-up: 
- https://thomaslandgraf.substack.com/p/claude-codes-memory-working-with

## Quick Start

```bash
npx dungeonmaster
```

That's it! This will:
- ✅ Install quest commands to your `.claude/commands/` directory  
- ✅ Create a `dungeonmaster/` folder for tracking your development adventures
- ✅ Set up `.dungeonmaster` config for your project

## What is Dungeonmaster?

Dungeonmaster is an orchestration system that helps Claude manage complex development tasks by breaking them into quests
and delegating to specialized AI agents. Think of it as a party system for your AI coding assistant!

### The Fellowship

- **🎯 Dungeonmaster** - The party leader who orchestrates your quests
- **🗺️ Pathseeker** - Maps dependencies and discovers the optimal implementation path
- **🧵️ Codeweaver** - Weaves elegant implementations and tests
- **⚖️ Lawbringer** - Ensures code quality and standards compliance
- **🏰 Siegemaster** - Analyzes test completeness and identifies gaps
- **✨ Spiritmender** - Heals build errors and failed tests

## Usage

### Start Your Next Quest
```
/dungeonmaster
```
Works through your quest backlog automatically.

### Check Quest Status  
```
/dungeonmaster list
```
See all your quests and progress.

### Create or Start Specific Quest
```
/dungeonmaster fix user login timeout
```
Creates a new quest or continues existing one.

### Direct Agent Commands
```
/quest:codeweaver implement UserService
/quest:spiritmender fix failing tests
/quest:pathseeker analyze auth system
```

## Configuration

Edit `.dungeonmaster` to customize for your project:

```json
{
  "paths": {
    "questFolder": "./dungeonmaster"
  },
  "commands": {
    "ward": "npm run lint -- $FILE",
    "ward": "npm run ward"
  }
}
```

### Ward Commands

`ward` is Dungeonmaster's protection spell against bugs and late-night AI-inflicted madness sessions:
- `ward` - Checks a single file for errors
- `ward` - Protects the entire codebase

Configure these to match your project's lint/validation commands.

## Quest Structure

After installation, your quests are organized in:

```
dungeonmaster/
├── active/               # Currently active quests (alphabetical order)
│   └── [quest-name]-[YYYYMMDD].json
├── completed/            # Finished quests (local only)
│   └── [quest-name]-[YYYYMMDD].json
├── abandoned/            # Quests that were stopped (local only)
│   └── [quest-name]-[YYYYMMDD].json
├── retros/               # Retrospectives and learnings (shared via git)
│   └── [YYYYMMDD]-[topic].md
└── lore/                 # Accumulated wisdom and gotchas (shared via git)
    └── [category]-[description].md
```

## Features

- 🚀 **Parallel Execution** - Agents work simultaneously where safe
- 📊 **Progress Tracking** - Always know quest status
- 🔄 **Smart Resumption** - Pick up where you left off
- 🎯 **Flexible Commands** - Natural language understanding
- 📚 **Knowledge Building** - Agents learn and document gotchas

## Examples

### Fix a Bug
```
/dungeonmaster fix TypeError in user service
```

Dungeonmaster will create a bug fix quest and orchestrate the fix.

### Add a Feature
```
/dungeonmaster add user avatar upload
```
Creates a feature quest with proper discovery and implementation phases.

## For Monorepos

Configure ward commands to work with your workspace:
```json
{
  "commands": {
    "ward": "npm run lint -- $FILE && npm run typecheck -- $FILE && npm run test -- $FILE",
    "ward": "npm run ward"
  }
}
```

## Truths about Claude in balance with this system

These are observations of how Claude Code works and how the system balances out Claude's inherent "entrenched habits".

### Files are small

- Claude (Sonnet 4.5/Claude Code - v2) greps for partial content whenever it can
- The system is structured to keep files small so that Claude doesn't grep for cut off content

## Contributing

Found a bug or have a feature idea? Open an issue or PR!

## Local Development: Testing with npm link

To test the package locally in another project before publishing:

### Step 1: Link all packages globally (from monorepo root)

```bash
cd /path/to/codex-of-consentient-craft
npm link --workspaces
```

This registers `dungeonmaster` and all `@dungeonmaster/*` packages globally.

### Step 2: Link packages in your test project

```bash
cd /path/to/your-test-project
npm link dungeonmaster @dungeonmaster/cli @dungeonmaster/config @dungeonmaster/eslint-plugin @dungeonmaster/hooks @dungeonmaster/orchastrator @dungeonmaster/shared @dungeonmaster/standards @dungeonmaster/testing @dungeonmaster/tooling
```

### Step 3: Verify the links

```bash
ls -la node_modules/@dungeonmaster/
ls -la node_modules/dungeonmaster
```

You should see symlinks pointing back to the monorepo.

### Notes

- **Why link all packages?** npm workspaces only affect local development. `npm link` on the root alone doesn't make
  workspace sub-packages available - they must be linked individually.
- **After running `npm install`** in your test project, the links may be removed. Re-run the link command from Step 2.
- **To unlink**, run `npm unlink <package-name>` or delete the symlinks from `node_modules/`.

## Rate-limit telemetry (optional)

The dungeonmaster web UI can display your live Anthropic 5-hour and 7-day rate-limit usage in the top-right of every
page, mirroring what Claude Code's statusline shows. Setting this up is one manual step the user has to apply, since
it integrates with whatever statusline you already have.

### What it does

Whenever Claude Code refreshes its statusline (in any repo), our `dungeonmaster statusline-tap` subcommand reads the
status JSON, extracts `rate_limits.{five_hour,seven_day}`, and writes a snapshot to:

- `~/.dungeonmaster/rate-limits.json` (latest, atomic-rename writes; throttled to once per 5 seconds)
- `~/.dungeonmaster/rate-limits-history.jsonl` (append-only log; reserved for future trajectory features)

The dungeonmaster server polls the snapshot file every 5s and broadcasts updates over WebSocket to any connected web
UI. Rate-limit data is per-Anthropic-account, so installing the tap on one machine surfaces quotas across every repo
running Claude Code under the same account.

### Wiring it in

Edit `~/.claude/settings.json` and chain `dungeonmaster statusline-tap` into the front of your existing statusline
command:

```jsonc
{
  "statusLine": {
    "command": "dungeonmaster statusline-tap | <your existing statusline command>"
  }
}
```

The tap is a pure pass-through: it reads JSON on stdin, side-effects to disk, and re-emits the same JSON on stdout
unchanged. Your statusline visualization is untouched.

### What you'll see

The web UI's top-right shows two stacked monospace cards (5h on top, 7d below) once the tap has run at least once:

```
[ 5h ▰▰▱▱▱▱▱▱  3% (2h5m) ]
[ 7d ▰▰▱▱▱▱▱▱ 20% (4d11h) ]
```

The bar fills proportionally; the color thresholds match the bash statusline (green/default below 50%, yellow at
50-79%, red at 80%+). Without the tap wired up, the cards simply don't render — the rest of the UI is unaffected.

### Failure modes

- The tap exits 0 even on parse failure (it never blocks your statusline).
- If `~/.dungeonmaster/rate-limits.json` is malformed or absent, the web UI just hides the cards.
- Throttling is mtime-based: the tap skips a write when the snapshot's mtime is less than 5s old.

## License

MIT

---

*May your quests be swift and your builds always green! ⚔️✨*