import path from '#gateway/node/path';
import {
  readJsonFileIfExistsProxy,
  writeFileCreatingParentProxy,
} from '#gateway/node/_test_/fs__promises';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { installAgentsSetupBrokerProxy } from '../../../brokers/install/agents-setup/install-agents-setup-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import type { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { InstallCreateSettingsResponder } from './install-create-settings-responder';

// Every current test supplies this exact targetProjectRoot; the settings path below is derived
// from it so the fs read/write staging matches what the responder actually joins together.
const TARGET_PROJECT_ROOT = '/project';

export const InstallCreateSettingsResponderProxy = (): {
  callResponder: typeof InstallCreateSettingsResponder;
  setupNoExistingSettings: () => void;
  setupExistingSettings: (params: { content: ReturnType<typeof FileContentsStub> }) => void;
  setupCorruptSettings: () => void;
  setupUnreadableSettings: (params: { error: unknown }) => void;
  getWrittenContent: () => unknown;
} => {
  const agentsBrokerProxy = installAgentsSetupBrokerProxy();

  const settingsPath = FilePathStub({
    value: path.join(
      TARGET_PROJECT_ROOT,
      locationsStatics.repoRoot.claude.dir,
      locationsStatics.repoRoot.claude.settings,
    ),
  });

  const readProxy = readJsonFileIfExistsProxy();
  const writeProxy = writeFileCreatingParentProxy();

  writeProxy.succeeds({ path: settingsPath });
  agentsBrokerProxy.setupSuccess({
    targetProjectRoot: FilePathStub({ value: TARGET_PROJECT_ROOT }),
  });

  return {
    callResponder: InstallCreateSettingsResponder,

    setupNoExistingSettings: (): void => {
      readProxy.missing({ path: settingsPath });
    },

    setupExistingSettings: ({
      content,
    }: {
      content: ReturnType<typeof FileContentsStub>;
    }): void => {
      readProxy.returnsRaw({ path: settingsPath, rawContents: content });
    },

    // Bad JSON: readJsonFileIfExists itself throws a SyntaxError naming settingsPath — nothing to
    // stage on the read mock beyond the raw (unparseable) bytes it rejects while parsing.
    setupCorruptSettings: (): void => {
      readProxy.returnsRaw({ path: settingsPath, rawContents: '{not valid json' });
    },

    setupUnreadableSettings: ({ error }: { error: unknown }): void => {
      readProxy.rejects({ path: settingsPath, error });
    },

    getWrittenContent: (): unknown => writeProxy.writtenContentsFor({ path: settingsPath }),
  };
};
