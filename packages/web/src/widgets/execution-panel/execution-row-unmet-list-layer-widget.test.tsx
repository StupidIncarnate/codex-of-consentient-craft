import { screen } from '@testing-library/react';

import { UnitObservationStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ExecutionRowUnmetListLayerWidget } from './execution-row-unmet-list-layer-widget';
import { ExecutionRowUnmetListLayerWidgetProxy } from './execution-row-unmet-list-layer-widget.proxy';

describe('ExecutionRowUnmetListLayerWidget', () => {
  it('VALID: {workItem with one unmet observation} => renders its unit id and evidence', () => {
    ExecutionRowUnmetListLayerWidgetProxy();

    mantineRenderAdapter({
      ui: (
        <ExecutionRowUnmetListLayerWidget
          workItem={WorkItemStub({
            observations: [
              UnitObservationStub({ mark: 'unmet', evidence: 'still nothing renders the count' }),
            ],
          })}
        />
      ),
    });

    const unmetEl = screen.getByTestId('execution-row-unmet-observation');

    expect(unmetEl.textContent).toBe(
      '[unmet] send-flow:observable:check-badge-count-text: still nothing renders the count',
    );
  });

  it('VALID: {workItem with a met and an unmet observation} => renders only the unmet one', () => {
    ExecutionRowUnmetListLayerWidgetProxy();

    mantineRenderAdapter({
      ui: (
        <ExecutionRowUnmetListLayerWidget
          workItem={WorkItemStub({
            observations: [
              UnitObservationStub({
                unitId: 'send-flow:terminal:review-passes' as never,
                mark: 'met',
                evidence: 'review-passes-test.ts:12 — flips red on a bad review',
              }),
              UnitObservationStub({ mark: 'unmet', evidence: 'still nothing renders the count' }),
            ],
          })}
        />
      ),
    });

    const unmetEls = screen.queryAllByTestId('execution-row-unmet-observation');

    expect(unmetEls.map((el) => el.textContent)).toStrictEqual([
      '[unmet] send-flow:observable:check-badge-count-text: still nothing renders the count',
    ]);
  });

  it('EMPTY: {workItem with only a met observation} => renders nothing', () => {
    ExecutionRowUnmetListLayerWidgetProxy();

    mantineRenderAdapter({
      ui: (
        <ExecutionRowUnmetListLayerWidget
          workItem={WorkItemStub({ observations: [UnitObservationStub({ mark: 'met' })] })}
        />
      ),
    });

    expect(screen.queryByTestId('execution-row-unmet-list')).toBe(null);
  });

  it('EMPTY: {workItem: undefined} => renders nothing', () => {
    ExecutionRowUnmetListLayerWidgetProxy();

    mantineRenderAdapter({ ui: <ExecutionRowUnmetListLayerWidget workItem={undefined} /> });

    expect(screen.queryByTestId('execution-row-unmet-list')).toBe(null);
  });
});
