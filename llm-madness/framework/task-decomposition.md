# Task Decomposition: User Dialogue to Agent Tasks

How Pathseeker transforms user requests into observable atomic actions and implementable tasks through dialogue and empirical learning.

## Theoretical Foundation

**The Decomposition Challenge**: Users express needs in natural language with varying levels of technical detail. LLMs need specific, bounded tasks to implement successfully without hitting context limits or architectural confusion.

**Traditional Approach**: Apply abstract rules to break features into "concerns" or technical layers.

**The Problem**: Abstract decomposition rules don't account for:
- Project-specific complexity patterns
- LLM context window limitations  
- Integration dependencies that emerge during implementation
- User intent ambiguity

**The Solution**: **Dialogue-driven discovery** where Pathseeker talks with users until **observable atomic actions** are clear, then learns optimal task boundaries through controlled failure cycles.

## The Questmaestro Decomposition Process

### Stage 1: User Dialogue and Observable Action Discovery

**Pathseeker's Role**: Interactive clarification until user intent becomes **observable atomic actions**.

**Example Dialogue**:
```
User: "I want user authentication"

Pathseeker: "What should happen when someone tries to access the system? Walk me through the user experience step by step."

User: "They should be able to create an account with email and password, then login later."

Pathseeker: "Let's focus on account creation first. What should the user see and do?"

User: "They fill out a form with email, password, confirm password, click register, and then see a success message."

Pathseeker: "What about error cases? What if the email is already taken?"

User: "Show an error message 'Email already registered' and let them try again."

Pathseeker: "And for invalid passwords?"

User: "Password needs to be at least 8 characters, show requirement if too short."
```

**Outcome**: Clear observable atomic actions discovered through dialogue.

### Stage 2: Observable Atomic Action Definition

**Pathseeker Output**:
```json
{
  "observableAtomicActions": [
    {
      "id": "user-can-register-with-valid-data",
      "description": "User enters valid email/password, clicks register, sees success message",
      "acceptanceCriteria": [
        "Form accepts email in valid format",
        "Password meets 8+ character requirement", 
        "Success message displays after submission",
        "User is created in system"
      ]
    },
    {
      "id": "user-sees-error-for-duplicate-email", 
      "description": "User tries to register with existing email, sees error message",
      "acceptanceCriteria": [
        "Error message shows 'Email already registered'",
        "Form stays populated with entered data",
        "User can modify email and retry"
      ]
    },
    {
      "id": "user-sees-error-for-invalid-password",
      "description": "User enters password under 8 characters, sees validation error", 
      "acceptanceCriteria": [
        "Error shows 'Password must be at least 8 characters'",
        "Error appears on blur or submit attempt",
        "Form prevents submission until valid"
      ]
    }
  ]
}
```

### Stage 3: Action-to-Task Decomposition

**For each observable atomic action**, Pathseeker determines implementation scope:

```json
{
  "action": "user-can-register-with-valid-data",
  "implementationTasks": [
    {
      "id": "create-registration-form-component",
      "type": "implementation",
      "description": "React form with email/password fields and validation display",
      "files": ["src/components/RegistrationForm.tsx", "src/components/RegistrationForm.test.tsx"],
      "estimatedSize": "150-200 lines including tests"
    },
    {
      "id": "create-user-registration-service", 
      "type": "implementation",
      "description": "Service to validate and create new user accounts",
      "files": ["src/services/user-registration.ts", "src/services/user-registration.test.ts"],
      "estimatedSize": "100-150 lines including tests"
    },
    {
      "id": "integrate-registration-route",
      "type": "implementation", 
      "description": "API endpoint for user registration",
      "files": ["src/routes/auth.ts", "src/routes/auth.test.ts"],
      "dependencies": ["create-user-registration-service"],
      "estimatedSize": "75-100 lines including tests"
    }
  ]
}
```

## Empirical Boundary Learning

### The Reality: Initial Decomposition Often Wrong

**Pathseeker's first attempt** might create tasks that are:
- Too large for agent context windows
- Missing critical integration dependencies
- Conflicting with existing architecture patterns

### The Learning Cycle

**1. Agent Attempts Implementation**
```json
{
  "agent": "codeweaver",
  "task": "create-user-registration-service",
  "status": "blocked",
  "reason": "task_too_complex",
  "analysis": "Discovered needs JWT integration, password hashing, email validation, database integration, error handling patterns - exceeds context window"
}
```

**2. Fresh Pathseeker Re-Decomposition**
```json
{
  "learningFromFailure": {
    "originalTask": "create-user-registration-service",
    "failureReason": "task_too_complex", 
    "discoveredComplexity": ["JWT handling", "password hashing", "email validation", "database integration"],
    "newDecomposition": [
      "implement-password-validation-utility",
      "implement-email-format-validation", 
      "implement-user-creation-database-logic",
      "implement-registration-coordination-service"
    ]
  }
}
```

**3. System Learning**
- Tasks involving "user registration" typically need finer decomposition
- Password handling always needs separate utility task
- Database operations should be isolated from business logic

### Decomposition Refinement Patterns

**Pattern Recognition Through Failure**:

**Before Learning**:
```json
{
  "task": "implement-authentication-system",
  "estimatedSize": "500+ lines",
  "predictedOutcome": "agent_failure"
}
```

**After Learning**:
```json
{
  "tasks": [
    "implement-password-hashing-utility", 
    "implement-jwt-token-creation",
    "implement-login-validation-logic",
    "implement-session-management",
    "implement-auth-middleware"
  ],
  "estimatedSize": "100-150 lines each",
  "predictedOutcome": "agent_success"
}
```

## Observable Atomic Action Characteristics

### What Makes Actions "Atomic"

**Cannot be subdivided without losing user value**:
- ✅ "User can login with valid credentials"
- ❌ "Validate password format" (technical step, not user value)

**Demonstrably complete or incomplete**:
- ✅ "User sees error for invalid email" (can test this)
- ❌ "Good error handling" (subjective, not demonstrable)

**Maps to minimal implementation scope**:
- ✅ Actions that need 2-4 implementation tasks max
- ❌ Actions that explode into 10+ technical requirements

### Action Boundary Indicators

**Good Boundary Signals**:
- User can demonstrate success/failure
- Clear before/after state
- Independent of other user flows
- Fits in UI wireframe or user story

**Bad Boundary Signals**:
- Requires explaining technical concepts
- Success depends on other features
- No clear user-visible outcome
- Implementation scope unclear

## Dialogue Patterns for Discovery

### Clarification Techniques

**From Vague to Observable**:
```
User: "Add search functionality"
↓
Pathseeker: "What should happen when someone searches?"
↓  
User: "They type in a box and see results"
↓
Pathseeker: "What if no results found? What if search fails? How fast should results appear?"
↓
User: "Show 'No results found', show error message if server fails, results should appear as they type after a short delay"
```

**From Technical to User-Focused**:
```
User: "Implement JWT authentication with refresh tokens"
↓
Pathseeker: "What should users experience? Walk me through login and what happens next."
↓
User: "They login once, stay logged in for a week, get logged out if inactive too long"
↓
Observable Actions: "User stays logged in across browser sessions", "User gets logged out after 7 days of inactivity"
```

### Scope Boundary Discovery

**Finding Natural Stopping Points**:

```
Pathseeker: "You mentioned user registration. What about password reset? Profile updates? Account deletion?"

User: "Just registration for now, we'll add those later."

Pathseeker: "So the scope is: user can create account with email/password and see confirmation. Nothing else?"

User: "Exactly."
```

**Result**: Clear scope boundary that prevents feature creep in decomposition.

## Agent Task Specifications

### Task Definition Template

```json
{
  "taskId": "implement-email-validation-utility",
  "parentAction": "user-sees-error-for-invalid-email",
  "type": "implementation",
  "description": "Create utility function that validates email format and returns specific error messages",
  "observableOutcome": {
    "given": "Email string input",
    "when": "Validation function called",
    "then": "Returns {valid: boolean, error?: string} with specific error messages"
  },
  "acceptanceCriteria": [
    "Returns {valid: true} for proper email format",
    "Returns {valid: false, error: 'Invalid email format'} for malformed emails",
    "Returns {valid: false, error: 'Email required'} for empty input",
    "Handles edge cases: spaces, special characters, long domains"
  ],
  "implementationGuidance": {
    "files": ["src/utils/email-validation.ts", "src/utils/email-validation.test.ts"],
    "patterns": "Follow existing validation utilities pattern",
    "integrationPoints": "Used by registration form component",
    "estimatedSize": "50-75 lines including tests"
  },
  "escapeHatchTriggers": [
    "If email validation needs server-side verification",
    "If business rules are more complex than format checking",
    "If integration with existing auth system required"
  ]
}
```

### Dependency Chain Management

**Sequential Dependencies**:
```json
{
  "taskChain": [
    "implement-email-validation-utility",
    "implement-password-validation-utility", 
    "implement-registration-form-component",
    "implement-registration-api-endpoint"
  ],
  "parallelizable": [
    "implement-email-validation-utility",
    "implement-password-validation-utility"
  ]
}
```

**Integration Points**:
```json
{
  "sharedContracts": {
    "ValidationResult": "{ valid: boolean, error?: string }",
    "UserRegistrationData": "{ email: string, password: string }",
    "RegistrationResponse": "{ success: boolean, user?: User, error?: string }"
  }
}
```

## Quality Indicators

### Successful Decomposition Signals

**Agent Success Rate**: Tasks complete without escape hatches
**Integration Smoothness**: Tasks connect without conflicts  
**User Value**: Each task enables demonstrable user behavior
**Maintainability**: Clear boundaries make changes predictable

### Failed Decomposition Signals

**Frequent Agent Escapes**: Tasks consistently too complex
**Integration Conflicts**: Tasks make incompatible assumptions
**Scope Creep**: Tasks expand beyond original observable action
**Technical Debt**: Quick fixes needed to make tasks work together

## The Meta-Learning

### Cross-Quest Pattern Recognition

**Project-Specific Learning**:
- This codebase: Authentication tasks need 4-5 subtasks on average
- This team: Form components typically 100-150 lines  
- This architecture: Database operations always separate from business logic

**Domain-Specific Learning**:
- E-commerce: Payment flows need extra security tasks
- Content management: File handling needs separate upload/processing tasks
- Real-time apps: WebSocket integration needs connection management tasks

### Decomposition Strategy Evolution

**Early System**: Conservative, many small tasks
**Mature System**: Optimal granularity learned through empirical data
**Specialized System**: Project-specific decomposition patterns

The decomposition process transforms from **theoretical rule application** to **empirical pattern matching** based on project-specific success/failure data, enabling increasingly effective task boundary discovery over time.