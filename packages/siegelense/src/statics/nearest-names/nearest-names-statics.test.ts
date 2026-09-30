import { nearestNamesStatics } from './nearest-names-statics';

describe('nearestNamesStatics', () => {
  it('VALID: {limits} => shows the top 5 near misses', () => {
    expect(nearestNamesStatics).toStrictEqual({ limits: { shown: 5 } });
  });
});
