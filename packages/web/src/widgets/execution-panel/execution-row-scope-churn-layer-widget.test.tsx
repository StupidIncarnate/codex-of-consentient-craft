import { screen } from '@testing-library/react';

import { UnitObservationStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ExecutionRowScopeChurnLayerWidget } from './execution-row-scope-churn-layer-widget';
import { ExecutionRowScopeChurnLayerWidgetProxy } from './execution-row-scope-churn-layer-widget.proxy';

describe('ExecutionRowScopeChurnLayerWidget', () => {
  it('VALID: {a unit marked unmet, met, unmet, met across four work items} => renders the whole back-and-forth sequence', () => {
    ExecutionRowScopeChurnLayerWidgetProxy();

    mantineRenderAdapter({
      ui: (
        <ExecutionRowScopeChurnLayerWidget
          scopeWorkItems={[
            WorkItemStub({
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d471',
              step: 'work',
              observations: [
                UnitObservationStub({
                  unitId: 'send-flow:observable:scan-finds-every-path',
                  mark: 'unmet',
                  evidence: 'the first worker never wired the scanner up',
                }),
              ],
            }),
            WorkItemStub({
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d472',
              step: 'work',
              observations: [
                UnitObservationStub({
                  unitId: 'send-flow:observable:scan-finds-every-path',
                  mark: 'met',
                }),
              ],
            }),
            WorkItemStub({
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d473',
              step: 'review',
              observations: [
                UnitObservationStub({
                  unitId: 'send-flow:observable:scan-finds-every-path',
                  mark: 'unmet',
                  evidence: 'the reviewer found the scanner skips symlinks',
                }),
              ],
            }),
            WorkItemStub({
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d474',
              step: 'work',
              observations: [
                UnitObservationStub({
                  unitId: 'send-flow:observable:scan-finds-every-path',
                  mark: 'met',
                }),
              ],
            }),
          ]}
        />
      ),
    });

    const entry = screen.getByTestId('execution-row-scope-churn-entry');

    expect(entry.textContent).toBe(
      'send-flow:observable:scan-finds-every-path: unmet (work) → met (work) → unmet (review) → met (work)',
    );
  });

  it('EMPTY: {every unit touched by only one work item} => renders nothing', () => {
    ExecutionRowScopeChurnLayerWidgetProxy();

    mantineRenderAdapter({
      ui: (
        <ExecutionRowScopeChurnLayerWidget
          scopeWorkItems={[
            WorkItemStub({
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d471',
              step: 'work',
              observations: [UnitObservationStub({ mark: 'met' })],
            }),
            WorkItemStub({
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d472',
              step: 'review',
              observations: [
                UnitObservationStub({
                  unitId: 'send-flow:terminal:review-passes',
                  mark: 'met',
                }),
              ],
            }),
          ]}
        />
      ),
    });

    expect(screen.queryByTestId('execution-row-scope-churn')).toBe(null);
  });

  it('EMPTY: {scopeWorkItems: undefined} => renders nothing', () => {
    ExecutionRowScopeChurnLayerWidgetProxy();

    mantineRenderAdapter({
      ui: <ExecutionRowScopeChurnLayerWidget scopeWorkItems={undefined} />,
    });

    expect(screen.queryByTestId('execution-row-scope-churn')).toBe(null);
  });
});
