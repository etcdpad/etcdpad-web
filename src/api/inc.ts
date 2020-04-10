export class IncGen {
    private i = 0
    public get id(): number {
        if (++this.i > Number.MAX_SAFE_INTEGER) {
            this.i = 0
        }
        return this.i
    }
}
