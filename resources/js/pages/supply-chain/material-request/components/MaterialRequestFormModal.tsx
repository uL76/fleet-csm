import { useEffect } from 'react';

import MaterialRequestForm from './MaterialRequestForm';

import type {
    CompanyOption,
    DepartmentOption,
    MaterialRequestFormData,
    RequesterOption,
    SelectOption,
} from '../types';

type Props = {
    open: boolean;
    mode: 'create' | 'edit';
    requester: RequesterOption;
    departments: DepartmentOption[];
    companies: CompanyOption[];
    priorityOptions: SelectOption[];
    requestTypeOptions: SelectOption[];
    initialData?: Partial<MaterialRequestFormData>;
    materialRequestId?: number;
    materialRequestNumber?: string;
    onClose: () => void;
    onSaved: () => void;
};

export default function MaterialRequestFormModal({
    open,
    mode,
    requester,
    departments,
    companies,
    priorityOptions,
    requestTypeOptions,
    initialData,
    materialRequestId,
    materialRequestNumber,
    onClose,
    onSaved,
}: Props) {
    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[99990] bg-gray-100">
            <div className="flex h-screen flex-col">
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
                            {mode === 'create'
                                ? 'Create Material Request'
                                : `Edit Material Request ${materialRequestNumber ?? ''}`}
                        </h2>
                        <p className="mt-0.5 text-xs font-medium text-gray-500 sm:text-sm">
                            {mode === 'create'
                                ? 'Buat permintaan barang baru dan simpan sebagai Draft.'
                                : 'Perbarui Material Request yang masih dapat diedit.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 bg-white text-lg font-semibold text-gray-700 hover:bg-gray-100"
                    >
                        ×
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                    <div className="mx-auto max-w-[1600px]">
                        <MaterialRequestForm
                            key={`${mode}-${materialRequestId ?? 'new'}`}
                            mode={mode}
                            requester={requester}
                            departments={departments}
                            companies={companies}
                            priorityOptions={priorityOptions}
                            requestTypeOptions={requestTypeOptions}
                            initialData={initialData}
                            materialRequestId={materialRequestId}
                            embedded
                            onCancel={onClose}
                            onSuccess={onSaved}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
