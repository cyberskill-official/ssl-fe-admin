import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

const { default: _default, ...jestDomMatchers } = matchers;

expect.extend(jestDomMatchers);

afterEach(() => {
    cleanup();
});
