import { ruleBanSilentCatchBroker } from './rule-ban-silent-catch-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-silent-catch', ruleBanSilentCatchBroker(), {
  valid: [
    // --- Function calls in catch handler are meaningful ---
    {
      code: 'promise.catch((error) => { console.error(error); });',
      filename: '/project/src/brokers/example/example-broker.ts',
    },
    {
      code: 'promise.catch((error) => { globalThis.console.error(error); });',
      filename: '/project/src/brokers/example/example-broker.ts',
    },
    {
      code: 'promise.catch(() => { processDevLogAdapter({ message: "failed" }); });',
      filename: '/project/src/brokers/example/example-broker.ts',
    },
    {
      code: 'promise.catch((error) => { setState({ error }); });',
      filename: '/project/src/widgets/example/example-widget.tsx',
    },

    // --- Throw in catch handler is meaningful ---
    {
      code: 'promise.catch((error) => { throw error; });',
      filename: '/project/src/brokers/example/example-broker.ts',
    },
    {
      code: 'promise.catch((error) => { throw new Error("wrapped: " + error); });',
      filename: '/project/src/brokers/example/example-broker.ts',
    },

    // --- Expression body with function call ---
    {
      code: 'promise.catch(() => process.exit(1));',
      filename: '/project/src/startup/start-hook.ts',
    },
    {
      code: 'promise.catch((error) => console.error(error));',
      filename: '/project/src/brokers/example/example-broker.ts',
    },

    // --- Expression body returning meaningful value ---
    {
      code: 'promise.catch(() => false);',
      filename: '/project/src/brokers/example/example-broker.ts',
    },
    {
      code: 'promise.catch(() => null);',
      filename: '/project/src/brokers/example/example-broker.ts',
    },
    {
      code: "promise.catch(() => 'fallback');",
      filename: '/project/src/brokers/example/example-broker.ts',
    },
    {
      code: 'promise.catch(() => []);',
      filename: '/project/src/brokers/example/example-broker.ts',
    },

    // --- Block body with return of meaningful value ---
    {
      code: 'promise.catch((error) => { log.error(error); return fallback; });',
      filename: '/project/src/brokers/example/example-broker.ts',
    },

    // --- Assignment in catch handler ---
    {
      code: 'promise.catch((error) => { lastError = error; });',
      filename: '/project/src/brokers/example/example-broker.ts',
    },

    // --- Await in catch handler ---
    {
      code: 'promise.catch(async (error) => { await logError({ error }); });',
      filename: '/project/src/brokers/example/example-broker.ts',
    },

    // --- Control flow in catch handler ---
    {
      code: 'promise.catch((error) => { if (error instanceof TimeoutError) { retry(); } });',
      filename: '/project/src/brokers/example/example-broker.ts',
    },

    // --- try/catch statement (NOT .catch()) ---
    {
      code: 'try { doSomething(); } catch (e) { }',
      filename: '/project/src/brokers/example/example-broker.ts',
    },

    // --- .catch with non-function argument (named handler) ---
    {
      code: 'promise.catch(handleError);',
      filename: '/project/src/brokers/example/example-broker.ts',
    },

    // --- Not a .catch() method ---
    {
      code: 'array.map(() => undefined);',
      filename: '/project/src/brokers/example/example-broker.ts',
    },
    {
      code: 'obj.notCatch(() => {});',
      filename: '/project/src/brokers/example/example-broker.ts',
    },
  ],

  invalid: [
    // --- Arrow expression body returning undefined ---
    {
      code: 'promise.catch(() => undefined);',
      filename: '/project/src/brokers/example/example-broker.ts',
      errors: [{ messageId: 'banSilentCatch' }],
    },
    {
      code: 'promise.catch((_error) => undefined);',
      filename: '/project/src/brokers/example/example-broker.ts',
      errors: [{ messageId: 'banSilentCatch' }],
    },

    // --- Empty block body ---
    {
      code: 'promise.catch(() => {});',
      filename: '/project/src/brokers/example/example-broker.ts',
      errors: [{ messageId: 'banSilentCatch' }],
    },
    {
      code: 'promise.catch((_err) => {});',
      filename: '/project/src/brokers/example/example-broker.ts',
      errors: [{ messageId: 'banSilentCatch' }],
    },

    // --- Block with only comments (AST sees empty block) ---
    {
      code: 'promise.catch(() => { /* empty */ });',
      filename: '/project/src/brokers/example/example-broker.ts',
      errors: [{ messageId: 'banSilentCatch' }],
    },

    // --- FunctionExpression variant ---
    {
      code: 'promise.catch(function() {});',
      filename: '/project/src/brokers/example/example-broker.ts',
      errors: [{ messageId: 'banSilentCatch' }],
    },
    {
      code: 'promise.catch(function(_error) {});',
      filename: '/project/src/brokers/example/example-broker.ts',
      errors: [{ messageId: 'banSilentCatch' }],
    },

    // --- Block body with only return undefined ---
    {
      code: 'promise.catch((_e) => { return undefined; });',
      filename: '/project/src/brokers/example/example-broker.ts',
      errors: [{ messageId: 'banSilentCatch' }],
    },

    // --- Block body with bare return ---
    {
      code: 'promise.catch((_e) => { return; });',
      filename: '/project/src/brokers/example/example-broker.ts',
      errors: [{ messageId: 'banSilentCatch' }],
    },

    // --- Chained .then().catch() with silent handler ---
    {
      code: 'promise.then(() => doSomething()).catch(() => {});',
      filename: '/project/src/brokers/example/example-broker.ts',
      errors: [{ messageId: 'banSilentCatch' }],
    },

    // --- Await prefix with silent catch ---
    {
      code: 'await promise.catch(() => undefined);',
      filename: '/project/src/brokers/example/example-broker.ts',
      errors: [{ messageId: 'banSilentCatch' }],
    },
  ],
});
