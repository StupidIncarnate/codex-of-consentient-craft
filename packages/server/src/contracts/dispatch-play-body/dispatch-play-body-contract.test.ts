import { dispatchPlayBodyContract } from './dispatch-play-body-contract';
import { DispatchPlayBodyStub } from './dispatch-play-body.stub';

describe('dispatchPlayBodyContract', () => {
  it('VALID: {} => parses empty body', () => {
    const result = dispatchPlayBodyContract.parse({});

    expect(result).toStrictEqual({});
  });

  it('VALID: {force: true} => parses force flag', () => {
    const result = DispatchPlayBodyStub({ force: true });

    expect(result).toStrictEqual({ force: true });
  });

  it('INVALID: {force: "yes"} => throws type error', () => {
    expect(() => DispatchPlayBodyStub({ force: 'yes' as never })).toThrow(
      /Expected boolean, received string/u,
    );
  });
});
