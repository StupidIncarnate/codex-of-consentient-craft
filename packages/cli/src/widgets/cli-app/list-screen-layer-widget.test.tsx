import React from 'react';

import { FilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';
import { FileNameStub } from '../../contracts/file-name/file-name.stub';

import { ListScreenLayerWidget } from './list-screen-layer-widget';
import { ListScreenLayerWidgetProxy } from './list-screen-layer-widget.proxy';

const noopCallback = (): void => {
  // No-op
};

const ASYNC_WAIT_MS = 100;

describe('ListScreenLayerWidget', () => {
  describe('rendering list content', () => {
    it('VALID: {empty quests} => displays Quests title and no quests message', async () => {
      const proxy = ListScreenLayerWidgetProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      proxy.setupQuestsFolderFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
        questsFolderPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({ files: [] });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <ListScreenLayerWidget startPath={startPath} onBack={noopCallback} />,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Quests/u);
      expect(frame).toMatch(/No active quests found/u);
    });

    it('VALID: {with quests} => displays quest list sorted by newest first', async () => {
      const proxy = ListScreenLayerWidgetProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      proxy.setupQuestsFolderFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
        questsFolderPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({
        files: [FileNameStub({ value: '001-old-quest' }), FileNameStub({ value: '002-new-quest' })],
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/001-old-quest/quest.json' }),
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify(
          QuestStub({
            id: 'old-quest',
            folder: '001-old-quest',
            title: 'Old Quest',
            status: 'complete',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        ),
      });
      proxy.setupQuestFilePath({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests/002-new-quest/quest.json' }),
      });
      proxy.setupQuestFile({
        questJson: JSON.stringify(
          QuestStub({
            id: 'new-quest',
            folder: '002-new-quest',
            title: 'New Quest',
            status: 'in_progress',
            createdAt: '2024-01-02T00:00:00Z',
          }),
        ),
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <ListScreenLayerWidget startPath={startPath} onBack={noopCallback} />,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/New Quest/u);
      expect(frame).toMatch(/Old Quest/u);
      expect(frame).toMatch(/\[in_progress\]/u);
      expect(frame).toMatch(/\[done\]/u);
    });

    it('VALID: {} => displays back instruction', async () => {
      const proxy = ListScreenLayerWidgetProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      proxy.setupQuestsFolderFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
        questsFolderPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      proxy.setupQuestDirectories({ files: [] });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <ListScreenLayerWidget startPath={startPath} onBack={noopCallback} />,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Press Escape or 'q' to go back/u);
    });
  });
});
