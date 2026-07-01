import { flowHandleStatics } from './flow-handle-statics';

describe('flowHandleStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(flowHandleStatics).toStrictEqual({
      observableSourceId: 'flow-node-observable-source',
    });
  });
});
