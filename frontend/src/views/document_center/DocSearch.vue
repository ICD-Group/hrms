<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex flex-row glass-header px-4 py-2.5 items-center gap-2">
					<button @click="router.back()"
						class="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 active:bg-gray-200 active:scale-90 transition-all flex-shrink-0">
						<FeatherIcon name="arrow-left" class="h-[18px] w-[18px] text-gray-600 dark:text-gray-300" />
					</button>
					<div class="flex-1 relative">
						<FeatherIcon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input
							ref="searchInput"
							v-model="query"
							@input="debouncedSearch"
							type="text"
							:placeholder="__('Search policies, articles, videos...')"
							class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[var(--icd-purple)]/20 transition-all"
						/>
						<button v-if="query" @click="query = ''; results = null"
							class="absolute right-3 top-1/2 -translate-y-1/2">
							<FeatherIcon name="x" class="w-4 h-4 text-gray-400" />
						</button>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-4 p-4">
				<!-- Filter Chips -->
				<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
					<button
						v-for="filter in filters"
						:key="filter.value"
						@click="activeFilter = filter.value; doSearch()"
						class="flex-shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold transition-all active:scale-95"
						:class="activeFilter === filter.value
							? 'bg-[var(--icd-purple)] text-white'
							: 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'"
					>
						{{ filter.label }}
					</button>
				</div>

				<!-- Loading -->
				<div v-if="searching" class="flex justify-center py-8">
					<div class="w-6 h-6 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
				</div>

				<!-- Empty State - No Query -->
				<div v-else-if="!query" class="text-center py-12">
					<FeatherIcon name="search" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
					<p class="text-base font-semibold text-gray-500">{{ __('Search Document Center') }}</p>
					<p class="text-sm text-gray-400 mt-1">{{ __('Find policies, articles, videos, and more') }}</p>
				</div>

				<!-- No Results -->
				<div v-else-if="results && !results.length" class="text-center py-12">
					<FeatherIcon name="search" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
					<p class="text-base font-semibold text-gray-500">{{ __('No results found') }}</p>
					<p class="text-sm text-gray-400 mt-1">{{ __('Try different keywords or filters') }}</p>
				</div>

				<!-- Results -->
				<div v-else-if="results" class="flex flex-col gap-2">
					<div class="px-1 text-sm font-semibold text-gray-500">{{ results.length }} {{ __('results') }}</div>

					<div class="glass-section rounded-xl overflow-hidden">
						<button
							v-for="(item, idx) in results"
							:key="item.name"
							@click="navigateToResult(item)"
							class="w-full text-left px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 dark:active:bg-white/5 transition-colors"
							:class="idx < results.length - 1 ? 'border-b border-gray-100 dark:border-white/10' : ''"
						>
							<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
								:class="getTypeStyle(item.doc_type).bg">
								<FeatherIcon :name="getTypeStyle(item.doc_type).icon"
									class="w-5 h-5" :class="getTypeStyle(item.doc_type).text" />
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ item.title }}</div>
								<div class="text-xs text-gray-500 mt-0.5">{{ getTypeLabel(item.doc_type) }}</div>
							</div>
							<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-400 flex-shrink-0" />
						</button>
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { ref, onMounted, inject } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon } from "frappe-ui"

const __ = inject("$translate")
const router = useRouter()
const searchInput = ref(null)

const query = ref("")
const activeFilter = ref("all")
const results = ref(null)
const searching = ref(false)
let searchTimer = null

const filters = [
	{ value: "all", label: __("All") },
	{ value: "ICD3S Company Policy", label: __("Policies") },
	{ value: "ICD3S Knowledge Article", label: __("Articles") },
	{ value: "ICD3S Training Video", label: __("Videos") },
]

const searchResource = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.search_document_center",
})

function debouncedSearch() {
	clearTimeout(searchTimer)
	searchTimer = setTimeout(doSearch, 400)
}

async function doSearch() {
	if (!query.value || query.value.length < 2) {
		results.value = null
		return
	}
	searching.value = true
	try {
		const params = { query: query.value, limit: 30 }
		if (activeFilter.value !== "all") params.doc_types = JSON.stringify([activeFilter.value])
		await searchResource.submit(params)
		results.value = searchResource.data || []
	} catch {
		results.value = []
	}
	searching.value = false
}

function getTypeStyle(docType) {
	const styles = {
		"ICD3S Company Policy": { bg: "bg-[var(--icd-purple)]/10", text: "text-[var(--icd-purple)]", icon: "shield" },
		"ICD3S Knowledge Article": { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600", icon: "book-open" },
		"ICD3S Training Video": { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-500", icon: "play-circle" },
	}
	return styles[docType] || { bg: "bg-gray-100", text: "text-gray-500", icon: "file" }
}

function getTypeLabel(docType) {
	const labels = {
		"ICD3S Company Policy": __("Policy"),
		"ICD3S Knowledge Article": __("Article"),
		"ICD3S Training Video": __("Video"),
	}
	return labels[docType] || docType
}

function navigateToResult(item) {
	if (item.doc_type === "ICD3S Company Policy") {
		router.push({ name: "PolicyDetailView", params: { id: item.name } })
	} else if (item.doc_type === "ICD3S Knowledge Article") {
		router.push({ name: "KnowledgeArticleDetailView", params: { id: item.name } })
	} else if (item.doc_type === "ICD3S Training Video") {
		router.push({ name: "TrainingVideoPlayerView", params: { id: item.name } })
	}
}

onMounted(() => {
	setTimeout(() => searchInput.value?.focus(), 300)
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
