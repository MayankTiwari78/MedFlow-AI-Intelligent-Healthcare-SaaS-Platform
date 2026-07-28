const AuthShell = ({ eyebrow, title, description, children }) => (
  <div className='mf-tech-grid relative min-h-[72vh] overflow-hidden rounded-[28px] bg-[#061928] py-7 sm:py-10'>
    <div className='absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#10B4B0]/25 blur-3xl' /><div className='absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-[#197FA7]/25 blur-3xl' />
    <div className='relative mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-white shadow-[0_22px_60px_rgba(0,0,0,.28)] md:grid-cols-[.9fr_1.1fr]'>
      <aside className='flex flex-col justify-between bg-[#08283B] p-7 text-white sm:p-10'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.16em] text-[#74D9D0]'>Protected access layer</p>
          <h2 className='mt-4 text-3xl font-semibold leading-[1.05] tracking-[-.03em]'>A secure entry point for your care workspace.</h2>
          <p className='mt-5 text-sm leading-7 text-slate-300'>Identity checks, secure sessions, and account controls help you manage access without adding friction.</p>
          <div className='mt-8 space-y-3 text-xs text-slate-200'><p className='rounded-xl border border-white/10 bg-white/5 px-4 py-3'>Private appointment workspace</p><p className='rounded-xl border border-white/10 bg-white/5 px-4 py-3'>Security controls in your account</p></div>
        </div>
        <p className='mt-10 text-xs text-slate-400'>MedFlow AI account security</p>
      </aside>
      <main className='p-7 sm:p-10'>
        <p className='mf-eyebrow'>{eyebrow}</p>
        <h1 className='mt-2 text-3xl font-semibold text-ink'>{title}</h1>
        {description && <p className='mt-3 text-sm leading-6 text-slate-600'>{description}</p>}
        <div className='mt-7'>{children}</div>
      </main>
    </div>
  </div>
)

export default AuthShell
