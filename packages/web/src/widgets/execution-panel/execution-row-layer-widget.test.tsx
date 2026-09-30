import { screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

import { ContractNameStub } from '@dungeonmaster/shared/contracts/contract-name/contract-name.stub';
import { RiftcarverResultStub } from '@dungeonmaster/shared/contracts/riftcarver-result/riftcarver-result.stub';
import { UnitObservationStub } from '@dungeonmaster/shared/contracts/unit-observation/unit-observation.stub';
import { WardResultStub } from '@dungeonmaster/shared/contracts/ward-result/ward-result.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  TaskToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts/chat-entry/chat-entry.stub';
import { DependencyLabelStub } from '../../contracts/dependency-label/dependency-label.stub';
import { DisplayFilePathStub } from '../../contracts/display-file-path/display-file-path.stub';
import { DisplayLabelStub } from '../../contracts/display-label/display-label.stub';
import { ExecutionStepStatusStub } from '../../contracts/execution-step-status/execution-step-status.stub';
import { RowOrderStub } from '../../contracts/row-order/row-order.stub';
import { executionStepStatusConfigStatics } from '../../statics/execution-step-status-config/execution-step-status-config-statics';
import type { ExecutionRowLayerWidgetProps } from './execution-row-layer-widget';
import { ExecutionRowLayerWidget } from './execution-row-layer-widget';
import { ExecutionRowLayerWidgetProxy } from './execution-row-layer-widget.proxy';

type Props = ExecutionRowLayerWidgetProps;

const defaultProps = (): Props => ({
  order: RowOrderStub({ value: 1 }),
  name: DisplayLabelStub({ value: 'Build auth flow' }),
  role: 'codeweaver',
  status: 'pending',
  files: [],
  dependsOn: [],
  isAdhoc: false,
});

describe('ExecutionRowLayerWidget', () => {
  describe('order display', () => {
    it('VALID: {order: 1} => renders zero-padded order number', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const row = screen.getByTestId('execution-row-layer-widget');

      expect(row.textContent).toBe('\u00B7\u00B7\u00B701[CODEWEAVER]Build auth flowPENDING');
    });
  });

  describe('nested step row (decision 2 NESTED ruling)', () => {
    it('EMPTY: {order omitted} => renders no order number', () => {
      ExecutionRowLayerWidgetProxy();
      // Drop `order` from the stubbed props via a rest pattern rather than an inline object
      // literal \u2014 enforce-stub-usage wants every Props-shaped value built through defaultProps().
      const { order: _omittedOrder, ...propsWithoutOrder } = defaultProps();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...propsWithoutOrder} />,
      });

      const row = screen.getByTestId('execution-row-layer-widget');

      expect(row.textContent).toBe('\u00B7\u00B7\u00B7[CODEWEAVER]Build auth flowPENDING');
    });

    it('VALID: {indented: true} => renders no [ROLE] badge, since the header above already names it', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} indented={true} />,
      });

      expect(screen.queryByTestId('execution-row-role-badge')).toBe(null);
    });

    it('VALID: {indented: true} => shifts the row right with a left margin', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} indented={true} />,
      });

      const row = screen.getByTestId('execution-row-layer-widget');

      expect(row.style.marginLeft).toBe('20px');
    });

    it('EMPTY: {indented omitted} => renders the [ROLE] badge and carries no left margin', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const row = screen.getByTestId('execution-row-layer-widget');

      expect(screen.getByTestId('execution-row-role-badge').textContent).toBe('[CODEWEAVER]');
      expect(row.style.marginLeft).toBe('0px');
    });
  });

  describe('role badge', () => {
    it('VALID: {role: "codeweaver"} => renders uppercase role badge', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const badge = screen.getByTestId('execution-row-role-badge');

      expect(badge.textContent).toBe('[CODEWEAVER]');
    });

    it('VALID: {role: "ward"} => renders ward role badge', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} role="ward" />,
      });

      const badge = screen.getByTestId('execution-row-role-badge');

      expect(badge.textContent).toBe('[WARD]');
    });
  });

  describe('step colour (T2-9b)', () => {
    it('VALID: {role: "codeweaver", workItem.step: "ward"} => paints the role badge and chevron in the ward warning colour', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            workItem={WorkItemStub({ step: 'ward' })}
          />
        ),
      });

      const badge = screen.getByTestId('execution-row-role-badge');
      const chevron = screen.getByTestId('execution-row-chevron');

      expect([badge.style.color, chevron.style.color]).toStrictEqual([
        'rgb(245, 158, 11)',
        'rgb(245, 158, 11)',
      ]);
    });
  });

  describe('step name', () => {
    it('VALID: {name: "Build auth flow"} => renders step name', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const row = screen.getByTestId('execution-row-layer-widget');

      expect(row.textContent).toBe('\u00B7\u00B7\u00B701[CODEWEAVER]Build auth flowPENDING');
    });

    it('VALID: {name: "Build auth flow"} => execution-row-name carries exactly the name text, isolated from the order/badge/status around it', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      expect(screen.getByTestId('execution-row-name').textContent).toBe('Build auth flow');
    });
  });

  describe('status badge', () => {
    it('VALID: {status: "pending"} => renders PENDING label', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const badge = screen.getByTestId('execution-row-status-badge');

      expect(badge.textContent).toBe('PENDING');
    });

    it('VALID: {status: "in_progress"} => renders RUNNING label', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="in_progress" />,
      });

      const badge = screen.getByTestId('execution-row-status-badge');

      expect(badge.textContent).toBe('RUNNING');
    });

    it('VALID: {status: "complete"} => renders DONE label', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="complete" />,
      });

      const badge = screen.getByTestId('execution-row-status-badge');

      expect(badge.textContent).toBe('DONE');
    });

    it('VALID: {status: "failed"} => renders FAILED label', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="failed" />,
      });

      const badge = screen.getByTestId('execution-row-status-badge');

      expect(badge.textContent).toBe('FAILED');
    });
  });

  describe('unrecognized status/role fallback (a quest.json a newer family wrote)', () => {
    it('VALID: {status: "reviewing_by_dragon" (unknown to this build)} => renders the raw status as its own label, with the neutral fallback colour, instead of crashing', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status={'reviewing_by_dragon' as never} />,
      });

      const badge = screen.getByTestId('execution-row-status-badge');

      expect([badge.textContent, badge.style.color]).toStrictEqual([
        'reviewing_by_dragon',
        'rgb(138, 114, 96)',
      ]);
    });

    it('VALID: {role: "questgiver" (unknown to this build)} => renders the role badge with the neutral fallback colour, instead of crashing', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} role={'questgiver' as never} />,
      });

      const badge = screen.getByTestId('execution-row-role-badge');

      expect([badge.textContent, badge.style.color]).toStrictEqual([
        '[QUESTGIVER]',
        'rgb(138, 114, 96)',
      ]);
    });

    it('VALID: {status: "partially_complete" (a stale quest.json a family that still minted this status wrote, removed from this build)} => renders the raw status as its own label, with the neutral fallback colour, instead of crashing', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status={'partially_complete' as never} />,
      });

      const badge = screen.getByTestId('execution-row-status-badge');

      expect([badge.textContent, badge.style.color]).toStrictEqual([
        'partially_complete',
        'rgb(138, 114, 96)',
      ]);
    });

    it('VALID: {status: "partially_complete" (removed from EXPANDABLE_STATUSES), no entries} => clicking the header does not expand the row, same as any other unrecognized status', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status={'partially_complete' as never} />,
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);
    });
  });

  describe('ad-hoc tag', () => {
    it('VALID: {isAdhoc: true} => renders AD-HOC tag', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} isAdhoc={true} />,
      });

      const tag = screen.getByTestId('execution-row-adhoc-tag');

      expect(tag.textContent).toBe('AD-HOC');
    });

    it('VALID: {isAdhoc: false} => does not render AD-HOC tag', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      expect(screen.queryByTestId('execution-row-adhoc-tag')).toBe(null);
    });

    it('VALID: {isAdhoc: true} => renders dashed border', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} isAdhoc={true} />,
      });

      const row = screen.getByTestId('execution-row-layer-widget');

      expect(row.style.borderLeft).toBe('2px dashed rgb(245, 158, 11)');
    });
  });

  describe('subtitle', () => {
    it('VALID: {status: "pending", dependsOn: ["step-1"]} => renders depends on subtitle', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
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

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="queued"
            dependsOn={[DependencyLabelStub({ value: 'step-1' })]}
          />
        ),
      });

      const subtitle = screen.getByTestId('execution-row-subtitle');

      expect(subtitle.textContent).toBe('\u2514\u2500 waiting for slot (depends on: step-1)');
    });

    it('EMPTY: {no deps, no files} => does not render subtitle', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      expect(screen.queryByTestId('execution-row-subtitle')).toBe(null);
    });
  });

  describe('expand/collapse', () => {
    it('VALID: {status: "in_progress"} => clicking header expands content', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            files={[DisplayFilePathStub({ value: 'src/auth.ts' })]}
          />
        ),
      });

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
    });

    it('VALID: {status: "pending", no entries} => clicking header does not expand', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);
    });

    it('VALID: {status: "pending", entries: [text]} => clicking header expands content', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="pending"
            entries={[AssistantTextChatEntryStub({ content: 'Prior session output' })]}
          />
        ),
      });

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
    });

    // A transcript with no Task tool-use line at all never reaches collectSubagentChainsTransformer
    // as a chain, so this row's `entries` stays empty even though it is in_progress and live. Rapid
    // collapse/re-expand must never surface a stray subagent-chain-duration element and must keep
    // toggling cleanly (no frozen chevron, no thrown exception) — reproduces a real siege-lane drive
    // against this exact seed shape (in_progress row, agentId-only sub-agent tail, no Task line).
    // Four standalone cases rather than one long sequence or an it.each: the assertion shape flips
    // between getByTestId/queryByTestId with each click, which is exactly the "assertion shape
    // differs beyond a simple mapping" case the testing patterns call out as a DAMP-wins case.
    it('VALID: {status: "in_progress", no entries, before any click} => collapsed, no subagent-chain-duration', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            workItem={WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' })}
            now={'2024-01-15T10:10:00.000Z'}
          />
        ),
      });

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);
      expect(screen.queryByTestId('subagent-chain-duration')).toBe(null);
    });

    it('VALID: {status: "in_progress", no entries, 1 header click} => expands, no subagent-chain-duration', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            workItem={WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' })}
            now={'2024-01-15T10:10:00.000Z'}
          />
        ),
      });

      await userEvent.click(screen.getByTestId('execution-row-header'));

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
      expect(screen.queryByTestId('subagent-chain-duration')).toBe(null);
    });

    it('VALID: {status: "in_progress", no entries, 2 header clicks} => collapses again, no subagent-chain-duration', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            workItem={WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' })}
            now={'2024-01-15T10:10:00.000Z'}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);
      expect(screen.queryByTestId('subagent-chain-duration')).toBe(null);
    });

    it('VALID: {status: "in_progress", no entries, 3 header clicks} => re-expands, no subagent-chain-duration', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            workItem={WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' })}
            now={'2024-01-15T10:10:00.000Z'}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);
      await userEvent.click(header);
      await userEvent.click(header);

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
      expect(screen.queryByTestId('subagent-chain-duration')).toBe(null);
    });

    it('VALID: {status: "in_progress", no entries, 4 header clicks} => collapses again, no subagent-chain-duration', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            workItem={WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' })}
            now={'2024-01-15T10:10:00.000Z'}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);
      await userEvent.click(header);
      await userEvent.click(header);
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);
      expect(screen.queryByTestId('subagent-chain-duration')).toBe(null);
    });
  });

  describe('running focus (T2-9a)', () => {
    it('VALID: {status: "in_progress", entries, isRunningFocus: false} => starts collapsed, and a header click still expands it', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            entries={[AssistantTextChatEntryStub({ content: 'Working...' })]}
            isRunningFocus={false}
          />
        ),
      });

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);

      await userEvent.click(screen.getByTestId('execution-row-header'));

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
    });

    it('VALID: {status: "in_progress", entries, isRunningFocus omitted} => auto-expands, as today', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            entries={[AssistantTextChatEntryStub({ content: 'Working...' })]}
          />
        ),
      });

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
    });
  });

  describe('auto-collapse on completion', () => {
    it('VALID: {in_progress → complete} => collapses expanded row', () => {
      ExecutionRowLayerWidgetProxy();

      const entries = [AssistantTextChatEntryStub({ content: 'Working...' })];

      const { rerender } = mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="in_progress" entries={entries} />,
      });

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();

      rerender(<ExecutionRowLayerWidget {...defaultProps()} status="complete" entries={entries} />);

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);
    });

    it('VALID: {in_progress → pending with entries} => stays expanded (paused work item keeps its messages)', () => {
      ExecutionRowLayerWidgetProxy();

      const entries = [AssistantTextChatEntryStub({ content: 'Prior session output' })];

      const { rerender } = mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="in_progress" entries={entries} />,
      });

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();

      rerender(<ExecutionRowLayerWidget {...defaultProps()} status="pending" entries={entries} />);

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
    });

    it('VALID: {in_progress → failed} => collapses expanded row', () => {
      ExecutionRowLayerWidgetProxy();

      const entries = [AssistantTextChatEntryStub({ content: 'Working...' })];

      const { rerender } = mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="in_progress" entries={entries} />,
      });

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();

      rerender(<ExecutionRowLayerWidget {...defaultProps()} status="failed" entries={entries} />);

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);
    });

    it('VALID: {in_progress, hasEntries, user clicks header to collapse} => stays collapsed even when new entries arrive (auto-expand effect must not race the user click)', async () => {
      ExecutionRowLayerWidgetProxy();

      const entries = [AssistantTextChatEntryStub({ content: 'Working on it' })];

      const { rerender } = mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="in_progress" entries={entries} />,
      });

      // Initial render auto-expands because status === 'in_progress' && hasEntries.
      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();

      // User collapses the row.
      await userEvent.click(screen.getByTestId('execution-row-header'));

      // Bug: the in-progress auto-expand effect re-fires when `expanded` flips false
      // (because `expanded` is in its dependency array) and immediately re-expands.
      // Fix: `!userClickedRef.current` guard suppresses the re-expand. Row stays collapsed.
      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);

      // Re-render with a new entry (simulates streaming) — row must remain collapsed.
      const moreEntries = [
        AssistantTextChatEntryStub({ content: 'Working on it' }),
        AssistantTextChatEntryStub({ content: 'Still working...' }),
      ];
      rerender(
        <ExecutionRowLayerWidget {...defaultProps()} status="in_progress" entries={moreEntries} />,
      );

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);
    });

    it('EDGE: {complete, manually expanded} => stays expanded on re-render', async () => {
      ExecutionRowLayerWidgetProxy();

      const entries = [AssistantTextChatEntryStub({ content: 'Done.' })];

      const { rerender } = mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="complete" entries={entries} />,
      });

      expect(screen.queryByTestId('execution-row-expanded')).toBe(null);

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();

      rerender(<ExecutionRowLayerWidget {...defaultProps()} status="complete" entries={entries} />);

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
    });
  });

  describe('expanded content', () => {
    it('VALID: {expanded, files} => shows files in expanded view', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
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

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="failed"
            errorMessage={'Type check failed'}
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

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            workItem={WorkItemStub({ summary: 'Implemented auth with tests' })}
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

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="failed"
            workItem={WorkItemStub({ summary: 'BLOCKED: type errors in auth module' })}
            errorMessage={'verification_failed'}
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

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="complete" />,
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-summary')).toBe(null);
    });
  });

  describe('entries rendering', () => {
    it('VALID: {in_progress with entries} => auto-expands and renders execution messages', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            entries={[AssistantTextChatEntryStub({ content: 'Building auth module...' })]}
          />
        ),
      });

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
      expect(
        screen.getAllByTestId('CHAT_MESSAGE').map((m) => m.getAttribute('data-testid')),
      ).toStrictEqual(['CHAT_MESSAGE']);
    });

    it('VALID: {isStreaming true} => renders streaming bar', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            entries={[AssistantTextChatEntryStub({ content: 'Working...' })]}
            isStreaming={true}
          />
        ),
      });

      expect(screen.getByTestId('streaming-bar-layer-widget')).toBeInTheDocument();
    });

    it('VALID: {ad-hoc with spiritmender entries} => renders with dashed border, AD-HOC tag, and messages', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            role="spiritmender"
            status="in_progress"
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

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
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

    it('VALID: {multiple thinking entries, show all earlier} => all thinking rows render in order', async () => {
      const proxy = ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            entries={[
              AssistantThinkingChatEntryStub({ content: 'first' }),
              AssistantThinkingChatEntryStub({ content: 'final' }),
            ]}
          />
        ),
      });

      // Tail-window default would hide the earlier thinking entry; expand to assert ordering across all entries.
      await proxy.clickShowEarlier();

      const contents = screen.queryAllByTestId('THINKING_ROW_CONTENT').map((c) => c.textContent);

      expect(contents).toStrictEqual(['first', 'final']);
    });

    it('VALID: {multiple thinking entries, default tail-window} => only the last thinking entry is rendered', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            entries={[
              AssistantThinkingChatEntryStub({ content: 'first' }),
              AssistantThinkingChatEntryStub({ content: 'final' }),
            ]}
          />
        ),
      });

      const contents = screen.queryAllByTestId('THINKING_ROW_CONTENT').map((c) => c.textContent);

      expect(contents).toStrictEqual(['final']);
    });

    it('VALID: {multiple tool pairs separated by text, show all earlier} => all tool rows render', async () => {
      const proxy = ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            entries={[
              AssistantToolUseChatEntryStub({ toolUseId: 'use_1', toolName: 'Read' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
              AssistantTextChatEntryStub({ content: 'thinking about next step' }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_2', toolName: 'Grep' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_2' }),
              AssistantTextChatEntryStub({ content: 'one more' }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_3', toolName: 'Bash' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_3' }),
            ]}
          />
        ),
      });

      await proxy.clickShowEarlier();

      const toolRowNames = screen.queryAllByTestId('TOOL_ROW_NAME').map((n) => n.textContent);

      expect(toolRowNames).toStrictEqual(['Read', 'Grep', 'Bash']);
    });

    it('VALID: {multiple tool pairs separated by text, default tail-window} => only last text + subsequent tool render', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            entries={[
              AssistantToolUseChatEntryStub({ toolUseId: 'use_1', toolName: 'Read' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
              AssistantTextChatEntryStub({ content: 'thinking about next step' }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_2', toolName: 'Grep' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_2' }),
              AssistantTextChatEntryStub({ content: 'one more' }),
              AssistantToolUseChatEntryStub({ toolUseId: 'use_3', toolName: 'Bash' }),
              AssistantToolResultChatEntryStub({ toolName: 'use_3' }),
            ]}
          />
        ),
      });

      const toolRowNames = screen.queryAllByTestId('TOOL_ROW_NAME').map((n) => n.textContent);

      expect(toolRowNames).toStrictEqual(['Bash']);
    });
  });

  describe('finished rows open on the whole transcript', () => {
    const transcript = (): ReturnType<typeof AssistantTextChatEntryStub>[] => [
      AssistantTextChatEntryStub({ content: 'ROW_FIRST_marker' }),
      AssistantToolUseChatEntryStub({ toolUseId: 'use_a', toolName: 'Read' }),
      AssistantToolResultChatEntryStub({ toolName: 'use_a' }),
      AssistantTextChatEntryStub({ content: 'ROW_MIDDLE_marker' }),
      AssistantToolUseChatEntryStub({ toolUseId: 'use_b', toolName: 'Bash' }),
      AssistantToolResultChatEntryStub({ toolName: 'use_b' }),
      AssistantTextChatEntryStub({ content: 'ROW_LAST_marker' }),
    ];

    it('VALID: {status: in_progress, expanded, 3 texts + 2 tool-pairs} => only the last text renders, earlier text is absent', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            entries={transcript()}
          />
        ),
      });

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
      expect(screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent)).toStrictEqual([
        'CODEWEAVERROW_LAST_marker',
      ]);
      expect(screen.queryAllByTestId('TOOL_ROW_NAME').map((n) => n.textContent)).toStrictEqual([]);
    });

    it('VALID: {status: complete, reader opens the row, SAME transcript} => every text and both tool rows render', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget {...defaultProps()} status="complete" entries={transcript()} />
        ),
      });

      await userEvent.click(screen.getByTestId('execution-row-header'));

      expect(screen.getByTestId('execution-row-expanded')).toBeInTheDocument();
      expect(screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent)).toStrictEqual([
        'CODEWEAVERROW_FIRST_marker',
        'CODEWEAVERROW_MIDDLE_marker',
        'CODEWEAVERROW_LAST_marker',
      ]);
      expect(screen.queryAllByTestId('TOOL_ROW_NAME').map((n) => n.textContent)).toStrictEqual([
        'Read',
        'Bash',
      ]);
    });

    it('VALID: {status: failed, reader opens the row, SAME transcript} => every text renders', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="failed" entries={transcript()} />,
      });

      await userEvent.click(screen.getByTestId('execution-row-header'));

      expect(screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent)).toStrictEqual([
        'CODEWEAVERROW_FIRST_marker',
        'CODEWEAVERROW_MIDDLE_marker',
        'CODEWEAVERROW_LAST_marker',
      ]);
    });

    it('VALID: {status: complete, reader opens the row then clicks the toggle} => the transcript folds back to its tail', async () => {
      const proxy = ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget {...defaultProps()} status="complete" entries={transcript()} />
        ),
      });

      await userEvent.click(screen.getByTestId('execution-row-header'));
      await proxy.clickShowEarlier();

      expect(screen.queryAllByTestId('CHAT_MESSAGE').map((m) => m.textContent)).toStrictEqual([
        'CODEWEAVERROW_LAST_marker',
      ]);
      expect(screen.queryAllByTestId('TOOL_ROW_NAME').map((n) => n.textContent)).toStrictEqual([]);
    });
  });

  describe('ward results rendering', () => {
    it('VALID: {wardResults with exitCode 0} => renders ward exit code with success', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            wardResults={[WardResultStub({ exitCode: 0 })]}
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

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="failed"
            wardResults={[WardResultStub({ exitCode: 1, wardMode: 'committed' })]}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const wardResultEl = screen.getByTestId('execution-row-ward-result');

      expect(wardResultEl.textContent).toBe('Ward exit code: 1 (committed)');
    });

    it('VALID: {wardResults with wardMode "full"} => renders ward mode in parentheses', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            wardResults={[WardResultStub({ exitCode: 0, wardMode: 'full' })]}
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

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="complete" />,
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-ward-result')).toBe(null);
    });
  });

  describe('riftcarver results rendering', () => {
    it('VALID: {riftcarverResults with exitCode 0} => renders riftcarver exit code with outcome', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            riftcarverResults={[RiftcarverResultStub({ exitCode: 0, outcome: 'green' })]}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const riftcarverResultEl = screen.getByTestId('execution-row-riftcarver-result');

      expect(riftcarverResultEl.textContent).toBe('Riftcarver exit code: 0 (green)');
    });

    it('VALID: {riftcarverResults with exitCode 1 and outcome "repairable"} => renders exit code and outcome', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="failed"
            riftcarverResults={[RiftcarverResultStub({ exitCode: 1, outcome: 'repairable' })]}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const riftcarverResultEl = screen.getByTestId('execution-row-riftcarver-result');

      expect(riftcarverResultEl.textContent).toBe('Riftcarver exit code: 1 (repairable)');
    });

    it('EMPTY: {no riftcarverResults} => does not render riftcarver result elements', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="complete" />,
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-riftcarver-result')).toBe(null);
    });
  });

  describe('description rendering', () => {
    it('EMPTY: {expanded view} => does not render description element', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="complete" />,
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-description')).toBe(null);
    });
  });

  describe('unit marks readout wiring', () => {
    it('VALID: {workItem with assigned units} => renders the units-marks readout via the work item, not a separate prop', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            workItem={WorkItemStub({
              assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
              observations: [UnitObservationStub({ mark: 'met' })],
            })}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.getByTestId('execution-row-unit-marks-summary').textContent).toBe(
        'Units: 1/1 marked',
      );
    });

    it('EMPTY: {workItem: undefined} => does not render the units-marks readout', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="complete" />,
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-unit-marks')).toBe(null);
    });
  });

  describe('scope churn wiring', () => {
    it('VALID: {scopeWorkItems where a unit was marked twice} => renders the churn sequence', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            scopeWorkItems={[
              WorkItemStub({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d475',
                step: 'work',
                observations: [UnitObservationStub({ mark: 'unmet' })],
              }),
              WorkItemStub({
                id: 'f47ac10b-58cc-4372-a567-0e02b2c3d476',
                step: 'review',
                observations: [UnitObservationStub({ mark: 'met' })],
              }),
            ]}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.getByTestId('execution-row-scope-churn-entry').textContent).toBe(
        'send-flow:observable:check-badge-count-text: unmet (work) → met (review)',
      );
    });

    it('EMPTY: {scopeWorkItems: undefined} => does not render the churn view', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="complete" />,
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-scope-churn')).toBe(null);
    });
  });

  describe('unmet observations list', () => {
    it('VALID: {expanded, workItem with an unmet observation} => renders the unit id and evidence', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            workItem={WorkItemStub({
              observations: [
                UnitObservationStub({
                  mark: 'unmet',
                  evidence: 'still nothing renders the count',
                }),
              ],
            })}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const unmetEl = screen.getByTestId('execution-row-unmet-observation');

      expect(unmetEl.textContent).toBe(
        '[unmet] send-flow:observable:check-badge-count-text: still nothing renders the count',
      );
    });

    it('VALID: {expanded, workItem with both a met and an unmet observation} => renders only the unmet one', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            workItem={WorkItemStub({
              observations: [
                UnitObservationStub({
                  unitId: 'send-flow:terminal:review-passes',
                  mark: 'met',
                  evidence: 'review-passes-test.ts:12 — flips red on a bad review',
                }),
                UnitObservationStub({
                  mark: 'unmet',
                  evidence: 'still nothing renders the count',
                }),
              ],
            })}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const unmetEls = screen.queryAllByTestId('execution-row-unmet-observation');

      expect(unmetEls.map((el) => el.textContent)).toStrictEqual([
        '[unmet] send-flow:observable:check-badge-count-text: still nothing renders the count',
      ]);
    });

    it('EMPTY: {expanded, workItem with only a met observation} => does not render the unmet list', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            workItem={WorkItemStub({ observations: [UnitObservationStub({ mark: 'met' })] })}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-unmet-list')).toBe(null);
    });

    it('EMPTY: {expanded, no workItem} => does not render the unmet list', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="complete" />,
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-unmet-list')).toBe(null);
    });
  });

  describe('contracts rendering', () => {
    it('VALID: {inputContracts provided} => renders input contracts list', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
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

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
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

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            workItem={WorkItemStub({ attempt: 1, maxAttempts: 3 })}
          />
        ),
      });

      const retryBadge = screen.getByTestId('execution-row-retry-badge');

      expect(retryBadge.textContent).toBe('retry 1/3');
    });

    it('EMPTY: {attempt: 0, maxAttempts: 3} => does not render retry badge', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            workItem={WorkItemStub({ attempt: 0, maxAttempts: 3 })}
          />
        ),
      });

      expect(screen.queryByTestId('execution-row-retry-badge')).toBe(null);
    });
  });

  describe('back-edge badge (mintedBy)', () => {
    it('VALID: {mintedByLabel: "walk pt: 1"} => renders a badge naming the row it returns to', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            mintedByLabel={DisplayLabelStub({ value: 'walk pt: 1' })}
          />
        ),
      });

      const badge = screen.getByTestId('execution-row-minted-by-badge');

      expect(badge.textContent).toBe('↩ walk pt: 1');
    });

    it('EMPTY: {mintedByLabel omitted} => does not render the back-edge badge', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      expect(screen.queryByTestId('execution-row-minted-by-badge')).toBe(null);
    });
  });

  describe('duration display', () => {
    const NOW = '2024-01-15T10:04:00.000Z';

    describe('no figure', () => {
      it('EMPTY: {status: in_progress, now, no startedAt} => renders no duration element', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: <ExecutionRowLayerWidget {...defaultProps()} status="in_progress" now={NOW} />,
        });

        expect(screen.queryByTestId('execution-row-duration')).toBe(null);
      });

      type Status = ReturnType<typeof ExecutionStepStatusStub>;

      const ALL_STATUSES = Object.keys(
        executionStepStatusConfigStatics.statusConfig,
      ) as readonly Status[];
      const NO_END_POINT_STATUSES = ALL_STATUSES.filter((status) => status !== 'in_progress');

      it.each(NO_END_POINT_STATUSES)(
        'EMPTY: {status: %s, startedAt, now, no completedAt} => renders no duration element',
        (status) => {
          ExecutionRowLayerWidgetProxy();

          mantineRenderMiddleware({
            ui: (
              <ExecutionRowLayerWidget
                {...defaultProps()}
                status={ExecutionStepStatusStub({ value: status })}
                workItem={WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' })}
                now={NOW}
              />
            ),
          });

          expect(screen.queryByTestId('execution-row-duration')).toBe(null);
        },
      );
    });

    describe('running', () => {
      it('VALID: {in_progress, startedAt 4m before now} => renders "4m" on first render, no tick', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('4m');
      });

      it('VALID: {in_progress, startedAt 30s before now} => renders "<1m"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T10:03:30.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('<1m');
      });

      it('VALID: {in_progress, startedAt 59s before now} => renders "<1m"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T10:03:01.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('<1m');
      });

      it('EDGE: {in_progress, startedAt exactly 60s before now} => renders "1m"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T10:03:00.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('1m');
      });

      it('VALID: {in_progress, startedAt 4m30s before now} => renders "4m"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T09:59:30.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('4m');
      });

      it('VALID: {in_progress, startedAt 59m59s before now} => renders "59m"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T09:04:01.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('59m');
      });

      it('EDGE: {in_progress, startedAt exactly 60m before now} => renders "1h"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T09:04:00.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('1h');
      });

      it('VALID: {in_progress, startedAt 1h13m before now} => renders "1h13m"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T08:51:00.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('1h13m');
      });

      it('EDGE: {in_progress, startedAt exactly 2h before now} => renders "2h"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T08:04:00.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('2h');
      });

      // Models a full page reload landing seconds before a minute boundary: `now` here is not a
      // value this row ticked its way to — it is the ONLY render this instance ever produces,
      // exactly as a fresh mount after a reload would be. If the figure were ever derived from
      // something other than the live startedAt/now pair passed to THIS render (a module-level
      // cache, a value baked in before the reload), this is where it would show.
      it('VALID: {in_progress, freshly mounted with startedAt 4m58s before now} => the one and only render shows "4m", not a value carried over from before the mount', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T09:59:02.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('4m');
      });
    });

    describe('finished', () => {
      it('VALID: {complete, 12s span} => renders "<1m"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="complete"
              workItem={WorkItemStub({
                startedAt: '2024-01-15T10:00:00.000Z',
                completedAt: '2024-01-15T10:00:12.000Z',
              })}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('<1m');
      });

      it('VALID: {complete, 4m12s span} => renders "4m"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="complete"
              workItem={WorkItemStub({
                startedAt: '2024-01-15T10:00:00.000Z',
                completedAt: '2024-01-15T10:04:12.000Z',
              })}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('4m');
      });

      it('VALID: {complete, 1h13m span} => renders "1h13m"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="complete"
              workItem={WorkItemStub({
                startedAt: '2024-01-15T09:00:00.000Z',
                completedAt: '2024-01-15T10:13:00.000Z',
              })}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('1h13m');
      });

      it('EDGE: {complete, exactly 2h span} => renders "2h"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="complete"
              workItem={WorkItemStub({
                startedAt: '2024-01-15T08:00:00.000Z',
                completedAt: '2024-01-15T10:00:00.000Z',
              })}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('2h');
      });

      it('EDGE: {complete, now advances 60s on rerender} => figure stays frozen at completedAt', () => {
        ExecutionRowLayerWidgetProxy();

        const { rerender } = mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="complete"
              workItem={WorkItemStub({
                startedAt: '2024-01-15T10:00:00.000Z',
                completedAt: '2024-01-15T10:04:12.000Z',
              })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('4m');

        rerender(
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            workItem={WorkItemStub({
              startedAt: '2024-01-15T10:00:00.000Z',
              completedAt: '2024-01-15T10:04:12.000Z',
            })}
            now={'2024-01-15T10:05:00.000Z'}
          />,
        );

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('4m');
      });

      it('VALID: {in_progress => complete, same now} => "4m" is replaced by "1h13m" on that render', () => {
        ExecutionRowLayerWidgetProxy();

        const { rerender } = mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('4m');

        rerender(
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            workItem={WorkItemStub({
              startedAt: '2024-01-15T10:00:00.000Z',
              completedAt: '2024-01-15T11:13:00.000Z',
            })}
            now={NOW}
          />,
        );

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('1h13m');
      });

      it('VALID: {in_progress <1m => complete 1h13m span, same now} => "<1m" is replaced by "1h13m" on that render', () => {
        ExecutionRowLayerWidgetProxy();

        const { rerender } = mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T10:03:30.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('<1m');

        rerender(
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            workItem={WorkItemStub({
              startedAt: '2024-01-15T10:03:30.000Z',
              completedAt: '2024-01-15T11:16:30.000Z',
            })}
            now={NOW}
          />,
        );

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('1h13m');
      });

      it('VALID: {in_progress 1h13m => complete 2h span, same now} => "1h13m" is replaced by "2h" on that render', () => {
        ExecutionRowLayerWidgetProxy();

        const { rerender } = mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T08:51:00.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('1h13m');

        rerender(
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            workItem={WorkItemStub({
              startedAt: '2024-01-15T08:51:00.000Z',
              completedAt: '2024-01-15T10:51:00.000Z',
            })}
            now={NOW}
          />,
        );

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('2h');
      });
    });

    describe('paused and resumed', () => {
      it('VALID: {pending, startedAt, now} => status badge renders "PENDING"', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="pending"
              workItem={WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-status-badge').textContent).toBe('PENDING');
      });

      it('VALID: {pending, startedAt, now} => renders no duration element', () => {
        ExecutionRowLayerWidgetProxy();

        mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="pending"
              workItem={WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.queryByTestId('execution-row-duration')).toBe(null);
      });

      it('VALID: {in_progress => pending => in_progress with fresh startedAt} => figure restarts at "<1m", not "4m"', () => {
        ExecutionRowLayerWidgetProxy();

        const { rerender } = mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('4m');

        rerender(
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="pending"
            workItem={WorkItemStub({ startedAt: '2024-01-15T10:00:00.000Z' })}
            now={NOW}
          />,
        );

        expect(screen.queryByTestId('execution-row-duration')).toBe(null);

        rerender(
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            workItem={WorkItemStub({ startedAt: NOW })}
            now={NOW}
          />,
        );

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('<1m');
      });

      it('VALID: {in_progress <1m => pending, same now} => "<1m" figure disappears', () => {
        ExecutionRowLayerWidgetProxy();

        const { rerender } = mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T10:03:30.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('<1m');

        rerender(
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="pending"
            workItem={WorkItemStub({ startedAt: '2024-01-15T10:03:30.000Z' })}
            now={NOW}
          />,
        );

        expect(screen.queryByTestId('execution-row-duration')).toBe(null);
      });

      it('VALID: {in_progress 1h13m => pending, same now} => "1h13m" figure disappears', () => {
        ExecutionRowLayerWidgetProxy();

        const { rerender } = mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T08:51:00.000Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('1h13m');

        rerender(
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="pending"
            workItem={WorkItemStub({ startedAt: '2024-01-15T08:51:00.000Z' })}
            now={NOW}
          />,
        );

        expect(screen.queryByTestId('execution-row-duration')).toBe(null);
      });

      it('EDGE: {in_progress startedAt 59.5s before now (still "<1m") => pending, same now} => duration stays absent on the pause commit AND the commit after it (no stale node survives a second render)', () => {
        ExecutionRowLayerWidgetProxy();

        const { rerender } = mantineRenderMiddleware({
          ui: (
            <ExecutionRowLayerWidget
              {...defaultProps()}
              status="in_progress"
              workItem={WorkItemStub({ startedAt: '2024-01-15T10:03:00.500Z' })}
              now={NOW}
            />
          ),
        });

        expect(screen.getByTestId('execution-row-duration').textContent).toBe('<1m');

        rerender(
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="pending"
            workItem={WorkItemStub({ startedAt: '2024-01-15T10:03:00.500Z' })}
            now={NOW}
          />,
        );

        expect(screen.queryAllByTestId('execution-row-duration')).toStrictEqual([]);

        // A further commit, with `now` pushed past the minute this row would have crossed into
        // had it kept running — the panel's own 60s tick still fires for every OTHER running row
        // and passes a fresh `now` down to this one too, even though this row is no longer running.
        rerender(
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="pending"
            workItem={WorkItemStub({ startedAt: '2024-01-15T10:03:00.500Z' })}
            now={'2024-01-15T10:05:00.000Z'}
          />,
        );

        expect(screen.queryAllByTestId('execution-row-duration')).toStrictEqual([]);
      });
    });
  });

  describe('token display', () => {
    it('VALID: {entries with usage, expanded} => renders context label in header', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
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

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            entries={[AssistantTextChatEntryStub({ content: 'Working on it' })]}
          />
        ),
      });

      expect(screen.queryByTestId('execution-row-context')).toBe(null);
    });

    it('VALID: {expanded, tool-pair with usage} => no TOKEN_BADGE on tool row (per-tool delta is misattribution when multiple tools fire per turn)', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
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

      const badges = screen.queryAllByTestId('TOKEN_BADGE');

      expect(badges).toStrictEqual([]);
    });

    it('VALID: {expanded, tool-pair with result content} => renders RESULT_TOKEN_BADGE', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
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

      const badges = screen.queryAllByTestId('RESULT_TOKEN_BADGE');

      expect(badges.map((b) => b.textContent)).toStrictEqual(['~200 est']);
    });

    it('VALID: {expanded, single assistant text with usage} => no TOKEN_BADGE (no prev to diff against; baseline is not a delta)', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
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

      expect(badges).toStrictEqual([]);
    });
  });

  describe('signal rendering', () => {
    it('VALID: {actualSignal=complete} => renders actual signal line', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            workItem={WorkItemStub({ actualSignal: 'complete' })}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const actualEl = screen.getByTestId('execution-row-actual-signal');

      expect(actualEl.textContent).toBe('Actual signal: complete');
    });

    it('VALID: {failed status, actualSignal} => signal text is rendered in danger color', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="failed"
            workItem={WorkItemStub({ actualSignal: 'complete' })}
          />
        ),
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      const actualEl = screen.getByTestId('execution-row-actual-signal');

      expect(actualEl.style.color).toBe('rgb(239, 68, 68)');
    });

    it('EMPTY: {no actualSignal} => does not render signal block', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="failed" />,
      });

      const header = screen.getByTestId('execution-row-header');
      await userEvent.click(header);

      expect(screen.queryByTestId('execution-row-signals')).toBe(null);
    });
  });

  describe('sticky header', () => {
    // A closed row is one line plus its subtitle, and its header is transparent when closed —
    // pinning it would let the subtitle and the rows below read straight through the bar.
    it('VALID: {collapsed} => header does not pin', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} />,
      });

      const header = screen.getByTestId('execution-row-header');

      expect([header.style.position, header.style.top]).toStrictEqual(['', '']);
    });

    it('VALID: {expanded} => header pins flush to the execution panel with the top band', async () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: <ExecutionRowLayerWidget {...defaultProps()} status="complete" />,
      });

      await userEvent.click(screen.getByTestId('execution-row-header'));

      const header = screen.getByTestId('execution-row-header');

      expect([
        header.style.position,
        header.style.top,
        header.style.zIndex,
        header.style.height,
        header.style.boxSizing,
      ]).toStrictEqual(['sticky', '0px', '100', '23px', 'border-box']);
    });

    // The row is the outermost expandable in the panel, so everything it opens onto has to clear
    // the row header before it pins — otherwise a chain header slides over the row's own.
    it('VALID: {expanded with subagent entries} => chain inside the row pins below the row header', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
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

      const chainHeader = screen.getByTestId('SUBAGENT_CHAIN_HEADER');

      expect([
        chainHeader.style.position,
        chainHeader.style.top,
        chainHeader.style.zIndex,
      ]).toStrictEqual(['sticky', '23px', '77']);
    });
  });

  // The row's own `execution-row-duration` figure (see the `duration display` block above) has its
  // own start/end rules and its own element. This block covers a DIFFERENT element — the sub-agent
  // chain's `subagent-chain-duration` — and the ONE thing this row decides for it: whether the
  // panel's shared clock ever reaches the transcript at all.
  describe('subagent chain clock forwarding', () => {
    // A non-null Task tool-use entry with no completion notification: the chain has a usable start
    // and no frozen end, so a live figure is possible and the row's own status is what decides
    // whether one actually renders.
    const runningSubagentEntries = (): ReturnType<typeof AssistantTextChatEntryStub>[] => [
      TaskToolUseChatEntryStub({ agentId: 'agent-001', timestamp: '2026-09-10T10:00:00.000Z' }),
      AssistantTextChatEntryStub({
        content: 'Sub-agent working...',
        source: 'subagent',
        agentId: 'agent-001',
      }),
    ];
    const NOW = '2026-09-10T10:04:00.000Z';

    it("VALID: {status: in_progress, entries: Task tool use + subagent text} => the SUBAGENT_CHAIN element renders inside the row's own element", () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            entries={runningSubagentEntries()}
          />
        ),
      });

      const row = screen.getByTestId('execution-row-layer-widget');
      const chain = screen.getByTestId('SUBAGENT_CHAIN');

      expect(row.contains(chain)).toBe(true);
    });

    it('VALID: {status: in_progress, now supplied} => renders one subagent-chain-duration element carrying the elapsed band', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="in_progress"
            entries={runningSubagentEntries()}
            now={NOW}
          />
        ),
      });

      const texts = screen.queryAllByTestId('subagent-chain-duration').map((el) => el.textContent);

      expect(texts).toStrictEqual(['4m']);
    });

    it('VALID: {status: complete, autoExpand, SAME entries and now as the in_progress case} => renders no subagent-chain-duration element', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="complete"
            autoExpand={true}
            entries={runningSubagentEntries()}
            now={NOW}
          />
        ),
      });

      const texts = screen.queryAllByTestId('subagent-chain-duration').map((el) => el.textContent);

      expect(texts).toStrictEqual([]);
    });

    it('VALID: {status: failed, autoExpand, SAME entries and now as the in_progress case} => renders no subagent-chain-duration element', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            status="failed"
            autoExpand={true}
            entries={runningSubagentEntries()}
            now={NOW}
          />
        ),
      });

      const texts = screen.queryAllByTestId('subagent-chain-duration').map((el) => el.textContent);

      expect(texts).toStrictEqual([]);
    });
  });

  // A command work item streams one entry per LINE, and the renderer draws one labelled, bordered
  // block per entry — so a build printed a role header above every single line, blank lines
  // included. These assert the BLOCK COUNT, not just the text: a check that the lines are present
  // passes on the arrangement that puts each one in its own header.
  describe('command output rendering', () => {
    it('VALID: {riftcarver row, three output lines} => renders ONE message block carrying all three lines, not three', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            role="riftcarver"
            autoExpand={true}
            entries={[
              AssistantTextChatEntryStub({ content: '— build pass 1/3 —' }),
              AssistantTextChatEntryStub({ content: '' }),
              AssistantTextChatEntryStub({ content: '— build green on pass 1/3 —' }),
            ]}
          />
        ),
      });

      const blocks = screen.getAllByTestId('CHAT_MESSAGE');

      expect(blocks.map((block) => block.textContent)).toStrictEqual([
        'RIFTCARVER— build pass 1/3 —\n\n— build green on pass 1/3 —',
      ]);
    });

    it('VALID: {riftcarver row, npm script echo line} => renders it verbatim rather than as a markdown blockquote', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            role="riftcarver"
            autoExpand={true}
            entries={[
              AssistantTextChatEntryStub({ content: '> @dungeonmaster/testing@0.1.0 build' }),
            ]}
          />
        ),
      });

      const block = screen.getByTestId('CHAT_MESSAGE');

      expect(block.textContent).toBe('RIFTCARVER> @dungeonmaster/testing@0.1.0 build');
    });

    // The counterpart to the case above, and the reason merging is gated on the ROLE: an agent's
    // consecutive text entries are genuinely separate messages. The row is not running, so its
    // transcript opens whole and each message stands in its own block — a merged row would be ONE
    // block reading 'CODEWEAVERfirst\nsecond\nthird'.
    it('VALID: {codeweaver row, three text entries} => does NOT join them, rendering one block per message', () => {
      ExecutionRowLayerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ExecutionRowLayerWidget
            {...defaultProps()}
            role="codeweaver"
            autoExpand={true}
            entries={[
              AssistantTextChatEntryStub({ content: 'first' }),
              AssistantTextChatEntryStub({ content: 'second' }),
              AssistantTextChatEntryStub({ content: 'third' }),
            ]}
          />
        ),
      });

      const blocks = screen.getAllByTestId('CHAT_MESSAGE');

      expect(blocks.map((block) => block.textContent)).toStrictEqual([
        'CODEWEAVERfirst',
        'CODEWEAVERsecond',
        'CODEWEAVERthird',
      ]);
    });
  });
});
