import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { banAdhocTypesRuleBroker } from './ban-adhoc-types-rule-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-adhoc-types', banAdhocTypesRuleBroker(), {
  valid: [
    // Allowed in contracts folder (disallowAdhocTypes: false)
    {
      code: `
        interface NodeWithCallee {
          callee?: { type?: string };
        }
        export const userContract = z.object({ name: z.string() });
      `,
      filename: '/project/src/contracts/user/user-contract.ts',
    },
    {
      code: `
        export const myFunction = () => {
          interface LocalInterface {
            prop: string;
          }
          return {} as LocalInterface;
        };
      `,
      filename: '/project/src/contracts/user/user-contract.ts',
    },
    {
      code: `
        const node = someValue as { type: string; name: string };
      `,
      filename: '/project/src/contracts/tsestree/tsestree-contract.ts',
    },

    // Allowed in adapters folder (disallowAdhocTypes: false)
    {
      code: `
        interface AdapterConfig {
          timeout: number;
        }
        export const httpAdapter = () => {};
      `,
      filename: '/project/src/adapters/http/get/http-get-adapter.ts',
    },
    {
      code: `
        export const myAdapter = () => {
          interface LocalType {
            data: unknown;
          }
          return fetch('url') as unknown as LocalType;
        };
      `,
      filename: '/project/src/adapters/fs/read/fs-read-adapter.ts',
    },

    // Allowed in widgets folder (disallowAdhocTypes: false)
    {
      code: `
        interface WidgetProps {
          title: string;
        }
        export const UserWidget = () => <div />;
      `,
      filename: '/project/src/widgets/user-card/user-card-widget.tsx',
    },
    {
      code: `
        export const MyWidget = () => {
          interface LocalState {
            count: number;
          }
          return <div />;
        };
      `,
      filename: '/project/src/widgets/counter/counter-widget.tsx',
    },

    // Top-level interfaces ONLY allowed in folders with disallowAdhocTypes: false
    {
      code: `
        interface TopLevelInterface {
          prop: string;
        }
        export const userContract = z.object({ name: z.string() });
      `,
      filename: '/project/src/contracts/user/user-contract.ts',
    },
    {
      code: `
        export interface ExportedInterface {
          value: number;
        }
        export const httpAdapter = () => {};
      `,
      filename: '/project/src/adapters/http/get/http-get-adapter.ts',
    },
    {
      code: `
        // Multiple top-level interfaces are fine in widgets
        interface WidgetProps {
          title: string;
        }
        interface WidgetState {
          loading: boolean;
        }
        export const UserWidget = () => <div />;
      `,
      filename: '/project/src/widgets/user-card/user-card-widget.tsx',
    },

    // 'as const' assertions always allowed
    {
      code: `
        export const config = {
          timeout: 1000,
          retries: 3,
        } as const;
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: `
        export const myTransformer = () => {
          return ['a', 'b', 'c'] as const;
        };
      `,
      filename: '/project/src/transformers/format-date/format-date-transformer.ts',
    },

    // 'as unknown' allowed (part of safe casting pattern)
    {
      code: `
        export const myBroker = () => {
          const value = getSomeValue() as unknown;
          return value;
        };
      `,
      filename: '/project/src/brokers/user/create/user-create-broker.ts',
    },

    // Type assertions to imported types allowed
    {
      code: `
        import type { User } from '../../contracts/user/user-contract';
        export const myBroker = () => {
          const user = getData() as User;
          return user;
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: `
        import type { Config } from '../../contracts/config/config-contract';
        export const myBroker = () => {
          const config = JSON.parse(data) as Config;
          return config;
        };
      `,
      filename: '/project/src/brokers/config/load/config-load-broker.ts',
    },

    // Type references allowed (TSTypeReference)
    {
      code: `
        export const myBroker = () => {
          const value = getData() as string;
          return value;
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: `
        export const myBroker = () => {
          const id = getId() as number;
          return id;
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },

    // Union types allowed
    {
      code: `
        export const myBroker = () => {
          const value = getData() as string | number;
          return value;
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },

    // Array types allowed
    {
      code: `
        export const myBroker = () => {
          const items = getData() as string[];
          return items;
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },

    // Files outside src/ folder are not checked
    {
      code: `
        interface AnyInterface {
          anything: any;
        }
        const x = value as { type: string };
      `,
      filename: '/project/tests/user.test.ts',
    },
  ],

  invalid: [
    // Top-level interfaces in brokers (disallowAdhocTypes: true) - BANNED
    {
      code: `
        interface NodeWithCallee {
          callee?: { type?: string };
        }
        export const userFetchBroker = () => {};
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },
    {
      code: `
        export interface TopLevelInterface {
          prop: string;
        }
        export const myBroker = () => {};
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },
    {
      code: `
        interface BaseConfig {
          timeout: number;
        }
        interface ExtendedConfig extends BaseConfig {
          retries: number;
        }
        export const myBroker = () => {};
      `,
      filename: '/project/src/brokers/config/load/config-load-broker.ts',
      errors: [{ messageId: 'noAdhocInterface' }, { messageId: 'noAdhocInterface' }],
    },
    {
      code: `
        interface GenericInterface<T> {
          value: T;
        }
        export const myTransformer = () => {};
      `,
      filename: '/project/src/transformers/format-date/format-date-transformer.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Nested interfaces in brokers (disallowAdhocTypes: true) - ALSO BANNED
    {
      code: `
        export const userFetchBroker = () => {
          interface NodeWithCallee {
            callee?: { type?: string };
          }
          const node = getNode() as NodeWithCallee;
          return node;
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },
    {
      code: `
        export const userCreateBroker = () => {
          if (condition) {
            interface LocalInterface {
              prop: string;
            }
          }
        };
      `,
      filename: '/project/src/brokers/user/create/user-create-broker.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Inline type assertions in brokers
    {
      code: `
        export const userFetchBroker = () => {
          const node = getValue() as { type: string; name: string };
          return node;
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noInlineTypeAssertion' }],
    },
    {
      code: `
        export const myBroker = () => {
          const callee = node.callee as { type: string; object?: { name?: string } };
          return callee;
        };
      `,
      filename: '/project/src/brokers/payment/process/payment-process-broker.ts',
      errors: [{ messageId: 'noInlineTypeAssertion' }],
    },

    // Top-level interfaces in guards (disallowAdhocTypes: true) - BANNED
    {
      code: `
        interface GuardConfig {
          strict: boolean;
        }
        export const isValidGuard = ({ value }: { value: unknown }): boolean => true;
      `,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Nested interfaces in guards (disallowAdhocTypes: true) - ALSO BANNED
    {
      code: `
        export const isValidGuard = ({ value }: { value: unknown }): boolean => {
          interface ValidType {
            prop: string;
          }
          return true;
        };
      `,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Inline type assertions in guards
    {
      code: `
        export const hasPropertyGuard = ({ obj }: { obj: unknown }): boolean => {
          const typed = obj as { prop?: string };
          return typed.prop !== undefined;
        };
      `,
      filename: '/project/src/guards/has-property/has-property-guard.ts',
      errors: [{ messageId: 'noInlineTypeAssertion' }],
    },

    // Ad-hoc interfaces in transformers (disallowAdhocTypes: true)
    {
      code: `
        export const formatDateTransformer = ({ date }: { date: Date }): string => {
          interface FormattedDate {
            year: number;
            month: number;
          }
          return '';
        };
      `,
      filename: '/project/src/transformers/format-date/format-date-transformer.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Inline type assertions in transformers
    {
      code: `
        export const userToDtoTransformer = ({ user }: { user: User }): UserDto => {
          const dto = transform(user) as { id: string; name: string };
          return dto;
        };
      `,
      filename: '/project/src/transformers/user-to-dto/user-to-dto-transformer.ts',
      errors: [{ messageId: 'noInlineTypeAssertion' }],
    },

    // Top-level interfaces in statics (disallowAdhocTypes: true) - BANNED
    {
      code: `
        interface StaticsConfig {
          maxRetries: number;
        }
        export const userStatics = { roles: {} } as const;
      `,
      filename: '/project/src/statics/user/user-statics.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Nested interfaces in statics (disallowAdhocTypes: true) - ALSO BANNED
    {
      code: `
        export const userStatics = () => {
          interface Config {
            maxRetries: number;
          }
          return { roles: {} } as const;
        };
      `,
      filename: '/project/src/statics/user/user-statics.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Ad-hoc interfaces in bindings (disallowAdhocTypes: true)
    {
      code: `
        export const useUserDataBinding = () => {
          interface State {
            loading: boolean;
          }
          return { data: null };
        };
      `,
      filename: '/project/src/bindings/use-user-data/use-user-data-binding.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Ad-hoc interfaces in state (disallowAdhocTypes: true)
    {
      code: `
        export const userCacheState = {
          get: () => {
            interface CacheEntry {
              value: unknown;
            }
            return null;
          },
        };
      `,
      filename: '/project/src/state/user-cache/user-cache-state.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Ad-hoc interfaces in responders (disallowAdhocTypes: true)
    {
      code: `
        export const UserGetResponder = async ({ req, res }) => {
          interface RequestData {
            userId: string;
          }
          return;
        };
      `,
      filename: '/project/src/responders/user/get/user-get-responder.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Ad-hoc interfaces in middleware (disallowAdhocTypes: true)
    {
      code: `
        export const httpTelemetryMiddleware = () => {
          interface TelemetryData {
            duration: number;
          }
          return;
        };
      `,
      filename: '/project/src/middleware/http-telemetry/http-telemetry-middleware.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Interface inside nested function
    {
      code: `
        export const myBroker = () => {
          const helper = () => {
            interface NestedInterface {
              value: string;
            }
            return null;
          };
          return helper();
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Interface inside block statement
    {
      code: `
        export const myBroker = () => {
          if (true) {
            interface BlockInterface {
              data: unknown;
            }
          }
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Interface inside try-catch
    {
      code: `
        export const myBroker = () => {
          try {
            interface TryInterface {
              result: string;
            }
          } catch (error) {
            interface CatchInterface {
              error: unknown;
            }
          }
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noAdhocInterface' }, { messageId: 'noAdhocInterface' }],
    },

    // Interface inside loop
    {
      code: `
        export const myBroker = () => {
          for (let i = 0; i < 10; i++) {
            interface LoopInterface {
              index: number;
            }
          }
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Interface inside switch case
    {
      code: `
        export const myBroker = ({ type }: { type: string }) => {
          switch (type) {
            case 'a':
              interface CaseInterface {
                value: string;
              }
              break;
          }
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noAdhocInterface' }],
    },

    // Multiple violations in same file
    {
      code: `
        export const myBroker = () => {
          interface First {
            a: string;
          }
          const x = value as { type: string };
          interface Second {
            b: number;
          }
          return null;
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [
        { messageId: 'noAdhocInterface' },
        { messageId: 'noInlineTypeAssertion' },
        { messageId: 'noAdhocInterface' },
      ],
    },
  ],
});
