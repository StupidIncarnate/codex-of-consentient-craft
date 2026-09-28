import { adapterLogicReasonContract } from './adapter-logic-reason-contract';
import { AdapterLogicReasonStub } from './adapter-logic-reason.stub';

describe('adapterLogicReasonContract', () => {
  it.each(adapterLogicReasonContract.options)(
    'VALID: {value: %s} => parses to the same text',
    (value) => {
      const result = AdapterLogicReasonStub({ value });

      expect(result).toBe(value);
    },
  );

  it('INVALID: {value: "nonsense"} => throws an invalid-option error', () => {
    expect(() => AdapterLogicReasonStub({ value: 'nonsense' as never })).toThrow(
      /^[\s\S]*Invalid option[\s\S]*$/u,
    );
  });
});
