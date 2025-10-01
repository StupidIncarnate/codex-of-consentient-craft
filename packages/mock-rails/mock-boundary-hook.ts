#!/usr/bin/env node

import { DEFAULT_CONFIGS, validateMockBoundaries } from './index';
import type { PreToolUseHookData } from '@questmaestro/hooks/src/types/hook-type';

/**
 * Hook that validates mock boundaries in test files before Claude writes/edits them
 */
export function mockBoundaryHook(data: PreToolUseHookData): void {
  // Only check Write, Edit, and MultiEdit operations on test files
  if (!['Write', 'Edit', 'MultiEdit'].includes(data.tool_name)) {
    return;
  }

  const toolInput = data.tool_input;
  let filePath: string;
  let content: string;

  // Extract file path and content from different tool inputs
  if ('file_path' in toolInput) {
    filePath = toolInput.file_path;

    if (data.tool_name === 'Write' && 'content' in toolInput) {
      content = toolInput.content;
    } else if (data.tool_name === 'Edit' && 'new_string' in toolInput) {
      // For Edit, we can only check the new_string part
      content = toolInput.new_string;
    } else if (data.tool_name === 'MultiEdit' && 'edits' in toolInput) {
      // For MultiEdit, combine all new_string parts
      content = toolInput.edits.map((edit) => edit.new_string).join('\n');
    } else {
      return; // Can't extract content
    }
  } else {
    return; // No file_path
  }

  // Only check test files
  if (!isTestFile(filePath)) {
    return;
  }

  // TODO: Load user configuration - for now use balanced defaults
  const config = DEFAULT_CONFIGS.balanced;

  // Validate mock boundaries
  const result = validateMockBoundaries({
    filePath,
    content,
    config,
  });

  if (result.blocked) {
    console.error(`\n${result.message}\n`);
    process.exit(2); // Exit with error code to block the operation
  }
}

/**
 * Check if a file path indicates a test file
 */
function isTestFile(filePath: string): boolean {
  return /\.(?:test|spec)\.(?:ts|tsx|js|jsx)$/.test(filePath);
}

// Main execution when run as CLI
if (require.main === module) {
  const argData = process.argv[2];
  if (!argData) {
    throw new Error('Missing required argument data');
  }
  const data = JSON.parse(argData) as PreToolUseHookData;
  try {
    mockBoundaryHook(data);
  } catch (error) {
    console.error('Mock boundary hook error:', error);
    process.exit(1);
  }
}
