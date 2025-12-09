# Dungeonmaster CLI Installation & Usage Guide

## Installation

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn
- Claude CLI installed and configured

### Install from Source

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dungeonmaster.git
cd dungeonmaster
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Link the CLI globally (for development):
```bash
npm link
```

Now you can use `dungeonmaster` from anywhere on your system.

### Install from npm (when published)
```bash
npm install -g dungeonmaster
```

## Usage

### First Run

When you first run Dungeonmaster in a project, it will:

1. Create a `.dungeonmaster` config file
2. Run project discovery with Voidpoker to analyze your codebase
3. Create the `dungeonmaster/` directory structure

```bash
# In your project directory
dungeonmaster
```

### Basic Commands

#### Create a New Quest
```bash
dungeonmaster "add user authentication"
dungeonmaster "fix login timeout bug"
dungeonmaster "refactor database module"
```

#### List All Quests
```bash
dungeonmaster list
```

#### Resume Active Quest
```bash
# Resumes the first active quest
dungeonmaster
```

#### Start Specific Quest
```bash
dungeonmaster start "quest-name"
dungeonmaster start 001-add-auth  # Using quest folder name
```

#### Abandon Current Quest
```bash
dungeonmaster abandon
```

#### Clean Old Quests
```bash
dungeonmaster clean
```

## How It Works

1. **Quest Creation**: When you provide a task description, Dungeonmaster creates a quest and spawns Pathseeker to plan
   the implementation.

2. **Agent Orchestration**: The system sequentially spawns specialized Claude instances:
   - **Pathseeker**: Analyzes requirements and creates implementation tasks
   - **Codeweaver**: Implements each task
   - **Siegemaster**: Analyzes test coverage gaps
   - **Lawbringer**: Reviews code quality
   - **Spiritmender**: Fixes any errors that occur

3. **Progress Tracking**: Visual progress indicators show agent activity

4. **Ward Validation**: After each code change, the system runs:
   ```bash
   npm run ward:all  # Configured as: npm run lint && npm run typecheck && npm run test
   ```

5. **Quest Completion**: When all phases complete, a retrospective is generated and saved.

## Configuration

The `.dungeonmaster` config file supports:

```json
{
  "questFolder": "dungeonmaster",
  "discoveryComplete": false,
  "wardCommands": {
    "all": "npm run lint && npm run typecheck && npm run test",
    "file": "eslint $FILE --fix"
  }
}
```

## Directory Structure

```
your-project/
├── .dungeonmaster                    # Config file
├── dungeonmaster/                    # Quest data
│   ├── active/                      # In-progress quests
│   │   └── 001-add-auth/           # Quest folder
│   │       ├── quest.json          # Quest metadata
│   │       └── *-report.json       # Agent reports
│   ├── completed/                   # Finished quests
│   ├── abandoned/                   # Stopped quests
│   ├── retros/                      # Quest retrospectives
│   │   └── YYYY-MM-DD-*.md        # Markdown summaries
│   └── discovery/                   # Project analysis
│       └── voidpoker-*.json        # Discovery reports
```

## Troubleshooting

### "No .dungeonmaster config found"

The CLI now auto-creates the config on first run. Just run `dungeonmaster` again.

### "Ward validation failed"
Ensure your project has the required scripts in package.json:
```json
{
  "scripts": {
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  }
}
```

### Agent Gets Blocked
When an agent needs clarification, you'll be prompted to provide guidance.

### Quest Becomes Stale
If you resume a quest after significant codebase changes, you'll be warned and can choose to continue or create a fresh quest.

## Development

### Run Tests
```bash
npm test
```

### Run Linter
```bash
npm run lint
```

### Type Check
```bash
npm run typecheck
```

### Full Validation
```bash
npm run ward:all
```

## Tips

1. **Keep quests focused**: One feature or bug fix per quest
2. **Provide clear descriptions**: The better the description, the better the plan
3. **Trust the process**: Let agents complete their phases
4. **Review retrospectives**: Learn from each quest's insights

## Next Steps

1. Create your first quest: `dungeonmaster "your task description"`
2. Watch the agents work their magic
3. Review the generated code and retrospective
4. Iterate and improve!