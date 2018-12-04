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

let p;

let o1 = produce(target2, function (draft){
  // let a = draft.p;
  // p = a;
  // return a ;
  console.log(draft === this);
  
  draft.p.x = 2;
})






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
