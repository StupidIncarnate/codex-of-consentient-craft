import { questExecutionQueueRunnerContract } from './quest-execution-queue-runner-contract';
import { QuestExecutionQueueRunnerControllerStub } from './quest-execution-queue-runner.stub';

describe('questExecutionQueueRunnerContract', () => {
  it('VALID: {stub controller} => parses start/stop/kick as functions', () => {
    const stub = QuestExecutionQueueRunnerControllerStub();

    const parsed = questExecutionQueueRunnerContract.parse(stub);

    expect(parsed).toStrictEqual({
      start: expect.any(Function),
      stop: expect.any(Function),
      kick: expect.any(Function),
    });
  });

  it('INVALID: {kick missing} => throws validation error', () => {
    expect(() => {
      return questExecutionQueueRunnerContract.parse({
        start: (): void => {},
        stop: (): void => {},
      });
    }).toThrow(/Required/u);
  });
});
