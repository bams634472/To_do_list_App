# To Do List App

A React-based task manager built with Vite. Create and organize tasks, set due dates and reminders, and track weekly completion.

## Features

- Create, edit, delete, complete, and reorder tasks
- Organize tasks into Personal, Work, and Shopping categories
- Set due dates and reminders, with in-app alerts and optional browser notifications
- View weekly task analytics and load sample data
- Switch between light and dark themes
- Install as a Progressive Web App (PWA) and use cached app assets offline
- Save tasks in browser local storage

Tasks are stored locally in the browser and are not synced to an account or across devices. Reminder checks run while the app is open. Browser notifications require permission and browser support.

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

No environment variables are required for local development. Use `.env.example` as a template if you add client-side Vite variables; names must start with `VITE_`. Do not put secrets in client-side environment variables, because they are included in the browser build.
