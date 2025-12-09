# @dungeonmaster/shared

Shared contracts, guards, and utilities for Dungeonmaster packages.

## Adding New Exports

When adding new functionality to `@dungeonmaster/shared`, you MUST:

1. **Create the implementation** in the appropriate `src/` folder:
    - `src/contracts/` - Zod schemas and type contracts
    - `src/guards/` - Type guard functions
    - `src/transformers/` - Data transformation functions
    - etc.

2. **Create a barrel export file** at the package root:
    - Create `<category>.ts` (e.g., `guards.ts`, `contracts.ts`)
    - Export all items from the category:
      ```typescript
      // guards.ts - Subpath export entry for @dungeonmaster/shared/guards
      export * from './src/guards/is-key-of/is-key-of-guard';
      export * from './src/guards/another-guard/another-guard-guard';
      ```

3. **Update package.json exports**:
   ```json
   {
     "exports": {
       "./guards": {
         "import": "./dist/guards.js",
         "require": "./dist/guards.js",
         "types": "./dist/guards.d.ts"
       }
     }
   }
   ```

4. **Rebuild the package**:
   ```bash
   npm run build --workspace=@dungeonmaster/shared
   ```

5. **Import in consuming packages**:
   ```typescript
   import { isKeyOfGuard } from '@dungeonmaster/shared/guards';
   ```

## Important Notes

- **Never** import from `@dungeonmaster/shared/dist/...` directly
- **Always** use the subpath exports: `@dungeonmaster/shared/guards`, `@dungeonmaster/shared/contracts`, etc.
- After modifying this package, dependent packages must rebuild to see changes
- The barrel export pattern keeps imports clean and maintainable
