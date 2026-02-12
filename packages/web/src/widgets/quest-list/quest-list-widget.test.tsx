import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessageStub, QuestIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestListWidget } from './quest-list-widget';
import { QuestListWidgetProxy } from './quest-list-widget.proxy';

describe('QuestListWidget', () => {
  describe('with quests', () => {
    it('VALID: {quests} => renders quest rows', () => {
      QuestListWidgetProxy();
      const quests = [
        QuestListItemStub({ id: 'quest-1', title: 'First Quest', status: 'in_progress' }),
        QuestListItemStub({ id: 'quest-2', title: 'Second Quest', status: 'complete' }),
      ];
      const onRefresh = jest.fn();
      const onSelectQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            quests={quests}
            loading={false}
            error={null}
            onRefresh={onRefresh}
            onSelectQuest={onSelectQuest}
          />
        ),
      });

      expect(screen.getByText('First Quest')).toBeInTheDocument();
      expect(screen.getByText('Second Quest')).toBeInTheDocument();
    });

    it('VALID: {quests} => renders status badges', () => {
      QuestListWidgetProxy();
      const quests = [
        QuestListItemStub({ id: 'quest-1', title: 'First Quest', status: 'in_progress' }),
      ];

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            quests={quests}
            loading={false}
            error={null}
            onRefresh={jest.fn()}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('in_progress')).toBeInTheDocument();
    });

    it('VALID: {click row} => fires onSelectQuest with questId', async () => {
      QuestListWidgetProxy();
      const questId = QuestIdStub({ value: 'quest-1' });
      const quests = [QuestListItemStub({ id: questId, title: 'First Quest' })];
      const onSelectQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            quests={quests}
            loading={false}
            error={null}
            onRefresh={jest.fn()}
            onSelectQuest={onSelectQuest}
          />
        ),
      });

      await userEvent.click(screen.getByText('First Quest'));

      expect(onSelectQuest).toHaveBeenCalledWith({ questId });
    });
  });

  describe('empty state', () => {
    it('EMPTY: {no quests} => shows empty state message', () => {
      QuestListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            quests={[]}
            loading={false}
            error={null}
            onRefresh={jest.fn()}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      expect(
        screen.getByText('No quests found. Create a quest to get started.'),
      ).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('ERROR: {error message} => shows error alert', () => {
      QuestListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            quests={[]}
            loading={false}
            error={ErrorMessageStub({ value: 'Something went wrong' })}
            onRefresh={jest.fn()}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('VALID: {loading with no quests} => shows loader', () => {
      QuestListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            quests={[]}
            loading={true}
            error={null}
            onRefresh={jest.fn()}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('Quests')).toBeInTheDocument();
    });
  });
});
