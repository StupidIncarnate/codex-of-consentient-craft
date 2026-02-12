import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ContextStub,
  DependencyStepStub,
  OrchestrationStatusStub,
  QuestContractEntryStub,
  QuestStub,
  RequirementStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestVerifyCheckStub } from '../../contracts/quest-verify-check/quest-verify-check.stub';
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

  describe('empty array fields', () => {
    it('EDGE: {quest with requirements: []} => renders without crash', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ requirements: [] });

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

      expect(screen.getByText(quest.title)).toBeInTheDocument();
    });

    it('EDGE: {quest with steps: []} => renders without crash', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ steps: [] });

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

      expect(screen.getByText(quest.title)).toBeInTheDocument();
    });

    it('EDGE: {quest with contracts: []} => renders without crash', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ contracts: [] });

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

      expect(screen.getByText(quest.title)).toBeInTheDocument();
    });

    it('EDGE: {quest with contexts: []} => renders without crash', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ contexts: [] });

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

      expect(screen.getByText(quest.title)).toBeInTheDocument();
    });

    it('EDGE: {quest with observables: []} => renders without crash', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ observables: [] });

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

      expect(screen.getByText(quest.title)).toBeInTheDocument();
    });
  });

  describe('verify quest modal', () => {
    it('VALID: {click Verify Quest, broker succeeds with checks} => opens modal showing "All checks passed"', async () => {
      const proxy = QuestDetailWidgetProxy();
      const quest: Quest = QuestStub();
      proxy.setupVerifySuccess({
        result: {
          success: true,
          checks: [QuestVerifyCheckStub({ name: 'dependency-graph', passed: true })],
        },
      });

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

      await userEvent.click(screen.getByText('Verify Quest'));

      await expect(screen.findByText('All checks passed')).resolves.toBeInTheDocument();
    });

    it('VALID: {click Verify Quest, success with 0 checks} => opens modal showing "All 0 checks passed"', async () => {
      const proxy = QuestDetailWidgetProxy();
      const quest: Quest = QuestStub();
      proxy.setupVerifySuccess({
        result: { success: true, checks: [] },
      });

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

      await userEvent.click(screen.getByText('Verify Quest'));

      await expect(screen.findByText(/All 0 checks passed/u)).resolves.toBeInTheDocument();
    });

    it('ERROR: {click Verify Quest, broker fails} => opens modal showing "Issues found"', async () => {
      const proxy = QuestDetailWidgetProxy();
      const quest: Quest = QuestStub();
      proxy.setupVerifySuccess({
        result: { success: false, checks: [QuestVerifyCheckStub({ passed: false })] },
      });

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

      await userEvent.click(screen.getByText('Verify Quest'));

      await expect(screen.findByText('Issues found')).resolves.toBeInTheDocument();
    });

    it('ERROR: {click Verify Quest, broker throws} => opens modal with failure result', async () => {
      const proxy = QuestDetailWidgetProxy();
      const quest: Quest = QuestStub();
      proxy.setupVerifyError();

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

      await userEvent.click(screen.getByText('Verify Quest'));

      await expect(screen.findByText('Issues found')).resolves.toBeInTheDocument();
    });

    it('VALID: {verify check with message} => renders check name and message', async () => {
      const proxy = QuestDetailWidgetProxy();
      const quest: Quest = QuestStub();
      proxy.setupVerifySuccess({
        result: {
          success: true,
          checks: [
            QuestVerifyCheckStub({
              name: 'observable-coverage',
              passed: true,
              message: 'All observables covered',
            }),
          ],
        },
      });

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

      await userEvent.click(screen.getByText('Verify Quest'));

      await expect(screen.findByText('observable-coverage')).resolves.toBeInTheDocument();
      expect(screen.getByText('All observables covered')).toBeInTheDocument();
    });

    it('VALID: {verify check without message} => renders only check name', async () => {
      const proxy = QuestDetailWidgetProxy();
      const quest: Quest = QuestStub();
      proxy.setupVerifySuccess({
        result: {
          success: true,
          checks: [QuestVerifyCheckStub({ name: 'dependency-graph', passed: true })],
        },
      });

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

      await userEvent.click(screen.getByText('Verify Quest'));

      await expect(screen.findByText('dependency-graph')).resolves.toBeInTheDocument();
    });

    it('VALID: {verify check passed: true} => renders green PASS badge', async () => {
      const proxy = QuestDetailWidgetProxy();
      const quest: Quest = QuestStub();
      proxy.setupVerifySuccess({
        result: {
          success: true,
          checks: [QuestVerifyCheckStub({ name: 'dep-check', passed: true })],
        },
      });

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

      await userEvent.click(screen.getByText('Verify Quest'));

      await screen.findByText('dep-check');

      expect(screen.getByText('PASS')).toBeInTheDocument();
    });

    it('VALID: {verify check passed: false} => renders red FAIL badge', async () => {
      const proxy = QuestDetailWidgetProxy();
      const quest: Quest = QuestStub();
      proxy.setupVerifySuccess({
        result: {
          success: false,
          checks: [QuestVerifyCheckStub({ name: 'dep-check', passed: false })],
        },
      });

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

      await userEvent.click(screen.getByText('Verify Quest'));

      await screen.findByText('dep-check');

      expect(screen.getByText('FAIL')).toBeInTheDocument();
    });
  });

  describe('conditional rendering branches', () => {
    it('VALID: {isRunning: true, status: "in_progress"} => does NOT show Start Quest button', () => {
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
            isRunning={true}
            processStatus={null}
            slotOutputs={new Map()}
          />
        ),
      });

      expect(screen.queryByText('Start Quest')).not.toBeInTheDocument();
    });

    it('VALID: {isRunning: false, status: "complete"} => does NOT show Start Quest button', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ status: 'complete' });

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

      expect(screen.queryByText('Start Quest')).not.toBeInTheDocument();
    });

    it('VALID: {click Start Quest} => fires onStartQuest with quest id', async () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ status: 'pending' });
      const onStartQuest = jest.fn();

      mantineRenderAdapter({
        ui: (
          <QuestDetailWidget
            quest={quest}
            loading={false}
            error={null}
            onBack={jest.fn()}
            onStartQuest={onStartQuest}
            isRunning={false}
            processStatus={null}
            slotOutputs={new Map()}
          />
        ),
      });

      await userEvent.click(screen.getByText('Start Quest'));

      expect(onStartQuest).toHaveBeenCalledTimes(1);
      expect(onStartQuest).toHaveBeenCalledWith({ questId: quest.id });
    });

    it('VALID: {isRunning: true, processStatus: present} => renders ExecutionDashboardWidget', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub();
      const processStatus = OrchestrationStatusStub();

      mantineRenderAdapter({
        ui: (
          <QuestDetailWidget
            quest={quest}
            loading={false}
            error={null}
            onBack={jest.fn()}
            onStartQuest={jest.fn()}
            isRunning={true}
            processStatus={processStatus}
            slotOutputs={new Map()}
          />
        ),
      });

      expect(screen.getByTestId('EXECUTION_DASHBOARD')).toBeInTheDocument();
    });

    it('VALID: {isRunning: true, processStatus: null} => does NOT render ExecutionDashboardWidget', () => {
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
            isRunning={true}
            processStatus={null}
            slotOutputs={new Map()}
          />
        ),
      });

      expect(screen.queryByTestId('EXECUTION_DASHBOARD')).not.toBeInTheDocument();
    });

    it('VALID: {isRunning: false, processStatus: present} => does NOT render ExecutionDashboardWidget', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub();
      const processStatus = OrchestrationStatusStub();

      mantineRenderAdapter({
        ui: (
          <QuestDetailWidget
            quest={quest}
            loading={false}
            error={null}
            onBack={jest.fn()}
            onStartQuest={jest.fn()}
            isRunning={false}
            processStatus={processStatus}
            slotOutputs={new Map()}
          />
        ),
      });

      expect(screen.queryByTestId('EXECUTION_DASHBOARD')).not.toBeInTheDocument();
    });
  });

  describe('populated data rendering', () => {
    it('VALID: {quest with 2 requirements} => renders requirements table with rows', async () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({
        requirements: [
          RequirementStub({ id: 'a12ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Feature A' }),
          RequirementStub({ id: 'b12ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Feature B' }),
        ],
      });

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

      await userEvent.click(screen.getByRole('tab', { name: /Requirements/u }));

      expect(screen.getByText('Feature A')).toBeInTheDocument();
      expect(screen.getByText('Feature B')).toBeInTheDocument();
    });

    it('VALID: {quest with 0 requirements} => renders "No requirements defined" message', async () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ requirements: [] });

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

      await userEvent.click(screen.getByRole('tab', { name: /Requirements/u }));

      expect(screen.getByText('No requirements defined')).toBeInTheDocument();
    });

    it('VALID: {quest with 2 steps} => renders steps table with rows', async () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({
        steps: [
          DependencyStepStub({ id: 'a5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b', name: 'Step Alpha' }),
          DependencyStepStub({ id: 'b5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b', name: 'Step Beta' }),
        ],
      });

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

      await userEvent.click(screen.getByRole('tab', { name: /Steps/u }));

      expect(screen.getByText('Step Alpha')).toBeInTheDocument();
      expect(screen.getByText('Step Beta')).toBeInTheDocument();
    });

    it('VALID: {quest with 0 steps} => renders "No steps defined" message', async () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ steps: [] });

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

      await userEvent.click(screen.getByRole('tab', { name: /Steps/u }));

      expect(screen.getByText('No steps defined')).toBeInTheDocument();
    });

    it('VALID: {quest with 2 contracts} => renders contracts table with rows', async () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({
        contracts: [
          QuestContractEntryStub({
            id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
            name: 'LoginCredentials',
          }),
          QuestContractEntryStub({
            id: 'b47bc10b-58cc-4372-a567-0e02b2c3d479',
            name: 'UserProfile',
          }),
        ],
      });

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

      await userEvent.click(screen.getByRole('tab', { name: /Contracts/u }));

      expect(screen.getByText('LoginCredentials')).toBeInTheDocument();
      expect(screen.getByText('UserProfile')).toBeInTheDocument();
    });

    it('VALID: {quest with 0 contracts} => renders "No contracts defined" message', async () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ contracts: [] });

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

      await userEvent.click(screen.getByRole('tab', { name: /Contracts/u }));

      expect(screen.getByText('No contracts defined')).toBeInTheDocument();
    });

    it('VALID: {quest with 3 contexts} => renders contexts card with list items', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({
        contexts: [
          ContextStub({ id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Login Page' }),
          ContextStub({ id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Dashboard' }),
          ContextStub({ id: 'c47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Settings' }),
        ],
      });

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

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('VALID: {quest with 0 contexts} => does not render contexts card', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ contexts: [] });

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

      const contextsElements = screen.getAllByText('Contexts');

      expect(contextsElements).toStrictEqual([expect.any(HTMLElement) as HTMLElement]);
    });

    it('VALID: {quest with 3 requirements, 2 steps, 1 contract} => renders correct counts in tab labels', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({
        requirements: [
          RequirementStub({ id: 'a12ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Req 1' }),
          RequirementStub({ id: 'b12ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Req 2' }),
          RequirementStub({ id: 'c12ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Req 3' }),
        ],
        steps: [
          DependencyStepStub({ id: 'a5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b', name: 'Step 1' }),
          DependencyStepStub({ id: 'b5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b', name: 'Step 2' }),
        ],
        contracts: [
          QuestContractEntryStub({
            id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Contract 1',
          }),
        ],
      });

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

      expect(screen.getByRole('tab', { name: /^Requirements \(3\)$/u })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /^Steps \(2\)$/u })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /^Contracts \(1\)$/u })).toBeInTheDocument();
    });
  });

  describe('detail rendering', () => {
    it('EDGE: {requirement with no status field} => renders "pending" as default status', async () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({
        requirements: [
          RequirementStub({ id: 'a12ac10b-58cc-4372-a567-0e02b2c3d479', name: 'No Status Req' }),
        ],
      });

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

      await userEvent.click(screen.getByRole('tab', { name: /Requirements/u }));

      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('VALID: {step with 1 dependency} => renders "1 dep"', async () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({
        steps: [
          DependencyStepStub({
            id: 'a5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
            name: 'Step With Dep',
            dependsOn: ['b5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b'],
          }),
        ],
      });

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

      await userEvent.click(screen.getByRole('tab', { name: /Steps/u }));

      expect(screen.getByText('1 dep')).toBeInTheDocument();
    });

    it('VALID: {step with 3 dependencies} => renders "3 deps"', async () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({
        steps: [
          DependencyStepStub({
            id: 'a5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
            name: 'Step With Deps',
            dependsOn: [
              'b5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
              'c5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
              'd5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
            ],
          }),
        ],
      });

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

      await userEvent.click(screen.getByRole('tab', { name: /Steps/u }));

      expect(screen.getByText('3 deps')).toBeInTheDocument();
    });

    it('VALID: {step with 0 dependencies} => renders "None"', async () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({
        steps: [
          DependencyStepStub({
            id: 'a5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
            name: 'Step No Deps',
            dependsOn: [],
          }),
        ],
      });

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

      await userEvent.click(screen.getByRole('tab', { name: /Steps/u }));

      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('EDGE: {quest with unknown status not in color map} => renders badge with gray fallback', () => {
      QuestDetailWidgetProxy();
      const quest: Quest = QuestStub({ status: 'abandoned' });

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

      expect(screen.getByText('abandoned')).toBeInTheDocument();
    });

    it('VALID: {loading: true} => renders loader spinner', () => {
      QuestDetailWidgetProxy();

      const { container } = mantineRenderAdapter({
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

      expect(container.querySelector('.mantine-Loader-root')).toBeInTheDocument();
    });
  });
});
