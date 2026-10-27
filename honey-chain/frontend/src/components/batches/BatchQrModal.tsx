import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '../ui';
import {
  QrCode,
  Download,
  Printer,
  ExternalLink,
  Copy,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  Wifi,
  Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getBatchVerificationUrl,
  setSavedNetworkHost,
  isLocalhost,
  getBestNetworkHost,
} from '../../utils/url';

interface BatchQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
  variety?: string;
  beekeeperName?: string;
  origin?: string;
  harvestDate?: string;
  purityScore?: string;
  isDemo?: boolean;
}

export function BatchQrModal({
  isOpen,
  onClose,
  batchId,
  variety = 'Wild Acacia Himalayan Raw Honey',
  beekeeperName = 'Rajesh Kumar (Himalayan Organic Apiaries)',
  origin = 'Maldevta Apiary, Dehradun, Uttarakhand',
  harvestDate = 'April 12, 2025',
  purityScore = '99.4%',
  isDemo = true,
}: BatchQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'label'>('qr');
  const printRef = useRef<HTMLDivElement>(null);

  // Network host configuration for phone scanning over Wi-Fi
  const [useNetworkHost, setUseNetworkHost] = useState<boolean>(() => isLocalhost());
  const [networkHost, setNetworkHost] = useState<string>(() => {
    return getBestNetworkHost() || '192.168.1.x';
  });
  const [isEditingHost, setIsEditingHost] = useState<boolean>(false);

  // Current active port dynamically detected from the browser environment
  const activePort = typeof window !== 'undefined' && window.location.port ? window.location.port : '5173';

  // Verification URL dynamically computed based on environment and network selection
  const verificationUrl = useNetworkHost && networkHost.trim()
    ? getBatchVerificationUrl(batchId, `${networkHost.trim()}:${activePort}`)
    : getBatchVerificationUrl(batchId);

  useEffect(() => {
    if (!isOpen || !batchId) return;

    QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      width: 512,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, batchId, verificationUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      toast.success('Verification URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleHostSave = (newHost: string) => {
    setNetworkHost(newHost);
    setSavedNetworkHost(newHost);
    setIsEditingHost(false);
    toast.success('Network host saved for QR generation!');
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `honeychain-qr-${batchId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded QR code for ${batchId}`);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to print the label.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packaging Label — ${batchId}</title>
          <style>
            @page { size: auto; margin: 12mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 20px;
              background: #fff;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .label-card {
              border: 3px double #d97706;
              border-radius: 12px;
              padding: 24px;
              max-width: 480px;
              width: 100%;
              text-align: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.06);
              background: #fafaf9;
            }
            .brand-header {
              font-size: 11px;
              letter-spacing: 2.5px;
              font-weight: 800;
              color: #b45309;
              text-transform: uppercase;
              margin-bottom: 6px;
            }
            .product-title {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              margin: 4px 0 12px 0;
            }
            .qr-image {
              width: 190px;
              height: 190px;
              margin: 12px auto;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 6px;
              background: #fff;
              display: block;
            }
            .meta-grid {
              font-size: 12px;
              text-align: left;
              margin: 14px 0;
              padding: 10px 14px;
              background: #fff;
              border-radius: 8px;
              border: 1px solid #e7e5e4;
              line-height: 1.6;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px dashed #f5f5f4;
              padding: 3px 0;
            }
            .meta-label { color: #64748b; font-weight: 600; }
            .meta-val { color: #0f172a; font-weight: 700; }
            .badges {
              display: flex;
              justify-content: center;
              gap: 8px;
              margin-top: 12px;
              font-size: 11px;
              font-weight: 700;
            }
            .badge-item {
              padding: 4px 10px;
              border-radius: 20px;
              background: #fef3c7;
              color: #92400e;
              border: 1px solid #fde68a;
            }
            .footer-note {
              font-size: 10px;
              color: #94a3b8;
              margin-top: 14px;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="brand-header">HONEY CHAIN · SMART APICULTURE</div>
            <div class="product-title">${variety}</div>
            <div class="badges">
              <span class="badge-item">100% PURE & RAW</span>
              <span class="badge-item">PURITY: ${purityScore}</span>
              <span class="badge-item">FSSAI / CODEX</span>
            </div>
            <img class="qr-image" src="${qrDataUrl}" alt="Batch QR Code" />
            <div style="font-size: 12px; font-weight: bold; color: #475569;">
              Scan for Blockchain Provenance & Lab Report
            </div>
            <div class="meta-grid">
              <div class="meta-row">
                <span class="meta-label">Batch ID:</span>
                <span class="meta-val" style="font-family: monospace;">${batchId}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Harvest Date:</span>
                <span class="meta-val">${harvestDate}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Producer:</span>
                <span class="meta-val">${beekeeperName}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Apiary Origin:</span>
                <span class="meta-val">${origin}</span>
              </div>
            </div>
            <div class="footer-note">
              Cryptographically verified on Ethereum blockchain · Honey Chain Protocol
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">QR Code & Label Generator</h3>
                {isDemo && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    DEMO BATCH
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">ID: {batchId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 px-6 pt-2 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'qr'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            QR Verification Code
          </button>
          <button
            onClick={() => setActiveTab('label')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'label'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Packaging Label Preview
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {activeTab === 'qr' ? (
            <div className="flex flex-col items-center text-center space-y-4">
              {/* QR Container */}
              <div className="relative p-4 bg-white rounded-2xl border-2 border-dashed border-amber-300 shadow-inner group">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for batch ${batchId}`}
                    className="w-56 h-56 rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-lg">
                    <span className="text-xs text-slate-400 animate-pulse">Generating QR...</span>
                  </div>
                )}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap">
                  <ShieldCheck className="w-3 h-3" />
                  BLOCKCHAIN ANCHORED
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-800">{variety}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scan with any smartphone camera on the same Wi-Fi network
                </p>
              </div>

              {/* Wi-Fi / Local Network Host Switcher */}
              <div className="w-full p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5 text-[11px]">
                    <Wifi className="w-3.5 h-3.5 text-amber-700" />
                    Target Network Host for Phone Scanning:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setUseNetworkHost(true)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        useNetworkHost
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Wi-Fi Host
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseNetworkHost(false)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        !useNetworkHost
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Localhost
                    </button>
                  </div>
                </div>

                {useNetworkHost && (
                  <div className="pt-1">
                    {isEditingHost ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={networkHost}
                          onChange={(e) => setNetworkHost(e.target.value)}
                          placeholder="e.g. 192.168.1.5"
                          className="flex-1 px-2.5 py-1 text-xs border border-amber-300 rounded-lg bg-white font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleHostSave(networkHost)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-amber-200">
                        <span className="font-mono text-slate-700">
                          {networkHost}:{activePort}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingHost(true)}
                          className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 text-[10px]"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit Host IP
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-amber-900/70 mt-1">
                      Phones on the same Wi-Fi will open: <span className="font-mono font-semibold">{verificationUrl}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* URL preview box */}
              <div className="w-full flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left">
                <span className="text-xs font-mono text-slate-600 truncate flex-1" title={verificationUrl}>
                  {verificationUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            /* Packaging Label Preview */
            <div ref={printRef} className="border-2 border-amber-300/80 bg-stone-50 rounded-2xl p-5 text-center shadow-sm space-y-3">
              <div className="text-[10px] font-extrabold tracking-widest text-amber-700 uppercase">
                HONEY CHAIN · CERTIFIED SMART APICULTURE
              </div>
              <h4 className="text-base font-extrabold text-slate-900">{variety}</h4>
              <div className="flex justify-center gap-2 text-[10px] font-bold">
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">100% RAW & UNFILTERED</span>
                <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200">PURITY: {purityScore}</span>
              </div>

              {qrDataUrl && (
                <div className="flex justify-center my-2">
                  <img src={qrDataUrl} alt="Label QR" className="w-36 h-36 bg-white p-2 rounded-lg border border-slate-200" />
                </div>
              )}

              <p className="text-[11px] font-semibold text-slate-600">
                Scan for Blockchain Provenance & Lab Test
              </p>

              <div className="bg-white rounded-xl p-3 text-left text-xs border border-stone-200 space-y-1.5">
                <div className="flex justify-between border-b border-stone-100 pb-1">
                  <span className="text-slate-500">Batch Number:</span>
                  <span className="font-mono font-bold text-slate-800">{batchId}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-1">
                  <span className="text-slate-500">Harvest Date:</span>
                  <span className="font-medium text-slate-800">{harvestDate}</span>
                </div>
                <div className="flex justify-between border-b border-stone-100 pb-1">
                  <span className="text-slate-500">Producer:</span>
                  <span className="font-medium text-slate-800">{beekeeperName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Apiary Origin:</span>
                  <span className="font-medium text-slate-800">{origin}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Label
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center font-medium rounded-lg px-3 py-1.5 text-xs gap-1.5 bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Verification Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
