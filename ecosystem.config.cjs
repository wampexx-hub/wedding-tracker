module.exports = {
    apps: [{
        name: 'wedding-tracker-server',
        script: './server/server.js',
        cwd: '/var/www/wedding-tracker',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 3001
        },
        error_file: './server/logs/error.log',
        out_file: './server/logs/out.log',
        log_file: './server/logs/combined.log',
        time: true,
        merge_logs: true,
        kill_timeout: 5000
    }]
};
