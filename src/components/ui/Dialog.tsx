"use client";

import * as React from "react";
import { X } from "lucide-react";

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-200">
                {children}
            </div>
        </div>
    );
}

export function DialogContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 ${className}`}>
            {children}
        </div>
    );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
    return <div className="p-6 pb-2">{children}</div>;
}

export function DialogTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <h2 className={`text-xl font-bold ${className}`}>{children}</h2>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
    return <div className="p-6 pt-2 bg-gray-50/50 flex justify-end gap-2">{children}</div>;
}
