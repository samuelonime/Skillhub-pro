const cron = require('node-cron');
const { runJobScout } = require('../routes/jobScout');

const SCHEDULE = process.env.JOB_SCOUT_CRON || '0 6 * * *'; // 06:00 daily

function startJobScoutCron() {
  if (process.env.JOB_SCOUT_DISABLED === 'true') {
    console.log('[JobScout Cron] Disabled via JOB_SCOUT_DISABLED=true');
    return;
  }

  cron.schedule(SCHEDULE, async () => {
    console.log(`[JobScout Cron] Triggering scout run at ${new Date().toISOString()}`);
    try {
      await runJobScout();
    } catch (e) {
      console.error('[JobScout Cron] Run failed:', e);
    }
  }, {
    timezone: 'Africa/Lagos',
  });

  console.log(`[JobScout Cron] Scheduled with pattern "${SCHEDULE}" (Africa/Lagos)`);
}

module.exports = { startJobScoutCron };
