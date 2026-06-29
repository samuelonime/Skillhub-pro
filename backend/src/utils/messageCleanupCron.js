const cron = require('node-cron');
const prisma = require('../config/database');

// Delete direct messages older than 24 hours. Runs hourly.
const SCHEDULE = process.env.MESSAGE_CLEANUP_CRON || '0 * * * *'; // top of every hour

async function purgeOldMessages() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    const { count } = await prisma.directMessage.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (count > 0) console.log(`[MessageCleanup] Deleted ${count} message(s) older than 24h`);
  } catch (e) {
    console.error('[MessageCleanup] Failed:', e.message);
  }
}

function startMessageCleanupCron() {
  // Run once shortly after boot to clear any backlog, then on schedule
  setTimeout(() => { purgeOldMessages().catch(() => {}); }, 30 * 1000);

  cron.schedule(SCHEDULE, () => {
    purgeOldMessages().catch(e => console.error('[MessageCleanup] Run failed:', e));
  }, { timezone: 'Africa/Lagos' });

  console.log(`[MessageCleanup] Scheduled with pattern "${SCHEDULE}" (24h message expiry)`);
}

module.exports = { startMessageCleanupCron, purgeOldMessages };