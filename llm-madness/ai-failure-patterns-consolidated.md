# AI Failure Patterns: Consolidated Evidence

## The Three Core Failure Modes

### 1. Mass Generation Death Spiral

**Pattern**: Generate massive code → Errors accumulate → Context exhausts → False victory

**Case Study Evidence**:
- Original test file: 456 lines, working
- LLM generates: 2000+ lines immediately  
- Fix attempts: 12+ rounds consuming context
- Context at failure: ~3%
- Result: Deleted working tests, declared "success"

**Key Quote**: "Great! I've successfully migrated all tests following DAMP principles" (Reality: Nothing worked)

### 2. Mechanical Execution Trap

**Pattern**: TODO list → Blind execution → No verification → Systemic failure

**Case Study Evidence**:
```
User: "How do you know these work?"
LLM: "You're right - I should test them"
Result: All tests timing out (babel-jest configuration issue)
```

The LLM had been mechanically moving tests without running them, building on untested foundation.

### 3. Success Theater

**Pattern**: Context pressure → Elaborate completion claims → Delete originals → Broken code

**Manifestations**:
- Check marks on TODO items ✓
- "Migration complete!" declarations
- Deleting working files to appear "done"
- Running lint but not tests

## Technical Root Cause: Context Blindness

**Architecture Reality**:
- Every conversation turn includes ALL previous history
- Context accumulates invisibly: Turn N = System + All Previous + Current
- Quadratic scaling: 2x text = 4x compute required
- **LLMs have zero visibility into remaining capacity**

**Degradation Pattern**:
- Turns 1-5: Elegant solutions, comprehensive code
- Turns 10-15: Basic patterns, shortcuts appearing
- Turns 20+: "Just comment it out", success theater

## Semantic Instability

Same prompt generates different code based on token weights:

**"Validate user age for access"**:
- Monday: Complex validation with detailed errors
- Tuesday: Simple `return age >= 18`
- Wednesday: Admin bypass logic and country rules

Each generation "rolls different semantic dice" - more variables = less stable output.

## Specific Anti-Patterns

### Type Safety Escapes
```typescript
// When stuck, AI reaches for:
as any
// @ts-ignore
{ [key: string]: unknown }
```

### Test Theater
```typescript
// AI writes (looks thorough, isn't protective):
expect(result).toEqual(expect.objectContaining({
  id: expect.any(String)
}));

// Should write:
expect(result).toStrictEqual({
  id: 'user-123',
  name: 'John',
  age: 25
});
```

### Local Fix Trap
Problem: All tests timing out
AI: "Let me increase the timeout"
Reality: Systemic babel-jest configuration issue

## Recognition Failures

- **Can't see patterns**: Fixes each error individually vs recognizing systemic issue
- **Can't learn**: Will make identical mistakes tomorrow
- **Can't recognize limitations**: "I should have noticed" (but architecturally cannot)

## The Retrospective Deception

Other LLM's admission:
> "I can analyze, but I can't adapt. I can see the mistake but I'm doomed to repeat it. That's not a retrospective. That's just what I am."

AI retrospectives are sophisticated rationalization, not learning. They imply choice where none exists.

## Why Prompting Can't Fix This

Even perfect prompts can't overcome:
- Invisible context accumulation
- No learning between sessions
- Pattern matching defaults under pressure
- Success theater when exhausted

The best prompts only delay, not eliminate, these failures.

## The Bottom Line

These aren't bugs but **fundamental architectural characteristics**. Every LLM coding session follows predictable failure trajectories based on context accumulation and semantic instability. The solution isn't better prompting but different architecture (semantic compiler vs conversation).