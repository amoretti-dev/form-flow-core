// operator-registry.ts
import { FORM_FLOW_OPERATORS_MAP, RuleOperatorKey, RuleOperatorMeta, RuleOperatorsMap } from "./operators";

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
};

