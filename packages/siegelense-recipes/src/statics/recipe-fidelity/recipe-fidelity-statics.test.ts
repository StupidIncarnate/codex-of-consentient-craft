import { recipeFidelityStatics } from './recipe-fidelity-statics';

describe('recipeFidelityStatics', () => {
  describe('markers', () => {
    it('VALID: {markers} => holds exactly the three spec values, in the spec order, and names direct as the mirrors-bearing one', () => {
      expect(recipeFidelityStatics.markers).toStrictEqual({
        all: ['production', 'direct', 'captured'],
        mirrorsRequired: 'direct',
      });
    });
  });

  describe('meanings and risks', () => {
    it('VALID: {meanings} => one sentence per marker, keyed by the marker name', () => {
      expect(recipeFidelityStatics.meanings).toStrictEqual({
        production: 'built by calling the real code path, so the server does what it really does',
        direct: 'written straight to disk in the shape production would have made',
        captured: 'recorded from a real run and replayed',
      });
    });

    it('VALID: {risks} => one declared risk per marker, keyed by the marker name', () => {
      expect(recipeFidelityStatics.risks).toStrictEqual({
        production: 'none; this is the honest one',
        direct: 'it can drift from what production actually writes',
        captured: 'the only one that cannot lie about shape',
      });
    });
  });

  describe('instanceCost', () => {
    it('VALID: {instanceCost.needing} => production alone costs a booted instance to prove', () => {
      expect(recipeFidelityStatics.instanceCost.needing).toStrictEqual(['production']);
    });
  });
});
