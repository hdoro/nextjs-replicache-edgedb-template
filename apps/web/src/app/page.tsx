'use client'

import { EdgeDB_Vercel } from '@repo/ui'
import { TodoList } from '@repo/ui'
import useReplicache from './useReplicache'

const HomePage = () => {
  const rep = useReplicache()

  if (!rep) {
    return <div>Loading...</div>
  }

  return (
    <div className="h-full">
      <nav className="px-8 pt-8">
        <a
          className="contents"
          href="https://github.com/edgedb/nextjs-replicache-edgedb-template"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/github.png"
            alt="GitHub"
            className="ml-auto block h-6 transform transition duration-300 ease-in-out hover:scale-105"
          />
        </a>
      </nav>
      <main className="flex h-full flex-col items-center justify-center space-y-10 px-4">
        <div className="mx-auto flex flex-col items-center justify-center text-center lg:max-w-md">
          <EdgeDB_Vercel />
          <h1 className="mt-2 bg-gradient-to-r from-[#259474] to-[#1A67FF] bg-clip-text py-2 text-2xl font-bold tracking-tight text-transparent sm:text-5xl">
            EdgeDB&nbsp;Replicache&nbsp;Template
          </h1>
          <p className="mt-4 text-base leading-7 text-gray-600">
            This is a starter template for building realtime, offline-first
            applications. It&apos;s a minimal todo app that demonstrates how to
            set up{' '}
            <a
              href="https://replicache.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Replicache
            </a>{' '}
            with{' '}
            <a
              href="https://edgedb.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              EdgeDB
            </a>
            .
          </p>
        </div>
        <TodoList rep={rep} />
      </main>
    </div>
  )
}

export default HomePage