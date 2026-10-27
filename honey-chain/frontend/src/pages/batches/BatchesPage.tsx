import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { batchesApi } from '../../api';
import { Card, Badge, Button, PageHeader, LoadingPage, ErrorState } from '../../components/ui';
import { BatchQrModal } from '../../components/batches/BatchQrModal';
import { BATCH_STATUS_COLORS, BATCH_STATUS_LABELS, formatDate } from '../../utils';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Sparkles, QrCode, ExternalLink } from 'lucide-react';

export default function BatchesPage() {
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [showDemoQrModal, setShowDemoQrModal] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['batches', { status: statusFilter }],
    queryFn: () => batchesApi.list({ status: statusFilter || undefined, limit: 20 }).then((r) => r.data),
  });

  const STATUS_OPTIONS = [
    '', 'DRAFT', 'COLLECTED', 'PROCESSING', 'QUALITY_TESTING',
    'APPROVED', 'PACKAGED', 'IN_DISTRIBUTION', 'AT_RETAILER', 'SOLD', 'RECALLED'
  ];

  if (isLoading) return <LoadingPage />;
  if (error && !data) return <ErrorState message="Failed to load batches" retry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Honey Batches"
        subtitle={data?.pagination.total !== undefined ? `${data.pagination.total} total batches` : 'Honey traceability batches'}
        action={
          ['ADMIN', 'BEEKEEPER', 'COLLECTION_CENTER'].includes(user?.role || '') ? (
            <Link to="/batches/create">
              <Button size="sm">+ New Batch</Button>
            </Link>
          ) : null
        }
      />

      {/* Pinned Demo Batch Card */}
      <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-slate-900 text-sm">HC-DEMO-001</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                VERIFIED DEMO BATCH
              </span>
              <Badge className="bg-emerald-100 text-emerald-800">PACKAGED</Badge>
              <Badge className="bg-green-100 text-green-700">⛓️ On-Chain Confirmed</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Wild Acacia Himalayan Raw Honey · 120 kg · 99.4% Purity · Rajesh Kumar (Maldevta Apiary, Dehradun)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-xs flex items-center gap-1.5"
            onClick={() => setShowDemoQrModal(true)}
          >
            <QrCode className="w-3.5 h-3.5" />
            View QR & Label
          </Button>
          <Link to="/batches/HC-DEMO-001">
            <Button size="sm" variant="secondary" className="text-xs">
              Batch Details
            </Button>
          </Link>
          <Link to="/verify/HC-DEMO-001" target="_blank">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs flex items-center gap-1">
              Verify <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              statusFilter === s
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-slate-600 border-slate-300 hover:border-amber-300'
            }`}
          >
            {s ? BATCH_STATUS_LABELS[s as keyof typeof BATCH_STATUS_LABELS] : 'All'}
          </button>
        ))}
      </div>

      {!data?.data?.length ? (
        <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          <span className="text-4xl block">🍯</span>
          <h3 className="font-bold text-slate-800 text-sm">No live database batches registered yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You can create a new honey batch using the button above or test QR generation with our preloaded demo batch <strong>HC-DEMO-001</strong>.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <Link to="/batches/create">
              <Button size="sm">+ Create Batch</Button>
            </Link>
            <Button size="sm" variant="outline" onClick={() => setShowDemoQrModal(true)}>
              Test Demo QR
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.data.map((batch) => (
            <Link key={batch.id} to={`/batches/${batch.id}`}>
              <Card className="hover:border-amber-200 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 font-mono text-sm">{batch.publicBatchId}</span>
                      <Badge className={BATCH_STATUS_COLORS[batch.status]}>
                        {BATCH_STATUS_LABELS[batch.status]}
                      </Badge>
                      {batch.blockchainRecord?.status === 'CONFIRMED' && (
                        <Badge className="bg-green-100 text-green-700">⛓️ On-Chain</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {batch.variety || batch.floralSource || 'Unknown variety'}
                      {batch.totalQuantityKg ? ` · ${batch.totalQuantityKg} kg` : ''}
                      {batch.beekeeper?.user ? ` · ${batch.beekeeper.user.firstName} ${batch.beekeeper.user.lastName}` : ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Created {formatDate(batch.createdAt)}</p>
                  </div>
                  <div className="text-slate-400 text-sm">→</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

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
    </div>
  );
}
