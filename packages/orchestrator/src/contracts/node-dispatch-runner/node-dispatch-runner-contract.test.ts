import { nodeDispatchRunnerContract } from './node-dispatch-runner-contract';
import { NodeDispatchRunnerControllerStub } from './node-dispatch-runner.stub';

describe('nodeDispatchRunnerContract', () => {
  it('VALID: {stub controller} => parses start/stop/kick as functions', () => {
    const stub = NodeDispatchRunnerControllerStub();

    const parsed = nodeDispatchRunnerContract.parse(stub);

    expect(parsed).toStrictEqual({
      start: expect.any(Function),
      stop: expect.any(Function),
      kick: expect.any(Function),
    });
  });

  it('INVALID: {kick missing} => throws validation error', () => {
    expect(() => {
      return nodeDispatchRunnerContract.parse({
        start: (): void => {},
        stop: (): void => {},
      });
    }).toThrow(/Required/u);
  });
});
