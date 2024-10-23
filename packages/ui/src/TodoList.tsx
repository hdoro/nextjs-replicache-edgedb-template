import type { Todo } from '@repo/db/schema'
import { generate_replicache_id, REPLICACHE_ID_PREFIXES } from '@repo/lib'
import { M } from '@repo/lib/mutators/client'
import React, { useState } from 'react'
import { ReadTransaction, Replicache } from 'replicache'
import { useSubscribe } from 'replicache-react'
import { DeleteIcon } from './DeleteIcon'

export async function listTodos(tx: ReadTransaction) {
  return (await tx
    .scan({ prefix: REPLICACHE_ID_PREFIXES.todo })
    .values()
    .toArray()) as unknown as Todo[]
}

export const TodoList = ({ rep }: { rep: Replicache<M> }) => {
  const [newTask, setNewTask] = useState('')

  // Subscribe to all todos and sort them from newest to oldest
  const todos = useSubscribe(rep, listTodos, { default: [] })
  todos.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const handleNewItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newTask) {
      return
    }

    rep.mutate.createTodo({
      content: newTask,
      complete: false,
      replicache_id: generate_replicache_id(REPLICACHE_ID_PREFIXES.todo),
      created_at: new Date(),
    })
    setNewTask('')
  }

  const handleDeleteTodo = (replicache_id: string) => {
    void rep.mutate.deleteTodo({ replicache_id })
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-4 shadow-md">
      <h1 className="mb-4 text-2xl font-bold">To-Do List</h1>
      <form className="mb-4" onSubmit={handleNewItem}>
        <input
          type="text"
          placeholder="Add a new task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="hover:bg-primary-hover mt-2 rounded-md bg-black px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          disabled={!newTask}
        >
          Add Task
        </button>
      </form>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.replicache_id}
            className="flex items-center justify-between rounded-md bg-gray-100 px-4 py-2"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={todo.complete}
                onChange={() =>
                  rep.mutate.updateTodo({
                    replicache_id: todo.replicache_id,
                    complete: !todo.complete,
                  })
                }
                className="mr-2 rounded-sm focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={todo.content || ''}
                className={`bg-transparent text-gray-800 ${todo.complete ? 'text-gray-400 line-through' : ''}`}
                onChange={(e) =>
                  rep.mutate.updateTodo({
                    replicache_id: todo.replicache_id,
                    content: e.target.value,
                  })
                }
              />
            </div>
            <button
              onClick={() => handleDeleteTodo(todo.replicache_id)}
              className="text-red-500 hover:text-red-600"
            >
              <DeleteIcon className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}