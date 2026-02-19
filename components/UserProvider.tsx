'use client';

import { createContext, useContext, ReactNode } from 'react';

import { SessionUser } from '@/types';

const UserContext = createContext<SessionUser | null | undefined>(undefined);

export function UserProvider({ user, children }: { user: SessionUser | null, children: ReactNode }) {
    return (
        <UserContext.Provider value={user}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
