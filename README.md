# electron-ipc-simple
基于 invoke/handle 的 Electron IPC 通信框架，提供类型安全的主进程与渲染进程通信能力。

## 介绍

`electron-ipc-simple` 是一个简化 Electron 应用中 IPC (Inter-Process Communication) 通信的工具库。它基于 Electron 的 `ipcMain.handle` 和 `ipcRenderer.invoke` API，提供了类型安全、简洁易用的接口，使主进程和渲染进程之间的通信更加便捷和可靠。

## 特性

- ✅ 类型安全（TypeScript 支持）
- ✅ 简化的 API 设计
- ✅ 自动错误处理
- ✅ 基于类的 API 定义
- ✅ 支持异步方法调用
- ✅ 轻量级，无额外依赖

## 安装

```bash
npm install electron-ipc-simple
```

## 快速开始

### 1. 主进程 (main.ts)

```typescript
import { defineIpcApi } from 'electron-ipc-simple';

// 定义 IPC API 类
class UserApi {
  async getUser(id: number) {
    return { id, name: 'Alice', email: 'alice@example.com' };
  }

  async updateUser(id: number, data: Partial<{ name: string; email: string }>) {
    // 更新用户逻辑
    return { id, ...data };
  }
}

// 注册 IPC API
defineIpcApi(UserApi);
```

### 2. Preload 脚本 (preload.ts)

```typescript
import { exposeIpcBridge } from 'electron-ipc-simple';

// 暴露 IPC 桥接到渲染进程
exposeIpcBridge();
```

### 3. 渲染进程 (renderer.ts)

```typescript
import { createIpcProxy } from 'electron-ipc-simple/renderer';


// 创建 API 代理
const userApi = createIpcProxy<UserApi>('UserApi');

// 使用 API
async function fetchUser() {
  try {
    const user = await userApi.getUser(1);
    console.log('User:', user);
  } catch (error) {
    console.error('Error fetching user:', error);
  }
}

fetchUser();
```

## API 文档

### 主进程 API

#### `defineIpcApi(IpcApi: T)`

定义并注册一个 IPC API 类到主进程。

- **参数**：
  - `IpcApi`：一个类，其所有实例方法必须是异步方法

- **返回值**：无

- **说明**：
  - 该函数会自动从类的原型中提取所有非构造函数的方法
  - 每个方法会被注册为一个 IPC 处理程序，通道名格式为 `${ClassName}:${methodName}`
  - 仅在主进程中调用

### Preload 脚本 API

#### `exposeIpcBridge(key?: string)`

在 preload 脚本中暴露 IPC invoke 方法到渲染进程的全局作用域。

- **参数**：
  - `key`：挂载到 `window` 对象上的属性名，默认为 `__ipcInvoke`

- **返回值**：无

- **说明**：
  - 在 preload 脚本中调用
  - 使用 `contextBridge` 安全地暴露 API

### 渲染进程 API

#### `createIpcProxy<T>(apiName: string): T`

创建一个渲染进程侧的 IPC API 代理。

- **参数**：
  - `apiName`：主进程中定义的 API 类名

- **返回值**：一个代理对象，其方法调用会被转发到主进程

- **说明**：
  - 该代理对象的方法调用会自动转换为 IPC 调用
  - 通道名格式为 `${apiName}:${methodName}`
  - 错误会被自动抛出，成功结果会直接返回

## 类型定义

### `IpcResult<T>`

IPC 调用的结果类型。

```typescript
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
```

## 注意事项

1. **API 类要求**：
   - 必须是一个类（不能是对象）
   - 所有实例方法必须是异步方法

2. **类型安全**：
   - 建议在渲染进程中定义与主进程 API 对应的 TypeScript 接口
   - 这样可以获得完整的类型提示和编译时检查

3. **错误处理**：
   - 主进程中的错误会被自动捕获并转换为 IpcResult
   - 渲染进程中需要使用 try/catch 处理可能的错误

