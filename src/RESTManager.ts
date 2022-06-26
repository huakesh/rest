import { OutgoingHttpHeaders } from 'http2';
import https, { RequestOptions } from 'https';
import { FetchRequest, FetchResponse, HTTPMethods, SUPPORTED_PROTOCOLS } from './constants';

export interface RESTManagerOptions {
  /**
   * This will be the base URL for every API request
   *
   * **Default:** https://localhost:5000
   */
  baseURL?: string;

  /**
   * These will be the headers present in every API request.
   *
   * **Note:** If an API request contains a different value for a provided default header, the default header value will be overriden.
   */
  baseHeaders?: OutgoingHttpHeaders;
}

export default class RESTManager {
  /**
   * The base URL for every API request
   */
  readonly baseURL: string;

  /**
   * The default headers present in every API request
   */
  readonly baseHeaders?: OutgoingHttpHeaders;

  constructor(options: RESTManagerOptions = {}) {
    this.baseURL = (options.baseURL ?? 'https://localhost:5000').replace(/\/$/, '');
    const protocol = new URL(this.baseURL).protocol;
    if (!SUPPORTED_PROTOCOLS.includes(protocol)) {
      throw new Error(`Unsupported Protocol ${protocol}`);
    }
    this.baseHeaders = options.baseHeaders;
  }

  /**
   * Makes an REST API request and returns the response
   * @param request The REST API request
   * @returns The REST API response
   */
  public fetch(request: FetchRequest) {
    const internalRequest = this.convertToInternalRequest(request);
    return this.internalFetch(internalRequest, request.data);
  }

  /**
   * Validates and converts the fetch request given by user to internal request
   * Combines the base data to the user request, and converts to required format.
   * @param request User Request
   * @returns Internal Request
   */
  private convertToInternalRequest(request: FetchRequest): RequestOptions {
    // TODO: Validate request
    const url = new URL(this.baseURL + request.path);
    return {
      hostname: url.hostname,
      ...(!!url.port && { port: url.port }),
      path: url.pathname + url.search,
      method: request.method ?? HTTPMethods.GET,
      headers: {
        ...(!!request.data && { 'Content-Type': 'application/json' }),
        ...this.baseHeaders,
        ...request.headers,
        ...(!!request.data && { 'Content-Length': request.data.length }),
      },
    };
  }

  /**
   * Makes the actual REST API call and returns the response
   * @param request Internal Request, this is assumed to be correct format.
   * @returns API response
   */
  private internalFetch(request: RequestOptions, data?: string): Promise<FetchResponse> {
    return new Promise((resolve, reject) => {
      const clientRequest = https.request(request, (response) => {
        const { headers, statusCode, statusMessage } = response;
        if (!statusCode || !statusMessage) {
          return reject(new Error('No status'));
        }
        const status = {
          code: statusCode,
          message: statusMessage,
        };
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          if (!response.complete) {
            return reject(new Error('Connection closed before complete data was received'));
          }
          resolve({ status, data, headers });
        });
      });
      clientRequest.on('error', (err) => reject(err));
      if (data) clientRequest.write(data);
      clientRequest.end();
    });
  }
}
