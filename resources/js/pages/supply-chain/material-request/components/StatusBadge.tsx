import type {
    MaterialRequestStatus,
} from '../types';

export default function StatusBadge({
    status,
}: {
    status: MaterialRequestStatus;
}) {
    const styles: Record<
        MaterialRequestStatus,
        string
    > = {
        DRAFT: 'bg-gray-100 text-gray-700',
        SUBMITTED: 'bg-amber-100 text-amber-700',
        IN_REVIEW: 'bg-yellow-100 text-yellow-700',
        REVIEWED: 'bg-blue-100 text-blue-700',
        APPROVED: 'bg-green-100 text-green-700',
        REVISION: 'bg-orange-100 text-orange-700',
        REJECTED: 'bg-red-100 text-red-700',
        CANCELLED: 'bg-gray-200 text-gray-700',
        CLOSED: 'bg-purple-100 text-purple-700',
    };

    const labels: Record<
        MaterialRequestStatus,
        string
    > = {
        DRAFT: 'Draft',
        SUBMITTED: 'Submitted',
        IN_REVIEW: 'In Review',
        REVIEWED: 'Reviewed',
        APPROVED: 'Approved',
        REVISION: 'Revision',
        REJECTED: 'Rejected',
        CANCELLED: 'Cancelled',
        CLOSED: 'Closed',
    };

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
        >
            {labels[status]}
        </span>
    );
}
