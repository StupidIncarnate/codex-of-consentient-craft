# transformers/ - Pure Data Transformation

**Purpose:** Pure functions that transform data (non-boolean returns only)

**Folder Structure:**

```
transformers/
  format-date/
    format-date-transformer.ts
    format-date-transformer.proxy.ts  # Test helper (usually minimal)
    format-date-transformer.test.ts
```

**Naming Conventions:**

- **Filename:** kebab-case ending with `-transformer.ts` (e.g., `format-date-transformer.ts`)
- **Export:** camelCase ending with `Transformer` (e.g., `formatDateTransformer`, `userToDtoTransformer`)
- **Proxy:** kebab-case ending with `-transformer.proxy.ts`, export `[name]TransformerProxy` (e.g.,
  `formatDateTransformerProxy`)

**Constraints:**

- **Must** be pure functions (no side effects)
- **Must** have explicit return types using Zod contracts (no raw primitives)
- **Must** validate output using appropriate contract before returning

**Example:**

```tsx
/**
 * PURPOSE: Transforms a Date object into a formatted date string (YYYY-MM-DD)
 *
 * USAGE:
 * formatDateTransformer({date: new Date('2024-01-15')});
 * // Returns '2024-01-15' as branded DateString
 */
// transformers/format-date/format-date-transformer.ts
import {dateStringContract} from '../../contracts/date-string/date-string-contract';
import type {DateString} from '../../contracts/date-string/date-string-contract';

export const formatDateTransformer = ({date}: { date: Date }): DateString => {
    const formatted = date.toISOString().split('T')[0];
    return dateStringContract.parse(formatted);
};
```
