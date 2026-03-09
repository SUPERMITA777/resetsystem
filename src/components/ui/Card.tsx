import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className = "", ...props }: CardProps) {
    return (
        <div
            className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = "", ...props }: CardProps) {
    return (
        <div
            className={`p-6 border-b border-gray-50 bg-gray-50/30 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardContent({ children, className = "", ...props }: CardProps) {
    return (
        <div
            className={`p-6 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardTitle({ children, className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={`text-lg font-bold text-gray-900 ${className}`}
            {...props}
        >
            {children}
        </h3>
    );
}

export function CardDescription({ children, className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            className={`text-sm text-gray-500 mt-1 ${className}`}
            {...props}
        >
            {children}
        </p>
    );
}
