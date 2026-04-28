import { createContext } from 'react';

import type { I_AuthContext } from './auth.type';

export const AuthContext = createContext<I_AuthContext | undefined>(undefined);
