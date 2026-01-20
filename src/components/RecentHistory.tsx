import { Clock, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { InventoryItem } from '@/lib/inventory';

interface RecentHistoryProps {
  items: InventoryItem[];
}

export function RecentHistory({ items }: RecentHistoryProps) {
  const recentItems = items.slice(0, 2);

  if (recentItems.length === 0) {
    return (
      <div className="px-safe py-6 text-center">
        <Package className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">
          No hay registros recientes
        </p>
      </div>
    );
  }

  return (
    <div className="px-safe">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Últimos registros
        </span>
      </div>
      
      <div className="space-y-2">
        {recentItems.map((item) => {
          const ubicacion = [
            item.ubicacion.pasillo,
            item.ubicacion.columna,
            item.ubicacion.leja,
          ]
            .filter(Boolean)
            .join('-');

          return (
            <Card
              key={item.id}
              className="p-3 bg-card border-border animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-semibold text-foreground truncate">
                    {item.codigo}
                  </p>
                  <p className="text-xs text-muted-foreground">{ubicacion}</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-xl font-bold text-primary">{item.cantidad}</p>
                  <p className="text-xs text-muted-foreground">uds</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
