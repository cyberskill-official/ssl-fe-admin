module.exports = {
    apps: [{
        name: 'ssl-fe-admin',
        cwd: '/home/ubuntu/ssl-fe-admin',
        script: './node_modules/sirv-cli/bin.js',
        args: './build/client --port 8002 --host 0.0.0.0 --single',
        instances: 1,
        exec_mode: 'fork',
        exp_backoff_restart_delay: 100,
        max_memory_restart: '512M',
        env: {
            NODE_ENV: 'production',
            VITE_PORT: 8002,
            PORT: 8002,
        },
    }],
};
