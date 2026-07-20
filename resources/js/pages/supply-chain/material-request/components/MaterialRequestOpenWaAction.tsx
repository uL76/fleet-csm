import { router } from '@inertiajs/react';

type MaterialRequestStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'IN_REVIEW'
    | 'REVIEWED'
    | 'APPROVED'
    | 'REVISION'
    | 'REJECTED'
    | 'CANCELLED'
    | 'CLOSED';

type MaterialRequestActionData = {
    id: number;
    mr_number: string;
    subject: string;
    status: MaterialRequestStatus;
    department: {
        department_name: string;
    };
};

type Props = {
    materialRequest: MaterialRequestActionData;
    publicUrl?: string | null;
};

function formatStatus(
    status: MaterialRequestStatus,
): string {
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

    return labels[status];
}

export default function MaterialRequestOpenWaAction({
    materialRequest,
    publicUrl = null,
}: Props) {
    const internalUrl =
        `/supply-chain/material-requests/${materialRequest.id}`;

    const shareUrl =
        publicUrl ||
        `${window.location.origin}${internalUrl}`;

    const handleOpen = () => {
        router.visit(internalUrl);
    };

    const handleShareWhatsApp = () => {
        const message = [
            '*Material Request*',
            '',
            `MR Number: ${materialRequest.mr_number}`,
            `Subject: ${materialRequest.subject}`,
            `Department: ${materialRequest.department.department_name}`,
            `Status: ${formatStatus(materialRequest.status)}`,
            '',
            'Detail Material Request:',
            shareUrl,
        ].join('\n');

        window.open(
            `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`,
            '_blank',
            'noopener,noreferrer',
        );
    };

    return (
        <div className="flex justify-end">
            <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
                <button
                    type="button"
                    onClick={handleOpen}
                    className="inline-flex items-center gap-1.5 border-r border-gray-300 bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
                >
                    <OpenIcon />
                    Open
                </button>

                <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                    title="Share melalui WhatsApp Web"
                >
                    <WhatsAppIcon />
                    WA
                </button>
            </div>
        </div>
    );
}

function OpenIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path
                d="M8 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5V16"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
            <path
                d="M13 5h6v6M19 5l-8 8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function WhatsAppIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path
                d="M20 11.5a8 8 0 0 1-11.8 7L4 19.5l1.1-4A8 8 0 1 1 20 11.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8.5 8.5c.4 3.5 2.5 5.6 6 6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
        </svg>
    );
}
