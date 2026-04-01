import React from "react";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    extraHeader?: React.ReactNode;
    maxWidth?: string;
    footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, extraHeader, maxWidth = 'max-w-md', footer }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`
                bg-[var(--background)]/90 backdrop-blur-xl 
                flex flex-col 
                w-full h-full sm:h-auto sm:max-h-[90vh] 
                ${maxWidth} 
                sm:rounded-3xl shadow-2xl 
                overflow-hidden 
                animate-in zoom-in-95 slide-in-from-bottom-5 duration-300
            `}>
                {/* Header - Fixed */}
                <div className="flex justify-between items-center p-5 border-b border-[var(--secondary)] flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-[var(--foreground)]">{title}</h2>
                        {extraHeader && <div className="mt-1">{extraHeader}</div>}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-[var(--secondary)]/10 flex items-center justify-center hover:bg-[var(--secondary)]/20 transition-all active:scale-90"
                    >
                        <X className="w-5 h-5 text-[var(--foreground)]" />
                    </button>
                </div>

                {/* Content - Scrollable if needed, otherwise fits */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="max-w-full mx-auto">
                        {children}
                    </div>
                </div>

                {/* Footer - Fixed at bottom of modal */}
                {footer && (
                    <div className="p-5 border-t border-[var(--secondary)] bg-[var(--background)]/50 backdrop-blur-md flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
