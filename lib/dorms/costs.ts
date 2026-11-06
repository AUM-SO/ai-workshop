// Money helpers shared by the owner forms and, later, the tenant's move-in cost calculator.

export interface OtherFee {
  label: string;
  amount: number;
  monthly: boolean;
}

export interface RoomTypeCosts {
  monthly_price: number;
  deposit: number;
  advance_months: number;
  other_fees: OtherFee[];
}

/** What a tenant pays on move-in day: rent in advance, the deposit and one-off fees. */
export function moveInTotal(costs: RoomTypeCosts) {
  const oneOff = costs.other_fees.filter((f) => !f.monthly).reduce((sum, f) => sum + f.amount, 0);
  return costs.monthly_price * costs.advance_months + costs.deposit + oneOff;
}

/** Rent plus fixed monthly fees (water and electricity depend on use, so they are not included). */
export function fixedMonthly(costs: RoomTypeCosts) {
  return costs.monthly_price + costs.other_fees.filter((f) => f.monthly).reduce((sum, f) => sum + f.amount, 0);
}

const bahtFormat = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
export const baht = (value: number) => bahtFormat.format(value);

/** Narrows the jsonb column to typed fees, dropping anything malformed. */
export function parseOtherFees(value: unknown): OtherFee[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { label, amount, monthly } = item as Record<string, unknown>;
    return typeof label === "string" && typeof amount === "number"
      ? [{ label, amount, monthly: Boolean(monthly) }]
      : [];
  });
}

export interface UtilityRates {
  water_rate: number | null;
  water_flat: number | null;
  electric_rate: number | null;
}

/** Thailand's provincial electricity rate, roughly, for dorms that bill at cost. */
export const UTILITY_ELECTRIC_FALLBACK = 4.5;

/** Estimated monthly bill: rent, fixed monthly fees, water and electricity for the given usage. */
export function monthlyEstimate(costs: RoomTypeCosts & UtilityRates, waterUnits: number, electricUnits: number) {
  const water = costs.water_flat ?? (costs.water_rate ?? 0) * waterUnits;
  const electric = (costs.electric_rate ?? UTILITY_ELECTRIC_FALLBACK) * electricUnits;
  return { fixed: fixedMonthly(costs), water, electric, total: fixedMonthly(costs) + water + electric };
}
