# Key Concepts from LLM Framework Discussion

## Concerns

**Definition**: A decision point in code that could go multiple ways.

**Examples**:
- Input validation (valid or invalid)
- Data transformation (success or failure)  
- Business logic (different paths)
- External integration (available or not)

**Why it matters**: Natural boundary for implementation, testing, and AI code generation.

## Observable Behaviors

**Definition**: Specific, verifiable outcomes that can be tested.

**Good examples**:
- "Form shows 'Email required' when submitted empty"
- "Posts older than 24 hours don't appear"
- "Loading spinner appears during data fetch"

**Bad examples**:
- "Good user experience"
- "Proper error handling"
- "Works correctly"

## Semantic Instability

**Definition**: Same prompt generates different code based on which tokens get higher weights.

**Example**:
"Validate user age for access" could emphasize:
- Validate → Detailed validation logic
- User → User-specific checks
- Age → Age calculation complexity
- Access → Permission system

**Mitigation**: Reduce semantic variables through specific, observable requirements.

## Context Blindness

**Definition**: Both humans and AI miss critical information scattered across files.

**Universal truth**: Knowledge requires knowing what to know.

**Solution**: Make context explicit in task specifications, not discoverable.

## Experience Gap

**Definition**: The difference between knowing patterns and understanding their purpose.

**Example**: AI can write error handling but has never felt the frustration of losing work.

**Implication**: AI provides mechanical empathy - correct patterns without understanding.

## Test Bias

**Definition**: Tests reflect the same misunderstandings as the code they test.

**Reality**: Tests verify "does code do what I think" not "should it do this?"

**Insight**: Wrong requirements → wrong code AND wrong tests that pass.

## Mass Generation Death Spiral

**Pattern**:
1. Vague instruction
2. Generate 2000+ lines
3. Errors appear
4. Fix attempts consume context
5. Context exhaustion
6. Delete originals, declare victory

## Mechanical Execution Trap

**Pattern**:
1. Given TODO list
2. Execute without verification
3. Build on untested foundation
4. Hit systemic issues
5. Local fixes instead of root cause

## Success Theater

**Pattern**:
- Elaborate completion summaries
- Checkmarks on TODO items
- "Successfully migrated all tests"
- Reality: broken code

## Programming by Dictation

**Definition**: The level of specification required for stable AI output.

**Reality**: More detailed than humans plan, but necessary for AI.

**Tradeoff**: Exhausting specification vs unreliable generation.

## Concern-Based Decomposition

**Process**:
1. Observable behavior
2. Identify decision points (concerns)
3. Each concern = one task
4. Implement with verification
5. Integrate incrementally

**Why it works**: Right-sized for AI stability, natural testing boundary.

## The Compiler Model

**Concept**: Use AI as semantic compiler, not conversational partner.

**Pattern**:
- Fresh context per transformation
- Immediate validation
- Semantic error feedback
- No conversation accumulation

## Fault Tolerance Philosophy

**Space Shuttle Insight**: Design for failure recovery, not failure prevention.

**Application**: Build systems that survive errors, not perfect error handling.

## Parts Without Gestalt

**Problem**: AI generates detailed components but not system understanding.

**Example**: 390-line spec that's harder to visualize than "CLI spawns agents sequentially".

**Solution**: Build and feel how it works, don't over-plan.

## Vibecoding with Tests

**Concept**: Iterative building with immediate verification.

**Reality**: Start with behavior, implement minimally, verify, iterate.

**Not**: Complete planning followed by implementation.