import React from 'react';
import { mount } from 'enzyme';
import app from './app';


describe('app', () => {
  test('create app', () => {
    const model = {
      namespace: 'app',
      state: {},

      reducers: {
        init() {
          console.log('hello');
        }
      },

      effects: {
        *mount(_, { put }) {
          yield put({ type: 'load', payload: { name: 'hello' } });
        }
      }
    };

    const view = () => (
      <div>Hello</div>
    );

    const App = app({ model, view });
    const wrapper = mount(<App />);
    expect(wrapper.html()).toBe('<div>Hello</div>');
  });
});
