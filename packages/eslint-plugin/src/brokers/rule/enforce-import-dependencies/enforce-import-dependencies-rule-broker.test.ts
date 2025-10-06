import { createEslintRuleTester } from '../../../../test/helpers/eslint-rule-tester';
import { enforceImportDependenciesRuleBroker } from './enforce-import-dependencies-rule-broker';

const ruleTester = createEslintRuleTester();

ruleTester.run('enforce-import-dependencies', enforceImportDependenciesRuleBroker(), {
  valid: [
    // Guards can import from contracts, statics, errors
    {
      code: 'import { userContract } from "../../contracts/user/user-contract";',
      filename: '/project/src/guards/user/user-guard.ts',
    },
    {
      code: 'import { apiStatics } from "../../statics/api/api-statics";',
      filename: '/project/src/guards/auth/auth-guard.ts',
    },
    {
      code: 'import { ValidationError } from "../../errors/validation/validation-error";',
      filename: '/project/src/guards/input/input-guard.ts',
    },

    // Brokers can import from brokers, adapters, contracts, statics, errors
    {
      code: 'import { userBroker } from "../../brokers/user/user-broker";',
      filename: '/project/src/brokers/auth/auth-broker.ts',
    },
    {
      code: 'import { httpAdapter } from "../../adapters/http/http-adapter";',
      filename: '/project/src/brokers/api/api-broker.ts',
    },
    {
      code: 'import { userContract } from "../../contracts/user/user-contract";',
      filename: '/project/src/brokers/user/fetch/fetch-user-broker.ts',
    },
    {
      code: 'import { configStatics } from "../../statics/config/config-statics";',
      filename: '/project/src/brokers/app/app-broker.ts',
    },
    {
      code: 'import { NetworkError } from "../../errors/network/network-error";',
      filename: '/project/src/brokers/api/api-broker.ts',
    },

    // Adapters can import external packages (node_modules)
    {
      code: 'import express from "express";',
      filename: '/project/src/adapters/express/express-adapter.ts',
    },
    {
      code: 'import { z } from "zod";',
      filename: '/project/src/adapters/zod/zod-adapter.ts',
    },
    {
      code: 'import axios from "axios";',
      filename: '/project/src/adapters/http/http-client.ts',
    },
    {
      code: 'import { configStatics } from "../../statics/config/config-statics";',
      filename: '/project/src/adapters/config/config-adapter.ts',
    },

    // Transformers can import from contracts, statics, errors
    {
      code: 'import { userContract } from "../../contracts/user/user-contract";',
      filename: '/project/src/transformers/user/user-transformer.ts',
    },
    {
      code: 'import { dateStatics } from "../../statics/date/date-statics";',
      filename: '/project/src/transformers/date/date-transformer.ts',
    },
    {
      code: 'import { TransformError } from "../../errors/transform/transform-error";',
      filename: '/project/src/transformers/data/data-transformer.ts',
    },

    // Contracts can import from statics, errors, node_modules
    {
      code: 'import { z } from "zod";',
      filename: '/project/src/contracts/user/user-contract.ts',
    },
    {
      code: 'import { typeStatics } from "../../statics/type/type-statics";',
      filename: '/project/src/contracts/api/api-contract.ts',
    },
    {
      code: 'import { ValidationError } from "../../errors/validation/validation-error";',
      filename: '/project/src/contracts/input/input-contract.ts',
    },

    // Startup can import anything (*)
    {
      code: 'import { appBroker } from "../brokers/app/app-broker";',
      filename: '/project/src/startup/index.ts',
    },
    {
      code: 'import express from "express";',
      filename: '/project/src/startup/server.ts',
    },
    {
      code: 'import { userWidget } from "../widgets/user/user-widget";',
      filename: '/project/src/startup/app.ts',
    },

    // Files not in src/ folder should be ignored
    {
      code: 'import anything from "anywhere";',
      filename: '/project/test/helpers/test-helper.ts',
    },
    {
      code: 'import { something } from "../../../node_modules/package";',
      filename: '/project/scripts/build.ts',
    },
  ],
  invalid: [
    // Guards cannot import from brokers
    {
      code: 'import { userBroker } from "../../brokers/user/user-broker";',
      filename: '/project/src/guards/user/user-guard.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'guards',
            importedFolder: 'brokers',
            allowed: 'contracts/, statics/, errors/',
          },
        },
      ],
    },

    // Guards cannot import from transformers
    {
      code: 'import { userTransformer } from "../../transformers/user/user-transformer";',
      filename: '/project/src/guards/user/user-guard.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'guards',
            importedFolder: 'transformers',
            allowed: 'contracts/, statics/, errors/',
          },
        },
      ],
    },

    // Guards cannot import external packages
    {
      code: 'import axios from "axios";',
      filename: '/project/src/guards/api/api-guard.ts',
      errors: [
        {
          messageId: 'forbiddenExternalImport',
          data: {
            folderType: 'guards',
            packageName: 'axios',
          },
        },
      ],
    },
    {
      code: 'import { z } from "zod";',
      filename: '/project/src/guards/validation/validation-guard.ts',
      errors: [
        {
          messageId: 'forbiddenExternalImport',
          data: {
            folderType: 'guards',
            packageName: 'zod',
          },
        },
      ],
    },

    // Contracts cannot import from brokers
    {
      code: 'import { userBroker } from "../../brokers/user/user-broker";',
      filename: '/project/src/contracts/user/user-contract.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'contracts',
            importedFolder: 'brokers',
            allowed: 'statics/, errors/, node_modules',
          },
        },
      ],
    },

    // Contracts cannot import from guards
    {
      code: 'import { userGuard } from "../../guards/user/user-guard";',
      filename: '/project/src/contracts/user/user-contract.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'contracts',
            importedFolder: 'guards',
            allowed: 'statics/, errors/, node_modules',
          },
        },
      ],
    },

    // Transformers cannot import from brokers
    {
      code: 'import { apiBroker } from "../../brokers/api/api-broker";',
      filename: '/project/src/transformers/data/data-transformer.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'transformers',
            importedFolder: 'brokers',
            allowed: 'contracts/, statics/, errors/',
          },
        },
      ],
    },

    // Transformers cannot import external packages
    {
      code: 'import lodash from "lodash";',
      filename: '/project/src/transformers/array/array-transformer.ts',
      errors: [
        {
          messageId: 'forbiddenExternalImport',
          data: {
            folderType: 'transformers',
            packageName: 'lodash',
          },
        },
      ],
    },

    // Statics cannot import anything
    {
      code: 'import { userContract } from "../../contracts/user/user-contract";',
      filename: '/project/src/statics/user/user-statics.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'statics',
            importedFolder: 'contracts',
            allowed: '',
          },
        },
      ],
    },
    {
      code: 'import axios from "axios";',
      filename: '/project/src/statics/config/config-statics.ts',
      errors: [
        {
          messageId: 'forbiddenExternalImport',
          data: {
            folderType: 'statics',
            packageName: 'axios',
          },
        },
      ],
    },

    // Errors cannot import anything
    {
      code: 'import { errorStatics } from "../../statics/error/error-statics";',
      filename: '/project/src/errors/validation/validation-error.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'errors',
            importedFolder: 'statics',
            allowed: '',
          },
        },
      ],
    },
    {
      code: 'import { z } from "zod";',
      filename: '/project/src/errors/custom/custom-error.ts',
      errors: [
        {
          messageId: 'forbiddenExternalImport',
          data: {
            folderType: 'errors',
            packageName: 'zod',
          },
        },
      ],
    },

    // Brokers cannot import from widgets
    {
      code: 'import { userWidget } from "../../widgets/user/user-widget";',
      filename: '/project/src/brokers/user/user-broker.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'brokers',
            importedFolder: 'widgets',
            allowed: 'brokers/, adapters/, contracts/, statics/, errors/',
          },
        },
      ],
    },

    // Brokers cannot import from responders
    {
      code: 'import { userResponder } from "../../responders/user/user-responder";',
      filename: '/project/src/brokers/api/api-broker.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'brokers',
            importedFolder: 'responders',
            allowed: 'brokers/, adapters/, contracts/, statics/, errors/',
          },
        },
      ],
    },
  ],
});
