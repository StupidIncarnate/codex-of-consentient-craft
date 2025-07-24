# Success Criteria: Agent-Based Completion Standards

How to determine when tasks, observable actions, and complete quests are finished in the Questmaestro orchestration system.

## Theoretical Foundation

**Traditional Success Criteria Problems**:
- Subjective measures ("code quality is good")
- Implementation-focused rather than outcome-focused
- No clear handoff points between team members
- Success criteria defined after work begins

**Agent-Based Success Challenges**:
- Multiple agents need consistent completion standards
- Fresh agent context means no memory of previous decisions
- Parallel agents need coordinated success validation
- Learning requires tracking what "success" actually means

**The Solution**: **Layered success criteria** where:
- Each agent has clear, verifiable completion standards
- Observable actions define user-demonstrable success
- System-level validation ensures quest completion
- Learning improves success criteria over time

## Success Criteria Hierarchy

### Level 1: Agent Task Completion

**Each agent type has specific completion requirements**:

**Pathseeker Success**:
```json
{
  "pathseekerSuccess": {
    "userDialogueComplete": "User confirmed understanding of observable actions",
    "taskDecompositionComplete": "All observable actions mapped to implementable tasks",
    "dependenciesIdentified": "Task execution order and dependencies clear",
    "scopeBoundariesDefined": "Clear start/stop criteria for each task",
    "interfaceContractsDefined": "Shared types and integration points specified"
  }
}
```

**Codeweaver Success**:
```json
{
  "codeweaverSuccess": {
    "filesCreated": "All specified files created and contain working code",
    "testsPass": "All tests for implemented functionality pass",
    "typescriptCompiles": "Code compiles without TypeScript errors",
    "lintingPasses": "Code meets ESLint standards without warnings",
    "patternsFollowed": "Implementation follows established project patterns",
    "interfacesImplemented": "Code implements all required interfaces correctly"
  }
}
```

**Lawbringer Success**:
```json
{
  "lawbringerSuccess": {
    "consistencyChecked": "All parallel implementations reviewed for consistency",
    "standardsApplied": "Code quality standards applied uniformly",
    "integrationVerified": "Implementations integrate correctly with existing code",
    "refactoringComplete": "Any necessary refactoring completed",
    "documentationUpdated": "Relevant documentation reflects changes"
  }
}
```

**Siegemaster Success**:
```json
{
  "siegemasterSuccess": {
    "integrationTestsCreated": "Tests verify observable actions work end-to-end",
    "allScenariosVerified": "Success, failure, and edge cases tested",
    "performanceValidated": "Response times meet user experience requirements",
    "dataIntegrityConfirmed": "Data flows correctly through all systems",
    "errorRecoveryTested": "System recovers gracefully from failures"
  }
}
```

**Spiritmender Success**:
```json
{
  "spiritmenderSuccess": {
    "buildPasses": "Complete project builds successfully",
    "allTestsPass": "Entire test suite passes",
    "validationClean": "All validation checks pass",
    "performanceIntact": "No performance regressions introduced",
    "integrationHealthy": "All integrations working correctly"
  }
}
```

### Level 2: Observable Action Completion

**Each observable atomic action has demonstrable success criteria**:

```json
{
  "observableActionSuccess": {
    "id": "user-can-login-with-valid-credentials",
    "completionCriteria": {
      "userCanDemonstrate": "Manual testing shows user can actually login",
      "acceptanceCriteriaMet": [
        "✓ User enters email and password in form",
        "✓ Valid credentials redirect to dashboard within 2 seconds", 
        "✓ Invalid credentials show 'Invalid email or password' error",
        "✓ User session persists across page refreshes"
      ],
      "integrationTestsPassing": "Automated tests verify all scenarios",
      "edgeCasesHandled": [
        "✓ SQL injection attempts blocked",
        "✓ Rate limiting prevents brute force attacks",
        "✓ Network failures show appropriate error messages"
      ],
      "performanceWithinBounds": "Login completes in under 2 seconds",
      "accessibilityCompliant": "Screen readers can navigate login flow"
    },
    "status": "complete"
  }
}
```

### Level 3: Quest Completion

**Complete quest success requires all observable actions working together**:

```json
{
  "questSuccess": {
    "id": "user-authentication-system",
    "completionCriteria": {
      "allObservableActionsComplete": "Every defined action demonstrably working",
      "userAcceptanceCriteriaMet": "User confirms quest objectives achieved",
      "systemIntegrationComplete": "Authentication integrates with existing systems",
      "performanceAcceptable": "No degradation in system performance",
      "securityValidated": "Security review passed (if applicable)",
      "documentationComplete": "Users/developers can understand how to use it",
      "maintenanceReady": "Code is maintainable and follows project standards"
    },
    "validationResults": {
      "wardAllPasses": true,
      "integrationTestSuite": "100% passing",
      "userAcceptanceTest": "approved",
      "performanceBenchmarks": "within_requirements"
    },
    "status": "complete"
  }
}
```

## Agent Escape vs. Success Boundary

### When Agents Should Escape vs. Succeed

**Agent Should Report Success When**:
- All completion criteria met for their specific role
- Output validates successfully  
- Ready for next orchestration stage
- No blockers preventing handoff to next agent

**Agent Should Escape When**:
- Task complexity exceeds agent capability
- Unexpected dependencies discovered
- Context window approaching limits
- Integration conflicts detected
- Requirements change during implementation

**Example Decision Logic**:
```javascript
function determineAgentOutcome(taskProgress, validation, contextUsage) {
  if (validation.allCriteriaPass && taskProgress.complete) {
    return { status: "success", readyForHandoff: true };
  }
  
  if (contextUsage > ESCAPE_THRESHOLD) {
    return { 
      status: "escape", 
      reason: "context_exhaustion",
      progress: taskProgress.summary 
    };
  }
  
  if (taskProgress.unexpectedComplexity) {
    return {
      status: "escape",
      reason: "task_too_complex", 
      recommendation: taskProgress.decompositionSuggestion
    };
  }
  
  return { status: "continue", nextActions: taskProgress.nextSteps };
}
```

## Success Validation Patterns

### Immediate Validation After Agent Completion

**Each agent success triggers validation**:

```javascript
function validateAgentSuccess(agentOutput, successCriteria) {
  const validation = {
    criteriaCheck: verifyCriteriaMet(agentOutput, successCriteria),
    integrationCheck: verifyIntegrationReadiness(agentOutput),
    qualityCheck: verifyQualityStandards(agentOutput),
    handoffCheck: verifyNextStageReady(agentOutput)
  };
  
  if (validation.criteriaCheck.allPass) {
    return { validated: true, readyForNextStage: true };
  } else {
    return { 
      validated: false, 
      failures: validation.criteriaCheck.failures,
      recommendation: "spawn_spiritmender_for_healing"
    };
  }
}
```

### Cross-Agent Success Coordination

**When parallel agents complete, validate compatibility**:

```json
{
  "parallelAgentSuccess": {
    "codeweaver-1": { "status": "success", "interfaces": ["User", "LoginResult"] },
    "codeweaver-2": { "status": "success", "interfaces": ["User", "RegistrationResult"] },
    "compatibilityCheck": {
      "sharedInterfaces": "User interface consistent across agents",
      "integrationPoints": "No conflicts in shared dependencies",
      "testCompatibility": "Tests from both agents can run together"
    },
    "coordinatedSuccess": true
  }
}
```

## Success Criteria Learning

### Pattern Recognition in Success

**System learns what "good success" looks like**:

```json
{
  "successPatterns": {
    "highQualityQuestCompletion": {
      "characteristics": [
        "User acceptance achieved on first demonstration",
        "No post-completion bug reports for 30 days",
        "Integration tests remain stable over time",
        "Code requires minimal maintenance"
      ],
      "correlatedFactors": [
        "Observable actions clearly defined upfront",
        "Task decomposition had clear boundaries",
        "Integration testing thorough",
        "User feedback incorporated during development"
      ]
    }
  }
}
```

### Success Criteria Refinement

**Based on quest outcomes, refine future success criteria**:

```json
{
  "criteriaEvolution": {
    "originalCriteria": "Login functionality works",
    "outcomeAnalysis": "Users complained about slow login despite functionality working",
    "refinedCriteria": "Login functionality works AND completes within 2 seconds",
    "application": "Add performance requirements to all user-facing success criteria"
  }
}
```

## Failure Recovery and Success

### When Success Criteria Change Mid-Quest

**If user requirements evolve during quest**:

```json
{
  "successCriteriaUpdate": {
    "originalCriteria": "User can register with email/password", 
    "userFeedback": "Actually, we need social media login too",
    "updatedCriteria": "User can register with email/password OR social media accounts",
    "impact": "Spawn fresh Pathseeker to decompose social media login requirements",
    "existingWorkStatus": "Keep completed email/password registration"
  }
}
```

### Partial Success Handling

**When some observable actions succeed but others fail**:

```json
{
  "partialQuestSuccess": {
    "completedActions": [
      "user-can-register-with-email",
      "user-sees-validation-errors"
    ],
    "failedActions": [
      "user-can-login-with-credentials"
    ],
    "approach": "Celebrate completed actions, re-decompose failed actions",
    "userValue": "Deliver working registration while fixing login"
  }
}
```

## Success Metrics and Quality Indicators

### Agent Success Rate Tracking

**Monitor agent completion effectiveness**:

```json
{
  "agentSuccessMetrics": {
    "codeweaver": {
      "successRate": 85,
      "averageTaskSize": "120 lines",
      "commonFailureReasons": ["typescript_errors", "test_failures"],
      "improvementTrend": "success_rate_increasing"
    },
    "pathseeker": {
      "successRate": 92,
      "averageTaskCount": 4.2,
      "commonRedecompositions": ["task_too_complex", "missing_integration_points"],
      "userSatisfactionRate": 88
    }
  }
}
```

### Quest Quality Indicators

**Track quest completion quality**:

```json
{
  "questQualityMetrics": {
    "userAcceptanceRate": 90,
    "postCompletionBugRate": 5,
    "maintenanceEffort": "low",
    "integrationStability": "high",
    "performanceImpact": "minimal"
  }
}
```

## Advanced Success Patterns

### Predictive Success Assessment

**Based on learned patterns, predict likely success**:

```json
{
  "successPrediction": {
    "questType": "user_authentication",
    "decompositionQuality": "high_clarity_observable_actions",
    "taskSizing": "within_learned_optimal_ranges", 
    "teamFamiliarity": "high_domain_knowledge",
    "predictedSuccessRate": 92,
    "riskFactors": ["new_security_requirements", "tight_timeline"]
  }
}
```

### Success Criteria Templates

**Based on quest patterns, pre-define success criteria**:

```json
{
  "authenticationQuestTemplate": {
    "observableActionCriteria": [
      "User can login within 2 seconds",
      "Invalid credentials show helpful error within 1 second",
      "User session persists for specified duration",
      "Security threats are blocked appropriately"
    ],
    "technicalCriteria": [
      "All authentication tests pass",
      "Security audit passes",
      "Performance benchmarks met",
      "Integration with existing user management works"
    ]
  }
}
```

The success criteria system evolves from **subjective completion judgments** to **objective, learnable standards** that improve the reliability of quest completion and agent coordination over time while maintaining focus on user-demonstrable value delivery.