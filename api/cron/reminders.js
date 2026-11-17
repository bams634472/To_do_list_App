import {
  configureWebPush,
  getSentKey,
  redisCommand,
  redisPipeline,
  sendNotification,
} from '../../server/push.js';

const DEVICE_KEY_PATTERN = 'beontime:device:*';
const MAX_DEVICES_PER_RUN = 500;
const MAX_DELIVERIES_PER_RUN = 200;
const CRON_CURSOR_KEY = 'beontime:cron:cursor';

const isAuthorized = (req) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.authorization === `Bearer ${secret}`;
};

const loadDevices = async () => {
  const devices = [];
  let cursor = (await redisCommand('GET', CRON_CURSOR_KEY)) || '0';
  let pages = 0;

  while (pages < 5 && devices.length < MAX_DEVICES_PER_RUN) {
    const result = await redisCommand('SCAN', cursor, 'MATCH', DEVICE_KEY_PATTERN, 'COUNT', 100);
    cursor = result[0];
    pages += 1;
    const keys = result[1];
    if (keys.length) {
      const records = await redisPipeline(keys.map((key) => ['GET', key]));
      keys.forEach((key, index) => {
        if (records[index]) {
          try {
            devices.push({ key, ...JSON.parse(records[index]) });
          } catch (error) {
            console.error(`Invalid reminder data at ${key}:`, error);
          }
        }
      });
    }
    if (cursor === '0') break;
  }

  await redisCommand('SET', CRON_CURSOR_KEY, cursor);
  return devices.slice(0, MAX_DEVICES_PER_RUN);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    configureWebPush();
    const devices = await loadDevices();
    const now = Date.now();
    const due = devices.flatMap((device) =>
      (device.events || [])
        .filter((event) => !event.sent && event.timestamp <= now)
        .map((event) => ({ device, event }))
    ).slice(0, MAX_DELIVERIES_PER_RUN);

    if (!due.length) {
      return res.status(200).json({ checked: devices.length, sent: 0 });
    }

    const sentKeys = due.map(({ event }) => getSentKey(event));
    const alreadySent = await redisPipeline(sentKeys.map((key) => ['GET', key]));
    const pending = due.filter((_, index) => !alreadySent[index]);
    const failedSubscriptions = new Set();
    let sent = 0;

    for (let index = 0; index < pending.length; index += 10) {
      const batch = pending.slice(index, index + 10);
      const results = await Promise.allSettled(batch.map(({ device, event }) =>
        sendNotification(
          device.subscription,
          JSON.stringify({
            title: event.title,
            body: event.body,
            tag: event.id,
            url: '/',
          }),
          { TTL: 86400 }
        )
      ));

      const completed = [];
      results.forEach((result, batchIndex) => {
        const { device, event } = batch[batchIndex];
        if (result.status === 'fulfilled') {
          completed.push(['SET', getSentKey(event), '1', 'EX', 31536000]);
          sent += 1;
          return;
        }

        const statusCode = result.reason?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          failedSubscriptions.add(device.key);
        } else {
          console.error(`Push delivery failed for reminder ${event.id}:`, result.reason);
        }
      });

      if (completed.length) await redisPipeline(completed);
    }

    if (failedSubscriptions.size) {
      await redisPipeline([...failedSubscriptions].map((key) => ['DEL', key]));
    }

    return res.status(200).json({
      checked: devices.length,
      attempted: pending.length,
      sent,
      removedSubscriptions: failedSubscriptions.size,
    });
  } catch (error) {
    console.error('Background reminder delivery failed:', error);
    return res.status(500).json({ error: 'Background reminder delivery failed.' });
  }
}
