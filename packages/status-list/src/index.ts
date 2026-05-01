export type {
  StatusList,
  StatusListFormat,
  StatusValue,
  VerificationResult,
} from './types';
export { STATUS_VALID, STATUS_INVALID, STATUS_SUSPENDED } from './types';
export { fetchStatusList } from './fetch';
export { getStatusAt } from './lookup';
export { verifyStatusList } from './verify';

export const packageName = '@iwc/status-list';
