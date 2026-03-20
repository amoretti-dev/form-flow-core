// operator-registry.ts
import { FieldControlType } from "./field-definition";
import { FORM_FLOW_OPERATORS_MAP, RuleOperatorKey, RuleOperatorMeta, RuleOperatorMetaPatch, RuleOperatorPatches, RuleOperatorsMap } from "./operators";

// Mutable copy of the original operator map
let registry: RuleOperatorsMap<string> = { ...FORM_FLOW_OPERATORS_MAP };

export const OperatorRegistry = {
    /**
     * Get the definition of a specific operator by key.
     */
    get: <TCustom extends string = never>(key: RuleOperatorKey): RuleOperatorMeta<TCustom> | undefined => registry[key] as RuleOperatorMeta<TCustom>,

    /**
     * Get all operator definitions (e.g., for building UI pickers).
     */
    getAll: <TCustom extends string = never>(): RuleOperatorsMap<TCustom> => registry as RuleOperatorsMap<TCustom>,

    /**
     * Register one or more operator overrides or additions.
     * Existing operators with the same key will be replaced.
     */
    register: <TCustom extends string = never>(overrides: RuleOperatorsMap<TCustom>) => {
        registry = { ...registry, ...overrides };
    },

    /**
     * Reset the registry to the original default operator map.
     */
    reset: () => {
        registry = { ...FORM_FLOW_OPERATORS_MAP };
    },
    /**
     * Use this for override existing operators even partially.
     * @example OperatorRegistry.patch({
                    eq: { hideFromPicker: true },
                    neq: { hideFromPicker: true },
                });
     */
    patch: <TCustom extends string = never>(overrides: RuleOperatorPatches<TCustom>) => {
        const next = { ...registry };

        for (const [key, patch] of Object.entries(overrides) as [
            RuleOperatorKey,
            RuleOperatorMetaPatch<TCustom>,
        ][]) {
            const current = next[key];

            if (!current) {
                throw new Error(`Cannot patch unknown operator "${key}". Use register() instead.`);
            }

            next[key] = {
                ...current,
                ...patch,
            };
        }

        registry = next;
    },

    /**
     * Helper for easily exclude a `fieldType` from multiple operators
     * @example OperatorRegistry.excludeFieldTypes(["switch"], ["isTrue", "isFalse", "truthy"]);
     */
    excludeFieldTypes: <TCustom extends string = never>(
        fieldTypes: FieldControlType<TCustom>[],
        operators: RuleOperatorKey[],
    ) => {
        const next = { ...registry };

        for (const key of operators) {
            const current = next[key];
            if (!current) continue;

            next[key] = {
                ...current,
                disallowedTypes: [
                    ...(current.disallowedTypes ?? []),
                    ...fieldTypes,
                ],
            };
        }

        registry = next;
    },

};

