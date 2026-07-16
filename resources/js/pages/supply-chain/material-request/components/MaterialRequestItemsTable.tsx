import type {
    MaterialRequestItemForm,
} from '../types';

type Props = {
    items: MaterialRequestItemForm[];
    onChange: (
        items: MaterialRequestItemForm[],
    ) => void;
};

export default function MaterialRequestItemsTable({
    items,
    onChange,
}: Props) {
    const updateItem = (
        rowId: string,
        field: keyof MaterialRequestItemForm,
        value: string,
    ) => {
        onChange(
            items.map((item) =>
                item.row_id === rowId
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item,
            ),
        );
    };

    const removeItem = (rowId: string) => {
        onChange(
            items.filter(
                (item) =>
                    item.row_id !== rowId,
            ),
        );
    };

    if (items.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
                Belum ada item. Klik Add Item untuk memilih barang dari Item Master.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[1750px] table-auto">
                <thead className="bg-gray-50">
                    <tr>
                        {[
                            'No',
                            'Item Code',
                            'Part Number',
                            'Description',
                            'Brand',
                            'UOM',
                            'Stock',
                            'Qty Request',
                            'Required Date',
                            'Suggested Vendor',
                            'Estimated Price',
                            'Lead Time',
                            'Remarks',
                            'Action',
                        ].map((label) => (
                            <th
                                key={label}
                                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                            >
                                {label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                    {items.map((item, index) => (
                        <tr
                            key={item.row_id}
                            className="align-top transition hover:bg-gray-50"
                        >
                            <td className="px-4 py-4 text-sm text-gray-600">
                                {index + 1}
                            </td>

                            <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                                {item.item_code}
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-700">
                                {item.part_number || '-'}
                            </td>

                            <td className="px-4 py-4">
                                <div
                                    className="max-w-[320px] text-sm text-gray-700"
                                    title={item.description}
                                >
                                    {item.description}
                                </div>
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-700">
                                {item.brand || '-'}
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-700">
                                {item.uom || '-'}
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-700">
                                {item.available_stock || '0'}
                            </td>

                            <td className="px-4 py-4">
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={item.quantity}
                                    onChange={(event) =>
                                        updateItem(
                                            item.row_id,
                                            'quantity',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 w-28 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />
                            </td>

                            <td className="px-4 py-4">
                                <input
                                    type="date"
                                    value={item.required_date}
                                    onChange={(event) =>
                                        updateItem(
                                            item.row_id,
                                            'required_date',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 w-40 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />
                            </td>

                            <td className="px-4 py-4">
                                <input
                                    type="text"
                                    value={item.suggested_vendor}
                                    onChange={(event) =>
                                        updateItem(
                                            item.row_id,
                                            'suggested_vendor',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 w-48 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />
                            </td>

                            <td className="px-4 py-4">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.estimated_price}
                                    onChange={(event) =>
                                        updateItem(
                                            item.row_id,
                                            'estimated_price',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 w-40 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />
                            </td>

                            <td className="px-4 py-4">
                                <input
                                    type="number"
                                    min="0"
                                    value={item.lead_time_days}
                                    onChange={(event) =>
                                        updateItem(
                                            item.row_id,
                                            'lead_time_days',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 w-28 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />
                            </td>

                            <td className="px-4 py-4">
                                <textarea
                                    value={item.remarks}
                                    onChange={(event) =>
                                        updateItem(
                                            item.row_id,
                                            'remarks',
                                            event.target.value,
                                        )
                                    }
                                    className="min-h-20 w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                                />
                            </td>

                            <td className="px-4 py-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        removeItem(
                                            item.row_id,
                                        )
                                    }
                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
