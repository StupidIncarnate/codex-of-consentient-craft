import { ruleEnforceE2eBaseImportBroker } from './rule-enforce-e2e-base-import-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-e2e-base-import', ruleEnforceE2eBaseImportBroker(), {
  valid: [
    // --- Non-spec files can import from @playwright/test freely ---
    {
      code: "import { test, expect } from '@playwright/test';",
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
    {
      code: "import { test, expect } from '@playwright/test';",
      filename: '/project/test/harnesses/network/network.harness.ts',
    },
    {
      code: "import { test } from '@playwright/test';",
      filename: '/project/src/e2e-fixtures.ts',
    },

    // --- Spec files importing from @dungeonmaster/testing/e2e (correct) ---
    {
      code: "import { test, expect } from '@dungeonmaster/testing/e2e';",
      filename: '/project/e2e/web/smoke.spec.ts',
    },
    {
      code: "import { test, expect } from '@dungeonmaster/testing/e2e';",
      filename: '/project/e2e/web/guild-creation.spec.ts',
    },

    // --- Spec files importing other modules (not @playwright/test) ---
    {
      code: "import { createGuild } from './fixtures/test-helpers';",
      filename: '/project/e2e/web/smoke.spec.ts',
    },
  ],
  invalid: [
    // --- Spec files importing from @playwright/test (banned) ---
    {
      code: "import { test, expect } from '@playwright/test';",
      filename: '/project/e2e/web/smoke.spec.ts',
      errors: [{ messageId: 'useTestingE2e' }],
    },
    {
      code: "import { test } from '@playwright/test';",
      filename: '/project/e2e/web/guild-creation.spec.ts',
      errors: [{ messageId: 'useTestingE2e' }],
    },
    {
      code: "import { expect } from '@playwright/test';",
      filename: '/project/e2e/web/quest-detail.spec.ts',
      errors: [{ messageId: 'useTestingE2e' }],
    },
    {
      code: "import type { Page } from '@playwright/test';",
      filename: '/project/e2e/web/chat-smoke.spec.ts',
      errors: [{ messageId: 'useTestingE2e' }],
    },
  ],
});
