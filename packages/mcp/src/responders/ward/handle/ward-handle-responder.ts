/**
 * PURPOSE: Handles ward MCP tool calls (ward-detail)
 *
 * USAGE:
 * const result = await WardHandleResponder({ tool: ToolNameStub({ value: 'ward-detail' }), args: {} });
 * // Returns ToolResponse with ward data as text content
 */

import { wardDetailAdapter } from '../../../adapters/ward/detail/ward-detail-adapter';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';
import type { ToolName } from '../../../contracts/tool-name/tool-name-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

const JSON_INDENT_SPACES = 2;

export const WardHandleResponder = async ({
  tool,
  args,
}: {
  tool: ToolName;
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  const packagePathRaw: unknown = Reflect.get(args, 'packagePath');
  const packagePath = typeof packagePathRaw === 'string' ? packagePathRaw : undefined;

  try {
    const wardResult = await (async (): Promise<unknown> => {
      if (tool === 'ward-detail') {
        const runIdRaw: unknown = Reflect.get(args, 'runId');
        const filePathRaw: unknown = Reflect.get(args, 'filePath');
        const verboseRaw: unknown = Reflect.get(args, 'verbose');
        const runId = typeof runIdRaw === 'string' ? runIdRaw : undefined;
        const filePath = String(filePathRaw);
        const verbose = typeof verboseRaw === 'boolean' ? verboseRaw : undefined;
        return wardDetailAdapter({
          ...(runId && { runId: runId as never }),
          filePath: filePath as never,
          ...(verbose !== undefined && { verbose }),
          ...(packagePath && { packagePath }),
        });
      }
      throw new Error(`Unknown ward tool: ${tool}`);
    })();
    return {
      content: [{ type: 'text', text: contentTextContract.parse(String(wardResult)) }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(
            JSON.stringify({ success: false, error: errorMessage }, null, JSON_INDENT_SPACES),
          ),
        },
      ],
      isError: true,
    };
  }
};
