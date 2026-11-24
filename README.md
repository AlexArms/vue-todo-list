# Daylist

A small Vue to-do list that stores tasks in the browser with the native IndexedDB API. It needs no application server or remote database; Vite is used only for local development and building static files.

## Run locally

Install the dependencies, then start the Vite development server:

```sh
npm install
npm run dev
```

To create static production files in `dist/`:

```sh
npm run build
```

Tasks are saved in the `daylist` IndexedDB database on the current browser profile and device. Clearing browser site data will remove them.
