export class Item {
    constructor(name, type, value, description) {
        this.name = name;
        this.type = type; // 'weapon', 'armor', 'potion', 'misc'
        this.value = value; // Atk power, Def power, Heal amount, or Gold value
        this.description = description;
    }
}
