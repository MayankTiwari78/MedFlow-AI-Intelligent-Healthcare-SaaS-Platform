import axios from 'axios'
import { useContext, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'

const ResetPassword = () => {
  const { backendUrl } = useContext(AppContext)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const token = searchParams.get('token') || ''
      const { data } = await axios.post(
        backendUrl + '/api/v1/auth/reset-password',
        { token, password, confirmPassword },
        { withCredentials: true }
      )
      toast.success(data.message)
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[70vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>New Password</p>
        <div className='w-full'>
          <p>Password</p>
          <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-[#DADADA] rounded w-full p-2 mt-1' type='password' required />
        </div>
        <div className='w-full'>
          <p>Confirm Password</p>
          <input onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} className='border border-[#DADADA] rounded w-full p-2 mt-1' type='password' required />
        </div>
        <button disabled={loading} className='bg-primary disabled:opacity-60 text-white w-full py-2 my-2 rounded-md text-base'>{loading ? 'Please wait...' : 'Update password'}</button>
        <Link className='text-primary underline' to='/login'>Back to login</Link>
      </div>
    </form>
  )
}

export default ResetPassword
