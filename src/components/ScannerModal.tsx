import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle, Flashlight, FlashlightOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

// All supported barcode formats
const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.AZTEC,
  Html5QrcodeSupportedFormats.PDF_417,
];

export function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    trackRef.current = null;
    setTorchOn(false);
    setTorchAvailable(false);
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!trackRef.current) return;
    
    try {
      const capabilities = trackRef.current.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      if (capabilities.torch) {
        const newTorchState = !torchOn;
        await trackRef.current.applyConstraints({
          advanced: [{ torch: newTorchState } as MediaTrackConstraintSet]
        });
        setTorchOn(newTorchState);
      }
    } catch (err) {
      console.error('Error toggling torch:', err);
    }
  }, [torchOn]);

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      setIsStarting(true);
      setError(null);
      setScanAttempts(0);
      setIsScanning(false);

      try {
        const scanner = new Html5Qrcode('scanner-container', {
          formatsToSupport: SUPPORTED_FORMATS,
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 30,
            qrbox: { width: 300, height: 120 },
            aspectRatio: 1.777,
            disableFlip: false,
          },
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
            onClose();
          },
          () => {
            // Count scan attempts for feedback
            setScanAttempts(prev => prev + 1);
            setIsScanning(true);
          }
        );

        // Get the video track for torch control
        const videoElement = document.querySelector('#scanner-container video') as HTMLVideoElement;
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          const tracks = stream.getVideoTracks();
          if (tracks.length > 0) {
            trackRef.current = tracks[0];
            const capabilities = tracks[0].getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
            setTorchAvailable(!!capabilities.torch);
          }
        }
      } catch (err) {
        console.error('Scanner error:', err);
        setError('No se pudo acceder a la cámara. Verifica los permisos.');
      } finally {
        setIsStarting(false);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen, onScan, onClose, stopScanner]);

  const handleClose = async () => {
    await stopScanner();
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
      <div className="flex-1 flex items-center justify-center px-safe relative">
        <div className="relative w-full max-w-md">
          <div
            ref={containerRef}
            id="scanner-container"
            className={`w-full aspect-video rounded-xl overflow-hidden bg-foreground/50 ${
              isScanning ? 'ring-2 ring-accent animate-pulse' : ''
            }`}
          />
          
          {/* Scanning animation overlay */}
          {isScanning && !isStarting && (
            <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent animate-[scan_2s_ease-in-out_infinite]" 
                   style={{ 
                     animation: 'scan 2s ease-in-out infinite',
                   }} 
              />
            </div>
          )}
          
          {/* Torch button */}
          {torchAvailable && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTorch}
              className={`absolute top-3 right-3 rounded-full w-12 h-12 ${
                torchOn 
                  ? 'bg-accent text-accent-foreground' 
                  : 'bg-background/60 text-foreground backdrop-blur-sm'
              }`}
            >
              {torchOn ? (
                <FlashlightOff className="w-6 h-6" />
              ) : (
                <Flashlight className="w-6 h-6" />
              )}
            </Button>
          )}
          
          {/* Scan attempts counter */}
          {scanAttempts > 0 && !isStarting && (
            <div className="absolute bottom-3 left-3 bg-background/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-foreground">
              Intentos: {scanAttempts}
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="px-safe py-6 text-center">
        {isStarting && (
          <p className="text-muted-foreground animate-pulse">
            Iniciando cámara HD...
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
      
      {/* Scanning line animation styles */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(calc(100% * 1.777 / 2)); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
