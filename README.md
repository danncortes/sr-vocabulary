# SrVocabulary

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.10.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4201/`. The application will automatically reload whenever you modify any of the source files.

## Google authentication

Authentication uses Google OAuth through Supabase. The browser keeps the
Supabase session and sends its access token to `sr-vocabulary-api`, which
validates the token and the user allowlist on every protected request.

Production requires these GitHub Actions secrets:

- `API_BASE_URL`: `https://sr-vocabulary-ow7v3.ondigitalocean.app`
- `SUPABASE_URL`: the Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY`: a publishable key (or the legacy anon key)

Supabase Auth must allow these redirect URLs:

- `http://localhost:4201/auth/callback`
- `https://danncortes.github.io/sr-vocabulary/auth/callback`

The Google OAuth web client must use the callback URL shown on the Google
provider page in Supabase. Do not use the Angular callback URL as Google's
authorized redirect URI; Supabase is Google's OAuth callback receiver.

The database migration in the API repository creates the
`private.hook_restrict_auth_user` function. Select that function as the
**Before User Created** Postgres hook under **Authentication > Auth Hooks**.
It prevents creation unless the normalized email exists in the private
`auth_user_allowlist` table. Populate that table directly in Supabase; never
commit its contents. The API independently enforces a comma-separated
`ALLOWED_USER_EMAILS` environment variable and rejects every user when the
variable is missing.

`src/environments/environment.development.ts` is intentionally ignored. Copy
it from `src/environments/environment.development.example.ts` and fill in the
public Supabase project values for local development.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
