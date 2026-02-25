'use client';

import { createContext, useContext, useState } from 'react';

interface SidebarContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    toggle: () => void;
    activeAuditId: string | null;
    setActiveAuditId: (id: string | null) => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: false,
    setIsOpen: () => { },
    toggle: () => { },
    activeAuditId: null,
    setActiveAuditId: () => { },
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeAuditId, setActiveAuditId] = useState<string | null>(null);

    return (
        <SidebarContext.Provider
            value={{
                isOpen,
                setIsOpen,
                toggle: () => setIsOpen((prev) => !prev),
                activeAuditId,
                setActiveAuditId,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export const useSidebar = () => useContext(SidebarContext);
