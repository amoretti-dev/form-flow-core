import { RulesLogic } from "json-logic-js";
import { RuleBuilder } from "./rule-builder"; // Il tuo codice esistente

// Interfaccia per i metodi di condizione
interface ConditionMethods {
    eq(value: any): RuleChain;
    neq(value: any): RuleChain;
    gt(value: any): RuleChain;
    gte(value: any): RuleChain;
    lt(value: any): RuleChain;
    lte(value: any): RuleChain;
    in(array: any[]): RuleChain;
    isEmpty(): RuleChain;
    isNotEmpty(): RuleChain;
    isTrue(): RuleChain;
    isFalse(): RuleChain;
    startsWith(prefix: string): RuleChain;
    contains(value: string): RuleChain;
    endsWith(suffix: string): RuleChain;
    dateAfter(date: string): RuleChain;
    dateBefore(date: string): RuleChain;
    lengthEquals(length: number): RuleChain;
    truthy(): RuleChain;
}

// Interfaccia per i metodi di chain
interface ChainMethods {
    and(field: string): ConditionMethods;
    or(field: string): ConditionMethods;
    build(): RulesLogic;
}

// Tipo che combina condizioni e chain
type RuleChain = ConditionMethods & ChainMethods;

class RuleCondition implements RuleChain {
    private rules: RulesLogic[] = [];
    private currentOperator: 'and' | 'or' = 'and';

    constructor(private field: string) { }

    // Metodi di condizione
    eq(value: any): RuleChain {
        this.rules.push(RuleBuilder.value.eq(this.field, value));
        return this;
    }

    neq(value: any): RuleChain {
        this.rules.push(RuleBuilder.value.neq(this.field, value));
        return this;
    }

    gt(value: any): RuleChain {
        this.rules.push(RuleBuilder.value.gt(this.field, value));
        return this;
    }

    gte(value: any): RuleChain {
        this.rules.push(RuleBuilder.value.gte(this.field, value));
        return this;
    }

    lt(value: any): RuleChain {
        this.rules.push(RuleBuilder.value.lt(this.field, value));
        return this;
    }

    lte(value: any): RuleChain {
        this.rules.push(RuleBuilder.value.lte(this.field, value));
        return this;
    }

    in(array: any[]): RuleChain {
        this.rules.push(RuleBuilder.value.in(this.field, array));
        return this;
    }

    isEmpty(): RuleChain {
        this.rules.push(RuleBuilder.value.isEmpty(this.field));
        return this;
    }

    isNotEmpty(): RuleChain {
        this.rules.push(RuleBuilder.value.isNotEmpty(this.field));
        return this;
    }

    isTrue(): RuleChain {
        this.rules.push(RuleBuilder.value.isTrue(this.field));
        return this;
    }

    isFalse(): RuleChain {
        this.rules.push(RuleBuilder.value.isFalse(this.field));
        return this;
    }

    startsWith(prefix: string): RuleChain {
        this.rules.push(RuleBuilder.value.startsWith(this.field, prefix));
        return this;
    }

    contains(value: string): RuleChain {
        this.rules.push(RuleBuilder.value.contains(this.field, value));
        return this;
    }

    endsWith(suffix: string): RuleChain {
        this.rules.push(RuleBuilder.value.endsWith(this.field, suffix));
        return this;
    }

    dateAfter(date: string): RuleChain {
        this.rules.push(RuleBuilder.value.dateAfter(this.field, date));
        return this;
    }

    dateBefore(date: string): RuleChain {
        this.rules.push(RuleBuilder.value.dateBefore(this.field, date));
        return this;
    }

    lengthEquals(length: number): RuleChain {
        this.rules.push(RuleBuilder.value.lengthEquals(this.field, length));
        return this;
    }

    truthy(): RuleChain {
        this.rules.push(RuleBuilder.value.truthy(this.field));
        return this;
    }

    // Metodi di chain
    and(field: string): ConditionMethods {
        this.currentOperator = 'and';
        return new RuleCondition(field).copyState(this);
    }

    or(field: string): ConditionMethods {
        this.currentOperator = 'or';
        return new RuleCondition(field).copyState(this);
    }

    build(): RulesLogic {
        if (this.rules.length === 1) {
            return this.rules[0];
        }

        if (this.currentOperator === 'and') {
            return RuleBuilder.group.and(...this.rules);
        } else {
            return RuleBuilder.group.or(...this.rules);
        }
    }

    private copyState(other: RuleCondition): this {
        this.rules = [...other.rules];
        this.currentOperator = other.currentOperator;
        return this;
    }
}

// Classe principale per iniziare la costruzione di regole
export class Rule {
    static when(field: string): ConditionMethods {
        return new RuleCondition(field);
    }
}

// Builder per gruppi di regole
export class RuleGroupBuilder {
    private rules: RulesLogic[] = [];

    constructor(private operator: 'and' | 'or' = 'and') { }

    static and() {
        return new RuleGroupBuilder("and");
    }

    static or() {
        return new RuleGroupBuilder("or");
    }

    add(rule: RulesLogic): this {
        this.rules.push(rule);
        return this;
    }

    addRule(builder: (rule: typeof Rule) => RulesLogic): this {
        this.rules.push(builder(Rule));
        return this;
    }

    addGroup(group: RulesLogic): this {
        this.rules.push(group);
        return this;
    }

    addWhen(field: string): ConditionMethods & {
        then: (condition: RulesLogic) => RuleGroupBuilder
    } {
        const condition = Rule.when(field) as any;
        condition.then = (rule: RulesLogic) => {
            this.rules.push(rule);
            return this;
        };
        return condition;
    }

    build(): RulesLogic {
        if (this.rules.length === 0) {
            throw new Error("Cannot build empty rule group");
        }

        if (this.rules.length === 1) {
            return this.rules[0];
        }

        if (this.operator === 'and') {
            return RuleBuilder.group.and(...this.rules);
        } else {
            return RuleBuilder.group.or(...this.rules);
        }
    }
}

// // Esempi di utilizzo:

// // Esempio 1: Regola semplice
// const simpleRule = Rule.when("age").gte(18).build();

// // Esempio 2: Regola con AND
// const andRule = Rule.when("age").gte(18).and("email").isNotEmpty().build();

// // Esempio 3: Regola con OR
// const orRule = Rule.when("email").isNotEmpty().or("phone").isNotEmpty().build();

// // Esempio 4: Gruppo di regole
// const group1 = RuleGroupBuilder.and()
//     .add(Rule.when("age").gte(18).build())
//     .addGroup(
//         new RuleGroupBuilder("or")
//             .add(Rule.when("email").isNotEmpty().build())
//             .add(Rule.when("phone").isNotEmpty().build())
//             .build()
//     )
//     .build();

// // Esempio 5: Utilizzo alternativo con addRule
// const group2 = new RuleGroupBuilder("and")
//     .addRule(Rule => Rule.when("age").gte(18).build())
//     .addRule(Rule => Rule.when("status").eq("active").build())
//     .build();

// // Esempio 6: Regole complesse
// const complexRule = Rule.when("user.role").eq("admin")
//     .or("user.permissions").contains("read")
//     .and("user.status").eq("active")
//     .and("user.lastLogin").dateAfter("2024-01-01")
//     .build();

// console.log("Simple rule:", JSON.stringify(simpleRule, null, 2));
// console.log("AND rule:", JSON.stringify(andRule, null, 2));
// console.log("OR rule:", JSON.stringify(orRule, null, 2));
// console.log("Group 1:", JSON.stringify(group1, null, 2));
// console.log("Complex rule:", JSON.stringify(complexRule, null, 2));