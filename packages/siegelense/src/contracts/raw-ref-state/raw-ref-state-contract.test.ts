import { rawRefStateContract } from './raw-ref-state-contract';
import { RawRefStateStub } from './raw-ref-state.stub';

describe('rawRefStateContract', () => {
  it.each(rawRefStateContract.options)(
    'VALID: {value: %s} => parses the page-side state',
    (state) => {
      expect(RawRefStateStub({ value: state })).toBe(state);
    },
  );

  it('INVALID: {value: "stale"} => throws, because stale is a RefResolution verdict, not a page answer', () => {
    expect(() => rawRefStateContract.parse('stale')).toThrow(/Invalid option/u);
  });
});
