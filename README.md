# immer-tutorial
 immer tutorial example


## 介绍

[Immer](https://github.com/mweststrate/immer) 是 mobx 的作者写的一个 immutable 库，核心实现是利用 ES6 的 proxy。  
Immer 极易上手，常用 api 就那么几个，使用方式也非常舒服，相信你一定会喜欢上它的。


## 以往,关于数据处理,有哪些不爽的地方

先定义一个初始对象，供后面例子使用：
首先定义一个`currentState`对象，后面的例子使用到变量`currentState`时，如无特殊声明，都是指这个`currentState`对象
```javascript
let currentState = {
  p: {
    x: [2],
  },
}
```

以下情况会一不小心修改原始对象

```javascript
// Q1
let o1 = currentState;
o1.p = 1; // currentState 被修改了
o1.p.x = 1; // currentState 被修改了

// Q2
fn(currentState); // currentState 被修改了
function fn(o) {
  o.p1 = 1;
  return o;
};

// Q3
let o3 = {
  ...currentState
};
o3.p.x = 1; // currentState 被修改了

// Q4
let o4 = currentState;
o4.p.x.push(1); // currentState 被修改了
```

## immer功能介绍

### 一般情况下，解决引用类型对象被修改的办法

1. 深度拷贝，但是深拷贝的成本较高，会影响性能；
2. [ImmutableJS](https://github.com/facebook/immutable-js)，非常棒的一个不可变数据结构的库，可以解决上面的问题，But，跟 Immer 比起来，ImmutableJS 有两个较大的不足：第一是需要使用者学习它的数据结构操作方式，没有 Immer 提供的使用原生对象的操作方式简单、易用；第二：它的操作结果需要通过`toJS`方法才能得到原生对象，这使得在操作一个对象的时候，时刻要主要操作的是原生对象还是 ImmutableJS 的返回结果，稍不注意，就会产生意想不到的 bug。

看来目前已知的解决方案，我们都不甚满意，那么 Immer 又有什么高明之处呢？

### 安装immer

```shell
npm i --save immer
```

### immer如何fix掉那些不爽的问题

Fix Q1、Q3
```javascript
import produce from 'immer';
let o1 = produce(currentState, draft => {
  draft.p.x = 1;
})
```

Fix Q2
```javascript
import produce from 'immer';
fn(currentState); // currentState 被修改了
function fn(o) {
  return produce(o, draft => {
    draft.p1 = 1;
  })
};
```

Fix Q4
```javascript
import produce from 'immer';
let o4 = produce(currentState, draft => {
  draft.p.x.push(1);
})
```

是不是使用非常简单，通过小试牛刀，我们简单的了解了 Immer ，下面将对 Immer 的常用 api 分别进行介绍。


### 概念说明

Immer 涉及概念不多，在此将涉及到的概念先行罗列出来，阅读本文章过程中遇到不明白的概念，可以随时来此处查阅。

- currentState  
  被操作对象的最初状态

- draftState  
  根据 currentState 生成的草稿状态，它是 currentState 的代理，对 draftState 所做的任何修改都将被记录并用于生成 nextState 。在此过程中，currentState 将不受影响

- nextState  
  根据 draftState 生成的最终状态

- produce 生产  
  用来生成 nextState 或 producer 的函数

- producer 生产者  
  通过 produce 生成，用来生产 nextState ，每次执行相同的操作

- recipe 生产机器  
  用来操作 draftState 的函数


### 常用api介绍

#### produce

*备注：出现`PatchListener`先行跳过，后面章节会做介绍*

`import produce from "immer"`  
or  
`import { produce } from "immer"`  

##### 第1种使用方式：

语法：
`produce(currentState, recipe: (draftState) => void | draftState, ?PatchListener): nextState`

例子1：
```typescript
let nextState = produce(currentState, (draft) => {

})

currentState === nextState; // true
```

例子2：
```typescript
let currentState = {
  a: [],
  p: {
    x: 1
  }
}

let nextState = produce(currentState, (draft) => {
  draft.a.push(2);
})

currentState.a === nextState.a; // false
currentState.p === nextState.p; // true
```

由此可见，对 draftState 的修改都会反应到 nextState 上，而 Immer 使用的结构是共享的，nextState 在结构上又与 currentState 共享未修改的部分，共享效果如图(借用的一篇 Immutable 文章中的动图，侵删)：

![](./assets/change-tree.gif)

##### 自动冻结功能

Immer 还在内部做了一件很巧妙的事情，那就是通过 produce 生成的 nextState 是被冻结（freeze）的，（Immer 内部使用`Object.freeze`方法，只冻结 nextState 跟 currentState 相比修改的部分），这样，当直接修改 nextState 时，将会报错。
这使得 nextState 成为了真正的不可变数据。

例子：
```typescript
let nextState = produce(currentState, (draft) => {
  draft.p.x.push(2);
})

currentState === nextState; // true
```

##### 第2种使用方式

利用高阶函数的特点，提前生成一个生产者 producer

语法：
`produce(recipe: (draftState) => void | draftState, ?PatchListener)(currentState): nextState`

例子：
```typescript
let producer = produce((draft) => {
  draft.x = 2
});
let nextState = producer(currentState);
```


##### recipe的返回值

recipe 是否有返回值，nextState 的生成过程是不同的：  
recipe 没有返回值时：nextState 根据 recipe 函数内的 draftState 生成的；  
recipe 有返回值时：nextState 根据 recipe 函数的返回值生成的；  

```typescript
let nextState = produce(
  currentState, 
  (draftState) => {
    return {
      x: 2
    }
  }
)
```

此时，nextState 不再是通过 draftState 生成的了，而是通过 recipe 的返回值生成的。

##### recipe中的this

 recipe 函数内部的`this`指向 draftState ，也就是修改`this`与修改 recipe 的参数 draftState ，效果是一样的。  
**注意：此处的 recipe 函数不能是箭头函数，如果是箭头函数，`this`就无法指向 draftState 了**

```javascript
produce(currentState, function(draft){
  // 此处，this 指向 draftState
  draft === this; // true
})
```

#### patch补丁功能

通过此功能，可以方便进行详细的代码调试和跟踪，可以知道 recipe 内的做的每次修改，还可以实现时间旅行。

Immer 中，一个 patch 对象是这样的:
```typescript
interface Patch {
  op: "replace" | "remove" | "add" // 一次更改的动作类型
  path: (string | number)[] // 此属性指从树根到被更改树杈的路径
  value?: any // op为 replace、add 时，才有此属性，表示新的赋值
}
```

语法：
```typescript
produce(
  currentState, 
  recipe,
  // 通过 patchListener 函数，暴露正向和反向的补丁数组
  patchListener: (patches: Patch[], inversePatches: Patch[]) => void
)

applyPatches(currentState, changes: (patches | inversePatches)[]): nextState
```

例子：

```typescript
import produce, { applyPatches } from "immer"

let state = {
  x: 1
}

let replaces = [];
let inverseReplaces = [];

state = produce(
  state,
  draft => {
    draft.x = 2;
    draft.y = 2;
  },
  (patches, inversePatches) => {
    replaces = patches.filter(patch => patch.op === 'replace');
    inverseReplaces = inversePatches.filter(patch => patch.op === 'replace');
  }
)

state = produce(state, draft => {
  draft.x = 3;
})
console.log('state1', state); // { x: 3, y: 2 }

state = applyPatches(state, replaces);
console.log('state2', state); // { x: 2, y: 2 }

state = produce(state, draft => {
  draft.x = 4;
})
console.log('state3', state); // { x: 4, y: 2 }

state = applyPatches(state, inverseReplaces);
console.log('state4', state); // { x: 1, y: 2 }

```

`state.x`的值4次打印结果分别是：`3、2、4、1`，实现了时间旅行，
可以分别打印`patches`和`inversePatches`看下，

`patches`数据如下：
```javascript
[
  {
    op: "replace",
    path: ["x"],
    value: 2
  },
  {
    op: "add",
    path: ["y"],
    value: 2
  },
]
```

`inversePatches`数据如下：
```javascript
[
  {
    op: "replace",
    path: ["x"],
    value: 1
  },
  {
    op: "remove",
    path: ["y"],
  },
]
```

可见，`patchListener`内部对数据操作做了记录，并分别存储为正向操作记录和反向操作记录，供我们使用。

至此，Immer 的常用功能和 api 我们就介绍完了。

接下来，我们看如何用 Immer ，提高 React 、Redux 项目的开发效率。


## 用immer优化react项目的探索

既然 Immer 这么好用，那么是否可以在 React 项目中大展身手呢，答案是肯定的。

在开始正式探索之前，我们先来看下 produce [第2种使用方式](#第2种使用方式)的拓展用法:

例子：
```typescript
let obj = {};

let producer = produce((draft, arg) => {
  obj === arg; // true
});
let nextState = producer(currentState, obj);
```

相比 produce 第2种使用方式的例子，多定义了一个`obj`对象，并将其作为 producer 方法的第2个参数传了进去；可以看到， produce 内的 recipe 回调函数的第2个参数与`obj`对象是指向同一块内存。  
ok，我们在知道了 produce 的这种拓展用法后，看看能够在 React 中发挥什么功效。

### 优化setState方法

先简单回顾下，`setState`方法在 React 中的使用：  

首先定义一个`state`对象，后面的例子使用到变量`state`或访问`this.state`时，如无特殊声明，都是指这个`state`对象
```typescript
state = {
  members: [
    {
      name: 'ronffy',
      age: 30
    }
  ]
}
```

```typescript

```


### 优化reducer



## 参考文档

- [官方文档](https://github.com/mweststrate/immer)
- [Introducing Immer: Immutability the easy way](https://hackernoon.com/introducing-immer-immutability-the-easy-way-9d73d8f71cb3)