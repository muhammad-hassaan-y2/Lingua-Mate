import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/auth',
    newUser: '/auth',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname.startsWith('/');
      const isOnAuth = nextUrl.pathname.startsWith('/auth');

      if (isLoggedIn && isOnAuth) {
        return Response.redirect(new URL('/', nextUrl as unknown as URL));
      }

      if (isOnAuth) {
        return true; // Always allow access to auth page
      }

      if (isOnChat) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to auth page
      }

      if (isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl as unknown as URL));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;