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

## Coding Principles

See [Coding Principles](standards/coding-principles.md) for detailed development workflow and coding standards.
