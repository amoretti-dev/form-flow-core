import { FieldRuleGroupDefinition } from './group';

export type FieldControlType = 'text' | 'number' | 'date' | 'singleSelect' | 'multipleSelect' | 'checkbox';
export type CustomFieldControlType<T extends string = never> =
  FieldControlType | Exclude<T, FieldControlType>;
export type ConditionalFieldProperty = "visibleIf" | "requiredIf" | "disabledIf" | "readonlyIf";

//TODO: valutare come esporre funzione per registrare tipi custom (e renderli disponibili nel FieldDefinition)
// const registerCustomTypes = (...types: string[]) => {
//   const newTypes = [types] as const;
//   type Valid = typeof newTypes[number];
// }

export type FieldListOption = {
  label: string;
  value: any;
} & Record<string, any>;

export interface BaseFieldDefinition<TControl extends FieldControlType = FieldControlType> {
  id: string;
  label: string;
  type: TControl;
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

export interface FieldDefinition<TControl extends FieldControlType = FieldControlType>
  extends BaseFieldDefinition<TControl> {
  defaultValue?: any;

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
export interface RuleContextFieldDefinition<TControl extends FieldControlType = FieldControlType>
  extends BaseFieldDefinition<TControl> {}


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
