import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date) => (date ? format(new Date(date), 'dd MMM yyyy') : '—');
export const formatDateTime = (date) => (date ? format(new Date(date), 'dd MMM yyyy, h:mm a') : '—');
export const formatRelative = (date) => (date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '—');
export const toInputDate = (date) => (date ? format(new Date(date), 'yyyy-MM-dd') : '');
