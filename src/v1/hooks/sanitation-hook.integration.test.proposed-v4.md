```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Test Format v4: Function-based organization with concise notation
 * 
 * Structure:
 * - Tests organized by actual functions in sanitation-hook.ts
 * - Concise test names using symbols and arrow notation
 * - No verbose "should" sentences
 * - Focused on behavior, not implementation details
 * 
 * Symbols:
 * ✓ = passes/allows
 * ✗ = blocks/rejects
 * → = results in
 * ⚡ = triggers
 * 
 * Benefits:
 * - 50-70% reduction in description verbosity
 * - Clear function-to-test mapping
 * - Easy to find tests when function changes
 * - Scales well with large test suites
 */

describe('sanitation-hook integration', () => {
  const testProjectPath = path.join(__dirname, 'test-project');
  const hookPath = path.join(__dirname, 'sanitation-hook.ts');

  beforeEach(() => {
    // Setup test project
    fs.mkdirSync(testProjectPath, { recursive: true });
    fs.writeFileSync(
      path.join(testProjectPath, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0' })
    );
  });

  afterEach(() => {
    // Cleanup
    fs.rmSync(testProjectPath, { recursive: true, force: true });
  });

  describe('main()', () => {
    describe('initialization', () => {
      it('✓ valid hook data', () => {
        // Test implementation
      });

      it('✗ missing tool data', () => {
        // Test implementation
      });

      it('✗ invalid JSON', () => {
        // Test implementation
      });
    });

    describe('tool routing', () => {
      it('→ pre-tool handler for Write', () => {
        // Test implementation
      });

      it('→ post-tool handler for Bash', () => {
        // Test implementation
      });

      it('✓ unknown tool (no-op)', () => {
        // Test implementation
      });
    });
  });

  describe('handlePreToolUse()', () => {
    describe('Write tool', () => {
      it('✓ clean TypeScript', () => {
        // Test implementation
      });

      it('✗ any type', () => {
        // Test implementation
      });

      it('✗ @ts-ignore', () => {
        // Test implementation
      });

      it('✓ any in comments', () => {
        // Test implementation
      });

      it('✓ any in strings', () => {
        // Test implementation
      });
    });

    describe('MultiEdit tool', () => {
      it('✓ all edits clean', () => {
        // Test implementation
      });

      it('✗ any edit with violation', () => {
        // Test implementation
      });

      it('⚡ aggregated errors', () => {
        // Test implementation
      });
    });

    describe('Edit tool', () => {
      it('✓ clean edit', () => {
        // Test implementation
      });

      it('✗ violation in new_string', () => {
        // Test implementation
      });
    });
  });

  describe('handlePostToolUse()', () => {
    describe('Bash commands', () => {
      it('✓ safe commands', () => {
        // Test implementation
      });

      it('✗ rm -rf /', () => {
        // Test implementation
      });

      it('✗ chmod 777', () => {
        // Test implementation
      });

      it('✓ npm install', () => {
        // Test implementation
      });
    });

    describe('command parsing', () => {
      it('→ extracts base command', () => {
        // Test implementation
      });

      it('→ handles pipes', () => {
        // Test implementation
      });

      it('→ handles redirects', () => {
        // Test implementation
      });
    });
  });

  describe('checkContent()', () => {
    describe('pattern matching', () => {
      it('✓ no violations', () => {
        // Test implementation
      });

      it('→ all matching patterns', () => {
        // Test implementation
      });

      it('→ line numbers in errors', () => {
        // Test implementation
      });
    });

    describe('comment handling', () => {
      it('✓ patterns in comments when non-comment-based', () => {
        // Test implementation
      });

      it('✗ TODO in comments when comment-based', () => {
        // Test implementation
      });
    });
  });

  describe('stripCommentsAndStringLiterals()', () => {
    it('→ removes single-line comments', () => {
      // Test implementation
    });

    it('→ removes multi-line comments', () => {
      // Test implementation
    });

    it('→ removes string literals', () => {
      // Test implementation
    });

    it('→ preserves code structure', () => {
      // Test implementation
    });
  });

  describe('aggregateViolations()', () => {
    it('→ combined error message', () => {
      // Test implementation
    });

    it('→ groups by violation type', () => {
      // Test implementation
    });

    it('→ includes all file paths', () => {
      // Test implementation
    });
  });

  describe('error responses', () => {
    it('⚡ blocks tool execution', () => {
      // Test implementation
    });

    it('→ preserves original request', () => {
      // Test implementation
    });

    it('→ includes helpful context', () => {
      // Test implementation
    });
  });

  describe('edge cases', () => {
    it('✓ empty content', () => {
      // Test implementation
    });

    it('✓ binary files', () => {
      // Test implementation
    });

    it('✓ very large files', () => {
      // Test implementation
    });

    it('→ handles Unicode correctly', () => {
      // Test implementation
    });
  });
});
```