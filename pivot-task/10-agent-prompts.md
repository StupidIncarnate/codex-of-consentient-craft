# Task 10: Agent Prompts

## Objective
Add output instructions to all agent markdown files for JSON report generation and update agent behavior for CLI operation.

## Dependencies
- Task 08: Report Parsing (for report formats)
- Existing agent markdown files

## Implementation

### 1. Output Instructions Template

**File: src/cli/templates/agent-output-instructions.md**
```markdown
## Output Instructions

When you have completed your work, write your final report as a JSON file using the Write tool.

File path: questmaestro/active/[quest-folder]/[number]-[agent-type]-report.json
Example: questmaestro/active/01-add-authentication/002-codeweaver-report.json

Use this code pattern:
```javascript
const report = {
  "status": "complete", // or "blocked" or "error"
  "blockReason": "if blocked, describe what you need",
  "agentType": "[AGENT_TYPE]",
  "taskId": "[task-id-if-applicable]",
  "report": {
    // Agent-specific structure - see examples below
  },
  "retrospectiveNotes": [
    {
      "category": "what_worked_well",
      "note": "Description of what went smoothly"
    },
    {
      "category": "challenges_encountered", 
      "note": "Any difficulties faced"
    }
  ]
};

Write("questmaestro/active/[quest-folder]/[report-filename].json", JSON.stringify(report, null, 2));
```

This signals questmaestro that you have completed your work.

## Spawning Sub-Agents

If you determine that spawning sub-agents would be more efficient, you can spawn them using the Task tool. When you have multiple independent tasks, spawn agents in parallel by using multiple Task invocations in a single message.

When spawning sub-agents:
- Give each a clear, focused task
- Provide necessary context (files, requirements, constraints)
- Collect and synthesize their results
- Include their findings in your final report

You are responsible for:
- Deciding when delegation is more efficient
- Ensuring quality of delegated work
- Compiling results into cohesive output
```

### 2. Agent Update Scripts

**File: src/cli/scripts/update-agents.ts**
```typescript
#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';

interface AgentUpdate {
  name: string;
  outputExample: string;
  removalPatterns?: RegExp[];
  additions?: string[];
}

const agentUpdates: AgentUpdate[] = [
  {
    name: 'pathseeker',
    outputExample: `### Pathseeker Report Example (Initial Discovery):
\`\`\`json
{
  "status": "complete",
  "agentType": "pathseeker",
  "report": {
    "questDetails": {
      "id": "add-user-authentication",
      "title": "Add User Authentication",
      "description": "Implement secure user authentication with JWT",
      "scope": "medium",
      "estimatedTasks": 5
    },
    "discoveryFindings": {
      "existing_code": ["src/app.ts", "src/types/index.ts"],
      "patterns_found": ["Express app with middleware pattern"],
      "related_tests": ["src/app.test.ts"],
      "dependencies": ["express", "typescript", "jest"]
    },
    "tasks": [
      {
        "name": "CreateAuthInterface",
        "type": "implementation",
        "description": "Create auth interfaces and types",
        "dependencies": [],
        "filesToCreate": ["src/types/auth.ts"],
        "filesToEdit": ["src/types/index.ts"]
      }
    ],
    "keyDecisions": [
      {
        "category": "architecture",
        "decision": "Use middleware pattern for Express integration"
      }
    ]
  }
}
\`\`\``,
    removalPatterns: [
      /## Final Output[\s\S]*?(?=##|$)/gi,
      /## Component Output[\s\S]*?(?=##|$)/gi,
      /When you're done[\s\S]*?PATHSEEKER_COMPLETE/gi,
    ],
    additions: [
      '**CRITICAL**: Output "tasks" array, not "components"',
      'Handle all user Q&A using interactive mode - no INSUFFICIENT_CONTEXT status',
      'Ask all clarifying questions before writing final report',
    ],
  },
  {
    name: 'codeweaver',
    outputExample: `### Codeweaver Report Example:
\`\`\`json
{
  "status": "complete",
  "agentType": "codeweaver",
  "taskId": "create-parser-interface",
  "report": {
    "quest": "Extract Reusable Patterns into Simple Interfaces",
    "component": "CreateParserInterface",
    "filesCreated": ["src/types/parser.ts", "src/types/parser.test.ts"],
    "filesModified": ["src/types/index.ts"],
    "implementationSummary": "Created the IParser interface...",
    "technicalDecisions": ["Placed interface in src/types/ directory"],
    "integrationPoints": ["IParser interface is exported from src/types/index.ts"]
  }
}
\`\`\``,
    removalPatterns: [
      /## Gate[\s\S]*?(?=##|$)/gi,
      /## Implementation Status[\s\S]*?(?=##|$)/gi,
    ],
    additions: [
      'Focus on implementing a single task completely',
      'Each Codeweaver instance completes one task fully',
      'Report which files were created vs modified',
    ],
  },
  {
    name: 'siegemaster',
    outputExample: `### Siegemaster Report Example:
\`\`\`json
{
  "status": "complete",
  "agentType": "siegemaster",
  "report": {
    "testCoverage": {
      "overall": 75,
      "byFile": {
        "src/auth/auth-service.ts": 80,
        "src/auth/auth-middleware.ts": 70
      }
    },
    "gaps": [
      {
        "file": "src/auth/auth-service.ts",
        "description": "Missing test for token refresh logic",
        "priority": "high"
      }
    ],
    "recommendations": ["Add integration tests for auth flow"],
    "existingTests": ["src/auth/auth-service.test.ts"]
  }
}
\`\`\``,
    removalPatterns: [
      /## Four-Gate System[\s\S]*?(?=##|$)/gi,
      /\[GATE \d+\][\s\S]*?(?=\[GATE|\[FINAL|##|$)/gi,
    ],
    additions: [
      'Focus on gap identification, not implementation',
      'Just analyze and report gaps',
    ],
  },
  {
    name: 'lawbringer',
    outputExample: `### Lawbringer Report Example:
\`\`\`json
{
  "status": "complete",
  "agentType": "lawbringer",
  "report": {
    "standardsReview": {
      "passed": false,
      "score": 85
    },
    "violations": [
      {
        "file": "src/auth/auth-service.ts",
        "line": 45,
        "rule": "no-any",
        "severity": "error",
        "message": "Unexpected any type"
      }
    ],
    "fixes": [
      {
        "file": "src/auth/auth-service.ts",
        "description": "Fixed TypeScript any types"
      }
    ],
    "wardResults": {
      "lint": "passed",
      "typecheck": "failed",
      "test": "passed"
    }
  }
}
\`\`\``,
    removalPatterns: [
      /## Review Categories[\s\S]*?(?=##|$)/gi,
    ],
    additions: [
      'Run ward:all command and check standards',
      'Fix any issues found',
    ],
  },
  {
    name: 'spiritmender',
    outputExample: `### Spiritmender Report Example:
\`\`\`json
{
  "status": "complete",
  "agentType": "spiritmender",
  "report": {
    "errors": [
      {
        "type": "typecheck",
        "file": "src/auth/auth-service.ts",
        "message": "Property 'userId' does not exist on type 'User'"
      }
    ],
    "fixes": [
      {
        "file": "src/auth/auth-service.ts",
        "description": "Added userId property to User interface",
        "changes": "Added missing property definition"
      }
    ],
    "remainingIssues": [],
    "wardResults": {
      "all": "passed"
    }
  }
}
\`\`\``,
    removalPatterns: [
      /## Gate System[\s\S]*?(?=##|$)/gi,
    ],
    additions: [
      'Fix errors systematically in priority order',
      'Verify fixes with ward validation',
    ],
  },
  {
    name: 'voidpoker',
    outputExample: `### Voidpoker Report Example:
\`\`\`json
{
  "status": "complete",
  "agentType": "voidpoker",
  "report": {
    "projectAnalysis": {
      "type": "monorepo",
      "packages": ["core", "web", "api"],
      "buildSystem": "npm workspaces",
      "testFramework": "jest"
    },
    "recommendations": {
      "wardCommands": {
        "all": "npm run lint && npm run typecheck && npm run test"
      },
      "structure": ["Add CLAUDE.md to each package"]
    }
  }
}
\`\`\``,
    additions: [
      'Write to questmaestro/discovery/ not active quest folder',
      'Output filename should include timestamp and package name',
    ],
  },
];

async function updateAgentFile(agentPath: string, update: AgentUpdate): Promise<void> {
  console.log(`Updating ${update.name}...`);
  
  try {
    let content = await fs.readFile(agentPath, 'utf-8');
    
    // Remove old patterns
    if (update.removalPatterns) {
      for (const pattern of update.removalPatterns) {
        content = content.replace(pattern, '');
      }
    }
    
    // Add output instructions
    const outputInstructions = await fs.readFile(
      path.join(__dirname, '../templates/agent-output-instructions.md'),
      'utf-8'
    );
    
    // Replace [AGENT_TYPE] placeholder
    const customInstructions = outputInstructions.replace(/\[AGENT_TYPE\]/g, update.name);
    
    // Add agent-specific additions
    let finalInstructions = customInstructions + '\n\n' + update.outputExample;
    
    if (update.additions && update.additions.length > 0) {
      finalInstructions += '\n\n### Important Notes:\n';
      finalInstructions += update.additions.map(a => `- ${a}`).join('\n');
    }
    
    // Append to file
    content = content.trimEnd() + '\n\n' + finalInstructions + '\n';
    
    // Write back
    await fs.writeFile(agentPath, content);
    console.log(`✓ Updated ${update.name}`);
    
  } catch (error) {
    console.error(`✗ Failed to update ${update.name}: ${error.message}`);
  }
}

async function main() {
  const agentDirs = [
    path.join(process.cwd(), 'agents'),
    path.join(process.cwd(), 'src', 'agents'),
  ];
  
  for (const dir of agentDirs) {
    try {
      const files = await fs.readdir(dir);
      
      for (const update of agentUpdates) {
        const agentFile = `${update.name}.md`;
        if (files.includes(agentFile)) {
          await updateAgentFile(path.join(dir, agentFile), update);
        }
      }
      
      break; // Found agent directory
    } catch {
      // Try next directory
    }
  }
  
  console.log('\nAgent updates complete!');
  console.log('Please review the changes and test agent functionality.');
}

main().catch(console.error);
```

### 3. Agent Behavior Updates

**File: src/cli/docs/agent-behavior-updates.md**
```markdown
# Agent Behavior Updates for CLI

## Overview

All agents need updates to work with the Questmaestro CLI system. The primary changes are:

1. **JSON Output**: Agents must write JSON reports instead of text
2. **File-Based Communication**: No more web sockets or progress files
3. **Simplified Focus**: Remove complex gate systems, focus on core purpose
4. **Sub-Agent Spawning**: Agents can spawn other agents for efficiency

## Common Changes for All Agents

### 1. Remove These Patterns
- Text-based final reports (e.g., "=== AGENT REPORT ===")
- Progress file writing
- Complex gate systems
- TODO tracking (not needed for single-purpose runs)
- Human-readable displays (Questmaestro handles display)

### 2. Add These Patterns
- JSON report writing at completion
- Retrospective notes in reports
- Support for blocked state
- Recovery mode handling
- Sub-agent spawning capability

### 3. Output Structure
```javascript
const report = {
  "status": "complete", // Required: complete|blocked|error
  "blockReason": "...", // Required if blocked
  "agentType": "agentname", // Required
  "taskId": "task-id", // Optional, for task-specific agents
  "report": { ... }, // Required: agent-specific data
  "retrospectiveNotes": [ // Optional but recommended
    {
      "category": "category_name",
      "note": "Description"
    }
  ]
};
```

## Agent-Specific Updates

### Pathseeker
- **CRITICAL**: Output "tasks" array, not "components"
- Remove INSUFFICIENT_CONTEXT status
- Handle all Q&A internally before writing report
- Support three modes: creation, validation, dependency_repair

### Codeweaver
- Focus on single task completion
- Remove component batching
- Report created vs modified files
- Each instance handles one task fully

### Siegemaster
- Remove 4-gate system
- Focus only on gap identification
- Don't implement fixes
- Report test coverage metrics

### Lawbringer
- Remove complex review categories
- Run ward:all and check standards
- Fix issues found
- Report violations and fixes

### Spiritmender
- Remove gate system
- Fix errors in priority order
- Verify with ward after fixes
- Report what was fixed

### Voidpoker
- Write to questmaestro/discovery/ folder
- Include timestamp in filename
- Support project analysis mode
- Can run outside quest context

## Testing Updates

After updating agents:

1. Test JSON output format
2. Verify report validation passes
3. Test blocked state handling
4. Test recovery mode
5. Test sub-agent spawning

## Migration Checklist

For each agent:
- [ ] Remove old output patterns
- [ ] Add JSON output instructions
- [ ] Update report structure
- [ ] Remove progress tracking
- [ ] Simplify to core purpose
- [ ] Add retrospective notes
- [ ] Test with CLI
```

## Unit Tests

**File: src/cli/scripts/update-agents.test.ts**
```typescript
import * as fs from 'fs/promises';
import { updateAgentFile } from './update-agents';

jest.mock('fs/promises');

describe('UpdateAgents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add output instructions to agent file', async () => {
    const mockContent = `# Pathseeker Agent

## Purpose
Discovery agent

## Final Output
Old output format
PATHSEEKER_COMPLETE`;

    (fs.readFile as jest.Mock)
      .mockResolvedValueOnce(mockContent) // Agent file
      .mockResolvedValueOnce('Output instructions template'); // Template
    
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await updateAgentFile('pathseeker.md', {
      name: 'pathseeker',
      outputExample: 'Example JSON',
      removalPatterns: [/## Final Output[\s\S]*?PATHSEEKER_COMPLETE/gi],
    });

    const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
    const newContent = writeCall[1];

    expect(newContent).not.toContain('Old output format');
    expect(newContent).not.toContain('PATHSEEKER_COMPLETE');
    expect(newContent).toContain('Output instructions template');
    expect(newContent).toContain('Example JSON');
  });

  it('should replace agent type placeholder', async () => {
    (fs.readFile as jest.Mock)
      .mockResolvedValueOnce('Agent content')
      .mockResolvedValueOnce('agentType: "[AGENT_TYPE]"');
    
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await updateAgentFile('codeweaver.md', {
      name: 'codeweaver',
      outputExample: '',
    });

    const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
    const newContent = writeCall[1];

    expect(newContent).toContain('agentType: "codeweaver"');
    expect(newContent).not.toContain('[AGENT_TYPE]');
  });

  it('should add agent-specific notes', async () => {
    (fs.readFile as jest.Mock)
      .mockResolvedValueOnce('Agent content')
      .mockResolvedValueOnce('Template');
    
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await updateAgentFile('pathseeker.md', {
      name: 'pathseeker',
      outputExample: '',
      additions: [
        'Output tasks array',
        'No INSUFFICIENT_CONTEXT',
      ],
    });

    const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
    const newContent = writeCall[1];

    expect(newContent).toContain('Output tasks array');
    expect(newContent).toContain('No INSUFFICIENT_CONTEXT');
  });
});
```

## Validation Criteria

1. **Output Instructions**
   - [ ] Added to all agent files
   - [ ] Includes JSON format examples
   - [ ] Agent type correctly replaced
   - [ ] Retrospective notes explained

2. **Pattern Removal**
   - [ ] Old output formats removed
   - [ ] Gate systems removed
   - [ ] Progress tracking removed
   - [ ] TODO systems removed

3. **Agent-Specific Updates**
   - [ ] Pathseeker outputs tasks array
   - [ ] Codeweaver handles single tasks
   - [ ] Siegemaster only identifies gaps
   - [ ] Lawbringer runs ward validation
   - [ ] Spiritmender fixes systematically

4. **Sub-Agent Spawning**
   - [ ] Instructions included
   - [ ] Examples provided
   - [ ] Responsibility clarified

5. **Testing**
   - [ ] Update script works
   - [ ] Agents produce valid JSON
   - [ ] Reports pass validation
   - [ ] CLI can parse outputs

## Next Steps

After completing this task:
1. Run the update script on agent files
2. Review changes to each agent
3. Test agent output with sample runs
4. Verify JSON report generation
5. Proceed to [11-pathseeker-updates.md](11-pathseeker-updates.md)