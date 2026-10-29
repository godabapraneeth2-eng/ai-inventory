export type Status = 'completed' | 'processing' | 'pending' | 'exception' | 'escalated' | 'rejected';

const statusLabels: Record<Status, string> = { 
  completed: 'Completed', 
  processing: 'Processing', 
  pending: 'Pending', 
  exception: 'Exception', 
  escalated: 'Escalated', 
  rejected: 'Rejected' 
};

export function StatusBadge({ status }: { status: string }) {
  const s = status as Status;
  const style = s === 'completed' ? 'badge-success' : s === 'exception' ? 'badge-warning' : s === 'escalated' || s === 'rejected' ? 'badge-error' : s === 'processing' ? 'badge-info' : 'badge-neutral';
  return (
    <span className={`badge ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[s] ?? status}
    </span>
  );
}
