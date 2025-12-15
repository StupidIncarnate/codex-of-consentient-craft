# @dungeonmaster/cli

Command-line interface for managing and displaying Dungeonmaster quests.

## What It Does

The CLI provides visibility into active quests - structured project tasks used within the Dungeonmaster architecture.
View quest status, current execution phase, and task completion progress directly from your terminal.

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
npx dungeonmaster <command>
```

## Commands

### `help`

Display available commands and usage information.

```bash
npx dungeonmaster help
```

### `list`

List all active quests in the current project.

```bash
npx dungeonmaster list
```

Output shows:

- Quest title
- Status: `in_progress`, `blocked`, `complete`, `abandoned`
- Current phase: `discovery`, `implementation`, `testing`, `review`
- Task progress: `X/Y` (completed/total)

## Quest Storage

Quests are stored as JSON files in `.dungeonmaster-quests/` at your project root. The CLI searches up from your current
directory to find this folder.

## Development

```bash
npm test              # Run tests
npm run lint          # Run ESLint
npm run typecheck     # Check types
npm run build         # Build package
```
