import { OutgoingHttpHeaders } from 'http2';
import https from 'https';
import { FetchRequest, FetchResponse, HTTPMethods, InternalRequest, SUPPORTED_PROTOCOLS } from './constants';

export interface RESTManagerOptions {
  /**
   * This will be the base URL for every API request
   */
  baseURL: string;

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

  constructor(options: RESTManagerOptions) {
    this.baseURL = options.baseURL.replace(/\/$/, '');
    const protocol = new URL(this.baseURL).protocol;
    if (!SUPPORTED_PROTOCOLS.includes(protocol)) {
      throw new Error(`Unsupported Protocol ${protocol}`);
    }
    this.baseHeaders = options.baseHeaders;
  }

  public get(request: Omit<FetchRequest, 'method'>) {
    return this.fetch({
      ...request,
      method: HTTPMethods.GET,
    });
  }

  public fetch(request: FetchRequest) {
    // TODO: Validate request
    return this.internalFetch(this.convertToInternalRequest(request));
  }

  private convertToInternalRequest(request: FetchRequest): InternalRequest {
    return {
      method: request.method ?? HTTPMethods.GET,
      url: new URL(this.baseURL + request.path),
      data: request.data,
      headers: {
        ...(!!request.data && { 'Content-Type': 'application/json' }),
        ...this.baseHeaders,
        ...request.headers,
        ...(!!request.data && { 'Content-Length': request.data.length }),
      },
    };
  }

  private internalFetch(request: InternalRequest): Promise<FetchResponse> {
    return new Promise((resolve, reject) => {
      const clientRequest = https.request(
        {
          hostname: request.url.hostname,
          ...(!!request.url.port && { port: request.url.port }),
          path: request.url.pathname + request.url.search,
          method: request.method,
          headers: request.headers,
        },
        (response) => {
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
        },
      );
      clientRequest.on('error', (err) => reject(err));
      if (request.data) clientRequest.write(request.data);
      clientRequest.end();
    });
  }
}
