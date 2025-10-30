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
    restart_delay: 5000, // Wait 5 seconds before restarting
    exp_backoff_restart_delay: 100, // Exponential backoff for restarts
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
