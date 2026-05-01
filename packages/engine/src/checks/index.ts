/**
 * Built-in conformance checks. Importing this module side-effect registers
 * every check below into the shared check registry, so consumers of
 * @iwc/engine pick them up automatically when they import runAssessment.
 *
 * Tests that need an empty registry can call `clearCheckRegistry()` from
 * ../registry between cases.
 */

import { registerCheck } from '../registry';
import { check as check_5_1_01, controlId as id_5_1_01 } from './eaa-5-1-01';
import { check as check_5_2_1_2_01, controlId as id_5_2_1_2_01 } from './eaa-5-2-1-2-01';
import { check as check_5_2_1_2_03, controlId as id_5_2_1_2_03 } from './eaa-5-2-1-2-03';
import { check as check_5_2_7_1_01, controlId as id_5_2_7_1_01 } from './eaa-5-2-7-1-01';
import { check as check_5_2_7_1_03, controlId as id_5_2_7_1_03 } from './eaa-5-2-7-1-03';

registerCheck(id_5_1_01, check_5_1_01);
registerCheck(id_5_2_1_2_01, check_5_2_1_2_01);
registerCheck(id_5_2_1_2_03, check_5_2_1_2_03);
registerCheck(id_5_2_7_1_01, check_5_2_7_1_01);
registerCheck(id_5_2_7_1_03, check_5_2_7_1_03);

/** Useful for introspection and tests. */
export const BUILTIN_CHECK_IDS: readonly string[] = [
  id_5_1_01,
  id_5_2_1_2_01,
  id_5_2_1_2_03,
  id_5_2_7_1_01,
  id_5_2_7_1_03,
];
