import React from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';

const App = () => (
  <MantineProvider>
    <div style={{ padding: 20 }}>
      <h1>Design Sandbox</h1>
      <p>Start building your design here.</p>
    </div>
  </MantineProvider>
);

const root = createRoot(document.getElementById('root'));
root.render(<App />);