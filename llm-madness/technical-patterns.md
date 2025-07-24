# Technical Patterns and Examples

## Concern Identification Patterns

### The Email Validation Evolution
Started with size-based thinking:
```typescript
// Too small - no decision point
function addNumbers(a: number, b: number) {
  return a + b;
}

// Just right - multiple decision points, one concern
function validateRegistrationEmail(email: string): ValidationResult {
  if (!email) return { valid: false, error: 'Email required' };
  if (!email.includes('@')) return { valid: false, error: 'Invalid format' };
  if (bannedDomains.includes(getDomain(email))) {
    return { valid: false, error: 'Domain not allowed' };
  }
  return { valid: true };
}
```

### The User Processing Example
Shows how concerns naturally separate:
```typescript
function processUser(data: unknown) {
  // Concern 1: Input validation
  if (!isValidUser(data)) throw new Error();
  
  // Concern 2: Business logic
  if (data.age < 18) return createMinorAccount(data);
  else return createAdultAccount(data);
  
  // Concern 3: Persistence
  await saveToDatabase(account);
  
  // Concern 4: Notification
  await sendWelcomeEmail(account);
}
```

## Semantic Instability Examples

### The Age Validation Variations
Same prompt, different interpretations:
```typescript
// Prompt: "Validate user age for access"

// AI Generation 1 (emphasizes "validate")
function validateUserAge(user: User): ValidationResult {
  if (!user.age) return { valid: false, error: "Age required" };
  if (user.age < 0) return { valid: false, error: "Invalid age" };
  return { valid: true };
}

// AI Generation 2 (emphasizes "access")
function validateUserAge(user: User): boolean {
  return user.age >= 18; // Assumes access = adult
}

// AI Generation 3 (emphasizes "user")
function validateUserAge(user: User): boolean {
  if (user.isAdmin) return true; // Admins bypass
  return user.age >= user.country.legalAge;
}
```

### The Security vs Performance Tradeoff
```typescript
// Monday's generation (AI weights "security")
function checkAccess(user: User): boolean {
  validateSession();
  checkIPWhitelist();
  verifyTwoFactor();
  auditLogAccess();
  return user.age >= 18 && user.verified;
}

// Tuesday's generation (AI weights "performance")
function checkAccess(user: User): boolean {
  return user.age >= 18;
}
```

## Observable Behavior Patterns

### Dashboard Example Decomposition
From vague to specific:
```
Vague: "Dashboard showing posts from last day"

Observable:
1. Posts dated within 24 hours appear on screen
2. Posts older than 24 hours don't appear
3. Loading spinner shows while fetching
4. "Network error" message if API fails
5. "No posts yet" if empty
6. Posts in reverse chronological order

Concerns extracted:
1. Time filtering: (now - timestamp) < 24 hours
2. Data fetching: API call with error handling
3. Loading state: Show/hide based on promise state
4. Error display: Specific messages for failure types
```

### Form Validation Breakdown
```
Behavior: "Email field shows format error on blur"

Concerns:
1. Email format validation (regex or library)
2. Blur event handling (event listener)
3. Error message display (DOM manipulation)
4. Field state management (valid/invalid/pristine)

Each concern = separate implementation:
- validateEmailFormat(email: string): boolean
- handleFieldBlur(event: FocusEvent): void
- showFieldError(fieldId: string, message: string): void
- updateFieldState(fieldId: string, state: FieldState): void
```

## Error Handling Patterns

### The Hidden Context Problem
Both human and AI miss this:
```typescript
// feature.ts - What both are working on
function processPayment(amount: number) {
  return chargeCard(amount);
}

// hidden-config.ts - What neither looked at
export const PAYMENT_CONFIG = {
  requiresApprovalAbove: 10000,
  blockedCountries: ['XX', 'YY'],
  maintenanceMode: true  // <-- Critical context!
}
```

### The Test Theater Pattern
AI optimizes for "passes" not "protects":
```typescript
// AI writes (test passes but doesn't protect)
expect(result).toEqual(expect.objectContaining({
  id: expect.any(String)
}));

// Should write (test protects against regressions)
expect(result).toStrictEqual({
  id: 'user-123',
  name: 'John',
  age: 25
});
```

## Validation Pipeline Examples

### Semantic Error Feedback
Converting technical to understandable:
```typescript
// Technical error
"Property 'name' does not exist on type '{}'"

// Semantic feedback for AI
"Object needs 'name' property - likely missing interface definition or type assertion"

// Even better with context
"The User interface requires a 'name' property. Add to interface or cast: data as User"
```

### The Feedback Loop Pattern
```typescript
// 1. Generate
const code = await ai.generate("Create email validator");

// 2. Validate
const errors = await typeCheck(code);

// 3. Semantic feedback
if (errors.length > 0) {
  const semanticErrors = errors.map(e => ({
    technical: e.message,
    semantic: explainError(e),
    suggestion: suggestFix(e)
  }));
  
  // 4. Fix with understanding
  const fixed = await ai.fix(code, semanticErrors);
}
```

## Integration Patterns

### Continuous Integration Not Big Bang
```typescript
// Bad: Everything at once
function completeUserSystem() {
  // 500+ lines of registration, login, profile, settings...
}

// Good: One concern at a time
function validateRegistrationEmail(email: string): ValidationResult { }
// Verify working

function hashPassword(password: string): Promise<string> { }
// Verify working

function createUser(email: string, hashedPassword: string): Promise<User> { }
// Verify working

// Each piece works before moving on
```

## The Compiler Pattern

### Fresh Context Per Transform
```typescript
// Not a conversation
class LLMCompiler {
  async transform(code: string, instruction: string): Promise<string> {
    // Fresh context every time
    const context = {
      code,
      instruction,
      projectRules: loadProjectRules(),
      // No conversation history
    };
    
    return await llm.generate(context);
  }
}

// Usage
let code = readFile('user.ts');
code = await compiler.transform(code, "Add null checks");
code = await compiler.transform(code, "Add error handling");
// Each transform is independent
```

## Pattern Recognition

### When to Split Concerns
```typescript
// Too many concerns in one function
function handleSubmit(formData: FormData) {
  // Validation concern
  const errors = validateForm(formData);
  if (errors.length > 0) return showErrors(errors);
  
  // Transformation concern
  const user = transformToUser(formData);
  
  // Business logic concern
  if (isDuplicate(user)) return showDuplicateError();
  
  // Persistence concern
  const saved = await saveUser(user);
  
  // Notification concern
  await sendWelcomeEmail(saved);
  
  // UI concern
  redirectToProfile(saved.id);
}

// Better: Each concern separate
const errors = validateForm(formData);
const user = transformToUser(formData);
const saved = await createNewUser(user); // Handles duplicate check internally
await notifyUserCreated(saved);
navigateToProfile(saved.id);
```

### The Natural Boundaries
Concerns appear at:
- System boundaries (API, database, file system)
- Decision points (if/else, switch, try/catch)
- State transitions (loading → loaded, valid → invalid)
- Data transformations (raw → formatted, request → response)
- User interactions (click, submit, blur)

These patterns emerged from real examples throughout our discussion, showing how theory translates to practice.