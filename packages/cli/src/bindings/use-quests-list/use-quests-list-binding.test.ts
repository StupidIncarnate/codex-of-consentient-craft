/**
 * PURPOSE: Tests for useQuestsListBinding hook
 */
import React from 'react';

import { ProjectIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';
import { inkTextAdapter } from '../../adapters/ink/text/ink-text-adapter';

import { useQuestsListBinding } from './use-quests-list-binding';
import { useQuestsListBindingProxy } from './use-quests-list-binding.proxy';

type ProjectId = ReturnType<typeof ProjectIdStub>;

const ASYNC_WAIT_MS = 100;

/**
 * Test wrapper component that uses the hook and renders its state
 */
const TestHookWrapper = ({ projectId }: { projectId: ProjectId }): React.ReactElement => {
  const { data, loading, error } = useQuestsListBinding({ projectId });
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
    it('VALID: {projectId} => returns loading true initially', () => {
      const proxy = useQuestsListBindingProxy();
      const projectId = ProjectIdStub();

      proxy.setupQuests({ quests: [] });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(TestHookWrapper, { projectId }),
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/loading:true/u);
    });
  });

  describe('successful fetch', () => {
    it('VALID: {projectId} => returns quests sorted by newest first', async () => {
      const proxy = useQuestsListBindingProxy();
      const projectId = ProjectIdStub();

      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            id: 'old-quest',
            folder: '001-old-quest',
            title: 'Old Quest',
            status: 'pending',
            createdAt: '2024-01-01T00:00:00Z',
          }),
          QuestListItemStub({
            id: 'new-quest',
            folder: '002-new-quest',
            title: 'New Quest',
            status: 'pending',
            createdAt: '2024-01-02T00:00:00Z',
          }),
        ],
      });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(TestHookWrapper, { projectId }),
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
      const projectId = ProjectIdStub();

      proxy.setupQuests({ quests: [] });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(TestHookWrapper, { projectId }),
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

  describe('error state', () => {
    it('ERROR: {orchestrator error} => returns error', async () => {
      const proxy = useQuestsListBindingProxy();
      const projectId = ProjectIdStub();

      proxy.setupError({ error: new Error('Failed to list quests') });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: React.createElement(TestHookWrapper, { projectId }),
      });

      // Wait for async to complete
      await new Promise((resolve) => {
        setTimeout(resolve, ASYNC_WAIT_MS);
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/loading:false/u);
      expect(frame).toMatch(/error:Failed to list quests/u);
    });
  });
});
