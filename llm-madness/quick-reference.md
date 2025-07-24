# Quick Reference: Practical Patterns

## Identifying Concerns

### Look for Decision Points
```typescript
function processUser(data: unknown) {
  if (!isValidUser(data)) throw new Error();     // Validation concern
  if (data.age < 18) return createMinorAccount(); // Business logic concern
  await saveToDatabase(account);                  // Persistence concern
  await sendWelcomeEmail(account);               // Notification concern
}
```

### Natural Boundaries
- System boundaries (API calls, database)
- State transitions (loading → loaded)
- Data transformations (raw → formatted)
- User interactions (click, submit)
- Error boundaries (try/catch)

## Observable Behavior Templates

### Basic Format
```
Given: [Initial state]
When: [User action or trigger]
Then: [Observable outcome]
```

### Examples
```
Given: User on login page with empty form
When: User clicks submit
Then: Form shows "Email required" below email field

Given: Valid user credentials entered
When: User submits login form
Then: User sees dashboard within 2 seconds

Given: Network request in progress
When: Request takes > 500ms
Then: Loading spinner appears
```

## Task Specification Template

```yaml
task: "Validate email for registration"
concern: "Email validation"
behavior: "Show error for invalid email format"

observable_outcome:
  - valid("user@example.com") → {valid: true}
  - invalid("notanemail") → {valid: false, error: "Invalid email format"}
  - empty("") → {valid: false, error: "Email required"}

context_needed:
  - Use existing validation patterns from utils/validation.ts
  - Return {valid: boolean, error?: string}
  
verification:
  - Test with valid emails
  - Test with invalid formats  
  - Test with edge cases (empty, null)
```

## Semantic Error Feedback

### Pattern
```
Technical Error: [What compiler said]
Semantic Meaning: [What it means]
Suggested Fix: [How to fix it]
```

### Examples
```
Technical: "Property 'name' does not exist on type '{}'"
Semantic: "The object needs a 'name' property"
Fix: "Add interface with name: string or cast as User type"

Technical: "Cannot read property 'x' of undefined"
Semantic: "Trying to access x on something that doesn't exist"
Fix: "Add null check before accessing property"
```

## Common Patterns

### Validation Concern
```typescript
function validateEmail(email: string): ValidationResult {
  if (!email) return { valid: false, error: 'Required' };
  if (!email.includes('@')) return { valid: false, error: 'Invalid format' };
  return { valid: true };
}
```

### Data Transformation Concern
```typescript
function transformApiResponse(raw: ApiResponse): UserViewModel {
  return {
    id: raw.user_id,
    name: raw.full_name,
    email: raw.email_address,
    joined: new Date(raw.created_at)
  };
}
```

### Loading State Concern
```typescript
function DataList() {
  const [loading, setLoading] = useState(false);
  
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data.length) return <EmptyState />;
  return <List items={data} />;
}
```

## AI Prompting Patterns

### For Implementation
```
TASK: Implement email validation for user registration

CONCERN: Validate email format and check for banned domains

OBSERVABLE BEHAVIOR:
- Returns {valid: true} for valid emails
- Returns {valid: false, error: 'Invalid format'} for bad format
- Returns {valid: false, error: 'Domain not allowed'} for banned domains

CONTEXT:
- Banned domains list in config/banned-domains.ts
- Use existing ValidationResult type
- Follow pattern from utils/validators.ts

SUCCESS CRITERIA:
- All test cases pass
- TypeScript compiles without errors
- Handles edge cases (null, empty, special chars)
```

### For Fixes
```
ERROR: TypeScript error: Property 'name' does not exist on type 'User | undefined'

CODE CONTEXT:
function greetUser(user?: User) {
  return `Hello ${user.name}`;  // Error here
}

FIX NEEDED: Handle the case where user might be undefined
```

## Red Flags in AI Output

### Watch for:
```typescript
// Type escapes
as any
// @ts-ignore

// Generic error handling
catch (e) { console.error(e); }

// Test theater
expect.objectContaining({ id: expect.any(String) })

// Missing edge cases
// No null checks
// No error states
// No loading states
```

## Integration Checklist

After implementing each concern:
- [ ] Code compiles (TypeScript)
- [ ] Linter passes (ESLint)
- [ ] Tests pass
- [ ] Manually verified behavior
- [ ] Connected to existing code
- [ ] Error cases handled

## The Core Loop

```
1. Define observable behavior
2. Identify concern (decision point)
3. Write task specification
4. AI implements concern
5. Run validation
6. Fix with semantic feedback if needed
7. Verify behavior manually
8. Commit and continue
```

This is the practical application of all framework principles.