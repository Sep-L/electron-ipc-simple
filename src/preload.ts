import { contextBridge, ipcRenderer } from 'electron';
import type { IpcResult } from './types';

/**
 * Renderer 侧可调用的 invoke 函数签名
 *
 * @param channel IPC 通道名，通常为 `${ApiName}:${method}`
 * @param args 传递给主进程方法的参数列表
 * @returns 一个 Promise，包装为 IpcResult
 */
type InvokeFn = (
    channel: string,
    args: unknown[]
) => Promise<IpcResult<unknown>>;


/**
 * 暴露一个 IPC invoke 方法到渲染进程的全局作用域
 * - 在 preload 脚本中调用
 * @param key 挂载到 window 上的属性名
 */
export function exposeIpcBridge(key = '__ipcInvoke') {
    const invoke: InvokeFn = (channel, ...args) => {
        return ipcRenderer.invoke(channel, ...args);
    };

    contextBridge.exposeInMainWorld(key, invoke);
}
