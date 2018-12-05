# immer-tutorial
 immer tutorial example


## 介绍

[immer](https://github.com/mweststrate/immer) 是 mobx 的作者写的一个 immutable 库，核心实现是利用 ES6 的 proxy。  
immer 极易上手，常用 api 就那么几个，使用方式也非常舒服，相信你一定会喜欢上它的。


## 以往,关于数据处理,有哪些不爽的地方

先定义一个初始对象，供后面例子使用：
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

1. 深度拷贝，但是深拷贝的成本实在太高；
2. immutable.js，非常棒的一个不可变数据结构的库，今天之所以不推荐它而是选择 immer 的最主要原因是，immer 更小巧，更易上手。

看来目前已知的解决方案，我们都不甚满意，那么 immer 又有什么高明之处呢？

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

是不是使用非常简单，通过小试牛刀，我们简单的了解了 immer ，下面将对 immer 的常用 api 分别进行介绍。


### 概念说明

immer 涉及概念不多，在此将涉及到的概念先行罗列出来，阅读本文章过程中遇到不明白的概念，可以随时来此处查阅。

- currentState  
  被操作对象的最初状态

- draftState  
  根据`currentState`生成的草稿状态，它是`currentState`的代理，对`draftState`所做的任何修改都将被记录并用于生成`nextState`。在此过程中，`currentState`将不受影响

- nextState  
  根据`draftState`生成的最终状态

- produce 生产  
  用来生成`nextState`或`producer`的函数

- producer 生产者  
  通过`produce`生成，用来生产`nextState`，每次执行相同的操作

- recipe 生产机器  
  用来操作`draftState`的函数


### 常用api介绍

#### produce

> 备注：出现`PatchListener`先行跳过，后面章节会做介绍

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
let nextState = produce(currentState, (draft) => {
  draft.p.x.push(1);
})

currentState.p.x !== nextState.p.x; // true
```

##### 第2种使用方式
利用高阶函数的特点，提前生成一个生产者`producer`

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

`recipe`是否有返回值，`nextState`的生成过程是不同的：  
`recipe`没有返回值时：`nextState`根据`recipe`函数内的`draftState`生成的；  
`recipe`有返回值时：`nextState`根据`recipe`函数的返回值生成的；  

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

此时，`nextState`不再是通过`draftState`生成的了，而是通过`recipe`的返回值生成的。

注意，`recipe`无返回值时，通过`produce`生成的`nextState`是 frozen（冻结）的，不可被修改的

##### recipe中的this

`recipe`函数内部的`this`指向`draftState`，也就是修改`this`与修改`recipe`的参数`draftState`，效果是一样的。  
!!注意：此处的`recipe`函数不能是箭头函数，如果是箭头函数，`this`就无法指向`draftState`了。

```javascript
produce(currentState, function(draft){
  // 此处，this 指向 draftState
  draft === this; // true
})
```

#### patch补丁功能

通过此功能，可以方便进行详细的代码调试和跟踪，可以知道`recipe`内的做的每次修改，还可以实现时间旅行。

immer 中，一个patch对象是这样的:
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


至此，`immer`的常用功能和 api 我们就介绍完了。

接下来，我们看下使用`immer`，如何提高`react`、`redux`项目的开发效率。

## 用immer优化react项目的探索

既然`immer`这么好用，那么是否可以在`react`项目中大展身手呢，答案是肯定的。





## 从零实现immer


## immer源码分析


## 参考文档

- [官方文档](https://github.com/mweststrate/immer)
- [Introducing Immer: Immutability the easy way](https://hackernoon.com/introducing-immer-immutability-the-easy-way-9d73d8f71cb3)