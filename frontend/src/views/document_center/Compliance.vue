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
						<h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ __('Compliance Score') }}</h2>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-4 p-4">
				<!-- Loading -->
				<div v-if="score.loading && !score.data" class="flex justify-center py-12">
					<div class="w-6 h-6 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
				</div>

				<template v-else-if="score.data">
					<!-- My Score Card -->
					<div class="glass-section rounded-2xl p-5 text-center">
						<div class="relative w-28 h-28 mx-auto mb-4">
							<svg class="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
								<circle cx="56" cy="56" r="48" stroke="#ede0f5" stroke-width="8" fill="none" class="dark:stroke-white/10" />
								<circle cx="56" cy="56" r="48"
									:stroke="scoreColor"
									stroke-width="8" fill="none"
									stroke-linecap="round"
									:stroke-dasharray="circumference"
									:stroke-dashoffset="circumference - (circumference * myScore / 100)"
									class="transition-all duration-1000" />
							</svg>
							<div class="absolute inset-0 flex flex-col items-center justify-center">
								<span class="text-2xl font-bold text-gray-900 dark:text-white">{{ myScore }}%</span>
								<span class="text-xs text-gray-500">{{ __('Score') }}</span>
							</div>
						</div>

						<h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">{{ scoreLabel }}</h3>
						<p class="text-sm text-gray-500 dark:text-gray-400">{{ scoreDescription }}</p>
					</div>

					<!-- Breakdown -->
					<div v-if="breakdownList.length" class="glass-section rounded-2xl overflow-hidden">
						<div class="px-4 py-3 border-b border-gray-100 dark:border-white/10">
							<span class="section-title text-base">{{ __('Score Breakdown') }}</span>
						</div>
						<div class="flex flex-col">
							<div v-for="(item, idx) in breakdownList" :key="item.key"
								class="px-4 py-3 flex items-center gap-3"
								:class="idx < breakdownList.length - 1 ? 'border-b border-gray-100 dark:border-white/10' : ''">
								<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
									:class="item.pct >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/30' : item.pct >= 50 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'">
									<FeatherIcon :name="item.icon" class="w-5 h-5"
										:class="item.pct >= 80 ? 'text-emerald-600' : item.pct >= 50 ? 'text-amber-600' : 'text-red-500'" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.label }}</div>
									<div class="text-xs text-gray-500 mt-0.5">{{ item.detail }}</div>
									<div class="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full mt-1.5">
										<div class="h-full rounded-full transition-all duration-700"
											:class="item.pct >= 80 ? 'bg-emerald-500' : item.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'"
											:style="{ width: item.pct + '%' }"></div>
									</div>
								</div>
								<span class="text-sm font-bold" :class="item.pct >= 80 ? 'text-emerald-600' : item.pct >= 50 ? 'text-amber-600' : 'text-red-500'">
									{{ item.earned }}/{{ item.max }}
								</span>
							</div>
						</div>
					</div>

					<!-- Leaderboard -->
					<div v-if="leaderboard.data?.length" class="glass-section rounded-2xl overflow-hidden">
						<div class="px-4 py-3 border-b border-gray-100 dark:border-white/10">
							<span class="section-title text-base">{{ __('Team Leaderboard') }}</span>
						</div>
						<div class="flex flex-col">
							<div v-for="(person, idx) in leaderboard.data" :key="person.employee"
								class="px-4 py-3 flex items-center gap-3"
								:class="idx < leaderboard.data.length - 1 ? 'border-b border-gray-100 dark:border-white/10' : ''">
								<div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
									:class="idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'">
									{{ idx + 1 }}
								</div>
								<div class="w-9 h-9 rounded-full bg-[var(--icd-purple)]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
									<img v-if="person.image" :src="person.image" class="w-full h-full object-cover" />
									<FeatherIcon v-else name="user" class="w-4 h-4 text-[var(--icd-purple)]" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ person.employee_name }}</div>
									<div class="text-xs text-gray-500">{{ person.department }}</div>
								</div>
								<span class="text-sm font-bold text-[var(--icd-purple)]">{{ person.score }}%</span>
							</div>
						</div>
					</div>
				</template>

				<div class="h-4"></div>
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
const circumference = 2 * Math.PI * 48

const score = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_my_compliance_score",
	auto: true,
	cache: "doc_center:my_score",
})

const leaderboard = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_compliance_leaderboard",
	auto: true,
	cache: "doc_center:leaderboard",
})

const myScore = computed(() => score.data?.score || score.data?.total_score || 0)

const breakdownIcons = {
	policy_acknowledgments: 'shield',
	mandatory_documents: 'folder',
	document_currency: 'clock',
	timeliness: 'zap',
}

const breakdownLabels = {
	policy_acknowledgments: 'Policy Acknowledgments',
	mandatory_documents: 'Mandatory Documents',
	document_currency: 'Document Currency',
	timeliness: 'Timeliness',
}

const breakdownList = computed(() => {
	const bd = score.data?.breakdown
	if (!bd) return []
	if (Array.isArray(bd)) return bd
	return Object.entries(bd).map(([key, val]) => ({
		key,
		label: breakdownLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
		icon: breakdownIcons[key] || 'check-circle',
		max: val.max || 0,
		earned: val.earned || 0,
		pct: val.max ? Math.round(val.earned / val.max * 100) : 0,
		detail: val.detail || '',
	}))
})

const scoreColor = computed(() => {
	if (myScore.value >= 80) return '#10b981'
	if (myScore.value >= 50) return '#f59e0b'
	return '#ef4444'
})

const scoreLabel = computed(() => {
	if (myScore.value >= 90) return __('Excellent!')
	if (myScore.value >= 70) return __('Good Progress')
	if (myScore.value >= 50) return __('Needs Improvement')
	return __('Getting Started')
})

const scoreDescription = computed(() => {
	if (myScore.value >= 90) return __('Outstanding compliance! Keep it up.')
	if (myScore.value >= 70) return __('You\'re on track. Complete remaining items.')
	if (myScore.value >= 50) return __('Review pending policies and upload documents.')
	return __('Start by acknowledging policies and uploading required documents.')
})
</script>
