export interface TicketRecord {
  id?: number;
  drawNumber: string;
  numbers: number[];
  extraNumber?: number;
  units: number;
  amount: number;
  uploadDate: string;
  userNote?: string;
  thumbnailDataURL?: string;
}

export interface DrawResult {
  drawNumber: string;
  drawDate: string;
  winningNumbers: number[];
  extraNumber: number;
}

export interface ComparisonResult {
  matchedNumbers: number[];
  extraMatched: boolean;
  prizeCategory: string | null;
  prizeTier: number | null;
}
