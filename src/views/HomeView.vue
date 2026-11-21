<script setup>
import { computed, reactive, ref } from 'vue';
import { useDocs } from '../hooks/useDocs';
import { SEARCH_MODES, collectMatchedKeys, filterTree } from '../hooks/useDocSearch';
import DocTree from '../components/DocTree.vue';
import SearchBar from '../components/SearchBar.vue';

const { listDocTree } = useDocs();
const fullTree = listDocTree();

// 折叠状态表由总览页统一持有；key 为目录路径，true 表示折叠
const state = reactive(Object.fromEntries(fullTree.dirs.map((key) => [key, true])));

// 搜索状态：只有点击 Search 提交后才赋值；query 为空表示未筛选（显示全部）
const activeMode = ref(SEARCH_MODES.NAME);
const activeQuery = ref('');

/** 当前展示的树：未提交搜索时是完整树，提交后是按条件过滤出的子树 */
const displayTree = computed(() => {
  if (!activeQuery.value) return fullTree;
  const matched = collectMatchedKeys(fullTree.root.children, activeMode.value, activeQuery.value);
  const root = filterTree(fullTree.root, matched);
  if (!root) return { root: { type: 'dir', name: 'docs', key: '', children: [], count: 0 }, total: 0, dirs: [] };
  return { root, total: matched.size, dirs: collectDirKeys(root.children) };
});

/** 递归收集树的目录 key（用于当前结果的全折叠 / 全展开） */
function collectDirKeys(nodes, keys = []) {
  for (const node of nodes) {
    if (node.type === 'dir') {
      keys.push(node.key);
      collectDirKeys(node.children, keys);
    }
  }
  return keys;
}

/** 文档 key（如 guide/advanced/foo）的所有祖先目录 key */
function ancestorDirKeys(key) {
  const parts = key.split('/');
  const keys = [];
  for (let i = 1; i < parts.length; i++) keys.push(parts.slice(0, i).join('/'));
  return keys;
}

/** 提交搜索：记录条件，并展开命中文档所在的目录，保证结果可见 */
function handleSearch({ mode, query }) {
  activeMode.value = mode;
  activeQuery.value = query;
  if (!query) return;
  const matched = collectMatchedKeys(fullTree.root.children, mode, query);
  matched.forEach((key) => ancestorDirKeys(key).forEach((dir) => { delete state[dir]; }));
}

const dirs = computed(() => displayTree.value.dirs);
const hasCollapsed = computed(() => dirs.value.some((key) => state[key]));
const allCollapsed = computed(() =>
  dirs.value.length > 0 && dirs.value.every((key) => state[key]));

const collapseAll = () => dirs.value.forEach((key) => { state[key] = true; });
const expandAll = () => dirs.value.forEach((key) => { delete state[key]; });

const isSearching = computed(() => Boolean(activeQuery.value));
</script>

<template>
  <div class="page page--narrow">
    <h1 class="page-title">Documents Overview</h1>
    <p class="page-subtitle">
      Listed all the documents in <code>./docs</code>, {{ fullTree.total }} files in total、{{ fullTree.dirs.length }} directories in total。
    </p>

    <SearchBar @search="handleSearch" />

    <p v-if="isSearching" class="search-result-hint">
      <template v-if="displayTree.total">
        Found <strong>{{ displayTree.total }}</strong> document{{ displayTree.total === 1 ? '' : 's' }}
        matching <code>{{ activeQuery }}</code> by {{ activeMode === 'tag' ? 'tag' : 'name' }}。
      </template>
      <template v-else>
        No document matched <code>{{ activeQuery }}</code> by {{ activeMode === 'tag' ? 'tag' : 'name' }}。
      </template>
    </p>

    <div v-if="displayTree.total" class="gh-card doc-tree-card">
      <div class="doc-tree-header">
        <svg class="tree-root-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1V1.5h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.249.249 0 0 0 .3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
        </svg>
        <span class="tree-root-name">docs</span>
        <span class="tree-root-slash">/</span>
        <span class="tree-header-meta">{{ displayTree.total }} documents</span>
        <div class="doc-tree-actions">
          <button class="gh-btn" type="button" :disabled="!hasCollapsed" @click="expandAll">Unfold all</button>
          <button class="gh-btn" type="button" :disabled="allCollapsed" @click="collapseAll">Fold all</button>
        </div>
      </div>

      <DocTree :nodes="displayTree.root.children" :state="state" />
    </div>

    <div v-else class="gh-card">
      <div class="gh-card-body">
        <template v-if="isSearching">
          No document matched <code>{{ activeQuery }}</code>. Try a different keyword or clear the search.
        </template>
        <template v-else>
          <code>./docs</code> is empty, put some Markdown documents here.
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-result-hint {
  margin: -8px 0 16px;
  font-size: 14px;
  color: var(--gh-fg-muted);
}

.search-result-hint strong {
  color: var(--gh-fg);
}
</style>
