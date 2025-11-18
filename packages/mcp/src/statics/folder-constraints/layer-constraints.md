# LAYER FILES - Decomposing Complex Components

## Purpose

Layer files are used to break down complex components into smaller, more manageable pieces while maintaining cohesion
and clarity.

## When to Use Layer Files

Use layer files when a component becomes too large or complex for a single file:

- Component has multiple distinct responsibilities
- File exceeds reasonable size (typically > 300 lines)
- Logic can be naturally separated into cohesive units
- Testing would benefit from isolated concerns

## Structure

```
component-name/
  component-name-layer-1.ts
  component-name-layer-2.ts
  component-name-layer-3.ts
  component-name.ts (main file that composes layers)
  component-name.test.ts
```

## Naming Convention

Layer files MUST follow this pattern:

- `{component-name}-{layer-description}.ts`
- Layer description should be descriptive of the layer's purpose
- Main file has no layer suffix

## Guidelines

1. **Single Responsibility**: Each layer should have one clear purpose
2. **Composition**: Main file composes layers together
3. **Dependencies**: Layers can depend on each other but avoid circular dependencies
4. **Testing**: Test layers independently when possible
5. **Exports**: Only export from main file unless layer exports are needed elsewhere

## Example

```typescript
// user-validator-email-layer.ts
export const validateEmail = ({email}: { email?: Email }): boolean => {
    // Email validation logic
};

// user-validator-permissions-layer.ts
export const validatePermissions = ({user}: { user?: User }): boolean => {
    // Permissions validation logic
};

// user-validator.ts (main file)
import {validateEmail} from './user-validator-email-layer';
import {validatePermissions} from './user-validator-permissions-layer';

export const userValidator = ({user}: { user?: User }): boolean => {
    return validateEmail({email: user?.email}) &&
        validatePermissions({user});
};
```
