import { useState } from 'react';
import { Download, Pencil, Check, X, Trash2, MapPin, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  InventoryItem,
  Location,
  updateItem,
  deleteItem,
  downloadCSV,
} from '@/lib/inventory';

interface InventoryListProps {
  items: InventoryItem[];
  onUpdate: () => void;
}

type EditMode = 'none' | 'cantidad' | 'ubicacion';

interface EditState {
  id: string | null;
  mode: EditMode;
  cantidad: string;
  ubicacion: Location;
}

export function InventoryList({ items, onUpdate }: InventoryListProps) {
  const [editState, setEditState] = useState<EditState>({
    id: null,
    mode: 'none',
    cantidad: '',
    ubicacion: { pasillo: '', columna: '', leja: '' },
  });

  const startEditCantidad = (item: InventoryItem) => {
    setEditState({
      id: item.id,
      mode: 'cantidad',
      cantidad: item.cantidad.toString(),
      ubicacion: item.ubicacion,
    });
  };

  const startEditUbicacion = (item: InventoryItem) => {
    setEditState({
      id: item.id,
      mode: 'ubicacion',
      cantidad: item.cantidad.toString(),
      ubicacion: { ...item.ubicacion },
    });
  };

  const cancelEdit = () => {
    setEditState({
      id: null,
      mode: 'none',
      cantidad: '',
      ubicacion: { pasillo: '', columna: '', leja: '' },
    });
  };

  const saveEdit = () => {
    if (!editState.id) return;

    if (editState.mode === 'cantidad') {
      const qty = parseInt(editState.cantidad, 10);
      if (!isNaN(qty) && qty > 0) {
        updateItem(editState.id, { cantidad: qty });
        onUpdate();
      }
    } else if (editState.mode === 'ubicacion') {
      if (editState.ubicacion.pasillo.trim()) {
        updateItem(editState.id, { ubicacion: editState.ubicacion });
        onUpdate();
      }
    }
    cancelEdit();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este registro?')) {
      deleteItem(id);
      onUpdate();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary shadow-lg">
        <div className="px-safe py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary-foreground">
            Inventario ({items.length})
          </h1>
          <Button
            onClick={downloadCSV}
            variant="secondary"
            size="sm"
            className="gap-2"
            disabled={items.length === 0}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </header>

      {/* List */}
      <div className="flex-1 px-safe py-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay registros</p>
          </div>
        ) : (
          items.map((item) => {
            const isEditing = editState.id === item.id;
            const ubicacionStr = [
              item.ubicacion.pasillo,
              item.ubicacion.columna,
              item.ubicacion.leja,
            ]
              .filter(Boolean)
              .join('-');

            return (
              <Card key={item.id} className="p-4 animate-slide-up">
                {/* Main row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-lg text-foreground truncate">
                      {item.codigo}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {new Date(item.timestamp).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Cantidad display/edit */}
                  {isEditing && editState.mode === 'cantidad' ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={editState.cantidad}
                        onChange={(e) =>
                          setEditState((s) => ({ ...s, cantidad: e.target.value }))
                        }
                        className="w-20 h-10 text-center font-bold"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" onClick={saveEdit} className="text-success">
                        <Check className="w-5 h-5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEdit} className="text-muted-foreground">
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{item.cantidad}</p>
                        <p className="text-xs text-muted-foreground">uds</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditCantidad(item)}
                        className="text-muted-foreground hover:text-foreground"
                        disabled={isEditing}
                      >
                        <Hash className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Ubicación row */}
                <div className="mt-3 pt-3 border-t border-border">
                  {isEditing && editState.mode === 'ubicacion' ? (
                    <div className="space-y-3">
                      {/* IMPORTANTE: Inputs centrados o con margen izquierdo */}
                      <div className="flex justify-center gap-2 ml-4">
                        <Input
                          value={editState.ubicacion.pasillo}
                          onChange={(e) =>
                            setEditState((s) => ({
                              ...s,
                              ubicacion: { ...s.ubicacion, pasillo: e.target.value.toUpperCase() },
                            }))
                          }
                          placeholder="Pasillo"
                          className="w-24 h-10 text-center font-semibold"
                          autoFocus
                        />
                        <Input
                          value={editState.ubicacion.columna}
                          onChange={(e) =>
                            setEditState((s) => ({
                              ...s,
                              ubicacion: { ...s.ubicacion, columna: e.target.value.toUpperCase() },
                            }))
                          }
                          placeholder="Col"
                          className="w-20 h-10 text-center font-semibold"
                        />
                        <Input
                          value={editState.ubicacion.leja}
                          onChange={(e) =>
                            setEditState((s) => ({
                              ...s,
                              ubicacion: { ...s.ubicacion, leja: e.target.value.toUpperCase() },
                            }))
                          }
                          placeholder="Leja"
                          className="w-16 h-10 text-center font-semibold"
                        />
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button size="sm" onClick={saveEdit} className="bg-success hover:bg-success/90">
                          <Check className="w-4 h-4 mr-1" /> Guardar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="w-4 h-4 mr-1" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{ubicacionStr || 'Sin ubicación'}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditUbicacion(item)}
                          className="text-muted-foreground hover:text-foreground h-9 w-9"
                          disabled={isEditing}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive hover:text-destructive h-9 w-9"
                          disabled={isEditing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
