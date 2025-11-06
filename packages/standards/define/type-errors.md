# errors/ - Error Classes

**Purpose:** Error classes and exception handling

**Folder Structure:**

```
errors/
  validation/
    validation-error.ts
    validation-error.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-error.ts` (e.g., `validation-error.ts`)
- **Export:** PascalCase ending with `Error` (e.g., `ValidationError`, `NetworkError`)

**Constraints:**

- **Must** extend Error class

**Example:**

```tsx
// errors/validation/validation-error.ts
export class ValidationError extends Error {
    public constructor({message, field}: { message: string; field?: string }) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}
```