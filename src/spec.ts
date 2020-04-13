export enum MessageType {
    Create = 'create',
    Delete = 'delete',
    Query = 'query',
    Watch = 'watch',
    Ping = 'ping',
    Pong = 'pong',
    HandShake = 'handshake',
}

export interface CommunicateMessage {
    id: string
    action: MessageType
    key?: string
    endkey?: string
    val?: string
    lease?: number
    limit?: number
    prefix?: boolean
}
export enum EtcdEventType {
    Update = 'update',
    Create = 'create',
    Delete = 'delete',
}

export type CommunicateResponse = CommunicateSuccessResponse<EtcdEvent> | CommunicateWatchEventResponse | CommunicateFailResponse

export interface CommunicateSuccessResponse<T extends EtcdEvent> {
    id: string
    action: MessageType
    success: true
    key: string
    event: T
}

export interface CommunicateWatchEventResponse {
    action: MessageType.Watch
    success: true
    key: string
    event: EtcdCreateEvent | EtcdDeleteEvent | EtcdUpdateEvent
}

export function isCommunicateWatchEventResponse(message: CommunicateResponse): message is CommunicateWatchEventResponse {
    return message.action === MessageType.Watch && message.success
}

export interface CommunicateFailResponse {
    id: string
    action: MessageType
    success: false
    key: string
    err: string
}

export type EtcdEvent = EtcdQueryEvent | EtcdPrefixQueryEvent | EtcdCreateEvent | EtcdDeleteEvent | EtcdUpdateEvent

export interface EtcdQueryEvent {
    more: boolean
    header: ResponseHeader
    kvs: [KeyValue]
    prev_kv?: KeyValue
}

export interface EtcdPrefixQueryEvent {
    more: boolean
    header: ResponseHeader
    kvs: Omit<KeyValue, 'value'>[]
    prev_kv?: KeyValue
}

export interface WatchHandle {
    (type: EtcdEventType.Create, revision: int64, kv: KeyValue): void
    (type: EtcdEventType.Delete, revision: int64): void
    (type: EtcdEventType.Update, revision: int64, kv: KeyValue, old: KeyValue): void
}

export interface EtcdCreateEvent {
    type: EtcdEventType.Create
    more: false
    header: ResponseHeader
    kvs: [KeyValue]
}

export interface EtcdDeleteEvent {
    type: EtcdEventType.Delete
    more: false
    header: ResponseHeader
    prev_kv: KeyValue
}

export interface EtcdUpdateEvent {
    type: EtcdEventType.Update
    more: false
    header: ResponseHeader
    kvs: [KeyValue]
    prev_kv: KeyValue
}
export type int64 = number
export type uint64 = number
export type byte = number

export interface KeyOnly {
    // key is the key in bytes. An empty key is not allowed.
    key: string
    // create_revision is the revision of last creation on this key.
    create_revision: int64
    // mod_revision is the revision of last modification on this key.
    mod_revision: int64
    // version is the version of the key. A deletion resets
    // the version to zero and any modification of the key
    // increases its version.
    version: int64
    // value is the value held by the key, in bytes.
    value?: string
    // lease is the ID of the lease that attached to key.
    // When the attached lease expires, the key will be deleted.
    // If lease is 0, then no lease is attached to the key.
    lease: int64
}

export interface KeyValue extends KeyOnly {
    value: string
}
export interface ResponseHeader {
    // cluster_id is the ID of the cluster which sent the response.
    // cluster_id: uint64
    // member_id is the ID of the member which sent the response.
    // member_id: uint64
    // revision is the key-value store revision when the request was applied.
    // For watch progress responses, the header.revision indicates progress. All future events
    // recieved in this stream are guaranteed to have a higher revision number than the
    // header.revision number.
    revision: int64
    // raft_term is the raft term when the request was applied.
    // raft_term: uint64
}
