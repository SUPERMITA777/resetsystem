import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className = "" }: CardProps) {
    return (
        <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className = "" }: CardProps) {
    return (
        <div className={`p-6 border-b border-gray-50 bg-gray-50/30 ${className}`}>
            {children}
        </div>
    );
}

export function CardContent({ children, className = "" }: CardProps) {
    return (
        <div className={`p-6 ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = "" }: CardProps) {
    return (
        <h3 className={`text-lg font-bold text-gray-900 ${className}`}>
            {children}
        </h3>
    );
}

export function CardDescription({ children, className = "" }: CardProps) {
    return (
        <p className={`text-sm text-gray-500 mt-1 ${className}`}>
            {children}
        </p>
    );
}
