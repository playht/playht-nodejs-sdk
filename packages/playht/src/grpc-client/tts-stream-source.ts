import type * as grpc from '@grpc/grpc-js';
import * as apiProto from './protos/api';
import {CongestionCtrl} from "../index";

export class TTSStreamSource implements UnderlyingByteSource {
  private stream?: grpc.ClientReadableStream<apiProto.playht.v1.TtsResponse>;
  readonly type = 'bytes';
  private retryable = true;
  private retries = 0;
  private maxRetries = 0;
  private backoff = 0;

  constructor(
    private readonly request: apiProto.playht.v1.ITtsRequest,
    private readonly rpcClient: grpc.Client,
    private readonly fallbackClient?: grpc.Client,
    private readonly congestionCtrl?: CongestionCtrl
  ) {
    if (congestionCtrl != undefined) {
      switch (congestionCtrl) {
        case CongestionCtrl.Off:
          this.maxRetries = 0;
          this.backoff = 0;
          break;
        case CongestionCtrl.StaticMar2024:
          /**
           * NOTE:
           *
           * The values below were experimentally chosen.
           *
           * The experiments were not rigorous and certainly leave a lot to be desired. We should tune them over time.
           * We might end up with something dynamic inspired by additive-increase-multiplicative-decrease.
           *
           * --mtp@2024/02/28
           */
          this.maxRetries = 2;
          this.backoff = 50;
          break;
        default:
          throw new Error(`Unrecognized congestion control algorithm: ${congestionCtrl}`);
      }
    }
  }

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
      // then we can retry or fall back (if there is a fallback rpc client)
      if (this.retryable) {
        if (this.retries < this.maxRetries) {
          this.end();
          this.retries++;
          // NOTE: It's a poor customer experience to show internal details about retries -- so we don't log here.  TCP has the same policy.
          //console.debug(`[PlayHT SDK] Retrying in ${this.backoff} ms ... (${this.retries} attempts so far)`, err.message);
          // retry with the same primary and fallback client
          setTimeout(() => {
            this.startAndMaybeFallback(controller, client, fallbackClient);
          }, this.backoff)

        } else if (fallbackClient) {
          // NOTE: We log fallbacks to give customers a signal that they should scale up their on-prem appliance (e.g. by paying for more GPU quota)
          console.warn(`[PlayHT SDK] Falling back to ${fallbackClient.getChannel().getTarget()} ...`, err.message);
          this.end();
          this.retries = 0;
          // start again with the fallback client and the primary client
          // we won't specify a second order fallback client - so if this client fails, this stream will fail
          this.startAndMaybeFallback(controller, fallbackClient, undefined);
          return;
        }
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
