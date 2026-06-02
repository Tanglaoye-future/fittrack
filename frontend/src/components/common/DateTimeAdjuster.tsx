'use client';

import { nowDate, nowTime } from '@/lib/datetime';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  onDateChange: (v: string) => void;
  time?: string;
  onTimeChange?: (v: string) => void;
}

export function DateTimeAdjuster({ open, onOpenChange, date, onDateChange, time, onTimeChange }: Props) {
  const hasTime = time !== undefined && onTimeChange !== undefined;

  if (!open) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 py-1">
        <span>🕒 时间：</span>
        <span className="font-medium text-gray-800">现在</span>
        <button
          type="button"
          onClick={() => {
            onDateChange(nowDate());
            if (hasTime) onTimeChange!(nowTime());
            onOpenChange(true);
          }}
          className="text-primary-600 hover:underline"
        >
          调整
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={`grid ${hasTime ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
        <div>
          <label className="label">日期</label>
          <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className="input" />
        </div>
        {hasTime && (
          <div>
            <label className="label">时间</label>
            <input type="time" value={time} onChange={(e) => onTimeChange!(e.target.value)} className="input" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="text-xs text-gray-500 hover:underline"
      >
        ↺ 收起，提交时使用当前时间
      </button>
    </div>
  );
}
