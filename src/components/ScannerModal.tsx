import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      setIsStarting(true);
      setError(null);

      try {
        const scanner = new Html5Qrcode('scanner-container');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.777,
          },
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
            onClose();
          },
          () => {
            // Ignore scan failures
          }
        );
      } catch (err) {
        console.error('Scanner error:', err);
        setError('No se pudo acceder a la cámara. Verifica los permisos.');
      } finally {
        setIsStarting(false);
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current?.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch {
          // Ignore stop errors
        }
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen, onScan, onClose]);

  const handleClose = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-safe py-4 bg-primary">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary-foreground" />
          <span className="font-semibold text-primary-foreground">Escaneando...</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Scanner viewport */}
      <div className="flex-1 flex items-center justify-center px-safe">
        <div
          ref={containerRef}
          id="scanner-container"
          className="w-full max-w-md aspect-video rounded-xl overflow-hidden bg-foreground/50"
        />
      </div>

      {/* Status */}
      <div className="px-safe py-6 text-center">
        {isStarting && (
          <p className="text-muted-foreground animate-pulse">
            Iniciando cámara...
          </p>
        )}
        {error && (
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}
        {!isStarting && !error && (
          <p className="text-muted-foreground">
            Centra el código de barras en el recuadro
          </p>
        )}
      </div>

      {/* Cancel button */}
      <div className="px-safe pb-8">
        <Button
          variant="outline"
          onClick={handleClose}
          className="w-full h-14 text-lg font-semibold border-2 border-muted-foreground/30 text-muted-foreground"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
