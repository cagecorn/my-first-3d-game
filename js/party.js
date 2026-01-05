export class Party {
    constructor() {
        this.members = [];
        this.maxSize = 4;
        this.gold = 0;
        this.inventory = [];
    }

    addMember(character) {
        if (this.members.length < this.maxSize) {
            this.members.push(character);
            return true;
        }
        return false;
    }

    removeMember(index) {
        if (index >= 0 && index < this.members.length) {
            this.members.splice(index, 1);
        }
    }

    getAliveMembers() {
        return this.members.filter(m => m.isAlive());
    }

    getAverageLevel() {
        if (this.members.length === 0) return 1;
        const sum = this.members.reduce((acc, m) => acc + m.level, 0);
        return Math.floor(sum / this.members.length);
    }

    isWipedOut() {
        return this.getAliveMembers().length === 0;
    }

    addItem(item) {
        this.inventory.push(item);
        // Maybe sort inventory?
    }

    removeItem(item) {
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
            return true;
        }
        return false;
    }
}
