import { FieldControlType } from "../models/field-definition";
import {
  FieldPrimitive,
  PrimitiveDefaultValues,
} from "../models/field-definition";

const DEFAULT_PRIMITIVES: PrimitiveDefaultValues = {
  text: "",
  date: "",
  list: [],
  number: 0,
  boolean: false,
};

export class FormFlowPrimitivesHelper {
  private static _fieldTypeMapping = {
    text: "text",
    number: "number",
    date: "date",
    singleSelect: "text",
    multipleSelect: "list",
    checkbox: "boolean",
    radio: "text",
    slider: "number",
    switch: "boolean",
  } as const satisfies Record<FieldControlType, FieldPrimitive>;

  private static _defaultValues: PrimitiveDefaultValues = {
    ...DEFAULT_PRIMITIVES,
  };

  static get() {
    return this._defaultValues;
  }

  static init(defaultValues: Partial<PrimitiveDefaultValues>) {
    this._defaultValues = { ...this._defaultValues, ...defaultValues };
  }

  static reset() {
    this._defaultValues = { ...DEFAULT_PRIMITIVES };
  }
  static getFieldTypePrimitive(fieldType: FieldControlType) {
    return this._fieldTypeMapping[fieldType];
  }

  static getFieldTypeDefaultValue(fieldType: FieldControlType) {
    return this._defaultValues[this.getFieldTypePrimitive(fieldType)];
  }
}
