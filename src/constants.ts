import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http2';

export enum HTTPMethods {
  DELETE = 'DELETE',
  GET = 'GET',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
}

export const SUPPORTED_PROTOCOLS = ['https:'];

export interface InternalRequest {
  url: URL;
  method: HTTPMethods | keyof typeof HTTPMethods | string;
  data?: string;
  headers: OutgoingHttpHeaders;
}

type pathLike = `/${string}`;

export interface FetchRequest {
  path: pathLike;
  method?: HTTPMethods | keyof typeof HTTPMethods | string;
  data?: string;
  headers?: OutgoingHttpHeaders;
}

export interface FetchResponse {
  status: {
    code: number;
    message: string;
  };
  data: string;
  headers: IncomingHttpHeaders;
}
