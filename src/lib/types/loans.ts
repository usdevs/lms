import { getLoans } from "../utils/server/loans";

// Enums for loan statuses
export enum LoanRequestStatus {
  PENDING = "PENDING",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

export enum LoanItemStatus {
  PENDING = "PENDING",
  ON_LOAN = "ON_LOAN",
  RETURNED = "RETURNED",
  RETURNED_LATE = "RETURNED_LATE",
  REJECTED = "REJECTED",
}

// Type derived from getLoans function
export type LoanWithDetails = Awaited<ReturnType<typeof getLoans>>[number];

export interface CreateLoanResult {
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
}
