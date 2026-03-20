import { CustomFieldControlType, FieldDefinition, RuleContextFieldDefinition } from "./field-definition";

export type FormFlowValues = Record<string, any>;

export interface FormFlowDefinition<TCustom extends string = never> {
    formId: string;
    fields: FieldDefinition<TCustom>[];
    ruleContextFields?: RuleContextFieldDefinition<TCustom>[];
    metadata?: Record<string, any>;
}

export interface FormFlowSchema<TCustom extends string = never> {
    definition: FormFlowDefinition<TCustom>
    getValues: () => FormFlowValues;
    getFieldValue: (fieldId: keyof FormFlowValues) => any;
    setValues: (values: FormFlowValues, emit?: boolean) => void;
    setFieldValue: (fieldId: keyof FormFlowValues, value: any, emit?: boolean) => void;
    readonly values: FormFlowValues;
}
