import { screen } from '@testing-library/react';

import { UnitObservationStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ExecutionRowUnitMarksLayerWidget } from './execution-row-unit-marks-layer-widget';
import { ExecutionRowUnitMarksLayerWidgetProxy } from './execution-row-unit-marks-layer-widget.proxy';

describe('ExecutionRowUnitMarksLayerWidget', () => {
  it('VALID: {3 assigned units, met + cant-meet observed, 1 never observed} => renders the summary and every non-unmet mark', () => {
    ExecutionRowUnitMarksLayerWidgetProxy();

    mantineRenderAdapter({
      ui: (
        <ExecutionRowUnitMarksLayerWidget
          workItem={WorkItemStub({
            assignedUnitIds: [
              'send-flow:observable:check-badge-count-text',
              'send-flow:terminal:review-passes',
              'send-flow:branch:takes-happy-path',
            ],
            observations: [
              UnitObservationStub({ mark: 'met' }),
              UnitObservationStub({
                unitId: 'send-flow:terminal:review-passes',
                mark: 'cant-meet',
                evidence: 'no session at this layer can reach the admin panel',
                toSettle: 'add an admin fixture to the seed data',
              }),
            ],
          })}
        />
      ),
    });

    const summary = screen.getByTestId('execution-row-unit-marks-summary');

    expect(summary.textContent).toBe('Units: 2/3 marked');

    const marks = screen.queryAllByTestId('execution-row-unit-mark');

    expect(marks.map((el) => el.textContent)).toStrictEqual([
      '[met] send-flow:observable:check-badge-count-text',
      '[cant-meet] send-flow:terminal:review-passes',
      '[unmarked] send-flow:branch:takes-happy-path',
    ]);
  });

  it('VALID: {an unmet observation among the assigned units} => excludes it, leaving the unmet list to show it', () => {
    ExecutionRowUnitMarksLayerWidgetProxy();

    mantineRenderAdapter({
      ui: (
        <ExecutionRowUnitMarksLayerWidget
          workItem={WorkItemStub({
            assignedUnitIds: [
              'send-flow:observable:check-badge-count-text',
              'send-flow:terminal:review-passes',
            ],
            observations: [
              UnitObservationStub({ mark: 'unmet', evidence: 'still nothing renders the count' }),
              UnitObservationStub({ unitId: 'send-flow:terminal:review-passes', mark: 'met' }),
            ],
          })}
        />
      ),
    });

    const summary = screen.getByTestId('execution-row-unit-marks-summary');

    expect(summary.textContent).toBe('Units: 2/2 marked');

    const marks = screen.queryAllByTestId('execution-row-unit-mark');

    expect(marks.map((el) => el.textContent)).toStrictEqual([
      '[met] send-flow:terminal:review-passes',
    ]);
  });

  it('EMPTY: {workItem assigned no units} => renders nothing', () => {
    ExecutionRowUnitMarksLayerWidgetProxy();

    mantineRenderAdapter({
      ui: <ExecutionRowUnitMarksLayerWidget workItem={WorkItemStub({ assignedUnitIds: [] })} />,
    });

    expect(screen.queryByTestId('execution-row-unit-marks')).toBe(null);
  });

  it('EMPTY: {workItem: undefined} => renders nothing', () => {
    ExecutionRowUnitMarksLayerWidgetProxy();

    mantineRenderAdapter({ ui: <ExecutionRowUnitMarksLayerWidget workItem={undefined} /> });

    expect(screen.queryByTestId('execution-row-unit-marks')).toBe(null);
  });
});
