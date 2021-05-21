import { Session } from 'express-session';

declare module 'express-session' {
  interface Session {
    isAuth: boolean;
    state?: string;
    user?: string;
  }
}
