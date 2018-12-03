# immer-tutorial
 immer tutorial example


## 介绍

[immer](https://github.com/mweststrate/immer) 是 mobx 的作者写的一个 immutable 库，核心实现是利用 ES6 的 proxy。
immer 极易上手，常用 api 就那么几个，且使用方式非常舒服，相信你一定会喜欢上它的。


## 以往,关于数据处理,有哪些不爽的地方

先定义一个初始对象，供后面例子使用：
```javascript
let target = {
  h: 1,
  p: {
    x: [2],
  },
}
```

以下情况会一不小心修改原始对象

```javascript
// Q1
let o1 = target;
o1.p = 1; // target 被修改了
o1.p.x = 1; // target 被修改了

// Q2
fn(target); // target 被修改了
function fn(o) {
  o.p1 = 1;
  return o;
};

// Q3
let o3 = {
  ...target
};
o3.p.x = 1; // target 被修改了

// Q4
let o4 = target;
o4.p.x.push(1); // target 被修改了
```

## immer功能介绍

### 一般情况下，解决引用类型对象被修改的办法

1. 深度拷贝，但是深拷贝的成本实在太高；
2. immutable.js，非常棒的一个不可变数据结构的库，今天之所以不推荐它而是选择 immer 的最主要原因是，immer 更小巧，更易上手。

看来目前已知的解决方案，我们都不甚满意，那么 immer 又有什么高明之处呢？

### 安装 immer

```shell
npm i --save immer
```

### immer如何fix掉那些不爽的问题

Fix Q1、Q3
```javascript
import produce from 'immer';
let o1 = produce(target, draft => {
  draft.p.x = 1;
})
```

Fix Q2
```javascript
import produce from 'immer';
fn(target); // target 被修改了
function fn(o) {
  return produce(o, draft => {
    draft.p1 = 1;
  })
};
```

Fix Q4
```javascript
import produce from 'immer';
let o4 = produce(target, draft => {
  draft.p.x.push(1);
})
```

是不是使用非常简单，通过小试牛刀，我们简单的了解了 immer ，下面将对 immer 的常用 api 分别进行介绍。

### api介绍

#### produce

`import produce from "immer"`
or
`import { produce } from "immer"`

第1种使用方式：
`produce(currentState, producer: (draftState) => any): nextState`

第2种使用方式：
`produce(producer: (draftState) => any)(currentState): nextState`

##### producer 的 返回值

`produce(currentState, producer: (draftState) => any): nextState`


##### producer 的 this

```javascript
produce(currentState, function(){
  // 此处，this 指向 draftState
  this.a = 1;
})
```



#### applyPatches

`import produce, {applyPatches} from "immer"`

`applyPatches(currentState, changes: patches[]): nextState`


更多说明，请移步[官方文档](https://github.com/mweststrate/immer)


## immer在react项目中的应用


## 从零实现immer


## immer源码分析
