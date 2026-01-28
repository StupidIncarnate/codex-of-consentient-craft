/**
 * PURPOSE: Tests for useQuestsListBinding hook
 */
import React from 'react';

import { FilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { FileNameStub } from '../../contracts/file-name/file-name.stub';
import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';
import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';

import { useQuestsListBinding } from './use-quests-list-binding';
import { useQuestsListBindingProxy } from './use-quests-list-binding.proxy';

type FilePath = ReturnType<typeof FilePathStub>;

const ASYNC_WAIT_MS = 100;

/**
 * Test wrapper component that uses the hook and renders its state
 */
const TestHookWrapper = ({ startPath }: { startPath: FilePath }): React.ReactElement => {
  const { data, loading, error } = useQuestsListBinding({ startPath });
  const Text = inkTextAdapter();

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Text, null, `loading:${String(loading)}`),
    React.createElement(Text, null, `dataLength:${data.length}`),
    React.createElement(Text, null, `error:${error ? error.message : 'null'}`),
    ...data.map((quest, index) =>
      React.createElement(Text, { key: index }, `quest:${quest.id}:${quest.title}`),
    ),
  );
};

describe('useQuestsListBinding', () => {
  describe('loading state', () => {
    it('VALID: {startPath} => returns loading true initially', () => {
      const proxy = useQuestsListBindingProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      proxy.setupQuestsFolderFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
        questsFolderPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({ files: [] });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(TestHookWrapper, { startPath }),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/loading:true/u);
    });
  });

  describe('successful fetch', () => {
    it('VALID: {startPath} => returns quests sorted by newest first', async () => {
      const proxy = useQuestsListBindingProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      proxy.setupQuestsFolderFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
        questsFolderPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({
        files: [FileNameStub({ value: '001-old-quest' }), FileNameStub({ value: '002-new-quest' })],
      });
      // Old quest (created first)
      proxy.setupQuestFilePath({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/001-old-quest/quest.json' }),
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify(
          QuestStub({
            id: 'old-quest',
            folder: '001-old-quest',
            title: 'Old Quest',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        ),
      });
      // New quest (created second)
      proxy.setupQuestFilePath({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/002-new-quest/quest.json' }),
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify(
          QuestStub({
            id: 'new-quest',
            folder: '002-new-quest',
            title: 'New Quest',
            createdAt: '2024-01-02T00:00:00Z',
          }),
        ),
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(TestHookWrapper, { startPath }),
      });

      // Wait for async to complete
      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/loading:false/u);
      expect(frame).toMatch(/dataLength:2/u);
      // Verify newest first - new-quest should appear before old-quest
      expect(frame).toMatch(/quest:new-quest.*quest:old-quest/su);
    });
  });

  describe('empty state', () => {
    it('EMPTY: {no quests} => returns empty array', async () => {
      const proxy = useQuestsListBindingProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      proxy.setupQuestsFolderFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
        questsFolderPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({ files: [] });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(TestHookWrapper, { startPath }),
      });

      // Wait for async to complete
      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/loading:false/u);
      expect(frame).toMatch(/dataLength:0/u);
      expect(frame).toMatch(/error:null/u);
    });
  });
});
