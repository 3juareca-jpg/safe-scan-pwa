import { useState, useEffect, useRef } from 'react';
import { Camera, Keyboard, CheckCircle, Save, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { LocationHeader } from '@/components/LocationHeader';
import { ScannerModal } from '@/components/ScannerModal';
import { DuplicateAlert } from '@/components/DuplicateAlert';
import { RecentHistory } from '@/components/RecentHistory';
import { InventoryList } from '@/components/InventoryList';
import {
  Location,
  InventoryItem,
  getInventory,
  getSavedLocation,
  addItem,
  findDuplicate,
  sumQuantity,
  replaceQuantity,
  isGenericZone,
} from '@/lib/inventory';

type AppView = 'capture' | 'history';
type CaptureStep = 'scan' | 'confirm' | 'quantity';

export default function Index() {
  const [view, setView] = useState<AppView>('capture');
  const [step, setStep] = useState<CaptureStep>('scan');
  const [location, setLocation] = useState<Location>(getSavedLocation);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  const [scannerOpen, setScannerOpen] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [cantidad, setCantidad] = useState('');
  
  const [duplicateItem, setDuplicateItem] = useState<InventoryItem | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState(0);
  
  const cantidadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInventory(getInventory());
  }, []);

  useEffect(() => {
    if (step === 'quantity' && cantidadInputRef.current) {
      cantidadInputRef.current.focus();
    }
  }, [step]);

  const refreshInventory = () => {
    setInventory(getInventory());
  };

  const handleScan = (scannedCode: string) => {
    setCodigo(scannedCode);
    setStep('confirm');
  };

  const handleManualEntry = () => {
    if (codigo.trim()) {
      setStep('confirm');
    }
  };

  const handleConfirmArticle = () => {
    setStep('quantity');
  };

  const validateLocation = (): boolean => {
    if (!location.pasillo.trim()) {
      toast.error('Introduce el PASILLO');
      return false;
    }
    if (!isGenericZone(location.pasillo)) {
      if (!location.columna.trim() || !location.leja.trim()) {
        toast.error('Introduce COLUMNA y LEJA');
        return false;
      }
    }
    return true;
  };

  const handleSave = () => {
    if (!validateLocation()) return;
    
    const qty = parseInt(cantidad, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Introduce una cantidad válida');
      return;
    }

    const existing = findDuplicate(codigo, location);
    if (existing) {
      setDuplicateItem(existing);
      setPendingQuantity(qty);
      return;
    }

    // No duplicate - save directly
    saveNewItem(qty);
  };

  const saveNewItem = (qty: number) => {
    addItem({
      codigo: codigo.trim().toUpperCase(),
      cantidad: qty,
      ubicacion: { ...location },
    });
    
    toast.success('Artículo guardado', {
      description: `${codigo} × ${qty}`,
    });
    
    resetCapture();
    refreshInventory();
  };

  const handleDuplicateSum = () => {
    if (duplicateItem) {
      sumQuantity(duplicateItem.id, pendingQuantity);
      toast.success('Cantidad sumada', {
        description: `Total: ${duplicateItem.cantidad + pendingQuantity}`,
      });
    }
    closeDuplicateAlert();
    resetCapture();
    refreshInventory();
  };

  const handleDuplicateReplace = () => {
    if (duplicateItem) {
      replaceQuantity(duplicateItem.id, pendingQuantity);
      toast.success('Cantidad reemplazada', {
        description: `Nueva cantidad: ${pendingQuantity}`,
      });
    }
    closeDuplicateAlert();
    resetCapture();
    refreshInventory();
  };

  const closeDuplicateAlert = () => {
    setDuplicateItem(null);
    setPendingQuantity(0);
  };

  const resetCapture = () => {
    setCodigo('');
    setCantidad('');
    setStep('scan');
  };

  // Show history view
  if (view === 'history') {
    return (
      <div className="min-h-screen bg-background">
        <InventoryList items={inventory} onUpdate={refreshInventory} />
        <div className="fixed bottom-0 left-0 right-0 px-safe py-4 bg-background border-t border-border">
          <Button
            onClick={() => setView('capture')}
            className="w-full h-14 text-lg font-semibold bg-primary"
          >
            <Camera className="w-5 h-5 mr-2" />
            Volver a Captura
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LocationHeader location={location} onChange={setLocation} />

      <main className="flex-1 px-safe py-3 space-y-3">
        {/* Step: Scan */}
        {step === 'scan' && (
          <div className="space-y-3 animate-fade-in">
            <div className="text-center">
              <h1 className="text-base font-bold text-foreground">
                Captura de Artículo
              </h1>
              <p className="text-muted-foreground text-sm">
                Escanea o introduce el código
              </p>
            </div>

            <Button
              onClick={() => setScannerOpen(true)}
              className="w-full h-16 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground animate-pulse-scale"
            >
              <Camera className="w-6 h-6 mr-2" />
              ESCANEAR
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">
                  o introduce manualmente
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="codigo-manual" className="text-xs font-medium">
                Código de artículo
              </Label>
              <div className="flex gap-2">
                <Input
                  id="codigo-manual"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="EAN, SKU, QR..."
                  className="h-12 text-base font-mono flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleManualEntry()}
                />
                <Button
                  onClick={handleManualEntry}
                  disabled={!codigo.trim()}
                  className="h-12 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  <Keyboard className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-3 animate-fade-in">
            <Card className="p-3 text-center border-2 border-primary bg-primary/5">
              <p className="text-xs text-muted-foreground mb-1">Código detectado</p>
              <p className="text-xl font-mono font-bold text-foreground break-all">
                {codigo}
              </p>
            </Card>

            <Button
              onClick={handleConfirmArticle}
              className="w-full h-14 text-lg font-bold bg-success hover:bg-success/90 text-success-foreground"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              CONFIRMAR ARTÍCULO
            </Button>

            <Button
              onClick={resetCapture}
              variant="outline"
              className="w-full h-10 text-sm text-muted-foreground border-muted-foreground/30"
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Step: Quantity */}
        {step === 'quantity' && (
          <div className="space-y-2 animate-fade-in">
            <Card className="p-2.5 bg-muted/50">
              <p className="text-[10px] text-muted-foreground">Artículo</p>
              <p className="font-mono font-bold text-base text-foreground">{codigo}</p>
            </Card>

            <div className="space-y-1">
              <Label htmlFor="cantidad" className="text-sm font-semibold">
                CANTIDAD
              </Label>
              <Input
                ref={cantidadInputRef}
                id="cantidad"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="0"
                className="h-14 text-3xl font-bold text-center"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={!cantidad || parseInt(cantidad, 10) <= 0}
              className="w-full h-14 text-lg font-bold bg-success hover:bg-success/90 text-success-foreground"
            >
              <Save className="w-5 h-5 mr-2" />
              GUARDAR
            </Button>

            <Button
              onClick={resetCapture}
              variant="outline"
              className="w-full h-10 text-sm text-muted-foreground border-muted-foreground/30"
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Recent History (only in scan step) */}
        {step === 'scan' && (
          <div className="mt-4">
            <RecentHistory items={inventory} />
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <footer className="sticky bottom-0 px-safe py-4 bg-background border-t border-border">
        <Button
          onClick={() => setView('history')}
          variant="outline"
          className="w-full h-12 font-semibold gap-2"
        >
          <List className="w-5 h-5" />
          Ver Historial Completo ({inventory.length})
        </Button>
      </footer>

      {/* Scanner Modal */}
      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />

      {/* Duplicate Alert */}
      <DuplicateAlert
        isOpen={!!duplicateItem}
        existingItem={duplicateItem}
        newQuantity={pendingQuantity}
        onSum={handleDuplicateSum}
        onReplace={handleDuplicateReplace}
        onCancel={closeDuplicateAlert}
      />
    </div>
  );
}
