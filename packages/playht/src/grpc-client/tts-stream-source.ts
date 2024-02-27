import type * as grpc from '@grpc/grpc-js';
import * as apiProto from './protos/api';

export class TTSStreamSource implements UnderlyingByteSource {
  private stream?: grpc.ClientReadableStream<apiProto.playht.v1.TtsResponse>;
  readonly type = 'bytes';
  private retryable = true;

  constructor(
    private readonly request: apiProto.playht.v1.ITtsRequest,
    private readonly rpcClient: grpc.Client,
    private readonly fallbackClient?: grpc.Client,
  ) {}

  start(controller: ReadableByteStreamController) {
    this.startAndMaybeFallback(controller, this.rpcClient, this.fallbackClient);
  }

  startAndMaybeFallback(controller: ReadableByteStreamController, client: grpc.Client, fallbackClient?: grpc.Client) {
    try {
      if (controller.byobRequest) {
        throw new Error("Don't know how to handle byobRequest");
      }
      this.stream = client.makeServerStreamRequest(
        '/playht.v1.Tts/Tts',
        (arg) => apiProto.playht.v1.TtsRequest.encode(arg).finish() as any,
        (arg) => apiProto.playht.v1.TtsResponse.decode(arg),
        this.request,
      );
    } catch (error: any) {
      const errorDetail = error?.errorMessage || error?.details || error?.message || 'Unknown error';
      const errorMessage = `[PlayHT SDK] Error creating stream: ${errorDetail}`;
      console.error(errorMessage);
      controller.error(errorMessage);
      return;
    }

    this.stream.on('data', (data: apiProto.playht.v1.TtsResponse) => {
      this.retryable = false;
      if (data.status) {
        switch (data.status.code) {
          case apiProto.playht.v1.Code.CODE_COMPLETE:
          case apiProto.playht.v1.Code.CODE_IN_PROGRESS:
            break;
          case apiProto.playht.v1.Code.CODE_CANCELED:
          case apiProto.playht.v1.Code.CODE_ERROR: {
            const message = data.status.message ? data.status.message.join(', ') : 'Unknown status';
            const type = data.status.code === apiProto.playht.v1.Code.CODE_CANCELED ? 'Canceled' : 'Error';
            if (this.end()) {
              controller.error(new Error(`${type}: ${message}`));
            }
            return;
          }
          default: {
            if (this.end()) {
              controller.error(new Error(`Unknown status code: ${data.status.code}`));
            }
            return;
          }
        }
      }
      if (data.data && data.data.byteLength > 0) {
        const buffer = new Uint8Array(data.data.byteLength);
        buffer.set(data.data);
        controller.enqueue(buffer);
      }
    });
    this.stream.on('error', (err) => {
      // if we get an error while this stream source is still retryable (i.e. we haven't started streaming data back and haven't canceled)
      // then we can fallback if there is a fallback rpc client
      if (this.retryable && fallbackClient) {
        console.warn(`Falling back...`, fallbackClient.getChannel().getTarget());
        this.end();
        // start again with the fallback client and the primary client
        // we won't specify a second order fallback client - so if this client fails, this stream will fail
        this.startAndMaybeFallback(controller, fallbackClient, undefined);
        return;
      }

      // if we reach here - we couldn't fallback and therefore this stream has failed
      if (this.end()) {
        controller.error(err);
      }
    });
    this.stream.on('end', () => {
      if (this.end()) {
        controller.close();
      }
    });
  }

  cancel() {
    this.retryable = false;
    if (this.stream) {
      this.stream.cancel();
    }
  }

  end() {
    if (this.stream) {
      this.stream.removeAllListeners();
      this.stream = undefined;
      return true;
    }
    return false;
  }
}
