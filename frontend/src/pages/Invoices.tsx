import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt, RefreshCw } from 'lucide-react';
import { api, extractErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { DataTable, RowAction, type Column } from '@/components/shared/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input, Label } from '@/components/ui/Input';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import type { ApiResponse, Invoice, PaginationMeta } from '@/types';

export default function Invoices() {
  const role = useAuthStore((s) => s.user?.role);
  const [page, setPage] = useState(1);
  const [cashDialogInvoice, setCashDialogInvoice] = useState<Invoice | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ invoices: Invoice[]; meta: PaginationMeta }>>('/invoices', {
        params: { page: String(page) },
      });
      return res.data.data;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (id: string) => api.post<ApiResponse<{ url: string }>>(`/invoices/${id}/checkout`),
    onSuccess: (res) => {
      window.location.href = res.data.data.url;
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const cashMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => api.post(`/invoices/${id}/cash-payment`, { amount, method: 'cash' }),
    onSuccess: () => {
      toast.success('Payment recorded.');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setCashDialogInvoice(null);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post('/invoices/generate-monthly', {}),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice #', render: (i) => <span className="font-mono text-xs">{i.invoiceNumber}</span> },
    { key: 'course', header: 'Course', render: (i) => (typeof i.courseId === 'object' ? i.courseId.title : '—') },
    ...(role !== 'student'
      ? [{ key: 'student', header: 'Student', render: (i: Invoice) => (typeof i.studentId === 'object' ? i.studentId.name : '—') } as Column<Invoice>]
      : []),
    { key: 'amount', header: 'Amount', render: (i) => formatCurrency(i.amount, i.currency) },
    { key: 'dueDate', header: 'Due', render: (i) => new Date(i.dueDate).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (i) => <StatusPill status={i.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Invoices</h1>
          <p className="text-sm text-zinc-500">{role === 'student' ? 'Your billing history.' : 'Track and collect payments.'}</p>
        </div>
        {role === 'admin' && (
          <Button variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            <RefreshCw className="h-4 w-4" /> Generate this month's invoices
          </Button>
        )}
      </div>

      {!isLoading && data?.invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" message="Invoices will appear here once generated or issued." />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.invoices || []}
          meta={data?.meta}
          onPageChange={setPage}
          isLoading={isLoading}
          rowActions={(row) => {
            if (row.status === 'paid' || row.status === 'void') return <RowAction label="View" onClick={() => {}} />;
            if (role === 'student') {
              return <RowAction label="Pay now" onClick={() => checkoutMutation.mutate(row._id)} />;
            }
            return (
              <RowAction
                label="Record cash payment"
                onClick={() => {
                  setCashAmount(String(row.amount));
                  setCashDialogInvoice(row);
                }}
              />
            );
          }}
        />
      )}

      <Dialog
        open={!!cashDialogInvoice}
        onClose={() => setCashDialogInvoice(null)}
        title="Record cash payment"
        footer={
          <>
            <Button variant="outline" onClick={() => setCashDialogInvoice(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => cashDialogInvoice && cashMutation.mutate({ id: cashDialogInvoice._id, amount: Number(cashAmount) })}
              disabled={cashMutation.isPending}
            >
              {cashMutation.isPending ? 'Saving...' : 'Confirm payment'}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-zinc-500">
          Invoice {cashDialogInvoice?.invoiceNumber} — {cashDialogInvoice && formatCurrency(cashDialogInvoice.amount, cashDialogInvoice.currency)} due
        </p>
        <Label>Amount received</Label>
        <Input type="number" step="0.01" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} />
      </Dialog>
    </div>
  );
}
