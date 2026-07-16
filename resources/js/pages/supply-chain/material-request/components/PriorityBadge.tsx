import type {
    MaterialRequestPriority,
} from '../types';

export default function PriorityBadge({
    priority,
}: {
    priority: MaterialRequestPriority;
}) {
    const styles: Record<
        MaterialRequestPriority,
        string
    > = {
        EMERGENCY: 'bg-red-100 text-red-700',
        HIGH: 'bg-amber-100 text-amber-700',
        MEDIUM: 'bg-blue-100 text-blue-700',
        LOW: 'bg-green-100 text-green-700',
    };

    const labels: Record<
        MaterialRequestPriority,
        string
    > = {
        EMERGENCY: 'Emergency',
        HIGH: 'High',
        MEDIUM: 'Medium',
        LOW: 'Low',
    };

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[priority]}`}
        >
            {labels[priority]}
        </span>
    );
}
