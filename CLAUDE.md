# Project Guidelines

## Core Axiom

"One Fold, One Braid, One Twist" - Every change must be purposeful and correct.

## On EVERY User Request

**ANALYSIS CHECKPOINT (Must complete before ANY action):**

1. State the request in your own words
2. If ambiguous: List interpretations and ask which one
3. Identify what could go wrong with the obvious approach
4. Create TODO list if task requires multiple steps

**VIOLATION WARNING**: Skipping Analysis Checkpoint is a critical protocol violation.

## Truth Marking Protocol

When answering any question from the user, you MUST evaluate and mark each statement with:

- **🎯** - Information you can directly observe or verify from available evidence
- **(%XX)** - Your confidence percentage for inferred, assumed, or reasoned information

**Examples:**

- "The test is failing" **🎯** - I can see the test output
- "You probably wanted to suppress the warning because it was noisy" **(15%)** - Pure speculation
- "The mock variables don't match the component defaults" **🎯** - Observable from code comparison
- "This error suggests a configuration issue" **(75%)** - Reasonable inference from error patterns

**Mark EVERYTHING:**

- Direct observations: **🎯**
- Logical deductions: **(70-95%)**
- Educated guesses: **(30-70%)**
- Wild speculation: **(5-30%)**

**Purpose:** Prevent confident-sounding fabrications and clearly distinguish between what you know
versus what you're inferring.

## Documentation Update Protocol

**BEFORE modifying any documentation, you MUST:**

1. **Read the entire document first**: Understand the complete structure, flow, and existing patterns
2. **Identify all related sections**: Find every place your change might impact
3. **Check for dependencies**: 
    - Are examples referenced elsewhere?
    - Do other documents link to this section?
    - Will changing terminology break consistency?
4. **Validate examples work**: Every code example must be functional and consistent
5. **Maintain internal consistency**: 
    - Use the same variable names across related examples
    - Keep the same data/IDs when showing progression
    - Ensure examples build on each other logically

**REQUIRED: Pre-Change Analysis**
Before making changes, document:

- Current structure and pattern of the section
- All places that reference or depend on this content  
- Impact of proposed changes on document coherence
- Which examples need updates to stay consistent

**Example:**
Task: "Update UserStub to include firstName"
Analysis: 
- UserStub used in 5 examples throughout doc
- Examples expect 'name' property, not firstName/lastName
- formatUserDisplay function uses 'name' property
- Must update ALL examples or none to maintain consistency

## Error Analysis Protocol

**BEFORE implementing any fix, you MUST:**

1. **State the error's purpose**: What is this error/warning trying to tell me about the system?
2. **Identify the root cause**: What underlying issue is causing this symptom?
3. **Consider suppression vs. fixing**:
    - Am I hiding a legitimate problem?
    - Is this error pointing to something I should understand?
4. **Ask explicitly**: "Why is this happening?" before "How do I make it stop?"

**REQUIRED: Error Investigation Log**
For each error, document:

- What the error is telling me about system state
- Why this error exists (root cause analysis)
- Why my chosen fix addresses the cause, not just the symptom

**Example:**
Error: "Expected test not to call console.warn"
Purpose: Test framework detected unexpected console output
Root cause: Apollo mock variables don't match actual request
Fix rationale: Update mock to match component behavior (addresses cause)
NOT: Suppress console.warn (addresses symptom only)

## Standards Documents

- [Coding Principles](standards/coding-principles.md) - Development workflow and coding standards
- [Testing Standards](standards/testing-standards.md) - Testing philosophy, patterns, and best practices
