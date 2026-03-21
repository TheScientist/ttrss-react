import React from 'react';
import { render } from '@testing-library/react';
import { ApiProvider, ApiContext } from '../contexts/ApiContext';
import { SettingsProvider } from './SettingsContext';

describe('ApiContext', () => {
  it('provides context value to children', () => {
    let contextValue = null;
    function Consumer() {
      contextValue = React.useContext(ApiContext);
      return <div>Consumer</div>;
    }
    render(
      <SettingsProvider>
        <ApiProvider>
          <Consumer />
        </ApiProvider>
      </SettingsProvider>
    );
    expect(contextValue).not.toBeNull();
    expect(typeof contextValue).toBe('object');
  });

  it('renders children', () => {
    const { getByText } = render(
      <SettingsProvider>
        <ApiProvider>
          <div>Child</div>
        </ApiProvider>
      </SettingsProvider>
    );
    expect(getByText('Child')).toBeInTheDocument();
  });
});
