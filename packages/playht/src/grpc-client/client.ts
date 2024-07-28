import { credentials, Client as GrpcClient } from '@grpc/grpc-js';
import fetch from 'cross-fetch';
import apiProto from './protos/api';
import { Lease } from './lease';
import { ReadableStream } from './readable-stream';
import { TTSStreamSource } from './tts-stream-source';

export type TTSParams = apiProto.playht.v1.ITtsParams;
export const Quality = apiProto.playht.v1.Quality;
export const Format = apiProto.playht.v1.Format;

export interface ClientOptions {
  /**
   * PlayHT API user, required.
   * See https://docs.play.ht/reference/api-authentication
   */
  userId: string;
  /**
   * PlayHT API key, required.
   * See https://docs.play.ht/reference/api-authentication
   */
  apiKey: string;

  /**
   * An optional custom address (host:port) to send requests to.
   *
   * If you're using PlayHT On-Prem (https://docs.play.ht/reference/on-prem), then you should set
   * customAddr to be the address of your PlayHT On-Prem appliance (e.g. my-company-000001.on-prem.play.ht:11045).
   * Keep in mind that your PlayHT On-Prem appliance can only be used with the PlayHT2.0-Turbo voice engine for streaming.
   */
  customAddr?: string;

  /**
   * If true, the client may choose to, under high load scenarios, fallback from a custom address
   * (configured with "customAddr" above) to the standard PlayHT address.
   */
  fallbackEnabled?: boolean;

  /**
   * If present and true, remove SSML-style tags (anything between and including `<` and `>`) from the text of the request
   */
  removeSsmlTags?: boolean;
}

const USE_INSECURE_CONNECTION = false;

class RetryableError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'RetryableError';
  }
}

/** PlayHT Streaming TTS Client. */
export class Client {
  private rpc?: { client: GrpcClient; address: string };
  private premiumRpc?: { client: GrpcClient; address: string };
  private customRpc?: { client: GrpcClient; address: string };
  private lease: Lease | undefined;
  private leaseTimer?: NodeJS.Timeout;
  private leasePromise?: Promise<Lease>;

  private readonly apiUrl: string;
  private readonly apiHeaders: Record<string, string>;
  private readonly options: ClientOptions;

  constructor(options: ClientOptions) {
    if (!options.userId || !options.apiKey) {
      throw new Error('userId and apiKey are required');
    }
    if (options.fallbackEnabled == undefined) {
      options.fallbackEnabled = false;
    }
    this.apiUrl = 'https://api.play.ht/api';
    const authHeader = options.apiKey.startsWith('Bearer ') ? options.apiKey : `Bearer ${options.apiKey}`;
    this.apiHeaders = {
      'X-User-Id': options.userId,
      Authorization: authHeader,
    };
    this.options = options;
    (async () => {
      try {
        await this.refreshLease();
      } catch (e) {
        // Ignore errors here, we'll retry on the first call.
      }
    })();
  }

  private async getLease() {
    const response = await fetch(`${this.apiUrl}/v2/leases`, {
      method: 'POST',
      headers: this.apiHeaders,
    });
    if (!response.ok) {
      const responseJson = await (async () => {
        try {
          // LB errors are HTML, not json, so account for that here and allow retry.
          return await response.json();
        } catch (e) {
          throw new RetryableError(`Failed to get lease.`);
        }
      })();

      throw new Error(`Failed to get lease: ${response.status} ${response.statusText} - ${responseJson.error_message}`);
    }
    const data = new Uint8Array(await response.arrayBuffer());
    const lease = new Lease(data);
    if (lease.expires < new Date()) {
      throw new Error('Got an expired lease, is your system clock correct?');
    }
    return lease;
  }

  private async refreshLease() {
    if (this.leasePromise) {
      // Don't let a failed lease fetch kill us here, we may have a valid lease.
      try {
        await this.leasePromise;
      } catch (e) {
        if (!this.lease) {
          throw e;
        }
      }
      return;
    }

    if (this.lease && this.lease.expires > new Date(Date.now() + 1000 * 60 * 5)) {
      return;
    }

    this.leasePromise = this.getLease();
    try {
      this.lease = await this.leasePromise;
    } catch (e) {
      if (!this.lease || !(e instanceof RetryableError)) {
        throw e;
      }

      // If this lease fails and we have time left before the deadline, reschedule.
      const expiresIn = this.lease.expires.getTime() - Date.now();
      if (expiresIn > 1000 * 15) {
        clearTimeout(this.leaseTimer);
        // Try again every 30 seconds until it works or we run out of time.
        this.leaseTimer = setTimeout(
          () =>
            (async () => {
              try {
                await this.refreshLease();
              } catch (e) {
                console.error('Failed to refresh lease:', e);
              }
            })(),
          Math.min(1000 * 30, expiresIn - 1000 * 10),
        );
      }
      return;
    } finally {
      this.leasePromise = undefined;
    }

    const address = this.lease.metadata.inference_address;
    if (!address) {
      throw new Error('Service address not found');
    }
    if (this.rpc && this.rpc.address !== address) {
      this.rpc.client.close();
      this.rpc = undefined;
    }

    if (!this.rpc) {
      this.rpc = {
        client: new GrpcClient(
          address,
          USE_INSECURE_CONNECTION ? credentials.createInsecure() : credentials.createSsl(),
        ),
        address,
      };
    }

    const premiumAddress = this.lease.metadata.premium_inference_address;
    if (!premiumAddress) {
      throw new Error('Premium service address not found');
    }
    if (this.premiumRpc && this.premiumRpc.address !== premiumAddress) {
      this.premiumRpc.client.close();
      this.premiumRpc = undefined;
    }

    if (!this.premiumRpc) {
      this.premiumRpc = {
        client: new GrpcClient(
          premiumAddress,
          USE_INSECURE_CONNECTION ? credentials.createInsecure() : credentials.createSsl(),
        ),
        address: premiumAddress,
      };
    }

    if (this.options.customAddr) {
      const customAddress: string = this.options.customAddr;
      if (this.customRpc && this.customRpc.address !== customAddress) {
        this.customRpc.client.close();
        this.customRpc = undefined;
      }

      if (!this.customRpc) {
        const insecure = customAddress.includes('on-prem.play.ht') || USE_INSECURE_CONNECTION;
        this.customRpc = {
          client: new GrpcClient(customAddress, insecure ? credentials.createInsecure() : credentials.createSsl()),
          address: customAddress,
        };
      }
    }
    const expiresIn = this.lease.expires.getTime() - Date.now();
    clearTimeout(this.leaseTimer);
    this.leaseTimer = setTimeout(
      () =>
        (async () => {
          try {
            await this.refreshLease();
          } catch (e) {
            console.error('Failed to refresh lease:', e);
          }
        })(),
      expiresIn - 1000 * 60 * 5,
    );
  }

  /** Create a new TTS stream. */
  public async tts(isPremium: boolean, params: TTSParams) {
    try {
      await this.refreshLease();
    } catch (e) {
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.error(e);
        },
      });
    }

    if (!this.lease) {
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.error(new Error('No lease available.'));
        },
      });
    }

    if (params.text && this.options.removeSsmlTags) {
        params.text = params.text.map(str => str.replace(/<[^>]*>/g, ''));
    }
    const request: apiProto.playht.v1.ITtsRequest = {
      params: params,
      lease: this.lease.data,
    };
    let rpcClient: GrpcClient;
    let fallbackClient: GrpcClient | undefined;
    if (this.customRpc) {
      rpcClient = this.customRpc.client;
      if (this.options.fallbackEnabled) {
        fallbackClient = isPremium ? this.premiumRpc!.client : this.rpc!.client;
      } else {
        fallbackClient = undefined;
      }
    } else {
      rpcClient = isPremium ? this.premiumRpc!.client : this.rpc!.client;
      fallbackClient = undefined;
    }
    const stream = new ReadableStream(new TTSStreamSource(request, rpcClient, fallbackClient));
    // fix for TypeScript not DOM types not including Symbol.asyncIterator in ReadableStream
    return stream as unknown as AsyncIterable<Uint8Array> & ReadableStream<Uint8Array>;
  }

  /** Close the client and release resources. */
  close() {
    if (this.rpc) {
      this.rpc.client.close();
      this.rpc = undefined;
    }
    clearTimeout(this.leaseTimer);
  }
}
