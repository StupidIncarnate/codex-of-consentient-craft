# Welcome to Questmaestro 🗡️

You're working on Questmaestro, a fun quest-driven orchestration system that helps AI agents work together efficiently on coding tasks.

## Quick Context

This is an **npm package** that users install via `npx questmaestro` to add quest-themed slash commands to their Claude setup. It transforms development tasks into epic quests with a fellowship of specialized AI agents.

## Project Goal

Create a delightful, easy-to-use orchestration system that:
- Makes AI coding sessions 3x more efficient through parallel agent execution
- Feels fun and engaging with medieval quest theming
- Works with any project type through flexible configuration
- Builds up knowledge over time in the "lore" system

## Key Concepts

### The Quest System
- **Quests** = Development tasks (bugs, features, etc.)
- **Quest Tracker** = JSON file managing quest backlog and progress
- **Quest Log** = Real-time markdown updates from agents
- **Lore** = Accumulated wisdom from past quests (errors, patterns, gotchas)

### The Fellowship
- **Questmaestro** - Main orchestrator that manages quests
- **Pathseeker** - Explores and maps dependencies
- **Codeweaver** - Implements services/components (can work in parallel!)
- **Lawbringer** - Reviews code quality
- **Siegemaster** - Creates integration tests
- **Spiritmender** - Fixes build errors
- **Taskweaver** - Creates quest definitions from user requests

### Ward Commands
- `ward` = Lint/typecheck a single file (protection spell)
- `ward:all` = Validate entire codebase
- Users configure these in `.questmaestro` for their project

## Project Structure

```
/src/
  /commands/        # Agent prompt templates
    questmaestro.md
    /quest/
      *.md         # Sub-agent prompts
  /templates/      # Files copied during installation
/bin/
  install.js       # NPX installation script
```

## Current State

We've recently:
- Simplified from complex task system to flexible quest system
- Replaced hardcoded commands (atomtegrity/tegrity) with configurable ward commands
- Created templates for quest tracking and lore accumulation
- Built npx installer that sets up everything

## When Working on This Project

1. **Read the README.md** - Understand the user-facing functionality
2. **Check /src/commands/questmaestro.md** - See how orchestration works
3. **Review quest agent prompts** - Understand each agent's role
4. **Test changes** - Ensure npx installation still works correctly

## Key Principles

1. **Keep it Fun** - Medieval quest theme throughout
2. **Keep it Simple** - Users just run `npx questmaestro` 
3. **Keep it Flexible** - Works with any project structure
4. **Natural Language** - No rigid command formats
5. **Parallel When Possible** - Multiple agents working simultaneously

## Common Tasks

### Adding New Features
1. Consider if it fits the quest metaphor
2. Update relevant agent prompts
3. Update installation script if needed
4. Test the full flow

### Fixing Issues
1. Check if it's a prompt issue or structural issue
2. Update terminology to stay consistent
3. Ensure backward compatibility

### Testing
```bash
# Test installation locally
node bin/install.js

# Check created structure
ls -la .claude/commands/
ls -la questmaestro/
```

## Important Notes

- We use `$ARGUMENTS` in agent prompts for Questmaestro to inject context
- The system is file-based (no databases or external services)
- Agents are "one-and-done" - they execute once and terminate
- Quest tracking happens through JSON files in the questmaestro/ folder

## Need Help?

- Check `/info/ORCHESTRATION-GUIDE.md` for system overview
- Review example quests in `/src/templates/quest-tracker.json`
- Look at lore categories in `/src/templates/lore-categories.md`

Welcome to the fellowship! May your quests be swift and your builds always green! ⚔️✨