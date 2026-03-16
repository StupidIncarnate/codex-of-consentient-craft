import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { AssistantTextChatEntryStub } from '../../contracts/chat-entry/chat-entry.stub';
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

      expect(row.textContent).toMatch(/01/u);
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

      expect(row.textContent).toMatch(/Build auth flow/u);
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

      expect(screen.queryByTestId('execution-row-adhoc-tag')).toBeNull();
    });

    it('VALID: {isAdhoc: true} => renders dashed border', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <ExecutionRowLayerWidget {...defaultProps()} isAdhoc={true} />,
      });

      const row = screen.getByTestId('execution-row-layer-widget');

      expect(row.style.borderLeft).toMatch(/dashed/u);
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

      expect(subtitle.textContent).toMatch(/depends on: step-1/u);
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

      expect(subtitle.textContent).toMatch(/waiting for slot/u);
    });

    it('EMPTY: {no deps, no files} => does not render subtitle', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      expect(screen.queryByTestId('execution-row-subtitle')).toBeNull();
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

      expect(screen.queryByTestId('execution-row-expanded')).toBeNull();

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.getByTestId('execution-row-expanded')).not.toBeNull();
    });

    it('VALID: {status: "pending"} => clicking header does not expand', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-expanded')).toBeNull();
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

      expect(screen.getByTestId('execution-row-expanded')).not.toBeNull();
      expect(screen.getAllByTestId('CHAT_MESSAGE')).toHaveLength(1);
    });

    it('VALID: {isStreaming true} => renders streaming bar', () => {
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

      expect(screen.getByTestId('streaming-bar-layer-widget')).not.toBeNull();
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

      expect(row.style.borderLeft).toMatch(/dashed/u);
      expect(screen.getByTestId('execution-row-adhoc-tag').textContent).toBe('AD-HOC');
      expect(screen.getByTestId('execution-row-expanded')).not.toBeNull();
      expect(screen.getAllByTestId('CHAT_MESSAGE')).toHaveLength(1);
    });
  });
});
