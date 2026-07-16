import AppLayout from '@/layouts/tailadmin/AppLayout';
import { Head } from '@inertiajs/react';

import MaterialRequestForm from './components/MaterialRequestForm';

import type {
    CompanyOption,
    DepartmentOption,
    MaterialRequestDetail,
    MaterialRequestFormData,
    MaterialRequestItemForm,
    RequesterOption,
    SelectOption,
} from './types';

type Props = {
    materialRequest: MaterialRequestDetail;
    departments: DepartmentOption[];
    companies: CompanyOption[];
    priorityOptions: SelectOption[];
    requestTypeOptions: SelectOption[];
};

function createRowId(
    id: number,
): string {
    return `existing-${id}`;
}

export default function Edit({
    materialRequest,
    departments,
    companies,
    priorityOptions,
    requestTypeOptions,
}: Props) {
    const requester: RequesterOption = {
        id: materialRequest.requester.id,
        name: materialRequest.requester.name,
        email:
            materialRequest.requester.email,
        department_id:
            materialRequest.department_id,
        company_id:
            materialRequest.company_id,
    };

    const items: MaterialRequestItemForm[] =
        materialRequest.items.map(
            (item) => ({
                row_id:
                    createRowId(item.id),
                id: item.id,
                item_master_id:
                    item.item_master_id,
                item_code:
                    item.item_code,
                part_number:
                    item.part_number ?? '',
                description:
                    item.description,
                brand:
                    item.brand ?? '',
                uom: item.uom ?? '',
                quantity:
                    String(item.quantity),
                available_stock:
                    String(
                        item.available_stock,
                    ),
                required_date:
                    item.required_date
                        ? item.required_date.slice(
                              0,
                              10,
                          )
                        : '',
                suggested_vendor:
                    item.suggested_vendor ??
                    '',
                estimated_price:
                    item.estimated_price ===
                    null
                        ? ''
                        : String(
                              item.estimated_price,
                          ),
                lead_time_days:
                    item.lead_time_days ===
                    null
                        ? ''
                        : String(
                              item.lead_time_days,
                          ),
                remarks:
                    item.remarks ?? '',
                process_status:
                    item.process_status ??
                    'PENDING',
            }),
        );

    const initialData: Partial<MaterialRequestFormData> =
        {
            mr_date:
                materialRequest.mr_date.slice(
                    0,
                    10,
                ),
            department_id: String(
                materialRequest.department_id,
            ),
            company_id:
                materialRequest.company_id
                    ? String(
                          materialRequest.company_id,
                      )
                    : '',
            branch:
                materialRequest.branch ?? '',
            priority:
                materialRequest.priority,
            required_date:
                materialRequest.required_date
                    ? materialRequest.required_date.slice(
                          0,
                          10,
                      )
                    : '',
            request_type:
                materialRequest.request_type,
            customer_name:
                materialRequest.customer_name ??
                '',
            sales_order_no:
                materialRequest.sales_order_no ??
                '',
            reference_rfq:
                materialRequest.reference_rfq ??
                '',
            subject:
                materialRequest.subject,
            remarks:
                materialRequest.remarks ?? '',
            items,
        };

    return (
        <AppLayout>
            <Head
                title={`Edit ${materialRequest.mr_number}`}
            />

            <div className="space-y-5">
                <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Edit Material Request
                    </h1>

                    <p className="mt-1 text-sm font-medium text-gray-600">
                        {materialRequest.mr_number} — status {materialRequest.status}.
                    </p>
                </div>

                <MaterialRequestForm
                    mode="edit"
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
                    initialData={
                        initialData
                    }
                    materialRequestId={
                        materialRequest.id
                    }
                />
            </div>
        </AppLayout>
    );
}
