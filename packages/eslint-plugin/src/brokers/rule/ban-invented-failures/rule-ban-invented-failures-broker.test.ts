import { ruleBanInventedFailuresBroker } from './rule-ban-invented-failures-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-invented-failures', ruleBanInventedFailuresBroker(), {
  valid: [
    // A wrapper proxy's own named scenario, built on a recorded failure
    {
      code: 'fs.fileMissing({ path });',
      filename: '/project/src/brokers/config/load/config-load-broker.proxy.ts',
    },
    // A recorded-failure stub, not a hand-made Error
    {
      code: 'handle.calledWith([p]).rejects(FileMissingErrorStub({ syscall: "open", path: p }));',
      filename: '/project/src/brokers/config/load/config-load-broker.proxy.ts',
    },
    // A provider-owned scenario method
    {
      code: 'orchestrator.questNotFound({ questId });',
      filename: '/project/src/brokers/quest/load/quest-load-broker.test.ts',
    },
    // Asserting what the code under test throws is not inventing a mock's failure
    {
      code: 'expect(() => run()).toThrow(/^Quest not found$/u);',
      filename: '/project/src/brokers/quest/load/quest-load-broker.test.ts',
    },
    // A hand-made Error that is never fed to rejects/throws/implement
    {
      code: "const error = new Error('boom'); logIt(error);",
      filename: '/project/src/brokers/config/load/config-load-broker.proxy.ts',
    },
    // Implementation files (neither proxy nor test) are outside this rule's scope
    {
      code: "throw new Error('Config load failed');",
      filename: '/project/src/brokers/config/load/config-load-broker.ts',
    },
  ],
  invalid: [
    // Nested inside an object literal argument to a scenario method named `throws`
    {
      code: "proxy.throws({ filePath, error: new Error('ENOENT') });",
      filename: '/project/src/brokers/config/load/config-load-broker.proxy.ts',
      errors: [{ messageId: 'inventedFailure' }],
    },
    // Still hand-made once wrapped in Object.assign
    {
      code: "handle.calledWith([p]).throws(Object.assign(new Error('x'), { code: 'ENOENT' }));",
      filename: '/project/src/brokers/config/load/config-load-broker.proxy.ts',
      errors: [{ messageId: 'inventedFailure' }],
    },
    // rejects, in a test file
    {
      code: "handle.calledWith([p]).rejects(new Error('boom'));",
      filename: '/project/src/brokers/config/load/config-load-broker.test.ts',
      errors: [{ messageId: 'inventedFailure' }],
    },
    // A throwing implement
    {
      code: "handle.calledWith([p]).implement(() => { throw new Error('boom'); });",
      filename: '/project/src/brokers/config/load/config-load-broker.proxy.ts',
      errors: [{ messageId: 'inventedFailure' }],
    },
  ],
});
