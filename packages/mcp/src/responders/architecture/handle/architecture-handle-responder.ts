/**
 * PURPOSE: Handles architecture-related MCP tool calls (discover, get-architecture, get-folder-detail, get-syntax-rules, get-testing-patterns, get-project-map)
 *
 * USAGE:
 * const result = await ArchitectureHandleResponder({ tool: ToolNameStub({ value: 'get-architecture' }), args: {} });
 * // Returns ToolResponse with architecture content
 */

import type { FolderType } from '@dungeonmaster/shared/contracts';
import {
  architectureOverviewBroker,
  architectureProjectMapBroker,
} from '@dungeonmaster/shared/brokers';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { architectureFolderDetailBroker } from '../../../brokers/architecture/folder-detail/architecture-folder-detail-broker';
import { architectureSyntaxRulesBroker } from '../../../brokers/architecture/syntax-rules/architecture-syntax-rules-broker';
import { architectureTestingPatternsBroker } from '../../../brokers/architecture/testing-patterns/architecture-testing-patterns-broker';
import { mcpDiscoverBroker } from '../../../brokers/mcp/discover/mcp-discover-broker';
import { folderConstraintsState } from '../../../state/folder-constraints/folder-constraints-state';
import type { ToolResponse } from '../../../contracts/tool-response/tool-response-contract';
import type { ToolName } from '../../../contracts/tool-name/tool-name-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

const JSON_INDENT_SPACES = 2;

export const ArchitectureHandleResponder = async ({
  tool,
  args,
}: {
  tool: ToolName;
  args: Record<string, unknown>;
}): Promise<ToolResponse> => {
  if (tool === 'discover') {
    const result = await mcpDiscoverBroker({
      input: args as never,
    });

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(JSON.stringify(result, null, JSON_INDENT_SPACES)),
        },
      ],
    };
  }

  if (tool === 'get-architecture') {
    const result = architectureOverviewBroker();

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(result),
        },
      ],
    };
  }

  if (tool === 'get-folder-detail') {
    const folderType = Reflect.get(args, 'folderType') as FolderType;
    const supplementalConstraints = folderConstraintsState.get({ folderType });

    const result = architectureFolderDetailBroker({
      folderType,
      ...(supplementalConstraints && { supplementalConstraints }),
    });

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(result),
        },
      ],
    };
  }

  if (tool === 'get-syntax-rules') {
    const result = architectureSyntaxRulesBroker();

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(result),
        },
      ],
    };
  }

  if (tool === 'get-testing-patterns') {
    const result = architectureTestingPatternsBroker();

    return {
      content: [
        {
          type: 'text',
          text: contentTextContract.parse(result),
        },
      ],
    };
  }

  if (tool === 'get-project-map') {
    const result = architectureProjectMapBroker({
      projectRoot: absoluteFilePathContract.parse(process.cwd()),
    });

    return {
      content: [{ type: 'text', text: contentTextContract.parse(result) }],
    };
  }

  throw new Error(`Unknown architecture tool: ${String(tool)}`);
};
