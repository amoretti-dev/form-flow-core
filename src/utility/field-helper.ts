import { FormFlow } from "../models/config";
import { FieldDefinition, ConditionalFieldProperty, FieldControlType } from "../models/field-definition";

export class FieldHelper {

    static getFieldById<TCustom extends string = never>(fields: FieldDefinition<TCustom>[], id: string) {
        return fields.find(f => f.id === id);
    }

    static getFieldIndex<TCustom extends string = never>(fields: FieldDefinition<TCustom>[], id: string) {
        return fields.findIndex(f => f.id === id);
    }

    static getAvailableRuleTypes(field: FieldDefinition): ConditionalFieldProperty[] {
        var types: ConditionalFieldProperty[] = ["visibleIf", "disabledIf", "requiredIf", "readonlyIf"];
        return types.filter(k => field[k] == undefined);
    }

    static getDefaultValue<TFieldType extends string = never>(fieldType: FieldControlType<TFieldType>) {
        return FormFlow.fieldTypes[fieldType].defaultValue;
    }

    static getPrimitive<TFieldType extends string = never>(fieldType: FieldControlType<TFieldType>) {
        return FormFlow.fieldTypes[fieldType].primitive;
    }
}