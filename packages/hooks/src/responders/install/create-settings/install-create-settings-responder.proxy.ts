import path from '#gateway/node/path';
import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';
import { writeFileCreatingParentProxy } from '#gateway/node/fs__promises/write-file-creating-parent/write-file-creating-parent.proxy';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { installAgentsSetupBrokerProxy } from '../../../brokers/install/agents-setup/install-agents-setup-broker.proxy';
import { InstallCreateSettingsResponder } from './install-create-settings-responder';

// Every current test supplies this exact targetProjectRoot; the settings path below is derived
// from it so the fs read/write staging matches what the responder actually joins together.
const TARGET_PROJECT_ROOT = '/project';

export const InstallCreateSettingsResponderProxy = (): {
  callResponder: typeof InstallCreateSettingsResponder;
  setupNoExistingSettings: () => void;
  setupExistingSettings: (params: { content: string }) => void;
  setupCorruptSettings: () => void;
  setupUnreadableSettings: () => void;
  getWrittenContent: () => unknown;
} => {
  const agentsBrokerProxy = installAgentsSetupBrokerProxy();

  const settingsPath = path.join(
    TARGET_PROJECT_ROOT,
    locationsStatics.repoRoot.claude.dir,
    locationsStatics.repoRoot.claude.settings,
  );

  const readProxy = readJsonFileIfExistsProxy();
  const writeProxy = writeFileCreatingParentProxy();

  writeProxy.succeeds({ path: settingsPath });
  agentsBrokerProxy.setupSuccess({
    targetProjectRoot: TARGET_PROJECT_ROOT,
  });

  return {
    callResponder: InstallCreateSettingsResponder,

    setupNoExistingSettings: (): void => {
      readProxy.missing({ path: settingsPath });
    },

    setupExistingSettings: ({ content }: { content: string }): void => {
      readProxy.returnsRaw({ path: settingsPath, rawContents: content });
    },

    // Bad JSON: readJsonFileIfExists itself throws a SyntaxError naming settingsPath — nothing to
    // stage on the read mock beyond the raw (unparseable) bytes it rejects while parsing.
    setupCorruptSettings: (): void => {
      readProxy.returnsRaw({ path: settingsPath, rawContents: '{not valid json' });
    },

    setupUnreadableSettings: (): void => {
      readProxy.denied({ path: settingsPath });
    },

    getWrittenContent: (): unknown => writeProxy.writtenContentsFor({ path: settingsPath }),
  };
};
