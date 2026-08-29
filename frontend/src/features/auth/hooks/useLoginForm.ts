import { useState, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/db/hooks'

/**
 * Hook to manage login form state and submission
 */
export function useLoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handlePasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setIsLoading(true)

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock successful login
        const user = {
          id: crypto.randomUUID(),
          email,
          name: email.split('@')[0] || 'User',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const token = 'mock-jwt-token'
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        login(user, token, expiresAt)

        // Navigate to home after successful login
        navigate({ to: '/$locale', params: { locale: 'en' } })
      } catch (error) {
        console.error('Login failed:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [email, login, navigate],
  )

  return {
    email,
    password,
    isLoading,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  }
}
