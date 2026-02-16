import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceImportDependenciesBroker } from './rule-enforce-import-dependencies-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-import-dependencies', ruleEnforceImportDependenciesBroker(), {
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
      code: 'import { userBroker } from "../../user/fetch/user-fetch-broker";',
      filename: '/project/src/brokers/auth/login/auth-login-broker.ts',
    },
    {
      code: 'import { httpGetAdapter } from "../../../adapters/http/get/http-get-adapter";',
      filename: '/project/src/brokers/api/fetch/api-fetch-broker.ts',
    },
    {
      code: 'import { userContract } from "../../../contracts/user/user-contract";',
      filename: '/project/src/brokers/user/fetch/fetch-user-broker.ts',
    },
    {
      code: 'import { configStatics } from "../../../statics/config/config-statics";',
      filename: '/project/src/brokers/app/start/app-start-broker.ts',
    },
    {
      code: 'import { NetworkError } from "../../../errors/network/network-error";',
      filename: '/project/src/brokers/api/fetch/api-fetch-broker.ts',
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
    {
      code: 'import { userContract } from "../../contracts/user/user-contract";',
      filename: '/project/src/adapters/api/api-adapter.ts',
    },
    // Adapters can import scoped npm packages
    {
      code: 'import { ESLint } from "@typescript-eslint/utils";',
      filename: '/project/src/adapters/typescript-eslint/typescript-eslint-adapter.ts',
    },
    {
      code: 'import { parseAsync } from "@babel/parser";',
      filename: '/project/src/adapters/babel/babel-parser-adapter.ts',
    },
    {
      code: 'import type { Rule } from "@typescript-eslint/utils/ts-eslint";',
      filename: '/project/src/adapters/typescript-eslint/typescript-eslint-rule-adapter.ts',
    },

    // @dungeonmaster/shared imports follow folder dependency rules
    // Adapters can import from @dungeonmaster/shared/contracts
    {
      code: 'import { filePathContract } from "@dungeonmaster/shared/contracts";',
      filename: '/project/src/adapters/path/path-adapter.ts',
    },
    // Brokers can import from @dungeonmaster/shared/contracts
    {
      code: 'import { filePathContract } from "@dungeonmaster/shared/contracts";',
      filename: '/project/src/brokers/config/load/config-load-broker.ts',
    },
    // Guards can import from @dungeonmaster/shared/contracts
    {
      code: 'import { filePathContract } from "@dungeonmaster/shared/contracts";',
      filename: '/project/src/guards/file/file-guard.ts',
    },
    // Contracts can import from @dungeonmaster/shared/contracts
    {
      code: 'import { filePathContract } from "@dungeonmaster/shared/contracts";',
      filename: '/project/src/contracts/path/path-contract.ts',
    },

    // Test files can import .stub.ts files from contracts (local imports)
    {
      code: 'import { UserStub } from "../../../contracts/user/user.stub";',
      filename: '/project/src/brokers/auth/login/auth-login-broker.test.ts',
    },
    {
      code: 'import { FilePathStub } from "../../contracts/file-path/file-path.stub";',
      filename: '/project/src/adapters/path/path-adapter.test.ts',
    },
    {
      code: 'import { ConfigStub } from "../../contracts/config/config.stub";',
      filename: '/project/src/guards/validation/validation-guard.spec.ts',
    },

    // Test files can import .stub.ts files from @dungeonmaster/shared/contracts
    {
      code: 'import { FilePathStub } from "@dungeonmaster/shared/contracts";',
      filename: '/project/src/brokers/config/load/config-load-broker.test.ts',
    },
    {
      code: 'import { AbsoluteFilePathStub } from "@dungeonmaster/shared/contracts";',
      filename: '/project/src/adapters/path/path-dirname.test.ts',
    },

    // Stub files can import other stubs from @dungeonmaster/shared/contracts
    {
      code: 'import { FilePathStub } from "@dungeonmaster/shared/contracts";',
      filename: '/project/src/contracts/user/user.stub.ts',
    },
    {
      code: 'import { AbsoluteFilePathStub } from "@dungeonmaster/shared/contracts";',
      filename: '/project/src/contracts/config/config.stub.ts',
    },

    // Files in the same domain folder can import each other
    {
      code: 'import { fsExistsSyncAdapter } from "./fs-exists-sync-adapter";',
      filename: '/project/src/adapters/fs/fs-exists-sync-adapter.test.ts',
    },
    {
      code: 'import { userContract } from "./user-contract";',
      filename: '/project/src/contracts/user/user.stub.ts',
    },
    {
      code: 'import { helperFunction } from "./helper";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },

    // Same-folder layer file imports are allowed (brokers)
    {
      code: 'import { validateFolderDepthLayerBroker } from "./validate-folder-depth-layer-broker";',
      filename:
        '/project/src/brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker.ts',
    },
    {
      code: 'import { validateFolderLocationLayerBroker } from "./validate-folder-location-layer-broker";',
      filename:
        '/project/src/brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker.ts',
    },
    {
      code: 'import { formatResponseLayerBroker } from "./format-response-layer-broker";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    // Layer files can import other layer files in same folder
    {
      code: 'import { validateFilenamePatternLayerBroker } from "./validate-filename-pattern-layer-broker";',
      filename:
        '/project/src/brokers/rule/enforce-project-structure/validate-folder-depth-layer-broker.ts',
    },
    {
      code: 'import { helperLayerBroker } from "./helper-layer-broker";',
      filename: '/project/src/brokers/user/fetch/format-response-layer-broker.ts',
    },

    // Same-folder layer file imports are allowed (widgets)
    {
      code: 'import { AvatarLayerWidget } from "./avatar-layer-widget";',
      filename: '/project/src/widgets/user-card/user-card-widget.tsx',
    },
    {
      code: 'import { UserMetaLayerWidget } from "./user-meta-layer-widget";',
      filename: '/project/src/widgets/user-card/user-card-widget.tsx',
    },

    // Same-folder layer file imports are allowed (responders)
    {
      code: 'import { validateRequestLayerResponder } from "./validate-request-layer-responder";',
      filename: '/project/src/responders/user/create/user-create-responder.ts',
    },
    {
      code: 'import { processUserCreationLayerResponder } from "./process-user-creation-layer-responder";',
      filename: '/project/src/responders/user/create/user-create-responder.ts',
    },

    // Stub files can import other stubs from different contract folders
    {
      code: 'import { UserIdStub } from "../user-id/user-id.stub";',
      filename: '/project/src/contracts/user/user.stub.ts',
    },

    // Brokers (depth 2) can import from other broker actions (same domain, different action)
    {
      code: 'import { userCreateBroker } from "../create/user-create-broker";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: 'import { userOther } from "./user-other";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: 'import { userFetchBroker } from "../fetch/user-fetch-broker";',
      filename: '/project/src/brokers/user/update/user-update-broker.ts',
    },
    // Brokers can import from different broker domain (cross-domain, same layer)
    {
      code: 'import { emailSendBroker } from "../../email/send/email-send-broker";',
      filename: '/project/src/brokers/user/create/user-create-broker.ts',
    },
    {
      code: 'import { authVerifyBroker } from "../../auth/verify/auth-verify-broker";',
      filename: '/project/src/brokers/payment/process/payment-process-broker.ts',
    },
    // Brokers (depth 2) importing from depth-2 adapters - requires 4 levels up
    {
      code: 'import { postgresQueryAdapter } from "../../../../adapters/postgres/query/postgres-query-adapter";',
      filename: '/project/src/brokers/database/query/database-query-broker.ts',
    },
    {
      code: 'import { redisSetAdapter } from "../../../../adapters/redis/set/redis-set-adapter";',
      filename: '/project/src/brokers/cache/set/cache-set-broker.ts',
    },
    // Brokers (depth 2) importing from depth-1 contracts - requires 3 levels up
    {
      code: 'import { paymentContract } from "../../../contracts/payment/payment-contract";',
      filename: '/project/src/brokers/payment/validate/payment-validate-broker.ts',
    },
    // Brokers (depth 2) importing from depth-1 statics - requires 3 levels up
    {
      code: 'import { apiUrlStatics } from "../../../statics/api-url/api-url-statics";',
      filename: '/project/src/brokers/http/request/http-request-broker.ts',
    },
    // Brokers (depth 2) importing from depth-1 errors - requires 3 levels up
    {
      code: 'import { DatabaseError } from "../../../errors/database/database-error";',
      filename: '/project/src/brokers/user/delete/user-delete-broker.ts',
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

    // Contracts can import from statics, errors, and zod (specific package)
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
    {
      code: 'import type { ZodError } from "zod";',
      filename: '/project/src/contracts/validation/validation-contract.ts',
    },
    {
      code: 'import type { StubArgument } from "@dungeonmaster/shared/@types";',
      filename: '/project/src/contracts/user/user.stub.ts',
    },

    // Startup can import anything (*)
    {
      code: 'import { appStartBroker } from "../brokers/app/start/app-start-broker";',
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

    // Responders (depth 2) can import from widgets, brokers, bindings, state, contracts, transformers, guards, statics, errors
    {
      code: 'import { UserCardWidget } from "../../../widgets/user-card/user-card-widget";',
      filename: '/project/src/responders/user/profile/user-profile-responder.ts',
    },
    {
      code: 'import { userFetchBroker } from "../../../brokers/user/fetch/user-fetch-broker";',
      filename: '/project/src/responders/user/profile/user-profile-responder.ts',
    },
    {
      code: 'import { useUserDataBinding } from "../../../bindings/use-user-data/use-user-data-binding";',
      filename: '/project/src/responders/user/profile/user-profile-responder.ts',
    },
    {
      code: 'import { userCacheState } from "../../../state/user-cache/user-cache-state";',
      filename: '/project/src/responders/user/profile/user-profile-responder.ts',
    },
    {
      code: 'import { userContract } from "../../../contracts/user/user-contract";',
      filename: '/project/src/responders/user/create/user-create-responder.ts',
    },
    {
      code: 'import { userToDtoTransformer } from "../../../transformers/user-to-dto/user-to-dto-transformer";',
      filename: '/project/src/responders/user/get/user-get-responder.ts',
    },
    {
      code: 'import { hasPermissionGuard } from "../../../guards/has-permission/has-permission-guard";',
      filename: '/project/src/responders/admin/delete/admin-delete-responder.ts',
    },
    {
      code: 'import { apiStatics } from "../../../statics/api/api-statics";',
      filename: '/project/src/responders/health/check/health-check-responder.ts',
    },
    {
      code: 'import { ValidationError } from "../../../errors/validation/validation-error";',
      filename: '/project/src/responders/user/create/user-create-responder.ts',
    },

    // Widgets (depth 1) can import from bindings, brokers, state, contracts, transformers, guards, statics, errors
    {
      code: 'import { useUserDataBinding } from "../../bindings/use-user-data/use-user-data-binding";',
      filename: '/project/src/widgets/user-card/user-card-widget.tsx',
    },
    {
      code: 'import { userUpdateBroker } from "../../brokers/user/update/user-update-broker";',
      filename: '/project/src/widgets/user-form/user-form-widget.tsx',
    },
    {
      code: 'import { appConfigState } from "../../state/app-config/app-config-state";',
      filename: '/project/src/widgets/settings/settings-widget.tsx',
    },
    {
      code: 'import { userContract } from "../../contracts/user/user-contract";',
      filename: '/project/src/widgets/user-card/user-card-widget.tsx',
    },
    {
      code: 'import { formatDateTransformer } from "../../transformers/format-date/format-date-transformer";',
      filename: '/project/src/widgets/date-display/date-display-widget.tsx',
    },
    {
      code: 'import { isAdminGuard } from "../../guards/is-admin/is-admin-guard";',
      filename: '/project/src/widgets/admin-panel/admin-panel-widget.tsx',
    },
    {
      code: 'import { themeStatics } from "../../statics/theme/theme-statics";',
      filename: '/project/src/widgets/layout/layout-widget.tsx',
    },
    {
      code: 'import { ValidationError } from "../../errors/validation/validation-error";',
      filename: '/project/src/widgets/error-boundary/error-boundary-widget.tsx',
    },

    // Bindings (depth 1) can import from brokers, state, contracts, statics, errors
    {
      code: 'import { userFetchBroker } from "../../brokers/user/fetch/user-fetch-broker";',
      filename: '/project/src/bindings/use-user-data/use-user-data-binding.ts',
    },
    {
      code: 'import { userCacheState } from "../../state/user-cache/user-cache-state";',
      filename: '/project/src/bindings/use-cached-user/use-cached-user-binding.ts',
    },
    {
      code: 'import { userContract } from "../../contracts/user/user-contract";',
      filename: '/project/src/bindings/use-user-data/use-user-data-binding.ts',
    },
    {
      code: 'import { apiStatics } from "../../statics/api/api-statics";',
      filename: '/project/src/bindings/use-api-config/use-api-config-binding.ts',
    },
    {
      code: 'import { NetworkError } from "../../errors/network/network-error";',
      filename: '/project/src/bindings/use-fetch-data/use-fetch-data-binding.ts',
    },

    // State (depth 1) can import from contracts, statics, errors
    {
      code: 'import { userContract } from "../../contracts/user/user-contract";',
      filename: '/project/src/state/user-cache/user-cache-state.ts',
    },
    {
      code: 'import { configStatics } from "../../statics/config/config-statics";',
      filename: '/project/src/state/app-config/app-config-state.ts',
    },
    {
      code: 'import { StateError } from "../../errors/state/state-error";',
      filename: '/project/src/state/store/store-state.ts',
    },

    // Middleware (depth 1) can import from adapters (depth 2), middleware, statics
    {
      code: 'import { winstonLogAdapter } from "../../../adapters/winston/log/winston-log-adapter";',
      filename: '/project/src/middleware/http-telemetry/http-telemetry-middleware.ts',
    },
    {
      code: 'import { errorTrackingMiddleware } from "../error-tracking/error-tracking-middleware";',
      filename: '/project/src/middleware/request-logger/request-logger-middleware.ts',
    },
    {
      code: 'import { serverStatics } from "../../statics/server/server-statics";',
      filename: '/project/src/middleware/cors/cors-middleware.ts',
    },

    // Flows (depth 1) can ONLY import from responders
    {
      code: 'import { UserProfileResponder } from "../../responders/user/profile/user-profile-responder";',
      filename: '/project/src/flows/user/user-flow.tsx',
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

    // Proxy files are exempt from import restrictions (have their own proxy rules)
    {
      code: 'import { fsEnsureReadFileSyncAdapterProxy } from "../../../adapters/fs/ensure-read-file-sync/fs-ensure-read-file-sync-adapter.proxy";',
      filename:
        '/project/src/brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.proxy.ts',
    },
    {
      code: 'import { httpGetAdapterProxy } from "../../../../adapters/http/get/http-get-adapter.proxy";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
    },
    {
      code: 'import { anyImportAtAll } from "../../../../anywhere/not-allowed-normally";',
      filename: '/project/src/guards/test/test-guard.proxy.ts',
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
            allowed: 'contracts/, statics/, errors/, guards/, transformers/',
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
            allowed:
              'statics/, errors/, contracts/, zod, @dungeonmaster/shared/@types, @dungeonmaster/orchestrator',
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
            allowed:
              'statics/, errors/, contracts/, zod, @dungeonmaster/shared/@types, @dungeonmaster/orchestrator',
          },
        },
      ],
    },

    // Contracts cannot import external packages (except zod)
    {
      code: 'import axios from "axios";',
      filename: '/project/src/contracts/api/api-contract.ts',
      errors: [
        {
          messageId: 'forbiddenExternalImport',
          data: {
            folderType: 'contracts',
            packageName: 'axios',
          },
        },
      ],
    },
    {
      code: 'import { existsSync } from "fs";',
      filename: '/project/src/contracts/file/file-contract.ts',
      errors: [
        {
          messageId: 'forbiddenExternalImport',
          data: {
            folderType: 'contracts',
            packageName: 'fs',
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
            allowed: 'contracts/, statics/, errors/, guards/, transformers/',
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
            allowed:
              'brokers/, adapters/, contracts/, statics/, errors/, guards/, transformers/, @dungeonmaster/orchestrator',
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
            allowed:
              'brokers/, adapters/, contracts/, statics/, errors/, guards/, transformers/, @dungeonmaster/orchestrator',
          },
        },
      ],
    },

    // Cannot import non-entry files across domain folders
    {
      code: 'import { helper } from "../../contracts/user/helper";',
      filename: '/project/src/guards/auth/auth-guard.ts',
      errors: [
        {
          messageId: 'nonEntryFileImport',
          data: {
            folderType: 'guards',
            importedFile: 'helper',
            importedFolder: 'contracts',
            pattern: '-contract.ts',
          },
        },
      ],
    },
    {
      code: 'import { utility } from "../../../adapters/axios/utility";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [
        {
          messageId: 'nonEntryFileImport',
          data: {
            folderType: 'brokers',
            importedFile: 'utility',
            importedFolder: 'adapters',
            pattern: '-adapter.ts',
          },
        },
      ],
    },
    {
      code: 'import { helper } from "../../statics/config/helper";',
      filename: '/project/src/transformers/user/user-transformer.ts',
      errors: [
        {
          messageId: 'nonEntryFileImport',
          data: {
            folderType: 'transformers',
            importedFile: 'helper',
            importedFolder: 'statics',
            pattern: '-statics.ts',
          },
        },
      ],
    },

    // Cannot import helper files from different action folders (brokers depth 2)
    {
      code: 'import { helper } from "../create/helper";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [
        {
          messageId: 'nonEntryFileImport',
          data: {
            folderType: 'brokers',
            importedFile: 'helper',
            importedFolder: 'brokers',
            pattern: '-broker.ts',
          },
        },
      ],
    },

    // Cannot import layer files from different broker domains (cross-domain)
    {
      code: 'import { validateFolderDepthLayerBroker } from "../../rule/enforce-project-structure/validate-folder-depth-layer-broker";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [
        {
          messageId: 'nonEntryFileImport',
          data: {
            folderType: 'brokers',
            importedFile: 'validate-folder-depth-layer-broker',
            importedFolder: 'brokers',
            pattern: '-broker.ts',
          },
        },
      ],
    },
    {
      code: 'import { formatResponseLayerBroker } from "../../user/fetch/format-response-layer-broker";',
      filename: '/project/src/brokers/auth/login/auth-login-broker.ts',
      errors: [
        {
          messageId: 'nonEntryFileImport',
          data: {
            folderType: 'brokers',
            importedFile: 'format-response-layer-broker',
            importedFolder: 'brokers',
            pattern: '-broker.ts',
          },
        },
      ],
    },

    // Cannot import layer files from different broker actions (same domain, different action)
    {
      code: 'import { validateUserLayerBroker } from "../fetch/validate-user-layer-broker";',
      filename: '/project/src/brokers/user/update/user-update-broker.ts',
      errors: [
        {
          messageId: 'nonEntryFileImport',
          data: {
            folderType: 'brokers',
            importedFile: 'validate-user-layer-broker',
            importedFolder: 'brokers',
            pattern: '-broker.ts',
          },
        },
      ],
    },
    {
      code: 'import { utils } from "../get/utils";',
      filename: '/project/src/responders/user/create/user-create-responder.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'responders',
            importedFolder: 'responders',
            allowed:
              'adapters/, widgets/, brokers/, bindings/, state/, contracts/, transformers/, guards/, statics/, errors/',
          },
        },
      ],
    },

    // Cannot import multi-dot files (.stub.ts, .mock.ts, .test.ts) across domain folders
    {
      code: 'import { UserStub } from "../../contracts/user/user.stub";',
      filename: '/project/src/guards/auth/auth-guard.ts',
      errors: [
        {
          messageId: 'nonEntryFileImport',
          data: {
            folderType: 'guards',
            importedFile: 'user.stub',
            importedFolder: 'contracts',
            pattern: '-contract.ts',
          },
        },
      ],
    },
    {
      code: 'import { axiosMock } from "../../../adapters/axios/axios-get.mock";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [
        {
          messageId: 'nonEntryFileImport',
          data: {
            folderType: 'brokers',
            importedFile: 'axios-get.mock',
            importedFolder: 'adapters',
            pattern: '-adapter.ts',
          },
        },
      ],
    },
    {
      code: 'import { userContractTest } from "../../contracts/user/user-contract.test";',
      filename: '/project/src/guards/auth/auth-guard.ts',
      errors: [
        {
          messageId: 'nonEntryFileImport',
          data: {
            folderType: 'guards',
            importedFile: 'user-contract.test',
            importedFolder: 'contracts',
            pattern: '-contract.ts',
          },
        },
      ],
    },

    // Responders cannot import from flows
    {
      code: 'import { UserFlow } from "../../../flows/user/user-flow";',
      filename: '/project/src/responders/user/profile/user-profile-responder.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'responders',
            importedFolder: 'flows',
            allowed:
              'adapters/, widgets/, brokers/, bindings/, state/, contracts/, transformers/, guards/, statics/, errors/',
          },
        },
      ],
    },

    // Widgets cannot import from flows or responders
    {
      code: 'import { UserFlow } from "../../flows/user/user-flow";',
      filename: '/project/src/widgets/router/router-widget.tsx',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'widgets',
            importedFolder: 'flows',
            allowed:
              'adapters/, bindings/, brokers/, state/, contracts/, transformers/, guards/, statics/, errors/, widgets/, react, @mantine/core, @mantine/hooks, ansi-to-react, react-router-dom, @testing-library/react, @testing-library/user-event',
          },
        },
      ],
    },
    {
      code: 'import { UserProfileResponder } from "../../responders/user/profile/user-profile-responder";',
      filename: '/project/src/widgets/page/page-widget.tsx',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'widgets',
            importedFolder: 'responders',
            allowed:
              'adapters/, bindings/, brokers/, state/, contracts/, transformers/, guards/, statics/, errors/, widgets/, react, @mantine/core, @mantine/hooks, ansi-to-react, react-router-dom, @testing-library/react, @testing-library/user-event',
          },
        },
      ],
    },
    {
      code: 'import axios from "axios";',
      filename: '/project/src/widgets/http-client/http-client-widget.tsx',
      errors: [
        {
          messageId: 'forbiddenExternalImport',
          data: {
            folderType: 'widgets',
            packageName: 'axios',
          },
        },
      ],
    },

    // Bindings cannot import from flows, responders, widgets, or external packages
    {
      code: 'import express from "express";',
      filename: '/project/src/bindings/use-server/use-server-binding.ts',
      errors: [
        {
          messageId: 'forbiddenExternalImport',
          data: {
            folderType: 'bindings',
            packageName: 'express',
          },
        },
      ],
    },

    // State cannot import from brokers or external packages
    {
      code: 'import { userFetchBroker } from "../../brokers/user/fetch/user-fetch-broker";',
      filename: '/project/src/state/user-data/user-data-state.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'state',
            importedFolder: 'brokers',
            allowed: 'contracts/, statics/, errors/, guards/, transformers/',
          },
        },
      ],
    },
    {
      code: 'import { z } from "zod";',
      filename: '/project/src/state/store/store-state.ts',
      errors: [
        {
          messageId: 'forbiddenExternalImport',
          data: {
            folderType: 'state',
            packageName: 'zod',
          },
        },
      ],
    },

    // Middleware cannot import from brokers, contracts, guards, transformers, or external packages
    {
      code: 'import { userFetchBroker } from "../../brokers/user/fetch/user-fetch-broker";',
      filename: '/project/src/middleware/auth/auth-middleware.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'middleware',
            importedFolder: 'brokers',
            allowed: 'adapters/, middleware/, statics/, contracts/, guards/',
          },
        },
      ],
    },
    {
      code: 'import express from "express";',
      filename: '/project/src/middleware/cors/cors-middleware.ts',
      errors: [
        {
          messageId: 'forbiddenExternalImport',
          data: {
            folderType: 'middleware',
            packageName: 'express',
          },
        },
      ],
    },

    // Flows cannot import from anything except responders
    {
      code: 'import { userFetchBroker } from "../../brokers/user/fetch/user-fetch-broker";',
      filename: '/project/src/flows/api/api-flow.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'flows',
            importedFolder: 'brokers',
            allowed: 'responders/',
          },
        },
      ],
    },
    {
      code: 'import { UserCardWidget } from "../../widgets/user-card/user-card-widget";',
      filename: '/project/src/flows/user/user-flow.tsx',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'flows',
            importedFolder: 'widgets',
            allowed: 'responders/',
          },
        },
      ],
    },
    {
      code: 'import { userContract } from "../../contracts/user/user-contract";',
      filename: '/project/src/flows/validation/validation-flow.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'flows',
            importedFolder: 'contracts',
            allowed: 'responders/',
          },
        },
      ],
    },
    {
      code: 'import express from "express";',
      filename: '/project/src/flows/server/server-flow.ts',
      errors: [
        {
          messageId: 'forbiddenExternalImport',
          data: {
            folderType: 'flows',
            packageName: 'express',
          },
        },
      ],
    },

    // @dungeonmaster/shared imports must follow folder dependency rules
    // Guards cannot import from @dungeonmaster/shared/brokers (if it existed)
    {
      code: 'import { configBroker } from "@dungeonmaster/shared/brokers";',
      filename: '/project/src/guards/validation/validation-guard.ts',
      errors: [
        {
          messageId: 'forbiddenImport',
          data: {
            folderType: 'guards',
            importedFolder: 'brokers',
            allowed: 'contracts/, statics/, errors/, guards/, transformers/',
          },
        },
      ],
    },
    // Statics cannot import from @dungeonmaster/shared/contracts
    {
      code: 'import { filePathContract } from "@dungeonmaster/shared/contracts";',
      filename: '/project/src/statics/config/config-statics.ts',
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
    // Cannot import from @dungeonmaster/shared root - must use subpaths
    {
      code: 'import { filePathContract } from "@dungeonmaster/shared";',
      filename: '/project/src/adapters/path/path-adapter.ts',
      errors: [
        {
          messageId: 'forbiddenSharedRootImport',
        },
      ],
    },
    {
      code: 'import { filePathContract } from "@dungeonmaster/shared";',
      filename: '/project/src/brokers/config/load/config-load-broker.ts',
      errors: [
        {
          messageId: 'forbiddenSharedRootImport',
        },
      ],
    },

    // Same-layer imports should NOT repeat the category name in the path
    // Brokers importing from brokers - should use ../../domain/ not ../../../brokers/domain/
    {
      code: 'import { userCreateBroker } from "../../../brokers/user/create/user-create-broker";',
      filename: '/project/src/brokers/auth/login/auth-login-broker.ts',
      errors: [
        {
          messageId: 'unnecessaryCategoryInPath',
          data: {
            folderType: 'brokers',
            importPath: '../../../brokers/user/create/user-create-broker',
            suggestedPath: '../../user/create/user-create-broker',
          },
        },
      ],
    },
    {
      code: 'import { emailSendBroker } from "../../../brokers/email/send/email-send-broker";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [
        {
          messageId: 'unnecessaryCategoryInPath',
          data: {
            folderType: 'brokers',
            importPath: '../../../brokers/email/send/email-send-broker',
            suggestedPath: '../../email/send/email-send-broker',
          },
        },
      ],
    },
    // Middleware importing from middleware - should use ../name/ not ../../middleware/name/
    {
      code: 'import { errorTrackingMiddleware } from "../../middleware/error-tracking/error-tracking-middleware";',
      filename: '/project/src/middleware/http-telemetry/http-telemetry-middleware.ts',
      errors: [
        {
          messageId: 'unnecessaryCategoryInPath',
          data: {
            folderType: 'middleware',
            importPath: '../../middleware/error-tracking/error-tracking-middleware',
            suggestedPath: '../error-tracking/error-tracking-middleware',
          },
        },
      ],
    },
  ],
});
