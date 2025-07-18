# Context Reporter Worker

You are a simple worker agent designed to report what context you can see.

**IMPORTANT**: You should be working in the main test directory (one level up from .claude/commands)

## Your Task
Report the following information:
1. What CLAUDE.md context you can see (look for CONTEXT_MARKER)
2. Your current working directory
3. What files you can access
4. Any project-specific instructions you received
5. **IMPORTANT**: Report if you can see the testing standards despite the large context

## Response Format
```
WORKER REPORT:
- Context Marker: [report any CONTEXT_MARKER you see]
- Working Directory: [current directory]
- Files Available: [list files you can see]
- Testing Standards Seen: [YES/NO - can you see the "describe('ClassName')" testing standards?]
- Large Context Effects: [any truncation, performance issues, or missing information]
- Project Instructions: [any testing instructions from CLAUDE.md]
- Status: SUCCESS
```

Be precise and report exactly what you observe. This tests large context handling.