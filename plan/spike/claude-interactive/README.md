# Claude Interactive CLI Spike

## Original Goal

We're pivoting Questmaestro from a markdown-based orchestrator to a CLI command to solve these pain points:
- Can't make changes to running agents without restarting
- Sub-agents can't spawn their own sub-agents
- Can't communicate with agents while they're working
- Questmaestro performance degrades with large context

The CLI will:
- Launch Claude instances with specific roles
- Enable real-time streaming between user and agents
- Allow agents to spawn sub-agents
- Support interruption and continuation

## Spike Purpose

Test real-time bidirectional communication with Claude agents to determine:
1. Can we send input to a running Claude process?
2. How do we handle streaming while accepting user input?
3. What's the best protocol for agent-user interaction?

## Current Implementation

### Files
- `cli.js` - Interactive CLI wrapper that spawns Claude
- `agent-protocol.md` - Test agent with interaction markers
- `README.md` - This file

### How It Works

1. **CLI starts Claude** with the agent protocol
2. **Parses JSON stream** to display assistant messages
3. **Detects markers** like `<<WAITING_FOR_USER_INPUT>>`
4. **Handles user input** via readline interface
5. **Attempts two approaches**:
   - Stdin injection (experimental)
   - Kill/restart with context

### Usage

```bash
cd spike/claude-interactive
./cli.js
```

Then try:
- "Help me create a component"
- Follow the prompts
- Watch for interaction patterns

### Troubleshooting

If the CLI hangs or doesn't work:

1. **Check Claude CLI is installed**:
   ```bash
   which claude
   claude --version
   ```

2. **Run the test script**:
   ```bash
   ./test.sh
   ```

3. **Try the simple test**:
   ```bash
   ./simple-test.js
   ```

4. **Debug mode** - The CLI now shows:
   - Working directory
   - Claude path detection
   - Error messages if spawn fails

### Common Issues

- **Hangs with no output**: Claude CLI might not be in PATH
- **ENOENT error**: Claude command not found
- **No streaming**: Try adding `--verbose` flag
- **Auth issues**: Make sure you're authenticated with `claude auth`

## Final Solution: File Watcher Pattern

The working approach uses file system signals to coordinate between the CLI wrapper and interactive Claude agents:

1. **CLI spawns agent** in interactive mode (full UI experience)
2. **Agent writes signal file** when task complete using Write tool
3. **CLI monitors for file** and kills agent when detected
4. **CLI spawns next agent** in sequence automatically
5. **No manual Ctrl+C required** - fully automated flow

### Working Example

```bash
npm run spike
```

This demonstrates:
- Joke agent tells joke and writes signal file
- CLI kills joke agent automatically
- CLI spawns review agent
- Review agent completes and writes signal file
- CLI kills review agent
- Process completes successfully

### Key Implementation Details

1. **Permission Management**: 
   - Uses `.claude/settings.local.json` to allow Write tool without prompts
   - Install script now automatically configures this
   - Enables seamless agent chaining

2. **Temporary Directory**:
   - Uses project-local `spike-tmp/` directory
   - Cleaned on each run for fresh state
   - Agents write signals to `spike-tmp/[agent]-complete.txt`

3. **Agent Protocol**:
   - Agents use Write tool (not bash echo)
   - Clear completion signals
   - Interactive UI preserved throughout

### Files

- `joke-file-watcher.js` - CLI wrapper that monitors files
- `joke-file-agent.md` - Agent that writes completion signal
- `review-agent.md` - Second agent in chain

## Key Findings

### ✅ What Works
1. **Interactive Mode with File Signals** - Full Claude UI while maintaining programmatic control
2. **Automatic Agent Chaining** - Agents complete tasks and trigger next agent without manual intervention
3. **Write Tool Integration** - Agents use Claude's Write tool to create signal files
4. **Permission Configuration** - `.claude/settings.local.json` enables tool use without prompts
5. **Clean State Management** - `spike-tmp/` directory ensures fresh state each run

### ❌ What Doesn't Work
1. **Self-Exit in Interactive Mode** - Claude cannot exit itself with `Bash(exit 0)` in interactive mode
2. **Stdin Injection** - Cannot send input to running Claude process
3. **--allowedTools CLI Flag** - Doesn't work properly in interactive mode (use settings.json instead)

### 🎯 Key Pivots During Development
1. **From JSON Streaming to Interactive UI** - User wanted to see "claude terminal stuff"
2. **From Bash Echo to Write Tool** - More reliable and consistent with Claude's tooling
3. **From System /tmp to Project spike-tmp/** - Better isolation and cleanup
4. **From CLI Flags to Settings File** - More reliable permission management

### 🤔 Limitations Discovered
1. **Claude is stateless** - Each invocation is independent
2. **No pause/resume** - Can't pause execution and continue
3. **Context size** - Restarting with full context gets expensive over time
4. **Process overhead** - Each restart spawns a new process (adds ~3-5s latency)

### 📊 Performance Metrics
- Initial response: ~3-5 seconds
- Restart with context: ~3-5 seconds
- Context parsing: <100ms
- Memory usage: Grows with conversation length

## Approaches Tested

### Approach 1: Stdin Injection ❌
```javascript
claudeProcess.stdin.write(userInput + '\n');
```
**Result**: Claude ignores stdin during execution

### Approach 2: Kill & Restart ✅
```javascript
// Capture context
const context = conversationHistory.join('\n');
// Kill process
claudeProcess.kill();
// Restart with context + new input
startClaude(context + userInput);
```
**Result**: Works but loses streaming state

### Approach 3: Interactive Markers ✅
```
<<WAITING_FOR_USER_INPUT>>
What's your name?
<<END_WAITING>>
```
**Result**: Can detect when to prompt user

## Recommendations for Questmaestro CLI Implementation

### 1. **Use File Watcher Pattern**
- Most reliable approach for interactive mode
- Agents signal completion via Write tool
- CLI monitors and manages agent lifecycle
- No manual intervention required

### 2. **Permission Setup**
- Install script configures `.claude/settings.local.json`
- Allows Write tool without prompts
- Enables seamless agent chaining
- Each developer gets their own settings

### 3. **Agent Signal Protocol**
```javascript
// Agent completion signal
Write("questmaestro/signals/[agent-name]-complete.txt", "status: complete")

// Agent needs help signal  
Write("questmaestro/signals/needs-help.txt", "reason: [details]")

// Agent spawning sub-agent
Write("questmaestro/signals/spawn-[sub-agent].txt", "context: [data]")
```

### 4. **CLI Architecture**
```
questmaestro
├── clean signal directory
├── spawn agent in interactive mode
├── monitor signal files
├── on signal detection:
│   ├── COMPLETE → kill agent → spawn next
│   ├── NEEDS_HELP → kill agent → prompt user → respawn
│   └── SPAWN → note request → kill → spawn sub-agent
└── maintain quest flow throughout
```

### 5. **Agent Design Guidelines**
Each agent should:
- Use Write tool for all signals
- Create clear completion markers
- Work within interactive mode constraints
- Handle one discrete task per invocation

## Next Steps

1. **Build questmaestro CLI** using kill/restart pattern
2. **Update agent prompts** with standardized markers
3. **Implement context summarization** to manage size
4. **Create spawning protocol** for sub-agents
5. **Test with real quest scenarios**

## Alternative Considerations

### Socket-based Communication
Could build a socket server that:
- Spawns Claude with special instructions
- Claude connects to socket
- Enables true bidirectional communication
**Verdict**: Too complex for current needs

### Multiple Process Coordination
- Spawn multiple Claude instances
- Coordinate via files or IPC
- Each handles part of conversation
**Verdict**: Possible but adds complexity

## Two Modes of Operation

### 1. **Interactive Mode** (default)
- Shows full Claude UI with nice formatting
- Takes over terminal completely
- Cannot programmatically capture output
- User must manually watch for markers

### 2. **Non-Interactive Mode** (`-p` flag)
- Outputs JSON or text
- Can be parsed programmatically
- No UI, just raw responses
- Enables marker detection and interruption

## Conclusion

The spike successfully demonstrates a working pattern for the Questmaestro CLI pivot:

### Final Implementation: Interactive Mode + File Watcher
- **Full Claude UI Experience** - Users see the interactive terminal interface
- **Automatic Agent Management** - File signals enable programmatic control
- **No Manual Intervention** - Agents complete and chain automatically
- **Permission Configuration** - Settings file enables tool use without prompts
- **Clean State Management** - Temporary directories cleaned on each run

### Key Success Factors
1. **File-based signaling** works reliably across all platforms
2. **Write tool** provides consistent file creation without shell complications
3. **Settings configuration** solves the permission prompt problem
4. **Interactive mode** gives users the full Claude experience

### Ready for Production
The pattern is ready to be implemented in the full Questmaestro CLI:
- Proven agent chaining mechanism
- Reliable completion detection
- User-friendly interactive experience
- Automated flow management

This spike validates that we can build a CLI that maintains the benefits of interactive Claude while adding the automation and chaining capabilities needed for the Questmaestro workflow.