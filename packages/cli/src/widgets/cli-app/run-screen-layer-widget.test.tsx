import React from 'react';

import { FilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';
import { FileNameStub } from '../../contracts/file-name/file-name.stub';

import { RunScreenLayerWidget } from './run-screen-layer-widget';
import { RunScreenLayerWidgetProxy } from './run-screen-layer-widget.proxy';

const noopCallback = (): void => {
  // No-op
};

const ASYNC_WAIT_MS = 100;

describe('RunScreenLayerWidget', () => {
  describe('rendering run screen content', () => {
    it('VALID: {empty quests} => displays Run Quest title and no quests message', async () => {
      const { bindingProxy } = RunScreenLayerWidgetProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      bindingProxy.brokerProxy.questsFolderProxy.findProxy.projectRootProxy.setupProjectRootFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
      });
      bindingProxy.brokerProxy.questsFolderProxy.findProxy.pathJoinProxy.returns({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      bindingProxy.brokerProxy.questsFolderProxy.mkdirProxy.succeeds({
        filepath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      bindingProxy.brokerProxy.fsReaddirProxy.returns({ files: [] });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <RunScreenLayerWidget
            startPath={startPath}
            onRunQuest={noopCallback}
            onBack={noopCallback}
          />
        ),
      });

      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Run Quest/u);
      expect(frame).toMatch(/No incomplete quests available to run/u);
    });

    it('VALID: {only complete quests} => displays no incomplete quests message', async () => {
      const { bindingProxy } = RunScreenLayerWidgetProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      bindingProxy.brokerProxy.questsFolderProxy.findProxy.projectRootProxy.setupProjectRootFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
      });
      bindingProxy.brokerProxy.questsFolderProxy.findProxy.pathJoinProxy.returns({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      bindingProxy.brokerProxy.questsFolderProxy.mkdirProxy.succeeds({
        filepath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      bindingProxy.brokerProxy.fsReaddirProxy.returns({
        files: [FileNameStub({ value: '001-complete-quest' })],
      });
      bindingProxy.brokerProxy.pathJoinProxy.returns({
        result: FilePathStub({
          value: '/project/.dungeonmaster-quests/001-complete-quest/quest.json',
        }),
      });
      bindingProxy.brokerProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(
          QuestStub({
            id: 'complete-quest',
            folder: '001-complete-quest',
            title: 'Complete Quest',
            status: 'complete',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        ),
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <RunScreenLayerWidget
            startPath={startPath}
            onRunQuest={noopCallback}
            onBack={noopCallback}
          />
        ),
      });

      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/No incomplete quests available to run/u);
    });

    it('VALID: {with incomplete quests} => displays incomplete quest list', async () => {
      const { bindingProxy } = RunScreenLayerWidgetProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      bindingProxy.brokerProxy.questsFolderProxy.findProxy.projectRootProxy.setupProjectRootFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
      });
      bindingProxy.brokerProxy.questsFolderProxy.findProxy.pathJoinProxy.returns({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      bindingProxy.brokerProxy.questsFolderProxy.mkdirProxy.succeeds({
        filepath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      bindingProxy.brokerProxy.fsReaddirProxy.returns({
        files: [
          FileNameStub({ value: '001-in-progress-quest' }),
          FileNameStub({ value: '002-complete-quest' }),
        ],
      });
      bindingProxy.brokerProxy.pathJoinProxy.returns({
        result: FilePathStub({
          value: '/project/.dungeonmaster-quests/001-in-progress-quest/quest.json',
        }),
      });
      bindingProxy.brokerProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(
          QuestStub({
            id: 'in-progress-quest',
            folder: '001-in-progress-quest',
            title: 'In Progress Quest',
            status: 'in_progress',
            createdAt: '2024-01-02T00:00:00Z',
          }),
        ),
      });
      bindingProxy.brokerProxy.pathJoinProxy.returns({
        result: FilePathStub({
          value: '/project/.dungeonmaster-quests/002-complete-quest/quest.json',
        }),
      });
      bindingProxy.brokerProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(
          QuestStub({
            id: 'complete-quest',
            folder: '002-complete-quest',
            title: 'Complete Quest',
            status: 'complete',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        ),
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <RunScreenLayerWidget
            startPath={startPath}
            onRunQuest={noopCallback}
            onBack={noopCallback}
          />
        ),
      });

      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/In Progress Quest/u);
      expect(frame).toMatch(/\[in_progress\]/u);
      expect(frame).not.toMatch(/Complete Quest/u);
    });

    it('VALID: {} => displays navigation instructions', async () => {
      const { bindingProxy } = RunScreenLayerWidgetProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      bindingProxy.brokerProxy.questsFolderProxy.findProxy.projectRootProxy.setupProjectRootFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
      });
      bindingProxy.brokerProxy.questsFolderProxy.findProxy.pathJoinProxy.returns({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      bindingProxy.brokerProxy.questsFolderProxy.mkdirProxy.succeeds({
        filepath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      bindingProxy.brokerProxy.fsReaddirProxy.returns({ files: [] });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <RunScreenLayerWidget
            startPath={startPath}
            onRunQuest={noopCallback}
            onBack={noopCallback}
          />
        ),
      });

      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/arrow keys/u);
      expect(frame).toMatch(/Enter to run/u);
      expect(frame).toMatch(/Escape/u);
    });

    it('VALID: {first quest} => displays first quest as selected by default', async () => {
      const { bindingProxy } = RunScreenLayerWidgetProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      bindingProxy.brokerProxy.questsFolderProxy.findProxy.projectRootProxy.setupProjectRootFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
      });
      bindingProxy.brokerProxy.questsFolderProxy.findProxy.pathJoinProxy.returns({
        result: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      bindingProxy.brokerProxy.questsFolderProxy.mkdirProxy.succeeds({
        filepath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });
      bindingProxy.brokerProxy.fsReaddirProxy.returns({
        files: [FileNameStub({ value: '001-first-quest' })],
      });
      bindingProxy.brokerProxy.pathJoinProxy.returns({
        result: FilePathStub({
          value: '/project/.dungeonmaster-quests/001-first-quest/quest.json',
        }),
      });
      bindingProxy.brokerProxy.questLoadProxy.fsReadFileProxy.resolves({
        content: JSON.stringify(
          QuestStub({
            id: 'first-quest',
            folder: '001-first-quest',
            title: 'First Quest',
            status: 'in_progress',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        ),
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <RunScreenLayerWidget
            startPath={startPath}
            onRunQuest={noopCallback}
            onBack={noopCallback}
          />
        ),
      });

      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/> \[in_progress\] First Quest/u);
    });
  });
});
