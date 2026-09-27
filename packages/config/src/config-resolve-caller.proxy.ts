// config's own black-box proxy for configResolveBroker (F18, scrolls/brands-gateways-epic/EPIC.md).
// brokers/config/resolve/config-resolve-broker.proxy.ts (this broker's OWN colocated proxy)
// composes configFileFindBrokerProxy, which composes @dungeonmaster/shared's
// configRootFindBrokerProxy — registerMock's hoisted jest.mock() replaces that shared module for
// the WHOLE test file that composes it, breaking any other real call to it the same file relies
// on (orchestrator's quest/guild path resolution, siegelense's own path adapters — see A02 C1,
// 6bc846ad5). Every OTHER workspace package composes THIS proxy instead: it mocks
// configResolveBroker itself and nothing beneath it, so no shared internals are ever touched.
//
// Colocated with config-resolve-caller.ts (a bare re-export, never imported by anything else)
// rather than with config-resolve-broker.ts — enforce-project-structure's Level 3 domain-prefix
// check has no slot for an extra descriptive word between a broker's own filename and ".proxy.ts"
// outside the "-layer-" convention, and a layer file needs a real layer implementation behind it,
// which this is not. Colocating with index.ts (config's main barrel) does not work either:
// index.ts's own `import { configResolveBroker } from './src/brokers/...'` line unconditionally
// trips enforce-proxy-child-creation's demand to compose that broker's own existing colocated
// proxy — the exact internals-composing proxy this file exists to bypass. Both files sit directly
// under src/ (no subfolder) rather than at the package root so enforce-test-proxy-imports' same-
// directory pairing with the colocated test can be satisfied — jest's `roots: ['<rootDir>/src']`
// would never discover a root-level test. See config-resolve-caller.ts's own header for the
// anchor file's job.
//
// Named configResolveBrokerProxy, NOT configResolveBrokerCallerProxy (matching this file's own
// name) — enforce-proxy-child-creation derives the implementation name a caller composing this
// as a child proxy is expected to import by stripping the trailing "Proxy" off the CALLED name,
// which must land on "configResolveBroker" (what every real caller genuinely imports) for the
// check to resolve at all; a caller-specific suffix here would make every one of C1's three
// callers report a phantom child-proxy creation.
//
// Import it per file: '@dungeonmaster/config/config-resolve-caller.proxy'.
import { registerMock } from '@dungeonmaster/testing/register-mock';
// Self-referencing package import, deliberately NOT relative and NOT via config-resolve-caller.ts:
// every real caller (orchestrator, siegelense) imports configResolveBroker from
// '@dungeonmaster/config' (the main barrel), and jest.mock() keys on the resolved module path — a
// different specifier here would mock a SEPARATE module instance from the one those callers' real
// code calls through (mirrors StartOrchestratorProxy's own self-reference in
// packages/orchestrator/src/startup/start-orchestrator.proxy.ts).
import { configResolveBroker } from '@dungeonmaster/config';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { ConfigNotFoundError } from './errors/config-not-found/config-not-found-error';
import { InvalidConfigError } from './errors/invalid-config/invalid-config-error';
import type { DungeonmasterConfigStub } from './contracts/dungeonmaster-config/dungeonmaster-config.stub';

type DungeonmasterConfig = ReturnType<typeof DungeonmasterConfigStub>;

export const configResolveBrokerProxy = (): {
  setupResolves: (params: { filePath: FilePath; config: DungeonmasterConfig }) => void;
  setupConfigNotFound: (params: { filePath: FilePath }) => void;
  setupConfigMalformed: (params: { filePath: FilePath; message: string }) => void;
} => {
  const handle = registerMock({ fn: configResolveBroker });

  return {
    setupResolves: ({
      filePath,
      config,
    }: {
      filePath: FilePath;
      config: DungeonmasterConfig;
    }): void => {
      handle.calledWith([{ filePath }]).resolves(config);
    },
    // Real shape configResolveBroker throws when configFileFindBroker walks off the top of the
    // tree with no .dungeonmaster.json — see brokers/config-file/find/config-file-find-broker.ts.
    setupConfigNotFound: ({ filePath }: { filePath: FilePath }): void => {
      handle.calledWith([{ filePath }]).rejects(new ConfigNotFoundError({ startPath: filePath }));
    },
    // Real shape configFileLoadBroker throws for invalid JSON, a failed zod parse, or any other
    // read failure — see brokers/config-file/load/config-file-load-broker.ts's catch-all wrap.
    setupConfigMalformed: ({
      filePath,
      message,
    }: {
      filePath: FilePath;
      message: string;
    }): void => {
      handle
        .calledWith([{ filePath }])
        .rejects(new InvalidConfigError({ message, configPath: filePath }));
    },
  };
};
