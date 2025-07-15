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
2. **Agent writes signal file** when task complete
3. **CLI monitors for file** and kills agent when detected
4. **CLI spawns next agent** in sequence

### Working Example

```bash
npm run spike:joke-file
```

This demonstrates:
- Joke agent tells joke and writes signal file
- CLI kills joke agent automatically
- CLI spawns review agent
- Review agent completes and writes signal file
- CLI kills review agent
- Process completes successfully

### Files

- `joke-file-watcher.js` - CLI wrapper that monitors files
- `joke-file-agent.md` - Agent that writes completion signal
- `review-agent.md` - Second agent in chain

## Key Findings

### ✅ What Works
1. **Streaming Output** - Can parse and display Claude's responses in real-time using JSON stream
2. **Marker Detection** - Successfully detects interaction markers (`<<WAITING_FOR_USER_INPUT>>`)
3. **Context Preservation** - Can capture conversation history and restart with full context
4. **Kill/Restart Pattern** - Claude exits after each response, we restart with accumulated context
5. **Multi-turn Conversations** - Can maintain coherent conversation across multiple restarts

### ❌ What Doesn't Work
1. **Stdin Injection** - Cannot send input to running Claude process
   - `stdin.write()` doesn't affect Claude's execution
   - Claude doesn't read from stdin during streaming
2. **True Bidirectional** - No way to have real back-and-forth without restart
3. **Keep-Alive Sessions** - Claude always exits after completing its response

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

## Recommendations for Questmaestro

### 1. **Use Kill/Restart Pattern**
- Most reliable approach
- Maintain conversation context
- Clear state management

### 2. **Design Agent Protocols**
```markdown
## Status Markers
- <<NEEDS_USER_INPUT: question>>
- <<SPAWNING_AGENT: agent-name>>
- <<TASK_COMPLETE: summary>>
- <<TASK_FAILED: reason>>
```

### 3. **Context Management**
- Keep running summary instead of full history
- Use structured context format
- Implement context windowing

### 4. **CLI Architecture**
```
questmaestro
├── spawn agent with role
├── stream output to user
├── detect interaction markers
├── on marker:
│   ├── NEEDS_INPUT → prompt user → restart with answer
│   ├── SPAWN_AGENT → launch sub-agent → merge results
│   └── COMPLETE → save state → exit
└── maintain quest state throughout
```

### 5. **Agent Design**
Each agent should:
- Output clear status markers
- Summarize progress before asking for input
- Be able to resume from context
- Complete discrete tasks

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

For the Questmaestro pivot, we have two viable approaches:

### Approach 1: Streaming Monitor (Recommended)
- Use non-interactive mode with JSON streaming
- Programmatically detect markers
- Kill and restart with context
- Full automation possible
- ~3-5 second restart overhead

### Approach 2: Interactive Wrapper
- Launch Claude in interactive mode
- User manually watches for markers
- Better UX but requires human monitoring
- Good for development/debugging

The streaming monitor approach is better for production use, while the interactive wrapper is useful for testing and development. Both support the kill/restart pattern needed for the Questmaestro CLI pivot.