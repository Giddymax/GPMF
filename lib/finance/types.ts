export type RepaymentFrequency = "daily" | "weekly" | "monthly";

export type ParBucket = "current" | "1-30" | "31-90" | "90+";

export type GroupMemberStatus =
  | "pending"
  | "current"
  | "overdue"
  | "defaulted"
  | "completed";
