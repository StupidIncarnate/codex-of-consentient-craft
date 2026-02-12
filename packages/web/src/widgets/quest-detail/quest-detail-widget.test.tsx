import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestDetailWidget } from './quest-detail-widget';
import { QuestDetailWidgetProxy } from './quest-detail-widget.proxy';

type Quest = ReturnType<typeof QuestStub>;

describe('QuestDetailWidget', () => {
  describe('with quest data', () => {
    it('VALID: {quest} => renders quest title', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ title: 'Add Authentication' });

      mantineRenderAdapter({
        ui: (
          <QuestDetailWidget
            quest={quest}
            loading={false}
            error={null}
            onBack={jest.fn()}
            onStartQuest={jest.fn()}
            isRunning={false}
            processStatus={null}
            slotOutputs={new Map()}
          />
        ),
      });

      expect(screen.getByText('Add Authentication')).toBeInTheDocument();
    });

    it('VALID: {quest} => renders tabs', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub();

      mantineRenderAdapter({
        ui: (
          <QuestDetailWidget
            quest={quest}
            loading={false}
            error={null}
            onBack={jest.fn()}
            onStartQuest={jest.fn()}
            isRunning={false}
            processStatus={null}
            slotOutputs={new Map()}
          />
        ),
      });

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Requirements/u })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Steps/u })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Contracts/u })).toBeInTheDocument();
    });

    it('VALID: {click back} => fires onBack', async () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub();
      const onBack = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestDetailWidget
            quest={quest}
            loading={false}
            error={null}
            onBack={onBack}
            onStartQuest={jest.fn()}
            isRunning={false}
            processStatus={null}
            slotOutputs={new Map()}
          />
        ),
      });

      await userEvent.click(screen.getByText('Back to list'));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('VALID: {quest not running, not complete} => shows Start Quest button', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ status: 'in_progress' });

      mantineRenderAdapter({
        ui: (
          <QuestDetailWidget
            quest={quest}
            loading={false}
            error={null}
            onBack={jest.fn()}
            onStartQuest={jest.fn()}
            isRunning={false}
            processStatus={null}
            slotOutputs={new Map()}
          />
        ),
      });

      expect(screen.getByText('Start Quest')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('VALID: {loading} => shows loader', () => {
      QuestDetailWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestDetailWidget
            quest={null}
            loading={true}
            error={null}
            onBack={jest.fn()}
            onStartQuest={jest.fn()}
            isRunning={false}
            processStatus={null}
            slotOutputs={new Map()}
          />
        ),
      });

      expect(screen.queryByText('Back to list')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('ERROR: {error} => shows error alert with back button', () => {
      QuestDetailWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestDetailWidget
            quest={null}
            loading={false}
            error={new Error('Failed to load')}
            onBack={jest.fn()}
            onStartQuest={jest.fn()}
            isRunning={false}
            processStatus={null}
            slotOutputs={new Map()}
          />
        ),
      });

      expect(screen.getByText('Failed to load')).toBeInTheDocument();
      expect(screen.getByText('Back to list')).toBeInTheDocument();
    });
  });

  describe('null quest', () => {
    it('EMPTY: {quest: null} => shows not found message', () => {
      QuestDetailWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestDetailWidget
            quest={null}
            loading={false}
            error={null}
            onBack={jest.fn()}
            onStartQuest={jest.fn()}
            isRunning={false}
            processStatus={null}
            slotOutputs={new Map()}
          />
        ),
      });

      expect(screen.getByText('Quest not found')).toBeInTheDocument();
    });
  });
});
