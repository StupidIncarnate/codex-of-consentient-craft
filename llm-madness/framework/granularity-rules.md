# Task Granularity Rules

## Core Principle: One Concern = One Task

A **concern** is a decision point in code that could go multiple ways. Each concern should be implemented and verified independently.

## What Is a Concern?

Concerns appear where code must:
- **Validate input** (could be valid or invalid)
- **Transform data** (could succeed or fail)
- **Make business decisions** (could go down different paths)
- **Interact with external systems** (could be available or not)
- **Manage state** (could conflict or succeed)

### Example: Breaking Down a Feature
```typescript
// Feature: "User can update their profile"

// Concern 1: Input validation
validateProfileData(input); // Could throw validation errors

// Concern 2: Authorization  
checkUserCanEdit(userId, profileId); // Could deny access

// Concern 3: Business rules
applyProfileConstraints(updates); // Could reject based on rules

// Concern 4: Persistence
saveProfileUpdates(profileId, updates); // Could fail to save

// Concern 5: Side effects
notifyProfileWatchers(profileId); // Could fail to notify
```

Each concern has:
- **Clear input/output**
- **Specific failure modes**
- **Observable outcomes**
- **Independent verification**

## Size Guidelines by Concern Type

### Validation Concerns (50-150 lines)
```typescript
// Observable: Returns specific errors for invalid input
function validateUserRegistration(data: unknown): ValidationResult {
  // Check required fields
  // Validate email format
  // Check password strength
  // Return specific errors
}
```

### Business Logic Concerns (100-300 lines)
```typescript
// Observable: Applies correct discount based on rules
function calculateOrderDiscount(order: Order, user: User): Discount {
  // Check user tier
  // Apply promotional rules
  // Calculate final discount
  // Return breakdown
}
```

### Data Transformation Concerns (50-200 lines)
```typescript
// Observable: Converts format A to format B correctly
function transformApiResponse(raw: ApiResponse): UserViewModel {
  // Map fields
  // Handle nested data
  // Apply defaults
  // Return consistent structure
}
```

### Integration Concerns (100-300 lines)
```typescript
// Observable: Successful API call or specific error
async function fetchUserPosts(userId: string, timeRange: TimeRange): Promise<Post[]> {
  // Build request
  // Handle response
  // Parse data
  // Handle errors specifically
}
```

### UI Component Concerns (150-400 lines)
```typescript
// Observable: Renders states correctly
function PostList({ posts, loading, error }: Props) {
  // Show loading state
  // Show error state
  // Show empty state
  // Show posts
  // Handle interactions
}
```

## The Granularity Test

Before creating a task, verify:

### 1. Single Concern Test
Can you describe this task as handling ONE decision point?
- ✅ "Validate that email format is correct"
- ❌ "Handle user registration" (multiple concerns)

### 2. Observable Outcome Test
Can you verify the behavior without looking at implementation?
- ✅ "Returns {valid: false, error: 'Invalid email'} for bad emails"
- ❌ "Properly handles user input" (what is "properly"?)

### 3. Independent Test
Can this be tested without implementing other parts?
- ✅ "Email validator works with any string input"
- ❌ "Registration flow works end-to-end" (needs everything)

### 4. Stable Interface Test
Is the input/output contract clear and unlikely to change?
- ✅ "(email: string) => {valid: boolean, error?: string}"
- ❌ "Takes user data and does the right thing"

## Common Mistakes

### Too Large (Multiple Concerns)
```typescript
❌ function handleUserRegistration(data) {
  validateInput(data);      // Concern 1
  checkDuplicate(data);     // Concern 2  
  createUser(data);         // Concern 3
  sendWelcomeEmail(data);   // Concern 4
  logAnalytics(data);       // Concern 5
}
```

### Too Small (No Decision Point)
```typescript
❌ function addNumbers(a: number, b: number) {
  return a + b; // No decisions, no failure modes
}
```

### Just Right (One Concern)
```typescript
✅ function validateRegistrationEmail(email: string): ValidationResult {
  // Multiple checks but one concern: is this email valid for registration?
  if (!email) return { valid: false, error: 'Email required' };
  if (!email.includes('@')) return { valid: false, error: 'Invalid format' };
  if (bannedDomains.includes(getDomain(email))) {
    return { valid: false, error: 'Domain not allowed' };
  }
  return { valid: true };
}
```

## Practical Examples

### API Endpoint Decomposition
```
Feature: "Get user posts from last 24 hours"

Concerns:
1. Authentication verification (is user logged in?)
2. Time range calculation (what is "last 24 hours"?)
3. Data fetching (get posts from database)
4. Permission filtering (which posts can user see?)
5. Response formatting (how to structure the data?)

Each becomes a separate task with observable outcomes.
```

### React Form Decomposition
```
Feature: "User profile edit form"

Concerns:
1. Form field rendering (do fields appear correctly?)
2. Input validation (do errors show appropriately?)
3. Form submission (does data submit successfully?)
4. Loading states (does UI show submission progress?)
5. Error handling (do failures show to user?)

Each can be implemented and verified independently.
```

## Why This Works

1. **AI generates stable code** for single concerns
2. **Tests are meaningful** when they verify one decision point
3. **Integration is simpler** with clear interfaces
4. **Debugging is easier** when concerns are isolated
5. **Changes are safer** when boundaries are clear

## The Key Insight

Don't decompose by technical layers (controllers, services, repositories).

Decompose by **decision points** - places where behavior could branch.

Each decision point is a natural boundary for:
- Implementation
- Testing  
- Error handling
- Documentation
- AI code generation

This granularity leverages AI's strength (implementing specific behaviors) while avoiding its weaknesses (making architectural decisions, handling complex interactions).