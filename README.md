# Marker Web

Marker Web is a localized Next.js App Router project for personal scheduling, profile/network management, chat, posts, and a small static admin area. This README is the working documentation for the project and should be kept current whenever pages, components, API routes, shared conventions, or data contracts change.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Required environment:

```bash
MONGODB_URI=<mongodb connection string>
JWT_SECRET=<optional jwt secret, defaults in code if omitted>
```

Scripts:

```bash
npm run dev      # next dev --turbopack with NODE_OPTIONS=--no-warnings
npm run build    # production build
npm run start    # start built app
npm run lint     # configured package script
npm run swagger:check # verify API routes are documented in Swagger
```

The repo currently contains both `package-lock.json` and `pnpm-lock.yaml`. Do not churn either lockfile unless a dependency actually changes.

## Codex Working Instructions

- Read this README before making project changes. Treat it as the first source for local standards and architecture.
- When adding, moving, or deleting frontend routes/components, update the "Frontend Structure" section.
- When adding, changing, or deleting API routes, update `src/app/lib/swagger/openapi.json`, run `npm run swagger:check`, and update the "Backend API" section like a lightweight Swagger catalog.
- Prefer existing utilities and contracts over new abstractions: `useApiCall`, `ColorSelector`, SCSS variables, popup provider, admin UI primitives, and model classes.
- Preserve existing route and field spellings unless intentionally migrating them. Existing names include `Schadule*`, `reciver`, and the admin alias route `/admin/apperiance`.
- Do not introduce unrelated refactors while making feature changes. Keep edits scoped to the relevant route, component, model, styles, and translations.
- Protected user API calls expect the raw token as the `Authorization` header value, without a `Bearer` prefix.
- Admin API calls use `x-marker-admin-auth: authenticated`; this is separate from user auth.
- For multipart uploads, use `fetch` with `FormData` and do not set `Content-Type` manually.

## Tech Stack

- Next.js `15.1.7` App Router
- React `19`
- `next-intl` for route localization and translations
- MongoDB native driver
- `bcryptjs` for password hashing
- `jsonwebtoken` for login/register token creation
- `axios` for JSON API calls
- Sass modules for component styling
- Swiper for the homepage slider

Path aliases:

```json
"@/*": ["./src/*"]
```

## Project Standards

### Routing And Localization

- Localized pages live under `src/app/[locale]`.
- Supported locales are `en`, `ru`, and `arm`; the default locale is `en`.
- `src/middleware.js` applies `next-intl` middleware to `/` and localized routes.
- Translations live in `messages/en.json`, `messages/ru.json`, and `messages/arm.json`.
- Each message file currently contains the same top-level namespaces: `Login`, `AuthLayout`, `Registration`, `Global`, `Dashboard`, `NetworkWidget`, `NetworkPage`, `ProfilePage`, `Pages`, `SchedulePage`, `CreateTask`, `CreatePost`, `TasksWidget`, `TaskCard`, `Form`, and `Admin`.
- Use `useTranslations` in client components and `getTranslations` in server components.

### Layout Families

The frontend has three main layout families:

- Web app: `src/app/[locale]/(page)/(main)/layout.js`
  - Imports global styles.
  - Validates locale.
  - Wraps content in `NextIntlClientProvider`.
  - Adds `PopupProvider`, `AuthRedirect`, `Header`, and the main layout container.
  - Use this family for authenticated user-facing product pages.
- Auth: `src/app/[locale]/(page)/auth/layout.js`
  - Uses the auth visual shell with `LanguageSwitcher`.
  - Runs `AuthRedirect`.
  - Use this family for login, registration, and future public auth flows.
- Admin: `src/app/[locale]/admin/layout.js`
  - Uses `AdminShell`.
  - Uses localStorage admin auth, not user session auth.
  - Use this family for static admin pages.

### Styling

Shared style primitives live in `src/styles` and global CSS variables live in `src/app/global.scss`.

- `src/styles/_variables.scss`
  - Color variables: `$g-color1` through `$g-color19`.
  - Background color helper: `$bg-color10`.
  - Breakpoints: `$mobile`, `$mobileLarge`, `$tablet`, `$tabletLarge`, `$desktop`, `$desktopLarge`.
- `src/styles/_mixins.scss`
  - Breakpoint mixins: `mobile`, `mobile-large`, `tablet`, `tablet-large`, `desktop`, `desktop-large`.
  - Height mixins: `max-height`, `min-height`.
- `src/styles/_functions.scss`
  - `mediaMin($width)`, `mediaMax($width)`.
  - `fluid($property, $mobile, $mobileLarge, $tablet, $tabletLarge, $desktop, $desktopLarge)`.
- `src/styles/_fonts.scss`
  - Typography utility classes: `.t1` through `.t7`, `.btnL`, `.btnM`.
- `src/app/global.scss`
  - Defines CSS custom properties matching the SCSS color and breakpoint variables.
  - Registers the local `MontserratArm` font family.

Use SCSS modules for component styles: `Component.module.scss`. Import only what the file needs, for example:

```scss
@import "../../../../../styles/variables";
@import "../../../../../styles/functions";
@import "../../../../../styles/fonts";
```

Color rules:

- In SCSS, prefer `$g-color*` or `var(--g-color*)`.
- In JavaScript, use `ColorSelector("--g-color13")` from `src/app/scripts/HelperFunctions/colorSelector.js`.
- Keep the fallback map in `ColorSelector` synchronized with `global.scss` and `_variables.scss` when adding colors.

### UI Components

Use existing shared UI before creating new controls.

- Buttons: `src/app/components/util/buttons/MarkerButton/Button.js`
  - Supports sprite icons from `/public/images/sprites.svg`.
  - Use `bgColor`, `textColor`, and `shadowColor` from `ColorSelector`.
  - `casual` adds the project shadow style.
- Generic config form: `src/app/components/util/form/Form.js`
  - Used by auth forms.
  - Accepts `fields` configs with `field`, `name`, `label`, `value`, `size`, `align`, and field-specific options.
- Form controls:
  - `TextInput`, `SelectField`, `Checkbox`, `Radio`, `Switch`, `TimeInput`, `DatePicker`, `MonthdaySelector`, `WeekdaySelector`, `ColorPicker`, `TagSelect`, `LinkButton`.
  - Most project form controls call `onChange(name, value)`.
- Tabs: `src/app/components/util/tabs/TabNavigation/TabNavigation.js`.
- Admin UI primitives: `src/app/components/admin/AdminUI.js`
  - `AdminPageHeader`, `AdminPanel`, `AdminButton`, `AdminStatusMessage`, `AdminFormGrid`, `AdminTextField`, `AdminSelectField`, `AdminCheckboxField`.
  - Use these for admin screens instead of duplicating admin form/card styles.

### Popups

All user-facing popups go through `PopupProvider`:

```jsx
const {openPopup, closePopup} = usePopup();
openPopup(<CreateEvent onSaved={reloadTasks} />);
```

Popup system files:

- `PopupProvider`: global overlay, portal, `openPopup(content)`, `closePopup()`.
- `ConfirmPopup`: reusable async confirmation popup.
- `CreateEvent`: create/edit task popup.
- `CreatePost`: create/edit post popup with image upload.

The web layout already wraps pages in `PopupProvider`. New popup content should call `closePopup` itself after success/cancel, or rely on the existing popup component behavior.

### API Client And Auth

JSON requests should usually use `src/app/lib/api/call.js`:

```js
const apiCall = useApiCall();
const response = await apiCall("post", "/task/add-task", body);
```

`src/app/lib/api/axios.js`:

- Uses `baseURL: "/api"`.
- Adds `Authorization` from `localStorage.getItem("marker_im_token")`.

`useApiCall`:

- Returns `{success: true, data}` on success.
- Returns `{success: false, error}` on failure.
- On `401`, removes `marker_im_token` and redirects to `/`.

Auth/session conventions:

- User token localStorage key: `marker_im_token`.
- User API auth header: `Authorization: <token>`.
- User sessions are stored in MongoDB collection `session`.
- Admin localStorage key: `marker-admin-auth`.
- Admin localStorage/header value: `authenticated`.
- Admin API auth header: `x-marker-admin-auth: authenticated`.

Browser events used as lightweight refresh signals:

- `marker:user-updated`: header/profile consumers update cached user/avatar.
- `marker:tasks-updated`: schedule/widgets reload tasks.
- `marker:posts-updated`: post consumers can reload posts.

LocalStorage keys:

- `marker_im_token`: user session token.
- `marker-admin-auth`: admin shell auth marker.
- `marker-admin-homepage-slider`: admin-managed homepage slider configuration.

### Swagger

- Swagger UI route: `/api-doc`.
- Swagger source file: `src/app/lib/swagger/openapi.json`.
- Swagger generator: `src/app/lib/swagger.js` uses `next-swagger-doc` and the central OpenAPI definition.
- Swagger UI client component: `src/app/api-doc/react-swagger.js`.
- Every `src/app/api/**/route.js` path must exist in `openapi.json`.
- Every exported HTTP method in a route file must be documented under that path.
- Run `npm run swagger:check` after API changes; it fails when route files and Swagger drift apart.

### Data And MongoDB

MongoDB database name: `marker`.

Collections currently used:

- `user`
- `session`
- `tasks`
- `tag`
- `events`
- `posts`
- `message`

Model classes live in `src/models`:

- `User`: registration/user profile base fields.
- `Session`: userId, active flag, token, createdAt.
- `TaskModel`: task/schedule data including repeat settings, tags, color, privacy, date.
- `EventModel`: legacy event data.
- `PostModel`: task post data and media paths.
- `Message`: sender, `reciver`, content, time.
- `Tag`: name, usage, createdAt.

Uploads:

- Profile images: `public/uploads/profiles`.
- Default profile images: `public/uploads/profiles/default`.
- Post media: `public/uploads/posts/<postId>`.
- Accepted image types for uploads: JPEG, PNG, WEBP, GIF.
- Current max image size for profile/post uploads: 5 MB.

## Frontend Structure

Update this section whenever frontend pages, route groups, or major components change.

```text
src/app
  global.scss
  [locale]/
    (page)/
      (main)/
        layout.js
        (home)/page.js
        events/page.js
        schedule/page.js
        schedule/components/
          SchaduleGlobalInfo/
          DailySchadule/
          MonthlySchadule/
          WeeklySchadule/
          YearlySchadule/
          scripts/scheduleUtils.js
        network/page.js
        network/components/
          Chat/
          Schedule/
        profile/page.js
        profile/[userId]/page.js
        profile/components/ProfileContent/
      auth/
        layout.js
        login/
        registration/
    admin/
      layout.js
      page.js
      _components/AdminShell.js
      login/
      users/
      events/
      appearance/
      apperiance/page.js
  components/
    admin/
    layout/header/
    overlays/popup/
    util/
    widgets/
    RecEventsSlider/
  api/
```

### User Web Routes

- `/{locale}` or `/{locale}/`
  - File: `src/app/[locale]/(page)/(main)/(home)/page.js`
  - Dashboard/home page.
  - Renders homepage slider, greeting, create task button, network widget, and common tasks widget.
  - Slider config is read from `marker-admin-homepage-slider`; defaults to `/uploads/slider/1.png` through `/uploads/slider/5.png`.
- `/{locale}/events`
  - File: `src/app/[locale]/(page)/(main)/events/page.js`
  - Placeholder page that renders translated `Pages.events`.
- `/{locale}/schedule`
  - File: `src/app/[locale]/(page)/(main)/schedule/page.js`
  - Full task schedule workspace.
  - Loads current user's tasks from `/api/task/get-user-task`.
  - Views: year, month, week, day. Month view is hidden on tablet-large screens and below.
  - Uses `SchaduleGlobalInfo`, `YearlySchadule`, `MonthlySchadule`, `WeeklySchadule`, `DailySchadule`, `CommonTasksWidget`, and `scheduleUtils`.
- `/{locale}/network`
  - File: `src/app/[locale]/(page)/(main)/network/page.js`
  - User network, search, and selected-user workspace.
  - Left panel lists existing connections and search results.
  - Dashboard tabs: chat, posts, schedule, profile.
  - Chat uses `/api/message/*`.
  - Schedule reuses the schedule components against `/api/task/get-user-task?userId=<id>`.
  - Profile tab embeds `ProfileContent`.
- `/{locale}/profile`
  - File: `src/app/[locale]/(page)/(main)/profile/page.js`
  - Current user's profile page.
- `/{locale}/profile/[userId]`
  - File: `src/app/[locale]/(page)/(main)/profile/[userId]/page.js`
  - Shared profile view for another user.
  - Uses the same `ProfileContent` component.

### Auth Routes

- `/{locale}/auth/login`
  - Files: `page.js`, `scripts.js`.
  - Uses the generic `Form` component.
  - Calls `/api/auth/login`.
  - Stores `marker_im_token` and redirects to `/` on success.
- `/{locale}/auth/registration`
  - Files: `page.js`, `scripts.js`.
  - Two-step registration/confirmation UI using the generic `Form`.
  - Calls `/api/auth/register`.
  - Stores `marker_im_token` and redirects to `/` on success.

### Admin Routes

- `/{locale}/admin`
  - File: `src/app/[locale]/admin/page.js`
  - Static dashboard summary.
- `/{locale}/admin/login`
  - File: `src/app/[locale]/admin/login/LoginForm.js`
  - Static admin login.
  - Calls `/api/admin/auth/login`, then stores `marker-admin-auth=authenticated`.
- `/{locale}/admin/users`
  - File: `src/app/[locale]/admin/users/UsersPanel.js`
  - Search/paginate users, edit profile fields/settings/password, upload profile image.
  - Uses admin API headers.
- `/{locale}/admin/events`
  - Placeholder admin section.
- `/{locale}/admin/appearance`
  - File: `src/app/[locale]/admin/appearance/AppearancePanel.js`
  - LocalStorage editor for homepage slider images.
- `/{locale}/admin/apperiance`
  - Typo alias that redirects to `/{locale}/admin/appearance`.

### Shared Frontend Components

- `components/layout/header/Header.js`
  - Main web nav, language switcher, user avatar, profile/login navigation.
  - Reads cached user through `UserManager`.
- `components/util/AuthRedirect/AuthRedirect.js`
  - Redirects unauthenticated users to `/{locale}/auth/login` outside auth pages.
- `components/util/LanguageSwitcher/LanguageSwitcher.js`
  - Switches locale by replacing the first pathname segment.
- `components/RecEventsSlider/RecEventsSlider.js`
  - Swiper autoplay slider used on the home page.
- `components/widgets/Network/Network.js`
  - Small home sidebar widget for connections.
- `components/widgets/tasks/CommonTasksWidget/CommonTasksWidget.js`
  - Next task countdown, today's tasks, edit/delete/post actions.
- `components/widgets/tasks/CommonTasksWidget/TaskCard/`
  - Task card used by the common task widget.
- `components/overlays/popup/CreateEvent/`
  - Create/edit task popup backed by `/api/task/add-task` and `/api/task/update-task`.
- `components/overlays/popup/CreatePost/`
  - Create/edit post popup backed by `/api/post/create-post` and `/api/post/edit-post`.

## Backend API

Base path: `/api`.

Default response style:

- Success responses are JSON unless the endpoint writes files.
- Error responses are usually `{error: string}` with a matching HTTP status.
- User-protected endpoints require `Authorization: <marker_im_token>`.
- Admin-protected endpoints require `x-marker-admin-auth: authenticated`.

### Auth

#### `POST /api/auth/register`

Public user registration. Creates a user, creates a session, returns a token.

Request JSON:

```json
{
  "firstname": "John",
  "login": "john",
  "email": "john@example.com",
  "password": "secret",
  "age": 24,
  "sex": "male",
  "lastname": "Smith",
  "address": "",
  "country": "",
  "city": "",
  "profilePicture": "/uploads/profiles/default/male.png"
}
```

Required: `firstname`, `login`, `password`, `age`, `sex`.

Success `201`:

```json
{
  "message": "User registered successfully",
  "userId": "<objectId>",
  "token": "<jwt>",
  "sessionId": "<objectId>"
}
```

#### `POST /api/auth/login`

Public user login.

Request JSON:

```json
{
  "login": "john",
  "password": "secret"
}
```

Success `200`:

```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "sessionId": "<objectId>"
}
```

#### `/api/auth/check`

Placeholder route file exists, but no HTTP handler is currently implemented.

#### `POST /api/admin/auth/login`

Static admin login. This does not create a server-side admin session.

Request JSON:

```json
{
  "login": "super_user",
  "password": "barev123"
}
```

Success `200`:

```json
{
  "message": "Login successful"
}
```

### Admin Users

#### `GET /api/admin/users`

Admin protected. Lists users with pagination and optional search.

Headers:

```http
x-marker-admin-auth: authenticated
```

Query params:

- `limit`: default `20`, min `1`, max `50`.
- `skip`: default `0`.
- `search`: optional case-insensitive search across firstname, lastname, login, email, country, city.

Success `200`:

```json
{
  "users": [],
  "total": 0,
  "nextSkip": 0,
  "hasMore": false
}
```

Serialized admin user fields: `id`, `firstname`, `lastname`, `name`, `login`, `email`, `age`, `sex`, `address`, `country`, `city`, `profilePicture`, `status`, `timezone`, `publicProfile`, `notifications`, `allowMessages`, `createdAt`.

#### `PATCH /api/admin/users`

Admin protected. Updates an existing user.

Headers:

```http
x-marker-admin-auth: authenticated
Content-Type: application/json
```

Request JSON:

```json
{
  "id": "<userId>",
  "firstname": "John",
  "lastname": "Smith",
  "login": "john",
  "email": "john@example.com",
  "age": 24,
  "sex": "male",
  "address": "",
  "country": "",
  "city": "",
  "profilePicture": "",
  "status": "Active",
  "timezone": "Asia/Yerevan",
  "publicProfile": true,
  "notifications": true,
  "allowMessages": true,
  "password": "optional-new-password"
}
```

Editable fields are defined in `src/app/api/admin/users/_shared.js`.

Success `200`:

```json
{
  "user": {}
}
```

#### `POST /api/admin/users/profile-image`

Admin protected multipart upload for a user's profile image.

Headers:

```http
x-marker-admin-auth: authenticated
```

FormData:

- `id`: user id.
- `image`: image file, JPEG/PNG/WEBP/GIF, max 5 MB.

Success `200`:

```json
{
  "user": {}
}
```

### Profile

#### `GET /api/profile/get-profile`

Loads a profile. Authorization is optional for public lookup, but required when no `userId` is passed because the current session is then used as the target.

Headers:

```http
Authorization: <marker_im_token>
```

Query params:

- `userId`: optional target user id.

Success `200`:

```json
{
  "user": {},
  "currentUser": {},
  "isOwner": false,
  "isFollowing": false
}
```

Serialized profile user fields: `id`, `_id`, `firstname`, `lastname`, `name`, `login`, `email`, `age`, `sex`, `address`, `country`, `city`, `profilePicture`, `status`, `timezone`, `publicProfile`, `notifications`, `allowMessages`, `favoriteTags`, `connections`, `createdAt`.

#### `PATCH /api/profile/update-profile`

User protected. Updates the current user's profile.

Headers:

```http
Authorization: <marker_im_token>
Content-Type: application/json
```

Request JSON accepts profile editable fields:

```json
{
  "firstname": "John",
  "lastname": "Smith",
  "login": "john",
  "email": "john@example.com",
  "age": 24,
  "sex": "male",
  "address": "",
  "country": "",
  "city": "",
  "timezone": "Asia/Yerevan",
  "publicProfile": true,
  "allowMessages": true,
  "notifications": true,
  "favoriteTags": ["work", "fitness"]
}
```

Success `200`:

```json
{
  "user": {}
}
```

#### `POST /api/profile/profile-image`

User protected multipart upload for the current user's profile image.

Headers:

```http
Authorization: <marker_im_token>
```

FormData:

- `image`: image file, JPEG/PNG/WEBP/GIF, max 5 MB.

Success `200`:

```json
{
  "user": {}
}
```

### Users And Network

#### `GET /api/user/get-user`

User protected. Returns the current session user.

Headers:

```http
Authorization: <marker_im_token>
```

Success `200`:

```json
{
  "user": {}
}
```

#### `POST /api/user/get-user-collection`

Fetches a set of users by id. This route currently does not require auth.

Request JSON:

```json
{
  "ids": ["<userId>"]
}
```

Success `200`:

```json
{
  "users": []
}
```

#### `POST /api/user/search-users`

User protected. Searches users excluding the current session user.

Headers:

```http
Authorization: <marker_im_token>
Content-Type: application/json
```

Request JSON:

```json
{
  "query": "john"
}
```

Success `200`:

```json
{
  "users": []
}
```

Empty query returns `users: []`.

#### `POST /api/user/follow-user`

User protected. Adds a user to the current user's `connections`.

Request JSON:

```json
{
  "userId": "<targetUserId>"
}
```

Success `200`:

```json
{
  "user": {},
  "followedUser": {}
}
```

#### `POST /api/user/unfollow-user`

User protected. Removes a user from the current user's `connections`.

Request JSON:

```json
{
  "userId": "<targetUserId>"
}
```

Success `200`:

```json
{
  "user": {}
}
```

### Tags

#### `GET /api/tags`

Public. Lists popular tags.

Query params:

- `query`: optional normalized text search.
- `limit`: default `24`, min `1`, max `50`.

Success `200`:

```json
{
  "tags": [
    {
      "id": "<tagId>",
      "name": "work",
      "usage": 3
    }
  ]
}
```

### Tasks

Task fields used by the current UI:

```json
{
  "title": "Workout",
  "description": "",
  "start": "09:00",
  "end": "10:00",
  "location": "",
  "tags": ["fitness"],
  "repeat": false,
  "repeatType": "daily | weekly | monthly | null",
  "weekdays": ["monday"],
  "monthday": 1,
  "date": "2026-05-24",
  "color": "#FF5D66",
  "isPrivate": true,
  "media": []
}
```

Validation rules:

- `title` is required.
- `start` is required.
- `date` and `monthday` are required except for daily and weekly repeats.
- `repeatType` is required when `repeat` is true.
- Weekly repeat requires at least one `weekdays` value.
- Monthly repeat requires `monthday`.

#### `GET /api/task/get-user-task`

User protected. Loads current user's tasks or another user's tasks.

Headers:

```http
Authorization: <marker_im_token>
```

Query params:

- `userId`: optional target user id. Defaults to current user.

Success `200`:

```json
{
  "tasks": []
}
```

Task serialization includes string `_id`, string `userId`, `tagIds`, and serialized `tags`. If a task is private and belongs to another user, private fields are hidden: `title`, `description`, `location`, `tags`, `tagIds`, `media`, and `color`.

#### `POST /api/task/add-task`

User protected. Creates a task and adds the task id to the user's `tasks` array.

Request JSON: task fields listed above.

Success `200`:

```json
{
  "message": "Task added successfully",
  "taskId": "<taskId>"
}
```

#### `POST /api/task/update-task`

User protected. Updates a task owned by the current user.

Request JSON:

```json
{
  "taskId": "<taskId>",
  "...": "task fields"
}
```

`_id` is also accepted instead of `taskId`.

Success `200`:

```json
{
  "message": "Task updated successfully"
}
```

#### `POST /api/task/delete-task`

User protected. Deletes a task owned by the current user and removes the id from the user.

Request JSON:

```json
{
  "taskId": "<taskId>"
}
```

`_id` is also accepted instead of `taskId`.

Success `200`:

```json
{
  "message": "Task deleted successfully"
}
```

### Events

Events are legacy compared with the current task-based schedule UI.

#### `POST /api/event/create-event`

User protected. Creates a legacy event in the `events` collection.

Request JSON:

```json
{
  "title": "Event",
  "description": "",
  "start": "",
  "end": "",
  "location": "",
  "tags": [],
  "isPrivate": false,
  "media": []
}
```

Success `200` currently returns:

```json
{
  "error": "Event Added Successfully"
}
```

The success message is currently stored under the `error` key; preserve or migrate carefully.

#### `GET /api/event/get-user-events`

User protected. Loads legacy events.

Query params:

- `userId`: optional. Without it, returns current user's events. With it, returns non-private events for the target.

Success `200`:

```json
[]
```

### Posts

Post uploads use multipart `FormData` because media files are supported.

Rules:

- A post must belong to a task owned by the current user.
- `title` is required.
- Up to 4 images.
- Each image must be JPEG/PNG/WEBP/GIF and smaller than 5 MB.
- Media paths are written under `public/uploads/posts/<postId>/`.

#### `POST /api/post/create-post`

User protected. Creates a post for an owned task.

Headers:

```http
Authorization: <marker_im_token>
```

FormData:

- `task` or `taskId`: owned task id.
- `title`: required.
- `description`: optional.
- `media`: optional repeated image files.

Success `201`:

```json
{
  "post": {
    "_id": "<postId>",
    "task": "<taskId>",
    "title": "Post title",
    "description": "",
    "media": [],
    "userId": "<userId>",
    "createdAt": "2026-05-24T00:00:00.000Z",
    "updatedAt": "2026-05-24T00:00:00.000Z"
  }
}
```

#### `POST /api/post/edit-post`

User protected. Edits a post owned by the current user.

FormData:

- `postId` or `_id`: post id.
- `task` or `taskId`: owned task id.
- `title`: required.
- `description`: optional.
- `media`: optional image files. If provided, replaces existing media.

Success `200`:

```json
{
  "post": {}
}
```

#### `POST /api/post/delete-post`

User protected. Deletes a post owned by the current user and removes its media directory.

Request JSON:

```json
{
  "postId": "<postId>"
}
```

`_id` is also accepted instead of `postId`.

Success `200`:

```json
{
  "message": "Post deleted successfully"
}
```

### Messages

The message model uses the existing field name `reciver`. API bodies also accept `receiverId` or `userId` in the newer spelling/shape.

Message content:

```json
{
  "type": "text",
  "value": "Hello"
}
```

Only text messages are currently supported.

Serialized message:

```json
{
  "_id": "<messageId>",
  "sender": "<userId>",
  "reciver": "<userId>",
  "content": {
    "type": "text",
    "value": "Hello"
  },
  "time": "2026-05-24T00:00:00.000Z"
}
```

#### `POST /api/message/get-messages`

User protected. Loads paginated chat messages between the current user and another user.

Request JSON:

```json
{
  "userId": "<otherUserId>",
  "limit": 20,
  "before": "2026-05-24T00:00:00.000Z"
}
```

Accepted target fields: `reciverId`, `receiverId`, or `userId`.

`limit` defaults to `20` and is capped at `20`.

Success `200`:

```json
{
  "messages": [],
  "hasMore": false,
  "nextBefore": null
}
```

#### `POST /api/message/send-message`

User protected. Sends a text message to another user.

Request JSON:

```json
{
  "reciverId": "<otherUserId>",
  "content": {
    "type": "text",
    "value": "Hello"
  }
}
```

`content` can also be a plain string. Accepted target fields: `reciverId`, `receiverId`, or `userId`.

Success `201`:

```json
{
  "message": {}
}
```

#### `POST /api/message/edit-message`

User protected. Edits a message sent by the current user.

Request JSON:

```json
{
  "messageId": "<messageId>",
  "content": {
    "type": "text",
    "value": "Updated text"
  }
}
```

Success `200`:

```json
{
  "message": {}
}
```

## Important Implementation Notes

- `AuthRedirect` redirects unauthenticated users away from non-auth web pages based only on `marker_im_token` existing in localStorage.
- `UserManager` caches the current user in memory. After profile/follow changes, update `UserManager.user` and dispatch `marker:user-updated`.
- `CreateEvent` uses task endpoints, not legacy event endpoints.
- `CreateEvent` dispatches `marker:tasks-updated` if no `onSaved` callback is passed.
- `CreatePost` dispatches `marker:posts-updated` if no `onSaved` callback is passed.
- Tags are normalized to lowercase names without a leading `#`.
- Task tags are stored as tag ObjectIds in `tasks.tags`, then serialized back to tag objects on read.
- Private tasks are still returned to other viewers, but sensitive fields are nulled out.
- Homepage slider admin changes are local to the browser because they are stored in localStorage, not MongoDB.
- Admin auth is a static client-side gate plus a shared header check. It is not equivalent to user session auth.
