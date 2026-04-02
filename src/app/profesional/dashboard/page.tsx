"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTurnosPorProfesional, TurnoDB } from "@/lib/services/agendaService";
import { getUsersByTenant, getUserProfile, UserProfile } from "@/lib/services/userService";
import { TurnoDetailPanel } from "@/components/profesional/TurnoDetailPanel";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import {
    Calendar as CalendarIcon,
    Clock,
    ChevronLeft,
    ChevronRight,
    LogOut,
    CheckCircle2,
    CalendarDays,
    Search,
    ChevronRight as ChevronRightIcon,
    Tag
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function ProfesionalDashboard() {
    const { user, staffId, role, tenantId: authTenantId, loading: authLoading } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [turnos, setTurnos] = useState<TurnoDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [profesionales, setProfesionales] = useState<UserProfile[]>([]);
    const [filteredProfs, setFilteredProfs] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
    const [selectedProf, setSelectedProf] = useState<UserProfile | null>(null);
    const [showSearch, setShowSearch] = useState(false);
    const [viewMode, setViewMode] = useState<'date' | 'upcoming'>('date');

    // Panel de detalle
    const [selectedTurno, setSelectedTurno] = useState<TurnoDB | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const router = useRouter();

    const currentTenant = typeof window !== 'undefined'
        ? (localStorage.getItem('currentTenant') || authTenantId || 'resetspa')
        : (authTenantId || 'resetspa');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
        if (user && !authLoading) {
            loadInitialData();
        }
    }, [user, authLoading, router]);

    const loadInitialData = async () => {
        try {
            const users = await getUsersByTenant(currentTenant);
            const profs = users.filter(u => u.role === 'staff' || u.role === 'salon_admin');
            setProfesionales(profs);
            setFilteredProfs(profs);

            if (staffId) {
                setSelectedProfId(staffId);
                // Get full profile of the logged profesional
                const myProfile = profs.find(p => p.uid === staffId) || null;
                setSelectedProf(myProfile);
            }
        } catch (error) {
            console.error("Error loading profesionales:", error);
        }
    };

    useEffect(() => {
        if (selectedProfId) {
            loadTurnos();
        } else if (!authLoading && !staffId) {
            setLoading(false);
        }
    }, [selectedProfId, authLoading, currentMonth]);

    const loadTurnos = async () => {
        if (!selectedProfId) return;
        setLoading(true);
        try {
            const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const end = format(addMonths(startOfMonth(currentMonth), 3), 'yyyy-MM-dd');
            const data = await getTurnosPorProfesional(currentTenant, selectedProfId, start, end);
            setTurnos(data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar turnos");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        const auth = getAuth(app);
        await signOut(auth);
        router.push("/login");
    };

    const handleSelectProf = (prof: UserProfile) => {
        setSelectedProfId(prof.uid);
        setSelectedProf(prof);
        setSearchTerm('');
        setShowSearch(false);
    };

    const handleTurnoClick = (turno: TurnoDB) => {
        setSelectedTurno(turno);
        setIsPanelOpen(true);
    };

    if (authLoading || (loading && !turnos.length && selectedProfId)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    const selectedDateTurnos = turnos
        .filter(t => t.fecha === format(selectedDate, 'yyyy-MM-dd') && t.status !== 'CANCELADO')
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

    const upcomingTurnos = turnos
        .filter(t => t.fecha >= format(new Date(), 'yyyy-MM-dd') && t.status !== 'CANCELADO')
        .sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`))
        .slice(0, 20);

    const displayTurnos = viewMode === 'date' ? selectedDateTurnos : upcomingTurnos;

    const hasTurno = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return turnos.some(t => t.fecha === dateStr && (t.status === 'CONFIRMADO' || t.status === 'RESERVADO'));
    };

    const statusDot: Record<string, string> = {
        CONFIRMADO: 'bg-emerald-500',
        RESERVADO: 'bg-orange-400',
        COMPLETADO: 'bg-blue-500',
        PENDIENTE: 'bg-amber-400',
        CANCELADO: 'bg-red-400',
    };

    const statusBadge: Record<string, string> = {
        CONFIRMADO: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        RESERVADO: 'bg-orange-50 border-orange-100 text-orange-700',
        COMPLETADO: 'bg-blue-50 border-blue-100 text-blue-700',
        PENDIENTE: 'bg-amber-50 border-amber-100 text-amber-700',
        CANCELADO: 'bg-red-50 border-red-100 text-red-700',
    };

    const displayName = selectedProf?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Profesional';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Toaster position="top-center" />

            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-bold text-white shadow-lg text-lg">
                        R
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tight text-gray-900 leading-none">Mi Agenda</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Portal Profesional</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-black"
                    title="Cerrar Sesión"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">

                {/* Welcome banner */}
                <div className="bg-black rounded-[2rem] p-6 md:p-8 text-white shadow-2xl shadow-black/20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Bienvenida/o</p>
                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight truncate">{displayName}</h2>
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                                <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                                    {turnos.filter(t => t.status !== 'CANCELADO').length} turnos activos
                                </div>
                                <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                                    {selectedDateTurnos.length} hoy {viewMode === 'date' ? `(${format(selectedDate, 'dd/MM')})` : ''}
                                </div>
                            </div>
                        </div>
                        <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center border border-white/10">
                            <CalendarDays className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* Search — only for admins */}
                    {(role === 'salon_admin' || role === 'superadmin') && (
                        <div className="pt-5 mt-5 border-t border-white/10">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar profesional..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSearchTerm(val);
                                        setFilteredProfs(profesionales.filter(p =>
                                            p.displayName?.toLowerCase().includes(val.toLowerCase()) ||
                                            p.email.toLowerCase().includes(val.toLowerCase())
                                        ));
                                        setShowSearch(true);
                                    }}
                                    onFocus={() => setShowSearch(true)}
                                    className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-gray-600 text-white"
                                />
                                {showSearch && searchTerm && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {filteredProfs.length > 0 ? (
                                            <div className="max-h-56 overflow-y-auto">
                                                {filteredProfs.map(p => (
                                                    <button
                                                        key={p.uid}
                                                        onClick={() => handleSelectProf(p)}
                                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group transition-colors border-b border-gray-50 last:border-0"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{p.displayName || p.email.split('@')[0]}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.email}</p>
                                                        </div>
                                                        <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sin resultados</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Calendar */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-black uppercase tracking-widest text-xs text-gray-400">Calendario</h3>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
                                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <span className="text-sm font-black uppercase tracking-wide min-w-[130px] text-center capitalize">
                                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                                    </span>
                                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
                                        <ChevronRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="grid grid-cols-7 mb-2">
                                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                                        <div key={i} className="text-center text-[10px] font-black text-gray-300 uppercase py-2">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {days.map((day, idx) => {
                                        const isSelected = isSameDay(day, selectedDate);
                                        const isOutside = day.getMonth() !== currentMonth.getMonth();
                                        const highlight = hasTurno(day);
                                        const dayTurnos = turnos.filter(t => t.fecha === format(day, 'yyyy-MM-dd') && t.status !== 'CANCELADO');
                                        const hasConfirmado = dayTurnos.some(t => t.status === 'CONFIRMADO');

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedDate(day)}
                                                className={`
                                                    relative h-12 md:h-14 rounded-2xl flex flex-col items-center justify-center transition-all border
                                                    ${isSelected ? 'bg-black text-white border-black shadow-xl shadow-black/20 scale-105 z-10' : 'hover:bg-gray-50 border-transparent'}
                                                    ${isOutside ? 'opacity-25' : 'opacity-100'}
                                                `}
                                            >
                                                <span className={`text-sm font-black ${isSelected ? 'text-white' : highlight ? 'text-black' : 'text-gray-400'}`}>
                                                    {format(day, 'd')}
                                                </span>
                                                {highlight && !isSelected && (
                                                    <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${hasConfirmado ? 'bg-emerald-500' : 'bg-orange-400'}`} />
                                                )}
                                                {isToday(day) && !isSelected && (
                                                    <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-blue-500 rounded-full" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="px-5 pb-4 flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Confirmado</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reservado</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 bg-blue-500 rounded-full" />
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hoy</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Turnos list */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 flex flex-col" style={{ minHeight: '480px' }}>
                            <div className="p-5 border-b border-gray-50 space-y-3">
                                {/* Tab switch */}
                                <div className="flex bg-gray-50 p-1 rounded-xl">
                                    <button
                                        onClick={() => setViewMode('date')}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'date' ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Por Día
                                    </button>
                                    <button
                                        onClick={() => setViewMode('upcoming')}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'upcoming' ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Próximos
                                    </button>
                                </div>
                                <p className="text-base font-black uppercase tracking-tight text-gray-900">
                                    {viewMode === 'date'
                                        ? format(selectedDate, "eeee d 'de' MMMM", { locale: es })
                                        : 'Agenda a Futuro'}
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {!selectedProfId ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                                        <CalendarDays className="w-10 h-10 text-gray-200 mb-3" />
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Seleccioná un profesional para ver su agenda</p>
                                    </div>
                                ) : loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : displayTurnos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 mx-1">
                                        <CalendarIcon className="w-10 h-10 text-gray-200 mb-3" />
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Sin turnos para mostrar</p>
                                    </div>
                                ) : (
                                    displayTurnos.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleTurnoClick(t)}
                                            className="w-full text-left bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-black/20 hover:shadow-lg hover:bg-white transition-all group active:scale-[0.99]"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {viewMode === 'upcoming' && (
                                                        <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 rounded-md uppercase tracking-tight">
                                                            {format(new Date(t.fecha + 'T12:00:00'), 'dd/MM')}
                                                        </span>
                                                    )}
                                                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                                                    <span className="text-base font-black text-gray-900">{t.horaInicio?.substring(0, 5)}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${statusBadge[t.status || 'RESERVADO'] || statusBadge['RESERVADO']}`}>
                                                    {t.status || 'RESERVADO'}
                                                </span>
                                            </div>

                                            <p className="text-sm font-black text-gray-900 group-hover:text-black leading-tight">{t.clienteAbreviado}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Tag className="w-3 h-3 text-gray-300" />
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{t.tratamientoAbreviado}</p>
                                            </div>

                                            {t.duracionMinutos ? (
                                                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
                                                    <Clock className="w-3 h-3 text-gray-300" />
                                                    <span className="text-[9px] font-black text-gray-400 uppercase">{t.duracionMinutos} min</span>
                                                    <span className="ml-auto text-[9px] font-black text-gray-300 group-hover:text-black transition-colors uppercase tracking-widest">Ver detalle →</span>
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-right">
                                                    <span className="text-[9px] font-black text-gray-300 group-hover:text-black transition-colors uppercase tracking-widest">Ver detalle →</span>
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Turno Detail Panel */}
            <TurnoDetailPanel
                turno={selectedTurno}
                isOpen={isPanelOpen}
                onClose={() => { setIsPanelOpen(false); setSelectedTurno(null); }}
                profesional={selectedProf}
                tenantId={currentTenant}
            />
        </div>
    );
}
