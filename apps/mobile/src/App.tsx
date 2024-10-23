import { useReplicache } from '@repo/lib/hooks'
import { TodoList } from '@repo/ui'
import './index.css'

function App() {
  const rep = useReplicache({
    baseURL: import.meta.env.VITE_WEB_BASE_URL,
    licenseKey: import.meta.env.VITE_REPLICACHE_LICENSE_KEY,
  })

  if (!rep) {
    return <div>Loading...</div>
  }

  return (
    <main className="container px-10 py-20">
      <h1 className="text-2xl">
        Welcome to Tauri + React + Replicache + EdgeDB
      </h1>

      <TodoList rep={rep} />
    </main>
  )
}

export default App
