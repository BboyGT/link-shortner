# Sniply

Sniply is a Next.js link shortener with custom short codes, link management, redirects, and click analytics.

## Features

- Create and manage short links.
- Track total clicks, recent clicks, devices, referrers, browsers, and countries.
- Enable or disable links and set optional expiry dates.
- View analytics dashboards for individual links.
- Built with Next.js, React, Prisma, SQLite, Tailwind CSS, and shadcn/ui.

## Local Setup

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

Create a local `.env` file with:

```env
DATABASE_URL="file:./db/custom.db"
```

## Build

```bash
npm run build
```

The build script generates Prisma Client before compiling the Next.js app and copies standalone assets using a cross-platform Node command.

## Creator

Designed and built by [Godstime Aburu](https://github.com/BboyGT), also known as Golden Masathy.
