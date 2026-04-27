This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Email Verification Flow

- When a user registers, a verification email is sent to their address with a unique link.
- The user must click the link to verify their email before logging in.
- If a user tries to log in with an unverified email, they will see an error and a button to resend the verification email.
- The registration page also offers a resend option if the email is already registered but unverified.
- The verify-email page allows users to request a new verification email if their link is missing or expired.
- Resend requests are rate-limited (1 per minute per email) to prevent abuse.

### Endpoints
- `POST /api/resend-verification` — Request a new verification email. Requires `{ email }` in the body.

### UI
- Login, registration, and verify-email pages all provide a way to resend the verification email if needed.
- Users receive feedback if the resend is successful, in progress, or fails.

### Security
- Rate limiting is enforced on the resend endpoint.
- Verification tokens are regenerated on each resend for security.
