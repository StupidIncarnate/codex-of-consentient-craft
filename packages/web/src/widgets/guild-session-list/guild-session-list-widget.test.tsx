import { useState } from 'react';
import {
  QuestIdStub,
  QuestListItemStub,
  SessionIdStub,
  SessionListItemStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { SessionFilterStub } from '../../contracts/session-filter/session-filter.stub';
import { GuildSessionListWidget } from './guild-session-list-widget';
import { GuildSessionListWidgetProxy } from './guild-session-list-widget.proxy';

type QuestId = ReturnType<typeof QuestIdStub>;

const StatefulDeleteHarness = ({
  quests,
  onDeleteQuest,
  deletingQuestId,
}: {
  quests: ReturnType<typeof QuestListItemStub>[];
  onDeleteQuest: (params: { questId: QuestId }) => void;
  deletingQuestId: QuestId | null;
}): React.JSX.Element => {
  const [confirmingQuestId, setConfirmingQuestId] = useState<QuestId | null>(null);
  return (
    <GuildSessionListWidget
      quests={quests}
      sessions={[]}
      loading={false}
      filter={SessionFilterStub({ value: 'quests-only' })}
      onFilterChange={jest.fn()}
      onSelect={jest.fn()}
      onSelectQuest={jest.fn()}
      onAdd={jest.fn()}
      confirmingQuestId={confirmingQuestId}
      onConfirmingQuestIdChange={({ questId }) => {
        setConfirmingQuestId(questId);
      }}
      onDeleteQuest={onDeleteQuest}
      deletingQuestId={deletingQuestId}
    />
  );
};

describe('GuildSessionListWidget', () => {
  describe('rendering', () => {
    it('VALID: {sessions} => renders SESSIONS header', () => {
      const proxy = GuildSessionListWidgetProxy();
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            quests={[]}
            sessions={[]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
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
            quests={[]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
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
            quests={[]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.hasQuestBadge({ testId: `SESSION_QUEST_BADGE_${sessionId}` })).toBe(true);
      expect(proxy.getQuestBadgeText({ testId: `SESSION_QUEST_BADGE_${sessionId}` })).toBe('QUEST');
    });

    it('VALID: {session without questTitle} => does not show quest badge', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'no-quest-session' });
      const session = SessionListItemStub({ sessionId });
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            quests={[]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.hasQuestBadge({ testId: `SESSION_QUEST_BADGE_${sessionId}` })).toBe(false);
    });
  });

  describe('status display', () => {
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
            quests={[]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.getStatusText({ testId: `SESSION_STATUS_${sessionId}` })).toBe('COMPLETE');
      expect(proxy.getStatusColor({ testId: `SESSION_STATUS_${sessionId}` })).toBe(
        'rgb(74, 222, 128)',
      );
    });

    it('VALID: {session with questStatus: seek_synth} => shows SEEK SYNTH with seek-synth color', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'seek-synth-session' });
      const session = SessionListItemStub({
        sessionId,
        questStatus: 'seek_synth' as never,
        questId: 'quest-ss' as never,
      });
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            quests={[]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.getStatusText({ testId: `SESSION_STATUS_${sessionId}` })).toBe('SEEK SYNTH');
      expect(proxy.getStatusColor({ testId: `SESSION_STATUS_${sessionId}` })).toBe(
        'rgb(167, 139, 250)',
      );
    });

    it('VALID: {session with questStatus: in_progress} => shows IN PROGRESS with primary color', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'in-progress-session' });
      const session = SessionListItemStub({
        sessionId,
        questStatus: 'in_progress' as never,
        questId: 'quest-ip' as never,
      });
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            quests={[]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.getStatusText({ testId: `SESSION_STATUS_${sessionId}` })).toBe('IN PROGRESS');
      expect(proxy.getStatusColor({ testId: `SESSION_STATUS_${sessionId}` })).toBe(
        'rgb(255, 107, 53)',
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
            quests={[]}
            sessions={[]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
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
            quests={[]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
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
            quests={[]}
            sessions={[]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
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
            quests={[]}
            sessions={[]}
            loading={false}
            filter={filter}
            onFilterChange={onFilterChange}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickFilterOption({ label: 'Quests Only' });

      expect(onFilterChange).toHaveBeenCalledTimes(1);
      expect(onFilterChange).toHaveBeenCalledWith({ filter: 'quests-only' });
    });
  });

  describe('filtering', () => {
    it('VALID: {filter: quests-only, with quests + sessions} => renders quest rows, not session rows', () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'quest-row-1' });
      const quest = QuestListItemStub({ id: questId, title: 'Quest One' as never });
      const sessionId = SessionIdStub({ value: 'session-1' });
      const session = SessionListItemStub({
        sessionId,
        questId: 'quest-row-1' as never,
        summary: 'Session 1',
      });
      const filter = SessionFilterStub({ value: 'quests-only' });

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            quests={[quest]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.isSessionVisible({ testId: `QUEST_ITEM_${questId}` })).toBe(true);
      expect(proxy.isSessionVisible({ testId: `SESSION_ITEM_${sessionId}` })).toBe(false);
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
            quests={[]}
            sessions={[questSession, nonQuestSession]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.isSessionVisible({ testId: `SESSION_ITEM_${questSessionId}` })).toBe(true);
      expect(proxy.isSessionVisible({ testId: `SESSION_ITEM_${nonQuestSessionId}` })).toBe(true);
    });

    it('EMPTY: {filter: quests-only, no quests on disk} => empty state shown regardless of sessions', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'orphan-session' });
      const session = SessionListItemStub({ sessionId, summary: 'Regular session' });
      const filter = SessionFilterStub({ value: 'quests-only' });

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            quests={[]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.hasEmptyState()).toBe(true);
      expect(proxy.isSessionVisible({ testId: `SESSION_ITEM_${sessionId}` })).toBe(false);
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
            quests={[]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={onSelect}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
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
            quests={[]}
            sessions={[]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={onAdd}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickAddButton();

      expect(onAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('display text', () => {
    it('VALID: {session with questTitle} => still displays the session summary (questTitle stays in the badge)', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'quest-display' });
      const session = SessionListItemStub({
        sessionId,
        summary: 'Fix the login bug' as never,
        questTitle: 'Deploy Feature' as never,
        questId: 'quest-abc' as never,
      });
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            quests={[]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.getSessionDisplayText({ testId: `SESSION_ITEM_${sessionId}` })).toBe(
        'Fix the login bug',
      );
    });

    it('VALID: {session without questTitle} => displays summary', () => {
      const proxy = GuildSessionListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'no-quest-display' });
      const session = SessionListItemStub({
        sessionId,
        summary: 'Fix the login bug' as never,
      });
      const filter = SessionFilterStub();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            quests={[]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.getSessionDisplayText({ testId: `SESSION_ITEM_${sessionId}` })).toBe(
        'Fix the login bug',
      );
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
            quests={[]}
            sessions={[session]}
            loading={false}
            filter={filter}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={jest.fn()}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.isSessionVisible({ testId: `SESSION_ITEM_${sessionId}` })).toBe(true);
    });
  });

  describe('delete button visibility (deletable statuses)', () => {
    it('VALID: {quest status complete} => skull delete button present in the row', () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'complete-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.isDeleteButtonVisible({ testId: `QUEST_DELETE_${questId}` })).toBe(true);
    });

    it('VALID: {quest status paused} => skull delete button present in the row', () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'paused-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'paused' as never });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.isDeleteButtonVisible({ testId: `QUEST_DELETE_${questId}` })).toBe(true);
    });

    it('VALID: {quest status created (pre-execution)} => skull delete button present in the row', () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'created-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'created' as never });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.isDeleteButtonVisible({ testId: `QUEST_DELETE_${questId}` })).toBe(true);
    });
  });

  describe('delete button absence (non-deletable statuses)', () => {
    it('EMPTY: {quest status in_progress} => no skull delete button for that row', () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'in-progress-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'in_progress' as never });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.isDeleteButtonVisible({ testId: `QUEST_DELETE_${questId}` })).toBe(false);
    });

    it('EMPTY: {quest status blocked} => no skull delete button for that row', () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'blocked-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'blocked' as never });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.isDeleteButtonVisible({ testId: `QUEST_DELETE_${questId}` })).toBe(false);
    });

    it('EMPTY: {quest status seek_walk} => no skull delete button for that row', () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'seek-walk-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'seek_walk' as never });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.isDeleteButtonVisible({ testId: `QUEST_DELETE_${questId}` })).toBe(false);
    });
  });

  describe('delete button appearance', () => {
    it("VALID: {deletable quest} => skull button has aria-label 'Delete quest'", () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'aria-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.getDeleteButtonAriaLabel({ testId: `QUEST_DELETE_${questId}` })).toBe(
        'Delete quest',
      );
    });

    it('VALID: {deletable quest} => skull button renders an svg glyph and no text label', () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'icon-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.hasDeleteButtonSkullIcon({ testId: `QUEST_DELETE_${questId}` })).toBe(true);
      expect(proxy.getDeleteButtonText({ testId: `QUEST_DELETE_${questId}` })).toBe('');
    });
  });

  describe('delete button interaction', () => {
    it('VALID: {click skull} => onSelectQuest not fired (no row navigation)', async () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'no-nav-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });
      const onSelectQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildSessionListWidget
            quests={[quest]}
            sessions={[]}
            loading={false}
            filter={SessionFilterStub({ value: 'quests-only' })}
            onFilterChange={jest.fn()}
            onSelect={jest.fn()}
            onSelectQuest={onSelectQuest}
            onAdd={jest.fn()}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });

      expect(onSelectQuest).toHaveBeenCalledTimes(0);
    });

    it('VALID: {click skull} => confirm popover becomes visible', async () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'popover-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });

      expect(proxy.isPopoverVisible({ testId: `QUEST_DELETE_POPOVER_${questId}` })).toBe(true);
    });

    it("VALID: {open popover} => popover text equals 'Deleting My Quest is permanent. Are you sure?'", async () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'text-quest' });
      const quest = QuestListItemStub({
        id: questId,
        title: 'My Quest' as never,
        status: 'complete' as never,
      });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });

      expect(proxy.getPopoverText({ testId: `QUEST_DELETE_POPOVER_${questId}` })).toBe(
        'Deleting My Quest is permanent. Are you sure?',
      );
    });

    it('VALID: {open popover} => Banish button present with exact label', async () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'banish-quest' });
      const quest = QuestListItemStub({
        id: questId,
        title: 'My Quest' as never,
        status: 'complete' as never,
      });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });

      expect(proxy.getPopoverText({ testId: `QUEST_DELETE_POPOVER_${questId}` })).toBe(
        'Deleting My Quest is permanent. Are you sure?',
      );
      expect(proxy.isBanishButtonDisabled()).toBe(false);
    });

    it('VALID: {open popover, click Spare} => popover no longer visible', async () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'spare-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });
      await proxy.clickSpare();

      expect(proxy.isPopoverVisible({ testId: `QUEST_DELETE_POPOVER_${questId}` })).toBe(false);
    });
  });

  describe('single popover at a time', () => {
    it('VALID: {open quest A then quest B skull} => only quest B popover visible', async () => {
      const proxy = GuildSessionListWidgetProxy();
      const questA = QuestListItemStub({
        id: QuestIdStub({ value: 'quest-a' }),
        status: 'complete' as never,
      });
      const questB = QuestListItemStub({
        id: QuestIdStub({ value: 'quest-b' }),
        status: 'complete' as never,
      });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[questA, questB]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questA.id}` });
      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questB.id}` });

      expect(proxy.getVisiblePopoverTestIds()).toStrictEqual([`QUEST_DELETE_POPOVER_${questB.id}`]);
    });
  });

  describe('spare cancels delete', () => {
    it('VALID: {open popover then Spare} => popover hidden, onDeleteQuest not called, row still present', async () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'cancel-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });
      const onDeleteQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={onDeleteQuest}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });
      await proxy.clickSpare();

      expect(proxy.isPopoverVisible({ testId: `QUEST_DELETE_POPOVER_${questId}` })).toBe(false);
      expect(onDeleteQuest).toHaveBeenCalledTimes(0);
      expect(proxy.isSessionVisible({ testId: `QUEST_ITEM_${questId}` })).toBe(true);
    });

    it('VALID: {click Banish} => onDeleteQuest called once with questId', async () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'banish-fire-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });
      const onDeleteQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={onDeleteQuest}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });
      await proxy.clickBanish();

      expect(onDeleteQuest).toHaveBeenCalledTimes(1);
      expect(onDeleteQuest).toHaveBeenCalledWith({ questId });
    });
  });

  describe('banish disabled while in flight', () => {
    it('VALID: {deletingQuestId equals row quest} => Banish button disabled', async () => {
      const proxy = GuildSessionListWidgetProxy();
      const questId = QuestIdStub({ value: 'inflight-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });

      mantineRenderAdapter({
        ui: (
          <StatefulDeleteHarness
            quests={[quest]}
            onDeleteQuest={jest.fn()}
            deletingQuestId={questId}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });

      expect(proxy.isBanishButtonDisabled()).toBe(true);
    });
  });
});
