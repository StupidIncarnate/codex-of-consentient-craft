# LLM Instructions and Prompt Templates

## Core Instruction Philosophy

LLMs function best as **semantic compilers** when given:
- Fresh context (no conversation history)
- Specific transformation rules
- Clear success criteria
- Immediate validation feedback

## Base Instruction Template

```
ROLE: You are a semantic compiler that transforms specifications into working code.

TASK: [specific concern to implement]

CONCERN TYPE: [validation/transformation/logic/UI/persistence/integration]

INPUT SPECIFICATION:
[exactly what you're transforming]

OUTPUT REQUIREMENTS:
[exactly what to produce]

PROJECT CONTEXT:
- Language/Framework: [TypeScript/React/Node.js/etc]  
- Code Style: [specific patterns to follow]
- Error Handling: [how errors should be handled]
- Testing Framework: [Jest/Cypress/etc]

CONSTRAINTS:
- Size limit: [specific line count for code type]
- Dependencies: [what you can/cannot use]
- Boundaries: [where to stop implementation]

SUCCESS CRITERIA:
[specific checklist for verification]

FORBIDDEN:
- TODO comments in delivered code
- console.log statements
- Placeholder implementations
- Multiple concerns in one implementation
```

## Templates by Code Type

### API/Server Code Template

```
TASK: Create [specific API operation] that [single responsibility]

CONCERN TYPE: API endpoint/business logic/data validation

INPUT SPECIFICATION:
- HTTP Method: [GET/POST/PUT/DELETE]
- Path: [/api/users/:id]
- Request Body: [specific structure]
- Query Parameters: [specific parameters]

OUTPUT REQUIREMENTS:
- Response format: [specific JSON structure]
- HTTP status codes: [success and error cases]
- Error messages: [user-friendly error format]

IMPLEMENTATION REQUIREMENTS:
- Include input validation with clear error messages
- Handle edge cases (null, empty, invalid data)
- Include comprehensive test coverage
- Follow RESTful patterns
- Use proper TypeScript types

CONSTRAINTS:
- Size limit: 300 lines including tests
- Don't implement database schema (mock database calls)
- Don't implement authentication middleware (assume it exists)
- Use existing error handling utilities

VALIDATION COMMANDS:
- npm run typecheck
- npm run lint  
- npm test -- [endpoint-name].test.ts
- Manual API testing with curl/Postman

SUCCESS CRITERIA:
□ Endpoint returns correct response for valid input
□ Endpoint returns 400 with error message for invalid input
□ All edge cases handled appropriately
□ Tests achieve 100% coverage
□ TypeScript compiles without errors
```

### React Component Template

```
TASK: Create [specific UI component] that [single user interaction]

CONCERN TYPE: UI component/user interaction/data display

INPUT SPECIFICATION:
- Props interface: [specific TypeScript interface]
- User interactions: [clicks, form input, etc]
- Data requirements: [what data it displays/manipulates]

OUTPUT REQUIREMENTS:
- Component renders: [specific visual elements]
- User interactions: [specific behaviors]
- State management: [local state, form state, etc]
- Error handling: [how errors are displayed]

IMPLEMENTATION REQUIREMENTS:
- Use TypeScript with proper prop types
- Include loading and error states
- Handle edge cases (empty data, null props)
- Include accessibility attributes (ARIA labels)
- Responsive design considerations
- Comprehensive component tests

CONSTRAINTS:
- Size limit: 400 lines including tests
- Don't implement child components (mock them)
- Don't implement API calls (mock data)
- Use existing design system components

VALIDATION COMMANDS:
- npm run typecheck
- npm run lint
- npm test -- [ComponentName].test.tsx
- Manual browser testing

SUCCESS CRITERIA:
□ Component renders without errors
□ All interactive elements respond correctly
□ Loading and error states display properly  
□ Component is accessible (keyboard navigation, screen reader)
□ Tests cover all user interactions
□ Props are properly typed
```

### React Form Template

```
TASK: Create [specific form] that [single form workflow]

CONCERN TYPE: Form/user input/data collection

INPUT SPECIFICATION:
- Form fields: [specific fields with types]
- Validation rules: [specific validation requirements]
- Submission behavior: [what happens on submit]

OUTPUT REQUIREMENTS:
- Form UI: [visual layout and field types]
- Validation: [when and how validation triggers]
- Submission: [data format and success/error handling]
- User feedback: [loading states, error messages, success confirmation]

IMPLEMENTATION REQUIREMENTS:
- Include real-time validation with user-friendly messages
- Handle form submission with loading states
- Prevent double submission during async operations
- Reset form appropriately after successful submission
- Include comprehensive form testing

CONSTRAINTS:
- Size limit: 400 lines including tests
- Don't implement API submission (mock the endpoint)
- Don't implement complex child components (use simple inputs)
- Use form validation library if appropriate

VALIDATION COMMANDS:
- npm run typecheck
- npm run lint
- npm test -- [FormName].test.tsx
- Manual form testing in browser

SUCCESS CRITERIA:
□ Form fields render with correct input types
□ Validation shows appropriate error messages
□ Valid form submission works correctly
□ Invalid form submission shows helpful errors
□ Loading states appear during submission
□ Form handles edge cases (empty fields, invalid data)
□ Tests cover all form workflows
```

### Utility Function Template

```
TASK: Create [specific utility] that [single transformation/validation]

CONCERN TYPE: Pure function/data transformation/validation logic

INPUT SPECIFICATION:
- Function parameters: [specific types and structure]
- Input constraints: [what inputs are valid]
- Expected use cases: [how function will be used]

OUTPUT REQUIREMENTS:
- Return type: [specific TypeScript type]
- Error handling: [how errors are communicated]
- Performance: [expected performance characteristics]

IMPLEMENTATION REQUIREMENTS:
- Pure function (no side effects)
- Handle all edge cases explicitly
- Include comprehensive error handling
- Include 100% test coverage
- Proper TypeScript types for all parameters and returns

CONSTRAINTS:
- Size limit: 200 lines including tests
- No external dependencies unless specified
- No database calls or API calls
- No file system operations

VALIDATION COMMANDS:
- npm run typecheck
- npm run lint
- npm test -- [utility-name].test.ts

SUCCESS CRITERIA:
□ Function handles all documented input types correctly
□ Edge cases return expected results or throw appropriate errors
□ Function is deterministic (same input = same output)
□ Performance is acceptable for expected usage
□ Tests achieve 100% code coverage
□ TypeScript types are complete and accurate
```

## Error Response Templates

### When LLM Receives Compiler Errors

```
ERROR FIXING TASK:

ORIGINAL CODE:
[code that produced errors]

COMPILER ERRORS:
[exact error messages from TypeScript/ESLint]

FIXING INSTRUCTIONS:
- Address each error specifically
- Maintain original functionality
- Don't change interfaces unless necessary
- Keep fixes minimal and targeted

VALIDATION:
After fixing, the following must pass:
- npm run typecheck (no errors)
- npm run lint (no warnings)
- npm test -- [test-file] (all tests pass)
```

### When LLM Receives Test Failures

```
TEST FIXING TASK:

FAILING TESTS:
[specific test failures with error messages]

FAILING CODE:
[code that's causing test failures]

FIXING INSTRUCTIONS:
- Address root cause, not just symptoms
- Ensure fix doesn't break other functionality
- Update tests only if requirements changed
- Maintain test coverage

VALIDATION:
After fixing:
- All tests pass
- No new test failures introduced
- Test coverage remains at required level
```

## Context Management Rules

### Fresh Session Requirements

Start new LLM session for:
- Each new implementation task
- Each error fixing cycle
- Each integration issue

### Context Accumulation Prevention

Never include in prompts:
- Previous task attempts
- Conversation history
- Debug session transcripts
- Earlier code versions

### Required Context

Always include:
- Current task specification
- Project coding conventions
- Relevant patterns/examples
- Success criteria checklist

## Instruction Quality Checklist

Before giving instructions to LLM, verify:

### Specificity Check
□ Task has single, clear concern
□ Success criteria are measurable
□ Constraints are explicit
□ Code type is identified

### Completeness Check  
□ All required context provided
□ Input/output specifications clear
□ Validation commands included
□ Size limits specified

### Boundary Check
□ Implementation boundaries clear
□ Dependencies identified
□ Stop conditions explicit
□ Integration points defined

### Validation Check
□ Success criteria testable
□ Failure conditions identified
□ Verification commands work
□ Manual testing steps clear

## Common Instruction Mistakes

### Too Vague
```
❌ "Create a user component"
✓ "Create UserAvatar component that displays user image with fallback and loading states"
```

### Multiple Concerns
```
❌ "Create user management system with CRUD operations"
✓ "Create user registration form with email, password validation"
```

### No Success Criteria
```
❌ "Build the form and make it work"
✓ "Form validates input, shows errors, submits data, handles loading states"
```

### Missing Context
```
❌ "Use the existing patterns" (which patterns?)
✓ "Follow repository pattern as shown in UserService.ts"
```

The key to reliable LLM code generation is precise, complete instructions that leverage semantic understanding while preventing common failure modes.