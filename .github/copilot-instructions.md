# Marker Web — Copilot Instructions

This repo is a Next.js 15 (app‑router) full‑stack web app with built‑in
internationalization and a MongoDB backend.  AI agents should treat it as a
single project; there is no separate server repository.  Read the sections
below before creating or editing code.

---
## Getting started 🔧

1. **Install** dependencies (pnpm is primary, `npm`/`yarn` also work):
   ```bash
   pnpm install
   ```
2. **Configure environment**: copy `MONGODB_URI` into `.env.local`.
   - current example: `mongodb://localhost:27017/marker_web`.
   - `JWT_SECRET` is optional (fallback `"gagooooooo"`).
3. **Run dev server**:
   ```bash
   pnpm dev         # uses "cross-env NODE_OPTIONS=--no-warnings next dev --turbopack"
   ```
   Page reloads automatically.  Build/prod commands are
   `pnpm build` and `pnpm start`.
4. **Linting**: `pnpm lint` runs `next lint` with the default config.

> No tests are included at present; feel free to add them, but don’t expect
> any jest/playwright configuration out of the box.

---
## High‑level architecture 🏗️

- **Frontend** lives in `src/app` (Next.js app router).  Most files are server
  components by default; add `"use client"` at the top of any component that
  uses React state/hooks or browser APIs.
- **API** endpoints live under `src/app/api/*/route.js`.
  - export async functions `GET`, `POST`, etc.
  - use `import clientPromise from "@/app/lib/mongodb"` to get a connected
    MongoClient.  Sample endpoints are in `src/app/api/auth`, `user`, `event`,
    `task`.
  - Authentication is handled by a `session` collection; most routes read
    `request.headers.get('authorization')` (sometimes `'imtoken'`) and look up
    the token there.  Return `NextResponse.json` or `Response.json` with a
    `{error: ...}` object and appropriate status code.
- **Database models** are simple JS classes in `src/models` (e.g.
  `User.js`, `EventModel.js`).  Instantiate them before inserting into Mongo.
- **Client utilities**:
  - `src/app/lib/api/axios.js`: axios instance with a request interceptor that
    adds a `Authorization` header from `localStorage.marker_im_token`.
  - `src/app/lib/api/call.js`: `useApiCall` hook wrapping axios; clears token
    + redirects to `/` on 401.
  - `src/app/lib/user/UserManager.js`: singleton for fetching the current user.

- **Localization** handled via `next-intl`:
  - config in `src/i18n/routing.js` & `navigation.js`.
  - middleware in `src/middleware.js` matches `/(ru|en|arm)/:path*`.
  - messages live in `messages/{en,ru,arm}.json`.
  - every top‑level layout (e.g. `[locale]/(page)/auth/layout.js` and
    `[locale]/(page)/(main)/layout.js`) calls `getMessages`/`setRequestLocale`
    and wraps children in `NextIntlClientProvider`.
  - to add a locale, update `routing.locales` and add a corresponding messages
    file.

- **Routing conventions**:
  - Use the `routing` helpers exported from `src/i18n/navigation.js` (e.g.
    `Link`, `redirect`, `usePathname`, `useRouter`) when pushing URLs so they
    stay localized.
  - The folder structure uses optional segments `(page)`, `(main)`, etc. to
    group code without affecting the URL.  Place human‑readable `page.js` under
    the final segment.
  - All public pages are nested under a `[locale]` dynamic segment; the
    first path segment must be one of the configured locales.

- **Styling**: SCSS modules (`*.module.scss`) are used everywhere.  Global
  styles are in `src/app/global.scss`; import it in every layout file with
  relative path (e.g. `import "../../global.scss"`).

- **Static assets** are served from `public/`.  Common paths:
  - `/uploads/profiles/...` for user avatars (default image used if missing).
  - `/uploads/slider/*` for homepage slider images.
  - `/images/logo/*` for logos.
  If you add new images, simply drop them in `public` and reference by
  absolute path.

---
## Front‑end patterns 📦

- Guarded pages include `<AuthRedirect locale={locale} />` at the top of the
  layout.  That component reads `marker_im_token` from `localStorage` and
  redirects to `/[locale]/auth/login` if missing.
- Keep all network calls inside hooks or managers.  Prefer `useApiCall` or
  reuse `UserManager.getUser()` instead of calling `axios` directly.
- When you need the current locale or pathname in client components, use
  `usePathname()` / `useRouter()` from `next/navigation` (not `next/router`).
- `useTransition` is used in `LanguageSwitcher` to avoid blocking UI when
  switching languages.
- Token storage key is `marker_im_token`.  The value is obtained from the login
  endpoint and should be stored in `localStorage` (see
  `[locale]/(page)/auth/login/scripts.js`).

---
## API guidelines 🛠️

- Always wrap database code in `try { ... } catch (error) { console.error();
  return ... }` and return a JSON error with status 500.
- Use `const client = await clientPromise; const db = client.db("marker");`
  then `db.collection("user")` etc.
- Authentication token logic is duplicated across routes; new endpoints
  should follow existing patterns.
- Response helpers:
  ```js
  import { NextResponse } from "next/server";
  return NextResponse.json({foo: "bar"}, {status: 200});
  ```
  Some legacy files use `Response.json`; both work, but mimic the style of the
  file you're editing.
- When inserting/updating documents, instantiate the appropriate model class
  (e.g. `new User(body)`), set additional fields with helper methods, then
  `insertOne` or `updateOne`.

---
## Project conventions & gotchas ⚠️

- **Imports** should use the `@/` alias rather than long relative paths.
- **No TypeScript**: all files are plain `.js`.  Don’t convert to `.ts` unless
  you’re prepared to update `jsconfig.json` and `next.config.mjs`.
- **React hooks** and browser APIs are only available in client components.
  Add the `"use client"` directive at the top of any file that uses state, effects,
  `next/navigation` or other browser-only APIs. Server components must not
  import client‑only modules such as `window`, `localStorage` or `next/router`.

- **Token header inconsistency**: older routes sometimes read `'imtoken'`
  instead of the standard `Authorization` header. Follow the style of the
  route you're editing; both will be accepted by the frontend helpers.

- **Error handling**: client code expects an object with an `error` key when
  status ≥400. Avoid throwing unstructured errors from API routes.

- **Model imports**: use the class name exported in the file. (A few existing
  routes have typos like `EventMmodel` – copy the correct name.)

- **Empty folders**: `src/app/scripts` holds helper utilities; add new
  functions here if they are pure JavaScript. These are consumed by UI
  components (e.g. `ColorSelector`).

- **No tests**: there are no automated tests yet.  If you add tests, make
  sure to update `package.json` scripts and document them in this file.

---

## When you’re done 📝

- Run `pnpm lint` and verify that your code follows eslint rules.
- Start the dev server and manually exercise any new pages or API routes.
- Double‑check locale support by switching languages (`/en`, `/ru`, `/arm`).
- Push a branch with a descriptive name; we don’t enforce a specific
  workflow but small, self‑contained PRs are appreciated.

*If any of the above is unclear or appears outdated, please let me know so I
can improve this guide.*
