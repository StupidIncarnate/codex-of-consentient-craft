/**
 * PURPOSE: Vite entry point that bootstraps the web application
 *
 * USAGE:
 * // Referenced by index.html as the module entry script
 */

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@xyflow/react/dist/style.css';

import { StartApp } from './startup/start-app';

StartApp();
