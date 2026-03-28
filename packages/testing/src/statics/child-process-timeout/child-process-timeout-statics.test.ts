import { childProcessTimeoutStatics } from './child-process-timeout-statics';

describe('childProcessTimeoutStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(childProcessTimeoutStatics).toBe(31000);
  });
});
