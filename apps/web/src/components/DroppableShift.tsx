import { useDroppable } from '@dnd-kit/core';
import type { ShiftWithAssignment, EmployeeWithRoles } from '@qwikshifts/core';
import { User } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

export function DroppableShift({ shift, assignedEmployee, onClick, className }: { shift: ShiftWithAssignment, assignedEmployee?: EmployeeWithRoles, onClick?: () => void, className?: string }) {
  const { user } = useAuth();
  const { setNodeRef, isOver } = useDroppable({
    id: `shift-${shift.id}`,
    data: { type: 'shift', shift },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "bg-card border rounded p-2 text-sm shadow-sm transition-colors cursor-pointer hover:border-primary/50",
        isOver && "border-primary ring-2 ring-primary/20",
        className
      )}
    >
      <div className="font-medium">
        {formatTime(shift.startTime, user?.timeFormat)} - {formatTime(shift.endTime, user?.timeFormat)}
      </div>
      {assignedEmployee ? (
        <div className="mt-1 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
            <User size={12} />
            {assignedEmployee.user.name}
          </div>
          {shift.assignment?.roleId && assignedEmployee.roles && (
            <div className="text-[10px] text-muted-foreground px-1">
              {assignedEmployee.roles.find(r => r.id === shift.assignment?.roleId)?.name}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-1 text-xs text-muted-foreground italic">
          Unassigned
        </div>
      )}
    </div>
  );
}
