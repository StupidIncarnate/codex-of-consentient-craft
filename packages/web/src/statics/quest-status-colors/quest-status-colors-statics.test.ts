import { questStatusColorsStatics } from './quest-status-colors-statics';

describe('questStatusColorsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questStatusColorsStatics).toStrictEqual({
      status: {
        created: 'gray',
        pending: 'yellow',
        explore_flows: 'cyan',
        review_flows: 'yellow',
        flows_approved: 'green',
        explore_observables: 'cyan',
        review_observables: 'yellow',
        proposed: 'yellow',
        explore_design: 'violet',
        review_design: 'yellow',
        design_approved: 'green',
        approved: 'green',
        deferred: 'gray',
        ready: 'blue',
        in_progress: 'cyan',
        complete: 'green',
        failed: 'red',
        blocked: 'orange',
        partially_complete: 'teal',
        abandoned: 'red',
      },
      contractStatus: {
        new: 'blue',
        existing: 'gray',
        modified: 'orange',
      },
      slotStatus: {
        idle: 'gray',
        running: 'blue',
      },
    });
  });
});
