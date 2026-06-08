import { ruleEnforceE2eBaseImportBroker } from './rule-enforce-e2e-base-import-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-e2e-base-import', ruleEnforceE2eBaseImportBroker(), {
  valid: [
    // --- Non-e2e files can import from @playwright/test freely ---
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
      filename: '/project/test/harnesses/e2e-fixtures.ts',
    },

    // --- E2e files importing from the web-relative e2e-fixtures base (correct) ---
    {
      code: "import { test, expect } from '../../../test/harnesses/e2e-fixtures';",
      filename: '/project/web/src/flows/home/smoke.e2e.ts',
    },
    {
      code: "import { test, expect } from '../../../test/harnesses/e2e-fixtures';",
      filename: '/project/web/src/flows/home/guild-creation.e2e.ts',
    },

    // --- E2e files importing other modules (not @playwright/test) ---
    {
      code: "import { createGuild } from './fixtures/test-helpers';",
      filename: '/project/web/src/flows/home/smoke.e2e.ts',
    },
  ],
  invalid: [
    // --- E2e files importing from @playwright/test (banned) ---
    {
      code: "import { test, expect } from '@playwright/test';",
      filename: '/project/web/src/flows/home/smoke.e2e.ts',
      errors: [{ messageId: 'useTestingE2e' }],
    },
    {
      code: "import { test } from '@playwright/test';",
      filename: '/project/web/src/flows/home/guild-creation.e2e.ts',
      errors: [{ messageId: 'useTestingE2e' }],
    },
    {
      code: "import { expect } from '@playwright/test';",
      filename: '/project/web/src/flows/quest-chat/quest-detail.e2e.ts',
      errors: [{ messageId: 'useTestingE2e' }],
    },
    {
      code: "import type { Page } from '@playwright/test';",
      filename: '/project/web/src/flows/quest-chat/chat-smoke.e2e.ts',
      errors: [{ messageId: 'useTestingE2e' }],
    },
  ],
});
