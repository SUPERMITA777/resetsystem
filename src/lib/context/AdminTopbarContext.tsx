"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface AdminTopbarContextType {
    topbarContent: ReactNode;
    setTopbarContent: (content: ReactNode) => void;
}

const AdminTopbarContext = createContext<AdminTopbarContextType | undefined>(undefined);

export function AdminTopbarProvider({ children }: { children: ReactNode }) {
    const [topbarContent, setTopbarContent] = useState<ReactNode>(null);

    return (
        <AdminTopbarContext.Provider value={{ topbarContent, setTopbarContent }}>
            {children}
        </AdminTopbarContext.Provider>
    );
}

export function useAdminTopbar() {
    const context = useContext(AdminTopbarContext);
    if (!context) {
        throw new Error("useAdminTopbar must be used within an AdminTopbarProvider");
    }
    return context;
}

/**
 * Component to allow pages to set their topbar content
 */
export function TopbarSetter({ children }: { children: ReactNode }) {
    const { setTopbarContent } = useAdminTopbar();
    
    React.useEffect(() => {
        setTopbarContent(children);
        return () => setTopbarContent(null);
    }, [children, setTopbarContent]);

    return null;
}
