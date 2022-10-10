import { ASCII_ALPHABET_POSITION, DECIMAL_BASE } from 'common/constants';

export interface iVec2 {
    x: number;
    y: number;
}

export class Vec2 implements iVec2 {
    constructor(public x: number, public y: number) {}

    equals(b: iVec2): boolean {
        return this.x === b.x && this.y === b.y;
    }

    add(b: iVec2): Vec2 {
        return new Vec2(this.x + b.x, this.y + b.y);
    }

    sub(b: iVec2): Vec2 {
        return new Vec2(this.x - b.x, this.y - b.y);
    }

    mul(n: number): Vec2 {
        return new Vec2(this.x * n, this.y * n);
    }

    dot(v: iVec2): number {
        return this.x * v.x + this.y * v.y;
    }

    flip() {
        return new Vec2(this.y, this.x);
    }

    copy(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    toInterface(): iVec2 {
        return { x: this.x, y: this.y };
    }
}

export const boardPositionToVec2 = (position: string): Vec2 => {
    return new Vec2(parseInt(position.substring(1), DECIMAL_BASE) - 1, position.slice(0).charCodeAt(0) - ASCII_ALPHABET_POSITION);
};

export const vec2ToBoardPosition = (v: Vec2): string => {
    return String.fromCharCode(v.x + ASCII_ALPHABET_POSITION) + (v.y + 1).toString();
};
