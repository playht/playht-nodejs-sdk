const EPOCH = 1519257480 // 2018-02-21 23:58:00 UTC

export default class Lease {
    created: number
    duration: number
    metadata: {[key: string]: string}

    constructor(readonly data: Uint8Array) {
        this.created = readUInt32BE(data, 64)
        this.duration = readUInt32BE(data, 64 + 4)
        this.metadata = JSON.parse(new TextDecoder().decode(data.slice(4 + 4 + 64)))
    }

    get expires(): Date {
        return new Date((this.created + this.duration + EPOCH) * 1000)
    }
}

function readUInt32BE(d: Uint8Array, pos: number) {
    if (pos < 0 || pos + 4 > d.length) {
        throw new RangeError('Index out of range')
    }

    return (d[pos] * 0x1000000 + ((d[pos + 1] << 16) | (d[pos + 2] << 8) | d[pos + 3])) >>> 0
}
