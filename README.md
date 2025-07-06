# Questmaestro: Keeper of the Codex of Consentient Craft 🗡️

Turn your Claude into a quest-driven development powerhouse! Questmaestro adds fun, medieval-themed orchestration commands that help AI agents work together efficiently on your coding quests.

## Preamble
Based on learnings and findings from repeated claude amnesia and hallucination sessions, as well as some really good information from https://github.com/davidkimai/Context-Engineering.

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
- **🗺️ Pathseeker** - Maps dependencies and discovers the optimal path  
- **⚔️ Codeweaver** - Weaves elegant implementations
- **⚖️ Lawbringer** - Ensures code quality and standards
- **🏰 Siegemaster** - Creates robust test fortifications
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
    "test": "npm test",
    "ward": "npm run lint -- $FILE",
    "ward:all": "npm run lint && npm run typecheck"
  },
  "agents": {
    "disablePathseeker": false,
    "disableCodeweaver": false,
    "disableLawbringer": false,
    "disableSiegemaster": false,
    "disableSpiritmender": false
  }
}
```

### Agent Configuration

Control which agents participate in your quests by setting disable flags:

- `disablePathseeker` - Skip dependency mapping and path analysis
- `disableCodeweaver` - Skip implementation tasks  
- `disableLawbringer` - Skip code quality and standards enforcement
- `disableSiegemaster` - Skip test creation and fortification
- `disableSpiritmender` - Skip error healing and build fixes

**Example**: For a documentation-only project, you might disable Siegemaster and Spiritmender:
```json
{
  "agents": {
    "disableSiegemaster": true,
    "disableSpiritmender": true
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
├── quest-tracker.json    # Simple list of quest filenames by status
├── active/               # Currently active quests (ordered by priority)
│   └── [quest-name]-[YYYYMMDD].json
├── completed/            # Finished quests
│   └── [quest-name]-[YYYYMMDD].json
├── abandoned/            # Quests that were stopped
│   └── [quest-name]-[YYYYMMDD].json
├── retros/               # Retrospectives and learnings
│   └── [YYYYMMDD]-[topic].md
└── lore/                 # Accumulated wisdom and gotchas
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

### Continue Where You Left Off
```
/questmaestro
```
Automatically resumes active quest or starts the next one.

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