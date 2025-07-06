# Quest System Examples

This directory contains example quest files showing different states and scenarios.

## Files

### File-Based Quest Management
Quests are organized by folder location:
- **active/**: Currently being worked on (alphabetical order)
- **completed/**: Successfully finished (local only, not committed)
- **abandoned/**: Stopped without completion (local only, not committed)

### Active Quest Examples

#### user-avatar-upload-20250103.json
- **Status**: In progress - implementation phase
- **Shows**: Parallel Codeweaver execution
- **Key Points**:
  - Discovery complete with 4 components identified
  - 2 components built in parallel (StorageService & ImageProcessor)
  - 1 component currently being built (AvatarUploadService)
  - 1 component queued (AvatarController - waiting on dependencies)
  - Demonstrates the `activeAgents` tracking for parallel work

#### fix-payment-timeout-20250103.json
- **Status**: Discovery complete, waiting to start implementation
- **Shows**: Bug fix quest with root cause analysis
- **Key Points**:
  - Detailed root cause findings in discovery
  - Multiple issues identified that need fixing
  - Decisions captured about approach
  - Ready for implementation phase

### Completed Quest Example

#### setup-jest-testing-20250102.json
- **Status**: Fully completed
- **Shows**: Complete quest lifecycle
- **Key Points**:
  - All phases complete (discovery → implementation → testing → review)
  - Simple linear flow (no parallel work needed)
  - Outcome recorded with success status
  - Completion timestamp and summary

## Quest Structure Highlights

### Phase Status Tracking
Each phase has its own status:
- `not_started`: Phase hasn't begun
- `in_progress`: Currently being worked on
- `complete`: Phase finished successfully
- `needs_revision`: May need to revisit (e.g., after review finds issues)

### Component Tracking
Implementation phase tracks individual components:
```json
{
  "name": "ComponentName",
  "status": "queued|in_progress|complete",
  "assignedTo": "agent-id",
  "startedAt": "timestamp",
  "completedAt": "timestamp",
  "dependencies": ["other-component"]
}
```

### Active Agents
Shows who's currently working on what:
```json
"activeAgents": [
  {
    "agent": "codeweaver-3",
    "task": "Implementing AvatarUploadService",
    "startedAt": "2025-01-03T11:15:00Z"
  }
]
```

### Activity Log
Complete audit trail of all agent actions:
- Timestamp of each action
- Which agent performed it
- What they did
- Relevant details

## Orchestration Flow

1. **Questmaestro** reads the quest file
2. Determines next action based on phase status
3. Spawns appropriate agent(s)
4. Parses agent reports
5. Updates quest file with progress
6. Repeats until quest complete

This prevents file conflicts since only Questmaestro writes to quest files!