import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleForbidTodoSkipBroker } from './rule-forbid-todo-skip-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('forbid-todo-skip', ruleForbidTodoSkipBroker(), {
  valid: [
    // VALID: Regular test methods without .todo or .skip
    {
      code: `
        describe('User', () => {
          it('creates user', () => {
            expect(true).toBe(true);
          });
        });
      `,
      filename: '/project/src/user.test.ts',
    },
    {
      code: `
        describe('Calculator', () => {
          test('adds numbers', () => {
            expect(1 + 1).toBe(2);
          });
        });
      `,
      filename: '/project/src/calculator.test.ts',
    },
    {
      code: `
        describe('API', () => {
          describe('GET /users', () => {
            it('returns users list', async () => {
              const result = await fetch('/users');
              expect(result).toBeDefined();
            });
          });
        });
      `,
      filename: '/project/src/api.test.ts',
    },
    // VALID: .todo and .skip are allowed in non-test files
    {
      code: `
        const todo = test.todo;
        const skip = it.skip;
      `,
      filename: '/project/src/utils.ts',
    },
    {
      code: `
        test.todo('future test');
        it.skip('skipped test');
      `,
      filename: '/project/src/helper.ts',
    },
  ],
  invalid: [
    // INVALID: test.todo
    {
      code: `
        describe('User', () => {
          test.todo('implement user creation');
        });
      `,
      filename: '/project/src/user.test.ts',
      errors: [
        {
          messageId: 'noTodoOrSkip',
          data: {
            method: 'test',
            suffix: 'todo',
          },
        },
      ],
    },
    // INVALID: it.todo
    {
      code: `
        describe('Calculator', () => {
          it.todo('add subtraction test');
        });
      `,
      filename: '/project/src/calculator.test.ts',
      errors: [
        {
          messageId: 'noTodoOrSkip',
          data: {
            method: 'it',
            suffix: 'todo',
          },
        },
      ],
    },
    // INVALID: describe.skip
    {
      code: `
        describe.skip('User', () => {
          it('creates user', () => {
            expect(true).toBe(true);
          });
        });
      `,
      filename: '/project/src/user.test.ts',
      errors: [
        {
          messageId: 'noTodoOrSkip',
          data: {
            method: 'describe',
            suffix: 'skip',
          },
        },
      ],
    },
    // INVALID: test.skip
    {
      code: `
        describe('API', () => {
          test.skip('flaky test', () => {
            expect(true).toBe(true);
          });
        });
      `,
      filename: '/project/src/api.test.ts',
      errors: [
        {
          messageId: 'noTodoOrSkip',
          data: {
            method: 'test',
            suffix: 'skip',
          },
        },
      ],
    },
    // INVALID: it.skip
    {
      code: `
        describe('Component', () => {
          it.skip('renders correctly', () => {
            expect(true).toBe(true);
          });
        });
      `,
      filename: '/project/src/component.test.tsx',
      errors: [
        {
          messageId: 'noTodoOrSkip',
          data: {
            method: 'it',
            suffix: 'skip',
          },
        },
      ],
    },
    // INVALID: Multiple violations in same file
    {
      code: `
        describe('User', () => {
          test.todo('implement user creation');
          it.skip('updates user', () => {
            expect(true).toBe(true);
          });
          describe.skip('nested tests', () => {
            it('does something', () => {});
          });
        });
      `,
      filename: '/project/src/user.test.ts',
      errors: [
        {
          messageId: 'noTodoOrSkip',
          data: {
            method: 'test',
            suffix: 'todo',
          },
        },
        {
          messageId: 'noTodoOrSkip',
          data: {
            method: 'it',
            suffix: 'skip',
          },
        },
        {
          messageId: 'noTodoOrSkip',
          data: {
            method: 'describe',
            suffix: 'skip',
          },
        },
      ],
    },
    // INVALID: .integration.test.ts files
    {
      code: `
        describe('Integration', () => {
          it.todo('add integration test');
        });
      `,
      filename: '/project/src/api.integration.test.ts',
      errors: [
        {
          messageId: 'noTodoOrSkip',
          data: {
            method: 'it',
            suffix: 'todo',
          },
        },
      ],
    },
    // INVALID: .e2e.test.ts files
    {
      code: `
        describe('E2E', () => {
          test.skip('broken e2e test', () => {});
        });
      `,
      filename: '/project/tests/e2e/user.e2e.test.ts',
      errors: [
        {
          messageId: 'noTodoOrSkip',
          data: {
            method: 'test',
            suffix: 'skip',
          },
        },
      ],
    },
  ],
});
