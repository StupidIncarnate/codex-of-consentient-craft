import { screen } from '@testing-library/react';
import { QuestIdStub, QuestListItemStub, SessionIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { TempSessionItemStub } from '../../contracts/temp-session-item/temp-session-item.stub';
import { GuildQuestListWidget } from './guild-quest-list-widget';
import { GuildQuestListWidgetProxy } from './guild-quest-list-widget.proxy';

describe('GuildQuestListWidget', () => {
  describe('rendering', () => {
    it('VALID: {quests} => renders QUESTS header', () => {
      const proxy = GuildQuestListWidgetProxy();
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: <GuildQuestListWidget quests={[]} onSelect={onSelect} onAdd={onAdd} />,
      });

      expect(proxy.hasHeader()).toBe(true);
    });

    it('VALID: {quests with items} => renders quest titles', () => {
      const proxy = GuildQuestListWidgetProxy();
      const questId = QuestIdStub({ value: 'my-quest' });
      const quest = QuestListItemStub({ id: questId, title: 'Test Quest' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: <GuildQuestListWidget quests={[quest]} onSelect={onSelect} onAdd={onAdd} />,
      });

      expect(proxy.isQuestVisible({ testId: `QUEST_ITEM_${questId}` })).toBe(true);
    });
  });

  describe('empty state', () => {
    it('EMPTY: {no quests} => renders empty state message', () => {
      const proxy = GuildQuestListWidgetProxy();
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: <GuildQuestListWidget quests={[]} onSelect={onSelect} onAdd={onAdd} />,
      });

      expect(proxy.hasEmptyState()).toBe(true);
    });

    it('VALID: {quests with items} => does not render empty state', () => {
      const proxy = GuildQuestListWidgetProxy();
      const quest = QuestListItemStub({ title: 'Some Quest' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: <GuildQuestListWidget quests={[quest]} onSelect={onSelect} onAdd={onAdd} />,
      });

      expect(proxy.hasEmptyState()).toBe(false);
    });
  });

  describe('status display', () => {
    it('VALID: {status: complete} => renders status in success color', () => {
      GuildQuestListWidgetProxy();
      const questId = QuestIdStub({ value: 'done-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: <GuildQuestListWidget quests={[quest]} onSelect={onSelect} onAdd={onAdd} />,
      });

      const statusEl = screen.getByTestId(`QUEST_STATUS_${questId}`);

      expect(statusEl.style.color).toBe('rgb(74, 222, 128)');
      expect(statusEl.textContent).toBe('COMPLETE');
    });

    it('VALID: {status: in_progress} => renders status in warning color', () => {
      GuildQuestListWidgetProxy();
      const questId = QuestIdStub({ value: 'wip-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'in_progress' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: <GuildQuestListWidget quests={[quest]} onSelect={onSelect} onAdd={onAdd} />,
      });

      const statusEl = screen.getByTestId(`QUEST_STATUS_${questId}`);

      expect(statusEl.style.color).toBe('rgb(245, 158, 11)');
      expect(statusEl.textContent).toBe('IN PROGRESS');
    });

    it('VALID: {status: pending} => renders status in text-dim color', () => {
      GuildQuestListWidgetProxy();
      const questId = QuestIdStub({ value: 'pending-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'pending' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: <GuildQuestListWidget quests={[quest]} onSelect={onSelect} onAdd={onAdd} />,
      });

      const statusEl = screen.getByTestId(`QUEST_STATUS_${questId}`);

      expect(statusEl.style.color).toBe('rgb(138, 114, 96)');
      expect(statusEl.textContent).toBe('PENDING');
    });

    it('VALID: {status: blocked} => renders status in danger color', () => {
      GuildQuestListWidgetProxy();
      const questId = QuestIdStub({ value: 'blocked-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'blocked' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: <GuildQuestListWidget quests={[quest]} onSelect={onSelect} onAdd={onAdd} />,
      });

      const statusEl = screen.getByTestId(`QUEST_STATUS_${questId}`);

      expect(statusEl.style.color).toBe('rgb(239, 68, 68)');
      expect(statusEl.textContent).toBe('BLOCKED');
    });

    it('VALID: {status: abandoned} => renders status in danger color', () => {
      GuildQuestListWidgetProxy();
      const questId = QuestIdStub({ value: 'abandoned-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'abandoned' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: <GuildQuestListWidget quests={[quest]} onSelect={onSelect} onAdd={onAdd} />,
      });

      const statusEl = screen.getByTestId(`QUEST_STATUS_${questId}`);

      expect(statusEl.style.color).toBe('rgb(239, 68, 68)');
      expect(statusEl.textContent).toBe('ABANDONED');
    });
  });

  describe('interaction', () => {
    it('VALID: {click quest} => calls onSelect with quest id', async () => {
      const proxy = GuildQuestListWidgetProxy();
      const questId = QuestIdStub({ value: 'click-quest' });
      const quest = QuestListItemStub({ id: questId, title: 'Clickable Quest' });
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: <GuildQuestListWidget quests={[quest]} onSelect={onSelect} onAdd={onAdd} />,
      });

      await proxy.clickQuest({ testId: `QUEST_ITEM_${questId}` });

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ questId });
    });

    it('VALID: {click add button} => calls onAdd', async () => {
      const proxy = GuildQuestListWidgetProxy();
      const onSelect = jest.fn();
      const onAdd = jest.fn();

      mantineRenderAdapter({
        ui: <GuildQuestListWidget quests={[]} onSelect={onSelect} onAdd={onAdd} />,
      });

      await proxy.clickAddButton();

      expect(onAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe('temp sessions', () => {
    it('VALID: {tempSessions with items} => renders TEMP label', () => {
      const proxy = GuildQuestListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'temp-session-1' });
      const tempSession = TempSessionItemStub({ sessionId });

      mantineRenderAdapter({
        ui: (
          <GuildQuestListWidget
            quests={[]}
            tempSessions={[tempSession]}
            onSelect={jest.fn()}
            onSelectSession={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.isTempSessionVisible({ testId: `TEMP_SESSION_${sessionId}` })).toBe(true);
      expect(proxy.getTempLabel({ testId: `TEMP_LABEL_${sessionId}` })).toBe('TEMP');
    });

    it('VALID: {tempSessions} => hides empty state when temp sessions exist', () => {
      const proxy = GuildQuestListWidgetProxy();
      const tempSession = TempSessionItemStub();

      mantineRenderAdapter({
        ui: (
          <GuildQuestListWidget
            quests={[]}
            tempSessions={[tempSession]}
            onSelect={jest.fn()}
            onSelectSession={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.hasEmptyState()).toBe(false);
    });

    it('VALID: {click temp session} => calls onSelectSession with sessionId', async () => {
      const proxy = GuildQuestListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'click-session' });
      const tempSession = TempSessionItemStub({ sessionId });
      const onSelectSession = jest.fn();

      mantineRenderAdapter({
        ui: (
          <GuildQuestListWidget
            quests={[]}
            tempSessions={[tempSession]}
            onSelect={jest.fn()}
            onSelectSession={onSelectSession}
            onAdd={jest.fn()}
          />
        ),
      });

      await proxy.clickTempSession({ testId: `TEMP_SESSION_${sessionId}` });

      expect(onSelectSession).toHaveBeenCalledTimes(1);
      expect(onSelectSession).toHaveBeenCalledWith({ sessionId });
    });

    it('VALID: {tempSessions rendered before quests} => temp sessions appear before quest items', () => {
      const proxy = GuildQuestListWidgetProxy();
      const sessionId = SessionIdStub({ value: 'order-session' });
      const tempSession = TempSessionItemStub({ sessionId });
      const questId = QuestIdStub({ value: 'order-quest' });
      const quest = QuestListItemStub({ id: questId, title: 'Second item' });

      mantineRenderAdapter({
        ui: (
          <GuildQuestListWidget
            quests={[quest]}
            tempSessions={[tempSession]}
            onSelect={jest.fn()}
            onSelectSession={jest.fn()}
            onAdd={jest.fn()}
          />
        ),
      });

      expect(proxy.isTempSessionVisible({ testId: `TEMP_SESSION_${sessionId}` })).toBe(true);
      expect(proxy.isQuestVisible({ testId: `QUEST_ITEM_${questId}` })).toBe(true);

      const tempEl = screen.getByTestId(`TEMP_SESSION_${sessionId}`);
      const questEl = screen.getByTestId(`QUEST_ITEM_${questId}`);
      const listContainer = screen.getByTestId('GUILD_QUEST_LIST');
      const allButtons = listContainer.querySelectorAll('button');
      const tempIndex = Array.from(allButtons).indexOf(tempEl as HTMLButtonElement);
      const questIndex = Array.from(allButtons).indexOf(questEl as HTMLButtonElement);

      expect(tempIndex).toBeLessThan(questIndex);
    });
  });
});
