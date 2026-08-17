
export const getErrorMessage = (error: unknown): string => { 
  if (error && typeof error === 'object' && '_data' in error) {
    const data = (error as any)._data
    if (data && typeof data === 'object' && 'message' in data) {
      return data.message as string
    }
  }


  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as any).response
    if (response && typeof response === 'object' && '_data' in response) {
      const data = response._data
      if (data && typeof data === 'object' && 'message' in data) {
        return data.message as string
      }
    }
    if (response && typeof response === 'object' && 'data' in response) {
      const data = response.data
      if (data && typeof data === 'object' && 'message' in data) {
        return data.message as string
      }
    }
  }


  if (error && typeof error === 'object' && 'message' in error) {
    return (error as any).message as string
  }


  return 'An unexpected error occurred. Please try again.'
}


export const useErrorHandler = () => {
  const toast = useToast()

  const handleError = (error: unknown) => {
    const message = getErrorMessage(error)
    toast.add({
      title: 'Error',
      description: message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }

  return {
    handleError,
    getErrorMessage
  }
}
