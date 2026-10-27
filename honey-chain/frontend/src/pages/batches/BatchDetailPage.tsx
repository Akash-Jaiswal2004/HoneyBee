import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { batchesApi } from '../../api';
import { Card, Badge, Button, LoadingPage, ErrorState } from '../../components/ui';
import { BatchQrModal } from '../../components/batches/BatchQrModal';
import { BATCH_STATUS_COLORS, BATCH_STATUS_LABELS, BLOCKCHAIN_STATUS_COLORS, QUALITY_STATUS_COLORS, formatDate, formatDateTime } from '../../utils';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { QrCode, ExternalLink, Sparkles } from 'lucide-react';

const DEMO_BATCH_DETAIL = {
  id: 'HC-DEMO-001',
  publicBatchId: 'HC-DEMO-001',
  status: 'PACKAGED' as const,
  floralSource: 'Wild Acacia',
  variety: 'Wild Acacia Himalayan Raw Honey',
  harvestSeason: 'Spring 2025',
  harvestYear: 2025,
  totalQuantityKg: 120.0,
  remainingQuantityKg: 115.5,
  unit: 'kg',
  packagingType: '500g Food-Grade Hexagonal Glass Jar',
  storageConditions: 'Cool, dry ambient storage (18-24°C)',
  notes: 'DEMO DATA — Simulated provenance record for platform demonstration',
  createdAt: '2025-04-12T08:30:00Z',
  updatedAt: '2025-04-20T10:15:00Z',
  finalizedAt: '2025-04-20T10:15:00Z',
  blockchainRecord: {
    status: 'CONFIRMED' as const,
    registrationTxHash: '0x8f7d6a4c2e1b93f07a5e8c3d1b6e4a2f9c8b7a6d5e4f3a2b1c0d9e8f7a6b5c4d',
    registrationBlock: 6428910,
  },
  qualityTests: [
    {
      id: 'qt-demo-01',
      testDate: '2025-04-18T16:20:00Z',
      status: 'PASS',
      overallGrade: 'Grade A Pure Raw Honey (99.4% Purity)',
      moisturePercent: 17.2,
      testStandard: 'FSSAI / Codex CXS 12-1981',
    },
  ],
};

const DEMO_EVENTS = [
  {
    id: 'ev-1',
    eventType: 'BATCH_CREATED',
    description: 'Batch HC-DEMO-001 initialized by beekeeper Rajesh Kumar',
    eventAt: '2025-04-12T08:30:00Z',
    eventHash: '0x1a8f9c4d2e7b5a3f1c8e9d0b2a4c6e8f0a2b4c6e8f0a2b4c6e8f0a2b4c6e8f0a',
  },
  {
    id: 'ev-2',
    eventType: 'HONEY_COLLECTED',
    description: '120 kg raw honey harvested from Hive HIVE-001 at 24.5°C ambient temperature',
    eventAt: '2025-04-12T11:45:00Z',
    eventHash: '0x2b9c0d1e3f8a6b4c2d9f0e1a3b5d7f1a1b3d5f7a1b3d5f7a1b3d5f7a1b3d5f7a',
  },
  {
    id: 'ev-3',
    eventType: 'PROCESSING_STARTED',
    description: 'Cold-filtered through multi-stage micro-mesh screens without pasteurization',
    eventAt: '2025-04-15T09:00:00Z',
    eventHash: '0x3c0d1e2f4a9b7c5d3e0a1f2b4c6e8a2b2c4e6a8b2c4e6a8b2c4e6a8b2c4e6a8b',
  },
  {
    id: 'ev-4',
    eventType: 'QUALITY_APPROVED',
    description: 'Lab test passed: 17.2% moisture, 99.4% purity, 0% synthetic syrups or antibiotics',
    eventAt: '2025-04-18T16:20:00Z',
    eventHash: '0x4d1e2f3a5b0c8d6e4f1b2a3c5d7f9b3c3d5f7b9c3d5f7b9c3d5f7b9c3d5f7b9c',
  },
  {
    id: 'ev-5',
    eventType: 'BATCH_PACKAGED',
    description: 'Bottled in 500g glass jars with tamper-evident cryptographic QR seal',
    eventAt: '2025-04-20T10:15:00Z',
    eventHash: '0x5e2f3a4b6c1d9e7f5a2c3b4d6e8a0c4d4e6a8c0d4e6a8c0d4e6a8c0d4e6a8c0d',
  },
  {
    id: 'ev-6',
    eventType: 'BLOCKCHAIN_REGISTERED',
    description: 'Merkle batch hash anchored on Ethereum Sepolia ledger in block #6428910',
    eventAt: '2025-04-20T14:32:00Z',
    eventHash: '0x6f3a4b5c7d2e0f8a6b3d4c5e7f9b1d5e5f7b9d1e5f7b9d1e5f7b9d1e5f7b9d1e',
  },
];

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showQrModal, setShowQrModal] = useState(false);

  const isDemo = id?.toUpperCase() === 'HC-DEMO-001';

  const { data: apiBatch, isLoading, refetch } = useQuery({
    queryKey: ['batch', id],
    queryFn: () => batchesApi.get(id!).then((r) => r.data.data),
    enabled: !!id && !isDemo,
  });

  const { data: apiEvents } = useQuery({
    queryKey: ['batch-events', id],
    queryFn: () => batchesApi.getEvents(id!).then((r) => r.data.data),
    enabled: !!id && !isDemo,
  });

  const batch = isDemo ? DEMO_BATCH_DETAIL : apiBatch;
  const events = isDemo ? DEMO_EVENTS : apiEvents;

  const blockchainRegisterMutation = useMutation({
    mutationFn: () => batchesApi.registerBlockchain(id!),
    onSuccess: () => {
      toast.success('Batch registered on blockchain!');
      queryClient.invalidateQueries({ queryKey: ['batch', id] });
    },
    onError: () => toast.error('Blockchain registration failed'),
  });

  const generateQRMutation = useMutation({
    mutationFn: () => batchesApi.generateQR(id!),
    onSuccess: () => {
      toast.success('QR code generated!');
      setShowQrModal(true);
      queryClient.invalidateQueries({ queryKey: ['batch', id] });
    },
    onError: () => {
      // Even if backend is offline, allow opening the QR modal
      setShowQrModal(true);
    },
  });

  if (isLoading && !batch) return <LoadingPage />;
  if (!batch) return <ErrorState message="Batch not found" retry={refetch} />;

  const canRegisterBlockchain = ['ADMIN', 'BEEKEEPER'].includes(user?.role || '') && !batch.blockchainRecord;
  const canGenerateQR = true; // Always allow QR viewing/generating

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Demo Notice */}
      {isDemo && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-xs font-bold text-amber-900">
              Demo Batch (HC-DEMO-001) — Simulated End-to-End Honey Provenance Data
            </span>
          </div>
          <Link
            to="/verify/HC-DEMO-001"
            className="text-xs font-bold text-amber-800 hover:text-amber-900 underline flex items-center gap-1 flex-shrink-0"
          >
            Open Public Verification <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 font-mono">{batch.publicBatchId}</h1>
            <Badge className={BATCH_STATUS_COLORS[batch.status]}>
              {BATCH_STATUS_LABELS[batch.status]}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {batch.variety || batch.floralSource || 'No variety specified'}
            {batch.totalQuantityKg ? ` · ${batch.totalQuantityKg} kg` : ''}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {canRegisterBlockchain && (
            <Button
              size="sm"
              variant="secondary"
              loading={blockchainRegisterMutation.isPending}
              onClick={() => blockchainRegisterMutation.mutate()}
            >
              ⛓️ Register on Blockchain
            </Button>
          )}
          {canGenerateQR && (
            <Button
              size="sm"
              loading={generateQRMutation.isPending}
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              View / Generate QR
            </Button>
          )}
        </div>
      </div>

      {/* Batch Details */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Batch Details</h2>
          <Link
            to={`/verify/${batch.publicBatchId}`}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            Public Verification Page <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {[
            { label: 'Batch ID', value: batch.publicBatchId },
            { label: 'Status', value: BATCH_STATUS_LABELS[batch.status] },
            { label: 'Floral Source', value: batch.floralSource || 'Not specified' },
            { label: 'Variety', value: batch.variety || 'Not specified' },
            { label: 'Harvest Season', value: batch.harvestSeason || 'Not specified' },
            { label: 'Harvest Year', value: batch.harvestYear?.toString() || 'Not specified' },
            { label: 'Total Quantity', value: batch.totalQuantityKg ? `${batch.totalQuantityKg} kg` : 'Not specified' },
            { label: 'Remaining', value: batch.remainingQuantityKg ? `${batch.remainingQuantityKg} kg` : 'Not specified' },
            { label: 'Packaging', value: batch.packagingType || 'Not specified' },
            { label: 'Created', value: formatDate(batch.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between border-b border-slate-100 pb-2.5">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm font-medium text-slate-800">{value}</span>
            </div>
          ))}
        </div>
        {batch.notes && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Notes</p>
            <p className="text-sm text-slate-700">{batch.notes}</p>
          </div>
        )}
      </Card>

      {/* Blockchain Record */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">Blockchain Status</h2>
          {batch.blockchainRecord && (
            <Badge className={BLOCKCHAIN_STATUS_COLORS[batch.blockchainRecord.status]}>
              {batch.blockchainRecord.status}
            </Badge>
          )}
        </div>
        {!batch.blockchainRecord ? (
          <div className="text-center py-6">
            <p className="text-slate-500 text-sm">This batch has not been registered on the blockchain yet.</p>
            {canRegisterBlockchain && (
              <p className="text-xs text-slate-400 mt-1">Register it to create an immutable integrity record.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {batch.blockchainRecord.registrationTxHash && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Transaction Hash</p>
                <p className="text-xs font-mono text-slate-700 break-all bg-slate-50 p-2 rounded-lg">
                  {batch.blockchainRecord.registrationTxHash}
                </p>
              </div>
            )}
            {batch.blockchainRecord.registrationBlock && (
              <div className="flex justify-between text-xs text-slate-600 pt-1">
                <span>Block Number:</span>
                <span className="font-mono font-bold">#{batch.blockchainRecord.registrationBlock}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Quality Tests */}
      {batch.qualityTests && (
        <Card>
          <h2 className="font-semibold text-slate-800 mb-3">Quality Tests</h2>
          {batch.qualityTests.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No quality tests have been conducted yet.</p>
          ) : (
            <div className="space-y-3">
              {batch.qualityTests.map((qt: { id: string; testDate: string; status: string; overallGrade?: string; moisturePercent?: number; testStandard?: string; remarks?: string }) => (
                <div key={qt.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">{formatDate(qt.testDate)}</span>
                    <Badge className={QUALITY_STATUS_COLORS[qt.status as keyof typeof QUALITY_STATUS_COLORS]}>{qt.status}</Badge>
                  </div>
                  {qt.overallGrade && <p className="text-xs text-slate-500 mt-1">Grade: {qt.overallGrade}</p>}
                  {qt.moisturePercent && <p className="text-xs text-slate-500">Moisture: {qt.moisturePercent}%</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Event Timeline */}
      <Card>
        <h2 className="font-semibold text-slate-800 mb-4">Traceability Timeline</h2>
        {!events?.length ? (
          <p className="text-sm text-slate-400 py-4 text-center">No events recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {events.map((event, i) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1.5" />
                  {i < events.length - 1 && <div className="w-0.5 flex-1 bg-amber-200 mt-1" />}
                </div>
                <div className={`${i < events.length - 1 ? 'pb-4' : ''} flex-1`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">{event.description}</p>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatDateTime(event.eventAt)}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{event.eventType}</p>
                  {event.eventHash && (
                    <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                      {event.eventHash.substring(0, 24)}...
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Batch QR Modal */}
      <BatchQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        batchId={batch.publicBatchId}
        variety={batch.variety || batch.floralSource}
        purityScore="99.4%"
        isDemo={isDemo}
      />
    </div>
  );
}
