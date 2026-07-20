import axios from 'axios';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import type {
    ItemMasterOption,
} from '../types';

type Props = {
    open: boolean;
    onClose: () => void;
    onSelect: (
        item: ItemMasterOption,
    ) => void;
};

type ApiResponse = {
    data: ItemMasterOption[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        has_more: boolean;
    };
};

function getErrorMessage(
    error: unknown,
): string {
    if (axios.isAxiosError(error)) {
        const message =
            error.response?.data?.message;

        if (
            typeof message === 'string'
            && message !== ''
        ) {
            return message;
        }

        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Gagal mengambil data Item Master.';
}

export default function ItemMasterPickerModal({
    open,
    onClose,
    onSelect,
}: Props) {
    const [search, setSearch] =
        useState('');
    const [items, setItems] = useState<
        ItemMasterOption[]
    >([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] =
        useState(false);
    const [loading, setLoading] =
        useState(false);
    const [error, setError] =
        useState<string | null>(null);

    const requestIdRef = useRef(0);

    const loadItems = useCallback(
        async (
            reset: boolean,
            keyword: string,
        ) => {
            const requestId =
                ++requestIdRef.current;

            const nextPage = reset
                ? 1
                : page + 1;

            setLoading(true);
            setError(null);

            try {
                const response =
                    await axios.get<ApiResponse>(
                        '/supply-chain/material-requests/item-master-options',
                        {
                            params: {
                                search:
                                    keyword,
                                page: nextPage,
                                limit: 25,
                            },
                        },
                    );

                if (
                    requestId !==
                    requestIdRef.current
                ) {
                    return;
                }

                setItems((current) =>
                    reset
                        ? response.data.data
                        : [
                              ...current,
                              ...response.data.data,
                          ],
                );

                setPage(
                    response.data.meta
                        .current_page,
                );

                setHasMore(
                    response.data.meta
                        .has_more,
                );
            } catch (caughtError) {
                if (
                    requestId !==
                    requestIdRef.current
                ) {
                    return;
                }

                setError(
                    getErrorMessage(
                        caughtError,
                    ),
                );
            } finally {
                if (
                    requestId ===
                    requestIdRef.current
                ) {
                    setLoading(false);
                }
            }
        },
        [page],
    );

    useEffect(() => {
        if (!open) return;

        const timer = window.setTimeout(
            () => {
                void loadItems(
                    true,
                    search,
                );
            },
            400,
        );

        return () => {
            window.clearTimeout(timer);
        };
    }, [open, search, loadItems]);

    useEffect(() => {
        if (!open) {
            setSearch('');
            setItems([]);
            setPage(1);
            setHasMore(false);
            setError(null);
        }
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100010] flex items-center justify-center bg-black/50 px-4 py-6"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Select Item Master
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                            Cari item berdasarkan item code, part number, description, brand, atau cross reference.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                        ✕
                    </button>
                </div>

                <div className="border-b border-gray-200 p-5">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value,
                            )
                        }
                        placeholder="Search Item Master..."
                        autoFocus
                        className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                </div>

                <div className="flex-1 overflow-auto p-5">
                    {error && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full min-w-[1050px] table-auto">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[
                                        'Item Code',
                                        'Part Number',
                                        'Description',
                                        'Brand',
                                        'UOM',
                                        'Stock',
                                        'Preferred Vendor',
                                        'Action',
                                    ].map((label) => (
                                        <th
                                            key={label}
                                            className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white">
                                {items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition hover:bg-gray-50"
                                    >
                                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                            {item.item_code}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {item.part_number ??
                                                '-'}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div
                                                className="max-w-[340px] truncate text-sm text-gray-700"
                                                title={
                                                    item.item_description ??
                                                    undefined
                                                }
                                            >
                                                {item.item_description ??
                                                    '-'}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {item.brand_name ??
                                                '-'}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {item.unit_name ??
                                                '-'}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {item.total_stock ??
                                                0}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {item.preferred_vendor ??
                                                '-'}
                                        </td>

                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onSelect(
                                                        item,
                                                    )
                                                }
                                                className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-600"
                                            >
                                                Select
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {!loading &&
                                    items.length ===
                                        0 && (
                                        <tr>
                                            <td
                                                colSpan={
                                                    8
                                                }
                                                className="px-5 py-12 text-center text-sm text-gray-500"
                                            >
                                                Item tidak ditemukan.
                                            </td>
                                        </tr>
                                    )}
                            </tbody>
                        </table>
                    </div>

                    {loading && (
                        <div className="py-6 text-center text-sm font-medium text-gray-500">
                            Loading Item Master...
                        </div>
                    )}

                    {hasMore && !loading && (
                        <div className="mt-5 text-center">
                            <button
                                type="button"
                                onClick={() =>
                                    void loadItems(
                                        false,
                                        search,
                                    )
                                }
                                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                            >
                                Load More
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
