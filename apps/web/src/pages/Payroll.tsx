import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, DollarSign, Clock } from 'lucide-react';

export function Payroll() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [locationId, setLocationId] = useState<string>('');
    const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
    const [payrollData, setPayrollData] = useState<{
        id: string;
        name: string;
        role: string;
        hourlyRate: number;
        totalHours: number;
        estimatedPay: number;
    }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Memoize dates to prevent infinite loop
    const { startDate, endDate } = useMemo(() => ({
        startDate: startOfWeek(currentDate, { weekStartsOn: 1 }),
        endDate: endOfWeek(currentDate, { weekStartsOn: 1 })
    }), [currentDate]);

    useEffect(() => {
        api.getLocations().then((locs) => {
            setLocations(locs);
            if (locs.length > 0) {
                setLocationId(locs[0].id);
            }
        });
    }, []);

    useEffect(() => {
        if (!locationId) return;
        setIsLoading(true);
        // Date objects change reference on every render if not memoized, causing infinite loop
        // Fixed by memoizing above or passing formatted strings to dependency array
        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');

        api.getPayroll(startStr, endStr, locationId)
            .then((res) => setPayrollData(res.data))
            .catch((err) => console.error(err))
            .finally(() => setIsLoading(false));
    }, [startDate, endDate, locationId]);

    const totalHours = payrollData.reduce((acc, curr) => acc + curr.totalHours, 0);
    const totalCost = payrollData.reduce((acc, curr) => acc + curr.estimatedPay, 0);

    if (user?.role !== 'manager') {
        return <div className="p-8">Access Denied</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payroll Estimation</h1>
                    <p className="text-muted-foreground">
                        Estimate labor costs for {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                        value={locationId}
                        onChange={(e) => setLocationId(e.target.value)}
                    >
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="tracking-tight text-sm font-medium">Total Cost</div>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="tracking-tight text-sm font-medium">Total Hours</div>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{totalHours.toFixed(1)} hrs</div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between bg-card border rounded-lg p-2">
                <button
                    onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="font-medium">
                    {format(startDate, 'MMMM d')} - {format(endDate, 'MMMM d, yyyy')}
                </div>
                <button
                    onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Employee</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Hourly Rate</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total Hours</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Est. Gross Pay</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground animate-pulse">
                                        Loading payroll data...
                                    </td>
                                </tr>
                            ) : payrollData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                        No data found for this period.
                                    </td>
                                </tr>
                            ) : (
                                payrollData.map((item) => (
                                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{item.name}</td>
                                        <td className="p-4 align-middle capitalize text-muted-foreground">{item.role}</td>
                                        <td className="p-4 align-middle text-right">
                                            {item.hourlyRate ? `$${item.hourlyRate.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="p-4 align-middle text-right">{item.totalHours.toFixed(1)}</td>
                                        <td className="p-4 align-middle text-right font-medium text-primary">
                                            ${item.estimatedPay.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-sm text-muted-foreground bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <span className="font-semibold">Note:</span> This is an estimation based on scheduled shift times. Actual payroll may vary based on time clock data (once implemented) and tax/deductions.
            </div>
        </div>
    );
}
