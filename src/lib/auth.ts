import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

type User = {
  id: string;
  username: string;
  role: string;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 172800,
  },
  providers: [
    CredentialsProvider({
      name: "",
      credentials: {
        username: {
          label: "Username",
          type: "text",
        },
        password: { label: "Password", type: "password" },
        token: { label: "Turnstile Token", type: "text" },
      },
      async authorize(credentials) {
        if (
          !credentials?.username ||
          !credentials.password ||
          !credentials.token
        ) {
          return null;
        }

        const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
        const captchaResponse = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              secret: turnstileSecret,
              response: credentials.token,
            }),
          }
        ).then((res) => res.json());

        if (!captchaResponse.success) {
          return null;
        }

        const user = await prisma.users.findUnique({
          where: {
            username: credentials.username,
          },
        });

        if (!user || !(await compare(credentials.password, user.password))) {
          return null;
        }

        return {
          id: user.user_id.toString(),
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      console.log("Session Callback", { session, token });
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
        },
      };
    },
    jwt: ({ token, user }) => {
      console.log("JWT Callback", { token, user });
      if (user) {
        const u = user as User;
        return {
          ...token,
          id: u.id,
          role: u.role,
        };
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
};
