# Observable Behaviors

## The Shift from Features to Behaviors

Instead of vague requirements, define what you can actually observe and verify.

## What Makes a Behavior Observable?

Observable behaviors are:
- **Specific** - Not "works well" but "loads in 2 seconds"
- **Verifiable** - Can be tested manually or automatically
- **Binary** - Either happens or doesn't, no ambiguity
- **User-focused** - What the user sees/experiences

## Examples

### Vague Requirement → Observable Behaviors

**Vague**: "User can manage their profile"

**Observable**:
- Profile page displays current user data within 1 second
- Clicking 'Edit' shows form with current values pre-filled
- Submitting form with valid data shows success message
- Submitting form with invalid email shows "Invalid email format"
- Changes appear immediately after successful save
- Original data remains if user cancels

### Breaking Down a Feature

**Feature**: "Show posts from last 24 hours"

**Observable Behaviors**:
1. **Data Display**
   - Posts with timestamp < 24 hours ago appear
   - Posts with timestamp > 24 hours ago don't appear
   - Posts show in chronological order (newest first)

2. **Loading States**
   - Spinner appears immediately on page load
   - Spinner disappears when data loads
   - Spinner reappears on refresh

3. **Error Handling**
   - "Network error" message if API fails
   - "No posts yet" message if no posts exist
   - Retry button appears with error message

4. **Edge Cases**
   - Post exactly 24 hours old doesn't appear
   - Time zones handled correctly
   - Page handles 0, 1, 100+ posts

## How to Extract Observable Behaviors

### Ask: "How would I know this is working?"

Instead of implementing "user authentication", define:
- User sees login form when not authenticated
- Valid credentials redirect to dashboard
- Invalid credentials show "Invalid email or password"
- Session persists across page refreshes
- Logout button clears session and redirects to login

### Ask: "What would the user see if this failed?"

For each behavior, consider failure:
- Network timeout → "Request timed out" message
- Invalid data → Specific validation error
- Server error → "Something went wrong" message
- Missing data → Appropriate empty state

### Ask: "How would I demo this?"

If you can't demo it, it's not observable:
- ✅ "Watch the spinner appear while loading"
- ❌ "The code is well-structured"
- ✅ "Submit empty form and see 'Email required'"
- ❌ "Proper error handling implemented"

## From Behaviors to Implementation

Each observable behavior maps to one or more concerns:

**Behavior**: "Form shows 'Email required' when submitted empty"

**Concerns**:
1. Form validation logic (check for empty email)
2. Error display logic (show message in UI)
3. Form submission handling (prevent submission)

## Why This Works with AI

Observable behaviors:
1. **Reduce ambiguity** - AI knows exactly what success looks like
2. **Enable verification** - Can immediately check if working
3. **Prevent scope creep** - Clear boundaries on what to build
4. **Focus on outcomes** - Not implementation details

## Template for Defining Behaviors

```markdown
## Feature: [Name]

### Observable Behaviors:

1. **[Behavior Category]**
   - Given: [Initial state]
   - When: [User action]
   - Then: [Observable outcome]
   
2. **[Error Scenarios]**
   - Given: [Error condition]
   - When: [Trigger]
   - Then: [User sees...]

3. **[Edge Cases]**
   - Given: [Edge condition]
   - When: [Action]
   - Then: [Expected behavior]
```

## Common Patterns

### Loading States
- Immediate feedback on action
- Clear indication of progress
- Graceful handling of completion

### Error States
- Specific error messages
- Recovery options
- Preservation of user data

### Empty States
- Clear messaging when no data
- Actions to create first item
- Helpful guidance

### Success States
- Clear confirmation
- Next actions available
- State updates visible

## The Key Insight

**Features are vague. Behaviors are specific.**

When you define observable behaviors:
- Requirements become testable
- Implementation becomes verifiable
- Progress becomes demonstrable
- Success becomes measurable

This bridges the gap between human intent and AI implementation by making expectations explicit and verifiable.