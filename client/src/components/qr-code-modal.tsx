import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Camera, X } from "lucide-react";
import { generateQRCode, downloadQRCode, printQRCode } from "@/lib/qr-utils";
import { useToast } from "@/hooks/use-toast";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "display" | "scanner";
  boxId?: string;
  boxName?: string;
}

export default function QRCodeModal({ open, onOpenChange, mode, boxId, boxName }: QRCodeModalProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  console.log('QRCodeModal rendered:', { open, mode, boxId, boxName });

  useEffect(() => {
    if (open && mode === "display" && boxId) {
      const generateCode = async () => {
        // Small delay to ensure canvas is rendered
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (canvasRef.current) {
          const url = `${window.location.origin}/box/${boxId}`;
          console.log('Generating QR code for URL:', url);
          console.log('Canvas element:', canvasRef.current);
          
          try {
            await generateQRCode(url, canvasRef.current);
            console.log('QR code generated successfully');
          } catch (error) {
            console.error('QR code generation failed:', error);
            toast({
              title: "QR Code Error",
              description: "Failed to generate QR code. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          console.error('Canvas element not found');
        }
      };
      
      generateCode();
    }
  }, [open, mode, boxId, toast]);

  useEffect(() => {
    if (open && mode === "scanner") {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open, mode]);

  const startScanning = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setScanning(true);
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const handleDownload = async () => {
    if (!boxId || !canvasRef.current) return;
    try {
      const url = `${window.location.origin}/box/${boxId}`;
      await downloadQRCode(url, `${boxName || 'box'}-qr-code.png`);
      toast({
        title: "Downloaded",
        description: "QR code has been downloaded to your device.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async () => {
    if (!boxId || !canvasRef.current) return;
    try {
      const url = `${window.location.origin}/box/${boxId}`;
      await printQRCode(url, boxName || 'Box');
      toast({
        title: "Printing",
        description: "QR code is being sent to printer.",
      });
    } catch (error) {
      toast({
        title: "Print failed",
        description: "Failed to print QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle data-testid="text-qr-modal-title">
            {mode === "display" ? "Box QR Code" : "Scan QR Code"}
          </DialogTitle>
          <DialogDescription>
            {mode === "display" 
              ? "Scan this QR code to quickly access this box from your mobile device"
              : "Point your camera at a QR code to navigate to that box"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-center">
          {mode === "display" && boxId ? (
            <>
              {/* QR Code Display */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 mb-4">
                <canvas
                  ref={canvasRef}
                  className="mx-auto block border border-gray-100"
                  width="256"
                  height="256"
                  style={{ width: '256px', height: '256px' }}
                  data-testid="canvas-qr-code"
                />
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p data-testid="text-box-name">{boxName}</p>
                <p className="font-mono text-xs" data-testid="text-box-id">
                  {boxId}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownload}
                  data-testid="button-download-qr"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePrint}
                  data-testid="button-print-qr"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </>
          ) : mode === "scanner" ? (
            <>
              {/* QR Code Scanner */}
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                {scanning ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover rounded"
                      autoPlay
                      playsInline
                      muted
                      data-testid="video-scanner"
                    />
                    <div className="absolute inset-0 border-2 border-primary rounded pointer-events-none">
                      <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                      <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Camera className="mx-auto h-12 w-12 mb-2" />
                      <p>Camera not available</p>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Point your camera at a QR code to scan it
              </p>
              
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-close-scanner"
              >
                <X className="h-4 w-4 mr-2" />
                Close Scanner
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
