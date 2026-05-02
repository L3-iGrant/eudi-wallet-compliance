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
import { check as check_5_2_10_1_03, controlId as id_5_2_10_1_03 } from './eaa-5-2-10-1-03';
import { check as check_5_2_10_1_04, controlId as id_5_2_10_1_04 } from './eaa-5-2-10-1-04';
import { check as check_5_2_10_1_06, controlId as id_5_2_10_1_06 } from './eaa-5-2-10-1-06';
import { check as check_5_2_10_1_08, controlId as id_5_2_10_1_08 } from './eaa-5-2-10-1-08';
import { check as check_5_2_10_1_09, controlId as id_5_2_10_1_09 } from './eaa-5-2-10-1-09';
import { check as check_5_2_10_1_10, controlId as id_5_2_10_1_10 } from './eaa-5-2-10-1-10';
import { check as check_5_2_10_1_11, controlId as id_5_2_10_1_11 } from './eaa-5-2-10-1-11';
import { check as check_5_5_01, controlId as id_5_5_01 } from './eaa-5-5-01';
import { check as check_5_5_02, controlId as id_5_5_02 } from './eaa-5-5-02';
import { check as check_5_5_04, controlId as id_5_5_04 } from './eaa-5-5-04';
import { check as check_5_5_05, controlId as id_5_5_05 } from './eaa-5-5-05';
import { check as check_4_2_11_1_03, controlId as id_4_2_11_1_03 } from './eaa-4-2-11-1-03';
import { check as check_5_2_10_2_01, controlId as id_5_2_10_2_01 } from './eaa-5-2-10-2-01';
import { check as check_5_4_1_1_01, controlId as id_5_4_1_1_01 } from './eaa-5-4-1-1-01';
import { check as check_5_4_1_2_01, controlId as id_5_4_1_2_01 } from './eaa-5-4-1-2-01';
import { check as check_5_4_1_3_01, controlId as id_5_4_1_3_01 } from './eaa-5-4-1-3-01';
import { check as check_5_4_1_3_02, controlId as id_5_4_1_3_02 } from './eaa-5-4-1-3-02';
import { check as check_5_4_1_4_01, controlId as id_5_4_1_4_01 } from './eaa-5-4-1-4-01';
import { check as check_5_4_1_5_01, controlId as id_5_4_1_5_01 } from './eaa-5-4-1-5-01';
import { check as check_5_4_1_5_02, controlId as id_5_4_1_5_02 } from './eaa-5-4-1-5-02';
import { check as check_5_2_7_2_05, controlId as id_5_2_7_2_05 } from './eaa-5-2-7-2-05';
import { check as check_5_2_7_2_06, controlId as id_5_2_7_2_06 } from './eaa-5-2-7-2-06';
import { check as check_5_2_8_2_05, controlId as id_5_2_8_2_05 } from './eaa-5-2-8-2-05';
import { check as check_5_2_12_02, controlId as id_5_2_12_02 } from './eaa-5-2-12-02';
import { check as check_5_3_03, controlId as id_5_3_03 } from './eaa-5-3-03';
import { check as check_5_3_04, controlId as id_5_3_04 } from './eaa-5-3-04';
import { check as check_5_3_05, controlId as id_5_3_05 } from './eaa-5-3-05';
import { check as check_5_3_06, controlId as id_5_3_06 } from './eaa-5-3-06';
import { check as check_5_3_07, controlId as id_5_3_07 } from './eaa-5-3-07';

registerCheck(id_5_1_01, check_5_1_01);
registerCheck(id_5_2_1_2_01, check_5_2_1_2_01);
registerCheck(id_5_2_1_2_03, check_5_2_1_2_03);
registerCheck(id_5_2_4_1_03, check_5_2_4_1_03);
registerCheck(id_5_2_7_1_01, check_5_2_7_1_01);
registerCheck(id_5_2_7_1_03, check_5_2_7_1_03);
registerCheck(id_5_2_10_1_03, check_5_2_10_1_03);
registerCheck(id_5_2_10_1_04, check_5_2_10_1_04);
registerCheck(id_5_2_10_1_06, check_5_2_10_1_06);
registerCheck(id_5_2_10_1_08, check_5_2_10_1_08);
registerCheck(id_5_2_10_1_09, check_5_2_10_1_09);
registerCheck(id_5_2_10_1_10, check_5_2_10_1_10);
registerCheck(id_5_2_10_1_11, check_5_2_10_1_11);
registerCheck(id_5_5_01, check_5_5_01);
registerCheck(id_5_5_02, check_5_5_02);
registerCheck(id_5_5_04, check_5_5_04);
registerCheck(id_5_5_05, check_5_5_05);
registerCheck(id_4_2_11_1_03, check_4_2_11_1_03);
registerCheck(id_5_2_10_2_01, check_5_2_10_2_01);
registerCheck(id_5_4_1_1_01, check_5_4_1_1_01);
registerCheck(id_5_4_1_2_01, check_5_4_1_2_01);
registerCheck(id_5_4_1_3_01, check_5_4_1_3_01);
registerCheck(id_5_4_1_3_02, check_5_4_1_3_02);
registerCheck(id_5_4_1_4_01, check_5_4_1_4_01);
registerCheck(id_5_4_1_5_01, check_5_4_1_5_01);
registerCheck(id_5_4_1_5_02, check_5_4_1_5_02);
registerCheck(id_5_2_7_2_05, check_5_2_7_2_05);
registerCheck(id_5_2_7_2_06, check_5_2_7_2_06);
registerCheck(id_5_2_8_2_05, check_5_2_8_2_05);
registerCheck(id_5_2_12_02, check_5_2_12_02);
registerCheck(id_5_3_03, check_5_3_03);
registerCheck(id_5_3_04, check_5_3_04);
registerCheck(id_5_3_05, check_5_3_05);
registerCheck(id_5_3_06, check_5_3_06);
registerCheck(id_5_3_07, check_5_3_07);

/** Useful for introspection and tests. */
export const BUILTIN_CHECK_IDS: readonly string[] = [
  id_5_1_01,
  id_5_2_1_2_01,
  id_5_2_1_2_03,
  id_5_2_4_1_03,
  id_5_2_7_1_01,
  id_5_2_7_1_03,
  id_5_2_10_1_03,
  id_5_2_10_1_04,
  id_5_2_10_1_06,
  id_5_2_10_1_08,
  id_5_2_10_1_09,
  id_5_2_10_1_10,
  id_5_2_10_1_11,
  id_5_5_01,
  id_5_5_02,
  id_5_5_04,
  id_5_5_05,
  id_4_2_11_1_03,
  id_5_2_10_2_01,
  id_5_4_1_1_01,
  id_5_4_1_2_01,
  id_5_4_1_3_01,
  id_5_4_1_3_02,
  id_5_4_1_4_01,
  id_5_4_1_5_01,
  id_5_4_1_5_02,
  id_5_2_7_2_05,
  id_5_2_7_2_06,
  id_5_2_8_2_05,
  id_5_2_12_02,
  id_5_3_03,
  id_5_3_04,
  id_5_3_05,
  id_5_3_06,
  id_5_3_07,
];
