import { LoadStats } from './load-stats.dto';

export interface UploadRosterResponse {
  mode: 'direct';
  key: string;
  filename: string;
  contentType: string;
  bytes: number;
  downloadUrl: string;
  loaded: boolean;
  loadStats?: LoadStats;
  loadSkippedReason?: string;
}
