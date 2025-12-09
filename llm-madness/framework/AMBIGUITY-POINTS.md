# Ambiguity Points for Discussion

Implementation details that need clarification to complete the Dungeonmaster framework.

## Agent Retro Content Specification
**Referenced in**: failure-learning.md, agent-coordination.md

**Question**: What specific content should agent "retro" reports contain to enable effective re-decomposition?

**Current Gap**: Framework shows agents returning "retro" information but doesn't specify:
- Should retros include code complexity metrics?
- What level of dependency analysis is useful?
- How much integration context helps Pathseeker re-decompose?
- Should retros include implementation attempt details or just failure summary?

**Example Ambiguity**:
```json
{
  "retro": "Discovered JWT integration needs separate exploration"
}
```
vs.
```json
{
  "retro": {
    "complexityAnalysis": "Task required 5 different integrations: JWT, password hashing, database, validation, error handling",
    "attemptedApproach": "Tried to implement all in single service class",
    "failurePoint": "Context exhausted while implementing error handling patterns", 
    "decompositionRecommendation": ["jwt-token-service", "password-validation", "user-creation-service"],
    "integrationInsights": "Existing auth system uses different session pattern than assumed"
  }
}
```

Which format provides better learning input for fresh Pathseeker?

---

## Sub-Agent Decision Logic
**Referenced in**: process-architecture.md, agent-coordination.md

**Question**: What triggers sub-agent spawning vs. escape hatch usage?

**Current Gap**: Framework describes both mechanisms but doesn't specify decision criteria:
- At what complexity threshold should agents delegate vs. escape?
- How does agent assess whether sub-agents will help or just multiply failures?
- Should sub-agent spawning be tried before escape hatch, or vice versa?
- What happens when sub-agents also need to escape?

**Example Decision Points**:
- Pathseeker mapping complex quest: spawn sub-agents or escape for human clarification?
- Codeweaver facing integration complexity: spawn sub-agents for research or escape immediately?
- Sub-agent hitting limits: escalate to parent or trigger parent escape?

---

## Parallel Agent Conflict Resolution  
**Referenced in**: agent-coordination.md, validation-pipeline.md

**Question**: How are semantic conflicts between parallel agents detected and resolved?

**Current Gap**: Framework prevents file-level conflicts but semantic conflicts need resolution:
- What happens when parallel agents make incompatible architectural assumptions?
- How does system detect that two agents implemented the same concept differently?
- Should conflict resolution spawn new agents or modify existing work?
- Who decides the "correct" approach when agents conflict?

**Example Scenarios**:
- Agent A implements User as `{id, email, name}`, Agent B assumes `{uuid, emailAddress, fullName}`
- Agent A uses promises, Agent B uses async/await for similar operations
- Agent A implements optimistic UI updates, Agent B implements pessimistic updates

---

## System Learning Persistence
**Referenced in**: failure-learning.md, task-decomposition.md, success-criteria.md

**Question**: How does empirical learning data persist and apply across quest sessions?

**Current Gap**: Framework describes learning but not implementation:

- How is failure pattern data stored between Dungeonmaster sessions?
- What triggers system to apply learned patterns vs. try fresh approaches?
- How does learning transfer between different projects/codebases?
- Should learning be conservative (apply patterns) or experimental (try new approaches)?

**Storage Questions**:
- Local files, database, or cloud storage for learning data?
- How to version/evolve learning as system improves?
- How to reset learning when it becomes stale or counterproductive?

---

## Cross-Agent Interface Negotiation
**Referenced in**: agent-coordination.md, task-decomposition.md

**Question**: How do parallel agents coordinate shared interface definitions?

**Current Gap**: Pathseeker defines interfaces but agents may discover interface inadequacy:
- What happens when Agent A needs different interface than Pathseeker specified?
- How do agents negotiate interface changes without breaking parallel work?
- Should interface changes trigger re-decomposition or local adaptation?
- Who has authority over shared interface modifications?

**Example**:
```json
// Pathseeker defines
"User": { "id": "string", "email": "string" }

// Agent A discovers needs
"User": { "id": "string", "email": "string", "permissions": "string[]" }

// Agent B discovers needs  
"User": { "id": "string", "email": "string", "profile": "UserProfile" }
```

How does system resolve this without breaking both agents' work?

---

## Agent Context Size Management
**Referenced in**: All framework documents

**Question**: How do agents monitor and manage their context window usage?

**Current Gap**: Framework mentions context limits but not monitoring:
- How do agents track context usage during execution?
- What's the threshold for triggering escape vs. continuing?
- Should context management be proactive (escape early) or reactive (escape when hitting limits)?
- How does context usage estimation account for remaining task complexity?

**Implementation Needs**:
- Context usage tracking mechanism
- Predictive context consumption for remaining work
- Early warning system before exhaustion
- Context-aware task sizing

---

## User Feedback Integration Timing
**Referenced in**: process-architecture.md, success-criteria.md

**Question**: When and how should user feedback interrupt the agent pipeline?

**Current Gap**: Framework shows user validation but not interruption handling:
- Should user feedback during implementation stop all agents or just relevant ones?
- How do requirements changes propagate to parallel agents?
- When does user feedback trigger re-decomposition vs. local adjustments?
- How to balance user feedback integration with agent efficiency?

**Scenarios**:
- User sees partial implementation and requests changes
- User provides clarification that affects multiple parallel agents
- User discovers the observable actions were misunderstood

---

## Performance vs. Learning Trade-offs  
**Referenced in**: All framework documents

**Question**: How does system balance learning/exploration with delivery speed?

**Current Gap**: Framework emphasizes learning but not performance trade-offs:
- Should system try novel approaches or stick with learned patterns for faster delivery?
- How much experimentation is acceptable when user needs working software?
- When should system prioritize learning over immediate quest completion?
- How to measure and optimize the learning vs. speed balance?

**Decision Points**:
- Use proven decomposition pattern vs. try potentially better approach
- Accept first working solution vs. iterate for optimal solution
- Extensive validation vs. faster delivery with some risk

---

## Error Recovery Escalation Paths
**Referenced in**: failure-learning.md, validation-pipeline.md

**Question**: What escalation path should failures follow through the agent hierarchy?

**Current Gap**: Framework shows escape hatches but not escalation decision trees:
- When should Spiritmender failure escalate to Pathseeker vs. human?
- How many re-decomposition cycles before human intervention required?
- Should different failure types have different escalation paths?
- How to prevent infinite failure-recovery loops?

**Escalation Scenarios**:
- Spiritmender can't heal validation failures → Pathseeker re-decomposition → Still fails
- Multiple parallel agents escape → Architecture review needed
- Integration tests repeatedly fail → Systemic issue beyond agent capability

---

## Success Criteria Evolution During Implementation
**Referenced in**: success-criteria.md, process-architecture.md

**Question**: How should success criteria adapt when implementation reveals better approaches?

**Current Gap**: Framework defines success criteria but not evolution:
- What happens when implementation discovers better user experience than originally specified?
- Should agents suggest improvements to observable actions during implementation?
- How to balance scope stability with discovered opportunities?
- Who decides whether improvements are in-scope or separate quests?

**Example**:
- Original: "User sees error message for invalid input"
- Discovered: "User sees inline validation with helpful suggestions as they type"
- Decision: Implement discovery or stick to original scope?