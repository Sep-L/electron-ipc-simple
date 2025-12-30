import { IpcResult } from "./types";

/**
 * Renderer 侧调用主进程 IPC 的 invoke 函数签名
 *
 * - channel：IPC 通道名，通常格式为 `${ApiName}:${methodName}`
 * - args：传递给主进程方法的参数
 * - 返回值：Promise<IpcResult<T>>
 *
 * 由 preload 脚本通过 contextBridge 挂载到 window 对象上
 */
type IpcInvoke = <T>(channel: string, ...args: unknown[]) => Promise<IpcResult<T>>;

/**
 * 声明全局 window 接口的扩展
 * - __ipcInvoke 由 preload 注入
 * - renderer 侧通过该方法与主进程通信
 */
declare global {
    interface Window {
        __ipcInvoke: IpcInvoke;
    }
}

/**
 * 创建 renderer 侧的 IPC Proxy
 * - 该函数会返回一个虚拟对象, 对象上的任意属性访问都会被转换为一次 IPC 调用
 *
 * ```ts
 * userApi.getUser(1)
 * // 实际触发：
 * // invoke("UserApi:getUser", 1)
 * ```
 *
 * @param apiName IPC API 的命名空间, 与主进程中注册的 class / API 名称一致
 *
 * @returns 一个 Proxy 对象, 其方法调用会被转发到主进程
 */
export function createIpcProxy<T extends object>(apiName: string): T {
    const invoke: IpcInvoke = window.__ipcInvoke;

    return new Proxy({} as T, {
        get(_target, prop: string) {
            const channelName = `${apiName}:${prop}`
            return function (...args: any[]) {
                return invoke(channelName, ...args).then((result: IpcResult<unknown>) => {
                    if (result.ok) {
                        return result.data;
                    }
                    throw result.error;
                });
            };
        },
    });
}