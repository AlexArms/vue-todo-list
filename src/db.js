const DB_NAME = 'daylist'
const DB_VERSION = 1
const STORE_NAME = 'todos'

let databasePromise

function openDatabase() {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('This browser does not support IndexedDB.'))
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'))
      request.onblocked = () => reject(new Error('Close other Daylist tabs to finish updating local storage.'))
    }).catch((error) => {
      databasePromise = undefined
      throw error
    })
  }

  return databasePromise
}

async function withStore(mode, action) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    let result

    try {
      result = action(store)
    } catch (error) {
      reject(error)
      return
    }

    transaction.oncomplete = () => resolve(result?.result)
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save your changes.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('The change was cancelled.'))
  })
}

export async function getTodos() {
  return withStore('readonly', (store) => store.getAll())
}

export async function saveTodo(todo) {
  return withStore('readwrite', (store) => store.put(todo))
}

export async function removeTodo(id) {
  return withStore('readwrite', (store) => store.delete(id))
}

export async function clearCompletedTodos() {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.openCursor()

    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) return
      if (cursor.value.completed) cursor.delete()
      cursor.continue()
    }

    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not clear completed tasks.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('The change was cancelled.'))
  })
}
