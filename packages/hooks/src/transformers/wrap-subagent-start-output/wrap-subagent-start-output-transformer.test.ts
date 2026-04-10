import { ExecResultStub } from '../../contracts/exec-result/exec-result.stub';
import { wrapSubagentStartOutputTransformer } from './wrap-subagent-start-output-transformer';

describe('wrapSubagentStartOutputTransformer', () => {
  it('VALID: {content: "<dungeonmaster-discover>\\ncontent\\n</dungeonmaster-discover>\\n"} => returns JSON with hookSpecificOutput.additionalContext', () => {
    const { stdout: content } = ExecResultStub({
      stdout: '<dungeonmaster-discover>\ncontent\n</dungeonmaster-discover>\n',
    });

    const result = wrapSubagentStartOutputTransformer({ content });

    expect(result).toBe(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SubagentStart',
          additionalContext: '<dungeonmaster-discover>\ncontent\n</dungeonmaster-discover>\n',
        },
      }),
    );
  });

  it('VALID: {content: "<dungeonmaster-ward>\\nward content\\n</dungeonmaster-ward>\\n"} => returns JSON with ward content in additionalContext', () => {
    const { stdout: content } = ExecResultStub({
      stdout: '<dungeonmaster-ward>\nward content\n</dungeonmaster-ward>\n',
    });

    const result = wrapSubagentStartOutputTransformer({ content });

    expect(result).toBe(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SubagentStart',
          additionalContext: '<dungeonmaster-ward>\nward content\n</dungeonmaster-ward>\n',
        },
      }),
    );
  });
});
