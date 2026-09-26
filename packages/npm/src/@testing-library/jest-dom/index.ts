/**
 * PURPOSE: Pass-through for the npm package '@testing-library/jest-dom'. Code outside the gateway imports @testing-library/jest-dom
 * through here instead of the raw package, so a future guard or override on @testing-library/jest-dom lands in
 * this one file and reaches every caller.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/@testing-library/jest-dom';
 */

import '@testing-library/jest-dom';
