import 'jest-extended';
import 'jest-extended/all';

export const expectToBeDateCloseToNow = (dateDifferenceToleranceInMs = 1000) =>
  expect.toSatisfy((s) => Date.now() - new Date(s).getTime() < dateDifferenceToleranceInMs);
