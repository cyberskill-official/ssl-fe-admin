import { E_Environment } from '@cyberskill/shared/typescript';
import { mapEnvironment } from '@cyberskill/shared/util';
import { cleanEnv, port, str } from 'envalid';

import type { I_Environment } from './env.type';

import { VITE_API_BASE_ENDPOINT, VITE_API_GRAPHQL_ENDPOINT, VITE_API_RESTAPI_ENDPOINT } from './env.constant';

export function getEnv(): I_Environment {
    // eslint-disable-next-line node/prefer-global/process
    const cleanedEnv = cleanEnv(typeof window !== 'undefined' ? import.meta.env : process.env, {
        VITE_NODE_ENV: str({
            choices: [E_Environment.DEVELOPMENT, E_Environment.PRODUCTION],
            default: E_Environment.DEVELOPMENT,
        }),
        VITE_NODE_ENV_MODE: str({
            choices: [E_Environment.DEVELOPMENT, E_Environment.STAGING, E_Environment.PRODUCTION],
            default: E_Environment.DEVELOPMENT,
        }),
        VITE_PORT: port(),
        VITE_API_BASE_ENDPOINT: str({ default: VITE_API_BASE_ENDPOINT }),
        VITE_API_GRAPHQL_ENDPOINT: str({ default: VITE_API_GRAPHQL_ENDPOINT }),
        VITE_API_RESTAPI_ENDPOINT: str({ default: VITE_API_RESTAPI_ENDPOINT }),
        VITE_USERBACK_CODE: str({ default: '' }),
        VITE_MAPTILER_KEY: str({ default: '' }),
    });

    return {
        ...cleanedEnv,
        ...mapEnvironment({
            NODE_ENV: cleanedEnv.VITE_NODE_ENV,
            NODE_ENV_MODE: cleanedEnv.VITE_NODE_ENV_MODE,
        }),
    };
}
