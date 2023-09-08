import * as apiProto from './protos/api'
import type * as grpc from '@grpc/grpc-js'

export default class TTSStreamSource implements UnderlyingByteSource {
    private stream?: grpc.ClientReadableStream<apiProto.playht.v1.TtsResponse>
    readonly type = 'bytes'

    constructor(
        private readonly request: apiProto.playht.v1.ITtsRequest,
        private readonly rpcClient: grpc.Client
    ) {}

    start(controller: ReadableByteStreamController) {
        if (controller.byobRequest) {
            throw new Error("Don't know how to handle byobRequest")
        }
        this.stream = this.rpcClient.makeServerStreamRequest(
            '/playht.v1.Tts/Tts',
            (arg) => apiProto.playht.v1.TtsRequest.encode(arg).finish() as any,
            (arg) => apiProto.playht.v1.TtsResponse.decode(arg),
            this.request
        )
        this.stream.on('data', (data: apiProto.playht.v1.TtsResponse) => {
            if (data.status) {
                switch (data.status.code) {
                    case apiProto.playht.v1.Code.CODE_COMPLETE:
                    case apiProto.playht.v1.Code.CODE_IN_PROGRESS:
                        break
                    case apiProto.playht.v1.Code.CODE_CANCELED:
                    case apiProto.playht.v1.Code.CODE_ERROR: {
                        const message = data.status.message
                            ? data.status.message.join(', ')
                            : 'Unknown status'
                        const type =
                            data.status.code === apiProto.playht.v1.Code.CODE_CANCELED
                                ? 'Canceled'
                                : 'Error'
                        if (this.end()) {
                            controller.error(new Error(`${type}: ${message}`))
                        }
                        return
                    }
                    default: {
                        if (this.end()) {
                            controller.error(new Error(`Unknown status code: ${data.status.code}`))
                        }
                        return
                    }
                }
            }
            if (data.data) {
                controller.enqueue(data.data)
            }
        })
        this.stream.on('error', (err) => {
            if (this.end()) {
                controller.error(err)
            }
        })
        this.stream.on('end', () => {
            if (this.end()) {
                controller.close()
            }
        })
    }

    cancel() {
        if (this.stream) {
            this.stream.cancel()
        }
    }

    end() {
        if (this.stream) {
            this.stream.removeAllListeners()
            this.stream = undefined
            return true
        }
        return false
    }
}
