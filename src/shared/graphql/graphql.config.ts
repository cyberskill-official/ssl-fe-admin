import type { CodegenConfig } from '@graphql-codegen/cli';

import { loadEnvFile } from '@cyberskill/shared/config/env';
import { createGraphqlCodegenConfig } from '@cyberskill/shared/config/graphql-codegen';

import { getEnv } from '../../shared/env';

loadEnvFile();

const env = getEnv();

const config: CodegenConfig = createGraphqlCodegenConfig({
    uri: `${env.VITE_API_BASE_ENDPOINT}${env.VITE_API_GRAPHQL_ENDPOINT}`,
    from: 'src/**/*.graphql',
    to: 'src/shared/graphql/generated/',
    target: 'client',
});

export default config;
