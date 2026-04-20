import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  ContractNameStub,
  ErrorMessageStub,
  ObservableIdStub,
  WardResultStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantTextChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  TaskToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import { DependencyLabelStub } from '../../contracts/dependency-label/dependency-label.stub';
import { DisplayFilePathStub } from '../../contracts/display-file-path/display-file-path.stub';
import { ExecutionRoleStub } from '../../contracts/execution-role/execution-role.stub';
import { ExecutionStepStatusStub } from '../../contracts/execution-step-status/execution-step-status.stub';
import { StepNameStub } from '../../contracts/step-name/step-name.stub';
import { StepOrderStub } from '../../contracts/step-order/step-order.stub';
import type { ExecutionRowLayerWidgetProps } from './execution-row-layer-widget';
import { ExecutionRowLayerWidget } from './execution-row-layer-widget';
import { ExecutionRowLayerWidgetProxy } from './execution-row-layer-widget.proxy';

type Props = ExecutionRowLayerWidgetProps;

const defaultProps = (): Props => ({
  order: StepOrderStub({ value: 1 }),
  name: StepNameStub({ value: 'Build auth flow' }),
  role: ExecutionRoleStub({ value: 'codeweaver' }),
  status: ExecutionStepStatusStub({ value: 'pending' }),
  files: [],
  dependsOn: [],
  isAdhoc: false,
});

describe('ExecutionRowLayerWidget', () => {
  describe('order display', () => {
    it('VALID: {order: 1} => renders zero-padded order number', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const row = screen.getByTestId('execution-row-layer-widget');

      expect(row.textContent).toBe('\u00B7\u00B7\u00B701[CODEWEAVER]Build auth flowPENDING');
    });
  });

  describe('role badge', () => {
    it('VALID: {role: "codeweaver"} => renders uppercase role badge', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const badge = screen.getByTestId('execution-row-role-badge');

      expect(badge.textContent).toBe('[CODEWEAVER]');
    });

    it('VALID: {role: "ward"} => renders ward role badge', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            role={ExecutionRoleStub({ value: 'ward' })}
          />
        ),
      });

      const badge = screen.getByTestId('execution-row-role-badge');

      expect(badge.textContent).toBe('[WARD]');
    });
  });

  describe('step name', () => {
    it('VALID: {name: "Build auth flow"} => renders step name', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const row = screen.getByTestId('execution-row-layer-widget');

      expect(row.textContent).toBe('\u00B7\u00B7\u00B701[CODEWEAVER]Build auth flowPENDING');
    });
  });

  describe('status badge', () => {
    it('VALID: {status: "pending"} => renders PENDING label', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const badge = screen.getByTestId('execution-row-status-badge');

      expect(badge.textContent).toBe('PENDING');
    });

    it('VALID: {status: "in_progress"} => renders RUNNING label', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
          />
        ),
      });

      const badge = screen.getByTestId('execution-row-status-badge');

      expect(badge.textContent).toBe('RUNNING');
    });

    it('VALID: {status: "complete"} => renders DONE label', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
          />
        ),
      });

      const badge = screen.getByTestId('execution-row-status-badge');

      expect(badge.textContent).toBe('DONE');
    });

    it('VALID: {status: "failed"} => renders FAILED label', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'failed' })}
          />
        ),
      });

      const badge = screen.getByTestId('execution-row-status-badge');

      expect(badge.textContent).toBe('FAILED');
    });
  });

  describe('ad-hoc tag', () => {
    it('VALID: {isAdhoc: true} => renders AD-HOC tag', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <ExecutionRowLayerWidget {...defaultProps()} isAdhoc={true} />,
      });

      const tag = screen.getByTestId('execution-row-adhoc-tag');

      expect(tag.textContent).toBe('AD-HOC');
    });

    it('VALID: {isAdhoc: false} => does not render AD-HOC tag', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      expect(screen.queryByTestId('execution-row-adhoc-tag')).toBe(null);
    });

    it('VALID: {isAdhoc: true} => renders dashed border', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <ExecutionRowLayerWidget {...defaultProps()} isAdhoc={true} />,
      });

      const row = screen.getByTestId('execution-row-layer-widget');

      expect(row.style.borderLeft).toBe('2px dashed rgb(245, 158, 11)');
    });
  });

  describe('subtitle', () => {
    it('VALID: {status: "pending", dependsOn: ["step-1"]} => renders depends on subtitle', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            dependsOn={[DependencyLabelStub({ value: 'step-1' })]}
          />
        ),
      });

      const subtitle = screen.getByTestId('execution-row-subtitle');

      expect(subtitle.textContent).toBe('\u2514\u2500 depends on: step-1');
    });

    it('VALID: {status: "queued", dependsOn: ["step-1"]} => renders waiting for slot subtitle', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'queued' })}
            dependsOn={[DependencyLabelStub({ value: 'step-1' })]}
          />
        ),
      });

      const subtitle = screen.getByTestId('execution-row-subtitle');

      expect(subtitle.textContent).toBe('\u2514\u2500 waiting for slot (depends on: step-1)');
    });

    it('EMPTY: {no deps, no files} => does not render subtitle', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      expect(screen.queryByTestId('execution-row-subtitle')).toBe(null);
    });
  });

  describe('expand/collapse', () => {
    it('VALID: {status: "in_progress"} => clicking header expands content', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            files={[DisplayFilePathStub({ value: 'src/auth.ts' })]}
          />
        ),
      });

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
    });

    it('VALID: {status: "pending"} => clicking header does not expand', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);
    });
  });

  describe('auto-collapse on completion', () => {
    it('VALID: {in_progress → complete} => collapses expanded row', () => {
      ExecutionRowLayerWidgetProxy();

      const entries = [AssistantTextChatEntryStub({ content: 'Working...' })];

      const { rerender } = mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            entries={entries}
          />
        ),
      });

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();

      rerender(
        <ExecutionRowLayerWidget
          {...defaultProps()}
          status={ExecutionStepStatusStub({ value: 'complete' })}
          entries={entries}
        />,
      );

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);
    });

    it('VALID: {in_progress → failed} => collapses expanded row', () => {
      ExecutionRowLayerWidgetProxy();

      const entries = [AssistantTextChatEntryStub({ content: 'Working...' })];

      const { rerender } = mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            entries={entries}
          />
        ),
      });

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();

      rerender(
        <ExecutionRowLayerWidget
          {...defaultProps()}
          status={ExecutionStepStatusStub({ value: 'failed' })}
          entries={entries}
        />,
      );

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);
    });

    it('EDGE: {complete, manually expanded} => stays expanded on re-render', async () => {
      ExecutionRowLayerWidgetProxy();

      const entries = [AssistantTextChatEntryStub({ content: 'Done.' })];

      const { rerender } = mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
            entries={entries}
          />
        ),
      });

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();

      rerender(
        <ExecutionRowLayerWidget
          {...defaultProps()}
          status={ExecutionStepStatusStub({ value: 'complete' })}
          entries={entries}
        />,
      );

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
    });
  });

  describe('expanded content', () => {
    it('VALID: {expanded, files} => shows files in expanded view', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            files={[
              DisplayFilePathStub({ value: 'src/auth.ts' }),
              DisplayFilePathStub({ value: 'src/users.ts' }),
            ]}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const filesEl = screen.getByTestId('execution-row-files');

      expect(filesEl.textContent).toBe('Files: src/auth.ts, src/users.ts');
    });

    it('VALID: {expanded, errorMessage} => shows error message', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'failed' })}
            errorMessage={ErrorMessageStub({ value: 'Type check failed' })}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const errorEl = screen.getByTestId('execution-row-error-message');

      expect(errorEl.textContent).toBe('Error: Type check failed');
    });

    it('VALID: {expanded, summary} => shows summary text', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
            summary={'Implemented auth with tests' as never}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const summaryEl = screen.getByTestId('execution-row-summary');

      expect(summaryEl.textContent).toBe('Summary: Implemented auth with tests');
    });

    it('VALID: {expanded, summary + errorMessage} => shows both summary and error', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'failed' })}
            summary={'BLOCKED: type errors in auth module' as never}
            errorMessage={ErrorMessageStub({ value: 'verification_failed' })}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const summaryEl = screen.getByTestId('execution-row-summary');
      const errorEl = screen.getByTestId('execution-row-error-message');

      expect(summaryEl.textContent).toBe('Summary: BLOCKED: type errors in auth module');
      expect(errorEl.textContent).toBe('Error: verification_failed');
    });

    it('VALID: {expanded, no summary} => does not render summary element', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-summary')).toBe(null);
    });
  });

  describe('entries rendering', () => {
    it('VALID: {in_progress with entries} => auto-expands and renders execution messages', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            entries={[AssistantTextChatEntryStub({ content: 'Building auth module...' })]}
          />
        ),
      });

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
      expect(
        screen.getAllByTestId('CHAT_MESSAGE').map((m) => m.getAttribute('data-testid')),
      ).toStrictEqual(['CHAT_MESSAGE']);
    });

    it('VALID: {isStreaming true} => renders streaming indicator', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            entries={[AssistantTextChatEntryStub({ content: 'Working...' })]}
            isStreaming={true}
          />
        ),
      });

      expect(screen.getByTestId('STREAMING_INDICATOR')).toBeInTheDocument();
    });

    it('VALID: {ad-hoc with spiritmender entries} => renders with dashed border, AD-HOC tag, and messages', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            role={ExecutionRoleStub({ value: 'spiritmender' })}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            isAdhoc={true}
            entries={[
              AssistantTextChatEntryStub({ content: 'The auth-login broker has a type error...' }),
            ]}
          />
        ),
      });

      const row = screen.getByTestId('execution-row-layer-widget');

      expect(row.style.borderLeft).toBe('2px dashed rgb(245, 158, 11)');
      expect(screen.getByTestId('execution-row-adhoc-tag').textContent).toBe('AD-HOC');
      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
      expect(
        screen.getAllByTestId('CHAT_MESSAGE').map((m) => m.getAttribute('data-testid')),
      ).toStrictEqual(['CHAT_MESSAGE']);
    });

    it('VALID: {in_progress with subagent entries} => renders subagent chain header', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            entries={[
              TaskToolUseChatEntryStub({ agentId: 'agent-001' }),
              AssistantTextChatEntryStub({
                content: 'Sub-agent working...',
                source: 'subagent',
                agentId: 'agent-001',
              }),
            ]}
          />
        ),
      });

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
      expect(screen.getByTestId('SUBAGENT_CHAIN_HEADER')).toBeInTheDocument();
    });
  });

  describe('ward results rendering', () => {
    it('VALID: {wardResults with exitCode 0} => renders ward exit code with success', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
            wardResults={[WardResultStub({ exitCode: 0 as never })]}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const wardResultEl = screen.getByTestId('execution-row-ward-result');

      expect(wardResultEl.textContent).toBe('Ward exit code: 0');
    });

    it('VALID: {wardResults with exitCode 1 and wardMode "changed"} => renders exit code and ward mode', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'failed' })}
            wardResults={[WardResultStub({ exitCode: 1 as never, wardMode: 'changed' })]}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const wardResultEl = screen.getByTestId('execution-row-ward-result');

      expect(wardResultEl.textContent).toBe('Ward exit code: 1 (changed)');
    });

    it('VALID: {wardResults with wardMode "full"} => renders ward mode in parentheses', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
            wardResults={[WardResultStub({ exitCode: 0 as never, wardMode: 'full' })]}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const wardResultEl = screen.getByTestId('execution-row-ward-result');

      expect(wardResultEl.textContent).toBe('Ward exit code: 0 (full)');
    });

    it('EMPTY: {no wardResults} => does not render ward result elements', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-ward-result')).toBe(null);
    });
  });

  describe('description rendering', () => {
    it('EMPTY: {expanded view} => does not render description element', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-description')).toBe(null);
    });
  });

  describe('observables rendering', () => {
    it('VALID: {observablesSatisfied with items} => renders observables list', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
            observablesSatisfied={[
              ObservableIdStub({ value: 'login-redirects' }),
              ObservableIdStub({ value: 'session-persists' }),
            ]}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const obsEl = screen.getByTestId('execution-row-observables');

      expect(obsEl.textContent).toBe('Satisfies: login-redirects, session-persists');
    });

    it('EMPTY: {empty observablesSatisfied} => does not render observables element', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
            observablesSatisfied={[]}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-observables')).toBe(null);
    });
  });

  describe('contracts rendering', () => {
    it('VALID: {inputContracts provided} => renders input contracts list', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
            inputContracts={[ContractNameStub({ value: 'LoginCredentials' })]}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const inputEl = screen.getByTestId('execution-row-input-contracts');

      expect(inputEl.textContent).toBe('Inputs: LoginCredentials');
    });

    it('VALID: {outputContracts provided} => renders output contracts list', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
            outputContracts={[
              ContractNameStub({ value: 'AuthToken' }),
              ContractNameStub({ value: 'UserProfile' }),
            ]}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const outputEl = screen.getByTestId('execution-row-output-contracts');

      expect(outputEl.textContent).toBe('Outputs: AuthToken, UserProfile');
    });
  });

  describe('retry badge', () => {
    it('VALID: {attempt: 1, maxAttempts: 3} => renders retry badge', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            attempt={1 as never}
            maxAttempts={3 as never}
          />
        ),
      });

      const retryBadge = screen.getByTestId('execution-row-retry-badge');

      expect(retryBadge.textContent).toBe('retry 1/3');
    });

    it('EMPTY: {attempt: 0, maxAttempts: 3} => does not render retry badge', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            attempt={0 as never}
            maxAttempts={3 as never}
          />
        ),
      });

      expect(screen.queryByTestId('execution-row-retry-badge')).toBe(null);
    });
  });

  describe('duration display', () => {
    it('VALID: {startedAt and completedAt provided} => renders duration', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
            startedAt={'2024-01-15T10:00:00.000Z' as never}
            completedAt={'2024-01-15T10:00:12.000Z' as never}
          />
        ),
      });

      const durationEl = screen.getByTestId('execution-row-duration');

      expect(durationEl.textContent).toBe('12s');
    });

    it('EMPTY: {no startedAt or completedAt} => does not render duration', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'complete' })}
          />
        ),
      });

      expect(screen.queryByTestId('execution-row-duration')).toBe(null);
    });
  });

  describe('token display', () => {
    it('VALID: {entries with usage, expanded} => renders context label in header', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            entries={[
              AssistantTextChatEntryStub({
                content: 'Working on it',
                usage: {
                  inputTokens: 500,
                  outputTokens: 50,
                  cacheCreationInputTokens: 5000,
                  cacheReadInputTokens: 0,
                },
              }),
            ]}
          />
        ),
      });

      const contextEl = screen.getByTestId('execution-row-context');

      expect(contextEl.textContent).toBe('5.5k ctx');
    });

    it('VALID: {entries without usage} => does not render context label in header', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            entries={[AssistantTextChatEntryStub({ content: 'Working on it' })]}
          />
        ),
      });

      expect(screen.queryByTestId('execution-row-context')).toBe(null);
    });

    it('VALID: {expanded, tool-pair with usage} => renders TOKEN_BADGE on tool row', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            entries={[
              AssistantToolUseChatEntryStub({
                toolUseId: 'use_1',
                usage: {
                  inputTokens: 50,
                  outputTokens: 20,
                  cacheCreationInputTokens: 5000,
                  cacheReadInputTokens: 0,
                },
              }),
              AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
            ]}
          />
        ),
      });

      await userEvent.click(screen.getByTestId('TOOL_GROUP_HEADER'));

      const toolRowHeaders = screen.queryAllByTestId('TOOL_ROW_HEADER');
      await Promise.all(toolRowHeaders.map(async (header) => userEvent.click(header)));

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual(['5.0k context']);
    });

    it('VALID: {expanded, tool-pair with result content} => renders RESULT_TOKEN_BADGE', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            entries={[
              AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
              AssistantToolResultChatEntryStub({
                toolName: 'use_1',
                content: 'x'.repeat(740),
              }),
            ]}
          />
        ),
      });

      await userEvent.click(screen.getByTestId('TOOL_GROUP_HEADER'));

      const toolRowHeaders = screen.queryAllByTestId('TOOL_ROW_HEADER');
      await Promise.all(toolRowHeaders.map(async (header) => userEvent.click(header)));

      const badges = screen.queryAllByTestId('RESULT_TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual(['~200 est']);
    });

    it('VALID: {expanded, assistant text with usage} => renders TOKEN_BADGE on message', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status={ExecutionStepStatusStub({ value: 'in_progress' })}
            entries={[
              AssistantTextChatEntryStub({
                content: 'Building auth module...',
                usage: {
                  inputTokens: 500,
                  outputTokens: 50,
                  cacheCreationInputTokens: 5000,
                  cacheReadInputTokens: 0,
                },
              }),
            ]}
          />
        ),
      });

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual(['5.5k context']);
    });
  });
});
