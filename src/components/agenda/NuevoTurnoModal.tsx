import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface NuevoTurnoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (turno: any) => void;
    initialHora?: string;
    initialBox?: string;
}

export function NuevoTurnoModal({ isOpen, onClose, onSave, initialHora, initialBox }: NuevoTurnoModalProps) {
    const [cliente, setCliente] = useState('');
    const [tratamiento, setTratamiento] = useState('Depilación Láser'); // mock default

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSave) {
            onSave({
                cliente,
                tratamiento,
                hora: initialHora,
                box: initialBox
            });
        }
        // Lógica de reseteo y cierre (mock por ahora)
        setCliente('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Agendar Nuevo Turno">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (Nombre o Teléfono)</label>
                    <Input
                        required
                        placeholder="Ej: Laura Sanchez"
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento / Servicio</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-[var(--secondary)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        value={tratamiento}
                        onChange={(e) => setTratamiento(e.target.value)}
                    >
                        <option value="Depilación Láser">Depilación Láser (30min)</option>
                        <option value="Masaje Relajante">Masaje Relajante (60min)</option>
                        <option value="Limpieza Facial">Limpieza Facial (45min)</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Box</label>
                        <Input readOnly value={initialBox || "Seleccionar..."} className="bg-gray-50 text-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                        <Input type="time" defaultValue={initialHora || "09:00"} />
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Confirmar Turno</Button>
                </div>
            </form>
        </Modal>
    );
}
