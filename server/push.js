import { createHash } from 'node:crypto';
import { sendNotification, setVapidDetails } from 'web-push';

const KEY_PREFIX = 'beontime:device:';
const SENT_PREFIX = 'beontime:sent:';

export const getRedisConfig = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured.');
  }
  return { url: url.replace(/\/$/, ''), token };
};

const redisRequest = async (command) => {
  const { url, token } = getRedisConfig();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) {
    throw new Error(`Upstash Redis returned HTTP ${response.status}.`);
  }
  const result = await response.json();
  if (result.error) {
    throw new Error(`Upstash Redis command failed: ${result.error}`);
  }
  return result.result;
};

export const redisCommand = (...command) => redisRequest(command);

export const redisPipeline = async (commands) => {
  if (!commands.length) return [];
  const { url, token } = getRedisConfig();
  const response = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });
  if (!response.ok) {
    throw new Error(`Upstash Redis pipeline returned HTTP ${response.status}.`);
  }
  const results = await response.json();
  const failed = results.find((result) => result.error);
  if (failed) {
    throw new Error(`Upstash Redis pipeline command failed: ${failed.error}`);
  }
  return results.map((result) => result.result);
};

export const getDeviceKey = (endpoint) => {
  const hash = createHash('sha256').update(endpoint).digest('hex');
  return `${KEY_PREFIX}${hash}`;
};

export const getSentKey = (event) => {
  const hash = createHash('sha256')
    .update(`${event.id}:${event.timestamp}`)
    .digest('hex');
  return `${SENT_PREFIX}${hash}`;
};

export const configureWebPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
  if (!publicKey || !privateKey) {
    throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be configured.');
  }
  setVapidDetails(subject, publicKey, privateKey);
  return publicKey;
};

export { sendNotification };
