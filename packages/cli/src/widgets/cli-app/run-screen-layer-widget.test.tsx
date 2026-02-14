import React from 'react';

import { GuildIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

import { RunScreenLayerWidget } from './run-screen-layer-widget';
import { RunScreenLayerWidgetProxy } from './run-screen-layer-widget.proxy';

const noopCallback = (): void => {
  // No-op
};

const ASYNC_WAIT_MS = 100;

describe('RunScreenLayerWidget', () => {
  describe('rendering run screen content', () => {
    it('VALID: {empty quests} => displays Run Quest title and no quests message', async () => {
      const proxy = RunScreenLayerWidgetProxy();
      const guildId = GuildIdStub();

      proxy.setupQuests({ quests: [] });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <RunScreenLayerWidget guildId={guildId} onRunQuest={noopCallback} onBack={noopCallback} />
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
      const proxy = RunScreenLayerWidgetProxy();
      const guildId = GuildIdStub();

      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            id: 'complete-quest',
            folder: '001-complete-quest',
            title: 'Complete Quest',
            status: 'complete',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        ],
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <RunScreenLayerWidget guildId={guildId} onRunQuest={noopCallback} onBack={noopCallback} />
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
      const proxy = RunScreenLayerWidgetProxy();
      const guildId = GuildIdStub();

      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            id: 'in-progress-quest',
            folder: '001-in-progress-quest',
            title: 'In Progress Quest',
            status: 'in_progress',
            createdAt: '2024-01-02T00:00:00Z',
          }),
          QuestListItemStub({
            id: 'complete-quest',
            folder: '002-complete-quest',
            title: 'Complete Quest',
            status: 'complete',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        ],
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <RunScreenLayerWidget guildId={guildId} onRunQuest={noopCallback} onBack={noopCallback} />
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
      const proxy = RunScreenLayerWidgetProxy();
      const guildId = GuildIdStub();

      proxy.setupQuests({ quests: [] });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <RunScreenLayerWidget guildId={guildId} onRunQuest={noopCallback} onBack={noopCallback} />
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
      const proxy = RunScreenLayerWidgetProxy();
      const guildId = GuildIdStub();

      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            id: 'first-quest',
            folder: '001-first-quest',
            title: 'First Quest',
            status: 'in_progress',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        ],
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <RunScreenLayerWidget guildId={guildId} onRunQuest={noopCallback} onBack={noopCallback} />
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
