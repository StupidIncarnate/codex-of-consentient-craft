import { SessionIdStub, SessionListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { SessionRowLayerWidget } from './session-row-layer-widget';
import { SessionRowLayerWidgetProxy } from './session-row-layer-widget.proxy';

describe('SessionRowLayerWidget', () => {
  describe('rendering', () => {
    it('VALID: {session with summary} => renders the summary text', () => {
      const proxy = SessionRowLayerWidgetProxy();
      const sessionId = SessionIdStub({ value: 'my-session' });
      const session = SessionListItemStub({ sessionId, summary: 'Fix the login bug' });

      mantineRenderAdapter({
        ui: <SessionRowLayerWidget session={session} onSelect={jest.fn()} />,
      });

      expect(proxy.getSessionDisplayText({ testId: `SESSION_ITEM_${sessionId}` })).toBe(
        'Fix the login bug',
      );
    });

    it('EMPTY: {session without summary} => renders the Untitled session fallback', () => {
      const proxy = SessionRowLayerWidgetProxy();
      const sessionId = SessionIdStub({ value: 'no-summary' });
      const session = SessionListItemStub({ sessionId });

      mantineRenderAdapter({
        ui: <SessionRowLayerWidget session={session} onSelect={jest.fn()} />,
      });

      expect(proxy.getSessionDisplayText({ testId: `SESSION_ITEM_${sessionId}` })).toBe(
        'Untitled session',
      );
    });
  });

  describe('quest badge', () => {
    it('VALID: {session with questTitle} => shows the QUEST badge', () => {
      const proxy = SessionRowLayerWidgetProxy();
      const sessionId = SessionIdStub({ value: 'quest-session' });
      const session = SessionListItemStub({
        sessionId,
        questTitle: 'Deploy Feature' as never,
        questId: 'quest-abc' as never,
      });

      mantineRenderAdapter({
        ui: <SessionRowLayerWidget session={session} onSelect={jest.fn()} />,
      });

      expect(proxy.hasQuestBadge({ testId: `SESSION_QUEST_BADGE_${sessionId}` })).toBe(true);
      expect(proxy.getQuestBadgeText({ testId: `SESSION_QUEST_BADGE_${sessionId}` })).toBe('QUEST');
    });

    it('EMPTY: {session without questTitle} => does not show the QUEST badge', () => {
      const proxy = SessionRowLayerWidgetProxy();
      const sessionId = SessionIdStub({ value: 'no-quest-session' });
      const session = SessionListItemStub({ sessionId });

      mantineRenderAdapter({
        ui: <SessionRowLayerWidget session={session} onSelect={jest.fn()} />,
      });

      expect(proxy.hasQuestBadge({ testId: `SESSION_QUEST_BADGE_${sessionId}` })).toBe(false);
    });
  });

  describe('status display', () => {
    it('VALID: {session with questStatus: complete} => shows status text and its color', () => {
      const proxy = SessionRowLayerWidgetProxy();
      const sessionId = SessionIdStub({ value: 'complete-session' });
      const session = SessionListItemStub({
        sessionId,
        questStatus: 'complete' as never,
        questId: 'quest-xyz' as never,
      });

      mantineRenderAdapter({
        ui: <SessionRowLayerWidget session={session} onSelect={jest.fn()} />,
      });

      expect(proxy.getStatusText({ testId: `SESSION_STATUS_${sessionId}` })).toBe('COMPLETE');
      expect(proxy.getStatusColor({ testId: `SESSION_STATUS_${sessionId}` })).toBe(
        'rgb(74, 222, 128)',
      );
    });
  });

  describe('terminal state fade', () => {
    it('VALID: {session with questStatus: abandoned} => row opacity fades to 0.5', () => {
      const proxy = SessionRowLayerWidgetProxy();
      const sessionId = SessionIdStub({ value: 'abandoned-session' });
      const session = SessionListItemStub({
        sessionId,
        questStatus: 'abandoned' as never,
        questId: 'quest-abandoned' as never,
      });

      mantineRenderAdapter({
        ui: <SessionRowLayerWidget session={session} onSelect={jest.fn()} />,
      });

      expect(proxy.getRowOpacity({ testId: `SESSION_ITEM_${sessionId}` })).toBe('0.5');
    });

    it('EMPTY: {session with no questStatus} => row opacity stays at full strength', () => {
      const proxy = SessionRowLayerWidgetProxy();
      const sessionId = SessionIdStub({ value: 'no-status-session' });
      const session = SessionListItemStub({ sessionId });

      mantineRenderAdapter({
        ui: <SessionRowLayerWidget session={session} onSelect={jest.fn()} />,
      });

      expect(proxy.getRowOpacity({ testId: `SESSION_ITEM_${sessionId}` })).toBe('1');
    });
  });

  describe('interaction', () => {
    it('VALID: {click session} => calls onSelect with the session id', async () => {
      const proxy = SessionRowLayerWidgetProxy();
      const sessionId = SessionIdStub({ value: 'click-session' });
      const session = SessionListItemStub({ sessionId, summary: 'Clickable Session' });
      const onSelect = jest.fn();

      mantineRenderAdapter({
        ui: <SessionRowLayerWidget session={session} onSelect={onSelect} />,
      });

      await proxy.clickSession({ testId: `SESSION_ITEM_${sessionId}` });

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ sessionId });
    });
  });
});
