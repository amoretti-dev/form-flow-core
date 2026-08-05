import { FormFlowPrimitivesHelper } from "@/utility/primitives-helper";
import {
  FieldDefinition,
  ConditionalFieldProperty,
  FieldControlType,
} from "../models/field-definition";

export class FieldHelper {
  static getFieldById(fields: FieldDefinition[], id: string) {
    return fields.find((f) => f.id === id);
  }

  static getFieldIndex(fields: FieldDefinition[], id: string) {
    return fields.findIndex((f) => f.id === id);
  }

  static getAvailableRuleTypes(
    field: FieldDefinition,
  ): ConditionalFieldProperty[] {
    var types: ConditionalFieldProperty[] = [
      "visibleIf",
      "disabledIf",
      "requiredIf",
      "readonlyIf",
    ];
    return types.filter((k) => field[k] == undefined);
  }
}
