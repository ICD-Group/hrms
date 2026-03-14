<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex flex-row glass-header px-4 py-2.5 items-center justify-between">
					<div class="flex flex-row items-center">
						<Button variant="ghost" class="!px-1 mr-1 hover:bg-white/50" @click="router.back()">
							<FeatherIcon name="chevron-left" class="h-5 w-5" />
						</Button>
						<h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ __('Market Intelligence') }}</h2>
					</div>
					<span v-if="articles.data" class="text-[11px] text-gray-600 font-medium">
						{{ articles.data.length }} {{ __('regions') }}
					</span>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-3 p-4">
				<!-- Loading -->
				<div v-if="articles.loading && !articles.data" class="flex justify-center py-8">
					<div class="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
				</div>

				<!-- Empty State -->
				<div v-else-if="!filteredArticles.length" class="text-center py-12">
					<FeatherIcon name="globe" class="w-12 h-12 text-gray-700 mx-auto mb-3" />
					<p class="text-[15px] text-gray-700">{{ __('No market intelligence available') }}</p>
				</div>

				<!-- Articles List -->
				<template v-else>
					<!-- Header Banner -->
					<div class="rounded-xl p-3 bg-emerald-600 dark:bg-emerald-700">
						<div class="flex items-center gap-2.5">
							<div class="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20">
								<FeatherIcon name="globe" class="h-4 w-4 text-white" />
							</div>
							<div>
								<span class="text-[14px] font-bold text-white">{{ __('Regional Markets') }}</span>
								<div class="text-[11px] text-white/60">{{ __('Enterprise customers & opportunities') }}</div>
							</div>
							<span class="text-[11px] font-medium text-white/70 ml-auto">{{ filteredArticles.length }}</span>
						</div>
					</div>

					<!-- Article Cards -->
					<div class="flex flex-col glass-section rounded-xl overflow-hidden">
						<button
							v-for="(article, idx) in filteredArticles"
							:key="article.name"
							@click="router.push({ name: 'KnowledgeArticleDetailView', params: { id: article.name } })"
							class="w-full text-left px-3.5 py-3 flex items-center gap-3 active:bg-white/30 dark:active:bg-white/10 transition-colors"
							:class="idx < filteredArticles.length - 1 ? 'border-b border-white/30 dark:border-white/10' : ''"
						>
							<!-- Region icon -->
							<div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
								:class="regionIconBg(article.title)">
								<span class="text-lg">{{ regionEmoji(article.title) }}</span>
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
								<div v-if="article.view_count" class="flex items-center gap-1 mt-1.5">
									<FeatherIcon name="eye" class="w-3 h-3 text-gray-600" />
									<span class="text-[11px] text-gray-600">{{ article.view_count }}</span>
								</div>
							</div>

							<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 dark:text-gray-600 flex-shrink-0" />
						</button>
					</div>
				</template>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { computed, inject } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon, Button } from "frappe-ui"

const __ = inject("$translate")
const router = useRouter()

const articles = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_knowledge_articles",
	params: { category: "Market Intelligence" },
	auto: true,
	cache: "doc_center:market_intel",
})

const filteredArticles = computed(() => articles.data || [])

function regionEmoji(title) {
	if (!title) return "🌍"
	const t = title.toLowerCase()
	if (t.includes("gcc") || t.includes("gulf")) return "🏜️"
	if (t.includes("levant")) return "🏛️"
	if (t.includes("north africa")) return "🌅"
	if (t.includes("sub-saharan") || t.includes("africa")) return "🌍"
	return "🌐"
}

function regionIconBg(title) {
	if (!title) return "bg-gray-100 dark:bg-white/5"
	const t = title.toLowerCase()
	if (t.includes("gcc") || t.includes("gulf")) return "bg-amber-50 dark:bg-amber-900/20"
	if (t.includes("levant")) return "bg-blue-50 dark:bg-blue-900/20"
	if (t.includes("north africa")) return "bg-orange-50 dark:bg-orange-900/20"
	if (t.includes("sub-saharan") || t.includes("africa")) return "bg-emerald-50 dark:bg-emerald-900/20"
	return "bg-gray-100 dark:bg-white/5"
}
</script>
