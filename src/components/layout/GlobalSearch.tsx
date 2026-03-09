"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { useRouter } from 'next/navigation';

// Mock Help Articles (Base de conocimientos)
const HELP_ARTICLES = [
    { id: 'h1', title: '¿Cómo calcular comisiones?', url: '/admin/help/payroll' },
    { id: 'h2', title: 'Cambiar el horario de un Box', url: '/admin/help/boxes' },
    { id: 'h3', title: 'Configurar recordatorios de WhatsApp', url: '/admin/settings' },
];

export function GlobalSearch() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{ type: string; title: string; subtitle?: string; id: string }[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsOpen(true);
        setLoading(true);

        // Simulating database/api call
        await new Promise(resolve => setTimeout(resolve, 300));

        const lowerVal = val.toLowerCase();
        const newResults = [];

        // 1. Search in Help Articles
        const matchedHelp = HELP_ARTICLES.filter(a => a.title.toLowerCase().includes(lowerVal));
        matchedHelp.forEach(h => newResults.push({ type: 'help', title: h.title, subtitle: 'Centro de Ayuda', id: h.id }));

        // 2. Mock Search in Clients/Appointments 
        // (In production, this would query Firestore for subcollections of the tenant)
        if ('carla'.includes(lowerVal) || 'cliente'.includes(lowerVal)) {
            newResults.push({ type: 'client', title: 'Carla Gómez', subtitle: '+54 9 11 0000 0000', id: 'c1' });
        }
        if ('depilacion'.includes(lowerVal) || 'turno'.includes(lowerVal)) {
            newResults.push({ type: 'appointment', title: 'Depilación Láser', subtitle: 'Para hoy a las 16:00 hs', id: 't1' });
        }

        setResults(newResults);
        setLoading(false);
    };

    const handleSelect = (item: any) => {
        setIsOpen(false);
        setQuery('');
        // Routing logic based on type
        if (item.type === 'help') {
            const article = HELP_ARTICLES.find(a => a.id === item.id);
            if (article) router.push(article.url);
        } else if (item.type === 'client') {
            // router.push(`/admin/clients/${item.id}`)
            console.log("Navegar a cliente", item.id);
        } else if (item.type === 'appointment') {
            router.push(`/admin/agenda`);
        }
    };

    return (
        <div className="relative w-full max-w-sm hidden sm:block" ref={dropdownRef}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
                className="pl-9 bg-white"
                placeholder="Buscar clientes, turnos, ayuda..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => { if (query.length >= 2) setIsOpen(true) }}
            />

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-[var(--secondary)] overflow-hidden z-50">
                    {loading ? (
                        <div className="p-4 flex justify-center items-center text-gray-500">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Buscando...
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="max-h-[300px] overflow-y-auto py-2">
                            {results.map((res, idx) => (
                                <li
                                    key={`${res.type}-${res.id}-${idx}`}
                                    onClick={() => handleSelect(res)}
                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        {res.type === 'help' && <BookOpen className="w-4 h-4 text-purple-500" />}
                                        {res.type === 'client' && <User className="w-4 h-4 text-emerald-500" />}
                                        {res.type === 'appointment' && <Calendar className="w-4 h-4 text-blue-500" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium text-gray-900 truncate">{res.title}</p>
                                        {res.subtitle && <p className="text-xs text-gray-500 truncate">{res.subtitle}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                            No se encontraron resultados para "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
