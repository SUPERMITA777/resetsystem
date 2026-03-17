"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tratamiento, serviceManagement } from "@/lib/services/serviceManagement";
import { X, GripVertical, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface ReorderTratamientosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  tratamientos: Tratamiento[];
  tenantId: string;
}

interface SortableItemProps {
  id: string;
  tratamiento: Tratamiento;
}

function SortableItem({ id, tratamiento }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm mb-3 group hover:border-black/10 transition-all"
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-2 text-gray-300 hover:text-gray-600 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-gray-900">{tratamiento.nombre}</p>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          {tratamiento.habilitado ? "Habilitado" : "Deshabilitado"}
        </p>
      </div>
    </div>
  );
}

export function ReorderTratamientosModal({
  isOpen,
  onClose,
  onSave,
  tratamientos,
  tenantId,
}: ReorderTratamientosModalProps) {
  const [items, setItems] = useState(tratamientos);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    const loadingToast = toast.loading("Guardando orden...");
    try {
      // Update each tratamiento with its new index
      const promises = items.map((item, index) =>
        serviceManagement.updateTratamiento(tenantId, item.id, { order: index })
      );
      await Promise.all(promises);
      toast.success("Orden guardado correctamente", { id: loadingToast });
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Error al guardar el orden", { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-50 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              Ordenar Categorías
            </h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
              Arrastra para cambiar el orden
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-xl transition-all shadow-sm"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((tratamiento) => (
                <SortableItem
                  key={tratamiento.id}
                  id={tratamiento.id}
                  tratamiento={tratamiento}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="p-8 bg-white border-t border-gray-100">
          <Button
            onClick={handleSaveOrder}
            disabled={saving}
            className="w-full bg-black text-white hover:bg-gray-800 h-14 rounded-2xl font-bold shadow-2xl shadow-black/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            {saving ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar Nuevo Orden
          </Button>
        </div>
      </div>
    </div>
  );
}
