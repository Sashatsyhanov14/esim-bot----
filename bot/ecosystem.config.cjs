module.exports = {
  apps: [
    {
      name: 'esim-bot-ru',
      script: 'server.js',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
