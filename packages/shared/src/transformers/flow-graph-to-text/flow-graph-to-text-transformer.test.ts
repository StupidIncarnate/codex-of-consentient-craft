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
        '[#login-page] Login Page (state) {auth-service}',
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
        '[#login-page] Login (state) {auth-service}',
        '  \u2192[#dashboard]',
        '  [#dashboard] Dashboard (state) {auth-service}',
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
        '[#check] Check (decision) {auth-service}',
        '  \u2192"yes" [#success]',
        '  [#success] Success (terminal) {auth-service}',
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
        '[#start] Start (state) {auth-service}',
        '  \u2192[#middle]',
        '  [#middle] Middle (action) {auth-service}',
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

      expect(result[0]).toBe('[#a] A (state) {auth-service}');
      expect(result).toStrictEqual([
        '[#a] A (state) {auth-service}',
        '  \u2192[#c]',
        '  [#c] C (state) {auth-service} \u2190 MERGE',
        '    (terminal)',
        '[#b] B (state) {auth-service}',
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
        '[#start] Start (state) {auth-service}',
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
        '[#login-page] Login (state) {auth-service}',
        '  > #shows-form: shows login form [ui-state]',
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
        '[#login-page] Login (state) {auth-service} [F✓]',
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
        '[#login-page] Login (state) {auth-service} [F✓ S✓]',
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
              question: 'Which port should the sandbox dev server use?',
            }),
          }),
        ],
        edges: [],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] Login (state) {auth-service} [S?]',
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
        '[#login-page] Login (state) {auth-service}',
        '  > #crash-on-bleh: POST /api/auth/login returns 400 for a non-JSON body [api-call] +siegemaster [S✓]',
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
        '[#login-page] Login (state) {auth-service}',
        '  > #shows-form: shows login form [ui-state]',
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
        '[#check] Check (decision) {auth-service}',
        '  →"yes" [#success] [F✓]',
        '  [#success] Success (terminal) {auth-service}',
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
              question: 'How should the reset lever seed a failed submit?',
            }),
          }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#start] Start (state) {auth-service}',
        '  →[#middle]',
        '  [#middle] Middle (action) {auth-service}',
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
            flowriderSignoff: SignoffStub(),
            siegemasterSignoff: SignoffStub({
              verdict: 'unconfirmable',
              evidence: 'no fuzzing harness is wired for this endpoint',
              question: 'Which fuzzing harness should cover the login endpoint?',
            }),
          }),
        ],
      });

      const result = flowGraphToTextTransformer({ flow });

      expect(result).toStrictEqual([
        '[#login-page] Login (state) {auth-service}',
        '  (terminal)',
        'off-map: concurrency [S✓] | hostile-input [F✓ S?]',
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
        '[#check] Check (decision) {auth-service}',
        '  > #shows-form: shows login form [ui-state]',
        '  →"yes" [#success]',
        '  [#success] Success (terminal) {auth-service}',
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
        '[#start] Start (state) {auth-service}',
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
        '[#post-chat] POST the message (action) {web, server}',
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
        '[#send-pressed] Send pressed (action) {web} ◀ YOURS',
        '  →[#write-image-file]',
        '  [#write-image-file] Write each image (action) {server}',
        '    →[#clear-composer]',
        '    [#clear-composer] Composer clears (terminal) {web, server} ◀ YOURS',
        '      (terminal)',
      ]);
    });

    it('VALID: {ownPackage: web, node carrying both sides} => own observables verbatim, foreign ones collapsed per package', () => {
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
        '[#post-chat] POST the message (action) {web, server, shared} ◀ YOURS',
        '  > #progress-bar-tracks-bytes: the progress bar advances as bytes are sent [ui-state]',
        '  > (2 observable(s) attributed to server — not yours)',
        '  > (1 observable(s) attributed to shared — not yours)',
        '  (terminal)',
      ]);
    });

    it('EMPTY: {no ownPackage} => every observable renders verbatim and no collapse line appears', () => {
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
        '[#post-chat] POST the message (action) {web, server}',
        '  > #progress-bar-tracks-bytes: the progress bar advances as bytes are sent [ui-state]',
        '  > #body-carries-ordered-images: the request body carries the images in paste order [api-call]',
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
        '[#draft-restored] Draft restored (terminal) {web}',
        '  →"sends the restored draft" send-message-with-images:send-pressed ↗ cross-flow',
        '    target: [#send-pressed] User presses Enter (action) {web} in flow #send-message-with-images "Send a message carrying images"',
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
        '[#draft-restored] Draft restored (terminal) {web}',
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
        '[#draft-restored] Draft restored (terminal) {web}',
        '  → send-message-with-images:renamed-away ↗ cross-flow',
      ]);
    });
  });
});
