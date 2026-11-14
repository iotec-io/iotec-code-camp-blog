import { Toaster } from '@/components/ui/toaster'
import { RouterProvider } from './navigation/RouterContext'
import { AppRouter } from './navigation/routes'

function App() {
  return (
    <RouterProvider>
      <AppRouter />
      <Toaster />
    </RouterProvider>
  )
}

export default App
