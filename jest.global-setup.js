import { TextEncoder, TextDecoder } from 'util';
import { Request, Response, Headers } from 'node-fetch';
import fetch from 'node-fetch';

export default async () => {
  // Polyfill for TextEncoder and TextDecoder
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;

  // Polyfill for Request, Response, Headers
  global.Request = Request;
  global.Response = Response;
  global.Headers = Headers;

  // Polyfill for fetch
  global.fetch = fetch;
};