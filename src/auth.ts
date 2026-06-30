import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { AppUser } from "@/types/user";

class EmailNotVerified extends CredentialsSignin {
  code = "EMAIL_NOT_VERIFIED";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email : null;
        const password = typeof credentials?.password === "string" ? credentials.password : null;
        if (!email || !password) return null;

        const usersCol = await getCollection<AppUser>("users");
        const user = await usersCol.findOne({ email } as any);
        if (!user || !user.passwordHash) return null;
        if (!user.emailVerified) {
          // Special error string for unverified
          throw new EmailNotVerified();
        }
        const isValid = await bcrypt.compare(password, user.passwordHash as string);
        if (!isValid) return null;
        return {
          id: user._id?.toString() ?? "",
          name: user.name ?? null,
          email: user.email,
          image: user.image ?? null,
          role: user.role,
          baseCurrency: (user as any).baseCurrency ?? null,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? (user.email === process.env.ADMIN_EMAIL ? "admin" : "customer");
        token.baseCurrency = (user as any).baseCurrency ?? null;
      } else if (token.sub) {
        try {
          const usersCol = await getCollection<any>("users");
          const dbUser = await usersCol.findOne({ _id: new ObjectId(token.sub) });
          if (dbUser) {
            token.baseCurrency = dbUser.baseCurrency ?? null;
          }
        } catch {
          // ignore
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role ?? "customer";
        (session.user as any).baseCurrency = (token as any).baseCurrency ?? null;
      }
      return session;
    },
  },
  trustHost: true,
});
