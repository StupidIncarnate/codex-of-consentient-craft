/**
 * PURPOSE: Proxy for RunScreenLayerWidget that delegates to binding proxy for data setup
 *
 * USAGE:
 * const proxy = RunScreenLayerWidgetProxy();
 * proxy.setupQuestsFolderFound({ startPath, projectRootPath, questsFolderPath });
 * proxy.setupQuestDirectories({ files });
 * const { lastFrame, stdin } = render(<RunScreenLayerWidget startPath={startPath} onRunQuest={onRunQuest} onBack={onBack} />);
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';

import { inkBoxAdapterProxy } from '../../adapters/ink/box/ink-box-adapter.proxy';
import { inkTextAdapterProxy } from '../../adapters/ink/text/ink-text-adapter.proxy';
import { inkUseInputAdapterProxy } from '../../adapters/ink/use-input/ink-use-input-adapter.proxy';
import { useQuestsListBindingProxy } from '../../bindings/use-quests-list/use-quests-list-binding.proxy';
import type { FileName } from '../../contracts/file-name/file-name-contract';

export const RunScreenLayerWidgetProxy = (): {
  setupQuestsFolderFound: (params: {
    startPath: string;
    projectRootPath: string;
    questsFolderPath: FilePath;
  }) => void;
  setupQuestDirectories: (params: { files: FileName[] }) => void;
  setupQuestFilePath: (params: { result: FilePath }) => void;
  setupQuestFile: (params: { questJson: string }) => void;
} => {
  // Initialize child proxies for dependencies
  inkBoxAdapterProxy();
  inkTextAdapterProxy();
  inkUseInputAdapterProxy();

  const bindingProxy = useQuestsListBindingProxy();

  return {
    setupQuestsFolderFound: ({
      startPath,
      projectRootPath,
      questsFolderPath,
    }: {
      startPath: string;
      projectRootPath: string;
      questsFolderPath: FilePath;
    }): void => {
      bindingProxy.setupQuestsFolderFound({ startPath, projectRootPath, questsFolderPath });
    },
    setupQuestDirectories: ({ files }: { files: FileName[] }): void => {
      bindingProxy.setupQuestDirectories({ files });
    },
    setupQuestFilePath: ({ result }: { result: FilePath }): void => {
      bindingProxy.setupQuestFilePath({ result });
    },
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      bindingProxy.setupQuestFile({ questJson });
    },
  };
};
