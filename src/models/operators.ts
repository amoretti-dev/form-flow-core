import { RuleBuilder } from "../rule-builder";
import { FieldControlType } from "./field-definition";
/**
 * Base operators defined inside RuleBuilder.
 */
type RuleOperatorBase = keyof typeof RuleBuilder.value;

/**
 * Special operator that represents a field reference.
 */
type RuleOperatorSpecial = "var";

/**
 * Union of all operator keys supported by the system.
 */
export type RuleOperatorKey = RuleOperatorBase | RuleOperatorSpecial;

/**
 * Defines the kind of value an operator expects:
 * - "list": expects an array of values
 * - "single": expects a single value
 * - "none": no value required (boolean-like)
 * - "field": expects a reference to another field
 * - undefined: not specified
 */
export type RuleOperatorValueType =
  | "list"
  | "single"
  | "none"
  | "field"
  | undefined;

/**
 * Metadata for describing how an operator behaves.
 */
export interface RuleOperatorMeta {
  /** Label to display in the UI (can be customized by consumers). */
  label: string;

  /** Which field types this operator is allowed for. */
  allowedTypes?: FieldControlType[] | "all";

  /** The type of value this operator requires. */
  valueType?: RuleOperatorValueType;

  /** If true, the operator will be hidden from the UI picker. */
  hideFromPicker?: boolean;
}

/**
 * Default operator map shipped with `@form-flow/core`.
 * Consumers may override or extend this map at runtime.
 */
export const FORM_FLOW_OPERATORS_MAP:
  Partial<Record<RuleOperatorKey, RuleOperatorMeta>> = {
  eq: { label: 'Equals', allowedTypes: "all", valueType: "single" },
  neq: { label: 'Not equal to', allowedTypes: "all", valueType: "single" },
  gt: { label: 'Greater than', allowedTypes: ['number', 'date'], valueType: "single" },
  gte: { label: 'Greater than or equal to', allowedTypes: ['number', 'date'], valueType: "single" },
  lt: { label: 'Less than', allowedTypes: ['number', 'date'], valueType: "single" },
  lte: { label: 'Less than or equal to', allowedTypes: ['number', 'date'], valueType: "single" },
  in: { label: 'Is in', allowedTypes: "all", valueType: "list" },
  var: { label: 'Variable', allowedTypes: "all", valueType: "field", hideFromPicker: true },
  isEmpty: { label: 'Is empty', allowedTypes: "all", valueType: "none" },
  isNotEmpty: { label: 'Is not empty', allowedTypes: "all", valueType: "none" },
  isTrue: { label: 'Is true', allowedTypes: ['checkbox'], valueType: "none" },
  isFalse: { label: 'Is false', allowedTypes: ['checkbox'], valueType: "none" },
  contains: { label: 'Contains', allowedTypes: ['text'], valueType: "single" },
  startsWith: { label: 'Starts with', allowedTypes: ['text'], valueType: "single" },
  endsWith: { label: 'Ends with', allowedTypes: ['text'], valueType: "single" },
  dateAfter: { label: 'Date is after', allowedTypes: ['date'], valueType: "single" },
  dateBefore: { label: 'Date is before', allowedTypes: ['date'], valueType: "single" },
  lengthEquals: { label: 'Length equals', allowedTypes: ['text'], valueType: "single" },
  truthy: { label: 'Is truthy', allowedTypes: ['checkbox'], valueType: "none" },
};


