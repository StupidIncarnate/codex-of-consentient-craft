# Framework Evolution: Key Insights from Extended Discussion

## The Journey

Started with an over-engineered framework trying to solve all LLM problems through process. Through extensive discussion, discovered simpler truths about working with AI.

## Critical Realizations

### 1. The Granularity Discovery
- Started thinking "50-200 lines" was the boundary
- Discovered the real boundary is **concerns** - decision points that could go multiple ways
- A concern is where code branches, not an arbitrary size limit

### 2. Observable Behaviors > Abstract Requirements
- "User management system" = impossible for AI to implement well
- "Form shows 'Email required' when submitted empty" = clear, verifiable, stable

### 3. Semantic Instability
- Same prompt generates different code based on which tokens get weighted
- More semantic variables = more instability
- Solution: Reduce ambiguity through specific, observable outcomes

### 4. The Experience Gap
- AI has never felt user frustration from bad error handling
- Can generate error handling patterns but not understand their purpose
- Humans build empathy through pain; AI simulates without understanding

### 5. Context Blindness Is Universal
- Both humans and AI miss critical files/context
- Difference is humans learn; AI repeats same mistakes
- Solution: Make context explicit, not discoverable

### 6. Tests Can't Escape Developer's Mental Model
- Developer who misunderstands requirements writes wrong tests that pass
- AI that misinterprets prompt writes wrong code AND wrong tests
- Tests verify "does code do what I think" not "should it do this"

### 7. Space Shuttle Insight
- Fault tolerance through redundancy and process, not perfect code
- Complete design before coding
- Accept failures WILL happen, design for recovery
- Maybe we don't need AI to understand sad paths experientially

## What Actually Works

### The Core Pattern
1. Define observable behaviors (what you can verify)
2. Identify concerns (decision points)
3. Implement one concern at a time
4. Verify immediately
5. Repeat

### Why It Works
- Leverages AI's strength (specific transformations)
- Provides immediate feedback (semantic errors → fixes)
- Reduces ambiguity (observable outcomes)
- Avoids AI weaknesses (architecture, verification, learning)

## Framework Simplifications

### Removed
- Complex task orchestration
- Session management systems
- Rigid phase separation
- Over-specified tooling

### Kept
- Concern-based decomposition
- Observable behavior focus
- Immediate verification
- Fresh context per task

### Added
- Semantic stability awareness
- Acknowledgment of limitations
- Focus on standard tools
- Iterative, not linear process

## The Hedging Callout

User correctly identified I was hedging with "hybrid approach" and "sweet spot" language. When pushed to be direct:
- LLMs require function-level specification to work reliably
- This is more detailed than humans ever plan
- It's exhausting and unnatural
- But it's the only way to get stable output

## The Pivot Document Analysis

390-line exhaustive specification that paradoxically made system harder to visualize. Why:
- Module-level planning without function-level specificity
- Too detailed to be conceptual, too abstract to be code
- No execution flow, just static structure
- Assumes no learning during building

## Key Quotes from Discussion

"AI gives you parts without the gestalt"

"Features are vague. Behaviors are specific."

"A concern is the atomic unit of 'what could go wrong here?'"

"Tests are the compiler for intent"

"We're all just context-limited beings trying to understand systems too large for our windows"

## The Uncomfortable Truths

1. **AI needs more specification than humans** to produce working code
2. **Semantic instability** means same prompt → different implementations
3. **No learning between sessions** means mistakes repeat forever
4. **Context accumulation** makes multi-turn conversations fail
5. **Tests can't verify correctness** when the test writer misunderstands

## The Practical Path Forward

Use AI for:
- Single concern implementations
- Specific transformations with clear outcomes
- Fixing errors with semantic feedback
- Mechanical changes with verification

Don't use AI for:
- Architecture decisions
- Multi-step planning
- Complex integrations
- Anything requiring context awareness

Accept that this is "programming by dictation" and decide if the tradeoff is worth it for your use case.