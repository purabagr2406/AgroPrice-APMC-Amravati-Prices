# AgroPrice — Phase 2

AgroPrice is a custom Next.js full-stack product backed by MongoDB Atlas. It currently publishes Amravati APMC market rates and farmer enquiries, with a protected admin rate editor and enquiry inbox. It does not use Supabase.

## Project structure

```text
amravati-apmc-rates/
├── scripts/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── actions.ts
│   │   │   ├── enquiries/
│   │   │   │   ├── actions.ts
│   │   │   │   └── page.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── page.tsx
│   │   ├── enquiries/
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   ├── rates/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── enquiry-form.tsx
│   │   └── save-rates-form.tsx
│   ├── config/
│   │   └── business.ts
│   └── lib/
│       ├── crops.ts
│       ├── date.ts
│       ├── models.ts
│       ├── mongodb.ts
│       └── session.ts
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Run on your computer

### 1. Install requirements

Install Node.js 20.9 or later and create a free MongoDB Atlas account at [mongodb.com/atlas](https://www.mongodb.com/atlas).

### 2. Set up MongoDB Atlas

1. Create a free shared cluster. Choose an available region close to India.
2. In **Database Access**, create a database user with a strong password. This is separate from your Atlas login.
3. In **Network Access**, add `0.0.0.0/0` so Render can connect. Protect access with a unique database username and password; use restricted network access when your plan/host supports it.
4. Choose **Connect → Drivers → Node.js** and copy your cluster connection string. Replace the password placeholder. URL-encode special characters in the password.

### 3. Configure local secrets

Copy `.env.example` to `.env.local` in this folder, then fill in the values:

```env
MONGODB_URI=mongodb+srv://dbuser:YOUR_PASSWORD@cluster.mongodb.net/amravati_apmc?retryWrites=true&w=majority
SESSION_SECRET=at-least-32-random-characters-to-sign-the-admin-session
ADMIN_EMAIL=your-fathers-login-email@example.com
ADMIN_PASSWORD_HASH=your-bcrypt-hash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Generate a password hash from the terminal:

```bash
node -e "require('bcryptjs').hash('Choose-a-long-unique-password', 12).then(console.log)"
```

Paste the printed hash into `ADMIN_PASSWORD_HASH`, escaping every `$` as `\$` in `.env.local` so Next.js does not interpret the hash as environment-variable expansion. Do not store the original password in source code or commit `.env.local`; the `.gitignore` already excludes it.

### 4. Install packages, seed crops, and run

Open a terminal in this `amravati-apmc-rates` folder:

```bash
npm install
npm run seed
npm run dev
```

Visit `http://localhost:3000`, `/rates` for all rates, `/enquiries` to send a farmer enquiry, and `/admin/login` to manage rates and enquiries. Rates display each crop with its per-quintal price range.

The public pages and owner dashboard support English and Marathi using the language control in the header. Rate history is available by date for the latest 90 days. Older rates are removed by a MongoDB TTL index, with a request-time cleanup for records created before TTL expiry was added.

### 5. Publish market price ranges

Log in with the configured admin email and password. In the owner dashboard, add crops, edit their Marathi and English names, and hide or show them on public pages. Hiding a crop preserves its price history. Permanently deleting a crop also deletes its historical rates; saved farmer enquiries are retained without the deleted crop reference.

For active crops, select a date within the last 90 days in the rate form; choosing a date loads only that date's saved prices before editing. Dates without rates start blank. A completely blank crop row is skipped; a partially filled row or a maximum below the minimum is rejected. Publishing updates or creates one record for each crop and date. Public pages show crop names and price ranges without displaying rate-update times. The date-based history lookup falls back to the latest earlier uploaded rates when no rates exist for the selected date and clearly labels both dates.

### Receive farmer enquiries

Farmers can submit their name, 10-digit Indian mobile number, optional crop, and a message at `/enquiries`. The form validates input on the server and saves valid submissions in MongoDB. Log in and open **शेतकरी चौकशी** from the admin rate page to review the latest 100 submissions, call a farmer, mark an enquiry contacted, or close it.

## Deploy to Render

1. Create a GitHub repository and push these project files. Confirm `.env.local` is not committed.
2. In Render, choose **New → Web Service** and connect the repository.
3. Set the build command to `npm install && npm run build` and the start command to `npm start`.
4. Add `MONGODB_URI`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `NEXT_PUBLIC_SITE_URL` under the service's **Environment** settings. Use your Render URL or custom domain for the site URL.
5. Create the web service. Confirm Atlas Network Access allows its requests, then visit the Render URL and test the public rates and admin login.
6. To use a custom domain, add it under the Render service's **Settings → Custom Domains** and follow Render's DNS instructions at your domain registrar. Wait for verification and HTTPS.

The Render free service can sleep while idle and have a cold start when it wakes. MongoDB Atlas free tier also has storage and availability limits. Check current plan details before relying on these plans for business operations.

## How the pieces fit together

- **Next.js App Router** contains both the website and backend actions.
- **MongoDB + Mongoose** save crop details and daily prices.
- **Server Actions** validate login and price submissions on the server.
- **Admin session** is a signed HTTP-only cookie that lasts 12 hours. The admin account is configured using environment variables, so public signup is not available.
- **Market date** is calculated in the `Asia/Kolkata` timezone, not the server's timezone.
- **Farmer enquiries** are submitted through a validated Server Action and are visible only in the authenticated admin inbox.
- **Product and shop details** (AgroPrice branding, shop name, address, phone, and WhatsApp) are grouped in `src/config/business.ts`.

This is a learning-project starting point. Use strong, unique passwords and keep environment secrets private. Crop management, editable business details, CSV export, and PWA support are not included yet.
