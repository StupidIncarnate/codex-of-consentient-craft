**FOLDER STRUCTURE:**

```
errors/
  validation/
    validation-error.ts
    validation-error.test.ts
  not-found/
    not-found-error.ts
    not-found-error.test.ts
```

**ERROR CLASS PATTERN:**

Errors are **classes** (not arrow functions like other folder types):

```typescript
export class ValidationError extends Error {
    public readonly field?: string;  // Context properties are readonly

    public constructor({message, field}: { message: string; field?: string }) {
        super(message);              // Pass message to Error
        this.field = field;          // Set context properties
        this.name = 'ValidationError';  // MUST set name to error class name
    }
}
```

**KEY RULES:**

- Must extend Error class
- Export as `export class` (NOT arrow function)
- Constructor uses object destructuring for parameters
- Context properties are `readonly`
- MUST set `this.name` to error class name in constructor
- Use for domain-specific errors with context (user ID, resource type, field name, etc.)

**EXAMPLES:**

```typescript
/**
 * PURPOSE: Represents validation errors with field-level context
 *
 * USAGE:
 * throw new ValidationError({message: 'Invalid email format', field: 'email'});
 * // Throws ValidationError with field context
 */
// errors/validation/validation-error.ts
export class ValidationError extends Error {
    public readonly field?: string;

    public constructor({message, field}: { message: string; field?: string }) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}

/**
 * PURPOSE: Represents resource not found errors with resource context
 *
 * USAGE:
 * throw new NotFoundError({message: 'User not found', resourceId: '123', resourceType: 'User'});
 * // Throws NotFoundError with resource context
 */
// errors/not-found/not-found-error.ts
export class NotFoundError extends Error {
    public readonly resourceId?: string;
    public readonly resourceType?: string;

    public constructor({
                           message,
                           resourceId,
                           resourceType
                       }: {
        message: string;
        resourceId?: string;
        resourceType?: string;
    }) {
        super(message);
        this.resourceId = resourceId;
        this.resourceType = resourceType;
        this.name = 'NotFoundError';
    }
}

/**
 * PURPOSE: Represents authentication errors with error code context
 *
 * USAGE:
 * throw new AuthenticationError({message: 'Invalid token', code: 'TOKEN_EXPIRED'});
 * // Throws AuthenticationError with error code
 */
// errors/authentication/authentication-error.ts
export class AuthenticationError extends Error {
    public readonly code?: string;

    public constructor({message, code}: { message: string; code?: string }) {
        super(message);
        this.code = code;
        this.name = 'AuthenticationError';
    }
}
```

**TEST EXAMPLE:**

```typescript
// errors/validation/validation-error.test.ts
import {ValidationError} from './validation-error';

describe('ValidationError', () => {
  describe('with field context', () => {
    it('VALID: {message, field} => creates error with all properties', () => {
      const error = new ValidationError({
        message: 'Invalid email format',
        field: 'email',
      });

      expect(error).toStrictEqual({
        message: 'Invalid email format',
        field: 'email',
        name: 'ValidationError',
      });
    });

    it('VALID: {message only} => creates error without field', () => {
      const error = new ValidationError({
        message: 'General validation error',
      });

      expect(error).toStrictEqual({
        message: 'General validation error',
        name: 'ValidationError',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof ValidationError => returns true', () => {
      const error = new ValidationError({message: 'Test error'});

      expect(error instanceof ValidationError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new ValidationError({message: 'Test error'});

      expect(error instanceof Error).toBe(true);
    });
  });
});
```
