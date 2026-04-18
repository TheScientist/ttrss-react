import React from 'react';
import { render } from '@testing-library/react';
import { ApiProvider, ApiContext } from '../contexts/ApiContext';
import { SettingsProvider } from './SettingsContext';

describe('ApiContext', () => {
  it('provides context value to children', () => {
    const captured: unknown[] = [];
    function Consumer() {
      const ctx = React.useContext(ApiContext);
      if (ctx) captured.push(ctx);
      return <div>Consumer</div>;
    }
    render(
      <SettingsProvider>
        <ApiProvider>
          <Consumer />
        </ApiProvider>
      </SettingsProvider>
    );
    expect(captured.length).toBeGreaterThan(0);
    expect(typeof captured[0]).toBe('object');
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
