export interface IpcSuccess<T> {
  ok: true;
  data: T;
}

export interface IpcFailure {
  ok: false;
  error: {
    message: string;
    stack?: string;
  };
}

export type IpcResult<T> = IpcSuccess<T> | IpcFailure;
