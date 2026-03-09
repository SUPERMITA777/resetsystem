"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, ChevronRight, Store, LayoutGrid, Users, Scissors } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, setDoc, writeBatch } from 'firebase/firestore';

const STEPS = [
    { id: 'salon', title: 'Mi Salón', icon: Store, description: 'Datos básicos de tu negocio.' },
    { id: 'boxes', title: 'Infraestructura', icon: LayoutGrid, description: '¿Cuántos boxes o sillones tienes?' },
    { id: 'staff', title: 'Tu Equipo', icon: Users, description: 'Agrega a tus profesionales.' },
    { id: 'menu', title: 'Tus Servicios', icon: Scissors, description: 'Carga tu primer servicio.' }
];

export function OnboardingWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);

    // States - Paso 1
    const [salonName, setSalonName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // States - Paso 2
    const [boxesCount, setBoxesCount] = useState<number>(3);

    // States - Paso 3
    const [staffName, setStaffName] = useState('');
    const [staffRole, setStaffRole] = useState('commission');

    // States - Paso 4
    const [serviceName, setServiceName] = useState('');
    const [servicePrice, setServicePrice] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        const loadingToast = toast.loading('Configurando tu entorno mágico...');

        try {
            // Mock tenant ID. En producción vendría del Context del admin logueado
            const tenantId = 'resetspa';

            const batch = writeBatch(db);

            // 1. Actualizar Configuración del Salón
            const tenantRef = doc(db, 'tenants', tenantId);
            batch.update(tenantRef, {
                nombre_salon: salonName || 'Mi Salón',
                "datos_contacto.whatsapp": phone,
                "datos_contacto.direccion": address,
                config_boxes: boxesCount
            });

            // 2. Crear primer empleado
            if (staffName) {
                const newStaffRef = doc(collection(db, `tenants/${tenantId}/empleados`));
                batch.set(newStaffRef, {
                    nombre: staffName,
                    tipo_pago: staffRole, // 'fixed' | 'commission' | 'hybrid'
                    porcentaje_comision: staffRole === 'commission' ? 50 : 0
                });
            }

            // 3. Crear primer tratamiento (categoría) y subtratamiento (servicio)
            if (serviceName) {
                // Crear Categoría
                const categoryRef = doc(collection(db, `tenants/${tenantId}/tratamientos`));
                batch.set(categoryRef, { nombre: 'Servicios Principales' });

                // Crear Subtratamiento (Servicio final)
                const serviceRef = doc(collection(db, `tenants/${tenantId}/subtratamientos`));
                batch.set(serviceRef, {
                    categoria_id: categoryRef.id,
                    nombre: serviceName,
                    precio: parseFloat(servicePrice) || 0,
                    duracion_minutos: 60 // default
                });
            }

            // Ejecutar todas las escrituras juntas (Atómico)
            await batch.commit();

            toast.success('¡Salón configurado exitosamente!', { id: loadingToast });
            router.push('/admin/dashboard');
        } catch (error) {
            console.error(error);
            toast.error('Ocurrió un error en la configuración.', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8 bg-white rounded-3xl overflow-hidden shadow-2xl border border-[var(--secondary)]">

            {/* Columna Izquierda: Progreso */}
            <div className="w-full md:w-1/3 bg-[#F8F7FF] p-8 flex flex-col justify-between border-r border-[#E6E6FA]">
                <div>
                    <h2 className="text-sm font-bold text-[#9381FF] tracking-wider uppercase mb-8">
                        Configuración Inicial
                    </h2>

                    <div className="flex flex-col gap-6">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = idx === currentStep;
                            const isPast = idx < currentStep;

                            return (
                                <div key={step.id} className={`flex items-start gap-4 transition-all duration-300 ${isActive ? 'opacity-100' : isPast ? 'opacity-60' : 'opacity-30'}`}>
                                    <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 
                    ${isActive ? 'border-[#9381FF] text-[#9381FF] bg-[#9381FF]/10' :
                                            isPast ? 'border-[#588157] text-[#588157] bg-[#588157]/10' : 'border-gray-200 text-gray-400'}`}
                                    >
                                        {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>{step.title}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-12 hidden md:block">
                    <p className="text-xs text-center text-gray-400">Paso {currentStep + 1} de {STEPS.length}</p>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                            className="bg-[#9381FF] h-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Columna Derecha: Formularios Activos */}
            <div className="w-full md:w-2/3 p-8 md:p-12 flex flex-col justify-center min-h-[500px]">
                <div className="flex-1">
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        {currentStep === 0 && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-bold font-montserrat text-gray-900 mb-2">¡Hola! Demos forma a tu Salón</h1>
                                <p className="text-gray-600 mb-8">Primero, cuéntanos lo básico. Esta información se mostrará en tu página web pública.</p>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de tu Negocio</label>
                                    <Input
                                        placeholder="Ej: Reset Spa Premium"
                                        value={salonName}
                                        onChange={(e) => setSalonName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp del Local</label>
                                    <Input
                                        placeholder="Ej: +54 9 11 1234 5678"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Donde recibirás los pedidos de turnos.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Física</label>
                                    <Input
                                        placeholder="Ej: Av. Santa Fe 1234, CABA"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-bold font-montserrat text-gray-900 mb-2">¿Cómo es tu espacio?</h1>
                                <p className="text-gray-600 mb-8">Los 'Boxes' representan las sillas, sillones, o salas privadas donde atiendes simultáneamente.</p>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Cantidad de Boxes Activos</label>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setBoxesCount(Math.max(1, boxesCount - 1))}
                                            className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-200 transition-colors"
                                        >-</button>
                                        <span className="text-3xl font-bold font-montserrat w-16 text-center">{boxesCount}</span>
                                        <button
                                            onClick={() => setBoxesCount(Math.min(20, boxesCount + 1))}
                                            className="w-12 h-12 rounded-xl bg-[#9381FF] text-white flex items-center justify-center text-xl font-bold hover:bg-[#8371ef] transition-colors shadow-md shadow-[#9381FF]/30"
                                        >+</button>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-6">Esto creará {boxesCount} columnas en tu Agenda diaria para organizar turnos en paralelo.</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-bold font-montserrat text-gray-900 mb-2">Construye tu Equipo</h1>
                                <p className="text-gray-600 mb-8">Agrega a tu primer profesional (puedes ser tú mismo/a) y define cómo gana dinero.</p>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                    <Input
                                        placeholder="Ej: Laura Pérez"
                                        value={staffName}
                                        onChange={(e) => setStaffName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Esquema de Pago</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label className={`border rounded-xl p-4 cursor-pointer transition-all ${staffRole === 'fixed' ? 'border-[#9381FF] bg-[#9381FF]/5 ring-1 ring-[#9381FF]' : 'border-gray-200 hover:border-[#9381FF]/50'}`}>
                                            <input type="radio" name="role" className="sr-only" checked={staffRole === 'fixed'} onChange={() => setStaffRole('fixed')} />
                                            <span className="block font-semibold">Sueldo Fijo</span>
                                            <span className="block text-xs text-gray-500 mt-1">Monto mensual fijo sin importar los turnos.</span>
                                        </label>
                                        <label className={`border rounded-xl p-4 cursor-pointer transition-all ${staffRole === 'commission' ? 'border-[#9381FF] bg-[#9381FF]/5 ring-1 ring-[#9381FF]' : 'border-gray-200 hover:border-[#9381FF]/50'}`}>
                                            <input type="radio" name="role" className="sr-only" checked={staffRole === 'commission'} onChange={() => setStaffRole('commission')} />
                                            <span className="block font-semibold">% Comisión</span>
                                            <span className="block text-xs text-gray-500 mt-1">Gana porcentaje por cada servicio realizado.</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h1 className="text-3xl font-bold font-montserrat text-gray-900 mb-2">Tu Primer Servicio</h1>
                                <p className="text-gray-600 mb-8">Por último, añade algo genial a tu catálogo para que los clientes comiencen a pedir turnos.</p>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Tratamiento</label>
                                    <Input
                                        placeholder="Ej: Depilación Láser Pierna Entera"
                                        value={serviceName}
                                        onChange={(e) => setServiceName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Inicial Estimado ($)</label>
                                    <Input
                                        type="number"
                                        placeholder="Ej: 8500"
                                        value={servicePrice}
                                        onChange={(e) => setServicePrice(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Puedes ocultar los precios o modificarlos más tarde.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        className={`text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors ${currentStep === 0 ? 'invisible' : ''}`}
                    >
                        Atrás
                    </button>

                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="rounded-full px-8 bg-gray-900 text-white hover:bg-gray-800"
                    >
                        {isSubmitting ? 'Configurando...' : currentStep === STEPS.length - 1 ? '¡Listo, Empezar!' : 'Siguiente Paso'}
                        {!isSubmitting && <ChevronRight className="w-4 h-4 ml-1" />}
                    </Button>
                </div>

            </div>
        </div>
    );
}
