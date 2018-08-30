import React from 'react';
import ReactDOM from 'react-dom';
import { connect, Provider } from 'react-redux';
import { create } from 'dva-core';


export default function({
  model, models, view, selector,
  mount, initialState
}) {
  const root = mount && getRoot(mount);
  initialState = initialState || (root ? getState(root) : null);
  const app = create({ initialState });
  models = toArray(model || models);
  models.forEach(v => app.model(v));
  app.start();
  const store = app._store;  // eslint-disable-line
  const View = withMount({ selector, models })(view);

  const App = props => (
    <Provider store={store}>
      <View {...props} />
    </Provider>
  );

  mount && render(App, root);
  return App;
}

function toArray(array) {
  return Array.isArray(array) ? array : [array];
}


function withMount({ selector, models }) {
  selector = selector || (v => v);
  return View => {
    class App extends React.Component {
      componentDidMount() {
        const { props } = this;
        models.forEach(({ namespace }) => {
          props.dispatch({ type: `${namespace}/mount`, ...props });
        });
      }

      render() {
        return <View {...this.props} />;
      }
    }
    return connect(selector)(App);
  };
}


function render(App, root) {
  ReactDOM.render(<App />, root);
}


function getRoot(mount) {
  if (typeof mount === 'string') {
    return document.querySelector(mount);
  }
  if (mount && mount.nodeType === 1) {
    return mount;
  }
  return document.getElementById('app');
}


function getState(root) {
  const state = root.dataset.state;
  return state ? JSON.parse(state) : null;
}
