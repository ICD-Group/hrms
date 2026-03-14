<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex flex-row glass-header px-4 py-2.5 items-center justify-between">
					<div class="flex flex-row items-center gap-2">
						<button @click="router.back()"
							class="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 active:bg-gray-200 active:scale-90 transition-all">
							<FeatherIcon name="arrow-left" class="h-[18px] w-[18px] text-gray-600 dark:text-gray-300" />
						</button>
						<h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ __('Document Center') }}</h2>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-5 p-4">
				<!-- Loading -->
				<div v-if="summary.loading && !summary.data" class="flex justify-center py-12">
					<div class="w-6 h-6 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
				</div>

				<template v-else>
					<!-- Browse Grid -->
					<div class="flex flex-col gap-2.5">
						<span class="section-title px-1">{{ __('Browse') }}</span>
						<div class="grid grid-cols-4 gap-2.5">
							<button v-for="card in browseCards" :key="card.route"
								@click="router.push({ name: card.route })"
								class="flex flex-col items-center gap-2 glass-section rounded-2xl py-4 px-1.5 active:scale-[0.95] transition-all duration-200">
								<div class="w-[52px] h-[52px] rounded-2xl flex items-center justify-center" :class="card.bg">
									<FeatherIcon :name="card.icon" class="w-6 h-6" :class="card.color" />
								</div>
								<span class="text-[11px] font-bold text-gray-800 dark:text-gray-200 text-center leading-tight">{{ card.label }}</span>
								<span v-if="card.count !== undefined" class="text-[10px] text-gray-400 -mt-0.5">{{ card.count }}</span>
							</button>
						</div>
					</div>

					<!-- Pending Policies -->
					<div v-if="stats.pending_policies?.length" class="flex flex-col gap-2">
						<div class="flex items-center gap-2 px-1">
							<div class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
							<span class="text-sm font-bold text-gray-900 dark:text-white">{{ __('Policies to Acknowledge') }}</span>
							<span class="text-xs text-orange-600 font-semibold">({{ stats.pending_policies.length }})</span>
						</div>
						<div class="flex flex-col glass-section rounded-xl overflow-hidden">
							<button
								v-for="(pol, idx) in stats.pending_policies.slice(0, 3)"
								:key="pol.name"
								@click="router.push({ name: 'PolicyDetailView', params: { id: pol.name } })"
								class="w-full text-left px-4 py-3 flex items-center gap-3 active:bg-orange-50/50 transition-colors"
								:class="idx < Math.min(stats.pending_policies.length, 3) - 1 ? 'border-b border-gray-100 dark:border-white/10' : ''"
							>
								<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
									:class="pol.status === 'Overdue' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30'">
									<FeatherIcon :name="pol.status === 'Overdue' ? 'alert-triangle' : 'file-text'"
										class="w-5 h-5"
										:class="pol.status === 'Overdue' ? 'text-red-600' : 'text-orange-600'" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ pol.policy_title }}</div>
									<div class="text-xs"
										:class="pol.status === 'Overdue' ? 'text-red-500 font-semibold' : 'text-gray-500'">
										{{ pol.status === 'Overdue' ? __('OVERDUE') : (pol.deadline_date ? __('Due') + ' ' + pol.deadline_date : __('Pending')) }}
									</div>
								</div>
								<div class="px-3 py-1.5 rounded-lg text-xs font-bold"
									:class="pol.status === 'Overdue'
										? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
										: 'bg-[var(--icd-purple)]/10 text-[var(--icd-purple)]'">
									{{ __('Read') }}
								</div>
							</button>
						</div>
						<button v-if="stats.pending_policies.length > 3"
							@click="router.push({ name: 'PolicyAcknowledgmentListView' })"
							class="text-xs font-semibold text-[var(--icd-purple)] text-center py-1">
							{{ __('View all') }} {{ stats.pending_policies.length }} {{ __('pending') }}
						</button>
					</div>

					<!-- Missing Mandatory Documents -->
					<div v-if="stats.missing_docs?.length" class="flex flex-col gap-2">
						<div class="flex items-center gap-2 px-1">
							<div class="w-2 h-2 rounded-full bg-red-500"></div>
							<span class="text-sm font-bold text-gray-900 dark:text-white">{{ __('Required Documents Missing') }}</span>
							<span class="text-xs text-red-600 font-semibold">({{ stats.missing_docs.length }})</span>
						</div>
						<div class="flex flex-col glass-section rounded-xl overflow-hidden">
							<button
								v-for="(doc, idx) in stats.missing_docs.slice(0, 3)"
								:key="doc.name"
								@click="router.push({ name: 'EmployeeDocumentCreateView' })"
								class="w-full text-left px-4 py-3 flex items-center gap-3 active:bg-red-50/50 transition-colors"
								:class="idx < Math.min(stats.missing_docs.length, 3) - 1 ? 'border-b border-gray-100 dark:border-white/10' : ''"
							>
								<div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="alert-circle" class="w-5 h-5 text-red-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ doc.type_name }}</div>
									<div class="text-xs text-gray-500">{{ doc.category }} - {{ __('Mandatory') }}</div>
								</div>
								<div class="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-xs font-bold text-red-700 dark:text-red-400">
									{{ __('Upload') }}
								</div>
							</button>
						</div>
						<button v-if="stats.missing_docs.length > 3"
							@click="router.push({ name: 'EmployeeDocumentListView' })"
							class="text-xs font-semibold text-[var(--icd-purple)] text-center py-1">
							{{ __('View all') }} {{ stats.missing_docs.length }} {{ __('missing documents') }}
						</button>
					</div>

					<!-- Expiring Documents -->
					<div v-if="stats.expiring_docs?.length" class="flex flex-col gap-2">
						<div class="flex items-center gap-2 px-1">
							<FeatherIcon name="clock" class="w-4 h-4 text-amber-600" />
							<span class="text-sm font-bold text-gray-900 dark:text-white">{{ __('Expiring Soon') }}</span>
						</div>
						<div class="flex flex-col glass-section rounded-xl overflow-hidden">
							<button
								v-for="(doc, idx) in stats.expiring_docs"
								:key="doc.name"
								@click="router.push({ name: 'EmployeeDocumentDetailView', params: { id: doc.name } })"
								class="w-full text-left px-4 py-3 flex items-center gap-3 active:bg-amber-50/50 transition-colors"
								:class="idx < stats.expiring_docs.length - 1 ? 'border-b border-gray-100 dark:border-white/10' : ''"
							>
								<div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="clock" class="w-5 h-5 text-amber-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ doc.document_title }}</div>
									<div class="text-xs text-amber-600 font-semibold">{{ doc.days_until_expiry }} {{ __('days left') }}</div>
								</div>
								<div class="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-xs font-bold text-amber-700">
									{{ __('Renew') }}
								</div>
							</button>
						</div>
					</div>

					<!-- Latest Videos -->
					<div v-if="stats.recent_videos?.length" class="flex flex-col gap-2.5">
						<div class="flex items-center justify-between px-1">
							<span class="section-title">{{ __('Latest Videos') }}</span>
							<button @click="router.push({ name: 'TrainingVideoListView' })" class="text-xs font-semibold text-[var(--icd-purple)]">{{ __('See All') }}</button>
						</div>
						<div class="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
							<button
								v-for="video in stats.recent_videos"
								:key="video.name"
								@click="router.push({ name: 'TrainingVideoPlayerView', params: { id: video.name } })"
								class="flex-shrink-0 w-[170px] glass-section rounded-xl overflow-hidden active:scale-[0.97] transition-transform"
							>
								<div class="relative w-full aspect-video bg-gray-100 dark:bg-white/5">
									<img v-if="video.thumbnail_url" :src="video.thumbnail_url" class="w-full h-full object-cover" loading="lazy" />
									<div v-else class="w-full h-full flex items-center justify-center">
										<FeatherIcon name="play-circle" class="w-8 h-8 text-gray-300" />
									</div>
									<div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
									<div v-if="video.duration" class="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">{{ video.duration }}</div>
								</div>
								<div class="p-2.5">
									<div class="text-xs font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">{{ video.title }}</div>
								</div>
							</button>
						</div>
					</div>

					<!-- Recent Articles -->
					<div v-if="stats.recent_articles?.length" class="flex flex-col gap-2.5">
						<div class="flex items-center justify-between px-1">
							<span class="section-title">{{ __('Recent Articles') }}</span>
							<button @click="router.push({ name: 'KnowledgeBaseListView' })" class="text-xs font-semibold text-[var(--icd-purple)]">{{ __('See All') }}</button>
						</div>
						<div class="flex flex-col glass-section rounded-xl overflow-hidden">
							<button
								v-for="(article, idx) in stats.recent_articles"
								:key="article.name"
								@click="router.push({ name: 'KnowledgeArticleDetailView', params: { id: article.name } })"
								class="w-full text-left px-4 py-3.5 flex items-center gap-3 active:bg-white/30 transition-colors"
								:class="idx < stats.recent_articles.length - 1 ? 'border-b border-gray-100 dark:border-white/10' : ''"
							>
								<div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="file-text" class="w-5 h-5 text-emerald-600" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ article.title }}</div>
									<div class="text-xs text-gray-500 mt-0.5">{{ article.category }}</div>
								</div>
								<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-400 flex-shrink-0" />
							</button>
						</div>
					</div>

					<div class="h-6"></div>
				</template>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { computed, inject } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon } from "frappe-ui"

const __ = inject("$translate")
const router = useRouter()

const summary = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_document_center_summary",
	auto: true,
	cache: "doc_center:summary",
})

const stats = computed(() => summary.data || { policies: {}, documents: {}, knowledge: {}, employee: {} })

const browseCards = computed(() => [
	{ route: "PolicyAcknowledgmentListView", icon: "shield", bg: "bg-[var(--icd-purple)]/10", color: "text-[var(--icd-purple)]", label: __("Policies"), count: stats.value.policies?.total || 0 },
	{ route: "EmployeeDocumentListView", icon: "file-text", bg: "bg-blue-500/10", color: "text-blue-600", label: __("My Docs"), count: stats.value.documents?.total || 0 },
	{ route: "KnowledgeBaseListView", icon: "book-open", bg: "bg-emerald-500/10", color: "text-emerald-600", label: __("Knowledge"), count: stats.value.knowledge?.total || 0 },
	{ route: "TrainingVideoListView", icon: "play-circle", bg: "bg-red-500/10", color: "text-[#E92634]", label: __("Videos"), count: stats.value.training?.total || 0 },
	{ route: "QuizzesView", icon: "help-circle", bg: "bg-violet-500/10", color: "text-violet-600", label: __("Quizzes") },
	{ route: "ComplianceScoreView", icon: "award", bg: "bg-amber-500/10", color: "text-amber-600", label: __("Score") },
	{ route: "OnboardingView", icon: "clipboard", bg: "bg-cyan-500/10", color: "text-cyan-600", label: __("Onboarding") },
	{ route: "MarketIntelligenceListView", icon: "globe", bg: "bg-teal-500/10", color: "text-teal-600", label: __("Markets"), count: stats.value.market_intel?.total || 0 },
	{ route: "DocSearchView", icon: "search", bg: "bg-gray-500/10", color: "text-gray-600", label: __("Search") },
	{ route: "PolicyQuestionView", icon: "message-circle", bg: "bg-pink-500/10", color: "text-pink-600", label: __("Ask AI") },
	{ route: "GeniusSearchView", icon: "zap", bg: "bg-orange-500/10", color: "text-orange-600", label: __("CRM Search") },
])
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
