import { warpgateOperationStatics } from './warpgate-operation-statics';

describe('warpgateOperationStatics', () => {
  it('VALID: exported value => the warpgate operation item text', () => {
    expect(warpgateOperationStatics).toStrictEqual({
      text: 'Warpgate: merge the quest branch home into the base branch',
    });
  });
});
