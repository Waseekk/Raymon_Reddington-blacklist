import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { SignJWT } from "jose";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.provider = account.provider;
        token.picture = (profile as any).picture ?? token.picture;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).provider = token.provider;
        (session as any).accessToken = token;

        // Create a compact HS256 JWT the Python backend can decode
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
        const rawToken = await new SignJWT({
          email: session.user.email,
          name: session.user.name,
          picture: session.user.image,
          provider: (token as any).provider,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("24h")
          .sign(secret);

        (session as any).rawToken = rawToken;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
    error: "/",
  },
};
