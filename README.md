# BeOnTime

A React-based task manager built with Vite. Create and organize tasks, set due dates and reminders, and track weekly completion.

## Features

- Create, edit, delete, complete, and reorder tasks
- Organize tasks into Personal, Work, and Shopping categories
- Set due dates and reminders, with in-app alerts and browser notifications
- View weekly task analytics and load sample data
- Switch between light and dark themes
- Install as a Progressive Web App (PWA) and use cached app assets offline
- Save tasks in browser local storage

Tasks are stored locally in the browser and are not synced to an account or across devices. West Africa Time reminders can be delivered by Vercel Cron when the app is closed, provided background notifications are configured. Browser notifications require permission and browser support.

All task dates, due dates, and reminders use West Africa Time (WAT, `Africa/Lagos`), regardless of the device's timezone.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Getting started

Clone the repository and install dependencies:

```bash
git clone https://github.com/bams634472/To_do_list_App.git
cd To_do_list_App
npm ci
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:3000`).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint the application source |

## Environment variables

No environment variables are required for local development. Configure the server-side values in `.env.example` in your Vercel project to enable background notifications; do not rename them with a `VITE_` prefix, because client-side variables are included in the browser build.

## Background notifications on Vercel

Background reminders require an HTTPS deployment on Vercel, an Upstash Redis database, and browser notification permission. The app syncs reminder text and times with Redis so Vercel Cron can send Web Push notifications once per minute even while the app is closed.

1. Create an Upstash Redis database and add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the Vercel project environment.
2. Generate VAPID keys with `npx web-push generate-vapid-keys`. Add the public and private keys as `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. Set `VAPID_SUBJECT` to a contact address, for example `mailto:you@example.com`.
3. Set `CRON_SECRET` to a long random secret in Vercel. Vercel uses it to authorize the scheduled reminder endpoint.
4. Deploy the project to Vercel. The schedule in `vercel.json` runs `/api/cron/reminders` every minute; use a Vercel plan that supports per-minute cron schedules.
5. Open the deployed app over HTTPS and enable browser notifications. The app will subscribe the browser and sync its pending reminders.

The public VAPID key is returned by the server to the browser; never expose `VAPID_PRIVATE_KEY` or the Upstash token. Reminder text, scheduled times, and the browser push subscription are stored in Upstash. Local Vite development does not run the Vercel API or Cron functions, so background push delivery must be tested on a Vercel deployment.

Background push availability depends on browser support and notification permission. On iOS, install the site to the Home Screen before enabling push notifications.
