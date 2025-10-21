import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleBanContractInTestsBroker } from './rule-ban-contract-in-tests-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-contract-in-tests', ruleBanContractInTestsBroker(), {
  valid: [
    // Stub imports are allowed in test files
    {
      code: 'import { UserStub } from "../../contracts/user/user.stub";',
      filename: '/project/src/adapters/api/api-adapter.test.ts',
    },
    {
      code: 'import { EmailAddressStub } from "../../contracts/email-address/email-address.stub";',
      filename: '/project/src/brokers/user/create/user-create-broker.test.ts',
    },
    {
      code: 'import { ConfigStub } from "../../../contracts/config/config.stub";',
      filename: '/project/src/transformers/config/parse/config-parse-transformer.test.ts',
    },

    // Stub imports from @questmaestro/shared are allowed
    {
      code: 'import { UserStub } from "@questmaestro/shared/stubs";',
      filename: '/project/src/adapters/api/api-adapter.test.ts',
    },
    {
      code: 'import { FilePathStub } from "@questmaestro/shared/contracts";',
      filename: '/project/src/brokers/config/load/config-load-broker.test.ts',
    },
    {
      code: 'import { AbsoluteFilePathStub, RelativeFilePathStub } from "@questmaestro/shared/contracts";',
      filename: '/project/src/adapters/path/path-adapter.test.ts',
    },
    {
      code: 'import type { User } from "../../contracts/user/user.stub";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
    },

    // Contract imports are allowed in non-test files
    {
      code: 'import { userContract } from "../../contracts/user/user-contract";',
      filename: '/project/src/adapters/api/api-adapter.ts',
    },
    {
      code: 'import { emailAddressContract } from "../../contracts/email-address/email-address-contract";',
      filename: '/project/src/brokers/user/create/user-create-broker.ts',
    },
    {
      code: 'import { configContract } from "../../../contracts/config/config-contract";',
      filename: '/project/src/transformers/config/parse/config-parse-transformer.ts',
    },

    // Non-contract imports are allowed in test files
    {
      code: 'import { userFetchBroker } from "../fetch/user-fetch-broker";',
      filename: '/project/src/brokers/user/create/user-create-broker.test.ts',
    },
    {
      code: 'import { apiAdapter } from "../../adapters/api/api-adapter";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
    },
    {
      code: 'import { formatDateTransformer } from "../format-date/format-date-transformer";',
      filename: '/project/src/transformers/user/user-transformer.test.ts',
    },

    // E2E test files can import contracts (not .test.ts files)
    {
      code: 'import { userContract } from "../../contracts/user/user-contract";',
      filename: '/project/test/e2e/user-flow.e2e.ts',
    },

    // Imports from folders containing "contract" in the name are allowed (not contract files)
    {
      code: 'import { isAstContractParseCallGuard } from "../../guards/is-ast-contract-parse-call/is-ast-contract-parse-call-guard";',
      filename: '/project/src/brokers/validate/validate-broker.test.ts',
    },
    {
      code: 'import { TsestreeStub } from "../../contracts/tsestree/tsestree.stub";',
      filename:
        '/project/src/guards/is-ast-contract-parse-call/is-ast-contract-parse-call-guard.test.ts',
    },
    {
      code: 'import { parseContractTransformer } from "../../transformers/parse-contract/parse-contract-transformer";',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
  ],
  invalid: [
    // Type-only imports are NOT allowed - use stubs for types
    {
      code: 'import type { User } from "../../contracts/user/user-contract";',
      filename: '/project/src/adapters/api/api-adapter.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/user/user.stub',
          },
        },
      ],
    },
    {
      code: 'import type { EmailAddress } from "../../contracts/email-address/email-address-contract";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/email-address/email-address.stub',
          },
        },
      ],
    },
    {
      code: 'import type { Config } from "../../../contracts/config/config-contract";',
      filename: '/project/src/transformers/config/parse/config-parse-transformer.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../../contracts/config/config.stub',
          },
        },
      ],
    },

    // Inline type-only imports are NOT allowed
    {
      code: 'import { type User, type UserRole } from "../../contracts/user/user-contract";',
      filename: '/project/src/guards/auth/auth-guard.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/user/user.stub',
          },
        },
      ],
    },

    // Contract imports from @questmaestro/shared/contracts are NOT allowed
    {
      code: 'import { filePathContract } from "@questmaestro/shared/contracts/file-path/file-path-contract";',
      filename: '/project/src/config/loader/config-loader.test.ts',
      errors: [
        {
          messageId: 'useStubFromShared',
        },
      ],
    },
    {
      code: 'import type { FilePath } from "@questmaestro/shared/contracts/file-path/file-path-contract";',
      filename: '/project/src/adapters/fs/fs-adapter.test.ts',
      errors: [
        {
          messageId: 'useStubFromShared',
        },
      ],
    },

    // Contract implementation imports in test files - basic case
    {
      code: 'import { userContract } from "../../contracts/user/user-contract";',
      filename: '/project/src/adapters/api/api-adapter.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/user/user.stub',
          },
        },
      ],
    },
    {
      code: 'import { emailAddressContract } from "../../contracts/email-address/email-address-contract";',
      filename: '/project/src/brokers/user/create/user-create-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/email-address/email-address.stub',
          },
        },
      ],
    },
    {
      code: 'import { configContract } from "../../../contracts/config/config-contract";',
      filename: '/project/src/transformers/config/parse/config-parse-transformer.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../../contracts/config/config.stub',
          },
        },
      ],
    },

    // Contract imports without .ts extension
    {
      code: 'import { userContract } from "../../contracts/user/user-contract.ts";',
      filename: '/project/src/guards/user/user-guard.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/user/user.stub',
          },
        },
      ],
    },

    // Multiple contract imports in one statement
    {
      code: 'import { userContract, emailAddressContract } from "../../contracts/user/user-contract";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/user/user.stub',
          },
        },
      ],
    },

    // Mixed type and value imports are NOT allowed
    {
      code: 'import { userContract, type User } from "../../contracts/user/user-contract";',
      filename: '/project/src/adapters/http/http-adapter.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/user/user.stub',
          },
        },
      ],
    },

    // Default import of contract
    {
      code: 'import userContract from "../../contracts/user/user-contract";',
      filename: '/project/src/state/user-cache/user-cache-state.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/user/user.stub',
          },
        },
      ],
    },

    // Namespace import of contract
    {
      code: 'import * as UserContract from "../../contracts/user/user-contract";',
      filename: '/project/src/widgets/user-card/user-card-widget.test.tsx',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/user/user.stub',
          },
        },
      ],
    },

    // Contract imports in spec.ts files (also test files)
    {
      code: 'import { apiContract } from "../../contracts/api/api-contract";',
      filename: '/project/src/brokers/api/fetch/api-fetch-broker.spec.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/api/api.stub',
          },
        },
      ],
    },

    // Deeply nested test file
    {
      code: 'import { paymentContract } from "../../../../../contracts/payment/payment-contract";',
      filename:
        '/project/src/brokers/payment/process/stripe/validate/payment-validate-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../../../../contracts/payment/payment.stub',
          },
        },
      ],
    },

    // Multiple imports from different contract files - each should error separately
    {
      code: `import { userContract } from "../../contracts/user/user-contract";
import { emailAddressContract } from "../../contracts/email-address/email-address-contract";
import { paymentContract } from "../../contracts/payment/payment-contract";`,
      filename: '/project/src/brokers/payment/process/payment-process-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/user/user.stub',
          },
        },
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/email-address/email-address.stub',
          },
        },
        {
          messageId: 'useStubInTest',
          data: {
            stubPath: '../../contracts/payment/payment.stub',
          },
        },
      ],
    },
  ],
});
