import { screen } from '@testing-library/react';
import { QuestIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
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
});
