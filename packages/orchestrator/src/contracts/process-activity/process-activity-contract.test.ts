import { processActivityContract } from './process-activity-contract';
import { ProcessActivityStub } from './process-activity.stub';

describe('processActivityContract', () => {
  it('VALID: {default stub} => parses with lastActivityAt set', () => {
    const stub = ProcessActivityStub();

    const result = processActivityContract.parse(stub);

    expect(result).toStrictEqual({
      lastActivityAt: new Date('2026-05-12T22:58:24.835Z'),
    });
  });

  it('VALID: {lastActivityAt + osPid} => parses with both fields', () => {
    const stub = ProcessActivityStub({ osPid: 812325 });

    const result = processActivityContract.parse(stub);

    expect(result).toStrictEqual({
      lastActivityAt: new Date('2026-05-12T22:58:24.835Z'),
      osPid: 812325,
    });
  });

  it('INVALID: {missing lastActivityAt} => throws validation error', () => {
    expect(() => processActivityContract.parse({})).toThrow(/Required/u);
  });
});
