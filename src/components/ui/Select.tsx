"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type SelectContextType = {
    value?: string;
    onValueChange?: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
};

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

export function Select({ 
    children, 
    value, 
    onValueChange 
}: { 
    children: React.ReactNode; 
    value?: string; 
    onValueChange?: (value: string) => void;
}) {
    const [open, setOpen] = React.useState(false);

    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <div className="relative w-full">
                {children}
            </div>
        </SelectContext.Provider>
    );
}

export function SelectTrigger({ 
    children, 
    className = "" 
}: { 
    children: React.ReactNode; 
    className?: string; 
}) {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectTrigger must be used within Select");

    return (
        <button
            type="button"
            onClick={() => context.setOpen(!context.open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectValue must be used within Select");

    return (
        <span className="truncate">
            {context.value || placeholder}
        </span>
    );
}

export function SelectContent({ children }: { children: React.ReactNode }) {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectContent must be used within Select");

    if (!context.open) return null;

    return (
        <>
            <div 
                className="fixed inset-0 z-50" 
                onClick={() => context.setOpen(false)} 
            />
            <div 
                className="absolute top-full left-0 z-50 mt-1 min-w-[8rem] w-full overflow-hidden rounded-xl border border-gray-100 bg-white p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
            >
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </>
    );
}

export function SelectItem({ 
    value, 
    children, 
    className = "" 
}: { 
    value: string; 
    children: React.ReactNode; 
    className?: string;
}) {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectItem must be used within Select");

    const isSelected = context.value === value;

    return (
        <button
            type="button"
            onClick={() => {
                context.onValueChange?.(value);
                context.setOpen(false);
            }}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-lg py-2 px-3 text-sm outline-none hover:bg-gray-50 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                isSelected && "bg-gray-50 font-bold",
                className
            )}
        >
            <span className="flex-1 text-left">{children}</span>
            {isSelected && <Check className="h-4 w-4 ml-2" />}
        </button>
    );
}
