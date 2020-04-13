import { EventEmitter } from 'events'
import { Channel, ChannelState } from 'node-channel'
import { CommunicateResponse, CommunicateMessage, MessageType, CommunicateSuccessResponse, KeyValue, EtcdEvent, EtcdCreateEvent, EtcdDeleteEvent, EtcdQueryEvent, ResponseHeader, EtcdPrefixQueryEvent, CommunicateWatchEventResponse, isCommunicateWatchEventResponse, EtcdUpdateEvent, KeyOnly } from '@/spec'
import { IncGen } from './inc'
import { decode } from '@/utils/base64'

function calcEndkey(key: string): string {
    if (key === '\x00' || key.length === 0) return '\x00'
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return key.slice(0, -1) + String.fromCodePoint(key.codePointAt(key.length - 1)! + 1)
}


function waitAsync(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms)
    })
}

export enum EtcdPadEvent {
    Open,
    Reconnect,
    Close,
    Error,
    Data,
}

export class EtcdPad extends EventEmitter {
    public endpoint: string
    public backendUrl: string
    public timeout: number
    private ws: WebSocket
    private timer = 0
    private idGen = new IncGen()
    constructor(backend: string, endpoint: string, timeout = 2000) {
        super()
        this.backendUrl = backend
        this.endpoint = endpoint
        this.timeout = timeout
        // etcd://[username:password@]host1:port1[,...hostN:portN][/[defaultPrefix][?options]]
        this.ws = new WebSocket(this.backendUrl+ '?dsn='+ encodeURIComponent(endpoint))
        this.ws.addEventListener('open', () => this.emit(EtcdPadEvent.Open))
        this.prepare()
    }
    private prepare() {
        this.ws.addEventListener('message', (message) => this.dispatch(message.data))
        this.ws.addEventListener('close', () => this.reconnect())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.ws.addEventListener('error', (error) => this.iemit(EtcdPadEvent.Error, error as any))
        this.timer = setInterval(() => this.pingpong(), 30 * 1000)
    }
    private async reconnect() {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = 0
        }
        await waitAsync(2000)
        this.ws = new WebSocket(this.backendUrl+ '?dsn='+ encodeURIComponent(this.endpoint))
        this.ws.addEventListener('open', () => this.emit(EtcdPadEvent.Reconnect))
        this.prepare()
    }
    private dispatch(rawMessage: string) {
        let message: CommunicateResponse
        try {
            message = JSON.parse(rawMessage)
        } catch (error) {
        // eslint-disable-next-line no-console
            console.error('json parse error. raw:', rawMessage)
            return
        }
        switch (message.action) {
            case MessageType.Create:
            case MessageType.Query:
            case MessageType.Delete:
                this.emit(`${message.action}:${message.id}`, message)
                break
            case MessageType.Watch:
                if (isCommunicateWatchEventResponse(message)) {
                    this.handleChange(message)
                }
                break
            case MessageType.Ping:
                this.pingpong(MessageType.Pong)
                break
            case MessageType.HandShake:
            case MessageType.Pong:
            default:
                break
        }
    }
    private handleChange(message: CommunicateWatchEventResponse) {
        if (!message.success) return
        if (message.action !== MessageType.Watch) return
        this.iemit(EtcdPadEvent.Data, message.event)
    }
    private innerSend(message: CommunicateMessage): Error | undefined {
        if (this.ws.readyState !== this.ws.OPEN) {
            return new Error('connect not ready yet.')
        }
        this.ws.send(JSON.stringify(message))
    }
    private iemit(type: EtcdPadEvent.Close): void
    private iemit(type: EtcdPadEvent.Reconnect): void
    private iemit(type: EtcdPadEvent.Open): void
    private iemit(type: EtcdPadEvent.Error, error: Error): void
    private iemit(type: EtcdPadEvent.Data, data: EtcdCreateEvent | EtcdDeleteEvent | EtcdUpdateEvent): void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private iemit(type: EtcdPadEvent, ...args: any[]): void {
        super.emit(type, ...args)
    }
    public on(type: EtcdPadEvent.Close, listener: () => void): this
    public on(type: EtcdPadEvent.Reconnect, listener: () => void): this
    public on(type: EtcdPadEvent.Open, listener: () => void): this
    public on(type: EtcdPadEvent.Error, listener: (error: Error) => void): this
    public on(type: EtcdPadEvent.Data, listener: (data: EtcdCreateEvent | EtcdDeleteEvent | EtcdUpdateEvent) => void): this
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public on(type: EtcdPadEvent, listener: (...args: any[]) => void): this {
        super.on(type, listener)
        return this
    }
    public once(type: EtcdPadEvent.Close, listener: () => void): this
    public once(type: EtcdPadEvent.Reconnect, listener: () => void): this
    public once(type: EtcdPadEvent.Open, listener: () => void): this
    public once(type: EtcdPadEvent.Error, listener: (error: Error) => void): this
    public once(type: EtcdPadEvent.Data, listener: (data: EtcdCreateEvent | EtcdDeleteEvent | EtcdUpdateEvent) => void): this
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public once(type: EtcdPadEvent, listener: (...args: any[]) => void): this {
        super.on(type, listener)
        return this
    }
    private ionce(type: string | number, listener: (message: CommunicateResponse) => void): this {
        super.once(type, listener)
        return this
    }
    private async call(action: MessageType.Create, message: Omit<Omit<CommunicateMessage, 'id'>, 'action'>): Promise<CommunicateSuccessResponse<EtcdCreateEvent>>
    private async call(action: MessageType.Delete, message: Omit<Omit<CommunicateMessage, 'id'>, 'action'>): Promise<CommunicateSuccessResponse<EtcdDeleteEvent>>
    private async call(action: MessageType.Query, message: Omit<Omit<CommunicateMessage, 'id'>, 'action'>): Promise<CommunicateSuccessResponse<EtcdQueryEvent | EtcdPrefixQueryEvent>>
    private async call(action: MessageType, message: Omit<Omit<CommunicateMessage, 'id'>, 'action'>): Promise<CommunicateSuccessResponse<EtcdEvent>> {
        const id = this.idGen.id.toString()
        const key = `${action}:${id}`
        return new Promise((resolve, reject) => {
            let timer = 0
            const handle = (message: CommunicateResponse) => {
                clearTimeout(timer)
                if (message.success) {
                    resolve(message as CommunicateSuccessResponse<EtcdEvent>)
                } else {
                    reject(new Error(message.err))
                }
            }
            timer = setTimeout(() => {
                this.off(key, handle)
                reject(new Error('Timeout'))
            }, this.timeout)
            const err = this.innerSend({
                ...message,
                action,
                id,
            })
            if (err) {
                clearTimeout(timer)
                reject(err)
            }
            this.ionce(key, handle)
        })
    }
    private pingpong(type: MessageType = MessageType.Ping) {
        this.innerSend({
            id: this.idGen.id.toString(),
            action: type,
        })
    }
    public async put(key: string, value: string, ttlSeconds = 0): Promise<boolean> {
        await this.call(MessageType.Create, {
            key,
            val: value,
            lease: ttlSeconds,
        })
        return true
    }
    public async del(key: string, prefix = false): Promise<boolean> {
        await this.call(MessageType.Delete, {
            key,
            prefix,
        })
        return true
    }
    public async get(key: string, prefix?: false): Promise<[KeyValue, ResponseHeader]>
    public async get(key: string, prefix: true): Promise<Channel<KeyOnly>>
    public async get(key: string, prefix = false): Promise<[KeyValue, ResponseHeader] | Channel<KeyOnly>> {
        if (!prefix) {
            const result = await this.call(MessageType.Query, {
                key,
                prefix: false,
            }) as CommunicateSuccessResponse<EtcdQueryEvent>
            return [result.event.kvs[0], result.event.header]
        }
        // const stream = new TransStream<Omit<KeyValue, 'value'>>()
        const chan = new Channel<Omit<KeyValue, 'value'>>(100)
        setTimeout(async () => {
            try {
                let p = ''
                const endkey = calcEndkey(key)
                while (chan.state === ChannelState.Open) {
                    try {
                        const result = await this.call(MessageType.Query, {
                            key: p || key,
                            endkey,
                            prefix,
                            limit: 1,
                        }) as CommunicateSuccessResponse<EtcdPrefixQueryEvent>
                        for (const item of result.event.kvs) {
                            await chan.add(item)
                        }
                        const last = result.event.kvs.pop()
                        if (!last || !result.event.more) {
                            await chan.close()
                            return
                        }
                        p = decode(last.key) + '\x00'
                    } catch (error) {
                        // eslint-disable-next-line no-console
                        console.error(error)
                        return
                    }
                }
            } catch (error) {
                return
            }
        }, 0)
        return chan
    }
}
