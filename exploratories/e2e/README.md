# E2E Tests for Questmaestro

These tests verify the full integration with Claude's slash command system.

## Requirements

1. **Claude CLI** must be installed and configured:
   ```bash
   # Install Claude CLI
   npm install -g @anthropic-ai/claude-code
   
   # Configure with your API key
   claude auth login
   ```

2. **Environment Setup**:
   - Claude CLI must be in your PATH
   - You must be authenticated with Claude

## Running E2E Tests

```bash
# Run only E2E tests
npm run test:e2e

# Run all tests including E2E
npm run test:all
```

## Test Scenarios

1. **Basic Quest Flow** - Creates and manages quests
2. **Parallel Agent Execution** - Tests multiple Codeweavers running simultaneously
3. **Monorepo Support** - Verifies quest commands work in monorepo setups
4. **Quest Abandonment** - Tests the abandon flow

## Troubleshooting

If tests hang at "Executing: /questmaestro":
- Check that `claude --version` works in your terminal
- Ensure you're logged in with `claude auth status`
- Try running a simple command: `claude -p "Hello" --output-format stream-json --verbose`

## Notes

- E2E tests use real Claude commands, so they may be slow
- Each test creates isolated project environments
- Tests are skipped in CI unless Claude CLI is configured