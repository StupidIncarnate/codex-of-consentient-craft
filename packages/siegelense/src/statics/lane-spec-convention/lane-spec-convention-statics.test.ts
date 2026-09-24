import { laneSpecConventionStatics } from './lane-spec-convention-statics';

describe('laneSpecConventionStatics', () => {
  it('VALID: {conventions} => toStrictEqual the browsered and headless lane names', () => {
    expect(laneSpecConventionStatics).toStrictEqual({
      browsered: 'stack',
      headless: 'api',
    });
  });
});
