import { getLoans } from "../utils/server/loans";
import { LoanRequestStatus, LoanItemStatus } from "@prisma/client";

// Type derived from getLoans function
export type LoanWithDetails = Awaited<ReturnType<typeof getLoans>>[number];

export interface CreateLoanResult {
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
}
