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

// Extended type for camera capabilities
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  focusMode?: string[];
  focusDistance?: { min: number; max: number };
  exposureMode?: string[];
  whiteBalanceMode?: string[];
}

export function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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
    setIsFocused(false);
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!trackRef.current) return;
    
    try {
      const capabilities = trackRef.current.getCapabilities() as ExtendedMediaTrackCapabilities;
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

  // Apply advanced camera constraints for optimal barcode scanning
  const applyAdvancedCameraConstraints = useCallback(async (videoTrack: MediaStreamTrack) => {
    try {
      const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
      const constraints: MediaTrackConstraints & { focusMode?: string; focusDistance?: number; exposureMode?: string } = {};
      
      // Configure continuous focus mode for stable scanning
      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        constraints.focusMode = 'continuous';
        console.log('✓ Enfoque continuo activado');
      }
      
      // Set optimal focus distance for barcodes (30-50cm range)
      if (capabilities.focusDistance) {
        // Calculate optimal distance (0.3-0.5 meters mapped to capability range)
        const { min, max } = capabilities.focusDistance;
        const optimalDistance = Math.min(Math.max(0.4, min), max); // ~40cm
        constraints.focusDistance = optimalDistance;
        console.log(`✓ Distancia de enfoque: ${optimalDistance}m`);
      }
      
      // Optimize exposure for white labels with barcodes
      if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
        constraints.exposureMode = 'continuous';
        console.log('✓ Exposición continua activada');
      }
      
      // Apply constraints if any were set
      if (Object.keys(constraints).length > 0) {
        await videoTrack.applyConstraints(constraints as MediaTrackConstraints);
        console.log('✓ Configuración de cámara optimizada aplicada');
      }
      
      // Check torch availability
      setTorchAvailable(!!capabilities.torch);
      
    } catch (err) {
      console.warn('No se pudieron aplicar todas las constraints:', err);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      setIsStarting(true);
      setError(null);
      setScanAttempts(0);
      setIsScanning(false);
      setIsFocused(false);

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
            qrbox: { width: 320, height: 100 }, // Optimized for horizontal barcodes
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

        // Get the video track for torch and focus control
        const videoElement = document.querySelector('#scanner-container video') as HTMLVideoElement;
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          const tracks = stream.getVideoTracks();
          if (tracks.length > 0) {
            const videoTrack = tracks[0];
            trackRef.current = videoTrack;
            
            // Apply advanced camera constraints for optimal barcode scanning
            await applyAdvancedCameraConstraints(videoTrack);
            
            // Set focused state after camera stabilizes (1.5s)
            setTimeout(() => {
              setIsFocused(true);
            }, 1500);
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
  }, [isOpen, onScan, onClose, stopScanner, applyAdvancedCameraConstraints]);

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
              isScanning && isFocused ? 'ring-4 ring-green-500' : 'ring-2 ring-white/30'
            }`}
          />
          
          {/* Barcode alignment frame overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative" style={{ width: '320px', height: '100px' }}>
              {/* Corner decorations for barcode alignment */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-lg" />
              
              {/* Scanning line animation */}
              {isScanning && !isStarting && (
                <div 
                  className="absolute left-2 right-2 h-0.5 bg-accent"
                  style={{ 
                    animation: 'scanLine 1.5s ease-in-out infinite',
                  }} 
                />
              )}
            </div>
          </div>
          
          {/* Focus ready indicator */}
          {isFocused && !isStarting && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Cámara lista
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
          
          {/* Distance guide */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-center">
            <p className="text-white text-xs bg-black/70 px-3 py-1.5 rounded-full backdrop-blur-sm">
              📏 Mantén el código a 30-50cm
            </p>
          </div>
          
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
            {isFocused 
              ? 'Centra el código de barras en el marco verde'
              : 'Estabilizando enfoque...'
            }
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
        @keyframes scanLine {
          0%, 100% { 
            top: 0; 
            opacity: 0.8; 
          }
          50% { 
            top: calc(100% - 2px); 
            opacity: 1; 
          }
        }
      `}</style>
    </div>
  );
}
