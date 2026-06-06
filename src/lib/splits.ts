export type SplitInput = {
  userId: string;
  value?: number;
};

export type ComputedSplit = {
  userId: string;
  amount: number;
  splitValue?: number;
};

export type SplitMode = 'EQUAL' | 'UNEQUAL' | 'PERCENTAGE' | 'SHARE';

const ROUND_FACTOR = 100;

function roundMoney(n: number): number {
  return Math.round(n * ROUND_FACTOR) / ROUND_FACTOR;
}

function distributeRemainder(
  splits: ComputedSplit[],
  total: number,
  remainderUserId: string
): ComputedSplit[] {
  const sum = roundMoney(splits.reduce((acc, s) => acc + s.amount, 0));
  const diff = roundMoney(total - sum);
  if (diff === 0) return splits;

  return splits.map((s) =>
    s.userId === remainderUserId ? { ...s, amount: roundMoney(s.amount + diff) } : s
  );
}

export function computeEqualSplits(
  total: number,
  participants: string[],
  remainderUserId: string
): ComputedSplit[] {
  if (participants.length === 0) {
    throw new Error('At least one participant is required');
  }

  const perPerson = roundMoney(total / participants.length);
  const splits = participants.map((userId) => ({
    userId,
    amount: perPerson,
  }));

  return distributeRemainder(splits, total, remainderUserId);
}

export function computeUnequalSplits(
  total: number,
  inputs: SplitInput[]
): ComputedSplit[] {
  if (inputs.length === 0) {
    throw new Error('At least one split entry is required');
  }

  const splits = inputs.map((input) => {
    if (input.value === undefined || input.value < 0) {
      throw new Error('Each participant needs a non-negative amount');
    }
    return {
      userId: input.userId,
      amount: roundMoney(input.value),
      splitValue: input.value,
    };
  });

  const sum = roundMoney(splits.reduce((acc, s) => acc + s.amount, 0));
  if (Math.abs(sum - total) > 0.01) {
    throw new Error(`Unequal splits must sum to ${total}, got ${sum}`);
  }

  return splits;
}

export function computePercentageSplits(
  total: number,
  inputs: SplitInput[],
  remainderUserId: string
): ComputedSplit[] {
  if (inputs.length === 0) {
    throw new Error('At least one split entry is required');
  }

  const pctSum = inputs.reduce((acc, i) => acc + (i.value ?? 0), 0);
  if (Math.abs(pctSum - 100) > 0.01) {
    throw new Error(`Percentages must sum to 100, got ${pctSum}`);
  }

  const splits = inputs.map((input) => ({
    userId: input.userId,
    amount: roundMoney(total * ((input.value ?? 0) / 100)),
    splitValue: input.value,
  }));

  return distributeRemainder(splits, total, remainderUserId);
}

export function computeShareSplits(
  total: number,
  inputs: SplitInput[],
  remainderUserId: string
): ComputedSplit[] {
  if (inputs.length === 0) {
    throw new Error('At least one split entry is required');
  }

  const weights = inputs.map((i) => {
    if (i.value === undefined || i.value <= 0 || !Number.isInteger(i.value)) {
      throw new Error('Share values must be positive integers');
    }
    return i.value;
  });

  const weightSum = weights.reduce((a, b) => a + b, 0);
  const splits = inputs.map((input, idx) => ({
    userId: input.userId,
    amount: roundMoney(total * (weights[idx] / weightSum)),
    splitValue: weights[idx],
  }));

  return distributeRemainder(splits, total, remainderUserId);
}

export function computeSplits(
  mode: SplitMode,
  total: number,
  inputs: SplitInput[],
  payerId: string
): ComputedSplit[] {
  const participantIds =
    mode === 'EQUAL' ? inputs.map((i) => i.userId) : inputs.map((i) => i.userId);

  switch (mode) {
    case 'EQUAL':
      return computeEqualSplits(total, participantIds, payerId);
    case 'UNEQUAL':
      return computeUnequalSplits(total, inputs);
    case 'PERCENTAGE':
      return computePercentageSplits(total, inputs, payerId);
    case 'SHARE':
      return computeShareSplits(total, inputs, payerId);
    default:
      throw new Error(`Unknown split mode: ${mode}`);
  }
}
