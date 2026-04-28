import { mergeConfigs } from '@cyberskill/shared/config';

import { VITE_ALIAS } from '../../shared/constant';

export default mergeConfigs('vitest-react-unit', {
    resolve: {
        alias: VITE_ALIAS,
    },
    test: {
        setupFiles: ['src/shared/vitest/vitest.unit.setup.ts'],
    },
});
