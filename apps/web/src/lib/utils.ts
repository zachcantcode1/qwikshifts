import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateDuration = (start: string, end: string) => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  return (endH + endM / 60) - (startH + startM / 60);
};

export const formatTime = (time: string, format: '12h' | '24h' = '24h') => {
  if (format === '24h') return time;

  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;

  return `${h12}:${minutes} ${ampm}`;
};
