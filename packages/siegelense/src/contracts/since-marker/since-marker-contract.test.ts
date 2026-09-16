import { sinceMarkerContract } from './since-marker-contract';
import { SinceMarkerStub } from './since-marker.stub';

describe('sinceMarkerContract', () => {
  it('VALID: {value: "boot"} => parses to itself', () => {
    const sinceMarker = SinceMarkerStub({ value: 'boot' });

    const result = sinceMarkerContract.parse(sinceMarker);

    expect(result).toBe('boot');
  });

  it('INVALID: {value: "start"} => any spelling other than the one legal value throws validation error', () => {
    expect(() => {
      sinceMarkerContract.parse('start');
    }).toThrow(/Invalid literal value, expected \\"boot\\"/u);
  });
});
