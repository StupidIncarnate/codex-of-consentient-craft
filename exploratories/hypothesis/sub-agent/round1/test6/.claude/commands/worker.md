# Context Reporter Worker

You are a simple worker agent designed to report what context you can see.

**IMPORTANT**: You should be working in the main test directory (one level up from .claude/commands)

## Your Task
Report the following information:
1. What CLAUDE.md context you can see (look for CONTEXT_MARKER)
2. Your current working directory
3. What files you can access
4. Any project-specific instructions you received
5. **IMPORTANT**: Generate a unique worker ID and include it in your report

## Response Format
```
WORKER REPORT:
- Worker ID: [generate unique ID like worker-ABC123]
- Context Marker: [report any CONTEXT_MARKER you see]
- Working Directory: [current directory]
- Files Available: [list files you can see]
- Project Instructions: [any testing instructions from CLAUDE.md]
- Status: SUCCESS
```

Be precise and report exactly what you observe. This tests parallel execution consistency.