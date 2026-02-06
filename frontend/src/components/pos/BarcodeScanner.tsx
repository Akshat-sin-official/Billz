import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, CameraOff, SwitchCamera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  }, []);

  const startScanner = useCallback(async (cameraId?: string) => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode('barcode-scanner-region');
    }

    try {
      await stopScanner();
      setError(null);

      const cameraIdToUse = cameraId || cameras[currentCameraIndex]?.id;
      
      if (!cameraIdToUse) {
        // Get available cameras
        const devices = await Html5Qrcode.getCameras();
        if (devices.length === 0) {
          setError('No cameras found on this device');
          return;
        }
        setCameras(devices);
        await startScanner(devices[0].id);
        return;
      }

      await scannerRef.current.start(
        cameraIdToUse,
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          // Success callback
          toast({
            title: 'Barcode Scanned',
            description: decodedText,
          });
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        () => {
          // Ignore scan failures (continuously scanning)
        }
      );
      
      setIsScanning(true);
    } catch (err: any) {
      console.error('Scanner error:', err);
      setError(err?.message || 'Failed to start camera. Please check permissions.');
    }
  }, [cameras, currentCameraIndex, onClose, onScan, stopScanner, toast]);

  const switchCamera = useCallback(async () => {
    if (cameras.length <= 1) return;
    
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await startScanner(cameras[nextIndex].id);
  }, [cameras, currentCameraIndex, startScanner]);

  useEffect(() => {
    if (isOpen) {
      // Initialize cameras list
      Html5Qrcode.getCameras()
        .then(devices => {
          setCameras(devices);
          if (devices.length > 0) {
            startScanner(devices[0].id);
          } else {
            setError('No cameras found');
          }
        })
        .catch(err => {
          console.error('Failed to get cameras:', err);
          setError('Failed to access camera. Please grant camera permissions.');
        });
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode / QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner Region */}
          <div 
            id="barcode-scanner-region" 
            className="relative w-full min-h-[280px] bg-muted rounded-lg overflow-hidden"
          />

          {/* Error Message */}
          {error && (
            <div className="text-center text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isScanning ? (
              <Button onClick={() => startScanner()} variant="default">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <>
                <Button onClick={stopScanner} variant="outline">
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop
                </Button>
                {cameras.length > 1 && (
                  <Button onClick={switchCamera} variant="outline">
                    <SwitchCamera className="h-4 w-4 mr-2" />
                    Switch Camera
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Instructions */}
          <p className="text-xs text-center text-muted-foreground">
            Position the barcode within the frame to scan automatically
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BarcodeScanner;
