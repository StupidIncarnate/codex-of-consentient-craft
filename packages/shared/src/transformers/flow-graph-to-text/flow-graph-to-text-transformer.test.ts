import { FlowStub } from '../../contracts/flow/flow.stub';
import { FlowNodeStub } from '../../contracts/flow-node/flow-node.stub';
import { FlowEdgeStub } from '../../contracts/flow-edge/flow-edge.stub';
import { FlowObservableStub } from '../../contracts/flow-observable/flow-observable.stub';
import { FlowOffMapSignoffStub } from '../../contracts/flow-off-map-signoff/flow-off-map-signoff.stub';
import { SignoffStub } from '../../contracts/signoff/signoff.stub';
import { flowGraphToTextTransformer } from './flow-graph-to-text-transformer';

describe('flowGraphToTextTransformer', () => {
  describe('single node', () => {
    it('VALID: {flow: single node no edges} => renders node with terminal', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({ id: 'login-page' as never, label: 'Login Page' as never, type: 'state' }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] {auth-service} Login Page (state)',
        '  (terminal)',
      ]);
    });
  });

  describe('linear chain', () => {
    it('VALID: {flow: two connected nodes} => renders depth-first walk', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({ id: 'login-page' as never, label: 'Login' as never, type: 'state' }),
          FlowNodeStub({ id: 'dashboard' as never, label: 'Dashboard' as never, type: 'state' }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'e-one' as never,
            from: 'login-page' as never,
            to: 'dashboard' as never,
          }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] {auth-service} Login (state)',
        '  \u2192[#dashboard]',
        '  [#dashboard] {auth-service} Dashboard (state)',
        '    (terminal)',
      ]);
    });
  });

  describe('labeled edges', () => {
    it('VALID: {flow: edge with label} => renders label in quotes', () => {
      const flow = FlowStub({
        entryPoint: 'check' as never,
        nodes: [
          FlowNodeStub({ id: 'check' as never, label: 'Check' as never, type: 'decision' }),
          FlowNodeStub({ id: 'success' as never, label: 'Success' as never, type: 'terminal' }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'e-one' as never,
            from: 'check' as never,
            to: 'success' as never,
            label: 'yes' as never,
          }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#check] {auth-service} Check (decision)',
        '  \u2192"yes" [#success]',
        '  [#success] {auth-service} Success (terminal)',
        '    (terminal)',
      ]);
    });
  });

  describe('back-references', () => {
    it('VALID: {flow: cycle with back edge} => renders back-reference marker', () => {
      const flow = FlowStub({
        entryPoint: 'start' as never,
        nodes: [
          FlowNodeStub({ id: 'start' as never, label: 'Start' as never, type: 'state' }),
          FlowNodeStub({ id: 'middle' as never, label: 'Middle' as never, type: 'action' }),
        ],
        edges: [
          FlowEdgeStub({ id: 'e-one' as never, from: 'start' as never, to: 'middle' as never }),
          FlowEdgeStub({ id: 'e-two' as never, from: 'middle' as never, to: 'start' as never }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#start] {auth-service} Start (state)',
        '  \u2192[#middle]',
        '  [#middle] {auth-service} Middle (action)',
        '    \u2192 [#start] \u21A9',
      ]);
    });
  });

  describe('merge nodes', () => {
    it('VALID: {flow: node with multiple incoming edges} => shows MERGE marker', () => {
      const flow = FlowStub({
        entryPoint: 'a' as never,
        nodes: [
          FlowNodeStub({ id: 'a' as never, label: 'A' as never, type: 'state' }),
          FlowNodeStub({ id: 'b' as never, label: 'B' as never, type: 'state' }),
          FlowNodeStub({ id: 'c' as never, label: 'C' as never, type: 'state' }),
        ],
        edges: [
          FlowEdgeStub({ id: 'e-one' as never, from: 'a' as never, to: 'c' as never }),
          FlowEdgeStub({ id: 'e-two' as never, from: 'b' as never, to: 'c' as never }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result[0]).toBe('[#a] {auth-service} A (state)');
      expect(result).toStrictEqual([
        '[#a] {auth-service} A (state)',
        '  \u2192[#c]',
        '  [#c] {auth-service} C (state) \u2190 MERGE',
        '    (terminal)',
        '[#b] {auth-service} B (state)',
        '  \u2192 [#c] \u21A9',
      ]);
    });
  });

  describe('cross-flow references', () => {
    it('VALID: {flow: edge to node not in current flow} => renders cross-flow marker', () => {
      const flow = FlowStub({
        entryPoint: 'start' as never,
        nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never, type: 'state' })],
        edges: [
          FlowEdgeStub({ id: 'e-one' as never, from: 'start' as never, to: 'other-node' as never }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#start] {auth-service} Start (state)',
        '  \u2192 other-node \u2197 cross-flow',
      ]);
    });
  });

  describe('observables', () => {
    it('VALID: {flow: node with observables} => renders observable lines', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({
            id: 'login-page' as never,
            label: 'Login' as never,
            type: 'state',
            observables: [
              FlowObservableStub({
                id: 'shows-form' as never,
                description: 'shows login form' as never,
                type: 'ui-state',
              }),
            ],
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] {auth-service ● 1} Login (state)',
        '  ● #shows-form {auth-service} shows login form [ui-state]',
        '  (terminal)',
      ]);
    });
  });

  describe('empty flow', () => {
    it('EMPTY: {flow: no nodes} => returns empty array', () => {
      const flow = FlowStub({ nodes: [], edges: [] });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([]);
    });
  });

  describe('sign-off markers', () => {
    it('VALID: {node signed by flowrider alone} => node line carries the flowrider mark only', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({
            id: 'login-page' as never,
            label: 'Login' as never,
            type: 'state',
            flowriderSignoff: SignoffStub(),
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] {auth-service} Login (state) [F✓]',
        '  (terminal)',
      ]);
    });

    it('VALID: {node signed by both tracks} => node line carries both marks', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({
            id: 'login-page' as never,
            label: 'Login' as never,
            type: 'state',
            flowriderSignoff: SignoffStub(),
            siegemasterSignoff: SignoffStub(),
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] {auth-service} Login (state) [F✓ S✓]',
        '  (terminal)',
      ]);
    });

    it('VALID: {node unconfirmable on siegemaster} => renders the verdict mark, never the evidence', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({
            id: 'login-page' as never,
            label: 'Login' as never,
            type: 'state',
            siegemasterSignoff: SignoffStub({
              verdict: 'unconfirmable',
              evidence: 'the dev server refuses to bind port 3737 in this sandbox',
              toSettle:
                'Start the sandbox dev server on the configured port, then re-walk this node.',
            }),
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] {auth-service} Login (state) [S?]',
        '  (terminal)',
      ]);
    });

    it('VALID: {observable signed and added mid-quest} => observable line carries provenance then marks', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({
            id: 'login-page' as never,
            label: 'Login' as never,
            type: 'state',
            observables: [
              FlowObservableStub({
                id: 'crash-on-bleh' as never,
                description: 'POST /api/auth/login returns 400 for a non-JSON body' as never,
                type: 'api-call',
                addedBy: 'siegemaster',
                siegemasterSignoff: SignoffStub(),
              }),
            ],
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] {auth-service ● 1} Login (state)',
        '  ● #crash-on-bleh {auth-service} POST /api/auth/login returns 400 for a non-JSON body [api-call] +siegemaster [S✓]',
        '  (terminal)',
      ]);
    });

    it('VALID: {observable carrying verifyByReading} => the line carries (read-check) after its type, so a session sees no test settles it', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({
            id: 'login-page' as never,
            label: 'Login' as never,
            type: 'state',
            observables: [
              FlowObservableStub({
                id: 'pattern-not-inlined' as never,
                description: 'the token pattern is read from the shared statics' as never,
                type: 'custom',
                verifyByReading: true,
              }),
            ],
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] {auth-service ● 1} Login (state)',
        '  ● #pattern-not-inlined {auth-service} the token pattern is read from the shared statics [custom] (read-check)',
        '  (terminal)',
      ]);
    });

    it('VALID: {read-check observable also added mid-quest and signed} => (read-check) sits between the type and the provenance', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({
            id: 'login-page' as never,
            label: 'Login' as never,
            type: 'state',
            observables: [
              FlowObservableStub({
                id: 'pattern-not-inlined' as never,
                description: 'the token pattern is read from the shared statics' as never,
                type: 'custom',
                verifyByReading: true,
                addedBy: 'codeweaver',
                codeweaverSignoff: SignoffStub(),
              }),
            ],
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] {auth-service ● 1} Login (state)',
        '  ● #pattern-not-inlined {auth-service} the token pattern is read from the shared statics [custom] (read-check) +codeweaver [C✓]',
        '  (terminal)',
      ]);
    });

    it('VALID: {spec observable} => no provenance marker, so the line is unchanged', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({
            id: 'login-page' as never,
            label: 'Login' as never,
            type: 'state',
            observables: [
              FlowObservableStub({
                id: 'shows-form' as never,
                description: 'shows login form' as never,
                type: 'ui-state',
              }),
            ],
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] {auth-service ● 1} Login (state)',
        '  ● #shows-form {auth-service} shows login form [ui-state]',
        '  (terminal)',
      ]);
    });

    it('VALID: {labelled edge signed by one track} => edge line carries the mark after the target', () => {
      const flow = FlowStub({
        entryPoint: 'check' as never,
        nodes: [
          FlowNodeStub({ id: 'check' as never, label: 'Check' as never, type: 'decision' }),
          FlowNodeStub({ id: 'success' as never, label: 'Success' as never, type: 'terminal' }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'e-one' as never,
            from: 'check' as never,
            to: 'success' as never,
            label: 'yes' as never,
            flowriderSignoff: SignoffStub(),
          }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#check] {auth-service} Check (decision)',
        '  →"yes" [#success] [F✓]',
        '  [#success] {auth-service} Success (terminal)',
        '    (terminal)',
      ]);
    });

    it('VALID: {back-reference edge signed by both tracks} => back-ref line carries both marks', () => {
      const flow = FlowStub({
        entryPoint: 'start' as never,
        nodes: [
          FlowNodeStub({ id: 'start' as never, label: 'Start' as never, type: 'state' }),
          FlowNodeStub({ id: 'middle' as never, label: 'Middle' as never, type: 'action' }),
        ],
        edges: [
          FlowEdgeStub({ id: 'e-one' as never, from: 'start' as never, to: 'middle' as never }),
          FlowEdgeStub({
            id: 'e-two' as never,
            from: 'middle' as never,
            to: 'start' as never,
            flowriderSignoff: SignoffStub(),
            siegemasterSignoff: SignoffStub({
              verdict: 'unconfirmable',
              evidence: 'the retry path needs a seeded failure the lever cannot produce',
              toSettle: 'Extend the reset lever to seed a failed submit, then drive this branch.',
            }),
          }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#start] {auth-service} Start (state)',
        '  →[#middle]',
        '  [#middle] {auth-service} Middle (action)',
        '    → [#start] ↩ [F✓ S?]',
      ]);
    });

    it('VALID: {off-map families signed} => a trailing off-map line lists only the signed families', () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({ id: 'login-page' as never, label: 'Login' as never, type: 'state' }),
        ],
        edges: [],
        offMapSignoffs: [
          FlowOffMapSignoffStub({ id: 'concurrency', siegemasterSignoff: SignoffStub() }),
          FlowOffMapSignoffStub({ id: 'perf' }),
          FlowOffMapSignoffStub({
            id: 'hostile-input',
            siegemasterSignoff: SignoffStub({
              verdict: 'unconfirmable',
              evidence: 'no fuzzing harness is wired for this endpoint',
              toSettle: 'Point a fuzzing harness at the login endpoint and record what it returns.',
            }),
          }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] {auth-service} Login (state)',
        '  (terminal)',
        'off-map: concurrency [S✓] | hostile-input [S?]',
      ]);
    });

    it("VALID: {off-map family carrying a stray flowrider sign-off} => renders siegemaster's mark alone, because a family has no other column", () => {
      const flow = FlowStub({
        entryPoint: 'login-page' as never,
        nodes: [
          FlowNodeStub({ id: 'login-page' as never, label: 'Login' as never, type: 'state' }),
        ],
        edges: [],
        offMapSignoffs: [
          { id: 'perf', flowriderSignoff: SignoffStub(), siegemasterSignoff: SignoffStub() },
        ] as never,
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] {auth-service} Login (state)',
        '  (terminal)',
        'off-map: perf [S✓]',
      ]);
    });
  });

  describe('regression: a flow with zero sign-offs renders unchanged', () => {
    it('EMPTY: {no sign-offs anywhere} => no markers, no provenance, no off-map line', () => {
      const flow = FlowStub({
        entryPoint: 'check' as never,
        nodes: [
          FlowNodeStub({
            id: 'check' as never,
            label: 'Check' as never,
            type: 'decision',
            observables: [
              FlowObservableStub({
                id: 'shows-form' as never,
                description: 'shows login form' as never,
                type: 'ui-state',
              }),
            ],
          }),
          FlowNodeStub({ id: 'success' as never, label: 'Success' as never, type: 'terminal' }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'e-one' as never,
            from: 'check' as never,
            to: 'success' as never,
            label: 'yes' as never,
          }),
        ],
        offMapSignoffs: [
          FlowOffMapSignoffStub({ id: 'concurrency' }),
          FlowOffMapSignoffStub({ id: 'perf' }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#check] {auth-service ● 1} Check (decision)',
        '  ● #shows-form {auth-service} shows login form [ui-state]',
        '  →"yes" [#success]',
        '  [#success] {auth-service} Success (terminal)',
        '    (terminal)',
      ]);
    });

    it('EMPTY: {no sign-offs, cross-flow edge} => the cross-flow line is unchanged', () => {
      const flow = FlowStub({
        entryPoint: 'start' as never,
        nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never, type: 'state' })],
        edges: [
          FlowEdgeStub({ id: 'e-one' as never, from: 'start' as never, to: 'other-node' as never }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#start] {auth-service} Start (state)',
        '  → other-node ↗ cross-flow',
      ]);
    });
  });

  describe('package tags on the node line', () => {
    it('VALID: {node tagging two packages} => renders both names in one brace group', () => {
      const flow = FlowStub({
        entryPoint: 'post-chat' as never,
        nodes: [
          FlowNodeStub({
            id: 'post-chat' as never,
            label: 'POST the message' as never,
            type: 'action',
            packages: ['web' as never, 'server' as never],
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#post-chat] {web, server} POST the message (action)',
        '  (terminal)',
      ]);
    });
  });

  describe('ownPackage marks, it never filters', () => {
    it('VALID: {ownPackage: web} => every node still renders, and only web nodes carry the mark', () => {
      const flow = FlowStub({
        entryPoint: 'send-pressed' as never,
        nodes: [
          FlowNodeStub({
            id: 'send-pressed' as never,
            label: 'Send pressed' as never,
            type: 'action',
            packages: ['web' as never],
          }),
          FlowNodeStub({
            id: 'write-image-file' as never,
            label: 'Write each image' as never,
            type: 'action',
            packages: ['server' as never],
          }),
          FlowNodeStub({
            id: 'clear-composer' as never,
            label: 'Composer clears' as never,
            type: 'terminal',
            packages: ['web' as never, 'server' as never],
          }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'e-one' as never,
            from: 'send-pressed' as never,
            to: 'write-image-file' as never,
          }),
          FlowEdgeStub({
            id: 'e-two' as never,
            from: 'write-image-file' as never,
            to: 'clear-composer' as never,
          }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow, ownPackage: 'web' as never });

      expect(result).toStrictEqual([
        '[#send-pressed] {web} Send pressed (action) ◀ YOURS',
        '  →[#write-image-file]',
        '  [#write-image-file] {server} Write each image (action)',
        '    →[#clear-composer]',
        '    [#clear-composer] {web, server} Composer clears (terminal) ◀ YOURS',
        '      (terminal)',
      ]);
    });

    it('VALID: {ownPackage: web, node carrying both sides} => own observables verbatim, every other package counted in the tag set', () => {
      const flow = FlowStub({
        entryPoint: 'post-chat' as never,
        nodes: [
          FlowNodeStub({
            id: 'post-chat' as never,
            label: 'POST the message' as never,
            type: 'action',
            packages: ['web' as never, 'server' as never, 'shared' as never],
            observables: [
              FlowObservableStub({
                id: 'progress-bar-tracks-bytes' as never,
                description: 'the progress bar advances as bytes are sent' as never,
                type: 'ui-state',
                package: 'web' as never,
              }),
              FlowObservableStub({
                id: 'body-carries-ordered-images' as never,
                description: 'the request body carries the images in paste order' as never,
                type: 'api-call',
                package: 'server' as never,
              }),
              FlowObservableStub({
                id: 'images-dir-name-is-shared' as never,
                description: 'the images directory name is read from shared statics' as never,
                type: 'custom',
                package: 'shared' as never,
              }),
              FlowObservableStub({
                id: 'rejects-a-sixth-image' as never,
                description: 'a sixth image answers 400' as never,
                type: 'api-call',
                package: 'server' as never,
              }),
            ],
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow, ownPackage: 'web' as never });

      expect(result).toStrictEqual([
        '[#post-chat] {web ● 1, server ● 2, shared ● 1} POST the message (action) ◀ YOURS',
        '  ● #progress-bar-tracks-bytes {web} the progress bar advances as bytes are sent [ui-state]',
        '  (terminal)',
      ]);
    });

    it('EMPTY: {no ownPackage} => every observable renders verbatim and the tag set still counts them per package', () => {
      const flow = FlowStub({
        entryPoint: 'post-chat' as never,
        nodes: [
          FlowNodeStub({
            id: 'post-chat' as never,
            label: 'POST the message' as never,
            type: 'action',
            packages: ['web' as never, 'server' as never],
            observables: [
              FlowObservableStub({
                id: 'progress-bar-tracks-bytes' as never,
                description: 'the progress bar advances as bytes are sent' as never,
                type: 'ui-state',
                package: 'web' as never,
              }),
              FlowObservableStub({
                id: 'body-carries-ordered-images' as never,
                description: 'the request body carries the images in paste order' as never,
                type: 'api-call',
                package: 'server' as never,
              }),
            ],
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#post-chat] {web ● 1, server ● 1} POST the message (action)',
        '  ● #progress-bar-tracks-bytes {web} the progress bar advances as bytes are sent [ui-state]',
        '  ● #body-carries-ordered-images {server} the request body carries the images in paste order [api-call]',
        '  (terminal)',
      ]);
    });
  });

  describe('outbound cross-flow edges resolve against otherFlows', () => {
    it('VALID: {labelled edge into another flow} => the label rides the line and the target is resolved under it', () => {
      const flow = FlowStub({
        id: 'paste-image-into-composer' as never,
        entryPoint: 'draft-restored' as never,
        nodes: [
          FlowNodeStub({
            id: 'draft-restored' as never,
            label: 'Draft restored' as never,
            type: 'terminal',
            packages: ['web' as never],
          }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'restored-draft-to-send' as never,
            from: 'draft-restored' as never,
            to: 'send-message-with-images:send-pressed' as never,
            label: 'sends the restored draft' as never,
          }),
        ],
      });
      const target = FlowStub({
        id: 'send-message-with-images' as never,
        name: 'Send a message carrying images' as never,
        entryPoint: 'send-pressed' as never,
        nodes: [
          FlowNodeStub({
            id: 'send-pressed' as never,
            label: 'User presses Enter' as never,
            type: 'action',
            packages: ['web' as never],
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow, otherFlows: [flow, target] });

      expect(result).toStrictEqual([
        '[#draft-restored] {web} Draft restored (terminal)',
        '  →"sends the restored draft" send-message-with-images:send-pressed ↗ cross-flow',
        '    target: [#send-pressed] {web} User presses Enter (action) in flow #send-message-with-images "Send a message carrying images"',
        '    Your scope ENDS at the hand-off: prove the edge fires and the target flow is entered, not what it does next.',
      ]);
    });

    it('EMPTY: {no otherFlows} => the qualified target stays a bare stub', () => {
      const flow = FlowStub({
        id: 'paste-image-into-composer' as never,
        entryPoint: 'draft-restored' as never,
        nodes: [
          FlowNodeStub({
            id: 'draft-restored' as never,
            label: 'Draft restored' as never,
            type: 'terminal',
            packages: ['web' as never],
          }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'restored-draft-to-send' as never,
            from: 'draft-restored' as never,
            to: 'send-message-with-images:send-pressed' as never,
            label: 'sends the restored draft' as never,
          }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#draft-restored] {web} Draft restored (terminal)',
        '  →"sends the restored draft" send-message-with-images:send-pressed ↗ cross-flow',
      ]);
    });

    it('EDGE: {otherFlows given but the target flow holds no such node} => the stub renders with no resolution lines', () => {
      const flow = FlowStub({
        id: 'paste-image-into-composer' as never,
        entryPoint: 'draft-restored' as never,
        nodes: [
          FlowNodeStub({
            id: 'draft-restored' as never,
            label: 'Draft restored' as never,
            type: 'terminal',
            packages: ['web' as never],
          }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'restored-draft-to-send' as never,
            from: 'draft-restored' as never,
            to: 'send-message-with-images:renamed-away' as never,
          }),
        ],
      });
      const target = FlowStub({
        id: 'send-message-with-images' as never,
        name: 'Send a message carrying images' as never,
        entryPoint: 'send-pressed' as never,
        nodes: [
          FlowNodeStub({
            id: 'send-pressed' as never,
            label: 'User presses Enter' as never,
            type: 'action',
            packages: ['web' as never],
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow, otherFlows: [target] });

      expect(result).toStrictEqual([
        '[#draft-restored] {web} Draft restored (terminal)',
        '  → send-message-with-images:renamed-away ↗ cross-flow',
      ]);
    });
  });
});
