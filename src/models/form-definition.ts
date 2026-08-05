import {
  FieldDefinition,
  RuleContextFieldDefinition,
} from "./field-definition";

export type FormFlowValues = Record<string, any>;

export interface FormFlowDefinition {
  formId: string;
  fields: FieldDefinition[];
  ruleContextFields?: RuleContextFieldDefinition[];
  metadata?: Record<string, any>;
  fieldGroups?: FormFlowFieldGroup[];
}

export type FormFlowFieldGroup = {
  id: string;
  label: string;
  fieldIds: string[];
};

export interface FormFlowSchema {
  definition: FormFlowDefinition;
  getValues: () => FormFlowValues;
  getFieldValue: (fieldId: keyof FormFlowValues) => any;
  setValues: (values: FormFlowValues, emit?: boolean) => void;
  setFieldValue: (
    fieldId: keyof FormFlowValues,
    value: any,
    emit?: boolean,
  ) => void;
  readonly values: FormFlowValues;
}
