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
    console.log('Starting QR scanner...');
    console.log('User agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    console.log('Location protocol:', location.protocol);
    console.log('Location hostname:', location.hostname);
    console.log('Is secure context:', window.isSecureContext);
    
    // Enhanced mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('Is mobile device:', isMobile);
    
    // Check navigator object structure
    console.log('navigator keys:', Object.keys(navigator));
    console.log('navigator.mediaDevices exists:', 'mediaDevices' in navigator);
    console.log('navigator.mediaDevices value:', navigator.mediaDevices);
    
    // Check for legacy getUserMedia APIs
    const hasLegacyGetUserMedia = !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
    console.log('Has legacy getUserMedia:', hasLegacyGetUserMedia);
    
    // Modern API check
    if (!navigator.mediaDevices || typeof navigator.mediaDevices !== 'object') {
      console.error('navigator.mediaDevices not available or not an object');
      
      if (hasLegacyGetUserMedia) {
        toast({
          title: "Outdated Browser",
          description: "Your browser uses an old camera API. Please update to a newer version.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Camera Not Supported",
          description: "This browser doesn't support camera access. Try Chrome, Firefox, or Safari on a secure connection.",
          variant: "destructive",
        });
      }
      return;
    }
    
    if (!navigator.mediaDevices.getUserMedia || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      console.error('getUserMedia not available or not a function');
      toast({
        title: "Camera Access Unavailable", 
        description: "Camera access is not supported. Please use a modern browser with HTTPS.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('✓ Camera API available, proceeding with device enumeration...');

    // Check if we can enumerate devices first
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available cameras:', videoDevices.length);
      console.log('Camera devices:', videoDevices);
      
      if (videoDevices.length === 0) {
        console.error('No camera devices found');
        toast({
          title: "No Camera Found",
          description: "No camera devices detected on this device.",
          variant: "destructive",
        });
        return;
      }
    } catch (enumError: any) {
      console.warn('Could not enumerate devices:', enumError);
      // Continue anyway - some browsers restrict this until permission is granted
    }

    try {
      console.log('Requesting camera permission...');
      
      // Different constraints for mobile vs desktop
      const constraints = isMobile ? {
        video: {
          facingMode: { ideal: "environment" },
          width: { min: 320, ideal: 640, max: 1920 },
          height: { min: 240, ideal: 480, max: 1080 }
        }
      } : {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      
      console.log('Using constraints:', constraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera permission granted, setting up video stream');
      console.log('Stream tracks:', mediaStream.getTracks().map(track => ({
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      })));
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for metadata to load before playing
        await new Promise((resolve, reject) => {
          if (!videoRef.current) return reject('Video element not found');
          
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            resolve(true);
          };
          
          videoRef.current.onerror = (e) => {
            console.error('Video error:', e);
            reject(e);
          };
          
          // Timeout after 5 seconds
          setTimeout(() => reject('Video load timeout'), 5000);
        });
        
        await videoRef.current.play();
        console.log('Video stream started successfully');
      }
      
      setScanning(true);
      
      toast({
        title: "Camera Ready",
        description: "Point your camera at a QR code to scan it.",
      });
      
    } catch (error: any) {
      console.error('Camera access error details:', {
        name: error?.name,
        message: error?.message,
        constraint: error?.constraint,
        stack: error?.stack
      });
      
      let errorMessage = "Unable to access camera. Please check permissions.";
      
      if (error?.name === 'NotAllowedError') {
        errorMessage = "Camera access denied. Please allow camera permission and try again.";
      } else if (error?.name === 'NotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (error?.name === 'NotSupportedError') {
        errorMessage = "Camera not supported on this device.";
      } else if (error?.name === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application.";
      } else if (error?.name === 'OverconstrainedError') {
        errorMessage = "Camera doesn't support the requested configuration.";
      } else if (error?.name === 'SecurityError') {
        errorMessage = "Camera access blocked by security policy.";
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
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
                    <div className="text-center space-y-3">
                      <Camera className="mx-auto h-12 w-12" />
                      <div>
                        <p className="font-medium mb-1">Camera Not Available</p>
                        <p className="text-sm mb-2">QR code scanning requires camera access</p>
                        <div className="text-xs space-y-1">
                          <p>• Try using a mobile device</p>
                          <p>• Use Chrome, Firefox, or Safari</p>
                          <p>• Allow camera permissions when prompted</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-600 mb-4 space-y-2">
                <p>Point your camera at a QR code to scan it</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Tip:</strong> QR codes work best on mobile devices. Each box has a QR code you can scan to quickly access it.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full"
                  data-testid="button-close-scanner"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close Scanner
                </Button>
                
                <div className="text-center space-y-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      console.log('=== MANUAL CAMERA TEST ===');
                      console.log('navigator.mediaDevices:', navigator.mediaDevices);
                      console.log('typeof navigator.mediaDevices:', typeof navigator.mediaDevices);
                      
                      if (!navigator.mediaDevices || typeof navigator.mediaDevices !== 'object') {
                        toast({
                          title: "Camera API Missing",
                          description: "navigator.mediaDevices is undefined. Need HTTPS or newer browser.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      if (!navigator.mediaDevices.getUserMedia || typeof navigator.mediaDevices.getUserMedia !== 'function') {
                        toast({
                          title: "getUserMedia Missing",
                          description: "Camera function not available. Try a different browser.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        console.log('✓ Camera access successful!');
                        stream.getTracks().forEach(track => track.stop());
                        toast({
                          title: "Camera Test Successful",
                          description: "Camera access is working. Try the scanner again.",
                        });
                      } catch (error: any) {
                        console.error('✗ Camera test failed:', error);
                        toast({
                          title: "Camera Test Failed",
                          description: `Error: ${error.name} - ${error.message}`,
                          variant: "destructive",
                        });
                      }
                    }}
                    data-testid="button-test-camera"
                  >
                    Test Camera Access
                  </Button>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Alternative: Navigate manually</p>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Enter box ID (e.g., box-kitchen-storage)"
                        className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const boxId = (e.target as HTMLInputElement).value.trim();
                            if (boxId) {
                              window.location.href = `/box/${boxId}`;
                            }
                          }
                        }}
                        data-testid="input-manual-box-id"
                      />
                      <Button
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector('input');
                          const boxId = input?.value.trim();
                          if (boxId) {
                            window.location.href = `/box/${boxId}`;
                          }
                        }}
                        data-testid="button-navigate-to-box"
                      >
                        Go
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
