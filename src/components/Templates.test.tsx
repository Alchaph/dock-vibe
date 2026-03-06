import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Templates from './Templates';

describe('Templates', () => {
  const onUseTemplate = vi.fn();
  const mockOnToast = vi.fn();

  it('renders templates heading', () => {
    render(<Templates onUseTemplate={onUseTemplate} onToast={mockOnToast} />);

    expect(screen.getByText('Container Templates')).toBeInTheDocument();
  });

  it('shows built-in templates', () => {
    render(<Templates onUseTemplate={onUseTemplate} onToast={mockOnToast} />);

    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('MySQL')).toBeInTheDocument();
    expect(screen.getByText('Redis')).toBeInTheDocument();
    expect(screen.getByText('MongoDB')).toBeInTheDocument();
    expect(screen.getByText('Nginx')).toBeInTheDocument();
  });

  it('shows template descriptions', () => {
    render(<Templates onUseTemplate={onUseTemplate} onToast={mockOnToast} />);

    expect(screen.getByText('PostgreSQL relational database')).toBeInTheDocument();
    expect(screen.getByText('In-memory data structure store')).toBeInTheDocument();
  });

  it('calls onUseTemplate when Use Template button is clicked', async () => {
    render(<Templates onUseTemplate={onUseTemplate} onToast={mockOnToast} />);

    const useButtons = screen.getAllByText('Use Template');
    await userEvent.click(useButtons[0]);

    expect(onUseTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        image: expect.any(String),
      })
    );
  });

  it('has category filter buttons', () => {
    render(<Templates onUseTemplate={onUseTemplate} onToast={mockOnToast} />);

    expect(screen.getByText('All Templates')).toBeInTheDocument();
    expect(screen.getByText('Databases')).toBeInTheDocument();
    expect(screen.getByText('Web Servers')).toBeInTheDocument();
  });

  it('filters by category', async () => {
    render(<Templates onUseTemplate={onUseTemplate} onToast={mockOnToast} />);

    await userEvent.click(screen.getByText('Databases'));

    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('MySQL')).toBeInTheDocument();
    expect(screen.getByText('MongoDB')).toBeInTheDocument();
    expect(screen.queryByText('Nginx')).not.toBeInTheDocument();
  });

  it('shows template card structure', () => {
    render(<Templates onUseTemplate={onUseTemplate} onToast={mockOnToast} />);

    const postgresCard = screen.getByText('PostgreSQL').closest('.template-card');
    expect(postgresCard).toBeInTheDocument();
  });

  it('has import template button', () => {
    render(<Templates onUseTemplate={onUseTemplate} onToast={mockOnToast} />);

    expect(screen.getByText('Import Template')).toBeInTheDocument();
  });

  it('shows all category options', () => {
    render(<Templates onUseTemplate={onUseTemplate} onToast={mockOnToast} />);

    expect(screen.getByText('Caching')).toBeInTheDocument();
    expect(screen.getByText('Runtimes')).toBeInTheDocument();
    expect(screen.getByText('Messaging')).toBeInTheDocument();
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Dev Tools')).toBeInTheDocument();
    expect(screen.getByText('CMS & Apps')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();
  });

  it('returns to all templates when clicking All Templates', async () => {
    render(<Templates onUseTemplate={onUseTemplate} onToast={mockOnToast} />);

    await userEvent.click(screen.getByText('Databases'));
    expect(screen.queryByText('Nginx')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('All Templates'));
    expect(screen.getByText('Nginx')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });
});
