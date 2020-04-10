export function encode(str: string): string {
    return btoa(unescape(encodeURIComponent( str )))
}

export function decode(str: string): string {
    return decodeURIComponent(escape(atob(str)))
}
