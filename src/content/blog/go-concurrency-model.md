---
title: 用 Go 写并发：先把生命周期想清楚
description: goroutine 泄漏往往不是语法问题，而是生命周期设计问题。用 context 和结构化并发的思路重新组织并发代码。
pubDate: 2026-10-28
category: 编程语言
tags: [Go, 并发, 工程实践]
---

Go 的并发原语很轻：`go` 一个函数就够了。但也正因为太轻，很多代码在写的时候没想过“这个 goroutine 什么时候结束”，上线之后就成了泄漏。

## 一个典型的泄漏模式

```go
func watch(ch <-chan Event) {
    for ev := range ch {
        handle(ev)
    }
}
```

如果 `ch` 永远不关闭，`watch` 就永远阻塞。更常见的情况是调用方已经不再需要它了，但没有任何机制通知它退出。

## 用 context 传递取消信号

Go 的标准做法是让每个可能长期运行的 goroutine 接收一个 `context.Context`：

```go
func watch(ctx context.Context, ch <-chan Event) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case ev, ok := <-ch:
            if !ok {
                return nil
            }
            handle(ev)
        }
    }
}
```

关键不是用了 `select`，而是**把退出条件变成了函数契约的一部分**。调用方决定何时取消，被调方只负责响应。

## 结构化并发

单个 goroutine 容易处理，难的是一组 goroutine 之间的协作。结构化并发的原则是：

- 子任务的生命周期不超过父任务。
- 父任务退出前，必须等待所有子任务结束。
- 任意一个子任务失败，整体应当能取消其余子任务。

`errgroup` 配合 `context` 恰好表达了这个模型：

```go
g, ctx := errgroup.WithContext(context.Background())
for _, id := range ids {
    id := id
    g.Go(func() error {
        return fetch(ctx, id)
    })
}
if err := g.Wait(); err != nil {
    return err
}
```

这里 `errgroup.WithContext` 返回的 `ctx` 会在任意一个 goroutine 返回错误时取消，其他任务通过 `select` 感知到后退出。

## 三个检查点

写并发代码时，可以依次问自己：

1. **谁创建了这个 goroutine，谁负责等它结束？**
2. **它什么时候退出？是通道关闭、context 取消，还是任务自然完成？**
3. **如果其中一个 goroutine 卡住，其余的会被拖死吗？**

这三个问题答不上来，代码大概率会在生产环境里以某种奇怪的方式暴露出来。

## 小结

并发不难，难的是生命周期。把 context 作为标准参数传递，把等待关系写进代码结构，复用 `errgroup` 这类成熟抽象，比自己造轮子稳妥得多。
