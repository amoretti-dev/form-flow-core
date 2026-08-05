import { FieldRuleGroupDefinition } from "./group";

export type FieldControlType =
  | "text"
  | "number"
  | "date"
  | "singleSelect"
  | "multipleSelect"
  | "checkbox"
  | "switch"
  | "slider"
  | "radio";

export const conditionalFieldPropertiesArray: ConditionalFieldProperty[] = [
  "visibleIf",
  "requiredIf",
  "disabledIf",
  "readonlyIf",
];
export type ConditionalFieldProperty =
  | "visibleIf"
  | "requiredIf"
  | "disabledIf"
  | "readonlyIf";

export type FieldListOption = {
  label: string;
  value: any;
} & Record<string, any>;

export interface BaseFieldDefinition {
  id: string;
  label: string;
  type: FieldControlType;
  metadata?: Record<string, any>;

  /**
   * List of available options for fields like select, checkbox, or radio buttons.
   *
   * The base shape is defined by `FieldOption`, which requires:
   * - `label`: the text displayed to the user
   * - `value`: the actual value stored/submitted
   *
   * The `FieldOption` type is **not exported**, but consumers can still conform
   * to its shape using `satisfies` to ensure compatibility while extending it
   * with additional UI-related metadata (e.g. icons, images, tooltips).
   *
   * @example
   *
   * ```tsx
   * const options = [
   *   { label: "Startup", value: "startup", icon: "🚀" },
   *   { label: "Agency", value: "agency", icon: "🏢" },
   *   { label: "Freelancer", value: "freelancer", icon: "🧑‍💻" }
   * ] satisfies FieldOption[];
   * ```
   */
  options?: FieldListOption[];
}

export interface FieldDefinition extends BaseFieldDefinition {
  // Optional logic-based rules
  visibleIf?: FieldRuleGroupDefinition;
  requiredIf?: FieldRuleGroupDefinition;
  disabledIf?: FieldRuleGroupDefinition;
  readonlyIf?: FieldRuleGroupDefinition;
}

/**
 * Source-only field made available to rule builders and dependency tracking.
 * It can be referenced inside conditions, but it is never evaluated as a target
 * control state by the core runtime.
 */
export interface RuleContextFieldDefinition extends BaseFieldDefinition {}

/**
 * Represent target field after conditional rules evaluation
 */
export interface FieldControlState {
  visible: boolean;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
}

export type FormControlState = Record<string, FieldControlState>;
export type FieldPrimitive = "text" | "date" | "list" | "number" | "boolean";

export type PrimitiveDefaultValues = {
  text: string;
  date: string;
  list: string[];
  number: number;
  boolean: boolean;
};
