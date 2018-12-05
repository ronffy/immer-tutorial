import React from 'react';
import ReactDOM from 'react-dom';

import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';

import produce, { applyPatches } from 'immer';

const state = {
  members: [
    {
      name: 'ronffy',
      age: 30
    }
  ]
}

// const reducer = (state, action) => {
//   switch (action.type) {
//     case 'ADD_AGE':
//       const { members } = state;
//       return {
//         ...state,
//         members: [
//           {
//             ...members[0],
//             age: members[0].age + 1,
//           },
//           ...members.slice(1),
//         ]
//       }
//     default:
//       return state
//   }
// }

const reducer = (state, action) => produce(state, draft => {
  switch (action.type) {
    case 'ADD_AGE':
      draft.members[0].age++;
  }
})

// const reducer = produce((draft, action) => {
//   switch (action.type) {
//     case 'ADD_AGE':
//       draft.members[0].age++;
//   }
// })


// const reducer = produce((draft, action) => {
//   switch (action.type) {
//     case 'ADD_AGE':
//       draft.members[0].age++;
//   }
// })

const store = createStore(reducer, state)

@connect(({ members }) => ({ members }))
class C extends React.Component {
  handleClick = () => {
    this.props.dispatch({
      type: 'ADD_AGE'
    })
  }
  render() {
    const { members } = this.props;
    
    if (!members || !members.length) {
      return null;
    }
    return (
      <div>
        <button onClick={this.handleClick}>点我</button>
        {
          members.map(({ name, age }) => <span key={age}>{name}: {age}</span>)
        }
      </div>
    )
  }
}



ReactDOM.render(
  (
    <Provider store={store}>
      <C />
    </Provider>
  ),
  document.getElementById('root')
)
