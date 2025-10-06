# Rule Brokers Testing

**IMPORTANT:** Rule brokers use ESLint's RuleTester integration tests, NOT standard Jest unit tests.

## Structure

```typescript
import {createEslintRuleTester} from '../../../../test/helpers/eslint-rule-tester';
import {myRuleBroker} from './my-rule-broker';

const ruleTester = createEslintRuleTester();

ruleTester.run('rule-name', myRuleBroker(), {
    valid: [
        {code: '...', filename: '...'}
    ],
    invalid: [
        {code: '...', filename: '...', errors: [{messageId: '...'}]}
    ],
});
```

## Key Differences from Standard Tests

- **No describe/it blocks** - Use `ruleTester.run()` with `valid` and `invalid` arrays
- **Integration tests** - ESLint parses real code and validates AST selectors
- **Mocking adapters** - Mock underlying adapters (e.g., `fsExistsSync`) using `beforeEach()`
- **Mock at adapter level** - Use `jest.mock('../../../adapters/...')`, not npm packages directly

## When to Mock

Mock file system checks and external dependencies that rules need for validation logic:

```typescript
import {fsExistsSync} from '../../../adapters/fs/fs-exists-sync';

jest.mock('../../../adapters/fs/fs-exists-sync');

const mockFsExistsSync = jest.mocked(fsExistsSync);

beforeEach(() => {
    mockFsExistsSync.mockImplementation(({filePath}) => {
        const existingFiles = ['/project/src/user.ts'];
        return existingFiles.includes(String(filePath));
    });
});
```

See testing standards for unit test patterns - those apply to all other code except rule brokers.
