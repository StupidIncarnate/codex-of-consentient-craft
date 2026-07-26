import { MockFunctionNameStub } from '../../contracts/mock-function-name/mock-function-name.stub';
import { StagedCallStub } from '../../contracts/staged-call/staged-call.stub';
import { mockUnmatchedCallMessageTransformer } from './mock-unmatched-call-message-transformer';

describe('mockUnmatchedCallMessageTransformer', () => {
  describe('single staged description', () => {
    it('VALID: {call args, one staged description} => names the call and the one description', () => {
      const message = mockUnmatchedCallMessageTransformer({
        name: MockFunctionNameStub({ value: 'mockFn' }),
        args: ['/a/other.json'],
        staged: [StagedCallStub({ args: ['/a/quest.json'] })],
      });

      expect(message).toBe(
        'registerMock: nothing set up for the call mockFn("/a/other.json"). Calls that ARE set up: ("/a/quest.json")',
      );
    });
  });

  describe('multiple staged descriptions', () => {
    it('VALID: {two staged descriptions} => joins them with " | "', () => {
      const message = mockUnmatchedCallMessageTransformer({
        name: MockFunctionNameStub({ value: 'mockFn' }),
        args: ['/a/other.json'],
        staged: [
          StagedCallStub({ args: ['/a/quest.json'] }),
          StagedCallStub({ args: ['/a/manifest.json'] }),
        ],
      });

      expect(message).toBe(
        'registerMock: nothing set up for the call mockFn("/a/other.json"). Calls that ARE set up: ("/a/quest.json") | ("/a/manifest.json")',
      );
    });
  });

  describe('function-valued arguments', () => {
    it('VALID: {function argument, no staged descriptions} => renders the argument as <predicate>', () => {
      const message = mockUnmatchedCallMessageTransformer({
        name: MockFunctionNameStub({ value: 'mockFn' }),
        args: [(): void => undefined],
        staged: [],
      });

      expect(message).toBe(
        'registerMock: nothing set up for the call mockFn(<predicate>). Calls that ARE set up: ',
      );
    });
  });

  describe('empty args', () => {
    it('EMPTY: {no call args, one staged description with no args} => renders both as empty parens', () => {
      const message = mockUnmatchedCallMessageTransformer({
        name: MockFunctionNameStub({ value: 'mockFn' }),
        args: [],
        staged: [StagedCallStub({ args: [] })],
      });

      expect(message).toBe(
        'registerMock: nothing set up for the call mockFn(). Calls that ARE set up: ()',
      );
    });
  });
});
