"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Users, DollarSign, TrendingUp, Calendar, CheckCircle, FileText, Download } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface EmployeeReport {
    id: string;
    nombre: string;
    tipo_pago: string;
    sueldo_base: number;
    servicios_completados: number;
    total_comisiones: number;
    total_a_pagar: number;
}

export default function PayrollPage() {
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<EmployeeReport[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const tenantId = 'resetspa'; // Mocked

    useEffect(() => {
        async function calculatePayroll() {
            setLoading(true);
            try {
                // 1. Obtener empleados
                const staffRef = collection(db, 'tenants', tenantId, 'empleados');
                const staffSnap = await getDocs(staffRef);
                const staffList = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // 2. Obtener turnos completados para el mes seleccionado
                // (En producción filtraríamos por rango de fechas)
                const agendaRef = collection(db, 'tenants', tenantId, 'agenda');
                const q = query(agendaRef, where('status', '==', 'completado'));
                const agendaSnap = await getDocs(q);
                const turnosCompletados = agendaSnap.docs.map(d => d.data());

                // 3. Procesar reportes
                const processedReports: EmployeeReport[] = staffList.map((emp: any) => {
                    const empTurnos = turnosCompletados.filter(t => t.empleado_id === emp.id);
                    const totalComisiones = empTurnos.reduce((acc, t) => {
                        const comision = emp.tipo_pago === 'commission' || emp.tipo_pago === 'hybrid'
                            ? (t.precio * (emp.porcentaje_comision / 100))
                            : 0;
                        return acc + comision;
                    }, 0);

                    const sueldoBase = emp.sueldo_base || 0;

                    return {
                        id: emp.id,
                        nombre: emp.nombre,
                        tipo_pago: emp.tipo_pago,
                        sueldo_base: sueldoBase,
                        servicios_completados: empTurnos.length,
                        total_comisiones: totalComisiones,
                        total_a_pagar: sueldoBase + totalComisiones
                    };
                });

                setReports(processedReports);
            } catch (error) {
                console.error(error);
                toast.error("Error al calcular la nómina");
            } finally {
                setLoading(false);
            }
        }
        calculatePayroll();
    }, [selectedMonth, selectedYear]);

    const totalGeneral = reports.reduce((acc, r) => acc + r.total_a_pagar, 0);

    if (loading) return <div className="p-8 animate-pulse text-gray-400">Calculando liquidaciones...</div>;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-montserrat text-gray-900">Liquidación de Nómina</h1>
                    <p className="text-gray-500">Cálculo de sueldos y comisiones por servicios realizados.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-full">
                        <Download className="w-4 h-4 mr-2" /> Exportar PDF
                    </Button>
                    <Button className="bg-gray-900 text-white rounded-full px-6">
                        Confirmar Pagos
                    </Button>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-6 flex items-center gap-4 border-l-4 border-l-blue-500">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Total a Liquidar</p>
                        <h3 className="text-2xl font-bold font-montserrat">${totalGeneral.toLocaleString()}</h3>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-4 border-l-4 border-l-green-500">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Servicios Totales</p>
                        <h3 className="text-2xl font-bold font-montserrat">{reports.reduce((acc, r) => acc + r.servicios_completados, 0)}</h3>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-4 border-l-4 border-l-purple-500">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Promedio p/ Profesional</p>
                        <h3 className="text-2xl font-bold font-montserrat">${(totalGeneral / (reports.length || 1)).toLocaleString()}</h3>
                    </div>
                </Card>
            </div>

            {/* Detalle por Empleado */}
            <Card className="overflow-hidden border-none shadow-xl">
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2"><Users className="w-4 h-4" /> Desglose de Staff</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <select className="bg-transparent font-bold outline-none" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                            <option value={2}>Marzo</option>
                            <option value={1}>Febrero</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold">Profesional</th>
                                <th className="px-6 py-4 font-bold">Esquema</th>
                                <th className="px-6 py-4 font-bold text-center">Servicios</th>
                                <th className="px-6 py-4 font-bold text-right">Sueldo Base</th>
                                <th className="px-6 py-4 font-bold text-right">Comisiones</th>
                                <th className="px-6 py-4 font-bold text-right text-gray-900">Total Final</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">{report.nombre}</td>
                                    <td className="px-6 py-4 text-sm capitalize">{report.tipo_pago}</td>
                                    <td className="px-6 py-4 text-center font-mono">{report.servicios_completados}</td>
                                    <td className="px-6 py-4 text-right text-sm">${report.sueldo_base.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">+${report.total_comisiones.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">${report.total_a_pagar.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#9381FF]">
                                            <FileText className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="flex justify-start items-center gap-4 p-6 bg-yellow-50 rounded-2xl border border-yellow-200 text-yellow-800 text-sm">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <p><strong>Nota:</strong> Las comisiones se calculan sobre el precio final cobrado en cada turno marcado como "Completado". Asegúrate de que el equipo marque sus tareas al finalizar.</p>
            </div>
        </div>
    );
}
