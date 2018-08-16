import React from 'react';
import { mount } from 'enzyme';
import app from './app';


/* global setTimeout */


describe('app', () => {
  test('create app', async() => {
    const model = {
      namespace: 'test',
      state: {
        name: 'hello'
      },

      reducers: {
        load(state, { payload }) {
          return { ...state, ...payload };
        }
      },

      effects: {
        *mount(_, { put }) {
          yield sleep(10);
          yield put({ type: 'load', payload: { name: 'world' } });
        }
      }
    };

    const View = ({ test }) => (
      <div>{test.name}</div>
    );

    const App = app({ model, view: View });
    const wrapper = mount(<App />);
    expect(wrapper.html()).toBe('<div>hello</div>');
    await sleep(20);
    expect(wrapper.html()).toBe('<div>world</div>');
  });
});


function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}
