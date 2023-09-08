import {credentials, Client as GrpcClient} from '@grpc/grpc-js'
import fetch from 'cross-fetch'

import * as apiProto from './protos/api'

import Lease from './lease'
import ReadableStream from './readable-stream'
import TTSStreamSource from './tts-stream-source'

export type TTSParams = apiProto.playht.v1.ITtsParams
export const Quality = apiProto.playht.v1.Quality
export const Format = apiProto.playht.v1.Format

export interface ClientOptions {
    /**
     * PlayHT API user, required.
     * See https://docs.play.ht/reference/api-authentication
     */
    userId: string
    /**
     * PlayHT API key, required.
     * See https://docs.play.ht/reference/api-authentication
     */
    apiKey: string
    /**
     * URL to the PlayHT API, defaults to `https://play.ht/api`.
     * @internal
     */
    _apiUrl?: string
    /**
     * Address to the inference service, overrides address returned by API.
     * @internal
     */
    _inferenceAddress?: string
    /**
     * Whether to use a insecure connection to the inference service, defaults to `false`.
     * @internal
     */
    _insecure?: boolean
}

/** PlayHT Streaming TTS Client. */
export class Client {
    private rpc?: {client: GrpcClient; address: string}
    private lease!: Lease
    private leaseTimer?: NodeJS.Timeout
    private leasePromise?: Promise<Lease>

    private readonly apiUrl: string
    private readonly apiHeaders: Record<string, string>
    private readonly inferenceAddress?: string
    private readonly insecure: boolean

    constructor(options: ClientOptions) {
        if (!options.userId || !options.apiKey) {
            throw new Error('userId and apiKey are required')
        }
        this.apiUrl = options._apiUrl ?? 'https://play.ht/api'
        const authHeader = options.apiKey.startsWith('Bearer ')
            ? options.apiKey
            : `Bearer ${options.apiKey}`
        this.apiHeaders = {
            'X-User-Id': options.userId,
            Authorization: authHeader,
        }
        this.inferenceAddress = options._inferenceAddress
        this.insecure = options._insecure ?? false
        this.refreshLease()
    }

    private async getLease() {
        const response = await fetch(`${this.apiUrl}/v2/leases`, {
            method: 'POST',
            headers: this.apiHeaders,
        })
        if (!response.ok) {
            throw new Error(`Failed to get lease: ${response.status} ${response.statusText}`)
        }
        const data = new Uint8Array(await response.arrayBuffer())
        const lease = new Lease(data)
        if (lease.expires < new Date()) {
            throw new Error('Got an expired lease, is your system clock correct?')
        }
        return lease
    }

    private async refreshLease() {
        if (this.leasePromise) {
            await this.leasePromise
            return
        }
        if (this.lease && this.lease.expires > new Date(Date.now() + 1000 * 60 * 5)) {
            return
        }
        this.leasePromise = this.getLease()
        this.lease = await this.leasePromise
        this.leasePromise = undefined

        const address = this.inferenceAddress ?? this.lease.metadata.pigeon_url
        if (this.rpc && this.rpc.address !== address) {
            this.rpc.client.close()
            this.rpc = undefined
        }
        if (!this.rpc) {
            this.rpc = {
                client: new GrpcClient(
                    address,
                    this.insecure ? credentials.createInsecure() : credentials.createSsl()
                ),
                address: address,
            }
        }
        const expiresIn = this.lease.expires.getTime() - Date.now()
        clearTimeout(this.leaseTimer)
        this.leaseTimer = setTimeout(() => this.refreshLease(), expiresIn - 1000 * 60 * 5)
    }

    /** Create a new TTS stream. */
    async tts(params: TTSParams) {
        await this.refreshLease()
        const request: apiProto.playht.v1.ITtsRequest = {
            params: params,
            lease: this.lease.data,
        }
        const stream = new ReadableStream(new TTSStreamSource(request, this.rpc!.client))
        // fix for TypeScript not DOM types not including Symbol.asyncIterator in ReadableStream
        return stream as unknown as AsyncIterable<Uint8Array> & ReadableStream<Uint8Array>
    }

    /** Close the client and release resources. */
    close() {
        if (this.rpc) {
            this.rpc.client.close()
            this.rpc = undefined
        }
        clearTimeout(this.leaseTimer)
    }
}
