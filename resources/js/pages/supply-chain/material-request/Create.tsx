import AppLayout from '@/layouts/tailadmin/AppLayout';
import { Head } from '@inertiajs/react';

import MaterialRequestForm from './components/MaterialRequestForm';

import type {
    CompanyOption,
    DepartmentOption,
    RequesterOption,
    SelectOption,
} from './types';

type Props = {
    departments: DepartmentOption[];
    companies: CompanyOption[];
    requester: RequesterOption;
    priorityOptions: SelectOption[];
    requestTypeOptions: SelectOption[];
};

export default function Create({
    departments,
    companies,
    requester,
    priorityOptions,
    requestTypeOptions,
}: Props) {
    return (
        <AppLayout>
            <Head title="Create Material Request" />

            <div className="space-y-5">
                <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Create Material Request
                    </h1>

                    <p className="mt-1 text-sm font-medium text-gray-600">
                        Buat permintaan barang baru dan simpan sebagai Draft.
                    </p>
                </div>

                <MaterialRequestForm
                    mode="create"
                    departments={
                        departments
                    }
                    companies={companies}
                    requester={requester}
                    priorityOptions={
                        priorityOptions
                    }
                    requestTypeOptions={
                        requestTypeOptions
                    }
                />
            </div>
        </AppLayout>
    );
}
