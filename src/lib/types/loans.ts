import { getLoans } from "../utils/server/loans";

// Type derived from getLoans function
export type LoanWithDetails = Awaited<ReturnType<typeof getLoans>>[number];

export interface CreateLoanResult {
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
  refNo?: number;
}
