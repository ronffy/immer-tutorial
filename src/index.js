import React from 'react';
import ReactDOM from 'react-dom';

import { createStore } from 'redux';
import { connect } from 'react-redux';

import produce, { applyPatches } from 'immer';


let state = {
  p: {
    x: [1, 2]
  }
}

let fork = state;


let changes = [];
let inverseChanges = [];


fork = produce(
  fork,
  draft => {
    draft.p.x.push(3);
    draft.x = 4;
  },
  (patched, inversePatches) => {
    changes.push(...patched)
    inverseChanges.push(...inversePatches)
  }
)

state = produce(state, draft => {
  draft.p.x.push(5);
})

console.log('changes: %o, inverseChanges: %o', changes, inverseChanges);

console.log('state: %o', state);

state = applyPatches(state, changes);

console.log('state: %o', state);

state = applyPatches(state, inverseChanges);

console.log('state: %o', state);



let target2 = {
  p: {
    x: 1
  }
}

let p = {}

let producer = produce(function (draft, arg){
  console.log('p:', p === arg);
})

let o2 = producer(target2, p);








{
  let state = {
    x: 1
  }

  let adds = [];
  let inverseRemoves = [];

  state = produce(
    state,
    draft => {
      draft.x = 2;
      draft.y = 2;
    },
    (patches, inversePatches) => {
      adds = patches.filter(patch => patch.op === 'replace');
      inverseRemoves = inversePatches.filter(patch => patch.op === 'replace');
    }
  )

  console.log('adds', adds);
  console.log('inverseRemoves', inverseRemoves);
  

  state = produce(state, draft => {
    draft.x = 3;
  })
  console.log('state1', state);
  
  state = applyPatches(state, adds);
  console.log('state2', state);

  state = produce(state, draft => {
    draft.x = 4;
  })
  console.log('state3', state);

  state = applyPatches(state, inverseRemoves);
  console.log('state4', state);
}

// @connect
class C extends React.Component {
  render() {
    const { members } = this.props;
    if (!members || !members.length) {
      return null;
    }
    return (
      <div>
        {
          members.map(({ name, age }) => <span key={age}>{name}: {age}</span>)
        }
      </div>
    )
  }
}




ReactDOM.render(
  <C />,
  document.getElementById('root')
)
