import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import { sql } from '@/app/lib/db';

async function getUser(email: string): Promise<User | undefined> {
  try {
    // console.log('Looking for user with email:', email);
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    // console.log('Found user:', user[0] ? 'Yes' : 'No');
    // if (user[0]) {
    //   console.log('User details:', { id: user[0].id, name: user[0].name, email: user[0].email });
    // }
    return user[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        // console.log('Authorize called with credentials:', credentials);
        
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          // console.log('Parsed credentials - email:', email);
          
          const user = await getUser(email);
          if (!user) {
            // console.log('User not found');
            return null;
          }

          // console.log('User found, comparing passwords...');
          const passwordsMatch = await bcrypt.compare(password, user.password);
          // console.log('Passwords match:', passwordsMatch);
          
          if (passwordsMatch) return user;
        } else {
          // console.log('Credential parsing failed:', parsedCredentials.error);
        }

        // console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});