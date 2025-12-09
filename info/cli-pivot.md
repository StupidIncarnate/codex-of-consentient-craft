# Dungeonmaster CLI Pivot Plan

## Final Consolidated Plan: Dungeonmaster CLI Implementation

### Quest Flow Order (Sequential)
```
1. Voidpoker (if discoveryComplete=false)
2. Pathseeker (does all task exploratory and handles back and forth Q&A with user before completing)
3. Codeweaver (repeats for each file chunk)
4. Siegemaster (test gap analysis)  
5. Lawbringer (standards review)
6. Spiritmender (inserted anywhere if ward:all fails)
```

### Core Architecture

#### 1. **File-Based Communication**
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

#### 2. **Agent Prompt Updates**
All agents need to add at the end:
````markdown
## Output Instructions
When you have completed your work, write your final report as a JSON file using the Write tool.

File path: dungeonmaster/active/[quest-folder]/[number]-[agent-type]-report.json
Example: dungeonmaster/active/01-add-authentication/002-codeweaver-report.json

Use this code pattern:
```javascript
const report = {
  "status": "complete", // or "blocked" or "error"
  "blockReason": "if blocked, describe what you need",
  "agentType": "pathseeker|codeweaver|siegemaster|lawbringer|spiritmender",
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

Write("dungeonmaster/active/[quest-folder]/[report-filename].json", JSON.stringify(report, null, 2));
```

This signals dungeonmaster that you have completed your work.

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
````

**Pathseeker Special Update**: 
- Handle all user Q&A using interactive mode
- No more INSUFFICIENT_CONTEXT status
- Ask all clarifying questions before writing final report

**Agent Report Numbering**: Simple sequential numbering
- Reports use format: `{number}-{agent-type}-report.json`
- Numbers increment for each agent spawn (001, 002, 003...)
- Examples: 
  - `001-pathseeker-report.json` (initial discovery)
  - `002-codeweaver-report.json` (first task)
  - `003-codeweaver-report.json` (retry of same task)
  - `004-pathseeker-report.json` (resume validation)
  - `005-codeweaver-report.json` (new prerequisite task)

**Quest.json Tracking**: All task relationships tracked in quest.json
- Which agent worked on which task
- Task dependencies and execution order
- Current status of each task
- Recovery information if agent failed

**Lore Writing**:
Agents can write to `dungeonmaster/lore/` when they discover:
- Architectural patterns
- Integration gotchas
- Technical insights
- Best practices

Filename format: `[category]-[description].md`
Example: `architecture-middleware-pattern.md`

**Agent-Specific Report Formats**:

Pathseeker (Initial Discovery):
```json
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
      "existing_code": [
        "src/app.ts",
        "src/types/index.ts"
      ],
      "patterns_found": [
        "Express app with middleware pattern",
        "TypeScript interfaces in types directory"
      ],
      "related_tests": [
        "src/app.test.ts"
      ],
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
      },
      {
        "name": "CreateAuthService",
        "type": "implementation",
        "description": "Create authentication service with JWT handling",
        "dependencies": ["CreateAuthInterface"],
        "filesToCreate": [
          "src/auth/auth-service.ts",
          "src/auth/auth-service.test.ts"
        ],
        "filesToEdit": []
      },
      {
        "name": "CreateAuthMiddleware",
        "type": "implementation",
        "description": "Create Express middleware for route protection",
        "dependencies": ["CreateAuthService"],
        "filesToCreate": [
          "src/auth/auth-middleware.ts",
          "src/auth/auth-middleware.test.ts"
        ],
        "filesToEdit": []
      },
      {
        "name": "IntegrateAuth",
        "type": "implementation",
        "description": "Wire auth middleware into Express app",
        "dependencies": ["CreateAuthMiddleware"],
        "filesToCreate": [],
        "filesToEdit": ["src/app.ts"]
      },
      {
        "name": "VerifyIntegration",
        "type": "testing",
        "description": "Verify auth works end-to-end",
        "testTechnology": "supertest",
        "dependencies": ["IntegrateAuth"],
        "filesToCreate": ["src/integration/auth.test.ts"],
        "filesToEdit": []
      }
    ],
    "keyDecisions": [
      {
        "category": "architecture",
        "decision": "Use middleware pattern for Express integration"
      },
      {
        "category": "testing_approach",
        "decision": "Unit tests for each module, integration test for e2e flow"
      },
      {
        "category": "auth_storage",
        "decision": "JWT in Authorization header, refresh tokens in Redis"
      },
      {
        "category": "security",
        "decision": "Bcrypt with 10 rounds for password hashing"
      },
      {
        "category": "access_control",
        "decision": "Implement role-based access control (RBAC)"
      },
      {
        "category": "error_handling",
        "decision": "Return generic auth errors to prevent user enumeration"
      }
    ]
  },
  "retrospectiveNotes": [
    {
      "category": "security_consideration",
      "note": "Consider rate limiting for auth endpoints"
    },
    {
      "category": "future_enhancement",
      "note": "Add OAuth2 support for third-party auth providers"
    }
  ]
}
```

Pathseeker (Resume Validation/Extension):
```json
{
  "status": "complete",
  "agentType": "pathseeker",
  "report": {
    "validationResult": "EXTEND",  // CONTINUE, EXTEND, or REPLAN
    "currentTasksReview": {
      "create-auth-interface": { "status": "complete", "stillValid": true },
      "create-auth-service": { "status": "complete", "stillValid": true },
      "integrate-auth": { "status": "queued", "stillValid": true, "needsNewDependencies": ["add-rate-limiting"] },
      "verify-integration": { "status": "queued", "stillValid": true }
    },
    "newTasks": [
      {
        "name": "add-rate-limiting", 
        "type": "implementation",
        "description": "Add rate limiting to auth endpoints",
        "dependencies": ["create-auth-service"],
        "runBefore": ["integrate-auth"],
        "filesToCreate": ["src/auth/rate-limiter.ts"],
        "filesToEdit": ["src/auth/auth-middleware.ts"]
      }
    ],
    "modifiedDependencies": {
      "integrate-auth": { "addDependencies": ["add-rate-limiting"] }
    },
    "obsoleteTasks": [],  // Any tasks that should be skipped
    "keyDecisions": [
      { "category": "architecture", "decision": "Use Redis for rate limit tracking" }
    ]
  },
  "retrospectiveNotes": [
    { "category": "evolution", "note": "Quest evolved to include rate limiting after security review" }
  ]
}
```

Codeweaver:
```json
{
  "status": "complete",
  "agentType": "codeweaver",
  "taskId": "create-parser-interface",
  "report": {
    "quest": "Extract Reusable Patterns into Simple Interfaces",
    "component": "CreateParserInterface",
    "filesCreated": [
      "src/types/parser.ts",
      "src/types/parser.test.ts"
    ],
    "filesModified": [
      "src/types/index.ts"
    ],
    "implementationSummary": "Created the IParser interface that defines the contract for all parsers in the Assayer project. The interface includes two core methods: parse() for file-based parsing and parseSourceCode() for string-based parsing. Both methods return arrays of FunctionMetadata objects.",
    "technicalDecisions": [
      "Placed interface in src/types/ directory following existing pattern with metadata.ts",
      "Made fileName parameter optional in parseSourceCode() for flexibility",
      "Used FunctionMetadata as return type to maintain consistency with existing code",
      "Added comprehensive JSDoc documentation for clear API understanding",
      "Created index.ts for centralized type exports"
    ],
    "integrationPoints": [
      "IParser interface is exported from src/types/index.ts alongside FunctionMetadata",
      "SimpleFunctionParser already conforms to this interface without modifications",
      "Interface allows for future parser implementations (e.g., ClassParser, ComponentParser)",
      "Provides type safety for components that need to work with any parser"
    ]
  },
  "retrospectiveNotes": [
    {
      "category": "what_worked_well",
      "note": "The existing SimpleFunctionParser already had the exact methods needed for the interface, making this a clean extraction"
    },
    {
      "category": "challenges_encountered",
      "note": "None - the interface extraction was straightforward due to good existing design"
    },
    {
      "category": "lessons_for_future",
      "note": "The clear separation of concerns in the existing code made this refactoring simple. Future interfaces should follow this same pattern of minimal, focused contracts"
    }
  ]
}
```

#### 3. **CLI Commands** (from dungeonmaster.md)
```javascript
// Command detection without AI
const COMMANDS = {
  'list': showQuestList,
  'abandon': abandonCurrentQuest,
  'reorder': reorderQuests,
  'start': (args) => startSpecificQuest(args),
  'clean': cleanOldQuests,
  default: (args) => handleQuestOrCreate(args)
};

// Simple string matching for quest names
function findQuest(input) {
  const quests = loadActiveQuests();
  const lower = input.toLowerCase();
  
  // Try exact match first
  const exact = quests.find(q => 
    q.title.toLowerCase() === lower || 
    q.id === lower
  );
  if (exact) return exact;
  
  // Try substring match
  const matches = quests.filter(q => 
    q.title.toLowerCase().includes(lower)
  );
  
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    // Ask user to pick
    return askUserToChoose(matches);
  }
  
  return null; // New quest
}
```

#### 4. **Main Flow**
```javascript
async function main() {
  // 1. Auto-launch Voidpoker if needed
  await checkProjectDiscovery();
  
  // 2. Parse command
  const input = process.argv.slice(2).join(' ');
  const command = detectCommand(input);
  
  // 3. Execute command
  await COMMANDS[command.type](command.args);
}

async function handleQuestOrCreate(input) {
  // Try to find existing quest
  const existingQuest = findQuest(input);
  
  if (existingQuest) {
    // Resume existing quest
    await runQuest(existingQuest);
  } else {
    // Create new quest
    const questTitle = input;
    const questId = generateQuestId();
    const quest = createQuest(questTitle, questId);
    
    // Start with Pathseeker
    await runQuest(quest);
  }
}

async function cleanOldQuests(args) {
  let count = { completed: 0, abandoned: 0 };
  
  // Clean completed quest folders
  const completedDirs = fs.readdirSync('dungeonmaster/completed');
  completedDirs.forEach(dir => {
    fs.rmSync(`dungeonmaster/completed/${dir}`, { recursive: true });
    count.completed++;
  });
  
  // Clean abandoned quest folders
  const abandonedDirs = fs.readdirSync('dungeonmaster/abandoned');
  abandonedDirs.forEach(dir => {
    fs.rmSync(`dungeonmaster/abandoned/${dir}`, { recursive: true });
    count.abandoned++;
  });
  
  console.log(`🧹 Cleaned: ${count.completed} completed quests, ${count.abandoned} abandoned quests`);
}

async function checkProjectDiscovery() {
  const config = loadConfig('.dungeonmaster');
  
  if (!config.discoveryComplete) {
    console.log('🔍 PROJECT DISCOVERY REQUIRED 🔍');
    
    // Get user input
    const standards = await getUserInput(
      'Any specific directories with standards? (or "none"):'
    );
    
    // Find all package.json files
    const packages = findPackageJsons();
    
    // Sequential Voidpoker spawning - special case, no quest active
    for (const pkg of packages) {
      // Voidpoker outputs to dungeonmaster/discovery/ not active quest folder
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = `dungeonmaster/discovery/voidpoker-${timestamp}-${path.basename(pkg.dir)}-report.json`;
      
      await spawnAndWait('voidpoker', {
        discoveryType: 'Project Analysis',
        packageLocation: pkg.dir,
        userStandards: standards,
        reportPath: reportPath  // Tell Voidpoker where to write
      });
    }
    
    // Verify Voidpoker actually did its job
    console.log('[🔍] Verifying project setup...');
    const packages = findPackageJsons();
    let allGood = true;
    
    for (const pkg of packages) {
      const packageJson = JSON.parse(fs.readFileSync(pkg.path, 'utf8'));
      const scripts = packageJson.scripts || {};
      
      // Check ward commands
      if (!scripts['ward:all'] && !scripts.ward && !scripts.lint && !scripts.typecheck) {
        console.error(`❌ No ward commands found in ${pkg.path}`);
        console.error('   Please add lint/typecheck scripts or re-run discovery');
        allGood = false;
      }
      
      // Check CLAUDE.md
      const claudeMdPath = path.join(path.dirname(pkg.path), 'CLAUDE.md');
      if (!fs.existsSync(claudeMdPath)) {
        console.error(`❌ No CLAUDE.md found at ${claudeMdPath}`);
        allGood = false;
      }
    }
    
    if (!allGood) {
      console.error('\n⚠️  Project setup incomplete. Dungeonmaster may not function properly.');
      console.error('Consider running: dungeonmaster voidpoker');
    }
    
    config.discoveryComplete = true;
    saveConfig(config);
  }
}
```

#### 5. **Quest Execution**
```javascript
async function runQuest(quest) {
  // 1. Check if quest is blocked
  if (quest.status === 'blocked') {
    console.log(`Quest "${quest.title}" is blocked: ${quest.blockReason}`);
    const resume = await getUserInput('Resume quest? (y/n): ');
    if (resume.toLowerCase() !== 'y') {
      return;
    }
    quest.status = 'in_progress';
    saveQuest(quest);
  }
  
  // 2. Validate freshness if old
  if (quest.createdAt < SESSION_START) {
    await validateQuestFreshness(quest);
  }
  
  // 3. Sequential phase execution
  while (!quest.isComplete()) {
    const phase = getCurrentPhase(quest);
    
    switch (phase) {
      case 'discovery':
        await runPathseeker(quest);
        break;
        
      case 'implementation':
        await runCodeweavers(quest);
        break;
        
      case 'testing':
        await runSiegemaster(quest);
        break;
        
      case 'review':
        await runLawbringer(quest);
        break;
    }
    
    // 4. Update quest state
    quest = updateQuestState(quest);
  }
  
  // 5. Complete quest
  await completeQuest(quest);
}

function getCurrentPhase(quest) {
  // Check if blocked
  if (quest.status === 'blocked') {
    return 'blocked';
  }
  
  // Discovery phase - need task list
  if (!quest.tasks || quest.tasks.length === 0) {
    return 'discovery';
  }
  
  // Implementation phase - work through tasks
  const implTasks = quest.tasks.filter(t => t.type === 'implementation');
  const implComplete = implTasks.filter(t => t.status === 'complete');
  if (implComplete.length < implTasks.length) {
    return 'implementation';
  }
  
  // Testing phase - run siegemaster once after all implementation
  if (!quest.phases?.testing?.status) {
    return 'testing';
  }
  
  // Review phase - run lawbringer once after testing
  if (!quest.phases?.review?.status) {
    return 'review';
  }
  
  return 'complete';
}

function updateQuestState(quest) {
  const phase = getCurrentPhase(quest);
  
  // Initialize phases tracking if needed
  if (!quest.phases) {
    quest.phases = {
      discovery: { status: 'pending' },
      implementation: { status: 'pending' },
      testing: { status: 'pending' },
      review: { status: 'pending' }
    };
  }
  
  // Update phase status based on latest activity
  switch (phase) {
    case 'discovery':
      if (quest.tasks && quest.tasks.length > 0) {
        quest.phases.discovery.status = 'complete';
        quest.phases.discovery.completedAt = new Date().toISOString();
      }
      break;
      
    case 'implementation':
      const implTasks = quest.tasks.filter(t => t.type === 'implementation');
      const implComplete = implTasks.filter(t => t.status === 'complete');
      
      quest.phases.implementation.status = 'in_progress';
      quest.phases.implementation.progress = `${implComplete.length}/${implTasks.length}`;
      
      if (implComplete.length === implTasks.length) {
        quest.phases.implementation.status = 'complete';
        quest.phases.implementation.completedAt = new Date().toISOString();
      }
      break;
      
    case 'testing':
      quest.phases.testing.status = 'complete';
      quest.phases.testing.completedAt = new Date().toISOString();
      break;
      
    case 'review':
      quest.phases.review.status = 'complete';
      quest.phases.review.completedAt = new Date().toISOString();
      break;
  }
  
  // Save updated quest
  saveQuest(quest);
  return quest;
}

async function runPathseeker(quest) {
  const result = await spawnAndWait('pathseeker', {
    questFolder: quest.folder,
    reportNumber: getNextReportNumber(quest),
    questMode: quest.tasks.length > 0 ? 'validation' : 'creation',
    userRequest: quest.title,
    existingTasks: quest.tasks
  });
  
  // Update quest with tasks from Pathseeker
  if (result.report.tasks) {
    quest.tasks = result.report.tasks;
  }
  
  // Handle task modifications during resume
  if (result.report.newTasks) {
    quest.tasks.push(...result.report.newTasks);
  }
  
  if (result.report.modifiedDependencies) {
    for (const [taskId, mods] of Object.entries(result.report.modifiedDependencies)) {
      const task = quest.tasks.find(t => t.id === taskId);
      if (task && mods.addDependencies) {
        task.dependencies = [...new Set([...task.dependencies, ...mods.addDependencies])];
      }
    }
  }
  
  quest.phases.discovery.status = 'complete';
  quest.phases.discovery.report = result.reportFilename;
  saveQuest(quest);
}

async function runCodeweavers(quest) {
  // Get implementation tasks from Pathseeker's report
  const tasks = quest.tasks.filter(t => t.type === 'implementation');
  
  // Validate dependency chain before starting
  const validationResult = validateDependencyChain(tasks);
  if (!validationResult.valid) {
    console.error('❌ Task dependency issues detected:');
    validationResult.issues.forEach(issue => console.error(`   - ${issue}`));
    
    // Spawn Pathseeker to fix the issues
    console.log('[🔍] Spawning Pathseeker to rectify task dependencies...');
    const fixResult = await spawnAndWait('pathseeker', {
      questFolder: quest.folder,
      reportNumber: getNextReportNumber(quest),
      questMode: 'dependency_repair',
      existingTasks: tasks,
      dependencyIssues: validationResult.issues,
      instruction: 'The task dependencies have issues. Please analyze and provide a corrected task list with proper dependencies.'
    });
    
    // Update quest with fixed tasks
    quest.tasks = fixResult.report.tasks;
    saveQuest(quest);
    
    // Re-validate to ensure fixed
    const revalidation = validateDependencyChain(quest.tasks.filter(t => t.type === 'implementation'));
    if (!revalidation.valid) {
      throw new Error('Pathseeker could not fix dependency issues');
    }
  }
  
  // Process tasks in dependency order
  const processed = new Set();
  
  while (processed.size < tasks.length) {
    // Find next task with all dependencies met
    const nextTask = tasks.find(task => 
      !processed.has(task.id) &&
      task.dependencies.every(dep => processed.has(dep))
    );
    
    if (!nextTask) {
      // This should not happen after validation
      throw new Error('Unexpected circular dependency');
    }
    
    // Spawn Codeweaver for this task
    const result = await spawnAndWait('codeweaver', {
      questFolder: quest.folder,
      reportNumber: getNextReportNumber(quest),
      questTitle: quest.title,
      task: nextTask
    });
    
    processed.add(nextTask.id);
    
    // Update task status
    const taskInQuest = quest.tasks.find(t => t.id === nextTask.id);
    if (taskInQuest) {
      taskInQuest.status = 'complete';
      taskInQuest.completedBy = result.reportFilename;
    }
    saveQuest(quest);
    
    // Run ward:all after each Codeweaver
    const wardOk = await runWardAll();
    if (!wardOk) {
      await handleWardFailure(quest, wardOk.errors);
    }
  }
}
```

#### 6. **Agent Spawning & Monitoring**
```javascript
async function spawnAndWait(agentType, context) {
  // 1. Generate report filename
  const reportFilename = `${context.reportNumber.toString().padStart(3, '0')}-${agentType}-report.json`;
  const reportPath = `dungeonmaster/active/${context.questFolder}/${reportFilename}`;
  
  // 2. Update quest.json to track agent start
  const quest = loadQuest(context.questFolder);
  if (context.task) {
    // Find task in array by id
    const task = quest.tasks.find(t => t.id === context.task.id);
    if (task) {
      task.status = 'in_progress';
      task.currentAgent = reportFilename;
    }
  }
  
  // Add to execution log
  quest.executionLog.push({
    report: reportFilename,
    taskId: context.task?.id || null,
    timestamp: new Date().toISOString()
  });
  
  saveQuest(quest);
  
  // 3. Read agent markdown
  const agentMd = readAgentFile(agentType);
  
  // 4. Replace $ARGUMENTS
  const prompt = agentMd.replace('$ARGUMENTS', formatContext(context));
  
  // 5. Spawn Claude in interactive mode
  const proc = spawn('claude', [prompt], { stdio: 'inherit' });
  
  // 6. Monitor for report file
  return new Promise((resolve) => {
    
    const watcher = setInterval(() => {
      // Check if report file exists
      if (fs.existsSync(reportPath)) {
        clearInterval(watcher);
        proc.kill();
        
        // Parse JSON report
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        
        if (report.status === 'blocked') {
          // Handle blocked agent
          handleBlockedAgent(agentType, context, report.blockReason);
        } else {
          resolve(report);
        }
      }
    }, 200);
    
    // Handle unexpected exit
    proc.on('exit', (code) => {
      clearInterval(watcher);
      
      // Check if report was generated
      if (!fs.existsSync(reportPath)) {
        // Agent died without report - spawn recovery agent
        console.log(`\n⚠️ ${agentType} exited without report. Spawning recovery agent...`);
        
        handleAgentRecovery(agentType, context).then(resolve).catch(reject);
      }
    });
  });
}

async function handleAgentRecovery(agentType, originalContext) {
  // Recovery through file system state, not progress files
  // The actual code files ARE the progress
  
  console.log(`\n⚠️ ${agentType} exited without report. Checking for partial work...`);
  
  // For implementation agents, check what files were created/modified
  if (agentType === 'codeweaver') {
    // Spawn Pathseeker to assess current state
    const assessmentContext = {
      questFolder: originalContext.questFolder,
      reportNumber: getNextReportNumber(loadQuest(originalContext.questFolder)),
      questMode: 'recovery_assessment',
      originalTask: originalContext.task,
      instruction: `The previous Codeweaver exited unexpectedly while working on task ${originalContext.task.name}. Analyze what was completed and what remains.`
    };
    
    const assessment = await spawnAndWait('pathseeker', assessmentContext);
    
    // Based on assessment, either mark task complete or respawn Codeweaver
    if (assessment.report.taskAssessment.status === 'mostly_complete') {
      // Generate synthetic report for the original agent
      return {
        status: 'complete',
        agentType: agentType,
        taskId: originalContext.task.id,
        report: {
          recoveryNote: 'Agent exited but work was mostly complete',
          filesCreated: assessment.report.taskAssessment.filesFound,
          completedBy: 'recovery_assessment'
        }
      };
    } else {
      // Respawn Codeweaver to finish the task
      const recoveryContext = {
        ...originalContext,
        reportNumber: getNextReportNumber(loadQuest(originalContext.questFolder)),
        recoveryMode: true,
        existingWork: assessment.report.taskAssessment,
        instruction: "Continue the incomplete task based on existing work."
      };
      
      return spawnAndWait(agentType, recoveryContext);
    }
  } else {
    // For non-implementation agents, just respawn
    const recoveryContext = {
      ...originalContext,
      reportNumber: getNextReportNumber(loadQuest(originalContext.questFolder)),
      recoveryMode: true,
      instruction: "The previous agent exited unexpectedly. Start fresh and complete the analysis."
    };
    
    return spawnAndWait(agentType, recoveryContext);
  }
}
```

#### 7. **Blocked Agent Continuation**
```javascript
async function handleBlockedAgent(agentType, originalContext, blockReason) {
  console.log(`Agent blocked: ${blockReason}`);
  
  // Get user input
  const userResponse = await getUserInput('How to proceed? ');
  
  // Spawn new instance with continuation context
  const continuationContext = {
    ...originalContext,
    reportNumber: getNextReportNumber(loadQuest(originalContext.questFolder)),
    previousReportNumber: originalContext.reportNumber,
    userGuidance: userResponse
  };
  
  return spawnAndWait(agentType, continuationContext);
}
```

#### 8. **Ward Validation**
```javascript
async function runWardAll() {
  console.log('[🎲] 🛡️ Running ward validation...');
  
  try {
    const result = await exec('npm run ward:all');
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      errors: error.stdout + error.stderr 
    };
  }
}

const MAX_SPIRITMENDER_ATTEMPTS = 3;

async function handleWardFailure(quest, errors, attemptCount = 1) {
  if (attemptCount > MAX_SPIRITMENDER_ATTEMPTS) {
    console.error(`❌ Ward validation failed after ${attemptCount-1} Spiritmender attempts`);
    console.error('Manual intervention required. Common causes:');
    console.error('- Complex type errors requiring architectural changes');
    console.error('- Incompatible dependency versions');
    console.error('- Fundamental design conflicts');
    
    // Save errors for user review
    fs.writeFileSync(
      `dungeonmaster/active/${quest.folder}/ward-errors-unresolved.txt`,
      errors
    );
    
    // Block the quest
    quest.status = 'blocked';
    quest.blockReason = 'ward_validation_failed_after_spiritmender_attempts';
    saveQuest(quest);
    
    throw new Error('Quest blocked: Ward validation cannot be automatically resolved');
  }
  
  console.log(`[🔧] Spiritmender attempt ${attemptCount}/${MAX_SPIRITMENDER_ATTEMPTS}...`);
  
  // Track previous attempts for context - look at previous Spiritmender reports
  const previousAttempts = [];
  const allReports = fs.readdirSync(`dungeonmaster/active/${quest.folder}`)
    .filter(f => f.includes('spiritmender-report.json'))
    .sort();
  
  for (const reportFile of allReports) {
    const report = JSON.parse(fs.readFileSync(`dungeonmaster/active/${quest.folder}/${reportFile}`, 'utf8'));
    if (report.attemptNumber) {
      previousAttempts.push(report);
    }
  }
  
  const result = await spawnAndWait('spiritmender', {
    questFolder: quest.folder,
    reportNumber: getNextReportNumber(quest),
    errors: errors,
    attemptNumber: attemptCount,
    previousAttempts: previousAttempts,
    maxAttempts: MAX_SPIRITMENDER_ATTEMPTS,
    instruction: attemptCount > 1 
      ? `Previous fix attempt didn't fully resolve the issues. Try a different approach.`
      : undefined
  });
  
  // Note: Spiritmender report is already saved by spawnAndWait using standard numbering
  // Track attempt number in quest.json or in the report itself, not in filename
  
  // Re-run ward to check if fixed
  const wardCheck = await runWardAll();
  if (!wardCheck.success) {
    // Recurse with incremented attempt count
    return handleWardFailure(quest, wardCheck.errors, attemptCount + 1);
  }
  
  console.log('[🎁] ✅ Ward validation passed after Spiritmender fixes!');
  return true;
}
```

#### 9. **Quest Completion & Retrospectives**
```javascript
async function completeQuest(quest) {
  // 1. Collect all retrospectives from reports
  const retros = [];
  
  for (const reportFile of getQuestReports(quest.id)) {
    const report = parseReport(reportFile);
    if (report.retrospectiveNotes) {
      retros.push({
        agent: report.agentType,
        notes: report.retrospectiveNotes
      });
    }
  }
  
  // 2. Create combined retrospective
  const retroPath = `dungeonmaster/retros/${Date.now()}-${quest.id}.md`;
  writeRetrospective(retroPath, quest, retros);
  
  // 3. Move entire quest folder to completed
  fs.renameSync(
    `dungeonmaster/active/${quest.folder}`,
    `dungeonmaster/completed/${quest.folder}`
  );
  
  console.log(`[🎁] ✅ Quest complete! ${quest.title} vanquished!`);
}

function validateDependencyChain(tasks) {
  const issues = [];
  const taskNames = new Set(tasks.map(t => t.name));
  
  // Check 1: All dependencies exist
  for (const task of tasks) {
    for (const dep of task.dependencies || []) {
      if (!taskNames.has(dep)) {
        issues.push(`Task "${task.name}" depends on non-existent task "${dep}"`);
      }
    }
  }
  
  // Check 2: No circular dependencies
  const visited = new Set();
  const visiting = new Set();
  
  function hasCycle(taskName, path = []) {
    if (visiting.has(taskName)) {
      const cycleStart = path.indexOf(taskName);
      const cycle = path.slice(cycleStart).concat(taskName);
      issues.push(`Circular dependency detected: ${cycle.join(' → ')}`);
      return true;
    }
    
    if (visited.has(taskName)) {
      return false;
    }
    
    visiting.add(taskName);
    path.push(taskName);
    
    const task = tasks.find(t => t.name === taskName);
    if (task && task.dependencies) {
      for (const dep of task.dependencies) {
        if (taskNames.has(dep)) {
          hasCycle(dep, [...path]);
        }
      }
    }
    
    visiting.delete(taskName);
    visited.add(taskName);
    return false;
  }
  
  // Check all tasks for cycles
  for (const task of tasks) {
    if (!visited.has(task.name)) {
      hasCycle(task.name);
    }
  }
  
  // Check 3: Ensure there's at least one task with no dependencies (entry point)
  const hasEntryPoint = tasks.some(t => !t.dependencies || t.dependencies.length === 0);
  if (!hasEntryPoint && tasks.length > 0) {
    issues.push('No entry point found - all tasks have dependencies');
  }
  
  // Check 4: All tasks are reachable from entry points
  const reachable = new Set();
  const entryPoints = tasks.filter(t => !t.dependencies || t.dependencies.length === 0);
  
  function markReachable(taskName) {
    if (reachable.has(taskName)) return;
    reachable.add(taskName);
    
    // Find tasks that depend on this one
    const dependents = tasks.filter(t => 
      t.dependencies && t.dependencies.includes(taskName)
    );
    
    for (const dependent of dependents) {
      markReachable(dependent.name);
    }
  }
  
  // Mark all reachable tasks
  for (const entry of entryPoints) {
    markReachable(entry.name);
  }
  
  // Find unreachable tasks
  const unreachable = tasks.filter(t => !reachable.has(t.name));
  if (unreachable.length > 0) {
    issues.push(`Unreachable tasks: ${unreachable.map(t => t.name).join(', ')}`);
  }
  
  return {
    valid: issues.length === 0,
    issues: issues
  };
}
```

#### 10. **Report Parsing**
```javascript
function parseReport(reportPath) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  
  // Validate required fields
  if (!report.status || !report.agentType) {
    throw new Error('Invalid report format');
  }
  
  // Agent-specific data is in report.report
  if (report.agentType === 'pathseeker') {
    // Extract tasks from pathseeker report
    return {
      ...report,
      tasks: report.report.tasks || [],
      questDetails: report.report.questDetails,
      discoveryFindings: report.report.discoveryFindings,
      keyDecisions: report.report.keyDecisions
    };
  }
  
  return report;
}
```

#### 11. **Helper Functions**
```javascript
function getNextReportNumber(quest) {
  // Count existing reports in quest folder
  const files = fs.readdirSync(`dungeonmaster/active/${quest.folder}`);
  const reportFiles = files.filter(f => f.match(/^\d{3}-.*-report\.json$/));
  return reportFiles.length + 1;
}

function loadQuest(questFolder) {
  const questPath = `dungeonmaster/active/${questFolder}/quest.json`;
  return JSON.parse(fs.readFileSync(questPath, 'utf8'));
}

function saveQuest(quest) {
  const questPath = `dungeonmaster/active/${quest.folder}/quest.json`;
  fs.writeFileSync(questPath, JSON.stringify(quest, null, 2));
}

async function validateQuestFreshness(quest) {
  // Spawn Pathseeker to validate if quest is still relevant
  const result = await spawnAndWait('pathseeker', {
    questFolder: quest.folder,
    reportNumber: getNextReportNumber(quest),
    questMode: 'validation',
    existingTasks: quest.tasks,
    instruction: 'Validate if this quest is still relevant and tasks are still valid.'
  });
  
  // Update quest based on validation
  if (result.report.validationResult === 'REPLAN') {
    quest.tasks = result.report.tasks;
    saveQuest(quest);
  }
}

function getQuestReports(questFolder) {
  const files = fs.readdirSync(`dungeonmaster/active/${questFolder}`);
  return files
    .filter(f => f.endsWith('-report.json'))
    .map(f => `dungeonmaster/active/${questFolder}/${f}`);
}

function createQuest(title, id) {
  const questFolder = `${id}-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const questPath = `dungeonmaster/active/${questFolder}`;
  
  // Create folder
  fs.mkdirSync(questPath, { recursive: true });
  
  // Initialize quest.json
  const quest = {
    id: id,
    folder: questFolder,
    title: title,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    phases: {
      discovery: { status: 'pending' },
      implementation: { status: 'pending' },
      testing: { status: 'pending' },
      review: { status: 'pending' }
    },
    executionLog: [],
    tasks: []
  };
  
  fs.writeFileSync(`${questPath}/quest.json`, JSON.stringify(quest, null, 2));
  return quest;
}

async function runSiegemaster(quest) {
  const result = await spawnAndWait('siegemaster', {
    questFolder: quest.folder,
    reportNumber: getNextReportNumber(quest),
    questTitle: quest.title,
    filesCreated: getCreatedFiles(quest),
    testFramework: detectTestFramework()
  });
  
  quest.phases.testing.status = 'complete';
  quest.phases.testing.report = result.reportFilename;
  saveQuest(quest);
}

async function runLawbringer(quest) {
  const result = await spawnAndWait('lawbringer', {
    questFolder: quest.folder,
    reportNumber: getNextReportNumber(quest),
    questTitle: quest.title,
    changedFiles: getChangedFiles(quest),
    wardCommands: getWardCommands()
  });
  
  quest.phases.review.status = 'complete';
  quest.phases.review.report = result.reportFilename;
  saveQuest(quest);
}
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

**Quest.json Structure**:
```json
{
  "id": "add-authentication",
  "title": "Add User Authentication",
  "status": "in_progress", // in_progress | blocked | complete | abandoned
  "phases": {
    "discovery": { 
      "status": "complete", 
      "completedAt": "2024-03-15T10:30:00Z",
      "report": "001-pathseeker-report.json"
    },
    "implementation": { 
      "status": "in_progress", 
      "progress": "2/4",
      "startedAt": "2024-03-15T11:00:00Z"
    },
    "testing": { "status": "pending" },
    "review": { "status": "pending" }
  },
  "executionLog": [
    { "report": "001-pathseeker-report.json", "taskId": null, "timestamp": "2024-03-15T10:00:00Z" },
    { "report": "002-codeweaver-report.json", "taskId": "create-auth-interface", "timestamp": "2024-03-15T10:30:00Z" },
    { "report": "003-codeweaver-report.json", "taskId": "create-auth-service", "timestamp": "2024-03-15T11:00:00Z" },
    { "report": "004-pathseeker-report.json", "taskId": null, "timestamp": "2024-03-16T14:00:00Z" },
    { "report": "005-codeweaver-report.json", "taskId": "add-rate-limiting", "timestamp": "2024-03-16T14:30:00Z" }
  ],
  "tasks": [
    {
      "id": "create-auth-interface",
      "name": "CreateAuthInterface",
      "type": "implementation",
      "status": "complete",
      "dependencies": [],
      "addedBy": "001-pathseeker-report.json",
      "completedBy": "002-codeweaver-report.json"
    },
    {
      "id": "create-auth-service",
      "name": "CreateAuthService",
      "type": "implementation",
      "status": "complete",
      "dependencies": ["create-auth-interface"],
      "addedBy": "001-pathseeker-report.json",
      "completedBy": "003-codeweaver-report.json"
    },
    {
      "id": "add-rate-limiting",
      "name": "AddRateLimiting",
      "type": "implementation", 
      "status": "complete",
      "dependencies": ["create-auth-service"],
      "runBefore": ["integrate-auth"],
      "addedBy": "004-pathseeker-report.json",
      "completedBy": "005-codeweaver-report.json"
    },
    {
      "id": "integrate-auth",
      "name": "IntegrateAuth",
      "type": "implementation",
      "status": "queued",
      "dependencies": ["create-auth-service", "add-rate-limiting"],
      "addedBy": "001-pathseeker-report.json",
      "modifiedBy": "004-pathseeker-report.json"
    }
  ],
  "executionPlan": ["create-auth-interface", "create-auth-service", "add-rate-limiting", "integrate-auth", "verify-integration"]
}
```

**Task Reconciliation Process**:

1. **When Resume Pathseeker runs**:
   - Receives current task list with statuses
   - Can return three types of modifications:
     ```json
     {
       "validationResult": "EXTEND",
       "newTasks": [
         {
           "name": "add-rate-limiting",
           "type": "implementation",
           "dependencies": ["create-auth-service"],
           "runBefore": ["integrate-auth"]
         }
       ],
       "obsoleteTasks": [],
       "modifiedDependencies": {
         "integrate-auth": { "addDependencies": ["add-rate-limiting"] }
       }
     }
     ```

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

#### Pathseeker Updates Needed
- **CRITICAL**: Change "Components Found" to "tasks" array
- Each task must include:
  - name: unique identifier
  - type: "implementation" or "testing"
  - description: what to build
  - dependencies: array of other task names
  - filesToCreate: array of file paths to create
  - filesToEdit: array of file paths to modify
  - testTechnology: (if type is "testing")
- Add interactive Q&A capability within agent (no back-and-forth with dungeonmaster)
- Remove INSUFFICIENT_CONTEXT status - handle all clarifications internally
- Tasks define execution order through dependencies
- **Simplified Workflow**:
  1. Analyze project
  2. Ask user questions if needed
  3. Create task list
  4. Write JSON report file
  5. Exit

#### Codeweaver Updates Needed
- Receive a single task object with files array
- Work on all files listed in the task
- Each Codeweaver instance completes one task fully
- Report which files were created vs modified
- **Simplified Workflow**:
  1. Read task details
  2. Create/modify all files in task
  3. Run ward validation
  4. Write JSON report with results
  5. Exit

#### Siegemaster Updates Needed
- **Remove 4-gate system** - Just analyze and report gaps
- Focus on gap identification, not implementation
- **Simplified Workflow**:
  1. Analyze test coverage
  2. Identify gaps
  3. Write JSON report with gap list
  4. Exit

#### Lawbringer Updates Needed
- **Remove complex review categories** - Just run ward and check standards
- **Simplified Workflow**:
  1. Run ward:all command
  2. Review changed files for standards
  3. Fix any issues found
  4. Write JSON report
  5. Exit

#### Spiritmender Updates Needed
- **Remove 4-gate system** - Just fix errors systematically
- **Simplified Workflow**:
  1. Analyze errors
  2. Fix them in priority order
  3. Verify fixes with ward
  4. Write JSON report
  5. Exit

#### Voidpoker Updates Needed

- **Special Output Location**: Write to `dungeonmaster/discovery/` not active quest folder
- Output filename should include timestamp and package name
- Can be run manually by user outside of quest flow
- Still outputs JSON report like other agents

#### All Agents
- **CRITICAL CHANGE**: Convert from text reports to JSON file output
  - Currently agents output text like "=== AGENT REPORT ==="
  - Must change to write JSON files using Write tool
  - Example: Write("dungeonmaster/active/01-add-auth/A01-01-codeweaver-report.json", JSON.stringify(report))
  - Exception: Voidpoker writes to `dungeonmaster/discovery/` folder
- Add output instructions for reports and signals at END of each agent markdown
- Support blocked state (but no progress files needed)
- Include retrospective notes in reports
- **Sub-Agent Spawning**: Agents can use Task tool to spawn sub-agents
  - Spawn multiple agents in parallel for efficiency
  - Each agent handles its own sub-agent orchestration
  - Compile sub-agent results into final report
  - Example use cases:
    - Pathseeker spawning multiple analysts for different areas
    - Codeweaver spawning parallel workers for independent components
    - Lawbringer spawning Spiritmender for immediate fixes
- **Recovery Philosophy**: 
  - The actual code files ARE the progress - no separate progress tracking needed
  - If agent dies without report, recovery happens through:
    - For Codeweaver: Pathseeker assesses what was done, then either mark complete or respawn
    - For other agents: Simply respawn to complete the analysis
  - Agents must still write final JSON reports when complete

This is the complete, final plan incorporating all requirements discussed.

### Context Templates for Agent Spawning

When replacing $ARGUMENTS in agent markdown files, use these templates:

**Pathseeker Context**:
```
User request: [original request]
Working directory: [cwd]
Quest folder: 01-add-authentication
Report number: 001
Quest mode: creation | discovery | validation
[For validation mode, include previous task list with statuses]
[Include any previous Q&A if continuing from blocked state]
```

**Codeweaver Context**:
```
Quest: [quest title]
Quest folder: 01-add-authentication
Report number: 002
Task: {
  "id": "create-auth-service",
  "name": "CreateAuthService",
  "description": "Create authentication service with JWT handling",
  "filesToCreate": ["src/auth/auth-service.ts", "src/auth/auth-service.test.ts"],
  "filesToEdit": []
}
Ward commands: npm run ward:all
[Include previous progress if continuing from blocked agent]
```

**Siegemaster Context**:
```
Quest: [quest title]
Quest folder: 01-add-authentication
Report number: 008
Files created: [all files created by Codeweavers]
Test framework: jest | playwright | supertest
Focus files: [specific files to analyze for test gaps]
```

**Lawbringer Context**:
```
Quest: [quest title]
Quest folder: 01-add-authentication
Report number: 009
Changed files: [all files created/modified in quest]
Ward commands: npm run ward:all
Standards: Check CLAUDE.md files in directory hierarchy
```

**Spiritmender Context**:
```
Quest: [quest title]
Quest folder: 01-add-authentication
Report number: 006
Ward errors: [full error output from ward:all]
Error type: lint | typecheck | test | build
Failed files: [files with errors]
Lore folder: dungeonmaster/lore/
```

**Recovery Mode Context** (for any agent type):
```
Quest: [quest title]
Quest folder: 01-add-authentication
Report number: 003  # Next sequential number
Recovery mode: true
Previous report number: 002
Instruction: [agent-specific recovery instruction]
[For Codeweaver, include existingWork from Pathseeker assessment]
[For other agents, just include original context]
```

**Recovery Assessment Mode** (Pathseeker only):
```
Quest folder: 01-add-authentication
Report number: 004  # Next sequential number
Quest mode: recovery_assessment
Original task: [task that was being worked on]
Instruction: "The previous Codeweaver exited unexpectedly while working on task CreateAuthService. Analyze what was completed and what remains."
```

**Voidpoker Context**:
```
Discovery type: Project Analysis
Package location: [package directory path]
User standards: [standards provided by user]
Report path: dungeonmaster/discovery/voidpoker-[timestamp]-[package-name]-report.json
```

### Post-MVP Enhancements

These features are not needed for initial implementation but would improve the experience later:

#### **Concurrent Quest Prevention**
- Add lock file mechanism to prevent multiple CLI instances
- Useful for teams or when running from multiple terminals
- Implementation: Write PID to `.dungeonmaster/dungeonmaster.lock`
- Check if process still alive before refusing to start

#### **Agent Timeouts** 
- Add configurable timeouts for long-running agents
- Mainly for unattended/CI environments
- Not needed for interactive use (user can Ctrl+C)

#### **Quest Templates**
- Pre-built quest patterns for common tasks
- Example: "Add CRUD endpoint" template
- Reduces Pathseeker discovery time

#### **Parallel Agent Execution**
- Run multiple independent Codeweavers simultaneously  
- Requires careful file locking to prevent conflicts
- Could significantly speed up large quests

#### **Git Integration**
- Auto-commit after successful ward validation
- Branch management for quests
- PR creation from completed quests

The MVP focuses on core functionality: single-user, interactive, file-based orchestration.