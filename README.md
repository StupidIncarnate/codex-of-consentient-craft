# Questmaestro: Keeper of the Codex of Consentient Craft 🗡️

Turn your Claude into a quest-driven development powerhouse! Questmaestro adds fun, medieval-themed orchestration commands that help AI agents work together efficiently on your coding quests.

## Preamble
Based on learnings and findings from repeated claude amnesia and hallucination sessions, as well as some really good information from https://github.com/davidkimai/Context-Engineering.

## Prerequisites

### Install (Linux)
- Install jq: https://jqlang.org/download/

### CLAUDE.md Optimization

For optimal questmaestro performance, prepare your CLAUDE.md files by stripping out:
- any role or identity instructions

They should contain **only** information about your project and coding standards and working methodologies. Questmaestro agents have their own specialized identities and adding conflicting roles can degrade performance. If you still need certain personality layers on Claude, consider making a slash command for it: https://docs.anthropic.com/en/docs/claude-code/slash-commands

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
npx questmaestro
```

That's it! This will:
- ✅ Install quest commands to your `.claude/commands/` directory  
- ✅ Create a `questmaestro/` folder for tracking your development adventures
- ✅ Set up `.questmaestro` config for your project

## What is Questmaestro?

Questmaestro is an orchestration system that helps Claude manage complex development tasks by breaking them into quests and delegating to specialized AI agents. Think of it as a party system for your AI coding assistant!

### The Fellowship

- **🎯 Questmaestro** - The party leader who orchestrates your quests
- **🗺️ Pathseeker** - Maps dependencies and discovers the optimal implementation path
- **🧵️ Codeweaver** - Weaves elegant implementations and tests
- **⚖️ Lawbringer** - Ensures code quality and standards compliance
- **🏰 Siegemaster** - Analyzes test completeness and identifies gaps
- **✨ Spiritmender** - Heals build errors and failed tests

## Usage

### Start Your Next Quest
```
/questmaestro
```
Works through your quest backlog automatically.

### Check Quest Status  
```
/questmaestro list
```
See all your quests and progress.

### Create or Start Specific Quest
```
/questmaestro fix user login timeout
```
Creates a new quest or continues existing one.

### Direct Agent Commands
```
/quest:codeweaver implement UserService
/quest:spiritmender fix failing tests
/quest:pathseeker analyze auth system
```

## Configuration

Edit `.questmaestro` to customize for your project:

```json
{
  "paths": {
    "questFolder": "./questmaestro"
  },
  "commands": {
    "ward": "npm run lint -- $FILE",
    "ward:all": "npm run lint && npm run typecheck"
  }
}
```

### Ward Commands

`ward` is Questmaestro's protection spell against bugs and late-night AI-inflicted madness sessions:
- `ward` - Checks a single file for errors
- `ward:all` - Protects the entire codebase

Configure these to match your project's lint/validation commands.

## Quest Structure

After installation, your quests are organized in:

```
questmaestro/
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
/questmaestro fix TypeError in user service
```
Questmaestro will create a bug fix quest and orchestrate the fix.

### Add a Feature
```
/questmaestro add user avatar upload
```
Creates a feature quest with proper discovery and implementation phases.

## For Monorepos

Configure ward commands to work with your workspace:
```json
{
  "commands": {
    "ward": "npm run lint -- $FILE && npm run typecheck -- $FILE && npm run test -- $FILE",
    "ward:all": "npm run lint && npm run typecheck && npm run build && npm run test"
  }
}
```

## Contributing

Found a bug or have a feature idea? Open an issue or PR!

## License

MIT

---

*May your quests be swift and your builds always green! ⚔️✨*