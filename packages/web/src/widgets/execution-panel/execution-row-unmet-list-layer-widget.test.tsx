import { render, screen } from '#gateway/npm/testing-library__react';

import { UnitObservationStub } from '@dungeonmaster/shared/contracts/unit-observation/unit-observation.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { ExecutionRowUnmetListLayerWidget } from './execution-row-unmet-list-layer-widget';
import { ExecutionRowUnmetListLayerWidgetProxy } from './execution-row-unmet-list-layer-widget.proxy';

describe('ExecutionRowUnmetListLayerWidget', () => {
  it('VALID: {workItem with one unmet observation} => renders its unit id and evidence', () => {
    ExecutionRowUnmetListLayerWidgetProxy();

    render({
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

    render({
      ui: (
        <ExecutionRowUnmetListLayerWidget
          workItem={WorkItemStub({
            observations: [
              UnitObservationStub({
                unitId: 'send-flow:terminal:review-passes',
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

    render({
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

    render({ ui: <ExecutionRowUnmetListLayerWidget workItem={undefined} /> });

    expect(screen.queryByTestId('execution-row-unmet-list')).toBe(null);
  });
});
