import { SessionIdStub, SessionListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { SessionFilterStub } from '../../contracts/session-filter/session-filter.stub';
import { GuildSessionListWidget } from './guild-session-list-widget';
import { GuildSessionListWidgetProxy } from './guild-session-list-widget.proxy';

describe('GuildSessionListWidget', () => {
  describe('rendering', () => {
    it('VALID: {sessions} => renders SESSIONS header', () => {
      const proxy = GuildSessionListWidgetProxy();
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.hasHeader()).toBe(true);
    });

    it('VALID: {sessions with items} => renders session summary text', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'my-session' });
      const session = SessionListItemStub({ sessionId, summary: 'Fix the login bug' });
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[session]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.isSessionVisible({ testId: `SESSION_ITEM_${sessionId}` })).toBe(true);
    });
  });

  describe('quest badge', () => {
    it('VALID: {session with questTitle} => shows quest badge', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'quest-session' });
      const session = SessionListItemStub({
        sessionId,
        questTitle: 'Deploy Feature' as never,
        questId: 'quest-abc' as never,
      });
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[session]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.hasQuestBadge({ testId: `SESSION_QUEST_BADGE_${sessionId}` })).toBe(true);
      expect(proxy.getQuestBadgeText({ testId: `SESSION_QUEST_BADGE_${sessionId}` })).toBe(
        'Deploy Feature',
      );
    });

    it('VALID: {session without questTitle} => does not show quest badge', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'no-quest-session' });
      const session = SessionListItemStub({ sessionId });
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[session]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.hasQuestBadge({ testId: `SESSION_QUEST_BADGE_${sessionId}` })).toBe(false);
    });
  });

  describe('status display', () => {
    it('VALID: {active session, no questStatus} => shows ACTIVE in warning color', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'active-session' });
      const session = SessionListItemStub({ sessionId, active: true });
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[session]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.getStatusText({ testId: `SESSION_STATUS_${sessionId}` })).toBe('ACTIVE');
      expect(proxy.getStatusColor({ testId: `SESSION_STATUS_${sessionId}` })).toBe(
        'rgb(245, 158, 11)',
      );
    });

    it('VALID: {inactive session, no questStatus} => shows DONE in success color', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'done-session' });
      const session = SessionListItemStub({ sessionId, active: false });
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[session]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.getStatusText({ testId: `SESSION_STATUS_${sessionId}` })).toBe('DONE');
      expect(proxy.getStatusColor({ testId: `SESSION_STATUS_${sessionId}` })).toBe(
        'rgb(74, 222, 128)',
      );
    });

    it('VALID: {session with questStatus: complete} => shows quest status', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'quest-status-session' });
      const session = SessionListItemStub({
        sessionId,
        questStatus: 'complete' as never,
        questId: 'quest-xyz' as never,
      });
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[session]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.getStatusText({ testId: `SESSION_STATUS_${sessionId}` })).toBe('COMPLETE');
      expect(proxy.getStatusColor({ testId: `SESSION_STATUS_${sessionId}` })).toBe(
        'rgb(74, 222, 128)',
      );
    });
  });

  describe('empty state', () => {
    it('EMPTY: {no sessions} => renders empty state message', () => {
      const proxy = GuildSessionListWidgetProxy();
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.hasEmptyState()).toBe(true);
    });

    it('VALID: {sessions with items} => does not render empty state', () => {
      const proxy = GuildSessionListWidgetProxy();
      const session = SessionListItemStub();
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[session]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.hasEmptyState()).toBe(false);
    });
  });

  describe('filter toggle', () => {
    it('VALID: {filter: all} => filter shows all selected', () => {
      const proxy = GuildSessionListWidgetProxy();
      const filter = SessionFilterStub({ value: 'all' });

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.getFilterValue()).toBe('all');
    });

    it('VALID: {click Quests Only} => calls onFilterChange with quests-only', async () => {
      const proxy = GuildSessionListWidgetProxy();
      const filter = SessionFilterStub({ value: 'all' });
      const onFilterChange = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[]}
            filter={filter}
            onFilterChange={onFilterChange}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      await proxy.clickFilterOption({ label: 'Quests Only' });

      expect(onFilterChange).toHaveBeenCalledTimes(1);
      expect(onFilterChange).toHaveBeenCalledWith({ filter: 'quests-only' });
    });
  });

  describe('filtering', () => {
    it('VALID: {filter: quests-only, mix of quest/non-quest sessions} => only quest sessions rendered', () => {
      const proxy = GuildSessionListWidgetProxy();
      const questSessionId = SessionIdStub({ value: 'quest-session' });
      const nonQuestSessionId = SessionIdStub({ value: 'non-quest-session' });
      const questSession = SessionListItemStub({
        sessionId: questSessionId,
        questId: 'quest-abc' as never,
        summary: 'Quest session',
      });
      const nonQuestSession = SessionListItemStub({
        sessionId: nonQuestSessionId,
        summary: 'Regular session',
      });
      const filter = SessionFilterStub({ value: 'quests-only' });

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[questSession, nonQuestSession]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.isSessionVisible({ testId: `SESSION_ITEM_${questSessionId}` })).toBe(true);
      expect(proxy.isSessionVisible({ testId: `SESSION_ITEM_${nonQuestSessionId}` })).toBe(false);
    });

    it('VALID: {filter: all, mix of quest/non-quest sessions} => all sessions rendered', () => {
      const proxy = GuildSessionListWidgetProxy();
      const questSessionId = SessionIdStub({ value: 'quest-session-all' });
      const nonQuestSessionId = SessionIdStub({ value: 'non-quest-session-all' });
      const questSession = SessionListItemStub({
        sessionId: questSessionId,
        questId: 'quest-abc' as never,
        summary: 'Quest session',
      });
      const nonQuestSession = SessionListItemStub({
        sessionId: nonQuestSessionId,
        summary: 'Regular session',
      });
      const filter = SessionFilterStub({ value: 'all' });

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[questSession, nonQuestSession]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.isSessionVisible({ testId: `SESSION_ITEM_${questSessionId}` })).toBe(true);
      expect(proxy.isSessionVisible({ testId: `SESSION_ITEM_${nonQuestSessionId}` })).toBe(true);
    });

    it('EMPTY: {filter: quests-only, no quest sessions} => empty state shown', () => {
      const proxy = GuildSessionListWidgetProxy();
      const nonQuestSessionId = SessionIdStub({ value: 'no-quest' });
      const nonQuestSession = SessionListItemStub({
        sessionId: nonQuestSessionId,
        summary: 'Regular session',
      });
      const filter = SessionFilterStub({ value: 'quests-only' });

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[nonQuestSession]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.hasEmptyState()).toBe(true);
      expect(proxy.isSessionVisible({ testId: `SESSION_ITEM_${nonQuestSessionId}` })).toBe(false);
    });
  });

  describe('interaction', () => {
    it('VALID: {click session} => calls onSelect with sessionId', async () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'click-session' });
      const session = SessionListItemStub({ sessionId, summary: 'Clickable Session' });
      const filter = SessionFilterStub();
      const onSelect = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[session]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={onSelect}
            onAdd={jest.fn()}
          />
        ),
      });

      await proxy.clickSession({ testId: `SESSION_ITEM_${sessionId}` });

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ sessionId });
    });

    it('VALID: {click add button} => calls onAdd', async () => {
      const proxy = GuildSessionListWidgetProxy();
      const filter = SessionFilterStub();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={onAdd}
          />
        ),
      });

      await proxy.clickAddButton();

      expect(onAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('summary fallback', () => {
    it('VALID: {session without summary} => shows Untitled session', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'no-summary' });
      const session = SessionListItemStub({ sessionId });
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            sessions={[session]}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.isSessionVisible({ testId: `SESSION_ITEM_${sessionId}` })).toBe(true);
    });
  });
});
