import React from "react";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    extraHeader?: React.ReactNode;
    maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, extraHeader, maxWidth = 'max-w-md' }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`bg-[var(--background)] rounded-xl shadow-xl w-full ${maxWidth} overflow-hidden animate-in zoom-in-95 duration-200`}>
                <div className="flex justify-between items-center p-4 border-b border-[var(--secondary)]">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <div className="flex items-center gap-2">
                        {extraHeader}
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-[var(--secondary)] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
