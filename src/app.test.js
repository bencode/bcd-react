import React from 'react';
import { mount } from 'enzyme';
import app from './app';
import escapeHtml from 'escape-html';


/* global setTimeout */


const View = ({ test }) => (
  <div>{test.name}</div>
);


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


    const App = app({ model, view: View });
    const wrapper = mount(<App />);
    expect(wrapper.html()).toBe('<div>hello</div>');
    await sleep(20);
    expect(wrapper.html()).toBe('<div>world</div>');
  });


  test('create app and mount to #app', () => {
    const root = document.createElement('div');
    root.setAttribute('id', 'app');
    document.body.appendChild(root);

    const model = {
      namespace: 'test',
      state: { name: 'test' }
    };
    app({ model, view: View, mount: true });
    expect(root.innerHTML).toBe('<div>test</div>');
  });


  test('create with multiple models', () => {
    const models = [
      { namespace: 'page', state: { name: 'foo' } },
      { namespace: 'module', state: { name: 'bar' } }
    ];

    const selector = state => ({
      pageName: state.page.name,
      moduleName: state.module.name
    });

    const View = props => (
      <div>pageName: {props.pageName}, moduleName: {props.moduleName}</div>
    );

    const App = app({ models, view: View, selector });
    const wrapper = mount(<App />);
    expect(wrapper.html()).toBe('<div>pageName: foo, moduleName: bar</div>');
  });


  test('mount to custom node', () => {
    const model = { namespace: 'test', state: { name: 'foo' } };
    const node = document.createElement('div');
    document.body.appendChild(node);

    node.classList.add('app');
    app({ model, view: View, mount: '.app' });
    expect(node.innerHTML).toBe('<div>foo</div>');


    const other = document.createElement('div');
    app({ model, view: View, mount: other });
    expect(node.innerHTML).toBe('<div>foo</div>');
  });


  test('initialState from dataset', () => {
    const state = { test: { name: 'react in practice', price: 20 } };
    const node = document.createElement('div');
    node.innerHTML = `<div class="root" data-state="${escapeHtml(JSON.stringify(state))}"></div>`;
    const root = node.querySelector('.root');

    const model = { namespace: 'test', state: {} };
    const View = ({ test }) => (
      <div>name: {test.name}, price: {test.price}</div>
    );

    app({ model, view: View, mount: root });
    expect(root.innerHTML).toBe('<div>name: react in practice, price: 20</div>');
  });
});


function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}
