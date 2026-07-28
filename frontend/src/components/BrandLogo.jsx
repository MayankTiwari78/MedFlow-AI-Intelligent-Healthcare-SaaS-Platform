const BrandLogo = ({ onClick, compact = false, dark = false }) => {
  const content = (
    <>
      <span className='relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0A8B98] text-sm font-bold text-white shadow-[0_8px_18px_rgba(8,139,152,0.28)]'>
        MF
        <span className='absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-teal' />
      </span>
      <span className='text-left leading-none'>
        <span className={`block text-xl font-bold ${dark ? 'text-white' : 'text-ink'}`}>MedFlow <span className='text-[#4BE1D3]'>AI</span></span>
        {!compact && <span className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-300' : 'text-slate-500'}`}>Connected healthcare</span>}
      </span>
    </>
  )

  return onClick ? (
    <button type='button' onClick={onClick} className='flex items-center gap-3' aria-label='Go to MedFlow AI home'>
      {content}
    </button>
  ) : <div className='flex items-center gap-3'>{content}</div>
}

export default BrandLogo
