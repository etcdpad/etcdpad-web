import { EventEmitter } from 'events'

export class TransStream<T> extends EventEmitter {
    private pool: T[] = []
    private reader?: (item?: T) => (void | Promise<void>)
    private cloesd = false
    constructor() {
        super()
        this.on('close', () => this.close())
    }
    public close() {
        this.cloesd = true
        this.emit('close')
        if (this.reader)
            this.reader = undefined
    }
    public write(item: T) {
        if (this.cloesd) return
        if (this.reader) {
            this.reader(item)
            return
        }
        this.pool.push(item)
    }
    public addReader(reader: (item?: T) => (void | Promise<void>)) {
        if (this.cloesd) {
            throw new Error('can not read closed stream')
        }
        if (this.reader) {
            throw new Error('can not read once')
        }
        (async () => {
            while (this.pool.length) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                await reader(this.pool.shift()!)
            }
            this.reader = reader
        })()
    }
}
