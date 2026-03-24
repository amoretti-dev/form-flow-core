import { BuiltInPrimitivesValues, FieldControlType } from "./field-definition";

type TextField = {
    primitive: "text" | "date" | "list",
    defaultValue: string | string[] | null | undefined;
}

type NumberField = {
    primitive: "number",
    defaultValue: number;
}

type BooleanField = {
    primitive: "boolean",
    defaultValue: boolean;
}

type FieldConfigTypes = TextField | NumberField | BooleanField;
type FieldTypes<TFieldType extends string = never> = Record<FieldControlType<TFieldType>, FieldConfigTypes>;
type FormFlowConfig<TFieldType extends string = never> = {
    fieldTypes: FieldTypes<TFieldType>;
}

export class FormFlow {
    private static config: FormFlowConfig<string> = {
        fieldTypes: {
            text: { primitive: "text", defaultValue: "" },
            number: { primitive: "number", defaultValue: 0 },
            date: { primitive: "date", defaultValue: "" },
            singleSelect: { primitive: "text", defaultValue: [] },
            multipleSelect: { primitive: "list", defaultValue: [] },
            checkbox: { primitive: "boolean", defaultValue: false },
            radio: { primitive: "text", defaultValue: [] },
            slider: { primitive: "number", defaultValue: 0 },
            switch: { primitive: "boolean", defaultValue: false },
        },
    };

    static get fieldTypes() {
        return { ...this.config.fieldTypes };
    }
    /***
     * @param fieldTypes The custom field types you want to use with your application. Notice that you CAN'T override built in fieldtypes.
     * 
     */
    static configure<TFieldType extends string = never>(
        fieldTypes: FieldTypes<TFieldType>,
    ) {
        this.config.fieldTypes = { ...fieldTypes, ...this.config.fieldTypes };
    }
}
