import React from 'react';


export default function(loader, opts = {}) {
  const { eager } = opts;
  return function(WrappedComponent) {
    class DataSourceComponent extends React.PureComponent {
      state = {
        data: undefined,
        error: undefined,
        loading: false,
        loaded: false
      }

      componentDidMount() {
        this.load();
      }

      componentWillUnmount() {
        this.unmounted = true;
      }

      load = query => {
        this.setState({ loading: true });
        loader({ query, data: this.state.data, props: this.props }).then(data => {
          this.unmounted || this.setState({ data, loading: false, loaded: true });
        }).catch(error => {
          console.error(error);   // eslint-disable-line
          this.unmounted || this.setState({ error, loading: false, loaded: false });
        });
      };

      render() {
        const { data, error, loading, loaded } = this.state;
        if (!loaded && !eager) {
          return null;
        }
        const props = {
          load: this.load,
          error,
          loading,
          ...this.props,
          ...data
        };
        return (
          <WrappedComponent {...props} />
        );
      }
    }
    return DataSourceComponent;
  };
}
