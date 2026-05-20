# Google OAuth Design

**Date:** 2026-05-20  
**Project:** Nest Shop — Express backend  
**Status:** Approved

## Context

Two separate frontends: seller (OWNER) and buyer (USER). Auth currently uses email/password + JWT. Adding Google Sign-In via the token verification approach — frontend gets idToken from Google Identity Services, sends it to the backend for verification.

## Endpoints

```
POST /auth/google/buyer   — verifies idToken, creates/finds user with role USER
POST /auth/google/seller  — verifies idToken, creates/finds user with role OWNER
```

Both accept: `{ idToken: string }`  
Both return: `{ message, user, token }` — same shape as existing login/register responses.

## Logic (identical for both, role differs)

1. Verify `idToken` via `google-auth-library` OAuth2Client → extract `{ email, sub (googleId), name, picture }`
2. Find user by `googleId` → found: return JWT
3. Find user by `email` (registered via password) → found: attach `googleId`, return JWT  
4. Not found → create new user with appropriate role, no password → return JWT

## Schema Change

```prisma
model User {
  ...
  googleId  String?  @unique
}
```

New migration: `npx prisma migrate dev --name add-google-id-to-user`

## Dependencies

- `npm install google-auth-library`
- `GOOGLE_CLIENT_ID` in `.env`

## Files Modified

- `prisma/schema.prisma` — add `googleId` field
- `src/modules/auth/auth.service.ts` — add `googleAuth(idToken, role)` method
- `src/modules/auth/auth.controller.ts` — add `googleBuyer`, `googleSeller` handlers
- `src/modules/auth/auth.routes.ts` — register new routes

## Error Cases

| Situation | Status |
|---|---|
| Invalid / expired idToken | 401 |
| Google payload missing email | 400 |
| Internal error | 500 |
