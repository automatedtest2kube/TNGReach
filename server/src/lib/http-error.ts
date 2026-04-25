export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function isHttpError(e: unknown): e is HttpError {
  return e instanceof HttpError;
}
