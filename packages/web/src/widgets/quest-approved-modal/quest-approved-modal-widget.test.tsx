import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestApprovedModalWidget } from './quest-approved-modal-widget';
import { QuestApprovedModalWidgetProxy } from './quest-approved-modal-widget.proxy';

describe('QuestApprovedModalWidget', () => {
  describe('rendering', () => {
    it('VALID: {opened: true} => renders modal with dumpster diving title', () => {
      QuestApprovedModalWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            beginQuestPending={false}
            onKeepChatting={jest.fn()}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('QUEST_APPROVED_MODAL_TITLE')).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders Begin Quest button', () => {
      QuestApprovedModalWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            beginQuestPending={false}
            onKeepChatting={jest.fn()}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByRole('button', { name: 'Begin Quest' })).toBeInTheDocument();
    });

    it('VALID: {opened: true} => renders Keep Chatting button', () => {
      QuestApprovedModalWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            beginQuestPending={false}
            onKeepChatting={jest.fn()}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByRole('button', { name: 'Keep Chatting' })).toBeInTheDocument();
    });

    it('VALID: {opened: true} => does NOT render the "Start a new Quest" button (removed in /dumpster-create pivot)', () => {
      const proxy = QuestApprovedModalWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            beginQuestPending={false}
            onKeepChatting={jest.fn()}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      expect(proxy.hasNewQuestButton()).toBe(false);
    });

    it('VALID: {opened: false} => does not render modal title', () => {
      QuestApprovedModalWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={false}
            beginQuestPending={false}
            onKeepChatting={jest.fn()}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      expect(screen.queryByTestId('QUEST_APPROVED_MODAL_TITLE')).toBe(null);
    });
  });

  describe('interactions', () => {
    it('VALID: {click Begin Quest} => calls onBeginQuest', async () => {
      const proxy = QuestApprovedModalWidgetProxy();
      const onBeginQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            beginQuestPending={false}
            onKeepChatting={jest.fn()}
            onBeginQuest={onBeginQuest}
          />
        ),
      });

      await proxy.clickBeginQuest();

      expect(onBeginQuest).toHaveBeenCalledTimes(1);
    });

    it('VALID: {click Keep Chatting} => calls onKeepChatting', async () => {
      const proxy = QuestApprovedModalWidgetProxy();
      const onKeepChatting = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            beginQuestPending={false}
            onKeepChatting={onKeepChatting}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      await proxy.clickKeepChatting();

      expect(onKeepChatting).toHaveBeenCalledTimes(1);
    });
  });

  describe('begin quest pending', () => {
    it('VALID: {beginQuestPending: true} => renders the Begin Quest button with pointer-events none', () => {
      QuestApprovedModalWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            beginQuestPending={true}
            onKeepChatting={jest.fn()}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const beginQuestButton = buttons.find((el) => el.textContent === 'Begin Quest');

      expect(beginQuestButton?.style.pointerEvents).toBe('none');
    });

    it('EDGE: {beginQuestPending: true, click Begin Quest} => does NOT call onBeginQuest and the modal stays open', async () => {
      const proxy = QuestApprovedModalWidgetProxy();
      const onBeginQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            beginQuestPending={true}
            onKeepChatting={jest.fn()}
            onBeginQuest={onBeginQuest}
          />
        ),
      });

      await proxy.clickBeginQuest();

      // Paired: the call count alone can't tell a blocked click from a click that never landed;
      // the modal title still being in the document is what proves the click reached the button
      // (opened stayed true — nothing dismissed it) and still didn't fire onBeginQuest.
      expect({
        beginQuestCalls: onBeginQuest.mock.calls.length,
        modalStillOpen: proxy.hasModal(),
      }).toStrictEqual({ beginQuestCalls: 0, modalStillOpen: true });
    });

    it('VALID: {beginQuestPending: true, click Keep Chatting} => still calls onKeepChatting, since only Begin Quest is guarded', async () => {
      const proxy = QuestApprovedModalWidgetProxy();
      const onKeepChatting = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestApprovedModalWidget
            opened={true}
            beginQuestPending={true}
            onKeepChatting={onKeepChatting}
            onBeginQuest={jest.fn()}
          />
        ),
      });

      await proxy.clickKeepChatting();

      expect(onKeepChatting).toHaveBeenCalledTimes(1);
    });
  });
});
