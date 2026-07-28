// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import DoctorAppointmentLifecycleControls from './AppointmentLifecycleControls'

const appointment = (status) => ({
  _id: 'appointment-1',
  slotDate: '2026-07-21',
  status,
  cancelled: status === 'cancelled',
  isCompleted: status === 'completed'
})

describe('DoctorAppointmentLifecycleControls', () => {
  it('sends the scheduled appointment to check-in', () => {
    const onTransition = vi.fn()
    render(<DoctorAppointmentLifecycleControls appointment={appointment('scheduled')} onTransition={onTransition} />)

    fireEvent.click(screen.getByRole('button', { name: 'Check in' }))

    expect(onTransition).toHaveBeenCalledWith({ endpoint: '/api/doctor/check-in', payload: { appointmentId: 'appointment-1' } })
  })

  it('sends a checked-in appointment to the consultation queue transition', () => {
    const onTransition = vi.fn()
    render(<DoctorAppointmentLifecycleControls appointment={appointment('checked_in')} onTransition={onTransition} />)

    fireEvent.click(screen.getByRole('button', { name: 'Start consultation' }))

    expect(onTransition).toHaveBeenCalledWith({ endpoint: '/api/doctor/queue/call-next', payload: { slotDate: '2026-07-21' } })
  })

  it('sends an in-consultation appointment to operational completion', () => {
    const onTransition = vi.fn()
    render(<DoctorAppointmentLifecycleControls appointment={appointment('in_consultation')} onTransition={onTransition} />)

    fireEvent.click(screen.getByRole('button', { name: 'Complete consultation' }))

    expect(onTransition).toHaveBeenCalledWith({ endpoint: '/api/doctor/appointments/appointment-1/complete-operational', payload: {} })
  })

  it('keeps lifecycle metadata off the native button', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<DoctorAppointmentLifecycleControls appointment={appointment('checked_in')} onTransition={vi.fn()} />)

    const button = screen.getByRole('button', { name: 'Start consultation' })
    expect(button).not.toHaveAttribute('endpoint')
    expect(button).not.toHaveAttribute('payload')
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it.each(['completed', 'cancelled', 'no_show'])('renders %s as a read-only badge without lifecycle actions', (status) => {
    render(<DoctorAppointmentLifecycleControls appointment={appointment(status)} onTransition={vi.fn()} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText(status === 'no_show' ? 'No-show' : status[0].toUpperCase() + status.slice(1))).toBeInTheDocument()
  })
})
