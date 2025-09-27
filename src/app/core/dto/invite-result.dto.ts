export interface InviteResult {
  totalRows: number;
  processed: number;
  sent: number;
  skippedNoEmail: number;
  failures: number;
  dryRun: boolean;
  details: Array<{ email: string; status: string; error?: string }>;
}
