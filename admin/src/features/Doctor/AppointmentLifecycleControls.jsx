const statusPresentation = {
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700' },
  no_show: { label: 'No-show', className: 'bg-slate-100 text-slate-700' }
}

export const getAppointmentOperationalStatus = ({ cancelled, status, isCompleted }) => {
  if (cancelled || status === 'cancelled') return 'cancelled'
  if (status === 'no_show') return 'no_show'
  if (status === 'completed' || isCompleted) return 'completed'
  return status || 'scheduled'
}

const AppointmentStatusBadge = ({ status }) => {
  const presentation = statusPresentation[status] || { label: 'Status unavailable', className: 'bg-slate-100 text-slate-700' }

  return <p className={`portal-status ${presentation.className}`}>{presentation.label}</p>
}

const lifecycleActionFor = (appointment, status) => {
  if (status === 'scheduled') {
    return {
      label: 'Check in',
      className: 'portal-button-secondary text-xs',
      endpoint: '/api/doctor/check-in',
      payload: { appointmentId: appointment._id }
    }
  }

  if (status === 'checked_in') {
    return {
      label: 'Start consultation',
      className: 'portal-button-secondary text-xs',
      endpoint: '/api/doctor/queue/call-next',
      payload: { slotDate: appointment.slotDate }
    }
  }

  if (status === 'in_consultation') {
    return {
      label: 'Complete consultation',
      className: 'portal-button text-xs',
      endpoint: `/api/doctor/appointments/${appointment._id}/complete-operational`,
      payload: {}
    }
  }

  return null
}

const DoctorAppointmentLifecycleControls = ({ appointment, onTransition, onCancel, onNoShow }) => {
  const status = getAppointmentOperationalStatus(appointment)
  const lifecycleAction = lifecycleActionFor(appointment, status)

  if (!lifecycleAction) return <AppointmentStatusBadge status={status} />

  // Only DOM-safe button props are passed below. Lifecycle metadata stays in this component.
  const { label, className, endpoint, payload } = lifecycleAction

  return (
    <div className='flex flex-wrap gap-1'>
      <button type='button' className={className} onClick={() => onTransition({ endpoint, payload })}>{label}</button>
      {status === 'scheduled' && onNoShow && <button type='button' className='portal-button-secondary text-xs' onClick={() => onNoShow(appointment._id)}>No-show</button>}
      {status === 'scheduled' && onCancel && <button type='button' className='portal-button-secondary text-xs' onClick={() => onCancel(appointment._id)}>Cancel</button>}
    </div>
  )
}

export default DoctorAppointmentLifecycleControls
