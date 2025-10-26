module.exports = {
  apps: [{
    name: 'chinese-learning-bot',
    script: './bot.js',
    instances: 1,
    exec_mode: 'fork', // Use fork mode instead of cluster for Telegram polling
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    max_restarts: 10, // Limit restarts
    min_uptime: '10s', // Minimum uptime before considered stable
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
