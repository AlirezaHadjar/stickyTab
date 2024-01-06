export const sigmoid = (x: number) => {
  "worklet";
  return 1 / (1 + Math.exp(-10 * (x - 0.5)));
};

export const clamp = (
  value: number,
  lowerBound: number,
  upperBound: number
) => {
  "worklet";
  return Math.max(Math.min(value, upperBound), lowerBound);
};
