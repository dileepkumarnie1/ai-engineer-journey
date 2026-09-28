import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { courses } from '@/content/courses';
import { CourseCard } from './CourseCard';

describe('<CourseCard>', () => {
  it('shows engagement badges and toggles selection', async () => {
    const onToggle = vi.fn();
    render(
      <MemoryRouter>
        <CourseCard course={courses.hfAgents} onToggle={onToggle} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Hugging Face AI Agents Course')).toBeInTheDocument();
    expect(screen.getByText(/Certificate/)).toBeInTheDocument();
    expect(screen.getByText(/Interactive/)).toBeInTheDocument();
    const open = screen.getByRole('link', { name: /open/i });
    expect(open).toHaveAttribute('rel', 'noopener noreferrer');
    await userEvent.click(screen.getByRole('button', { name: /add to my plan/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
