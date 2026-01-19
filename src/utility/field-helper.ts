import { FieldDefinition, ConditionalFieldProperty } from "@/models/field-definition";

export class FieldHelper {
    static getAvailableRuleTypes(field: FieldDefinition): ConditionalFieldProperty[] {
        var types: ConditionalFieldProperty[] = ["visibleIf", "disabledIf", "requiredIf", "readonlyIf"];
        return types.filter(k => field[k] == undefined);
    }
}