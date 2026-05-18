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
