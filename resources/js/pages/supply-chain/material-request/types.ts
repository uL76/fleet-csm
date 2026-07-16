export type SelectOption = {
    value: string;
    label: string;
};

export type DepartmentOption = {
    id: number;
    department_code: string;
    department_name: string;
};

export type CompanyOption = {
    id: number;
    company_code: string;
    company_name: string;
};

export type RequesterOption = {
    id: number;
    name: string;
    email: string;
    department_id: number | null;
    company_id: number | null;
};

export type MaterialRequestStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'IN_REVIEW'
    | 'REVIEWED'
    | 'APPROVED'
    | 'REVISION'
    | 'REJECTED'
    | 'CANCELLED'
    | 'CLOSED';

export type MaterialRequestPriority =
    | 'EMERGENCY'
    | 'HIGH'
    | 'MEDIUM'
    | 'LOW';

export type MaterialRequestType =
    | 'STOCK_REPLENISHMENT'
    | 'CUSTOMER_ORDER'
    | 'OFFICE_SUPPLY'
    | 'OTHER';

export type MaterialRequestItemForm = {
    row_id: string;
    id?: number;
    item_master_id: number | null;
    item_code: string;
    part_number: string;
    description: string;
    brand: string;
    uom: string;
    quantity: string;
    available_stock: string;
    required_date: string;
    suggested_vendor: string;
    estimated_price: string;
    lead_time_days: string;
    remarks: string;
    process_status: string;
};

export type MaterialRequestFormData = {
    mr_date: string;
    department_id: string;
    company_id: string;
    branch: string;
    priority: MaterialRequestPriority;
    required_date: string;
    request_type: MaterialRequestType;
    customer_name: string;
    sales_order_no: string;
    reference_rfq: string;
    subject: string;
    remarks: string;
    items: MaterialRequestItemForm[];
};

export type ItemMasterOption = {
    id: number;
    item_code: string;
    part_number: string | null;
    item_description: string | null;
    unit_name: string | null;
    brand_name: string | null;
    preferred_vendor: string | null;
    total_stock: string | number | null;
    minimum_stock: string | number | null;
    maximum_quantity: string | number | null;
};

export type MaterialRequestItem = {
    id: number;
    material_request_id: number;
    item_master_id: number | null;
    item_code: string;
    part_number: string | null;
    description: string;
    brand: string | null;
    uom: string | null;
    quantity: string | number;
    available_stock: string | number;
    required_date: string | null;
    suggested_vendor: string | null;
    estimated_price: string | number | null;
    lead_time_days: number | null;
    remarks: string | null;
    process_status: string;
    created_at: string;
    updated_at: string;
};

export type UserSummary = {
    id: number;
    name: string;
    email: string;
};

export type DepartmentSummary = {
    id: number;
    department_code: string;
    department_name: string;
};

export type CompanySummary = {
    id: number;
    company_code: string;
    company_name: string;
};

export type MaterialRequestApproval = {
    id: number;
    sequence: number;
    action_type: 'REVIEW' | 'APPROVE';
    status:
        | 'PENDING'
        | 'APPROVED'
        | 'REJECTED'
        | 'REVISION'
        | 'SKIPPED';
    comments: string | null;
    acted_at: string | null;
    assigned_user: UserSummary;
    action_user: UserSummary | null;
};

export type MaterialRequestLog = {
    id: number;
    action: string;
    from_status: string | null;
    to_status: string | null;
    comments: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    user: UserSummary | null;
};

export type MaterialRequestDetail = {
    id: number;
    mr_number: string;
    mr_date: string;
    requested_by: number;
    department_id: number;
    company_id: number | null;
    branch: string | null;
    priority: MaterialRequestPriority;
    required_date: string | null;
    request_type: MaterialRequestType;
    customer_name: string | null;
    sales_order_no: string | null;
    reference_rfq: string | null;
    subject: string;
    remarks: string | null;
    status: MaterialRequestStatus;
    current_approval_sequence: number | null;
    submitted_at: string | null;
    reviewed_at: string | null;
    approved_at: string | null;
    rejected_at: string | null;
    closed_at: string | null;
    created_at: string;
    updated_at: string;
    requester: UserSummary;
    department: DepartmentSummary;
    company: CompanySummary | null;
    items: MaterialRequestItem[];
    approvals: MaterialRequestApproval[];
    logs: MaterialRequestLog[];
};
