import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleRequireContractValidationBroker } from './rule-require-contract-validation-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('require-contract-validation', ruleRequireContractValidationBroker(), {
  valid: [
    // ✅ require() with filePathContract.parse()
    {
      code: `
        import { filePathContract } from '@dungeonmaster/shared/contracts';
        const config = require(filePathContract.parse(configPath));
      `,
      filename: '/test/file.ts',
    },

    // ✅ require() with absoluteFilePathContract.parse()
    {
      code: `
        import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
        const config = require(absoluteFilePathContract.parse(absolutePath));
      `,
      filename: '/test/file.ts',
    },

    // ✅ require() with relativeFilePathContract.parse()
    {
      code: `
        import { relativeFilePathContract } from '@dungeonmaster/shared/contracts';
        const config = require(relativeFilePathContract.parse(relativePath));
      `,
      filename: '/test/file.ts',
    },

    // ✅ import() with filePathContract.parse()
    {
      code: `
        import { filePathContract } from '@dungeonmaster/shared/contracts';
        const module = await import(filePathContract.parse(modulePath));
      `,
      filename: '/test/file.ts',
    },

    // ✅ String literal relative path (./)
    {
      code: `const config = require('./config.json');`,
      filename: '/test/file.ts',
    },

    // ✅ String literal relative path (../)
    {
      code: `const config = require('../utils/helper');`,
      filename: '/test/file.ts',
    },

    // ✅ String literal absolute path (/)
    {
      code: `const config = require('/absolute/path/config');`,
      filename: '/test/file.ts',
    },

    // ✅ import() with string literal relative path
    {
      code: `const module = await import('./dynamic-module');`,
      filename: '/test/file.ts',
    },

    // ✅ import() with string literal parent path
    {
      code: `const module = await import('../parent/module');`,
      filename: '/test/file.ts',
    },
  ],

  invalid: [
    // ❌ require() without contract.parse()
    {
      code: `const config = require(configPath);`,
      errors: [{ messageId: 'requireNeedsContract' }],
      filename: '/test/file.ts',
    },

    // ❌ require() with npm module name (string literal)
    {
      code: `const lodash = require('lodash');`,
      errors: [{ messageId: 'stringLiteralAllowed' }],
      filename: '/test/file.ts',
    },

    // ❌ require() with scoped npm module
    {
      code: `const react = require('@react/core');`,
      errors: [{ messageId: 'stringLiteralAllowed' }],
      filename: '/test/file.ts',
    },

    // ❌ import() without contract.parse()
    {
      code: `const module = await import(modulePath);`,
      errors: [{ messageId: 'importNeedsContract' }],
      filename: '/test/file.ts',
    },

    // ❌ import() with npm module name
    {
      code: `const react = await import('react');`,
      errors: [{ messageId: 'stringLiteralAllowed' }],
      filename: '/test/file.ts',
    },

    // ❌ import() with scoped module
    {
      code: `const router = await import('@react-router/dom');`,
      errors: [{ messageId: 'stringLiteralAllowed' }],
      filename: '/test/file.ts',
    },

    // ❌ require() with safeParse (must use parse)
    {
      code: `
        import { filePathContract } from '@dungeonmaster/shared/contracts';
        const config = require(filePathContract.safeParse(configPath));
      `,
      errors: [{ messageId: 'requireNeedsContract' }],
      filename: '/test/file.ts',
    },

    // ❌ require() with non-contract object
    {
      code: `
        const helper = { parse: (x) => x };
        const config = require(helper.parse(configPath));
      `,
      errors: [{ messageId: 'requireNeedsContract' }],
      filename: '/test/file.ts',
    },

    // ❌ require() with disallowed contract
    {
      code: `
        const customContract = { parse: (x) => x };
        const config = require(customContract.parse(configPath));
      `,
      errors: [{ messageId: 'requireNeedsContract' }],
      filename: '/test/file.ts',
    },

    // ❌ require() with no arguments
    {
      code: `const config = require();`,
      errors: [{ messageId: 'requireNeedsContract' }],
      filename: '/test/file.ts',
    },

    // ❌ require() with variable (not wrapped in contract.parse())
    {
      code: `
        const path = './config.json';
        const config = require(path);
      `,
      errors: [{ messageId: 'requireNeedsContract' }],
      filename: '/test/file.ts',
    },

    // ❌ import() with variable (not wrapped in contract.parse())
    {
      code: `
        const modulePath = './module';
        const module = await import(modulePath);
      `,
      errors: [{ messageId: 'importNeedsContract' }],
      filename: '/test/file.ts',
    },
  ],
});
