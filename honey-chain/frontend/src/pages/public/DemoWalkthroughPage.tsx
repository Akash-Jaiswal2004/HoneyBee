import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Layers,
  CheckCircle2,
  QrCode,
  Download,
  Printer,
  ExternalLink,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Wifi,
  Droplets,
  FlaskConical,
  Package,
  Activity,
  MapPin,
  Sparkles,
  Info,
  Edit2,
} from 'lucide-react';
import { Button, Badge } from '../../components/ui';
import { BatchQrModal } from '../../components/batches/BatchQrModal';
import {
  getBatchVerificationUrl,
  setSavedNetworkHost,
  isLocalhost,
  getBestNetworkHost,
} from '../../utils/url';
import toast from 'react-hot-toast';

interface DemoState {
  currentStep: number;
  hiveRegistered: boolean;
  telemetryRefreshed: boolean;
  collectionRecorded: boolean;
  qualityTested: boolean;
  batchCreated: boolean;
  qrGenerated: boolean;
  telemetryValues: {
    temp: number;
    humidity: number;
    weight: number;
    battery: number;
    sound: number;
    lastUpdated: string;
  };
}

const INITIAL_DEMO_STATE: DemoState = {
  currentStep: 1,
  hiveRegistered: true,
  telemetryRefreshed: true,
  collectionRecorded: true,
  qualityTested: true,
  batchCreated: true,
  qrGenerated: true,
  telemetryValues: {
    temp: 34.2,
    humidity: 62.0,
    weight: 42.8,
    battery: 94,
    sound: 185,
    lastUpdated: new Date().toLocaleTimeString(),
  },
};

export default function DemoWalkthroughPage() {
  const navigate = useNavigate();
  const [demoState, setDemoState] = useState<DemoState>(() => {
    const saved = localStorage.getItem('honeychain_demo_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* fallback */
      }
    }
    return INITIAL_DEMO_STATE;
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [networkMode, setNetworkMode] = useState<'origin' | 'lan'>(() => isLocalhost() ? 'lan' : 'origin');
  const [networkHost, setNetworkHost] = useState<string>(() => {
    return getBestNetworkHost() || '192.168.1.x';
  });
  const [isEditingHost, setIsEditingHost] = useState(false);

  // Dynamic active port from current browser environment (e.g. 5173, 5175, etc.)
  const activePort = typeof window !== 'undefined' && window.location.port ? window.location.port : '5173';

  const verificationUrl =
    networkMode === 'lan' && networkHost.trim()
      ? getBatchVerificationUrl('HC-DEMO-001', `${networkHost.trim()}:${activePort}`)
      : getBatchVerificationUrl('HC-DEMO-001');

  // Persist state
  useEffect(() => {
    localStorage.setItem('honeychain_demo_state', JSON.stringify(demoState));
  }, [demoState]);

  // Generate QR code for HC-DEMO-001
  useEffect(() => {
    QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [verificationUrl]);

  const handleNext = () => {
    if (demoState.currentStep < 6) {
      setDemoState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const handlePrev = () => {
    if (demoState.currentStep > 1) {
      setDemoState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const handleReset = () => {
    setDemoState({
      ...INITIAL_DEMO_STATE,
      currentStep: 1,
      telemetryValues: {
        ...INITIAL_DEMO_STATE.telemetryValues,
        lastUpdated: new Date().toLocaleTimeString(),
      },
    });
    toast.success('Demo reset to Step 1');
  };

  const refreshTelemetry = () => {
    setDemoState((prev) => ({
      ...prev,
      telemetryRefreshed: true,
      telemetryValues: {
        temp: Number((33.8 + Math.random() * 0.8).toFixed(1)),
        humidity: Number((60.5 + Math.random() * 3).toFixed(1)),
        weight: Number((42.5 + Math.random() * 0.6).toFixed(1)),
        battery: Math.max(90, Math.floor(prev.telemetryValues.battery - Math.random() * 0.2)),
        sound: Math.floor(180 + Math.random() * 15),
        lastUpdated: new Date().toLocaleTimeString(),
      },
    }));
    toast.success('Simulated sensor telemetry refreshed!');
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'honeychain-HC-DEMO-001.png';
    a.click();
    toast.success('QR Code downloaded!');
  };

  const steps = [
    { num: 1, title: 'Hive Registration', subtitle: 'HIVE-001 setup' },
    { num: 2, title: 'Hive Monitoring', subtitle: 'Simulated IoT sensors' },
    { num: 3, title: 'Honey Collection', subtitle: '120 kg extraction' },
    { num: 4, title: 'Quality Testing', subtitle: 'Codex purity check' },
    { num: 5, title: 'Batch Packaging', subtitle: 'HC-DEMO-001 creation' },
    { num: 6, title: 'QR & Verification', subtitle: 'Live mobile scan' },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#0f172a] font-sans pb-16 selection:bg-amber-100 selection:text-amber-900">
      {/* ── Top Presentation Header ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#e8e4dc] sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center shadow-xs">
                <Layers className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-[#0f172a]">Honey Chain</span>
            </Link>
            <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              🎓 College Mini-Project Demo Mode
            </span>
          </div>

          {/* Stepper Navigation Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrev}
              disabled={demoState.currentStep === 1}
              className="text-xs flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            <span className="text-xs font-bold text-slate-700 font-mono px-2">
              Step {demoState.currentStep} of {steps.length}
            </span>

            <Button
              size="sm"
              variant={demoState.currentStep === 6 ? 'secondary' : 'primary'}
              onClick={handleNext}
              disabled={demoState.currentStep === 6}
              className="text-xs flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              title="Reset Demo"
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </Button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-6 h-1.5 bg-slate-100 border-t border-slate-200">
          {steps.map((s) => (
            <div
              key={s.num}
              onClick={() => setDemoState((prev) => ({ ...prev, currentStep: s.num }))}
              className={`h-full cursor-pointer transition-all duration-300 ${
                s.num <= demoState.currentStep
                  ? 'bg-amber-500'
                  : 'bg-slate-200 hover:bg-slate-300'
              }`}
              title={`Jump to Step ${s.num}: ${s.title}`}
            />
          ))}
        </div>
      </header>

      {/* ── Main Content Area ───────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* ── Left Column: Interactive Workflow Stage ─────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step Breadcrumb / Summary */}
            <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-700">
                  Step {demoState.currentStep} · {steps[demoState.currentStep - 1].title}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Live Workflow
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0f172a]">
                {demoState.currentStep === 1 && '1. Smart Apiary & Hive Registration'}
                {demoState.currentStep === 2 && '2. Hive Telemetry & IoT Monitoring'}
                {demoState.currentStep === 3 && '3. Honey Extraction & Collection Logging'}
                {demoState.currentStep === 4 && '4. Cold Processing & Laboratory Testing'}
                {demoState.currentStep === 5 && '5. Honey Batch Packaging (HC-DEMO-001)'}
                {demoState.currentStep === 6 && '6. Cryptographic QR Generation & Phone Verification'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {demoState.currentStep === 1 &&
                  'Register Hive HIVE-001 with beekeeper details, geographical GPS coordinates, and colony health.'}
                {demoState.currentStep === 2 &&
                  'Observe live simulated temperature, weight, and humidity metrics from the virtual telemetry node.'}
                {demoState.currentStep === 3 &&
                  'Record 120 kg raw honey extraction linked directly to source hive HIVE-001 with harvest conditions.'}
                {demoState.currentStep === 4 &&
                  'Record micro-mesh cold filtering and laboratory quality tests (moisture, purity index, and zero adulterants).'}
                {demoState.currentStep === 5 &&
                  'Create the final consumer batch HC-DEMO-001 linking the hive origin, collection, and test report.'}
                {demoState.currentStep === 6 &&
                  'Generate a live scannable QR code. Scan it with any smartphone camera on the same Wi-Fi to verify!'}
              </p>
            </div>

            {/* ── STEP 1: HIVE REGISTRATION ─────────────────────────────────── */}
            {demoState.currentStep === 1 && (
              <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-xs space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                      01
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Hive HIVE-001 Record</h3>
                      <p className="text-[11px] text-slate-500">Dehradun Valley Apiary Network</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">ACTIVE</Badge>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Hive Identifier</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">HIVE-001</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Bee Species</span>
                    <span className="font-semibold text-slate-800">Apis cerana (Asian Honeybee)</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Master Beekeeper</span>
                    <span className="font-semibold text-slate-800">Rajesh Kumar (BK-UTT-101)</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Apiary Location</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-600" />
                      Maldevta, Dehradun (30.332° N, 78.115° E)
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>College Presentation Note:</strong> Hive HIVE-001 represents the primary point of origin in our traceability chain. Every drop of honey extracted later will link directly back to this hive ID and GPS coordinate.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleNext} className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2">
                    Proceed to Step 2: IoT Monitoring <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 2: HIVE MONITORING ───────────────────────────────────── */}
            {demoState.currentStep === 2 && (
              <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-xs space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Virtual IoT Sensor Hub (Node IOT-DEV-001)</h3>
                      <p className="text-[11px] text-slate-500">Live Telemetry Simulation · HIVE-001</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    SIMULATED IoT · DEMO DATA
                  </span>
                </div>

                {/* Telemetry Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 bg-[#faf9f6] rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Temperature</span>
                    <span className="text-lg font-black text-slate-900 block mt-0.5">
                      {demoState.telemetryValues.temp} °C
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Optimal (32-35°C)</span>
                  </div>
                  <div className="p-3.5 bg-[#faf9f6] rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Humidity</span>
                    <span className="text-lg font-black text-slate-900 block mt-0.5">
                      {demoState.telemetryValues.humidity}%
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Normal (60-65%)</span>
                  </div>
                  <div className="p-3.5 bg-[#faf9f6] rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Hive Weight</span>
                    <span className="text-lg font-black text-slate-900 block mt-0.5">
                      {demoState.telemetryValues.weight} kg
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold">+1.2 kg (Nectar Flow)</span>
                  </div>
                  <div className="p-3.5 bg-[#faf9f6] rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Battery Node</span>
                    <span className="text-lg font-black text-slate-900 block mt-0.5">
                      {demoState.telemetryValues.battery}%
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Solar Normal</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Last Reading Timestamp: {demoState.telemetryValues.lastUpdated}</span>
                  <button
                    onClick={refreshTelemetry}
                    className="text-amber-700 hover:text-amber-800 font-bold inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Simulate Fresh Reading
                  </button>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
                  <p>
                    <strong>Honest Academic Disclosure:</strong> In this prototype, sensor metrics are simulated via programmatic telemetry streams to demonstrate how real hardware nodes will interface with the platform.
                  </p>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={handlePrev} size="sm">Back</Button>
                  <Button onClick={handleNext} className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2">
                    Step 3: Record Honey Collection <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3: HONEY COLLECTION ──────────────────────────────────── */}
            {demoState.currentStep === 3 && (
              <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-xs space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Honey Extraction Record</h3>
                      <p className="text-[11px] text-slate-500">Source: Hive HIVE-001</p>
                    </div>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">120 KG EXTRACTED</Badge>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Harvest Date:</span>
                    <span className="font-bold text-slate-800">April 12, 2025 (Spring Flow)</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Floral Source:</span>
                    <span className="font-bold text-slate-800">Wild Acacia (Acacia catechu)</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Ambient Temperature during Harvest:</span>
                    <span className="font-bold text-slate-800">24.5 °C (Cold extracted)</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Verified Beekeeper:</span>
                    <span className="font-bold text-slate-800">Rajesh Kumar</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Collection successfully logged and linked to Hive HIVE-001. Ready for laboratory testing.</span>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={handlePrev} size="sm">Back</Button>
                  <Button onClick={handleNext} className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2">
                    Step 4: Quality & Lab Testing <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 4: QUALITY TESTING ───────────────────────────────────── */}
            {demoState.currentStep === 4 && (
              <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-xs space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Laboratory Purity & Quality Analysis</h3>
                      <p className="text-[11px] text-slate-500">Standard: Codex Alimentarius CXS 12-1981 / FSSAI</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">GRADE A · PASSED</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Moisture Content</span>
                    <span className="text-base font-extrabold text-slate-900">17.2%</span>
                    <span className="text-[10px] text-emerald-700 block">Max 20% (Passed)</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Purity Index</span>
                    <span className="text-base font-extrabold text-emerald-700">99.4%</span>
                    <span className="text-[10px] text-slate-400 block">Pure Raw Honey</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">HMF Level</span>
                    <span className="text-base font-extrabold text-slate-900">11.4 mg/kg</span>
                    <span className="text-[10px] text-emerald-700 block">Max 40 mg/kg</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Diastase Number</span>
                    <span className="text-base font-extrabold text-slate-900">14.2 DN</span>
                    <span className="text-[10px] text-emerald-700 block">Enzymes Active</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">C3/C4 Sugar Syrups</span>
                    <span className="text-base font-extrabold text-emerald-700">0%</span>
                    <span className="text-[10px] text-emerald-700 block">Negative</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Antibiotics</span>
                    <span className="text-base font-extrabold text-emerald-700">0 ppm</span>
                    <span className="text-[10px] text-emerald-700 block">Clean</span>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
                  <p>
                    <strong>Academic Transparency:</strong> The parameters above are simulated laboratory benchmark entries to showcase the software workflow.
                  </p>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={handlePrev} size="sm">Back</Button>
                  <Button onClick={handleNext} className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2">
                    Step 5: Create Batch & Packaging <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 5: BATCH CREATION & PACKAGING ─────────────────────────── */}
            {demoState.currentStep === 5 && (
              <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-xs space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Final Consumer Honey Batch</h3>
                      <p className="text-[11px] text-slate-500">Batch Code: HC-DEMO-001</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">PACKAGED</Badge>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Public Batch Identifier:</span>
                    <span className="font-mono font-bold text-slate-900">HC-DEMO-001</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Honey Variety:</span>
                    <span className="font-bold text-slate-900">Wild Acacia Himalayan Raw Honey</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Packaging Format:</span>
                    <span className="font-semibold text-slate-800">500g Food-Grade Hexagonal Glass Jars (240 Jars)</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-slate-500">Cryptographic Seal:</span>
                    <span className="font-semibold text-emerald-700">Tamper-Evident QR Code Label Applied</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={handlePrev} size="sm">Back</Button>
                  <Button onClick={handleNext} className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2">
                    Step 6: QR Code & Live Phone Scan <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 6: QR CODE & SCANNING ─────────────────────────────────── */}
            {demoState.currentStep === 6 && (
              <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-xs space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Live QR Code for Presentation</h3>
                      <p className="text-[11px] text-slate-500">Scan with your smartphone camera right now!</p>
                    </div>
                  </div>
                  <Badge className="bg-amber-100 text-amber-900 font-bold">READY TO SCAN</Badge>
                </div>

                {/* QR Display Card */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="HC-DEMO-001 QR" className="w-44 h-44 rounded-md" />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                        Generating QR...
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 text-xs flex-1">
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">Batch HC-DEMO-001</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Point your mobile camera at this QR code. It will instantly open the provenance page.
                      </p>
                    </div>

                    {/* Network Mode Switcher */}
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                          <Wifi className="w-3.5 h-3.5 text-amber-700" />
                          Phone Scanning Network Mode:
                        </span>
                        <div className="flex gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setNetworkMode('lan')}
                            className={`px-2 py-0.5 rounded font-bold transition-colors ${
                              networkMode === 'lan'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-300'
                            }`}
                          >
                            Wi-Fi Network Host
                          </button>
                          <button
                            type="button"
                            onClick={() => setNetworkMode('origin')}
                            className={`px-2 py-0.5 rounded font-bold transition-colors ${
                              networkMode === 'origin'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-300'
                            }`}
                          >
                            Current Origin
                          </button>
                        </div>
                      </div>

                      {networkMode === 'lan' && (
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
                                onClick={() => {
                                  setSavedNetworkHost(networkHost);
                                  setIsEditingHost(false);
                                  toast.success('Saved network host IP!');
                                }}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-amber-200">
                              <span className="font-mono text-slate-700 font-semibold">
                                Host: {networkHost}:{activePort}
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsEditingHost(true)}
                                className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 text-[10px]"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit Wi-Fi Host
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-[10px] text-amber-800 leading-relaxed font-mono truncate">
                        Encoded URL: {verificationUrl}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={handleDownloadQr} className="text-xs">
                        <Download className="w-3.5 h-3.5" />
                        Download PNG
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowQrModal(true)} className="text-xs">
                        <Printer className="w-3.5 h-3.5" />
                        Print Label
                      </Button>
                      <Link to="/verify/HC-DEMO-001" target="_blank">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs flex items-center gap-1">
                          Open in Browser <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={handlePrev} size="sm">Back</Button>
                  <Button
                    onClick={() => navigate('/verify/HC-DEMO-001')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                  >
                    View Public Verification Page <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Pinned Live Presentation Sidecard ──────────────── */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live QR Pinned Box (Always accessible so student can scan any time!) */}
            <div className="bg-white rounded-2xl p-5 border border-amber-300 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  Live Presentation QR
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  SCAN ANYTIME
                </span>
              </div>

              <div className="flex justify-center p-3 bg-stone-50 rounded-xl border border-stone-200">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="Presentation QR" className="w-48 h-48 rounded-lg shadow-xs" />
                )}
              </div>

              <div className="text-center space-y-1">
                <span className="text-xs font-mono font-bold text-slate-800 block">HC-DEMO-001</span>
                <p className="text-[11px] text-slate-500">
                  Scan this during your viva / demo to show your teacher the verification page on your mobile!
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => setShowQrModal(true)}
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Jar Packaging Label
                </Button>
                <Link to="/verify/HC-DEMO-001" className="w-full" target="_blank">
                  <Button size="sm" className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs">
                    Inspect Traceability
                  </Button>
                </Link>
              </div>
            </div>

            {/* Presentation Cheat Sheet for Student */}
            <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Presentation Talking Points (Viva Tips)
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed list-disc list-inside">
                <li>
                  <strong>Origin (HIVE-001):</strong> Every jar is tied to a specific hive and geographic GPS location.
                </li>
                <li>
                  <strong>IoT Monitoring:</strong> Explains how temperature and humidity prevent spoilage inside beehives.
                </li>
                <li>
                  <strong>Extraction:</strong> Records harvest volume (120 kg) to prevent counterfeit dilution.
                </li>
                <li>
                  <strong>Lab Parameters:</strong> 17.2% moisture obeys international Codex standard (max 20%).
                </li>
                <li>
                  <strong>QR Traceability:</strong> Any consumer with a phone camera can verify provenance without installing an app.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Batch QR Modal */}
      <BatchQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        batchId="HC-DEMO-001"
        variety="Wild Acacia Himalayan Raw Honey"
        beekeeperName="Rajesh Kumar (Himalayan Organic Apiaries)"
        origin="Maldevta Apiary, Dehradun, Uttarakhand"
        harvestDate="April 12, 2025"
        purityScore="99.4%"
        isDemo={true}
      />
    </div>
  );
}
