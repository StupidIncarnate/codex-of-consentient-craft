import { ruleBanFlattenedContractParamsBroker } from './rule-ban-flattened-contract-params-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-flattened-contract-params', ruleBanFlattenedContractParamsBroker(), {
  valid: [
    // --- ONE indexed property is the blessed way to take a single identifier ---
    {
      code: "export const questFetchBroker = ({ questId }: { questId: Quest['id'] }): void => {};",
      filename: '/project/src/brokers/quest/fetch/quest-fetch-broker.ts',
    },

    // --- The SAME property twice is one field, not two. isPathSuffixMatchGuard's real shape. ---
    {
      code: `export const isPathSuffixMatchGuard = ({ storedPath, queryPath }: {
        storedPath?: ErrorEntry['filePath'];
        queryPath?: ErrorEntry['filePath'];
      }): boolean => true;`,
      filename: '/project/src/guards/is-path-suffix-match/is-path-suffix-match-guard.ts',
    },

    // --- One property each off two DIFFERENT hosts is not one contract taken apart ---
    {
      code: `export const linkBroker = ({ questId, workItemId }: {
        questId: Quest['id'];
        workItemId: WorkItem['id'];
      }): void => {};`,
      filename: '/project/src/brokers/quest/link/quest-link-broker.ts',
    },

    // --- Passing the whole object is the fix the rule points at ---
    {
      code: 'export const rowBroker = ({ workItem }: { workItem: WorkItem }): void => {};',
      filename: '/project/src/brokers/row/build/row-build-broker.ts',
    },

    // --- A DOM handle has no whole object to pass instead (exemptHosts.prefixes) ---
    {
      code: `export interface IconButtonWidgetProps {
        id?: HTMLElement['id'];
        className?: HTMLElement['className'];
      }`,
      filename: '/project/src/widgets/icon-button/icon-button-widget.tsx',
    },

    // --- An attribute bag is exempt by name ---
    {
      code: `export interface ButtonProps {
        role?: AriaAttributes['aria-label'];
        expanded?: AriaAttributes['aria-expanded'];
      }`,
      filename: '/project/src/widgets/icon-button/icon-button-widget.tsx',
    },

    // --- An event bag is exempt by suffix ---
    {
      code: `export const handlerBroker = ({ target, key }: {
        target: KeyboardEvent['target'];
        key: KeyboardEvent['key'];
      }): void => {};`,
      filename: '/project/src/brokers/key/handle/key-handle-broker.ts',
    },

    // --- Test files are excluded, so a stub may spread a contract however it likes ---
    {
      code: `const x: { a: Quest['id']; b: Quest['status'] } = y;`,
      filename: '/project/src/brokers/quest/fetch/quest-fetch-broker.test.ts',
    },

    // --- Proxies are excluded too; assembling scenario pieces is their job ---
    {
      code: `export const panelWidgetProxy = ({ a, b }: {
        a: Quest['id'];
        b: Quest['status'];
      }): void => {};`,
      filename: '/project/src/widgets/panel/panel-widget.proxy.tsx',
    },

    // --- ReturnType<typeof x> is exempt by its BASE name, not its rendered text ---
    {
      code: `export const build = ({ snapshot, error }: {
        snapshot: ReturnType<typeof useBindingProxy>['setupSnapshot'];
        error: ReturnType<typeof useBindingProxy>['setupError'];
      }): void => {};`,
      filename: '/project/src/brokers/build/panel/build-panel-broker.ts',
    },

    // --- A BUILDER's override bag: every member optional, every member off one host, nothing
    //     else in the block. There is no whole object to pass — the omitted fields are what the
    //     builder supplies. This is childProcessMockerAdapter's PresetSuccessParams. ---
    {
      code: `interface PresetSuccessParams {
        stdout?: MockSpawnResult['stdout'];
        code?: MockSpawnResult['code'];
      }`,
      filename: '/project/src/adapters/child-process/mocker/child-process-mocker-adapter.ts',
    },

    // --- The same shape as an inline param type ---
    {
      code: `export const buildBroker = ({ stdout, code }: {
        stdout?: MockSpawnResult['stdout'];
        code?: MockSpawnResult['code'];
      }): void => {};`,
      filename: '/project/src/brokers/build/mock/build-mock-broker.ts',
    },

    // --- A dotted lib type is exempt by its root segment ---
    {
      code: `export interface ButtonProps {
        label?: React.AriaAttributes['aria-label'];
        expanded?: React.AriaAttributes['aria-expanded'];
      }`,
      filename: '/project/src/widgets/button/button-widget.tsx',
    },
  ],

  invalid: [
    // --- Two distinct properties off one host, as a destructured param ---
    {
      code: `export const questOperationsUpdateBroker = ({ questId, operations }: {
        questId: Quest['id'];
        operations: Quest['operations'];
      }): void => {};`,
      filename: '/project/src/brokers/quest/operations-update/quest-operations-update-broker.ts',
      errors: [{ messageId: 'flattenedContract' }],
    },

    // --- Optional indexed members STILL fire once the block carries anything else. This is the
    //     real ExecutionRowLayerWidgetProps shape, and it is what keeps the override-bag
    //     exemption from swallowing the case the rule was written for. ---
    {
      code: `export interface ExecutionRowLayerWidgetProps {
        order: RowOrder;
        isAdhoc: boolean;
        startedAt?: WorkItem['startedAt'];
        completedAt?: WorkItem['completedAt'];
      }`,
      filename: '/project/src/widgets/execution-panel/execution-row-layer-widget.tsx',
      errors: [{ messageId: 'flattenedContract' }],
    },

    // --- A required member alongside an optional one is a parameter list, not an override bag ---
    {
      code: `export const updateBroker = ({ id, status }: {
        id: Quest['id'];
        status?: Quest['status'];
      }): void => {};`,
      filename: '/project/src/brokers/quest/update/quest-update-broker.ts',
      errors: [{ messageId: 'flattenedContract' }],
    },

    // --- A transformer is not exempt; every folder type is graded ---
    {
      code: `export const entryTransformer = ({ status, url }: {
        status: NetworkLogEntry['status'];
        url: NetworkLogEntry['url'];
      }): void => {};`,
      filename: '/project/src/transformers/msw-response/msw-response-transformer.ts',
      errors: [{ messageId: 'flattenedContract' }],
    },

    // --- A guard is not exempt either ---
    {
      code: `export const isStaleGuard = ({ id, updatedAt }: {
        id: Quest['id'];
        updatedAt: Quest['updatedAt'];
      }): boolean => true;`,
      filename: '/project/src/guards/is-stale/is-stale-guard.ts',
      errors: [{ messageId: 'flattenedContract' }],
    },

    // --- Two hosts flattened in one block report once EACH ---
    {
      code: `export interface PanelProps {
        questId: Quest['id'];
        questStatus: Quest['status'];
        itemId: WorkItem['id'];
        itemRole: WorkItem['role'];
      }`,
      filename: '/project/src/widgets/panel/panel-widget.tsx',
      errors: [{ messageId: 'flattenedContract' }, { messageId: 'flattenedContract' }],
    },

    // --- A nested type literal is judged on its OWN members, so the inner block reports ---
    {
      code: `export const sendBroker = ({ payload }: {
        payload: { id: Quest['id']; status: Quest['status'] };
      }): void => {};`,
      filename: '/project/src/brokers/send/quest/send-quest-broker.ts',
      errors: [{ messageId: 'flattenedContract' }],
    },

    // --- A union still names the host, so two distinct properties across branches report ---
    {
      code: `export const pickBroker = ({ value }: {
        value: Quest['id'] | Quest['status'];
      }): void => {};`,
      filename: '/project/src/brokers/pick/quest/pick-quest-broker.ts',
      errors: [{ messageId: 'flattenedContract' }],
    },
  ],
});
