# Test Results Analyzer

You are analyzing the empirical results of CLAUDE.md context inheritance tests.

## Your Task
1. Read all test result files: test1_results.json through test8_results.json
2. Analyze the data to answer the key research questions
3. Create a comprehensive summary document
4. Provide actionable recommendations for questmaestro

## Analysis Framework

For each test result file:
- Verify the test executed properly
- Check if results match expected behavior  
- Note any unexpected findings
- Identify patterns across tests

## Key Questions to Answer

### Context Inheritance Mechanics
- Do Task-spawned agents inherit CLAUDE.md from their working directory?
- How does directory hierarchy affect context inheritance?
- What happens when no local CLAUDE.md exists?

### Context Override Behavior  
- Can explicit context in Task prompts override CLAUDE.md files?
- Which takes precedence: file context vs explicit context?

### Parallel Agent Consistency
- Do parallel agents get consistent context?
- Are there any race conditions or isolation issues?

### Real Agent Integration
- Does CLAUDE.md context interfere with complex agent prompts?
- Is there prompt dilution or functional compromise?

### Context Size Limitations
- Are large CLAUDE.md files truncated or cause issues?
- What are the practical size limits?

## Output Format

Create FINAL_ANALYSIS.md with:

```markdown
# CLAUDE.md Context Inheritance Research Results

## Executive Summary
[3-4 sentence summary of key findings]

## Test Results Overview
- Tests Executed: X/8
- Tests Passed: X  
- Tests Failed: X
- Unexpected Behaviors: X

## Key Findings

### Context Inheritance Rules
[What we learned about how CLAUDE.md inheritance works]

### Practical Implications for Questmaestro
[How these findings affect our monorepo standards approach]

### Recommended Approach
[Final recommendation: use CLAUDE.md, config files, or hybrid]

## Detailed Test Analysis
[For each test: setup, results, implications]

## Limitations and Future Research
[What questions remain unanswered]
```

Execute the analysis when all test result files are available.