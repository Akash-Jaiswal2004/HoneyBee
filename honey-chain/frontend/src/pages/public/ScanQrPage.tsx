import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, Button, Input } from '../../components/ui';
import { BatchQrModal } from '../../components/batches/BatchQrModal';
import { Layers, Camera, X, AlertTriangle, Keyboard } from 'lucide-react';

type ScanState = 'idle' | 'requesting' | 'scanning' | 'denied' | 'error';

const SCANNER_ELEMENT_ID = 'honey-chain-qr-scanner';

export default function ScanQrPage() {
  const navigate = useNavigate();
  const [batchInput, setBatchInput] = useState('');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanError, setScanError] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [showDemoQrModal, setShowDemoQrModal] = useState(false);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // ── Stop the camera stream completely ───────────────────────────────────────
  const stopScanner = useCallback(async () => {
    if (!html5QrcodeRef.current) return;
    try {
      if (isScanningRef.current) {
        await html5QrcodeRef.current.stop();
        isScanningRef.current = false;
      }
    } catch {
      // Ignore errors on stop — stream may already be closed
    }
    try {
      html5QrcodeRef.current.clear();
    } catch {
      /* ignore */
    }
    html5QrcodeRef.current = null;
  }, []);

  // ── Clean up on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // ── Parse decoded text and navigate ────────────────────────────────────────
  const handleDecoded = useCallback(
    async (decodedText: string) => {
      await stopScanner();
      setScanState('idle');

      // Accept either a full URL or a bare batch ID
      const urlMatch = decodedText.match(/\/verify\/([^/?#]+)/);
      const batchId = urlMatch ? urlMatch[1] : decodedText.trim();

      if (!batchId) {
        setScanError('QR code did not contain a valid batch identifier.');
        setScanState('error');
        return;
      }

      navigate(`/verify/${batchId}`);
    },
    [navigate, stopScanner]
  );

  // ── Start the live camera scanner ───────────────────────────────────────────
  const startScanner = useCallback(async () => {
    setScanError('');
    setScanState('requesting');

    // Check getUserMedia availability
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanError('Camera API is not available in this browser. Use HTTPS or a modern browser.');
      setScanState('denied');
      return;
    }

    // Request permission explicitly so we get a clear denial error
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop()); // Release — html5-qrcode opens its own stream
    } catch (err: unknown) {
      const name = (err as Error).name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setScanError('Camera permission was denied. Please allow camera access in your browser settings and try again.');
        setScanState('denied');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setScanError('No camera was detected on this device. Use the manual entry form below.');
        setScanState('denied');
      } else {
        setScanError(`Camera error: ${(err as Error).message}`);
        setScanState('error');
      }
      return;
    }

    setScanState('scanning');

    // Give React a tick to render the scanner div before mounting into it
    await new Promise((r) => setTimeout(r, 80));

    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      html5QrcodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // rear camera
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        handleDecoded,
        (_errorMessage) => {
          // Per-frame decode failures are normal — ignore them
        }
      );
      isScanningRef.current = true;
    } catch (err: unknown) {
      isScanningRef.current = false;
      html5QrcodeRef.current = null;
      setScanError(`Failed to start scanner: ${(err as Error).message}`);
      setScanState('error');
    }
  }, [handleDecoded]);

  // ── Stop scanning (user closes the scanner) ─────────────────────────────────
  const cancelScanner = useCallback(async () => {
    await stopScanner();
    setScanState('idle');
    setScanError('');
  }, [stopScanner]);

  // ── Manual batch ID form ────────────────────────────────────────────────────
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = batchInput.trim().replace(/^.*\/verify\//, '');
    if (cleanId) navigate(`/verify/${cleanId}`);
  };

  const isScanning = scanState === 'scanning';
  const isRequesting = scanState === 'requesting';

  return (
    <div className="min-h-screen bg-[#faf9f6] py-16 px-4 flex items-center justify-center font-sans">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 text-[#0f172a] font-bold text-base mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center">
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <span>Honey Chain Provenance</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">Verify Batch Provenance</h1>
          <p className="text-xs text-[#64748b] leading-relaxed max-w-sm mx-auto">
            Scan the QR code on your package label to inspect verified laboratory records and harvest coordinates.
          </p>
        </div>

        <Card className="border-[#e8e4dc] shadow-lg p-6 space-y-5 bg-white rounded-2xl">

          {/* ── Idle: Show Scan button ── */}
          {scanState === 'idle' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-[#0f172a] flex items-center justify-center shadow-inner">
                <Camera className="w-10 h-10 text-amber-400" />
              </div>
              <p className="text-xs text-[#64748b] text-center max-w-xs">
                Tap the button below to open your camera. Point it at the QR code on the product label.
              </p>
              <Button
                id="btn-start-scanner"
                onClick={startScanner}
                className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Scan QR Code
              </Button>

              {/* Demo Mode Quick Test */}
              <div className="w-full mt-1 p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-xl border border-amber-300 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    ✨ Demo Mode (HC-DEMO-001)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                    TEST VERIFICATION
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  Test instant blockchain verification without a camera, or view and download the printable demo QR code.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                    onClick={() => navigate('/verify/HC-DEMO-001')}
                  >
                    Verify HC-DEMO-001
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs"
                    onClick={() => setShowDemoQrModal(true)}
                  >
                    View Demo QR Code
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Requesting permission ── */}
          {isRequesting && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-10 h-10 rounded-full border-2 border-[#0f172a] border-t-transparent animate-spin" />
              <p className="text-xs text-[#64748b]">Requesting camera permission…</p>
            </div>
          )}

          {/* ── Live scanner viewport ── */}
          {isScanning && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-[#0f172a] shadow-inner border border-slate-700">
                {/* html5-qrcode mounts its video element here */}
                <div id={SCANNER_ELEMENT_ID} className="w-full" style={{ minHeight: '260px' }} />
                {/* Corner brackets overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-52 h-52">
                    <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400 rounded-tl-lg" />
                    <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400 rounded-tr-lg" />
                    <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400 rounded-bl-lg" />
                    <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400 rounded-br-lg" />
                    {/* Scan line animation */}
                    <span className="absolute left-2 right-2 h-0.5 bg-amber-400/70 animate-[scan_2s_ease-in-out_infinite]" style={{ top: '50%' }} />
                  </div>
                </div>
              </div>
              <p className="text-center text-[11px] text-[#64748b]">
                Point your rear camera at the QR code on the label
              </p>
              <Button
                id="btn-cancel-scanner"
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center gap-2"
                onClick={cancelScanner}
              >
                <X className="w-3.5 h-3.5" />
                Cancel Scan
              </Button>
            </div>
          )}

          {/* ── Permission denied / error ── */}
          {(scanState === 'denied' || scanState === 'error') && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">{scanError}</p>
              </div>
              {scanState === 'denied' ? (
                <p className="text-[11px] text-[#64748b]">Use the manual entry form below instead.</p>
              ) : (
                <Button size="sm" onClick={startScanner} className="w-full bg-[#0f172a] text-white">
                  Try Again
                </Button>
              )}
            </div>
          )}

          {/* ── Divider ── */}
          {!isScanning && !isRequesting && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#e8e4dc]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <button
                    type="button"
                    onClick={() => setShowManual((v) => !v)}
                    className="bg-white px-3 text-[#64748b] font-semibold text-[10px] tracking-wider flex items-center gap-1 hover:text-[#0f172a] transition-colors"
                  >
                    <Keyboard className="w-3 h-3" />
                    {showManual ? 'Hide Manual Entry' : 'Or Enter Batch ID Manually'}
                  </button>
                </div>
              </div>

              {/* ── Manual entry form ── */}
              {showManual && (
                <form onSubmit={handleVerify} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] mb-1">
                      Public Batch ID or QR URL
                    </label>
                    <Input
                      id="input-batch-id"
                      placeholder="e.g. HC-202610-AB12CD"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      required
                    />
                    <p className="text-[10px] text-[#64748b] mt-1">
                      You can paste a full verification URL or just the batch ID from the label.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-[#64748b]">Quick test:</span>
                      <button
                        type="button"
                        onClick={() => setBatchInput('HC-DEMO-001')}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 transition-colors"
                      >
                        HC-DEMO-001
                      </button>
                    </div>
                  </div>
                  <Button
                    id="btn-manual-verify"
                    type="submit"
                    size="sm"
                    className="w-full py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white"
                  >
                    Verify Provenance
                  </Button>
                </form>
              )}
            </>
          )}
        </Card>

        <div className="text-center">
          <Link to="/" className="text-xs text-[#475569] hover:text-[#0f172a] font-medium transition-colors">
            ← Return to Honey Chain Platform
          </Link>
        </div>
      </div>

      {/* Demo QR Modal */}
      <BatchQrModal
        isOpen={showDemoQrModal}
        onClose={() => setShowDemoQrModal(false)}
        batchId="HC-DEMO-001"
        variety="Wild Acacia Himalayan Raw Honey"
        beekeeperName="Rajesh Kumar (Himalayan Organic Apiaries)"
        origin="Maldevta Apiary, Dehradun, Uttarakhand"
        harvestDate="April 12, 2025"
        purityScore="99.4%"
        isDemo={true}
      />

      {/* Scan-line keyframe — injected as a style tag since Tailwind v4 JIT may not have it */}
      <style>{`
        @keyframes scan {
          0%   { transform: translateY(-90px); }
          50%  { transform: translateY(90px);  }
          100% { transform: translateY(-90px); }
        }
      `}</style>
    </div>
  );
}
