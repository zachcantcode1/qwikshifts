import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertTriangle, CheckCircle, Users, DollarSign } from 'lucide-react';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: api.getDashboardStats,
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: api.getLocations,
  });

  const defaultLocationId = locations?.[0]?.id;

  const { data: payrollData, isLoading: isPayrollLoading } = useQuery({
    queryKey: ['dashboardPayroll', defaultLocationId],
    queryFn: async () => {
      if (!defaultLocationId) return null;
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return api.getPayroll(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'), defaultLocationId);
    },
    enabled: !!defaultLocationId
  });

  const totalPayroll = payrollData?.data.reduce((sum, item) => sum + item.estimatedPay, 0) || 0;

  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  if (isError || !stats) {
    return <div className="p-8">Failed to load dashboard data.</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground mt-2">Here's what's happening with your team today.</p>
      </div>

      {/* Top Row: Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Time Off Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Time Off Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTimeOffCount}</div>
            <p className="text-xs text-muted-foreground">
              Pending approval
            </p>
            <div className="mt-4">
              <Link to="/time-off-requests">
                <Button variant="outline" size="sm" className="w-full">Review Requests</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Overview Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Schedule
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaysStats.totalShifts}</div>
            <p className="text-xs text-muted-foreground">
              Total shifts scheduled
            </p>
            {stats.todaysStats.unassignedShifts > 0 && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {stats.todaysStats.unassignedShifts} Unassigned shifts!
              </p>
            )}
            <div className="mt-4">
              <Link to="/schedule?view=day">
                <Button variant="outline" size="sm" className="w-full">View Board</Button>
              </Link>
            </div>
          </CardContent>
        </Card>


        {/* Payroll Snapshot */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Est. Payroll (Week)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isPayrollLoading ? "..." : `$${totalPayroll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Current week estimate
            </p>
            <div className="mt-4">
              <Link to="/payroll">
                <Button variant="outline" size="sm" className="w-full">View Details</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Active Staff Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Staff
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Currently clocked in
            </p>
            <div className="mt-4">
              <Button variant="ghost" size="sm" className="w-full" disabled>Coming Soon</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Detailed Status & Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Weekly Coverage Status */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Weekly Coverage</CardTitle>
            <CardDescription>Staffing requirements status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.weeklyRequirements?.map((day) => (
                <div key={day.date} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground w-10">{day.dayName}</span>
                  <div className="flex items-center gap-2">
                    {day.status === 'ok' ? (
                      <span className="text-green-500 text-xs font-medium flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" /> OK
                      </span>
                    ) : (
                      <span className="text-amber-500 text-xs font-medium flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" /> -{day.missing}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(!stats.weeklyRequirements || stats.weeklyRequirements.length === 0) && (
                <p className="text-xs text-muted-foreground">No requirements set.</p>
              )}
            </div>
            <div className="mt-6">
              <Link to="/schedule">
                <Button variant="ghost" size="sm" className="w-full">View Schedule</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Overtime Alerts */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Overtime Risk</CardTitle>
            <CardDescription>
              Approaching weekly limits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.overtimeRisks.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-muted-foreground">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                No risks detected.
              </div>
            ) : (
              <div className="space-y-4">
                {stats.overtimeRisks.map((risk) => (
                  <div key={risk.employeeId} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center space-x-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{risk.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {risk.currentHours} / {risk.limit} hrs
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-500">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      <span className="text-sm font-medium">Risk</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/employees">
              <Button variant="secondary" className="w-full justify-start h-12">
                <Users className="mr-2 h-4 w-4" /> Manage Employees
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="secondary" className="w-full justify-start h-12">
                <CheckCircle className="mr-2 h-4 w-4" /> Update Work Limits
              </Button>
            </Link>
            <Link to="/schedule">
              <Button variant="secondary" className="w-full justify-start h-12">
                <Calendar className="mr-2 h-4 w-4" /> View Schedule
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
