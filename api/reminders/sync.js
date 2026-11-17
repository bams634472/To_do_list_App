import { createHash } from 'node:crypto';
import {
  getDeviceKey,
  redisCommand,
  configureWebPush,
} from '../../server/push.js';

const MAX_EVENTS = 500;
const MAX_TASK_TEXT = 300;
const MAX_SYNCS_PER_HOUR = 120;

const isAllowedPushEndpoint = (endpoint) => {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.port || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    return host === 'fcm.googleapis.com'
      || host === 'updates.push.services.mozilla.com'
      || host === 'web.push.apple.com'
      || host.endsWith('.push.apple.com')
      || host.endsWith('.notify.windows.com')
      || host.endsWith('.notify.live.net');
  } catch {
    return false;
  }
};

const checkSyncRateLimit = async (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
    ?.split(',')[0]
    ?.trim() || 'unknown';
  const ipHash = createHash('sha256').update(clientIp).digest('hex');
  const key = `beontime:rate:${ipHash}`;
  const count = await redisCommand('INCR', key);
  if (count === 1) await redisCommand('EXPIRE', key, 3600);
  return count <= MAX_SYNCS_PER_HOUR;
};

const parseBody = (body) => {
  if (typeof body === 'string') return JSON.parse(body);
  if (Buffer.isBuffer(body)) return JSON.parse(body.toString('utf8'));
  return body;
};

const isValidSubscription = (subscription) => {
  if (!subscription || typeof subscription !== 'object') return false;
  if (typeof subscription.endpoint !== 'string' || subscription.endpoint.length > 2048) return false;
  try {
    return isAllowedPushEndpoint(subscription.endpoint)
      && typeof subscription.keys?.p256dh === 'string'
      && typeof subscription.keys?.auth === 'string';
  } catch {
    return false;
  }
};

const isValidEvent = (event) => (
  event &&
  typeof event.id === 'string' &&
  event.id.length > 0 &&
  event.id.length <= 500 &&
  typeof event.title === 'string' &&
  event.title.length > 0 &&
  event.title.length <= 120 &&
  typeof event.body === 'string' &&
  event.body.length <= MAX_TASK_TEXT + 180 &&
  Number.isSafeInteger(event.timestamp) &&
  event.timestamp > 0
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  let payload;
  try {
    payload = parseBody(req.body);
  } catch {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }

  const { subscription, events } = payload || {};
  if (!isValidSubscription(subscription)) {
    return res.status(400).json({ error: 'A valid browser push subscription is required.' });
  }
  if (!Array.isArray(events) || events.length > MAX_EVENTS || !events.every(isValidEvent)) {
    return res.status(400).json({ error: `Provide no more than ${MAX_EVENTS} valid reminder events.` });
  }

  try {
    configureWebPush();
    if (!(await checkSyncRateLimit(req))) {
      return res.status(429).json({ error: 'Too many reminder updates. Try again later.' });
    }
    const key = getDeviceKey(subscription.endpoint);
    const existing = await redisCommand('GET', key);
    let oldEvents = [];
    if (existing) {
      try {
        oldEvents = JSON.parse(existing).events || [];
      } catch {
        console.error('Replacing invalid stored reminder data for device.');
      }
    }

    const oldById = new Map(oldEvents.map((event) => [event.id, event]));
    const nextEvents = events.map((event) => {
      const old = oldById.get(event.id);
      return {
        ...event,
        sent: Boolean(old?.sent && old.timestamp === event.timestamp),
      };
    });

    const record = JSON.stringify({ subscription, events: nextEvents });
    await redisCommand('SET', key, record);
    return res.status(200).json({ synced: nextEvents.length });
  } catch (error) {
    console.error('Reminder sync failed:', error);
    return res.status(503).json({ error: 'Unable to save background reminders right now.' });
  }
}
