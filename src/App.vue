<script setup>
import { computed, onMounted, ref } from 'vue'
import { clearCompletedTodos, getTodos, removeTodo, saveTodo } from './db.js'

const todos = ref([])
const draft = ref('')
const filter = ref('all')
const input = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const darkMode = ref(localStorage.getItem('daylist-theme') !== 'light')
const styleOptions = [
  { id: 'midnight', name: 'Midnight', description: 'The current calm, blue look' },
  { id: 'eighties', name: '80s After Hours', description: 'Neon color and retro glow' },
  { id: 'futuristic', name: 'Futuristic', description: 'Cool light and crisp edges' },
  { id: 'cartoon', name: 'Cartoon', description: 'Playful color and bold outlines' },
  { id: 'hyrule', name: 'Hyrule Quest', description: 'Forest green and legendary adventure' },
]
const savedStyle = localStorage.getItem('daylist-style')
const selectedStyle = ref(styleOptions.some((style) => style.id === savedStyle) ? savedStyle : 'midnight')
const styleOpen = ref(false)
const currentStyle = computed(() => styleOptions.find((style) => style.id === selectedStyle.value))

const filters = [
  { id: 'all', label: 'All tasks' },
  { id: 'active', label: 'To do' },
  { id: 'completed', label: 'Completed' },
]

const visibleTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter((todo) => !todo.completed)
  if (filter.value === 'completed') return todos.value.filter((todo) => todo.completed)
  return todos.value
})

const remaining = computed(() => todos.value.filter((todo) => !todo.completed).length)
const completedCount = computed(() => todos.value.length - remaining.value)
const todayLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

function toggleTheme() {
  darkMode.value = !darkMode.value
  localStorage.setItem('daylist-theme', darkMode.value ? 'dark' : 'light')
}

function chooseStyle(styleId) {
  selectedStyle.value = styleId
  localStorage.setItem('daylist-style', styleId)
  styleOpen.value = false
}

onMounted(async () => {
  try {
    todos.value = (await getTodos()).sort((a, b) => a.createdAt - b.createdAt)
  } catch (error) {
    errorMessage.value = error.message || 'Your tasks could not be loaded.'
  } finally {
    loading.value = false
  }
})

async function addTodo() {
  const title = draft.value.trim()
  if (!title) {
    input.value?.focus()
    return
  }

  const todo = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    completed: false,
    createdAt: Date.now(),
  }

  try {
    await saveTodo(todo)
    todos.value.push(todo)
    draft.value = ''
    errorMessage.value = ''
    input.value?.focus()
  } catch (error) {
    errorMessage.value = error.message || 'Your task could not be saved.'
  }
}

async function toggleTodo(todo) {
  const updated = { ...todo, completed: !todo.completed }
  try {
    await saveTodo(updated)
    todos.value = todos.value.map((item) => item.id === todo.id ? updated : item)
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error.message || 'Your task could not be updated.'
  }
}

async function deleteTodo(todo) {
  try {
    await removeTodo(todo.id)
    todos.value = todos.value.filter((item) => item.id !== todo.id)
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error.message || 'Your task could not be deleted.'
  }
}

async function clearCompleted() {
  try {
    await clearCompletedTodos()
    todos.value = todos.value.filter((todo) => !todo.completed)
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error.message || 'Completed tasks could not be cleared.'
  }
}
</script>

<template>
  <div class="app-root" :class="[{ 'theme-light': !darkMode }, `style-${selectedStyle}`]">
  <main class="page-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="Daylist home">
        <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
        <span>daylist</span>
      </a>
      <div class="topbar-actions">
        <div class="local-note"><span class="status-dot"></span>{{ selectedStyle === 'futuristic' ? 'Droid link stable' : selectedStyle === 'cartoon' ? 'Task buddies on duty' : selectedStyle === 'eighties' ? 'Neon open · 24/7' : selectedStyle === 'hyrule' ? 'Navi is nearby' : 'Saved on this device' }}</div>
        <button class="login-button" type="button" disabled aria-label="Log in, coming soon">Log in</button>
        <div class="style-picker" @keydown.esc="styleOpen = false">
          <button class="style-picker-trigger" type="button" :aria-expanded="styleOpen" @click="styleOpen = !styleOpen">
            <span class="style-trigger-label">Style</span>
            <span class="style-current-name">{{ currentStyle.name }}</span>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
          </button>
          <div v-if="styleOpen" class="style-menu" role="group" aria-label="Choose a visual style">
            <div class="style-menu-heading">Choose a style</div>
            <button
              v-for="style in styleOptions"
              :key="style.id"
              class="style-option"
              :class="{ selected: selectedStyle === style.id }"
              type="button"
              :aria-pressed="selectedStyle === style.id"
              @click="chooseStyle(style.id)"
            >
              <span class="style-swatch" :class="`swatch-${style.id}`" aria-hidden="true"></span>
              <span class="style-option-copy"><span class="style-option-name">{{ style.name }}</span><span class="style-option-description">{{ style.description }}</span></span>
              <svg v-if="selectedStyle === style.id" class="style-selected-check" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3.1 3.1L13 4.5" /></svg>
            </button>
          </div>
        </div>
        <button class="theme-toggle" type="button" :aria-label="darkMode ? 'Switch to light mode' : 'Switch to dark mode'" :aria-pressed="darkMode" @click="toggleTheme">
          <svg v-if="darkMode" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.5" /><path d="M10 1.8v2M10 16.2v2M18.2 10h-2M3.8 10h-2m14-5.8-1.4 1.4m-8.8 8.8-1.4 1.4m11.6 0-1.4-1.4M5.2 5.2 3.8 3.8" /></svg>
          <svg v-else viewBox="0 0 20 20" aria-hidden="true"><path d="M16.8 12.2A7.1 7.1 0 0 1 7.8 3.2a7.2 7.2 0 1 0 9 9Z" /></svg>
        </button>
      </div>
    </header>

    <section class="todo-card" aria-labelledby="page-title">
      <div class="card-heading">
        <div v-if="selectedStyle === 'futuristic'" class="future-kicker"><span></span> TEMPORAL OPERATIONS <b>//</b> CHRONO-LINK 07 <i class="future-sidekick" aria-hidden="true"><i></i><i></i><b></b></i></div>
        <div v-if="selectedStyle === 'cartoon'" class="cartoon-kicker"><span class="cartoon-spark">✦</span> THE TASK BUDDIES CLUB <span class="cartoon-mascot-mini" aria-hidden="true">☺</span></div>
        <div v-if="selectedStyle === 'hyrule'" class="hyrule-kicker"><svg viewBox="0 0 36 32" aria-hidden="true"><path d="M18 2 10.5 15h15L18 2Zm-9 16-7 12h14L9 18Zm18 0-7 12h14l-7-12Z" /></svg> HYRULE FIELD JOURNAL <b>·</b> QUEST LOG</div>
        <div v-if="selectedStyle === 'eighties'" class="eighties-kicker"><span class="equalizer"><i></i><i></i><i></i><i></i></span> AFTER HOURS <b>•</b> NEON NIGHTS <span class="kicker-record" aria-hidden="true"></span></div>
        <div class="date-label">{{ selectedStyle === 'futuristic' ? `TIME INDEX // ${todayLabel}` : selectedStyle === 'eighties' ? `NIGHT SHIFT // ${todayLabel}` : todayLabel }}</div>
        <h1 v-if="selectedStyle === 'futuristic'" id="page-title">Your next move,<br /><span>across time.</span></h1>
        <h1 v-else-if="selectedStyle === 'cartoon'" id="page-title">The to-do crew,<br /><span>reporting in!</span></h1>
        <h1 v-else-if="selectedStyle === 'eighties'" id="page-title">Make tonight<br /><span>legendary.</span></h1>
        <h1 v-else-if="selectedStyle === 'hyrule'" id="page-title">A new quest<br /><span>awaits.</span></h1>
        <h1 v-else id="page-title">A little more<br /><span>organized.</span></h1>
        <p class="intro">{{ selectedStyle === 'futuristic' ? 'Set your course. Your droid crew is standing by.' : selectedStyle === 'cartoon' ? 'Tiny steps, big adventure. Snacks optional.' : selectedStyle === 'eighties' ? 'Queue up a task. Cue the montage.' : selectedStyle === 'hyrule' ? 'Gather your courage. The forest is listening.' : 'Make room for what matters today.' }}</p>
      </div>

      <form class="add-form" @submit.prevent="addTodo">
        <label class="sr-only" for="new-task">Add a task</label>
        <span class="add-plus" aria-hidden="true">+</span>
        <input
          id="new-task"
          ref="input"
          v-model="draft"
          type="text"
          maxlength="180"
          placeholder="What needs to get done?"
          autocomplete="off"
        />
        <button class="add-button" type="submit" :disabled="!draft.trim()">Add task</button>
      </form>

      <div v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</div>

      <div class="list-toolbar">
        <div class="filter-tabs" role="tablist" aria-label="Filter tasks">
          <button
            v-for="item in filters"
            :key="item.id"
            type="button"
            role="tab"
            :aria-selected="filter === item.id"
            :class="['filter-tab', { selected: filter === item.id }]"
            @click="filter = item.id"
          >{{ item.label }}<span class="count-pill">{{ item.id === 'all' ? todos.length : item.id === 'active' ? remaining : completedCount }}</span></button>
        </div>
        <span class="task-count">{{ remaining }} {{ remaining === 1 ? 'task' : 'tasks' }} left</span>
      </div>

      <div v-if="loading" class="empty-state loading-state" aria-live="polite">
        <span class="loader" aria-hidden="true"></span>
        <p>Getting things ready…</p>
      </div>

      <ul v-else-if="visibleTodos.length" class="todo-list">
        <li v-for="todo in visibleTodos" :key="todo.id" :class="['todo-item', { done: todo.completed }]">
          <button
            class="check-button"
            type="button"
            :aria-label="todo.completed ? `Mark ${todo.title} as to do` : `Complete ${todo.title}`"
            :aria-pressed="todo.completed"
            @click="toggleTodo(todo)"
          ><svg v-if="todo.completed" viewBox="0 0 16 16" aria-hidden="true"><path d="m3.2 8.2 3.1 3.1 6.5-6.6" /></svg></button>
          <span class="todo-title">{{ todo.title }}</span>
          <button class="delete-button" type="button" :aria-label="`Delete ${todo.title}`" @click="deleteTodo(todo)">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 6.5v9h9v-9M4 5h12M8 5V3.5h4V5m-3 3v5m2-5v5" /></svg>
          </button>
        </li>
      </ul>

      <div v-else class="empty-state">
        <div v-if="selectedStyle === 'futuristic'" class="robot-illustration" aria-hidden="true">
          <span class="time-orbit orbit-one"></span><span class="time-orbit orbit-two"></span>
          <span class="robot-scout"><i></i><i></i></span>
          <svg class="crew-droid" viewBox="0 0 120 112">
            <path class="droid-antenna" d="M60 13V7m0 0-9-4m9 4 9-4" />
            <circle class="droid-signal" cx="60" cy="6" r="3" />
            <path class="droid-ear" d="M26 43h-8v25h8m68-25h8v25h-8" />
            <rect class="droid-head" x="28" y="20" width="64" height="59" rx="18" />
            <rect class="droid-face" x="36" y="29" width="48" height="39" rx="12" />
            <circle class="droid-eye" cx="50" cy="46" r="4" /><circle class="droid-eye" cx="70" cy="46" r="4" />
            <path class="droid-mouth" d="M51 57h18" />
            <path class="droid-neck" d="M54 79v7m12-7v7" />
            <path class="droid-body" d="M37 105V96c0-7 6-11 13-11h20c7 0 13 4 13 11v9" />
            <path class="droid-detail" d="M49 94h22m-11-8v9" />
          </svg>
        </div>
        <div v-else-if="selectedStyle === 'cartoon'" class="cartoon-scene" aria-hidden="true">
          <span class="cartoon-speech">We got this!</span>
          <span class="cartoon-pop pop-one">✦</span><span class="cartoon-pop pop-two">✧</span>
          <svg class="task-buddy" viewBox="0 0 160 125">
            <ellipse class="buddy-shadow" cx="78" cy="113" rx="37" ry="6" />
            <path class="buddy-arm" d="M42 75c-17 5-20 19-28 16-7-3 0-13 8-18m96-2c14-10 23-7 25-15 2-7-9-8-14-1" />
            <path class="buddy-body" d="M43 98c-7-9-12-21-10-36 2-21 20-35 43-35 24 0 42 14 44 36 2 16-4 28-11 37-8 9-56 9-66-2Z" />
            <path class="buddy-patch" d="M58 84c8-5 26-5 37 0l6 13H52l6-13Z" />
            <path class="buddy-brow" d="m55 49 12-3m17 0 12 3" />
            <ellipse class="buddy-eye" cx="62" cy="59" rx="7" ry="9" /><ellipse class="buddy-eye" cx="90" cy="59" rx="7" ry="9" />
            <circle class="buddy-pupil" cx="64" cy="61" r="3" /><circle class="buddy-pupil" cx="88" cy="61" r="3" />
            <path class="buddy-smile" d="M64 72c8 10 18 10 26 0" />
            <path class="buddy-cheek" d="M46 68h7m54 0h7" />
            <path class="buddy-foot" d="M57 101c-2 7-10 7-15 7m53-7c2 7 10 7 15 7" />
            <path class="buddy-stem" d="M75 28c-7-11-1-18 7-16 6 2 6 8 0 13" />
            <path class="buddy-leaf" d="M81 19c5-9 12-8 13-3-4 5-8 6-13 3Z" />
          </svg>
          <span class="cartoon-sidekick"><i></i><i></i><b></b></span>
        </div>
        <div v-else-if="selectedStyle === 'eighties'" class="eighties-scene" aria-hidden="true">
          <span class="scene-star star-a">✦</span><span class="scene-star star-b">✧</span><span class="scene-star star-c">✦</span>
          <svg class="retro-scene-art" viewBox="0 0 220 150">
            <circle class="sunset" cx="111" cy="76" r="47" />
            <path class="sunset-line" d="M69 72h84M67 82h88M72 93h78M80 104h62" />
            <path class="diner" d="M13 64h50v39H13z" /><path class="diner-roof" d="M9 62h58l-7-11H17z" />
            <path class="awning" d="M14 63h48v8H14z" /><path class="awning-stripe" d="M23 63v8m12-8v8m12-8v8m12-8v8" />
            <path class="diner-window" d="M20 77h15v17H20zm22 0h14v17H42z" />
            <path class="diner-door" d="M29 72v-8m18 8v-8" />
            <text class="diner-sign" x="38" y="106" text-anchor="middle">OPEN</text>
            <path class="jukebox-case" d="M77 101V49c0-19 13-32 31-32s31 13 31 32v52z" />
            <path class="jukebox-arch" d="M84 52c0-15 10-26 24-26s24 11 24 26v8H84z" />
            <path class="jukebox-glass" d="M89 53c0-12 8-21 19-21s19 9 19 21v4H89z" />
            <path class="jukebox-beam" d="m100 55 8-20 8 20m-22-7 27 9" />
            <path class="jukebox-panel" d="M84 65h48v7H84z" />
            <circle class="jukebox-button" cx="91" cy="68.5" r="1.3" /><circle class="jukebox-button" cx="99" cy="68.5" r="1.3" /><circle class="jukebox-button" cx="107" cy="68.5" r="1.3" /><circle class="jukebox-button" cx="115" cy="68.5" r="1.3" /><circle class="jukebox-button" cx="123" cy="68.5" r="1.3" />
            <path class="speaker-grill" d="M87 80v13m7-13v13m7-13v13m7-13v13m7-13v13m7-13v13m7-13v13" />
            <circle class="vinyl" cx="174" cy="69" r="26" /><circle class="vinyl-groove" cx="174" cy="69" r="19" /><circle class="vinyl-groove" cx="174" cy="69" r="13" /><circle class="vinyl-label" cx="174" cy="69" r="6" />
            <path class="arcade" d="M174 103V88l4-6h21l4 6v15z" /><path class="arcade-screen" d="M179 88h19v11h-19z" /><circle class="arcade-stick" cx="184" cy="101" r="1.7" /><circle class="arcade-button" cx="193" cy="101" r="1.4" />
            <path class="road" d="M22 119h179" />
            <path class="car-body" d="M42 113h7l8-10h22l11 10h8c4 0 6 3 6 7v3H37v-4c0-3 2-6 5-6Z" />
            <path class="car-window" d="m61 106-6 7h16v-7zm14 0v7h15l-8-7z" />
            <circle class="car-wheel" cx="52" cy="122" r="5" /><circle class="car-wheel" cx="91" cy="122" r="5" />
            <circle class="wheel-hub" cx="52" cy="122" r="1.8" /><circle class="wheel-hub" cx="91" cy="122" r="1.8" />
          </svg>
        </div>
        <div v-else-if="selectedStyle === 'hyrule'" class="hyrule-scene" aria-hidden="true">
          <svg class="hyrule-art" viewBox="0 0 220 132">
            <path class="forest-hill" d="M0 113c27-17 45-13 67-4 27-17 49-17 75-3 26-15 50-13 78-1v27H0z" />
            <path class="tree-back" d="m15 105 13-34 13 34m-7-15h12m133 15 14-38 14 38m-8-17h14" />
            <path class="tree-front" d="m2 112 12-28 12 28m166 0 12-31 14 31" />
            <path class="ground-line" d="M36 118h148" />
            <path class="stone" d="m91 117 4-13 9-6h15l10 6 3 13z" />
            <path class="sword-blade" d="m107 96 4-55 5 0 4 55-6 8z" />
            <path class="sword-edge" d="m113 42-3 52m6-52 3 52" />
            <path class="sword-guard" d="M98 97h31l-4 6h-23z" />
            <path class="sword-grip" d="M110 103h7v14h-7z" />
            <path class="sword-pommel" d="m107 117 6-4 7 4-7 5z" />
            <circle class="sword-gem" cx="113.5" cy="100" r="2.4" />
            <path class="triforce" d="m113 11-8 14h16l-8-14Zm-10 18-8 14h16l-8-14Zm20 0-8 14h16l-8-14Z" />
            <path class="fairy-wing" d="M155 54c-12-13-20 0-8 7-13 7-2 18 8 7m2-14c12-13 20 0 8 7 13 7 2 18-8 7" />
            <circle class="fairy-core" cx="156" cy="65" r="5" />
            <circle class="fairy-glow" cx="156" cy="65" r="12" />
            <path class="leaf-mark" d="M56 60c-7-10-1-16 7-13-1 8-2 10-7 13Zm-2-3 9-7m96 40c-6-9 0-15 8-12-1 7-3 10-8 12Zm-1-3 9-7" />
          </svg>
          <div class="goddess-sigils">
            <span class="goddess-sigil" title="Din"><svg viewBox="0 0 20 20"><path d="M10 2c4 4 5 7 2 10 0-3-2-3-2-6-4 4-5 8-1 11 4 2 8-1 7-5" /></svg></span>
            <span class="goddess-sigil" title="Nayru"><svg viewBox="0 0 20 20"><path d="M2 8c3-4 5 4 8 0s5 4 8 0M2 13c3-4 5 4 8 0s5 4 8 0" /></svg></span>
            <span class="goddess-sigil" title="Farore"><svg viewBox="0 0 20 20"><path d="M10 2c5 0 8 4 8 8s-3 8-8 8-8-4-8-8 3-8 8-8Zm0 4c-3 0-4 2-4 4s1 4 4 4 4-2 4-4-1-4-4-4Z" /></svg></span>
          </div>
          <div class="goddess-labels"><span>DIN</span><span>NAYRU</span><span>FARORE</span></div>
          <span class="fairy-sparkle fairy-sparkle-one">✦</span><span class="fairy-sparkle fairy-sparkle-two">✧</span>
        </div>
        <div v-else class="empty-illustration" aria-hidden="true"><span class="sun"></span><span class="paper"><i></i><i></i><i></i></span><span class="sparkle">✳</span></div>
        <h2>{{ selectedStyle === 'futuristic' ? (filter === 'completed' ? 'Archive is standing by' : filter === 'active' ? 'Timeline clear' : 'Awaiting your directive') : selectedStyle === 'cartoon' ? (filter === 'completed' ? 'Hall of done!' : filter === 'active' ? 'All clear, superstar!' : 'Ready, set, little task!') : selectedStyle === 'eighties' ? (filter === 'completed' ? 'Top hits, all done!' : filter === 'active' ? 'Encore! The queue is clear.' : 'Side A: your first track') : selectedStyle === 'hyrule' ? (filter === 'completed' ? 'Triumphs of the realm' : filter === 'active' ? 'The path is clear' : 'Hey! Listen—your quest awaits') : filter === 'completed' ? 'Nothing checked off yet' : filter === 'active' ? 'You’re all caught up' : 'Start with one small thing' }}</h2>
        <p>{{ selectedStyle === 'futuristic' ? (filter === 'completed' ? 'Completed missions will be stored here.' : filter === 'active' ? 'No active missions detected. Nice work, captain.' : 'Add a mission and your droid crew will log it.') : selectedStyle === 'cartoon' ? (filter === 'completed' ? 'Your tiny triumphs get their own standing ovation.' : filter === 'active' ? 'The task buddies checked twice. Nothing left to do!' : 'Add a task. The gang promises not to eat the checklist.') : selectedStyle === 'eighties' ? (filter === 'completed' ? 'Your greatest hits are saved for the encore.' : filter === 'active' ? 'Take a victory lap. You earned it.' : 'Drop in a task. The jukebox is all yours.') : selectedStyle === 'hyrule' ? (filter === 'completed' ? 'The sages will remember these deeds.' : filter === 'active' ? 'Take a breath, hero. You have earned it.' : 'Add a quest. Navi will keep watch.') : filter === 'completed' ? 'Finished tasks will find a home here.' : filter === 'active' ? 'Enjoy the breathing room. You’ve earned it.' : 'Add a task above and make today yours.' }}</p>
      </div>

      <footer class="card-footer">
        <div class="progress-copy"><span class="progress-check">✓</span><span>{{ todos.length === 0 ? 'A fresh start' : completedCount === todos.length ? 'All done for today' : `${completedCount} of ${todos.length} complete` }}</span></div>
        <button v-if="completedCount" class="clear-button" type="button" @click="clearCompleted">Clear completed</button>
        <span v-else class="storage-hint"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 13 4v3.7c0 3-2.1 5.1-5 6.5-2.9-1.4-5-3.5-5-6.5V4l5-2.2Z" /><path d="m5.7 7.8 1.5 1.5 3.2-3.2" /></svg>{{ selectedStyle === 'futuristic' ? 'Local time capsule' : selectedStyle === 'cartoon' ? 'Secretly saved right here' : selectedStyle === 'eighties' ? 'Local mix · no streaming needed' : selectedStyle === 'hyrule' ? 'Saved safely in this realm' : 'Private & local' }}</span>
      </footer>
    </section>

    <p class="page-footnote">A calmer way to get things done <span>·</span> No account needed</p>
  </main>
  </div>
</template>
