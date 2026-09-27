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

  it('VALID: {kick missing} => the contract carries no required data of its own', () => {
    const parsed = nodeDispatchRunnerContract.parse({
      start: (): void => {},
      stop: (): void => {},
    });

    expect(parsed).toStrictEqual({
      start: expect.any(Function),
      stop: expect.any(Function),
    });
  });
});
