import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useProtectedPatientRoute } from '../hooks/useProtectedPatientRoute'

const Reminders = () => {
  const { authStatus, backendUrl, token } = useContext(AppContext)
  const [state, setState] = useState('loading'); const [items, setItems] = useState([]); const [error, setError] = useState('')
  useProtectedPatientRoute({ authStatus, token })
  const load = async () => { if (!token) return; setState('loading'); setError(''); try { const { data } = await axios.get(`${backendUrl}/api/user/reminders`, { headers: { token } }); setItems(data.reminders || []); setState('ready') } catch (err) { setError(err.response?.data?.message || 'We could not load reminders.'); setState('error') } }
  useEffect(() => { void load() }, [token])
  const read = async (id) => { await axios.patch(`${backendUrl}/api/user/reminders/${id}/read`, {}, { headers: { token } }); setItems((current) => current.map((item) => item._id === id ? { ...item, readAt: new Date().toISOString() } : item)) }
  if (state === 'loading') return <section className='py-10'><div className='mf-card h-56 animate-pulse bg-[#EAF3F4]' /></section>
  if (state === 'error') return <section className='py-10'><div className='mf-card p-8 text-center'><h1 className='mf-title'>Reminders unavailable</h1><p className='mt-2 mf-copy'>{error}</p><button className='mf-button mt-5' onClick={load}>Retry</button></div></section>
  return <section className='py-10'><div className='mb-8'><p className='mf-eyebrow'>Stay prepared</p><h1 className='mf-title'>Reminder centre</h1><p className='mf-copy'>In-app reminders from real appointments and follow-up plans.</p></div><div className='space-y-3'>{items.map((item) => <article className={`mf-card p-5 ${item.readAt ? 'opacity-70' : ''}`} key={item._id}><div className='flex flex-wrap items-center justify-between gap-3'><div><p className='font-semibold text-ink'>{item.title}</p><p className='mt-1 text-sm text-slate-600'>{item.body}</p><p className='mt-2 text-xs text-slate-500'>Due {new Date(item.dueAt).toLocaleString()}</p></div>{!item.readAt && <button className='mf-button-secondary' onClick={() => read(item._id)}>Mark read</button>}</div></article>)}</div>{items.length === 0 && <div className='mf-card p-10 text-center'><p className='font-semibold text-ink'>No reminders right now</p><p className='mt-2 text-sm text-slate-600'>New reminders will appear from confirmed care plans.</p></div>}</section>
}
export default Reminders
