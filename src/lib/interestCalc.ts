/** Interest turnover calculations. */

export type InterestFrequency = "Monthly" | "Quarterly" | "Yearly";
export type InterestType = "Simple Interest" | "Compound Interest";

export interface InterestInput {
  principal: number;
  rate: number; // annual %
  interestType: InterestType;
  frequency: InterestFrequency;
  startDate?: string | null;
  dueDate?: string | null;
  interestReceived?: number;
}

export interface InterestResult {
  monthlyInterest: number;
  totalInterestEarned: number; // over elapsed period to today (or up to due date if past)
  outstandingPrincipal: number;
  totalReceivable: number; // pending interest + outstanding principal
  expectedMaturityAmount: number; // over full term start->due
  monthsElapsed: number;
  monthsTotal: number;
  interestPending: number;
}

function periodsPerYear(freq: InterestFrequency): number {
  return freq === "Monthly" ? 12 : freq === "Quarterly" ? 4 : 1;
}

function monthsBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 30.4375));
}

export function calcInterest(input: InterestInput): InterestResult {
  const principal = Number(input.principal || 0);
  const annualRate = Number(input.rate || 0) / 100;
  const received = Number(input.interestReceived || 0);
  const start = input.startDate ? new Date(input.startDate) : null;
  const due = input.dueDate ? new Date(input.dueDate) : null;
  const today = new Date();

  const monthsTotal = start && due ? monthsBetween(start, due) : 0;
  const monthsElapsed = start ? Math.min(monthsBetween(start, today), monthsTotal || Infinity) : 0;

  const ppy = periodsPerYear(input.frequency);
  const monthlyInterest = principal > 0 ? (principal * annualRate) / 12 : 0;

  let totalInterestEarned = 0;
  let expectedMaturityAmount = principal;

  if (input.interestType === "Simple Interest") {
    totalInterestEarned = principal * annualRate * (monthsElapsed / 12);
    if (monthsTotal > 0) {
      expectedMaturityAmount = principal + principal * annualRate * (monthsTotal / 12);
    }
  } else {
    // Compound at chosen frequency
    const periodsElapsed = (monthsElapsed / 12) * ppy;
    const periodsTotal = (monthsTotal / 12) * ppy;
    const perRate = annualRate / ppy;
    if (principal > 0 && perRate >= 0) {
      totalInterestEarned = principal * (Math.pow(1 + perRate, periodsElapsed) - 1);
      if (periodsTotal > 0) {
        expectedMaturityAmount = principal * Math.pow(1 + perRate, periodsTotal);
      }
    }
  }

  const interestPending = Math.max(0, totalInterestEarned - received);
  const outstandingPrincipal = principal; // principal is repaid at maturity in this model
  const totalReceivable = outstandingPrincipal + interestPending;

  return {
    monthlyInterest,
    totalInterestEarned,
    outstandingPrincipal,
    totalReceivable,
    expectedMaturityAmount,
    monthsElapsed,
    monthsTotal,
    interestPending,
  };
}
