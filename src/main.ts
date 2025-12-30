import { ipcMain } from 'electron';
import type { IpcResult } from './types';

/**
 * 约束异步方法, 参数任意, 返回 Promise
 */
type AsyncMethod = (...args: any[]) => Promise<any>;

/**
 * 用于约束 IPC API：只允许暴露 async 方法
 */
type AsyncApi<T> = {
    [K in keyof T]: T[K] extends AsyncMethod ? T[K] : never;
};

/**
 * 从类的 prototype 上提取可作为 IPC 方法的方法名
 * @returns 可注册为 IPC handler 的方法名数组
 */
function getIpcApiMethods(proto: any): string[] {
    return Object.getOwnPropertyNames(proto).filter(
        (name) =>
            name !== 'constructor' &&
            typeof proto[name] === 'function'
    );
}

/**
 * 定义并注册一个 IPC API
 * - 必须只在 Main 进程调用
 * - IpcApi 必须是一个 class
 * - class 的实例方法必须是 async 方法
 */
export function defineIpcApi<T extends new (...args: any[]) => AsyncApi<InstanceType<T>>>(IpcApi: T) {
    const ipcApiName = IpcApi.name;

    if (process?.type === 'browser') {
        const instance = new IpcApi();
        const methods = getIpcApiMethods(IpcApi.prototype);

        for (const method of methods) {
            const channel = `${ipcApiName}:${method}`;

            ipcMain.removeHandler(channel);

            ipcMain.handle(
                channel,
                async (_event, ...args): Promise<IpcResult<any>> => {
                    try {
                        return {
                            ok: true,
                            data: await (instance as any)[method](...args),
                        };
                    } catch (err: any) {
                        console.error(`[IPC Error] ${channel}`, err);

                        return {
                            ok: false,
                            error: {
                                message: err?.message ?? 'Unknown error',
                                stack: err?.stack,
                            },
                        };
                    }
                }
            );
        }
    }

}
