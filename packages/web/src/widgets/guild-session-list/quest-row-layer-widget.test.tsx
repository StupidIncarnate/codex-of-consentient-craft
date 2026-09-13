import { useState } from 'react';
import { QuestIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestRowLayerWidget } from './quest-row-layer-widget';
import { QuestRowLayerWidgetProxy } from './quest-row-layer-widget.proxy';

type QuestId = ReturnType<typeof QuestIdStub>;

const StatefulQuestRowHarness = ({
  quest,
  onDeleteQuest,
  onSelectQuest,
  deletingQuestId,
}: {
  quest: ReturnType<typeof QuestListItemStub>;
  onDeleteQuest: (params: { questId: QuestId }) => void;
  onSelectQuest: (params: { questId: QuestId }) => void;
  deletingQuestId: QuestId | null;
}): React.JSX.Element => {
  const [confirmingQuestId, setConfirmingQuestId] = useState<QuestId | null>(null);
  return (
    <QuestRowLayerWidget
      quest={quest}
      confirmingQuestId={confirmingQuestId}
      onConfirmingQuestIdChange={({ questId }) => {
        setConfirmingQuestId(questId);
      }}
      onSelectQuest={onSelectQuest}
      onDeleteQuest={onDeleteQuest}
      deletingQuestId={deletingQuestId}
    />
  );
};

describe('QuestRowLayerWidget', () => {
  describe('rendering', () => {
    it('VALID: {quest} => renders the quest title and status text', () => {
      const proxy = QuestRowLayerWidgetProxy();
      const questId = QuestIdStub({ value: 'render-quest' });
      const quest = QuestListItemStub({
        id: questId,
        title: 'Deploy Feature' as never,
        status: 'in_progress' as never,
      });

      mantineRenderAdapter({
        ui: (
          <QuestRowLayerWidget
            quest={quest}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onSelectQuest={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.isRowVisible({ testId: `QUEST_ITEM_${questId}` })).toBe(true);
      expect(proxy.getStatusText({ testId: `QUEST_STATUS_${questId}` })).toBe('IN PROGRESS');
    });
  });

  describe('interaction', () => {
    it('VALID: {click row} => calls onSelectQuest with the quest id', async () => {
      const proxy = QuestRowLayerWidgetProxy();
      const questId = QuestIdStub({ value: 'click-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'in_progress' as never });
      const onSelectQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestRowLayerWidget
            quest={quest}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onSelectQuest={onSelectQuest}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickRow({ testId: `QUEST_ITEM_${questId}` });

      expect(onSelectQuest).toHaveBeenCalledTimes(1);
      expect(onSelectQuest).toHaveBeenCalledWith({ questId });
    });
  });

  describe('delete button visibility', () => {
    it('VALID: {quest status complete} => skull delete button present', () => {
      const proxy = QuestRowLayerWidgetProxy();
      const questId = QuestIdStub({ value: 'complete-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });

      mantineRenderAdapter({
        ui: (
          <QuestRowLayerWidget
            quest={quest}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onSelectQuest={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.isDeleteButtonVisible({ testId: `QUEST_DELETE_${questId}` })).toBe(true);
      expect(proxy.getDeleteButtonAriaLabel({ testId: `QUEST_DELETE_${questId}` })).toBe(
        'Delete quest',
      );
      expect(proxy.hasDeleteButtonSkullIcon({ testId: `QUEST_DELETE_${questId}` })).toBe(true);
    });

    it('EMPTY: {quest status in_progress} => no skull delete button', () => {
      const proxy = QuestRowLayerWidgetProxy();
      const questId = QuestIdStub({ value: 'in-progress-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'in_progress' as never });

      mantineRenderAdapter({
        ui: (
          <QuestRowLayerWidget
            quest={quest}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onSelectQuest={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.isDeleteButtonVisible({ testId: `QUEST_DELETE_${questId}` })).toBe(false);
    });
  });

  describe('delete confirmation flow', () => {
    it('VALID: {click skull} => onSelectQuest not fired and popover becomes visible', async () => {
      const proxy = QuestRowLayerWidgetProxy();
      const questId = QuestIdStub({ value: 'confirm-quest' });
      const quest = QuestListItemStub({
        id: questId,
        title: 'My Quest' as never,
        status: 'complete' as never,
      });
      const onSelectQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <StatefulQuestRowHarness
            quest={quest}
            onDeleteQuest={jest.fn()}
            onSelectQuest={onSelectQuest}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });

      expect(onSelectQuest).toHaveBeenCalledTimes(0);
      expect(proxy.isPopoverVisible({ testId: `QUEST_DELETE_POPOVER_${questId}` })).toBe(true);
      expect(proxy.getPopoverText({ testId: `QUEST_DELETE_POPOVER_${questId}` })).toBe(
        'Deleting My Quest is permanent. Are you sure?',
      );
    });

    it('VALID: {open popover, click Spare} => popover closes and onDeleteQuest not called', async () => {
      const proxy = QuestRowLayerWidgetProxy();
      const questId = QuestIdStub({ value: 'spare-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });
      const onDeleteQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <StatefulQuestRowHarness
            quest={quest}
            onDeleteQuest={onDeleteQuest}
            onSelectQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });
      await proxy.clickSpare();

      expect(proxy.isPopoverVisible({ testId: `QUEST_DELETE_POPOVER_${questId}` })).toBe(false);
      expect(onDeleteQuest).toHaveBeenCalledTimes(0);
    });

    it('VALID: {open popover, click Banish} => onDeleteQuest called once with the quest id', async () => {
      const proxy = QuestRowLayerWidgetProxy();
      const questId = QuestIdStub({ value: 'banish-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });
      const onDeleteQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <StatefulQuestRowHarness
            quest={quest}
            onDeleteQuest={onDeleteQuest}
            onSelectQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });
      await proxy.clickBanish();

      expect(onDeleteQuest).toHaveBeenCalledTimes(1);
      expect(onDeleteQuest).toHaveBeenCalledWith({ questId });
    });

    it('VALID: {deletingQuestId equals row quest} => Banish button disabled', async () => {
      const proxy = QuestRowLayerWidgetProxy();
      const questId = QuestIdStub({ value: 'inflight-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'complete' as never });

      mantineRenderAdapter({
        ui: (
          <StatefulQuestRowHarness
            quest={quest}
            onDeleteQuest={jest.fn()}
            onSelectQuest={jest.fn()}
            deletingQuestId={questId}
          />
        ),
      });

      await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });

      expect(proxy.isBanishButtonDisabled()).toBe(true);
    });
  });

  describe('terminal state fade', () => {
    it('VALID: {quest status abandoned} => row opacity fades to 0.5', () => {
      const proxy = QuestRowLayerWidgetProxy();
      const questId = QuestIdStub({ value: 'abandoned-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'abandoned' as never });

      mantineRenderAdapter({
        ui: (
          <QuestRowLayerWidget
            quest={quest}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onSelectQuest={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.getRowOpacity({ testId: `QUEST_ITEM_${questId}` })).toBe('0.5');
    });

    it('VALID: {quest status in_progress} => row opacity stays at full strength', () => {
      const proxy = QuestRowLayerWidgetProxy();
      const questId = QuestIdStub({ value: 'active-quest' });
      const quest = QuestListItemStub({ id: questId, status: 'in_progress' as never });

      mantineRenderAdapter({
        ui: (
          <QuestRowLayerWidget
            quest={quest}
            confirmingQuestId={null}
            onConfirmingQuestIdChange={jest.fn()}
            onSelectQuest={jest.fn()}
            onDeleteQuest={jest.fn()}
            deletingQuestId={null}
          />
        ),
      });

      expect(proxy.getRowOpacity({ testId: `QUEST_ITEM_${questId}` })).toBe('1');
      expect(proxy.isRowVisible({ testId: `QUEST_ITEM_${questId}` })).toBe(true);
    });
  });
});
