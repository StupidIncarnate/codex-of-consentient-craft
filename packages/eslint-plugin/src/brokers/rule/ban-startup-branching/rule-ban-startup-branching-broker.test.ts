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
  ],
});
