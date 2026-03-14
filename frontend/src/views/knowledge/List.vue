<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex flex-row glass-header px-4 py-2.5 items-center justify-between">
					<div class="flex flex-row items-center">
						<Button variant="ghost" class="!px-1 mr-1 hover:bg-white/50" @click="router.back()">
							<FeatherIcon name="chevron-left" class="h-5 w-5" />
						</Button>
						<h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ __('Knowledge Base') }}</h2>
					</div>
					<div class="flex items-center gap-2">
						<span v-if="displayedArticles.length" class="text-[11px] text-gray-600 font-medium">
							{{ displayedArticles.length }} {{ __('articles') }}
						</span>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-4 p-4">
				<!-- Search Bar -->
				<div class="relative">
					<FeatherIcon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
					<input
						v-model="searchQuery"
						type="text"
						:placeholder="__('Search articles...')"
						class="w-full pl-9 pr-3 py-2.5 rounded-xl glass-section text-[14px] text-gray-800 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[var(--icd-purple)]/30 transition-all"
					/>
					<button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2">
						<FeatherIcon name="x" class="w-4 h-4 text-gray-600" />
					</button>
				</div>

				<!-- Category Filter Chips -->
				<div v-if="parentCategories.length || favoriteNames.size" class="flex flex-col gap-2">
					<!-- Top row: All + Favorites -->
					<div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
						<button
							@click="activeCategory = ''"
							class="flex-shrink-0 text-[13px] font-bold px-4 py-2 rounded-xl transition-all"
							:class="!activeCategory ? 'bg-[var(--icd-purple)] text-white shadow-sm' : 'glass-section text-gray-600 dark:text-gray-300'"
						>{{ __('All') }}</button>
						<button
							@click="activeCategory = '__favorites__'"
							class="flex-shrink-0 text-[13px] font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap"
							:class="activeCategory === '__favorites__' ? 'bg-[#E92634] text-white shadow-sm' : 'glass-section text-gray-600 dark:text-gray-300'"
						>
							<FeatherIcon name="heart" class="w-3 h-3 inline -mt-0.5 mr-0.5" />
							{{ __('Favorites') }}
							<span v-if="favoriteNames.size" class="ml-1 text-[11px] opacity-50">{{ favoriteNames.size }}</span>
						</button>
						<!-- Parent categories -->
						<button
							v-for="cat in parentCategories"
							:key="cat.name"
							@click="selectParent(cat.name)"
							class="flex-shrink-0 text-[13px] font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap"
							:class="isParentActive(cat.name) ? 'bg-[var(--icd-purple)] text-white shadow-sm' : 'glass-section text-gray-600 dark:text-gray-300'"
						>
							{{ cat.category_name }}
							<span class="ml-1 text-[11px] opacity-50">{{ parentArticleCount(cat.name) }}</span>
						</button>
					</div>
					<!-- Sub-category chips (shown when parent is selected) -->
					<div v-if="activeChildren.length" class="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
						<button
							@click="activeCategory = expandedParent"
							class="flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
							:class="activeCategory === expandedParent ? 'bg-[var(--icd-purple)]/80 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'"
						>{{ __('All') }}</button>
						<button
							v-for="child in activeChildren"
							:key="child.name"
							@click="activeCategory = child.name"
							class="flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
							:class="activeCategory === child.name ? 'bg-[var(--icd-purple)]/80 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'"
						>
							{{ child.category_name }}
							<span class="ml-1 text-[10px] opacity-50">{{ child.count }}</span>
						</button>
					</div>
				</div>

				<!-- Loading -->
				<div v-if="articles.loading && !articles.data" class="flex justify-center py-8">
					<div class="w-6 h-6 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
				</div>

				<!-- Empty State -->
				<div v-else-if="!displayedArticles.length" class="text-center py-12">
					<FeatherIcon :name="activeCategory === '__favorites__' ? 'heart' : (searchQuery ? 'search' : 'book-open')" class="w-12 h-12 text-gray-700 mx-auto mb-3" />
					<p class="text-[15px] text-gray-700">
						{{ activeCategory === '__favorites__' ? __('No favorite articles yet') : (searchQuery ? __('No matching articles') : __('No articles available')) }}
					</p>
				</div>

				<!-- Grouped by Category -->
				<template v-else>
					<div v-for="group in groupedArticles" :key="group.category" class="flex flex-col gap-2">
						<!-- Category Header - Colored -->
						<div class="flex items-center gap-2.5 rounded-xl px-3 py-2"
							:class="catHeaderBg(group.category)">
							<div class="w-7 h-7 rounded-lg flex items-center justify-center bg-white/20 dark:bg-white/10">
								<FeatherIcon :name="categoryIcon(group.category)" class="h-3.5 w-3.5"
									:class="catHeaderText(group.category)" />
							</div>
							<span class="text-[14px] font-bold"
								:class="catHeaderText(group.category)">
								{{ categoryDisplayName(group.category) }}
							</span>
							<span class="text-[11px] font-medium" :class="catHeaderCount(group.category)">{{ group.articles.length }}</span>
						</div>

						<!-- Articles in glass card -->
						<div class="flex flex-col glass-section rounded-xl overflow-hidden">
							<button
								v-for="(article, idx) in group.articles"
								:key="article.name"
								@click="router.push({ name: 'KnowledgeArticleDetailView', params: { id: article.name } })"
								class="w-full text-left px-3.5 py-3 flex items-center gap-3 active:bg-white/30 dark:active:bg-white/10 transition-colors"
								:class="idx < group.articles.length - 1 ? 'border-b border-white/30 dark:border-white/10' : ''"
							>
								<!-- Pin or number -->
								<div v-if="article.is_pinned"
									class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="star" class="w-4 h-4 text-amber-500" />
								</div>
								<div v-else
									class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
									<span class="text-[12px] font-bold text-gray-700 dark:text-gray-600">{{ idx + 1 }}</span>
								</div>

								<!-- Title block -->
								<div class="min-w-0 flex-1">
									<div class="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug">
										{{ article.title }}
									</div>
									<div v-if="article.title_ar"
										class="text-[14px] font-medium text-gray-600 dark:text-gray-300 mt-1 leading-snug"
										dir="rtl">
										{{ article.title_ar }}
									</div>
									<!-- Meta -->
									<div v-if="article.view_count || article.attachment" class="flex items-center gap-3 mt-1.5">
										<span v-if="article.view_count" class="flex items-center gap-1 text-[11px] text-gray-600">
											<FeatherIcon name="eye" class="w-3 h-3" /> {{ article.view_count }}
										</span>
										<span v-if="article.attachment" class="flex items-center gap-1 text-[11px] text-gray-600">
											<FeatherIcon name="paperclip" class="w-3 h-3" />
										</span>
									</div>
								</div>

								<!-- Favorite button -->
								<button
									@click.stop="toggleFavorite(article.name)"
									class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
									:class="favoriteNames.has(article.name) ? 'bg-red-50 dark:bg-red-900/20' : 'bg-transparent'"
								>
									<FeatherIcon
										name="heart"
										class="w-4 h-4 transition-colors"
										:class="favoriteNames.has(article.name) ? 'text-[#E92634] fill-current' : 'text-gray-700 dark:text-gray-600'"
										:style="favoriteNames.has(article.name) ? 'fill: #E92634' : ''"
									/>
								</button>

								<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 dark:text-gray-600 flex-shrink-0" />
							</button>
						</div>
					</div>
				</template>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { ref, reactive, computed, inject } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon, Button, call } from "frappe-ui"

const __ = inject("$translate")
const router = useRouter()
const activeCategory = ref("")
const searchQuery = ref("")
const favoriteNames = reactive(new Set())
const expandedParent = ref("")

const categories = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_knowledge_categories",
	auto: true,
	cache: "doc_center:kb_categories",
})

const articles = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_knowledge_articles",
	auto: true,
	cache: "doc_center:kb_articles",
})

// Load favorites
const favorites = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_favorite_articles",
	auto: true,
	onSuccess(data) {
		favoriteNames.clear()
		if (data) data.forEach(a => favoriteNames.add(a.name))
	},
})

async function toggleFavorite(articleName) {
	const wasFav = favoriteNames.has(articleName)
	if (wasFav) {
		favoriteNames.delete(articleName)
	} else {
		favoriteNames.add(articleName)
	}
	try {
		await call("frappe.desk.like.toggle_like", {
			doctype: "ICD3S Knowledge Article",
			name: articleName,
			add: wasFav ? "No" : "Yes",
		})
	} catch (e) {
		if (wasFav) {
			favoriteNames.add(articleName)
		} else {
			favoriteNames.delete(articleName)
		}
	}
}

// Parent categories (no parent_category)
const parentCategories = computed(() => {
	if (!categories.data) return []
	return categories.data.filter(c => !c.parent_category)
})

// Children of the currently expanded parent
const activeChildren = computed(() => {
	if (!expandedParent.value || !categories.data || !articles.data) return []
	const counts = {}
	articles.data.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1 })
	return categories.data
		.filter(c => c.parent_category === expandedParent.value && counts[c.name])
		.map(c => ({ ...c, count: counts[c.name] }))
})

// Get all child category names for a parent
function getChildNames(parentName) {
	if (!categories.data) return []
	return categories.data.filter(c => c.parent_category === parentName).map(c => c.name)
}

// Select a parent category - expand it and show all its articles
function selectParent(parentName) {
	if (expandedParent.value === parentName) {
		// Toggle off
		expandedParent.value = ""
		activeCategory.value = ""
	} else {
		expandedParent.value = parentName
		activeCategory.value = parentName
	}
}

// Check if a parent category or any of its children is active
function isParentActive(parentName) {
	if (activeCategory.value === parentName) return true
	const children = getChildNames(parentName)
	return children.includes(activeCategory.value)
}

// Count articles in a parent + all its children
function parentArticleCount(parentName) {
	if (!articles.data) return 0
	const children = getChildNames(parentName)
	const allCats = [parentName, ...children]
	return articles.data.filter(a => allCats.includes(a.category)).length
}

const filteredArticles = computed(() => {
	if (!articles.data) return []
	let list = articles.data

	if (activeCategory.value === '__favorites__') {
		list = list.filter(a => favoriteNames.has(a.name))
	} else if (activeCategory.value) {
		// If active is a parent category, include all children's articles
		const children = getChildNames(activeCategory.value)
		if (children.length) {
			const allCats = [activeCategory.value, ...children]
			list = list.filter(a => allCats.includes(a.category))
		} else {
			list = list.filter(a => a.category === activeCategory.value)
		}
	}

	if (searchQuery.value.trim()) {
		const q = searchQuery.value.toLowerCase().trim()
		list = list.filter(a =>
			(a.title || '').toLowerCase().includes(q) ||
			(a.title_ar || '').toLowerCase().includes(q) ||
			(a.tags || '').toLowerCase().includes(q)
		)
	}

	return list
})

const displayedArticles = filteredArticles

const groupedArticles = computed(() => {
	if (!filteredArticles.value.length) return []
	const groups = {}
	const catOrder = {}
	if (categories.data) {
		categories.data.forEach(c => { catOrder[c.name] = c.sort_order || 99 })
	}
	filteredArticles.value.forEach(a => {
		const cat = a.category || 'Other'
		if (!groups[cat]) groups[cat] = []
		groups[cat].push(a)
	})
	Object.values(groups).forEach(arr => {
		arr.sort((a, b) => {
			if (a.is_pinned && !b.is_pinned) return -1
			if (!a.is_pinned && b.is_pinned) return 1
			return (a.title || '').localeCompare(b.title || '')
		})
	})
	return Object.entries(groups)
		.sort((a, b) => (catOrder[a[0]] || 99) - (catOrder[b[0]] || 99))
		.map(([category, arts]) => ({ category, articles: arts }))
})

function categoryDisplayName(catName) {
	if (!categories.data) return catName
	const cat = categories.data.find(c => c.name === catName)
	return cat ? cat.category_name : catName
}

function categoryIcon(catName) {
	if (categories.data) {
		const cat = categories.data.find(c => c.name === catName)
		if (cat && cat.icon) return cat.icon
	}
	const display = categoryDisplayName(catName)
	return { 'Sales Training': 'trending-up', 'Market Intelligence': 'globe', 'Standard Operating Procedures': 'book', 'HR & Policy': 'shield', 'IT & Systems': 'monitor', 'Health & Safety': 'heart' }[display] || 'file-text'
}

const catColorMap = {
	'Sales Training': 'bg-blue-600 dark:bg-blue-700',
	'Market Intelligence': 'bg-emerald-600 dark:bg-emerald-700',
	'Standard Operating Procedures': 'bg-purple-600 dark:bg-purple-700',
	'HR & Policy': 'bg-orange-500 dark:bg-orange-600',
	'IT & Systems': 'bg-cyan-600 dark:bg-cyan-700',
	'Health & Safety': 'bg-red-500 dark:bg-red-600',
	'Product Knowledge': 'bg-indigo-600 dark:bg-indigo-700',
	'Customer Success': 'bg-teal-600 dark:bg-teal-700',
}

function catHeaderBg(catName) {
	const display = categoryDisplayName(catName)
	// Check child's parent for color inheritance
	if (!catColorMap[display] && categories.data) {
		const cat = categories.data.find(c => c.name === catName)
		if (cat && cat.parent_category) {
			const parentDisplay = categoryDisplayName(cat.parent_category)
			return catColorMap[parentDisplay] || 'bg-gray-600'
		}
	}
	return catColorMap[display] || 'bg-gray-600'
}

function catHeaderText() {
	return 'text-white'
}

function catHeaderCount() {
	return 'text-white/70'
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
