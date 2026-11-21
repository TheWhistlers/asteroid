<script setup>
import { computed, ref } from 'vue';
import { SEARCH_MODE_OPTIONS, SEARCH_MODES } from '../hooks/useDocSearch';

const emit = defineEmits(['search']);

const mode = ref(SEARCH_MODES.NAME);
const query = ref('');

const placeholder = computed(() =>
  mode.value === SEARCH_MODES.TAG
    ? 'By tags joined by + e.g. Vue+Vite'
    : 'By names patterned with * and ? e.g. Hello*'
)

const submit = () => emit('search', { mode: mode.value, query: query.value.trim() })
</script>

<template>
  <form class="search-bar" role="search" @submit.prevent="submit">
    <label class="sr-only" for="search-mode">Match pattern</label>
    <select
      id="search-mode"
      v-model="mode"
      class="search-select"
      aria-label="Match pattern"
    >
      <option v-for="option in SEARCH_MODE_OPTIONS" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <label class="sr-only" for="search-query">Match content</label>
    <input
      id="search-query"
      v-model="query"
      class="search-input"
      type="text"
      :placeholder="placeholder"
      autocomplete="off"
      aria-label="Match content"
    />

    <button class="gh-btn search-submit" type="submit">Search</button>
  </form>
</template>

<style scoped lang="scss">
.search-bar {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin: 0 0 20px;
}

.search-select,
.search-input {
  height: 34px;
  padding: 0 12px;
  font-size: 14px;
  color: var(--gh-fg);
  background-color: var(--gh-canvas);
  border: 1px solid var(--gh-border);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    border-color: var(--gh-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--gh-accent) 25%, transparent);
  }

  &::placeholder {
    color: var(--gh-fg-muted);
  }
}

.search-select {
  flex: none;
  cursor: pointer;
  padding-right: 28px;
}

.search-input {
  flex: 1;
  min-width: 0;
}

.search-submit {
  flex: none;
  justify-content: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 600px) {
  .search-bar {
    flex-wrap: wrap;
  }

  .search-input {
    flex-basis: 100%;
  }
}
</style>
