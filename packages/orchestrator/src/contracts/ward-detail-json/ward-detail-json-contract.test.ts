import { wardDetailJsonContract } from './ward-detail-json-contract';
import { WardDetailJsonStub } from './ward-detail-json.stub';

describe('wardDetailJsonContract', (): void => {
  it('VALID: {default stub} => parses, single error', (): void => {
    const d = WardDetailJsonStub();

    expect(d.checks?.[0]?.projectResults?.[0]?.errors?.[0]?.message).toBe('something is wrong');
  });

  it('VALID: {empty checks} => parses', (): void => {
    const d = wardDetailJsonContract.parse({ checks: [] });

    expect(d.checks).toStrictEqual([]);
  });

  it('VALID: {extra unknown keys} => preserved via passthrough', (): void => {
    const d = wardDetailJsonContract.parse({ extraField: 'x' });

    expect((d as { extraField?: unknown }).extraField).toBe('x');
  });

  it('VALID: {empty object} => parses with checks undefined', (): void => {
    const d = wardDetailJsonContract.parse({});

    expect(d.checks).toBe(undefined);
  });

  it('ERROR: {non-object} => throws', (): void => {
    expect((): unknown => wardDetailJsonContract.parse('foo')).toThrow(/Expected object/u);
  });
});
