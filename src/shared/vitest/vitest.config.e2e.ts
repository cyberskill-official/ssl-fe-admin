import { mergeConfigs } from '@cyberskill/shared/config';

import { VITE_ALIAS } from '../../shared/constant';

export default mergeConfigs('vitest-react-e2e', {
    resolve: {
        alias: VITE_ALIAS,
    },
});
