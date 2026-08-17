import { FileStatus } from '~/types/files'

export const STATUS_LABELS: Record<FileStatus, string> = {
  [FileStatus.PENDING]: 'Pending',
  [FileStatus.PROCESS]: 'Processing',
  [FileStatus.COMPLETED]: 'Completed',
  [FileStatus.FAILED]: 'Failed'
}

export const getStatusLabel = (status: FileStatus) => STATUS_LABELS[status] ?? 'Unknown'
