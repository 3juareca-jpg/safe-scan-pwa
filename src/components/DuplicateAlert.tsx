import { AlertTriangle, Plus, Replace, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { InventoryItem } from '@/lib/inventory';

interface DuplicateAlertProps {
  isOpen: boolean;
  existingItem: InventoryItem | null;
  newQuantity: number;
  onSum: () => void;
  onReplace: () => void;
  onCancel: () => void;
}

export function DuplicateAlert({
  isOpen,
  existingItem,
  newQuantity,
  onSum,
  onReplace,
  onCancel,
}: DuplicateAlertProps) {
  if (!existingItem) return null;

  const ubicacionStr = [
    existingItem.ubicacion.pasillo,
    existingItem.ubicacion.columna,
    existingItem.ubicacion.leja,
  ]
    .filter(Boolean)
    .join('-');

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="mx-4 max-w-sm rounded-xl">
        <AlertDialogHeader className="space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-warning/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-warning" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Artículo Duplicado
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <p>
              El código <strong className="text-foreground">{existingItem.codigo}</strong> ya
              existe en <strong className="text-foreground">{ubicacionStr}</strong>
            </p>
            <div className="py-3 px-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Cantidad actual</p>
              <p className="text-3xl font-bold text-foreground">{existingItem.cantidad}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={onSum}
            className="w-full h-14 text-base font-semibold bg-success hover:bg-success/90"
          >
            <Plus className="w-5 h-5 mr-2" />
            Sumar (+{newQuantity} = {existingItem.cantidad + newQuantity})
          </Button>
          
          <Button
            onClick={onReplace}
            variant="outline"
            className="w-full h-14 text-base font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Replace className="w-5 h-5 mr-2" />
            Sobrescribir ({newQuantity})
          </Button>
          
          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full h-12 text-base text-muted-foreground"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Cancelar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
