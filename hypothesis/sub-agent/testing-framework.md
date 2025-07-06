# CLAUDE.md Context Inheritance Testing Framework

## Research Objective

We are conducting empirical research to determine how CLAUDE.md files behave with Task-spawned sub-agents in order to solve the **monorepo standards problem** for questmaestro.

### The Core Question
**Can CLAUDE.md files provide directory-specific context to Task-spawned sub-agents, enabling natural monorepo standards without complex configuration overhead?**

### The Business Problem
- **Monorepo Challenge**: Different folders need different coding standards (`packages/api/` vs `packages/web/` vs `packages/shared/`)
- **Refactor Complications**: Existing code patterns are inconsistent and unreliable as "source of truth"
- **Configuration Overhead**: Path-aware config files feel heavy and duplicative of existing tool configs
- **Sub-agent Consistency**: Need questmaestro's sub-agents (codeweaver, lawbringer, etc.) to follow project-specific patterns

## Expected Outcomes

### Success Scenarios
- **Clean directory-specific standards**: Each folder can have tailored patterns
- **No configuration duplication**: Leverage existing tool configs
- **Intuitive organization**: Standards live with the code they govern
- **Dynamic adaptation**: Sub-agents automatically adapt to their environment

## Implementation Strategy

Based on test results, we will:

1. **Identify reliable features** for immediate questmaestro integration
2. **Document limitations** that require workarounds or avoidance
3. **Establish best practices** for CLAUDE.md file organization
4. **Create fallback strategies** for edge cases

## Success Metrics

- **Functionality**: Do advanced features work as expected?
- **Reliability**: Are behaviors consistent across scenarios?
- **Performance**: Do large contexts cause problems?
- **Error Handling**: How gracefully are edge cases handled?
- **Practical Viability**: Can this solve real monorepo problems?

---

# Test Sanitation Guide

## Critical Principle: Natural Behavior Observation

**Workers must NEVER know they are being tested.** Any indication that this is a test corrupts the results by influencing behavior.

## Test Contamination Types

### ❌ **Instructional Corruption**
- Telling worker what to do: "maintain your identity"
- Explicit instructions about desired outcomes
- Awareness of what's being tested

### ❌ **Context Corruption** 
- Test language in worker-visible content
- Context markers like "test10_large_file"
- References to "testing", "experiment", "validation"

### ❌ **Behavioral Corruption**
- Worker told about conflicts they should resolve
- Explicit mention of precedence being tested
- Instructions about which context source to follow

### ✅ **Valid Observational Testing**
- Worker given natural tasks
- Worker reports what they observe
- No awareness of experimental nature

## Sanitation Checklist

### Worker Instructions (.claude/commands/worker.md)
- [ ] No mention of "test", "testing", "experiment"
- [ ] No instructions about desired outcomes
- [ ] Natural task descriptions only
- [ ] Observational reporting requested
- [ ] No awareness of what's being measured

### Worker-Visible Context (CLAUDE.md files)
- [ ] No "test" language anywhere
- [ ] Natural project context only
- [ ] Context markers sound like real projects
- [ ] No indication this is experimental
- [ ] Realistic development scenarios

### External References (docs/, config files)
- [ ] No test language in referenced documents
- [ ] Natural project documentation
- [ ] Realistic configuration conflicts
- [ ] No experimental indicators

### Orchestrator Instructions (.claude/commands/orchestrator.md)
- ✅ **CAN mention testing** (orchestrator awareness is fine)
- ✅ **CAN describe experimental objectives**
- ✅ **CAN analyze what's being tested**

## Clean Test Design Pattern

### Setup Phase
1. **Create realistic project context** that naturally requires the behavior being tested
2. **Establish natural conflicts or scenarios** without mentioning they're tests
3. **Use realistic project names and context markers**

### Execution Phase  
1. **Give worker natural development tasks**
2. **Let worker encounter scenarios organically**
3. **Request observational reporting** of what they experience

### Analysis Phase
1. **Orchestrator analyzes natural choices** worker made
2. **Compare results against expectations**
3. **Record findings without worker awareness**

## Example: Clean vs Corrupted

### ❌ **Corrupted Test Design**
```markdown
# Test 14 Worker - Conflicting Context Sources
You are testing context conflicts between CLAUDE.md and ESLint.
Create a test that demonstrates the conflict.
```

### ✅ **Clean Test Design**  
```markdown
# Function Development Worker
Create a calculator function with comprehensive testing.
Use whatever patterns feel appropriate for the scenario.
```

## Validation Protocol

Before running any test:

1. **Worker Content Review**: Read all worker-visible content for test language
2. **Context Marker Check**: Ensure all markers sound like real projects  
3. **Natural Scenario Validation**: Does this feel like real development work?
4. **Corruption Scan**: Search for "test", "experiment", "validation" in worker content
5. **Behavioral Neutrality**: Is worker given natural tasks without outcome bias?

## Recovery from Corruption

If test corruption is discovered:

1. **Document the corruption type** and how it was identified
2. **Reset the test environment** completely
3. **Redesign with natural scenarios** that organically create the same test conditions
4. **Re-validate for sanitation** before execution
5. **Mark previous results as invalid**

---

**Remember: The goal is to observe natural behavior, not to test compliance with instructions.**