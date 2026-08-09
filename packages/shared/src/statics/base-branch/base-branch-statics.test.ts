import { baseBranchStatics } from './base-branch-statics';

describe('baseBranchStatics', () => {
  it('VALID: statics => matches the full expected object', () => {
    expect(baseBranchStatics).toStrictEqual({
      candidates: ['main', 'master'],
    });
  });
});
