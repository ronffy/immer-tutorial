# Immer 中文文档

## 前言

[Immer](https://github.com/mweststrate/immer) 是 mobx 的作者写的一个 immutable 库，核心实现是利用 ES6 的 proxy，几乎以最小的成本实现了 js 的不可变数据结构，简单易用、体量小巧、设计巧妙，满足了我们对JS不可变数据结构的需求。  
无奈网络上完善的文档实在太少，所以自己写了一份，本篇文章以贴近实战的思路和流程，对 Immer 进行了全面的讲解。

## 目录

-   [数据处理存在的问题](#数据处理存在的问题)
-   [解决引用类型对象被修改的办法](#解决引用类型对象被修改的办法)
-   [immer功能介绍](#immer功能介绍)
    - [安装immer](#安装immer)
    - [immer如何fix掉那些不爽的问题](#immer如何fix掉那些不爽的问题)
    - [概念说明](#概念说明)
    - [常用api介绍](#常用api介绍)
-   [用immer优化react项目的探索](#用immer优化react项目的探索)
    - [抛出需求](#抛出需求)
    - [优化setState方法](#优化setState方法)
    - [优化reducer](#优化reducer)
-   [参考文档](#参考文档)

## 数据处理存在的问题

先定义一个初始对象，供后面例子使用：
首先定义一个`currentState`对象，后面的例子使用到变量`currentState`时，如无特殊声明，都是指这个`currentState`对象
```javascript
let currentState = {
  p: {
    x: [2],
  },
}
```

哪些情况会一不小心修改原始对象？

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

## 解决引用类型对象被修改的办法

1. 深度拷贝，但是深拷贝的成本较高，会影响性能；
2. [ImmutableJS](https://github.com/facebook/immutable-js)，非常棒的一个不可变数据结构的库，可以解决上面的问题，But，跟 Immer 比起来，ImmutableJS 有两个较大的不足：  
  - 需要使用者学习它的数据结构操作方式，没有 Immer 提供的使用原生对象的操作方式简单、易用；
  - 它的操作结果需要通过`toJS`方法才能得到原生对象，这使得在操作一个对象的时候，时刻要主要操作的是原生对象还是 ImmutableJS 的返回结果，稍不注意，就会产生意想不到的 bug。

看来目前已知的解决方案，我们都不甚满意，那么 Immer 又有什么高明之处呢？

## immer功能介绍

### 安装immer

欲善其事必先利其器，安装 Immer 是当前第一要务

```shell
npm i --save immer
```

### immer如何fix掉那些不爽的问题

Fix Q1、Q3
```js
import produce from 'immer';
let o1 = produce(currentState, draft => {
  draft.p.x = 1;
})
```

Fix Q2
```js
import produce from 'immer';
fn(currentState); // currentState 被修改了
function fn(o) {
  return produce(o, draft => {
    draft.p1 = 1;
  })
};
```

Fix Q4
```js
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

使用 Immer 前，请确认将`immer`包引入到模块中

```js
import produce from 'immer'
```
or  
```js
import { produce } from 'immer'
```

这两种引用方式，produce 是完全相同的

#### produce

*备注：出现`PatchListener`先行跳过，后面章节会做介绍*

##### 第1种使用方式：

语法：  
`produce(currentState, recipe: (draftState) => void | draftState, ?PatchListener): nextState`

例子1：
```js
let nextState = produce(currentState, (draft) => {

})

currentState === nextState; // true
```

例子2：
```js
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
```ts
const currentState = {
  p: {
    x: [2],
  },
}
const nextState = produce(currentState, draftState => {
    draftState.p.x.push(3);
});
console.log(nextState.p.x); // [2, 3]
nextState.p.x = 4;
console.log(nextState.p.x); // [2, 3]
nextState.p.x.push(5); // 报错
```

##### 第2种使用方式

利用高阶函数的特点，提前生成一个生产者 producer

语法：  
`produce(recipe: (draftState) => void | draftState, ?PatchListener)(currentState): nextState`

例子：
```js
let producer = produce((draft) => {
  draft.x = 2
});
let nextState = producer(currentState);
```


##### recipe的返回值

recipe 是否有返回值，nextState 的生成过程是不同的：  
recipe 没有返回值时：nextState 是根据 recipe 函数内的 draftState 生成的；  
recipe 有返回值时：nextState 是根据 recipe 函数的返回值生成的；  

```js
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

```js
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

```js
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
```js
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
```js
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

首先定义一个`state`对象，后面的例子使用到变量`state`或访问`this.state`时，如无特殊声明，都是指这个`state`对象
```js
state = {
  members: [
    {
      name: 'ronffy',
      age: 30
    }
  ]
}
```

### 抛出需求

就上面定义的`state`，我们先抛一个需求出来，好让后面的讲解有的放矢：  
**members 成员中的第1个成员，年龄增加1岁**

### 优化setState方法

#### 错误示例

```js
this.state.members[0].age++;
```
只所以有的新手同学会犯这样的错误，很大原因是这样操作实在是太方便了，以至于忘记了操作 State 的规则。

下面看下正确的实现方法

#### setState的第1种实现方法

```js
const { members } = this.state;
this.setState({
  members: [
    {
      ...members[0],
      age: members[0].age + 1,
    },
    ...members.slice(1),
  ]
})
```

#### setState的第2种实现方法

```js
this.setState(state => {
  const { members } = state;
  return {
    members: [
      {
        ...members[0],
        age: members[0].age + 1,
      },
      ...members.slice(1)
    ]
  }
})
```

以上2种实现方式，就是`setState`的两种使用方法，相比大家都不陌生了，所以就不过多说明了，接下来看下，如果用 Immer 解决，会有怎样的烟火？

#### 用immer更新state

```js
this.setState(produce(draft => {
  draft.members[0].age++;
}))
```

是不是瞬间代码量就少了很多，阅读起来舒服了很多，而且更易于阅读了。

### 优化reducer

#### immer的produce的拓展用法

在开始正式探索之前，我们先来看下 produce [第2种使用方式](#第2种使用方式)的拓展用法:

例子：
```js
let obj = {};

let producer = produce((draft, arg) => {
  obj === arg; // true
});
let nextState = producer(currentState, obj);
```

相比 produce 第2种使用方式的例子，多定义了一个`obj`对象，并将其作为 producer 方法的第2个参数传了进去；可以看到， produce 内的 recipe 回调函数的第2个参数与`obj`对象是指向同一块内存。  
ok，我们在知道了 produce 的这种拓展用法后，看看能够在 Redux 中发挥什么功效?

#### 普通reducer怎样解决上面抛出的需求

```js
const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD_AGE':
      const { members } = state;
      return {
        ...state,
        members: [
          {
            ...members[0],
            age: members[0].age + 1,
          },
          ...members.slice(1),
        ]
      }
    default:
      return state
  }
}
```

#### 集合immer,reducer可以怎样写

```js
const reducer = (state, action) => produce(state, draft => {
  switch (action.type) {
    case 'ADD_AGE':
      draft.members[0].age++;
  }
})
```

可以看到，通过 produce ，我们的代码量已经精简了很多；  
不过仔细观察不难发现，利用 produce 能够先制造出 producer 的特点，代码还能更优雅：

```js
const reducer = produce((draft, action) => {
  switch (action.type) {
    case 'ADD_AGE':
      draft.members[0].age++;
  }
})
```

好了，至此，Immer 优化 reducer 的方法也讲解完毕。

Immer 的使用非常灵活，多多思考，相信你还可以发现 Immer 更多其他的妙用！


## 参考文档

- [官方文档](https://github.com/mweststrate/immer)
- [Introducing Immer: Immutability the easy way](https://hackernoon.com/introducing-immer-immutability-the-easy-way-9d73d8f71cb3)
