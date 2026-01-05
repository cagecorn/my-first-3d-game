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

    isWipedOut() {
        return this.getAliveMembers().length === 0;
    }
}
