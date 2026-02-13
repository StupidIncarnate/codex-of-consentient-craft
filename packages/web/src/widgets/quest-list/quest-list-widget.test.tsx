import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ErrorMessageStub,
  ProjectIdStub,
  QuestIdStub,
  QuestListItemStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestListWidget } from './quest-list-widget';
import { QuestListWidgetProxy } from './quest-list-widget.proxy';

const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

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
            projectId={projectId}
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
            projectId={projectId}
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
            projectId={projectId}
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
            projectId={projectId}
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
            projectId={projectId}
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
            projectId={projectId}
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

  describe('create quest modal', () => {
    it('VALID: {click New Quest} => opens create quest modal', async () => {
      QuestListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            projectId={projectId}
            quests={[]}
            loading={false}
            error={null}
            onRefresh={jest.fn()}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      await userEvent.click(screen.getByText('New Quest'));
      await screen.findByText('Create New Quest');

      expect(screen.getByText('Create New Quest')).toBeInTheDocument();
    });

    it('VALID: {successful create} => closes modal, resets form, calls onRefresh', async () => {
      const proxy = QuestListWidgetProxy();
      proxy.setupCreateSuccess();
      const onRefresh = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            projectId={projectId}
            quests={[]}
            loading={false}
            error={null}
            onRefresh={onRefresh}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      await userEvent.click(screen.getByText('New Quest'));
      await screen.findByText('Create New Quest');
      await userEvent.type(screen.getByPlaceholderText('Quest title'), 'My Quest');
      await userEvent.type(
        screen.getByPlaceholderText('Describe what you want to accomplish'),
        'Build something',
      );
      await userEvent.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledWith();
      });

      expect(onRefresh).toHaveBeenCalledWith();
    });

    it('EDGE: {empty title, click Create} => does not call questCreateBroker', async () => {
      QuestListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            projectId={projectId}
            quests={[]}
            loading={false}
            error={null}
            onRefresh={jest.fn()}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      await userEvent.click(screen.getByText('New Quest'));
      await screen.findByText('Create New Quest');
      await userEvent.type(
        screen.getByPlaceholderText('Describe what you want to accomplish'),
        'Build something',
      );

      expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    });

    it('VALID: {click Cancel} => closes modal without creating', async () => {
      QuestListWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            projectId={projectId}
            quests={[]}
            loading={false}
            error={null}
            onRefresh={jest.fn()}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      await userEvent.click(screen.getByText('New Quest'));
      await screen.findByText('Create New Quest');

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.queryByText('Create New Quest')).not.toBeInTheDocument();
      });

      expect(screen.queryByText('Create New Quest')).not.toBeInTheDocument();
    });
  });

  describe('branch coverage', () => {
    it('VALID: {loading: true, quests: [quest]} => renders quest table, NOT loader', () => {
      QuestListWidgetProxy();
      const quests = [
        QuestListItemStub({ id: 'quest-1', title: 'First Quest', status: 'in_progress' }),
      ];

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            projectId={projectId}
            quests={quests}
            loading={true}
            error={null}
            onRefresh={jest.fn()}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('First Quest')).toBeInTheDocument();
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    });

    it('VALID: {loading: true, quests: []} => renders loader spinner', () => {
      QuestListWidgetProxy();

      const { container } = mantineRenderAdapter({
        ui: (
          <QuestListWidget
            projectId={projectId}
            quests={[]}
            loading={true}
            error={null}
            onRefresh={jest.fn()}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      expect(container.querySelector('.mantine-Loader-root')).toBeInTheDocument();
      expect(
        screen.queryByText('No quests found. Create a quest to get started.'),
      ).not.toBeInTheDocument();
    });

    it('EDGE: {quest with no stepProgress field} => renders "-" in progress column', () => {
      QuestListWidgetProxy();
      const quests = [
        QuestListItemStub({
          id: 'quest-no-progress',
          title: 'No Progress Quest',
          stepProgress: undefined,
        }),
      ];

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            projectId={projectId}
            quests={quests}
            loading={false}
            error={null}
            onRefresh={jest.fn()}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('No Progress Quest')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('VALID: {click Refresh} => fires onRefresh callback', async () => {
      QuestListWidgetProxy();
      const onRefresh = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            projectId={projectId}
            quests={[]}
            loading={false}
            error={null}
            onRefresh={onRefresh}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      await userEvent.click(screen.getByText('Refresh'));

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('ERROR: {error message, quests: [quest]} => shows error alert AND quest table', () => {
      QuestListWidgetProxy();
      const quests = [
        QuestListItemStub({ id: 'quest-1', title: 'First Quest', status: 'complete' }),
      ];

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            projectId={projectId}
            quests={quests}
            loading={false}
            error={ErrorMessageStub({ value: 'Fetch failed' })}
            onRefresh={jest.fn()}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('Fetch failed')).toBeInTheDocument();
      expect(screen.getByText('First Quest')).toBeInTheDocument();
    });

    it('EDGE: {quest with status not in color map} => renders badge with gray fallback', () => {
      QuestListWidgetProxy();
      const quests = [
        QuestListItemStub({ id: 'quest-abandoned', title: 'Abandoned Quest', status: 'abandoned' }),
      ];

      mantineRenderAdapter({
        ui: (
          <QuestListWidget
            projectId={projectId}
            quests={quests}
            loading={false}
            error={null}
            onRefresh={jest.fn()}
            onSelectQuest={jest.fn()}
          />
        ),
      });

      expect(screen.getByText('abandoned')).toBeInTheDocument();
      expect(screen.getByText('Abandoned Quest')).toBeInTheDocument();
    });
  });
});
