import { loadEnvFile } from '@cyberskill/shared/config/env';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

import { getEnv } from './src/shared/env/env.util.js';

// https://vitejs.dev/config/
export default defineConfig(() => {
    loadEnvFile();
    const env = getEnv();

    return {
        plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
        server: {
            host: '0.0.0.0',
            port: Number(env.VITE_PORT),
            allowedHosts: [
                'development-admin.secretswingerlust.com',
                'admin.secretswingerlust.com',
            ],
        },
    };
});
