import React from 'react';
import { shallow } from 'enzyme';
import withLoader from './index';


describe('app', () => {
  it('test', async() => {
    const loader = async() => {
      await sleep(100);
      return { name: 'foo' };
    };

    const App = withLoader(loader)(({ name }) => (
      <div>{name}</div>
    ));

    const wrapper = shallow(<App />);
    expect(wrapper.html()).toBe(null);

    await sleep(110);
    expect(wrapper.html()).toBe('<div>foo</div>');
  });
});


function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
