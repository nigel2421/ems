// PM2 Process Manager Configuration for Kuratech EMS
// Deploy to VPS: pm2 start deploy/ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: 'ems-backend',
      script: './server.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        ADMIN_HOSTS: 'ops-konsole.kuratech.site,ops-konsole.localhost',
        EMS_DATA_DIR: '/var/lib/ems'
      },
      error_file: '/var/log/ems/backend-err.log',
      out_file: '/var/log/ems/backend-out.log',
      time: true
    }
  ]
};
