import { ruleBanAnonymousJsxInMapBroker } from './rule-ban-anonymous-jsx-in-map-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

const WIDGET = '/project/src/widgets/panel/panel-widget.tsx';

ruleTester.run('ban-anonymous-jsx-in-map', ruleBanAnonymousJsxInMapBroker(), {
  valid: [
    // --- Handing each item to a named widget is the shape the rule exists to produce ---
    {
      code: 'const x = items.map((item) => <RowLayerWidget key={item.id} item={item} />);',
      filename: WIDGET,
    },

    // --- A leaf element with an interpolated value is not a tree ---
    {
      code: 'const x = options.map((opt) => <option key={opt} value={opt}>{opt}</option>);',
      filename: WIDGET,
    },

    // --- Props may be as long as they like; it is CHILDREN that make a tree ---
    {
      code: 'const x = items.map((i) => <Text ff="monospace" style={{ fontSize: 10, color: "red" }} data-testid="row">{i.label}</Text>);',
      filename: WIDGET,
    },

    // --- A ternary INSIDE props is fine; the user asked for those to stay ---
    {
      code: 'const x = items.map((i) => <Text c={i.failed ? "red" : "dim"}>{i.label}</Text>);',
      filename: WIDGET,
    },

    // --- A ternary CHOOSING between two named widgets is fine ---
    {
      code: 'const x = items.map((i) => i.failed ? <FailedRowWidget item={i} /> : <RowWidget item={i} />);',
      filename: WIDGET,
    },

    // --- filter is not a rendering method, so its callback may declare whatever it likes ---
    {
      code: 'const x = items.filter((i) => { const s = i.status; return s === "done"; });',
      filename: WIDGET,
    },

    // --- A map that builds data, not markup, is untouched ---
    {
      code: 'const x = items.map((i) => { const label = compute(i); return { label }; });',
      filename: WIDGET,
    },

    // --- Test files are excluded ---
    {
      code: 'const x = items.map((i) => { const l = f(i); return <Box><Text>{l}</Text></Box>; });',
      filename: '/project/src/widgets/panel/panel-widget.test.tsx',
    },

    // --- Proxies are excluded too; their markup is scenario setup, not a surface ---
    {
      code: 'const x = items.map((i) => { const l = f(i); return <Box><Text>{l}</Text></Box>; });',
      filename: '/project/src/widgets/panel/panel-widget.proxy.tsx',
    },
  ],

  invalid: [
    // --- An anonymous tree: <Box> wrapping <Text> ---
    {
      code: 'const x = items.map((i) => <Box><Text>{i.label}</Text></Box>);',
      filename: WIDGET,
      errors: [{ messageId: 'anonymousJsxTree' }],
    },

    // --- A const inside the callback, even when the element itself is a leaf ---
    {
      code: 'const x = items.map((i) => { const label = compute(i); return <RowWidget label={label} />; });',
      filename: WIDGET,
      errors: [{ messageId: 'declarationInMapCallback' }],
    },

    // --- Both at once: the shape execution-panel-widget actually has. ESLint orders reports by
    //     source position, so the declaration is named before the tree it feeds. ---
    {
      code: 'const x = items.map((i) => { const label = compute(i); return <Box><Text>{label}</Text></Box>; });',
      filename: WIDGET,
      errors: [{ messageId: 'declarationInMapCallback' }, { messageId: 'anonymousJsxTree' }],
    },

    // --- Structure hidden behind a braced ternary still makes it a tree ---
    {
      code: 'const x = items.map((i) => <Box>{i.failed ? <Warning /> : null}</Box>);',
      filename: WIDGET,
      errors: [{ messageId: 'anonymousJsxTree' }],
    },

    // --- Structure hidden behind && is the same tree ---
    {
      code: 'const x = items.map((i) => <Box>{i.failed && <Warning />}</Box>);',
      filename: WIDGET,
      errors: [{ messageId: 'anonymousJsxTree' }],
    },

    // --- A fragment is anonymous by definition ---
    {
      code: 'const x = items.map((i) => <><Text>{i.a}</Text><Text>{i.b}</Text></>);',
      filename: WIDGET,
      errors: [{ messageId: 'anonymousJsxTree' }],
    },

    // --- flatMap renders rows too ---
    {
      code: 'const x = groups.flatMap((g) => <Box><Row g={g} /></Box>);',
      filename: WIDGET,
      errors: [{ messageId: 'anonymousJsxTree' }],
    },

    // --- let counts the same as const ---
    {
      code: 'const x = items.map((i) => { let label = compute(i); return <RowWidget label={label} />; });',
      filename: WIDGET,
      errors: [{ messageId: 'declarationInMapCallback' }],
    },

    // --- Each declaration is reported, so a 14-statement callback names all of them ---
    {
      code: 'const x = items.map((i) => { const a = f(i); const b = g(i); return <RowWidget a={a} b={b} />; });',
      filename: WIDGET,
      errors: [
        { messageId: 'declarationInMapCallback' },
        { messageId: 'declarationInMapCallback' },
      ],
    },

    // --- A ternary branch holding an anonymous tree is caught ---
    {
      code: 'const x = items.map((i) => i.failed ? <Box><Text>{i.err}</Text></Box> : <RowWidget item={i} />);',
      filename: WIDGET,
      errors: [{ messageId: 'anonymousJsxTree' }],
    },
  ],
});
