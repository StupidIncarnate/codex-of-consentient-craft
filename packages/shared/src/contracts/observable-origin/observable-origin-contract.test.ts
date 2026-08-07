import { observableOriginContract } from './observable-origin-contract';
import { ObservableOriginStub } from './observable-origin.stub';

describe('observableOriginContract', () => {
  describe('enum membership', () => {
    it('VALID: {options} => exposes the spec origin plus every role that can add an observable mid-quest', () => {
      expect(observableOriginContract.options).toStrictEqual([
        'spec',
        'chaoswhisperer',
        'codeweaver',
        'flowrider',
        'siegemaster',
        'operator',
      ]);
    });

    it.each(observableOriginContract.options)(
      'VALID: {origin: %s} => parses to itself, so every provenance can be carried alongside a verdict',
      (origin) => {
        expect(ObservableOriginStub({ value: origin })).toBe(origin);
      },
    );
  });

  describe('default stub', () => {
    it('VALID: {no args} => defaults to spec', () => {
      expect(ObservableOriginStub()).toBe('spec');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {origin: "blightwarden"} => throws, because only roles that author observables are origins', () => {
      expect(() => ObservableOriginStub({ value: 'blightwarden' })).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {origin: ""} => throws', () => {
      expect(() => ObservableOriginStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
