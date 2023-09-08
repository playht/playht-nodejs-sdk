let _ReadableStream: typeof ReadableStream
if (typeof ReadableStream === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _ReadableStream = require('node:stream/web').ReadableStream
} else {
    _ReadableStream = ReadableStream
}

export default _ReadableStream
