import { CustomFieldControlType, FieldDefinition, RuleContextFieldDefinition } from "./field-definition";

export type FormFlowValues = Record<string, any>;

export interface FormFlowDefinition
    <TControl extends CustomFieldControlType = CustomFieldControlType> {
    formId: string;
    fields: FieldDefinition<TControl>[];
    ruleContextFields?: RuleContextFieldDefinition<TControl>[];
    metadata?: Record<string, any>;
}

export interface FormFlowSchema<TControl extends CustomFieldControlType = CustomFieldControlType> {
    definition: FormFlowDefinition<TControl>
    getValues: () => FormFlowValues;
    getFieldValue: (fieldId: keyof FormFlowValues) => any;
    setValues: (values: FormFlowValues, emit?: boolean) => void;
    setFieldValue: (fieldId: keyof FormFlowValues, value: any, emit?: boolean) => void;
    readonly values: FormFlowValues;
}
