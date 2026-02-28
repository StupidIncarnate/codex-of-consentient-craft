import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleBanStartupBranchingBroker } from './rule-ban-startup-branching-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-startup-branching', ruleBanStartupBranchingBroker(), {
  valid: [
    // VALID: Linear wiring in startup file, no branches
    {
      code: `
        export const StartServer = () => {
          const app = new Hono();
          app.route('/api', ApiFlow);
          honoServeAdapter({ app, port: 3000 });
        };
      `,
      filename: '/project/src/startup/start-server.ts',
    },
    // VALID: Branching in non-startup file is allowed
    {
      code: `
        export const myBroker = () => {
          if (!rootElement) throw new Error('missing');
        };
      `,
      filename: '/project/src/brokers/my/action/my-action-broker.ts',
    },
    // VALID: Ternary in non-startup file is allowed
    {
      code: `
        export const myTransformer = () => {
          const port = isDev ? 3000 : 8080;
        };
      `,
      filename: '/project/src/transformers/port/port-transformer.ts',
    },
    // VALID: Switch in non-startup file is allowed
    {
      code: `
        export const myFlow = () => {
          switch (command) { case 'run': break; }
        };
      `,
      filename: '/project/src/flows/command/command-flow.ts',
    },
    // VALID: Branching in startup test file is allowed
    {
      code: `
        if (result.success) {
          expect(result.data).toBeDefined();
        }
      `,
      filename: '/project/src/startup/start-server.test.ts',
    },
    // VALID: Branching in startup integration test file is allowed
    {
      code: `
        if (result.success) {
          expect(result.data).toBeDefined();
        }
      `,
      filename: '/project/src/startup/start-server.integration.test.ts',
    },
    // VALID: Branching in startup proxy file is allowed
    {
      code: `
        const mockFn = condition ? jest.fn() : jest.fn();
      `,
      filename: '/project/src/startup/start-server.proxy.ts',
    },
    // VALID: Logical expression as control flow in non-startup file is allowed
    {
      code: `
        export const myBroker = () => {
          result.shouldBlock && process.stderr.write('blocked');
        };
      `,
      filename: '/project/src/brokers/my/action/my-action-broker.ts',
    },
    // VALID: Logical expression inside assignment in startup file is allowed (not used as statement)
    {
      code: `
        export const StartServer = () => {
          const msg = error instanceof Error && error.message;
        };
      `,
      filename: '/project/src/startup/start-server.ts',
    },
    // VALID: Logical expression in startup test file is allowed
    {
      code: `
        isMain && process.stdin.on('data', () => {});
      `,
      filename: '/project/src/startup/start-server.integration.test.ts',
    },
  ],
  invalid: [
    // INVALID: if statement in startup file
    {
      code: `
        export const StartServer = () => {
          if (!rootElement) throw new Error('missing');
        };
      `,
      filename: '/project/src/startup/start-server.ts',
      errors: [{ messageId: 'noBranching' }],
    },
    // INVALID: ternary in startup file
    {
      code: `
        export const StartServer = () => {
          const port = isDev ? 3000 : 8080;
        };
      `,
      filename: '/project/src/startup/start-server.ts',
      errors: [{ messageId: 'noBranching' }],
    },
    // INVALID: switch in startup file
    {
      code: `
        export const StartServer = () => {
          switch (command) { case 'run': break; }
        };
      `,
      filename: '/project/src/startup/start-server.ts',
      errors: [{ messageId: 'noBranching' }],
    },
    // INVALID: multiple violations in startup file
    {
      code: `
        export const StartServer = () => {
          if (!rootElement) throw new Error('missing');
          const port = isDev ? 3000 : 8080;
          switch (command) { case 'run': break; }
        };
      `,
      filename: '/project/src/startup/start-server.ts',
      errors: [
        { messageId: 'noBranching' },
        { messageId: 'noBranching' },
        { messageId: 'noBranching' },
      ],
    },
    // INVALID: logical && as control flow in startup file
    {
      code: `
        export const StartHook = () => {
          result.shouldBlock && process.stderr.write('blocked');
        };
      `,
      filename: '/project/src/startup/start-hook.ts',
      errors: [{ messageId: 'noLogicalBranching' }],
    },
    // INVALID: self-invocation guard using && in startup file
    {
      code: `
        const isMain = require.main === module;
        isMain && process.stdin.on('data', () => {});
      `,
      filename: '/project/src/startup/start-hook.ts',
      errors: [{ messageId: 'noLogicalBranching' }],
    },
    // INVALID: logical || as control flow in startup file
    {
      code: `
        export const StartHook = () => {
          error instanceof Error || process.exit(1);
        };
      `,
      filename: '/project/src/startup/start-hook.ts',
      errors: [{ messageId: 'noLogicalBranching' }],
    },
    // INVALID: chained logical && in startup file
    {
      code: `
        export const StartHook = () => {
          error instanceof Error && error.stack && process.stderr.write(error.stack);
        };
      `,
      filename: '/project/src/startup/start-hook.ts',
      errors: [{ messageId: 'noLogicalBranching' }],
    },
    // INVALID: multiple logical expression violations in startup file
    {
      code: `
        export const StartHook = () => {
          result.shouldBlock && process.stderr.write('blocked');
          error instanceof Error && error.stack && process.stderr.write(error.stack);
        };
        const isMain = require.main === module;
        isMain && process.stdin.on('data', () => {});
        isMain && process.stdin.on('end', () => {});
      `,
      filename: '/project/src/startup/start-hook.ts',
      errors: [
        { messageId: 'noLogicalBranching' },
        { messageId: 'noLogicalBranching' },
        { messageId: 'noLogicalBranching' },
        { messageId: 'noLogicalBranching' },
      ],
    },
  ],
});
