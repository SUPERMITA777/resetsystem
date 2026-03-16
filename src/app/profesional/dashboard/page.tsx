"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTurnosPorProfesional, TurnoDB } from "@/lib/services/agendaService";
import { getUsersByTenant, UserProfile } from "@/lib/services/userService";
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
    parseISO
} from "date-fns";
import { es } from "date-fns/locale";
import { 
    Calendar as CalendarIcon, 
    Clock, 
    User, 
    ChevronLeft, 
    ChevronRight, 
    LogOut,
    CheckCircle2,
    CalendarDays,
    AlertCircle,
    Search
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function ProfesionalDashboard() {
    const { user, staffId, loading: authLoading } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [turnos, setTurnos] = useState<TurnoDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [profesionales, setProfesionales] = useState<UserProfile[]>([]);
    const [filteredProfs, setFilteredProfs] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
    const [showSearch, setShowSearch] = useState(false);
    const [viewMode, setViewMode] = useState<'date' | 'upcoming'>('date');
    const router = useRouter();

    const currentTenant = typeof window !== 'undefined' ? localStorage.getItem('currentTenant') || 'resetspa' : 'resetspa';

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
            
            // Si el usuario logueado es profesional, seleccionarlo por defecto
            if (staffId) {
                setSelectedProfId(staffId);
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
            // Cargamos 3 meses para tener visión a futuro
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

    if (authLoading || (loading && !turnos.length && staffId)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!authLoading && !staffId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
                <h2 className="text-xl font-black uppercase tracking-tight mb-2">Acceso No Autorizado</h2>
                <p className="text-gray-500 max-w-md">Tu cuenta no está vinculada a un perfil de profesional. Contacta al administrador del salón.</p>
                <button 
                    onClick={handleLogout}
                    className="mt-6 px-6 py-2 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs"
                >
                    Cerrar Sesión
                </button>
            </div>
        );
    }

    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    const selectedDateTurnos = turnos.filter(t => t.fecha === format(selectedDate, 'yyyy-MM-dd'))
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

    const hasTurno = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return turnos.some(t => t.fecha === dateStr && (t.status === 'CONFIRMADO' || t.status === 'RESERVADO'));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Toaster position="top-center" />
            
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
                        R
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tight text-gray-900 leading-none">Mi Agenda</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Panel Profesional</p>
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

            <main className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
                
                {/* User Welcome & Search */}
                <div className="bg-black rounded-[2rem] p-8 text-white shadow-2xl shadow-black/20 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Bienvenido/a</p>
                            <h2 className="text-3xl font-black uppercase tracking-tight">
                                {profesionales.find(p => p.uid === selectedProfId)?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Profesional'}
                            </h2>
                            <div className="flex items-center gap-2 mt-4">
                                <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
                                    {turnos.length} Turnos este mes
                                </div>
                            </div>
                        </div>
                        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
                            <CalendarDays className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    {/* Search Professional */}
                    <div className="pt-6 border-t border-white/10">
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <input 
                                type="text"
                                placeholder="Buscar profesional por nombre o usuario..."
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
                                className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-white/20 transition-all placeholder:text-gray-600"
                            />
                            
                            {showSearch && searchTerm && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {filteredProfs.length > 0 ? (
                                        <div className="max-h-60 overflow-y-auto">
                                            {filteredProfs.map(p => (
                                                <button
                                                    key={p.uid}
                                                    onClick={() => {
                                                        setSelectedProfId(p.uid);
                                                        setSearchTerm('');
                                                        setShowSearch(false);
                                                    }}
                                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between group transition-colors border-b border-gray-50 last:border-0"
                                                >
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 leading-tight uppercase tracking-tight">{p.displayName || p.email.split('@')[0]}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{p.email}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-black transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No se encontraron profesionales</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Calendar Section */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-black uppercase tracking-widest text-xs text-gray-400">Calendario de Turnos</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-50 rounded-lg transition-all">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-black uppercase min-w-[120px] text-center">
                                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                                    </span>
                                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-50 rounded-lg transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-4 flex-1">
                                <div className="grid grid-cols-7 mb-2">
                                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                                        <div key={d} className="text-center text-[10px] font-black text-gray-300 uppercase py-2">
                                            {d}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {days.map((day, idx) => {
                                        const isSelected = isSameDay(day, selectedDate);
                                        const isOutside = day.getMonth() !== currentMonth.getMonth();
                                        const highlight = hasTurno(day);
                                        
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedDate(day)}
                                                className={`
                                                    relative h-14 md:h-16 rounded-2xl flex flex-col items-center justify-center transition-all border
                                                    ${isSelected ? 'bg-black text-white border-black shadow-xl shadow-black/20 scale-105 z-10' : 'hover:bg-gray-50 border-transparent'}
                                                    ${isOutside ? 'opacity-20' : 'opacity-100'}
                                                `}
                                            >
                                                <span className={`text-sm font-black ${isSelected ? 'text-white' : highlight ? 'text-black' : 'text-gray-400'}`}>
                                                    {format(day, 'd')}
                                                </span>
                                                {highlight && !isSelected && (
                                                    <div className="absolute bottom-3 w-1.5 h-1.5 bg-black rounded-full" />
                                                )}
                                                {isToday(day) && !isSelected && (
                                                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Turnos Section */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 flex flex-col h-full min-h-[500px]">
                            <div className="p-6 border-b border-gray-50 flex flex-col gap-4">
                                <div className="flex bg-gray-50 p-1 rounded-xl w-full">
                                    <button 
                                        onClick={() => setViewMode('date')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'date' ? 'bg-black text-white' : 'text-gray-400'}`}
                                    >
                                        Por Día
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('upcoming')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'upcoming' ? 'bg-black text-white' : 'text-gray-400'}`}
                                    >
                                        Próximos
                                    </button>
                                </div>
                                {viewMode === 'date' ? (
                                    <p className="text-xl font-black uppercase tracking-tight text-gray-900">
                                        {format(selectedDate, "eeee d 'de' MMMM", { locale: es })}
                                    </p>
                                ) : (
                                    <p className="text-xl font-black uppercase tracking-tight text-gray-900">
                                        Agenda a Futuro
                                    </p>
                                )}
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                                {loading && turnos.length > 0 ? (
                                    <div className="flex-1 flex items-center justify-center py-10">
                                        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : (viewMode === 'date' ? selectedDateTurnos : turnos.filter(t => t.fecha >= format(new Date(), 'yyyy-MM-dd')).sort((a,b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`)).slice(0, 20)).length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                        <CalendarIcon className="w-10 h-10 text-gray-200 mb-3" />
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No hay turnos para mostrar</p>
                                    </div>
                                ) : (
                                    (viewMode === 'date' ? selectedDateTurnos : turnos.filter(t => t.fecha >= format(new Date(), 'yyyy-MM-dd')).sort((a,b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`)).slice(0, 20)).map((t) => (
                                        <div key={t.id} className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 hover:border-black/10 hover:shadow-lg transition-all group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    {viewMode === 'upcoming' && (
                                                        <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-md uppercase tracking-tighter mr-2">
                                                            {format(new Date(t.fecha + 'T12:00:00'), 'dd/MM')}
                                                        </span>
                                                    )}
                                                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                                                    <span className="text-sm font-black text-gray-900">{t.horaInicio.substring(0, 5)}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                                    t.status === 'CONFIRMADO' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
                                                    t.status === 'COMPLETADO' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                                    'bg-gray-100 border-gray-200 text-gray-500'
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </div>
                                            
                                            <h4 className="text-md font-black uppercase tracking-tight text-gray-900 mb-1">{t.clienteAbreviado}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 line-clamp-1">{t.tratamientoAbreviado}</p>
                                            
                                            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center border border-gray-100">
                                                        <Clock className="w-3 h-3 text-gray-400" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-600 uppercase">{t.duracionMinutos} min</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center border border-gray-100">
                                                        <CheckCircle2 className="w-3 h-3 text-gray-400" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-600 uppercase">{t.boxId}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .shadow-premium {
                    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #eee;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #ddd;
                }
            `}</style>
        </div>
    );
}
