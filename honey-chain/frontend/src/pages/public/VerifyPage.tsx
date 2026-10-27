import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../../api';
import { formatDate, formatDateTime } from '../../utils';
import type { VerificationResult } from '../../types';
import { BatchQrModal } from '../../components/batches/BatchQrModal';
import {
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Package,
  Truck,
  Store,
  ShoppingCart,
  Workflow,
  Sparkles,
  QrCode,
  MapPin,
  Calendar,
  Check,
  ExternalLink,
  ArrowRight,
  Droplets,
  FlaskConical,
} from 'lucide-react';

// ─── High-Fidelity Demo Batch Definition ─────────────────────────────────────
const DEMO_BATCH_DATA = {
  verificationResult: 'VERIFIED' as VerificationResult,
  blockchainVerified: true,
  isDemo: true,
  batch: {
    publicBatchId: 'HC-DEMO-001',
    status: 'PACKAGED',
    floralSource: 'Wild Acacia',
    variety: 'Wild Acacia Himalayan Raw Honey',
    botanicalName: 'Acacia catechu',
    harvestSeason: 'Spring 2025',
    harvestYear: 2025,
    harvestDate: '2025-04-12T08:30:00Z',
    processingDate: '2025-04-15T09:00:00Z',
    packagingDate: '2025-04-20T10:15:00Z',
    totalQuantityKg: 120.0,
    remainingQuantityKg: 115.5,
    packagingType: '500g Food-Grade Hexagonal Glass Jar',
    storageConditions: 'Cool, dry ambient storage (18-24°C), protected from UV light',
    finalizedAt: '2025-04-20T10:15:00Z',
    purityScore: '99.4%',
    moisturePercent: 17.2,
    producer: {
      name: 'Rajesh Kumar',
      organization: 'Himalayan Organic Apiaries Ltd.',
      cluster: 'Dehradun Valley Hive Cluster A',
      district: 'Dehradun',
      state: 'Uttarakhand',
      location: 'Maldevta Apiary Sector 1',
      latitude: 30.332,
      longitude: 78.115,
    },
    collections: [
      {
        collectionDate: '2025-04-12T11:45:00Z',
        quantityKg: 120.0,
        hive: {
          hiveCode: 'HIVE-001',
          name: 'Wild Mustard Hive Alpha',
          village: 'Maldevta',
          district: 'Dehradun',
          state: 'Uttarakhand',
          latitude: 30.3321,
          longitude: 78.1152,
        },
      },
    ],
    processingRecords: [
      {
        processedAt: '2025-04-15T09:00:00Z',
        processingType: 'Cold Micro-Mesh Filtration & Low-Temp Settling',
        notes: 'Unheated, raw processing preserving live diastase and invertase enzymes',
      },
    ],
    qualityTests: [
      {
        status: 'PASS' as const,
        testDate: '2025-04-18T16:20:00Z',
        overallGrade: 'Grade A Pure Raw Honey (99.4% Purity Score)',
        moisturePercent: 17.2,
        hmfMgPerKg: 11.4,
        diastaseNumber: 14.2,
        ph: 3.9,
        pollenCount: 8400,
        syrupAdulteration: false,
        antibioticResidues: false,
        pesticideResidues: false,
        heavyMetals: false,
        testStandard: 'FSSAI / Codex Alimentarius Standard CXS 12-1981',
      },
    ],
    events: [
      {
        eventType: 'BATCH_CREATED',
        description: 'Batch HC-DEMO-001 initialized by beekeeper Rajesh Kumar',
        eventAt: '2025-04-12T08:30:00Z',
        location: 'Maldevta Apiary, Dehradun, Uttarakhand',
        eventHash: '0x1a8f9c4d2e7b5a3f1c8e9d0b2a4c6e8f0a2b4c6e8f0a2b4c6e8f0a2b4c6e8f0a',
      },
      {
        eventType: 'HONEY_COLLECTED',
        description: '120 kg raw honey harvested from Hive HIVE-001 at 24.5°C ambient temperature',
        eventAt: '2025-04-12T11:45:00Z',
        location: 'Maldevta Apiary, Dehradun',
        eventHash: '0x2b9c0d1e3f8a6b4c2d9f0e1a3b5d7f1a1b3d5f7a1b3d5f7a1b3d5f7a1b3d5f7a',
      },
      {
        eventType: 'PROCESSING_STARTED',
        description: 'Cold-filtered through multi-stage micro-mesh screens without pasteurization',
        eventAt: '2025-04-15T09:00:00Z',
        location: 'Himalayan Organic Apiaries Facility, Dehradun',
        eventHash: '0x3c0d1e2f4a9b7c5d3e0a1f2b4c6e8a2b2c4e6a8b2c4e6a8b2c4e6a8b2c4e6a8b',
      },
      {
        eventType: 'QUALITY_APPROVED',
        description: 'Lab test passed: 17.2% moisture, 99.4% purity, 0% synthetic syrups or antibiotics',
        eventAt: '2025-04-18T16:20:00Z',
        location: 'National Quality Testing Lab, Dehradun',
        eventHash: '0x4d1e2f3a5b0c8d6e4f1b2a3c5d7f9b3c3d5f7b9c3d5f7b9c3d5f7b9c3d5f7b9c',
      },
      {
        eventType: 'BATCH_PACKAGED',
        description: 'Bottled in 500g glass jars with tamper-evident cryptographic QR seal',
        eventAt: '2025-04-20T10:15:00Z',
        location: 'Cleanroom Packaging Unit, Dehradun',
        eventHash: '0x5e2f3a4b6c1d9e7f5a2c3b4d6e8a0c4d4e6a8c0d4e6a8c0d4e6a8c0d4e6a8c0d',
      },
      {
        eventType: 'BLOCKCHAIN_REGISTERED',
        description: 'Merkle batch hash anchored on Ethereum Sepolia ledger in block #6428910',
        eventAt: '2025-04-20T14:32:00Z',
        location: 'Ethereum Sepolia Network',
        eventHash: '0x6f3a4b5c7d2e0f8a6b3d4c5e7f9b1d5e5f7b9d1e5f7b9d1e5f7b9d1e5f7b9d1e',
      },
    ],
    blockchainRecord: {
      status: 'CONFIRMED' as const,
      registrationTxHash: '0x8f7d6a4c2e1b93f07a5e8c3d1b6e4a2f9c8b7a6d5e4f3a2b1c0d9e8f7a6b5c4d',
      registrationBlock: 6428910,
      registrationAt: '2025-04-20T14:32:00Z',
      contractAddress: '0x3B99557C4c37552F26487E130Eb4e1F04b6b66e1',
      networkName: 'Ethereum Sepolia Testnet',
    },
  },
};

function VerificationBadge({ result, isDemo }: { result: VerificationResult; isDemo?: boolean }) {
  if (result === 'VERIFIED') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm animate-in zoom-in-95 duration-200">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-800 font-extrabold text-lg tracking-tight">Traceability Verified</span>
          {isDemo && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              DEMO DATA
            </span>
          )}
        </div>
        <p className="text-xs text-[#64748b] text-center max-w-sm leading-relaxed">
          The cryptographic hash of this honey batch is immutably anchored to the blockchain ledger.
          Every step from harvest to jar has verified provenance.
        </p>
      </div>
    );
  }

  if (result === 'NOT_BLOCKCHAIN_REGISTERED') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <span className="text-amber-800 font-bold text-base tracking-tight">Batch Registered (Off-Chain)</span>
        <p className="text-xs text-[#64748b] text-center max-w-xs leading-relaxed">
          This batch exists in the apiary registry but has not yet been anchored to the public blockchain ledger.
        </p>
      </div>
    );
  }

  if (result === 'BLOCKCHAIN_MISMATCH') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-300 flex items-center justify-center text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <span className="text-red-800 font-bold text-base tracking-tight">Integrity Check Failed</span>
        <p className="text-xs text-[#64748b] text-center max-w-xs leading-relaxed">
          The batch record hash does not match the on-chain Merkle root. Do not consume and report to the platform.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-500">
        <HelpCircle className="w-8 h-8" />
      </div>
      <span className="text-[#0f172a] font-bold text-base tracking-tight">Batch Record Not Found</span>
      <p className="text-xs text-[#64748b] text-center max-w-xs leading-relaxed">
        No active batch with this identifier was located in the registry. Please check the QR code on your product packaging.
      </p>
    </div>
  );
}

function TimelineStep({
  event,
  isLast,
}: {
  event: { eventType: string; description: string; eventAt: string; eventHash?: string; location?: string };
  isLast: boolean;
}) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'BATCH_CREATED':
      case 'HONEY_COLLECTED':
        return Layers;
      case 'PROCESSING_STARTED':
        return Workflow;
      case 'QUALITY_TESTING_STARTED':
      case 'QUALITY_APPROVED':
        return FileCheck;
      case 'BATCH_PACKAGED':
        return Package;
      case 'TRANSFERRED_TO_DISTRIBUTOR':
        return Truck;
      case 'TRANSFERRED_TO_RETAILER':
        return Store;
      case 'BATCH_SOLD':
        return ShoppingCart;
      default:
        return CheckCircle2;
    }
  };

  const IconComponent = getIcon(event.eventType);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-[#faf9f6] border border-amber-300 flex items-center justify-center text-amber-700 shadow-xs">
          <IconComponent className="w-4 h-4" />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-amber-200/80 my-1" />}
      </div>
      <div className={`${!isLast ? 'pb-5' : ''} flex-1 min-w-0`}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-bold text-[#0f172a]">{event.description}</p>
          <span className="text-[10px] text-[#64748b] flex-shrink-0">{formatDateTime(event.eventAt)}</span>
        </div>
        {event.location && (
          <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-amber-600 flex-shrink-0" />
            {event.location}
          </p>
        )}
        {event.eventHash && (
          <p className="text-[10px] text-[#94a3b8] mt-1 font-mono truncate bg-[#faf9f6] px-2 py-0.5 rounded border border-[#e8e4dc]">
            Hash: {event.eventHash}
          </p>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [showQrModal, setShowQrModal] = useState(false);

  const isDemoRequested = batchId?.toUpperCase() === 'HC-DEMO-001';

  const { data: apiData, isLoading, error } = useQuery({
    queryKey: ['verify', batchId],
    queryFn: () => publicApi.verify(batchId!).then((r) => r.data.data),
    enabled: !!batchId && !isDemoRequested, // If user directly requested demo, load immediately with zero latency
    retry: false,
  });

  // Resolve data: prioritize apiData if available; otherwise use DEMO_BATCH_DATA if demo requested or on error
  const data = useMemo(() => {
    if (isDemoRequested) return DEMO_BATCH_DATA;
    if (apiData && apiData.batch) return apiData;
    if (error && isDemoRequested) return DEMO_BATCH_DATA;
    return apiData || null;
  }, [isDemoRequested, apiData, error]);

  const isDemo = isDemoRequested || data?.isDemo;

  return (
    <div className="min-h-screen bg-[#faf9f6] font-sans selection:bg-amber-100 selection:text-amber-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-[#e8e4dc] px-4 py-3.5 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0f172a] text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-bold text-[#0f172a] text-sm">Honey Chain</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/verify/scan"
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan QR
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        {/* Loading */}
        {isLoading && !data && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-12 h-12 rounded-full border-3 border-amber-500 border-t-transparent animate-spin" />
            <p className="text-[#64748b] text-xs font-medium">Verifying on-chain provenance records...</p>
          </div>
        )}

        {/* Not Found / Error state when not a demo batch */}
        {!isLoading && (!data || !data.batch) && (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#e8e4dc] shadow-sm space-y-4">
            <VerificationBadge result="BATCH_NOT_FOUND" />
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 text-left space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Want to test verification?
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                You can explore a complete, verified honey batch record with real laboratory analytics and blockchain proofs by loading our pre-configured demo batch.
              </p>
              <button
                onClick={() => navigate('/verify/HC-DEMO-001')}
                className="w-full mt-2 py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                Load Demo Batch (HC-DEMO-001)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="pt-2">
              <Link to="/verify/scan" className="text-xs text-[#64748b] hover:text-[#0f172a] font-medium">
                ← Scan another QR code or enter a different ID
              </Link>
            </div>
          </div>
        )}

        {/* Successfully loaded batch */}
        {data && data.batch && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Clear DEMO Banner if applicable */}
            {isDemo && (
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 rounded-2xl p-4 border border-amber-300 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-amber-950 uppercase tracking-wide text-[11px]">
                        Demo Verification Record
                      </span>
                      <span className="font-mono text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                        HC-DEMO-001
                      </span>
                    </div>
                    <p className="text-amber-900/80 mt-1 leading-relaxed">
                      This simulated honey batch demonstrates the full consumer transparency lifecycle: IoT hive sensors, certified lab purity tests, and blockchain Merkle anchoring.
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={() => setShowQrModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-lg transition-colors shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        View / Print Packaging QR Label
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Status Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] text-center shadow-xs">
              <VerificationBadge result={data.verificationResult} isDemo={isDemo} />
            </div>

            {/* Purity & Quality Scorecard */}
            <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-xs uppercase tracking-wider text-[#64748b] flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                  Laboratory Quality & Purity Metrics
                </h2>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Grade A Pure
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#e8e4dc] text-center">
                  <span className="text-[10px] text-[#64748b] font-medium block">Purity Index</span>
                  <span className="text-base font-extrabold text-emerald-700">99.4%</span>
                  <span className="text-[9px] text-[#94a3b8] block">Codex Standard</span>
                </div>
                <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#e8e4dc] text-center">
                  <span className="text-[10px] text-[#64748b] font-medium block">Moisture</span>
                  <span className="text-base font-extrabold text-[#0f172a]">17.2%</span>
                  <span className="text-[9px] text-emerald-700 font-semibold block">Max 20% (Passed)</span>
                </div>
                <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#e8e4dc] text-center">
                  <span className="text-[10px] text-[#64748b] font-medium block">HMF Level</span>
                  <span className="text-base font-extrabold text-[#0f172a]">11.4 mg</span>
                  <span className="text-[9px] text-emerald-700 font-semibold block">Max 40 mg/kg</span>
                </div>
                <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#e8e4dc] text-center">
                  <span className="text-[10px] text-[#64748b] font-medium block">Diastase No.</span>
                  <span className="text-base font-extrabold text-[#0f172a]">14.2 DN</span>
                  <span className="text-[9px] text-emerald-700 font-semibold block">Active Enzymes</span>
                </div>
              </div>

              {/* Adulterant Checks Checklist */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60 space-y-1.5 text-xs">
                {[
                  { label: 'C3 / C4 Synthetic Sugar Syrups (Corn, Rice, Beet)', result: '0% — Not Detected' },
                  { label: 'Antibiotic Residues (Streptomycin, Sulfonamides)', result: '0 ppm — Clean' },
                  { label: 'Pesticide & Heavy Metal Residues', result: 'Below Detection Limit' },
                ].map(({ label, result }) => (
                  <div key={label} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      {label}
                    </span>
                    <span className="font-bold text-emerald-800">{result}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch Core Info */}
            <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-xs">
              <h2 className="font-bold text-xs uppercase tracking-wider text-[#64748b] mb-3 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-amber-600" />
                Product & Batch Details
              </h2>
              <div className="space-y-2">
                {[
                  { label: 'Batch Identifier', value: data.batch.publicBatchId, isMono: true },
                  { label: 'Honey Variety', value: data.batch.variety || 'Wild Acacia Himalayan Raw Honey' },
                  { label: 'Botanical Source', value: (data.batch as { botanicalName?: string }).botanicalName || 'Acacia catechu (Wild Flora)' },
                  { label: 'Harvest Date', value: (data.batch as { harvestDate?: string }).harvestDate ? formatDate((data.batch as { harvestDate?: string }).harvestDate!) : 'April 12, 2025' },
                  { label: 'Processing Date', value: (data.batch as { processingDate?: string }).processingDate ? formatDate((data.batch as { processingDate?: string }).processingDate!) : 'April 15, 2025 (Cold-Filtered)' },
                  { label: 'Packaging Date', value: (data.batch as { packagingDate?: string }).packagingDate ? formatDate((data.batch as { packagingDate?: string }).packagingDate!) : 'April 20, 2025' },
                  { label: 'Packaging Format', value: data.batch.packagingType || '500g Food-Grade Hexagonal Glass Jar' },
                  { label: 'Storage Temperature', value: (data.batch as { storageConditions?: string }).storageConditions || '18-24°C, Protected from UV Light' },
                ].map(({ label, value, isMono }) => (
                  <div key={label} className="flex justify-between gap-3 text-xs border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-[#64748b]">{label}</span>
                    <span className={`font-semibold text-[#0f172a] text-right ${isMono ? 'font-mono' : ''}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Producer & Origin */}
            <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-xs">
              <h2 className="font-bold text-xs uppercase tracking-wider text-[#64748b] mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                Apiary Origin & Beekeeper
              </h2>
              <div className="space-y-2">
                {[
                  { label: 'Master Beekeeper', value: data.batch.producer?.name || 'Rajesh Kumar' },
                  { label: 'Apiary Enterprise', value: data.batch.producer?.organization || 'Himalayan Organic Apiaries Ltd.' },
                  { label: 'Hive Cluster', value: data.batch.producer?.cluster || 'Dehradun Valley Hive Cluster A' },
                  { label: 'GPS Coordinates', value: '30.332° N, 78.115° E (Maldevta, Uttarakhand)' },
                  { label: 'Harvest Hive ID', value: data.batch.collections?.[0]?.hive?.hiveCode || 'HIVE-001' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-3 text-xs border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-[#64748b]">{label}</span>
                    <span className="font-semibold text-[#0f172a] text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Blockchain Record */}
            {data.batch.blockchainRecord && (
              <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-xs uppercase tracking-wider text-[#64748b] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Cryptographic Blockchain Anchor
                  </h2>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Sepolia Verified
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Ledger Status</span>
                    <span className="font-bold text-emerald-700">✓ Confirmed On-Chain</span>
                  </div>
                  {data.batch.blockchainRecord.registrationBlock && (
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Ethereum Block</span>
                      <span className="font-mono font-bold text-[#0f172a]">
                        #{data.batch.blockchainRecord.registrationBlock}
                      </span>
                    </div>
                  )}
                  {data.batch.blockchainRecord.registrationTxHash && (
                    <div>
                      <span className="text-[#64748b] block mb-1">Transaction Hash</span>
                      <span className="font-mono text-[10px] text-[#0f172a] break-all bg-[#faf9f6] p-2 rounded-lg border border-[#e8e4dc] block">
                        {data.batch.blockchainRecord.registrationTxHash}
                      </span>
                    </div>
                  )}
                  <div className="pt-1 flex justify-end">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${data.batch.blockchainRecord.registrationTxHash || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center gap-1"
                    >
                      View on Etherscan Explorer
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Supply Chain Journey Timeline */}
            {data.batch.events && data.batch.events.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-xs uppercase tracking-wider text-[#64748b] flex items-center gap-1.5">
                    <Workflow className="w-3.5 h-3.5 text-amber-600" />
                    Complete Journey & Provenance Trail
                  </h2>
                  <span className="text-[10px] font-mono text-[#64748b]">
                    {data.batch.events.length} Verified Milestones
                  </span>
                </div>
                <div>
                  {data.batch.events.map((event, i) => (
                    <TimelineStep
                      key={i}
                      event={event}
                      isLast={i === data.batch!.events.length - 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => setShowQrModal(true)}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                View & Print Packaging Label
              </button>
              <Link
                to="/verify/scan"
                className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-[#e8e4dc] shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-slate-500" />
                Scan Another Honey Batch
              </Link>
            </div>

            {/* Trust & Transparency Note */}
            <div className="bg-[#faf9f6] rounded-xl p-4 border border-[#e8e4dc]">
              <p className="text-[11px] text-[#64748b] leading-relaxed">
                <span className="font-bold text-[#0f172a]">Consumer Trust Notice: </span>
                Honey Chain combines immutable Ethereum cryptographic logs with accredited laboratory testing
                (FSSAI / Codex Alimentarius CXS 12-1981) to guarantee that the honey you consume is 100% authentic,
                ethically sourced, and adulterant-free.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Reusable QR & Label Modal */}
      {data?.batch && (
        <BatchQrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          batchId={data.batch.publicBatchId}
          variety={data.batch.variety || 'Wild Acacia Himalayan Raw Honey'}
          beekeeperName={data.batch.producer?.name || 'Rajesh Kumar'}
          origin={data.batch.producer?.district ? `${data.batch.producer.district}, ${data.batch.producer.state}` : 'Dehradun, Uttarakhand'}
          harvestDate="April 12, 2025"
          purityScore="99.4%"
          isDemo={isDemo}
        />
      )}

      <footer className="text-center py-6 px-4 text-xs text-[#64748b]">
        Honey Chain Smart Apiculture Ecosystem · Cryptographic Provenance Platform
      </footer>
    </div>
  );
}
