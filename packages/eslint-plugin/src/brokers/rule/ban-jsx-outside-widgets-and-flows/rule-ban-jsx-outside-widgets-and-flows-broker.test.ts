import { ruleBanJsxOutsideWidgetsAndFlowsBroker } from './rule-ban-jsx-outside-widgets-and-flows-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

const ruleTester = ruleTesterHarness();

const WIDGET = '/project/src/widgets/panel/panel-widget.tsx';
const FLOW = '/project/src/flows/home/home-flow.tsx';
const BROKER = '/project/src/brokers/panel/render/panel-render-broker.tsx';

ruleTester.run('ban-jsx-outside-widgets-and-flows', ruleBanJsxOutsideWidgetsAndFlowsBroker(), {
  valid: [
    { code: 'export const A = () => <Box />;', filename: WIDGET },
    { code: 'export const A = () => <><Box /><Text /></>;', filename: WIDGET },
    { code: 'export const A = () => <Route element={<HomeWidget />} />;', filename: FLOW },
    // --- A widget's own test and proxy carry JSX and sit under widgets/ ---
    {
      code: 'render(<PanelWidget />);',
      filename: '/project/src/widgets/panel/panel-widget.test.tsx',
    },
    {
      code: 'export const P = () => <Box />;',
      filename: '/project/src/widgets/panel/panel-widget.proxy.tsx',
    },
    // --- A file with no markup passes wherever it is ---
    {
      code: 'export const a = (x: number) => x < 3 && x > 1;',
      filename: BROKER.replace('.tsx', '.ts'),
    },
    { code: 'export const a = createElement("div");', filename: BROKER },
  ],

  invalid: [
    {
      code: 'export const A = () => <Box />;',
      filename: BROKER,
      errors: [{ messageId: 'jsxOutsideWidgetsAndFlows', line: 1, column: 24 }],
    },
    {
      code: 'export const A = () => <><Box /></>;',
      filename: BROKER,
      errors: [{ messageId: 'jsxOutsideWidgetsAndFlows', line: 1, column: 24 }],
    },
    // --- A nested tree is one violation, on its outermost node ---
    {
      code: 'export const A = () => <Box><Text>{ok && <Icon />}</Text><>{x}</></Box>;',
      filename: BROKER,
      errors: [{ messageId: 'jsxOutsideWidgetsAndFlows', line: 1, column: 24 }],
    },
    // --- Two separate trees are two violations ---
    {
      code: 'export const A = () => <Box />;\nexport const B = () => <Text />;',
      filename: BROKER,
      errors: [
        { messageId: 'jsxOutsideWidgetsAndFlows', line: 1, column: 24 },
        { messageId: 'jsxOutsideWidgetsAndFlows', line: 2, column: 24 },
      ],
    },
    // --- Tests, proxies and stubs outside widgets/ and flows/ get no exemption ---
    {
      code: 'render(<Thing />);',
      filename: '/project/src/brokers/panel/render/panel-render-broker.test.tsx',
      errors: [{ messageId: 'jsxOutsideWidgetsAndFlows', line: 1, column: 8 }],
    },
    {
      code: 'export const P = () => <Box />;',
      filename: '/project/src/brokers/panel/render/panel-render-broker.proxy.tsx',
      errors: [{ messageId: 'jsxOutsideWidgetsAndFlows', line: 1, column: 24 }],
    },
    {
      code: 'export const S = () => <Box />;',
      filename: '/project/src/contracts/panel/panel.stub.tsx',
      errors: [{ messageId: 'jsxOutsideWidgetsAndFlows', line: 1, column: 24 }],
    },
    {
      code: 'export const H = () => <Box />;',
      filename: '/project/test/harnesses/panel/panel.harness.tsx',
      errors: [{ messageId: 'jsxOutsideWidgetsAndFlows', line: 1, column: 24 }],
    },
  ],
});
