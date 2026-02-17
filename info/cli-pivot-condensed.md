# Dungeonmaster CLI Pivot Plan

## Final Consolidated Plan: Dungeonmaster CLI Implementation

### Quest Flow Order (Sequential)
```
1. Voidpoker (if discoveryComplete=false)
2. Pathseeker (does all task exploratory and handles back and forth Q&A with user before completing)
3. Codeweaver (repeats for each file chunk)
4. Siegemaster (test gap analysis)  
5. Lawbringer (standards review)
6. Spiritmender (inserted anywhere if ward fails)
```

### Core Architecture

#### **File-Based Communication**
```
dungeonmaster/
├── discovery/                        # Voidpoker discovery reports (not quest-specific)
│   ├── voidpoker-2024-03-15T10-00-00-000Z-core-report.json
│   ├── voidpoker-2024-03-15T10-05-00-000Z-web-report.json
│   └── voidpoker-2024-03-15T10-10-00-000Z-api-report.json
├── active/                           # Currently active quest folders
│   ├── 01-add-authentication/
│   │   ├── quest.json               # Quest state managed by dungeonmaster
│   │   ├── 001-pathseeker-report.json         # Initial discovery
│   │   ├── 002-codeweaver-report.json         # First implementation task
│   │   ├── 003-codeweaver-report.json         # Recovery/retry of task
│   │   ├── 004-codeweaver-report.json         # Second implementation task
│   │   ├── 005-pathseeker-report.json         # Resume validation
│   │   ├── 006-codeweaver-report.json         # New prerequisite task
│   │   ├── 007-codeweaver-report.json         # Continue original task
│   │   ├── 008-siegemaster-report.json         # Test gap analysis
│   │   └── 009-lawbringer-report.json         # Standards review
│   └── 02-refactor-parser/
│       ├── quest.json
│       ├── 001-pathseeker-report.json
│       ├── 002-codeweaver-report.json
│       └── 003-codeweaver-report.json         # Recovery/retry
├── completed/                        # Finished quest folders (moved wholesale)
│   └── implement-logging/
│       ├── quest.json
│       └── [all reports]
├── abandoned/                        # Stopped quest folders
│   └── experimental-feature/
│       ├── quest.json
│       └── [partial reports]
├── retros/                          # Quest retrospectives
│   └── 20240315-add-authentication.md
└── lore/                            # Accumulated wisdom and gotchas
    ├── architecture-middleware-pattern.md
    ├── integration-redis-setup.md
    └── discovery-monorepo-detection.md
```

### Key Points (Not Changing)
1. **Sequential only** - One agent at a time
2. **Ward gates** - After each agent except Pathseeker/Voidpoker
3. **Pathseeker handles all Q&A** - No back-and-forth with dungeonmaster
4. **File-based work** - Pathseeker outputs files, not components
5. **Agent continuity** - Blocked agents spawn continuations
6. **Auto-discovery** - Voidpoker runs if project not discovered
7. **Simple string matching** - No AI needed for commands/quest names
8. **Full reports to files** - All agents write complete reports
9. **Quest folders** - Each quest is a folder with quest.json and all agent reports
10. **Clean command** - Removes old completed/abandoned quest folders
11. **Wholesale moves** - Complete quests move entire folder to completed/
12. **Agent numbering** - Sequential numbers with sub-instances for recovery

### Additional Implementation Notes

#### Dungeonmaster Quest Management

2. **Dungeonmaster reconciliation**:
   - Parse Pathseeker's report
   - Add new tasks to task list
   - Update dependencies on existing tasks
   - Mark obsolete tasks as "skipped" (but keep for history)
   - Recompute execution plan

3. **Edge cases handled**:
   - Circular dependencies detected and rejected
   - Can't modify completed tasks (only add dependencies to queued ones)
   - Task ordering preserved through dependency chain

#### Agent Workflow Retooling

**Philosophy**: Agents become simpler, focused tools that do one job well and communicate via JSON files.

**Major Simplifications Needed**:
1. **Remove complex gate systems** - Agents should focus on their core job
2. **Remove text report formatting** - Direct JSON output only  
3. **Simplify output** - One clear JSON report at the end
4. **Remove human-readable displays** - Dungeonmaster handles all display
5. **Remove TODO tracking** - Not needed for single-purpose runs
6. **Remove progress tracking** - Code files are the progress
7. **Focus on core purpose**:
   - Pathseeker: Discover and plan tasks
   - Codeweaver: Implement a specific task
   - Siegemaster: Find test gaps
   - Lawbringer: Enforce standards
   - Spiritmender: Fix errors

