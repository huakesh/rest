import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http2';

export enum HTTPMethods {
  DELETE = 'DELETE',
  GET = 'GET',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
}

export const SUPPORTED_PROTOCOLS = ['https:'];

type PathLike = `/${string}`;

export interface FetchRequest {
  path: PathLike;
  method?: HTTPMethods | keyof typeof HTTPMethods;
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
