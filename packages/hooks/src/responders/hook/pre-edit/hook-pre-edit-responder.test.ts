import { HookPreEditResponder } from './hook-pre-edit-responder';
import { HookPreEditResponderProxy } from './hook-pre-edit-responder.proxy';
import {
  EditToolHookStub,
  WriteToolHookStub,
} from '../../../contracts/pre-tool-use-hook-data/pre-tool-use-hook-data.stub';

describe('HookPreEditResponder', () => {
  it('VALID: {hasNewViolations: false} => returns {shouldBlock: false}', async () => {
    const proxy = HookPreEditResponderProxy();
    const hookData = EditToolHookStub({
      cwd: '/test/cwd',
      tool_input: {
        file_path: '/test/file.ts',
        old_string: 'old',
        new_string: 'new',
      },
    });

    proxy.setupViolationCheck();

    const result = await HookPreEditResponder({ input: hookData });

    expect(result).toStrictEqual({
      shouldBlock: false,
    });
  });

  it('VALID: {hasNewViolations: true, message: "Found 1 new violation"} => returns {shouldBlock: true, message}', async () => {
    const proxy = HookPreEditResponderProxy();
    const hookData = EditToolHookStub({
      cwd: '/test/cwd',
      tool_input: {
        file_path: '/test/file.ts',
        old_string: 'old',
        new_string: 'new',
      },
    });

    proxy.setupViolationCheck({ hasViolations: true });

    const result = await HookPreEditResponder({ input: hookData });

    expect(result.shouldBlock).toBe(true);
    expect(result.message).toMatch(/Code Quality Issue/u);
    expect(result.message).toMatch(/Unexpected console statement/u);
  });

  it('VALID: {hasNewViolations: true, message: "New violations detected"} => returns {shouldBlock: true, message}', async () => {
    const proxy = HookPreEditResponderProxy();
    const hookData = WriteToolHookStub({
      cwd: '/test/cwd',
      tool_input: {
        file_path: '/test/file.ts',
        content: 'new content',
      },
    });

    proxy.setupViolationCheck({ hasViolations: true });

    const result = await HookPreEditResponder({ input: hookData });

    expect(result.shouldBlock).toBe(true);
    expect(result.message).toMatch(/Code Quality Issue/u);
    expect(result.message).toMatch(/Unexpected console statement/u);
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
