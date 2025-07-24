# Semantic Stability in AI Code Generation

## The Problem

AI code generation suffers from **semantic instability** - the same prompt produces different implementations based on which tokens get higher weights during generation.

## Example

```typescript
// Prompt: "Validate user age for access"

// Generation 1 (emphasizes "validate")
function validateUserAge(user: User): ValidationResult {
  if (!user.age) return { valid: false, error: "Age required" };
  if (user.age < 0) return { valid: false, error: "Invalid age" };
  return { valid: true };
}

// Generation 2 (emphasizes "access")
function validateUserAge(user: User): boolean {
  return user.age >= 18; // Assumes access = adult
}

// Generation 3 (emphasizes "user")
function validateUserAge(user: User): boolean {
  if (user.isAdmin) return true; // Admins bypass
  return user.age >= user.country.legalAge;
}
```

## Why This Matters

1. **Regenerating changes behavior** - Same prompt, different results
2. **Tests become brittle** - Testing specific interpretation, not intent
3. **Refactoring is impossible** - Can't preserve behavior you can't predict
4. **Code review is meaningless** - Is this the "right" interpretation?

## The Complexity Multiplication

Each semantic variable adds dimensional complexity:

```
"Validate user age for system access with parental consent"
         ↓      ↓       ↓      ↓           ↓
      [user]  [age] [system] [access] [consent]
```

More semantic variables = more possible interpretations = less stable output.

## Mitigation Strategies

### 1. Reduce Semantic Variables
```
Bad:  "Handle user authentication with proper validation"
Good: "Check if password matches hash using bcrypt"
```

### 2. Specify Observable Outcomes
```
Bad:  "Validate the user input"
Good: "Return {valid: false, error: 'Email required'} when email is empty"
```

### 3. Provide Concrete Examples
```
Bad:  "Add appropriate error handling"
Good: "When network fails, throw NetworkError with retry count"
```

### 4. Lock Critical Interpretations
```typescript
// Provide the interface to lock interpretation
interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Now AI must match this structure
```

## The Fundamental Issue

Unlike humans who have consistent biases, AI has **inconsistent interpretations**. Each generation rolls different semantic dice.

The more abstract the requirement, the more semantic dimensions, the more unstable the output.

## Practical Impact

This is why:
- Small, specific tasks work better than large, vague ones
- Observable behaviors matter more than feature descriptions
- Fresh contexts can produce completely different code
- Testing AI-generated code is testing "which interpretation" not "correct behavior"

The goal isn't to eliminate semantic variation but to **constrain it to acceptable bounds** through specific, observable requirements.