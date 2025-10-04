import { HookPreEditResponder } from './hook-pre-edit-responder';
import { violationsCheckNewBroker } from '../../../brokers/violations/check-new/violations-check-new-broker';
import {
  EditToolHookStub,
  WriteToolHookStub,
} from '../../../contracts/pre-tool-use-hook-data/pre-tool-use-hook-data.stub';
import { ViolationCountStub } from '../../../contracts/violation-count/violation-count.stub';
import { ViolationDetailStub } from '../../../contracts/violation-detail/violation-detail.stub';

jest.mock('../../../brokers/violations/check-new/violations-check-new-broker');

describe('HookPreEditResponder', () => {
  const mockViolationsCheckNewBroker = jest.mocked(violationsCheckNewBroker);

  it('VALID: {hasNewViolations: false} => returns {shouldBlock: false}', async () => {
    const hookData = EditToolHookStub({
      cwd: '/test/cwd',
      tool_input: {
        file_path: '/test/file.ts',
        old_string: 'old',
        new_string: 'new',
      },
    });

    mockViolationsCheckNewBroker.mockResolvedValue({
      hasNewViolations: false,
      newViolations: [],
    });

    const result = await HookPreEditResponder({ input: hookData });

    expect(result).toStrictEqual({
      shouldBlock: false,
    });
    expect(mockViolationsCheckNewBroker).toHaveBeenCalledTimes(1);
    expect(mockViolationsCheckNewBroker).toHaveBeenCalledWith({
      toolInput: hookData.tool_input,
      cwd: hookData.cwd,
    });
  });

  it('VALID: {hasNewViolations: true, message: "Found 1 new violation"} => returns {shouldBlock: true, message}', async () => {
    const hookData = EditToolHookStub({
      cwd: '/test/cwd',
      tool_input: {
        file_path: '/test/file.ts',
        old_string: 'old',
        new_string: 'new',
      },
    });

    mockViolationsCheckNewBroker.mockResolvedValue({
      hasNewViolations: true,
      newViolations: [
        ViolationCountStub({
          ruleId: 'no-unused-vars',
          count: 1,
          details: [
            ViolationDetailStub({
              ruleId: 'no-unused-vars',
              line: 1,
              column: 1,
              message: 'Variable is unused',
            }),
          ],
        }),
      ],
      message: 'Found 1 new violation',
    });

    const result = await HookPreEditResponder({ input: hookData });

    expect(result).toStrictEqual({
      shouldBlock: true,
      message: 'Found 1 new violation',
    });
    expect(mockViolationsCheckNewBroker).toHaveBeenCalledTimes(1);
    expect(mockViolationsCheckNewBroker).toHaveBeenCalledWith({
      toolInput: hookData.tool_input,
      cwd: hookData.cwd,
    });
  });

  it('VALID: {hasNewViolations: true, message: undefined} => returns {shouldBlock: true, message: "New violations detected"}', async () => {
    const hookData = WriteToolHookStub({
      cwd: '/test/cwd',
      tool_input: {
        file_path: '/test/file.ts',
        content: 'new content',
      },
    });

    mockViolationsCheckNewBroker.mockResolvedValue({
      hasNewViolations: true,
      newViolations: [
        ViolationCountStub({
          ruleId: 'no-console',
          count: 1,
          details: [
            ViolationDetailStub({
              ruleId: 'no-console',
              line: 5,
              column: 3,
              message: 'Unexpected console statement',
            }),
          ],
        }),
      ],
    });

    const result = await HookPreEditResponder({ input: hookData });

    expect(result).toStrictEqual({
      shouldBlock: true,
      message: 'New violations detected',
    });
    expect(mockViolationsCheckNewBroker).toHaveBeenCalledTimes(1);
    expect(mockViolationsCheckNewBroker).toHaveBeenCalledWith({
      toolInput: hookData.tool_input,
      cwd: hookData.cwd,
    });
  });

  // It('ERROR: {hook_event_name: "SessionStart"} => throws "Unsupported hook event: SessionStart"', async () => {
  //   Const hookData = SessionStartHookStub();
  //
  //   Await expect(HookPreEditResponder({ input: hookData })).rejects.toThrow(
  //     'Unsupported hook event: SessionStart',
  //   );
  //   Expect(mockViolationsCheckNewBroker).not.toHaveBeenCalled();
  // });

  // It('ERROR: {hook_event_name: "PreToolUse", tool_name: undefined} => throws "Unsupported hook event: PreToolUse"', async () => {
  //   // Create a PreToolUse hook without tool_name by using base stub and removing tool_name
  //   Const baseStub = PreToolUseHookStub();
  //
  //   Const { tool_name: _removed, ...hookData } = baseStub;
  //
  //   // Cast to unknown first to bypass type checking for intentionally invalid test data
  //
  //   Await expect(
  //     HookPreEditResponder({ input: hookData as unknown as PreToolUseHookData }),
  //   ).rejects.toThrow('Unsupported hook event: PreToolUse');
  //   Expect(mockViolationsCheckNewBroker).not.toHaveBeenCalled();
  // });
});
