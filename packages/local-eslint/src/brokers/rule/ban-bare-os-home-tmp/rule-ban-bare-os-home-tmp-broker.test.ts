import { ruleBanBareOsHomeTmpBroker } from './rule-ban-bare-os-home-tmp-broker';
import { eslintRuleTesterAdapter } from '@dungeonmaster/eslint-plugin';

const ruleTester = eslintRuleTesterAdapter();

// Virtual fixture paths — RuleTester does NOT read these off disk; it only uses them as the
// "filename" key on each test case so the allowlist guard's path-based check works.
const osAdapterHomedirFixture =
  '/repo/packages/shared/src/adapters/os/homedir/os-homedir-adapter.ts';
const osAdapterTmpdirFixture = '/repo/packages/shared/src/adapters/os/tmpdir/os-tmpdir-adapter.ts';
const harnessSuffixFixture = '/repo/packages/orchestrator/test/orchestration-quest.harness.ts';
const testHarnessesDirFixture = '/repo/packages/web/test/harnesses/quest/quest-support.ts';
const playwrightConfigFixture = '/repo/packages/web/playwright.config.ts';
const regularBrokerFixture = '/repo/packages/orchestrator/src/brokers/foo/foo-broker.ts';

ruleTester.run('ban-bare-os-home-tmp', ruleBanBareOsHomeTmpBroker(), {
  valid: [
    // === ADAPTER LAYER: homedir() bare call is allowed under src/adapters/os/ ===
    {
      code: "import { homedir } from 'os'; export const osUserHomedirAdapter = () => homedir();",
      filename: osAdapterHomedirFixture,
    },
    // === ADAPTER LAYER: tmpdir() bare call is allowed under src/adapters/os/ ===
    {
      code: "import { tmpdir } from 'node:os'; export const osTmpdirAdapter = () => tmpdir();",
      filename: osAdapterTmpdirFixture,
    },
    // === HARNESS SUFFIX: tmpdir() is allowed in a *.harness.ts file ===
    {
      code: "import { tmpdir } from 'os'; export const seed = () => tmpdir();",
      filename: harnessSuffixFixture,
    },
    // === TEST/HARNESSES DIR: tmpdir() is allowed under test/harnesses/ ===
    {
      code: "import * as os from 'os'; export const seed = () => os.tmpdir();",
      filename: testHarnessesDirFixture,
    },
    // === PLAYWRIGHT CONFIG: tmpdir() is allowed in a package's own playwright.config.ts ===
    {
      code: "import { tmpdir } from 'os'; export const dir = tmpdir();",
      filename: playwrightConfigFixture,
    },
    // === VALUE REFERENCE: a bound name passed as a value is never a call ===
    {
      code: "import { homedir } from 'os'; registerMock({ fn: homedir });",
      filename: regularBrokerFixture,
    },
    // === VALUE REFERENCE: a namespace member accessed but never called ===
    {
      code: "import * as os from 'os'; export const fn = os.homedir;",
      filename: regularBrokerFixture,
    },
    // === UNTRACKED NAMED IMPORT: a different os export is not tracked ===
    {
      code: "import { platform } from 'os'; platform();",
      filename: regularBrokerFixture,
    },
    // === UNRELATED MODULE: a homedir()-shaped call from a non-os import is not tracked ===
    {
      code: "import { homedir } from './local-homedir'; homedir();",
      filename: regularBrokerFixture,
    },
  ],

  invalid: [
    // === NAMED IMPORT: homedir() from 'os' ===
    {
      code: "import { homedir } from 'os'; homedir();",
      filename: regularBrokerFixture,
      errors: [{ messageId: 'bareHomedirCall', data: { callText: 'homedir()' } }],
    },
    // === NAMED IMPORT: homedir() from 'node:os' ===
    {
      code: "import { homedir } from 'node:os'; homedir();",
      filename: regularBrokerFixture,
      errors: [{ messageId: 'bareHomedirCall', data: { callText: 'homedir()' } }],
    },
    // === RENAMED NAMED IMPORT: homedir imported under a different local name ===
    {
      code: "import { homedir as getHome } from 'os'; getHome();",
      filename: regularBrokerFixture,
      errors: [{ messageId: 'bareHomedirCall', data: { callText: 'getHome()' } }],
    },
    // === NAMED IMPORT: tmpdir() from 'os' ===
    {
      code: "import { tmpdir } from 'os'; tmpdir();",
      filename: regularBrokerFixture,
      errors: [{ messageId: 'bareTmpdirCall', data: { callText: 'tmpdir()' } }],
    },
    // === RENAMED NAMED IMPORT: tmpdir from 'node:os' under a different local name ===
    {
      code: "import { tmpdir as getTmp } from 'node:os'; getTmp();",
      filename: regularBrokerFixture,
      errors: [{ messageId: 'bareTmpdirCall', data: { callText: 'getTmp()' } }],
    },
    // === NAMESPACE IMPORT: os.homedir() ===
    {
      code: "import * as os from 'os'; os.homedir();",
      filename: regularBrokerFixture,
      errors: [{ messageId: 'bareHomedirCall', data: { callText: 'os.homedir()' } }],
    },
    // === NAMESPACE IMPORT: os.tmpdir() from 'node:os' ===
    {
      code: "import * as os from 'node:os'; os.tmpdir();",
      filename: regularBrokerFixture,
      errors: [{ messageId: 'bareTmpdirCall', data: { callText: 'os.tmpdir()' } }],
    },
    // === DEFAULT IMPORT: os.homedir() ===
    {
      code: "import os from 'os'; os.homedir();",
      filename: regularBrokerFixture,
      errors: [{ messageId: 'bareHomedirCall', data: { callText: 'os.homedir()' } }],
    },
    // === DEFAULT IMPORT: os.tmpdir() from 'node:os' ===
    {
      code: "import os from 'node:os'; os.tmpdir();",
      filename: regularBrokerFixture,
      errors: [{ messageId: 'bareTmpdirCall', data: { callText: 'os.tmpdir()' } }],
    },
    // === REQUIRE: require('os').homedir() ===
    {
      code: "require('os').homedir();",
      filename: regularBrokerFixture,
      errors: [{ messageId: 'bareHomedirCall', data: { callText: "require('os').homedir()" } }],
    },
    // === REQUIRE: require('node:os').tmpdir() ===
    {
      code: "require('node:os').tmpdir();",
      filename: regularBrokerFixture,
      errors: [{ messageId: 'bareTmpdirCall', data: { callText: "require('node:os').tmpdir()" } }],
    },
    // === ASYMMETRY: homedir() is NOT allowed in a *.harness.ts file (only tmpdir gets that leniency) ===
    {
      code: "import { homedir } from 'os'; homedir();",
      filename: harnessSuffixFixture,
      errors: [{ messageId: 'bareHomedirCall', data: { callText: 'homedir()' } }],
    },
    // === ASYMMETRY: homedir() is NOT allowed in a package's own playwright.config.ts ===
    {
      code: "import { homedir } from 'os'; homedir();",
      filename: playwrightConfigFixture,
      errors: [{ messageId: 'bareHomedirCall', data: { callText: 'homedir()' } }],
    },
  ],
});
