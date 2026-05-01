import type { StatusList, StatusValue } from './types';

/**
 * Read the status value at the given index in the bitstring. Bit 0 of the
 * stream is the MSB of byte 0; this matches the draft and the Token Status
 * List reference implementation.
 */
export function getStatusAt(list: StatusList, index: number): StatusValue {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError(`status index must be a non-negative integer, got ${index}`);
  }
  const { bitsPerStatus, statusListBits } = list;
  if (![1, 2, 4, 8].includes(bitsPerStatus)) {
    throw new RangeError(`bitsPerStatus must be 1, 2, 4, or 8 (got ${bitsPerStatus})`);
  }
  const totalBits = statusListBits.length * 8;
  const totalSlots = Math.floor(totalBits / bitsPerStatus);
  if (index >= totalSlots) {
    throw new RangeError(
      `status index ${index} is out of range; list holds ${totalSlots} entries`,
    );
  }
  const startBit = index * bitsPerStatus;
  const byteIndex = Math.floor(startBit / 8);
  const bitOffset = startBit % 8;
  const byte = statusListBits[byteIndex];
  if (byte === undefined) {
    throw new RangeError(`status index ${index} resolves to byte ${byteIndex} which is missing`);
  }
  const mask = (1 << bitsPerStatus) - 1;
  // Shift so the slot's high bit ends up at position (bitsPerStatus - 1).
  const shift = 8 - bitOffset - bitsPerStatus;
  return (byte >> shift) & mask;
}
