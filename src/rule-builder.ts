import { add_operation, RulesLogic } from "json-logic-js"

const startsWith = (text: string, prefix: string) => text.startsWith(prefix);
const endsWith = (text: string, suffix: string) => text.endsWith(suffix);

add_operation("startsWith", startsWith);
add_operation("endsWith", endsWith);


export class RuleBuilder {
    static group = {
        and: (...args: RulesLogic[]): RulesLogic => ({ and: args }),
        or: (...args: RulesLogic[]): RulesLogic => ({ or: args }),
        not: (arg: RulesLogic): RulesLogic => ({ '!': arg }),
    }

    static value = {
        // Variabili
        var: (key: string): RulesLogic => ({ var: key }),

        // Condizioni base
        eq: (key: string, b: any): RulesLogic => ({ '===': [{ var: key }, b] }),
        neq: (key: string, b: any): RulesLogic => ({ '!==': [{ var: key }, b] }),
        gt: (key: string, b: any): RulesLogic => ({ '>': [{ var: key }, b] }),
        gte: (key: string, b: any): RulesLogic => ({ '>=': [{ var: key }, b] }),
        lt: (key: string, b: any): RulesLogic => ({ '<': [{ var: key }, b] }),
        lte: (key: string, b: any): RulesLogic => ({ '<=': [{ var: key }, b] }),

        // Array
        in: (key: string, array: any[]): RulesLogic => ({ in: [{ var: key }, array] }),
        lengthEquals: (key: string, length: number): RulesLogic => ({
            '===': [{ 'var': key + '.length' }, length]
        }),

        // Valori
        isEmpty: (key: string): RulesLogic => ({
            or: [
                { '==': [{ var: key }, null] },
                { '==': [{ var: key }, undefined] },
                { '==': [{ var: key }, ''] }
            ]
        }),
        isNotEmpty: (key: string): RulesLogic => ({
            and: [
                { '!==': [{ var: key }, null] },
                { '!==': [{ var: key }, undefined] },
                { '!==': [{ var: key }, ''] }
            ]
        }),

        isTrue: (key: string): RulesLogic => ({ '===': [{ var: key }, true] }),
        isFalse: (key: string): RulesLogic => ({ '===': [{ var: key }, false] }),

        // Stringhe
        startsWith: (key: string, prefix: string): RulesLogic => ({
            'startsWith': [{ var: key }, prefix]
        } as any),
        contains: (key: string, value: string): RulesLogic => ({
            in: [value, { var: key }]
        }),
        endsWith: (key: string, suffix: string): RulesLogic => ({
            'endsWith': [{ var: key }, suffix]
        } as any),

        // Date (richiede valori ISO o timestamp)
        /// <param @date>
        /// ISO / timestamp format
        /// </param>
        dateAfter: (key: string, date: string): RulesLogic => ({
            '>': [{ var: key }, date]
        }),
        /// <param @date>
        /// ISO / timestamp format
        /// </param>
        dateBefore: (key: string, date: string): RulesLogic => ({
            '<': [{ var: key }, date]
        }),

        // Alias
        truthy: (key: string): RulesLogic => ({ var: key }),
    }
}