import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationDialog from './ConfirmationDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('ConfirmationDialog', () => {
  it('renders title and children and triggers callbacks', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmationDialog open={true} onClose={onClose} onConfirm={onConfirm} title="Delete?">
        <div>Are you sure?</div>
      </ConfirmationDialog>
    );

    // Content
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();

    // Buttons use translation keys
    fireEvent.click(screen.getByText('cancel'));
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByText('confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('does not render when open is false', () => {
    const { queryByText } = render(
      <ConfirmationDialog open={false} onClose={() => {}} onConfirm={() => {}} title="T" >
        C
      </ConfirmationDialog>
    );

    expect(queryByText('T')).toBeNull();
  });
});
