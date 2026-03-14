<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex flex-row glass-header px-4 py-2.5 items-center justify-between">
					<div class="flex flex-row items-center">
						<Button variant="ghost" class="!px-1 mr-1 hover:bg-white/50" @click="router.back()">
							<FeatherIcon name="chevron-left" class="h-5 w-5" />
						</Button>
						<h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ __('Training Videos') }}</h2>
					</div>
					<div class="flex items-center gap-2">
						<span v-if="allVideos.length" class="text-[11px] text-gray-600 font-medium">
							{{ filteredVideos.length }} {{ __('videos') }}
						</span>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-3 p-4">
				<!-- Search -->
				<div class="relative">
					<FeatherIcon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
					<input
						v-model="searchQuery"
						type="text"
						:placeholder="__('Search videos...')"
						class="w-full pl-9 pr-3 py-2.5 rounded-xl glass-section text-[14px] text-gray-800 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[var(--icd-purple)]/30 transition-all"
					/>
					<button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2">
						<FeatherIcon name="x" class="w-4 h-4 text-gray-600" />
					</button>
				</div>

				<!-- Language Filters -->
				<div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
					<button
						@click="activeLang = 'All'"
						class="flex-shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all"
						:class="activeLang === 'All' ? 'bg-[var(--icd-purple)] text-white shadow-sm' : 'glass-section text-gray-600'"
					>{{ __('All') }}</button>
					<button
						@click="activeLang = 'Arabic'"
						class="flex-shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all"
						:class="activeLang === 'Arabic' ? 'bg-[#E92634] text-white shadow-sm' : 'glass-section text-gray-600'"
					>العربية</button>
					<button
						@click="activeLang = 'English'"
						class="flex-shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all"
						:class="activeLang === 'English' ? 'bg-blue-600 text-white shadow-sm' : 'glass-section text-gray-600'"
					>English</button>
				</div>

				<!-- Category Chips -->
				<div v-if="activeCategories.length" class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
					<button
						@click="activeCat = ''"
						class="flex-shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all"
						:class="!activeCat ? 'bg-gray-700 text-white shadow-sm' : 'glass-section text-gray-700'"
					>{{ __('All Topics') }}</button>
					<button
						v-for="cat in activeCategories"
						:key="cat.name"
						@click="activeCat = cat.name"
						class="flex-shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
						:class="activeCat === cat.name ? catChipActive(cat) : 'glass-section text-gray-700'"
					>
						{{ cat.category_name }}
						<span class="ml-1 text-[11px] opacity-60">{{ cat.count }}</span>
					</button>
				</div>

				<!-- Loading -->
				<div v-if="videos.loading && !videos.data" class="flex justify-center py-8">
					<div class="w-6 h-6 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
				</div>

				<!-- Empty -->
				<div v-else-if="!filteredVideos.length" class="text-center py-12">
					<FeatherIcon name="play-circle" class="w-12 h-12 text-gray-700 mx-auto mb-3" />
					<p class="text-[15px] text-gray-700">{{ searchQuery ? __('No matching videos') : __('No training videos yet') }}</p>
				</div>

				<!-- Featured Horizontal Scroll -->
				<div v-if="featuredVideos.length && !searchQuery && !activeCat" class="flex flex-col gap-2">
					<div class="flex items-center gap-2 px-1">
						<FeatherIcon name="star" class="w-4 h-4 text-amber-500" />
						<span class="text-[13px] font-bold text-gray-700 dark:text-gray-300">{{ __('Featured') }}</span>
					</div>
					<div class="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
						<button
							v-for="video in featuredVideos"
							:key="video.name"
							@click="openVideo(video)"
							class="flex-shrink-0 w-[260px] rounded-xl overflow-hidden glass-section active:scale-[0.98] transition-transform"
						>
							<div class="relative">
								<img :src="thumbUrl(video.youtube_id)" class="w-full h-[146px] object-cover bg-gray-200" loading="lazy" />
								<div class="absolute inset-0 bg-black/20 flex items-center justify-center">
									<div class="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
										<FeatherIcon name="play" class="w-6 h-6 text-[#E92634] ml-0.5" style="fill: #E92634" />
									</div>
								</div>
								<span v-if="video.duration" class="absolute bottom-1.5 right-1.5 text-[11px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded">{{ video.duration }}</span>
								<span class="absolute top-1.5 left-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded"
									:class="video.language === 'Arabic' ? 'bg-[#E92634] text-white' : 'bg-blue-600 text-white'">
									{{ langLabel(video.language) }}
								</span>
							</div>
							<div class="p-2.5">
								<div class="text-[13px] font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2">{{ video.title }}</div>
								<div v-if="video.creator_name" class="text-[11px] text-gray-600 mt-1">{{ video.creator_name }}</div>
							</div>
						</button>
					</div>
				</div>

				<!-- Video Grid by Category -->
				<template v-if="groupedVideos.length">
					<div v-for="group in groupedVideos" :key="group.category" class="flex flex-col gap-2">
						<!-- Category Header -->
						<div class="flex items-center gap-2 rounded-xl px-3 py-2 mt-1" :class="group.bgColor">
							<div class="w-7 h-7 rounded-lg flex items-center justify-center bg-white/20">
								<FeatherIcon :name="group.icon || 'play-circle'" class="h-3.5 w-3.5 text-white" />
							</div>
							<span class="text-[14px] font-bold text-white">{{ group.displayName }}</span>
							<span class="text-[11px] font-medium text-white/70">{{ group.videos.length }}</span>
						</div>

						<!-- Videos List -->
						<div class="flex flex-col glass-section rounded-xl overflow-hidden">
							<button
								v-for="(video, idx) in group.videos"
								:key="video.name"
								@click="openVideo(video)"
								class="w-full text-left px-3 py-2.5 flex items-center gap-3 active:bg-white/30 dark:active:bg-white/10 transition-colors"
								:class="idx < group.videos.length - 1 ? 'border-b border-white/30 dark:border-white/10' : ''"
							>
								<!-- Thumbnail -->
								<div class="relative w-[80px] h-[45px] rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
									<img :src="thumbUrl(video.youtube_id)" class="w-full h-full object-cover" loading="lazy" />
									<div class="absolute inset-0 flex items-center justify-center">
										<div class="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
											<FeatherIcon name="play" class="w-3.5 h-3.5 text-[#E92634] ml-0.5" style="fill: #E92634" />
										</div>
									</div>
									<span v-if="video.duration" class="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-white bg-black/70 px-1 rounded">{{ video.duration }}</span>
								</div>

								<!-- Info -->
								<div class="flex-1 min-w-0">
									<div class="text-[14px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">{{ video.title }}</div>
									<div class="flex items-center gap-2 mt-0.5">
										<span v-if="video.creator_name" class="text-[11px] text-gray-600 truncate max-w-[120px]">{{ video.creator_name }}</span>
										<span class="text-[11px] font-bold px-1.5 rounded"
											:class="video.language === 'Arabic' ? 'bg-red-50 text-[#E92634]' : video.language === 'English' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'">
											{{ langLabel(video.language) }}
										</span>
									</div>
								</div>

								<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 flex-shrink-0" />
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
import { ref, computed, inject } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon, Button } from "frappe-ui"

const __ = inject("$translate")
const router = useRouter()
const searchQuery = ref("")
const activeLang = ref("All")
const activeCat = ref("")

const categories = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_training_categories",
	auto: true,
	cache: "doc_center:training_categories",
})

const videos = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_training_videos",
	auto: true,
	cache: "doc_center:training_videos",
})

const allVideos = computed(() => videos.data || [])

const filteredVideos = computed(() => {
	let list = allVideos.value
	if (activeLang.value !== "All") {
		list = list.filter(v => v.language === activeLang.value || v.language === "Both")
	}
	if (activeCat.value) {
		list = list.filter(v => v.category === activeCat.value)
	}
	if (searchQuery.value.trim()) {
		const q = searchQuery.value.toLowerCase().trim()
		list = list.filter(v =>
			(v.title || "").toLowerCase().includes(q) ||
			(v.title_ar || "").toLowerCase().includes(q) ||
			(v.creator_name || "").toLowerCase().includes(q) ||
			(v.tags || "").toLowerCase().includes(q)
		)
	}
	return list
})

const featuredVideos = computed(() => allVideos.value.filter(v => v.is_featured))

const activeCategories = computed(() => {
	if (!categories.data || !allVideos.value.length) return []
	const counts = {}
	allVideos.value.forEach(v => { counts[v.category] = (counts[v.category] || 0) + 1 })
	return categories.data
		.filter(c => counts[c.name])
		.map(c => ({ ...c, count: counts[c.name] }))
})

const catColorMap = {
	blue: "bg-blue-600",
	emerald: "bg-emerald-600",
	orange: "bg-orange-500",
	purple: "bg-purple-600",
	pink: "bg-pink-600",
	amber: "bg-amber-500",
	red: "bg-[#E92634]",
	cyan: "bg-cyan-600",
}

const groupedVideos = computed(() => {
	if (!filteredVideos.value.length) return []
	const groups = {}
	const catMap = {}
	if (categories.data) {
		categories.data.forEach(c => { catMap[c.name] = c })
	}
	filteredVideos.value.forEach(v => {
		if (v.is_featured && !searchQuery.value && !activeCat.value) return
		const cat = v.category || "Other"
		if (!groups[cat]) groups[cat] = []
		groups[cat].push(v)
	})
	return Object.entries(groups)
		.sort((a, b) => (catMap[a[0]]?.sort_order || 99) - (catMap[b[0]]?.sort_order || 99))
		.map(([category, vids]) => ({
			category,
			videos: vids,
			displayName: catMap[category]?.category_name || category,
			icon: catMap[category]?.icon || "play-circle",
			bgColor: catColorMap[catMap[category]?.color] || "bg-gray-600",
		}))
})

function thumbUrl(ytId) {
	return ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : ""
}

function langLabel(lang) {
	return lang === "Arabic" ? "AR" : lang === "English" ? "EN" : "AR/EN"
}

function openVideo(video) {
	router.push({ name: "TrainingVideoPlayerView", params: { id: video.name } })
}

function catChipActive(cat) {
	return (catColorMap[cat.color] || "bg-gray-700") + " text-white shadow-sm"
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>
