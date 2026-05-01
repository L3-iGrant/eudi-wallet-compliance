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
import { check as check_5_2_4_1_03, controlId as id_5_2_4_1_03 } from './eaa-5-2-4-1-03';
import { check as check_5_2_7_1_01, controlId as id_5_2_7_1_01 } from './eaa-5-2-7-1-01';
import { check as check_5_2_7_1_03, controlId as id_5_2_7_1_03 } from './eaa-5-2-7-1-03';
import { check as check_5_2_10_1_04, controlId as id_5_2_10_1_04 } from './eaa-5-2-10-1-04';
import { check as check_5_5_01, controlId as id_5_5_01 } from './eaa-5-5-01';
import { check as check_5_5_02, controlId as id_5_5_02 } from './eaa-5-5-02';
import { check as check_4_2_11_1_03, controlId as id_4_2_11_1_03 } from './eaa-4-2-11-1-03';

registerCheck(id_5_1_01, check_5_1_01);
registerCheck(id_5_2_1_2_01, check_5_2_1_2_01);
registerCheck(id_5_2_1_2_03, check_5_2_1_2_03);
registerCheck(id_5_2_4_1_03, check_5_2_4_1_03);
registerCheck(id_5_2_7_1_01, check_5_2_7_1_01);
registerCheck(id_5_2_7_1_03, check_5_2_7_1_03);
registerCheck(id_5_2_10_1_04, check_5_2_10_1_04);
registerCheck(id_5_5_01, check_5_5_01);
registerCheck(id_5_5_02, check_5_5_02);
registerCheck(id_4_2_11_1_03, check_4_2_11_1_03);

/** Useful for introspection and tests. */
export const BUILTIN_CHECK_IDS: readonly string[] = [
  id_5_1_01,
  id_5_2_1_2_01,
  id_5_2_1_2_03,
  id_5_2_4_1_03,
  id_5_2_7_1_01,
  id_5_2_7_1_03,
  id_5_2_10_1_04,
  id_5_5_01,
  id_5_5_02,
  id_4_2_11_1_03,
];
