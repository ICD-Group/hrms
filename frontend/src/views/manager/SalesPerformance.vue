<template>
	<ion-page>
		<div class="app-bg-ambient"></div>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 -ml-1" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5 text-gray-700" />
					</button>
					<h2 class="text-lg font-bold text-gray-900 ml-1">{{ __("Sales Performance") }}</h2>
				</header>

				<div class="flex flex-col p-3 gap-3">

					<!-- Loading -->
					<div v-if="lb.loading" class="flex items-center justify-center py-20">
						<LoadingIndicator class="w-8 h-8 text-gray-600" />
					</div>

					<template v-else-if="lb.data?.leaderboard?.length">

						<!-- EoM Banner -->
						<div v-if="eomEntry" class="eom-gradient rounded-2xl px-5 py-4 text-white flex items-center gap-4">
							<div class="text-3xl">&#x1F3C6;</div>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-bold text-white/80 tracking-wide">{{ __("Employee of the Month") }}</div>
								<div class="text-base font-bold truncate mt-0.5">{{ eomEntry.employee_name }}</div>
							</div>
							<div class="text-right flex-shrink-0">
								<div class="text-2xl font-black">{{ eomEntry.score }}<span class="text-sm font-bold text-white/80">/100</span></div>
								<div class="text-sm font-bold text-white/90">{{ eomEntry.tier_emoji }} {{ eomEntry.tier }}</div>
							</div>
						</div>

						<!-- Team Stats Summary -->
						<div class="grid grid-cols-4 gap-2">
							<div class="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
								<div class="text-xl font-black text-icd-600">{{ lb.data.leaderboard.length }}</div>
								<div class="text-sm font-bold text-gray-700 mt-0.5">{{ __("Team") }}</div>
							</div>
							<div class="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
								<div class="text-xl font-black text-emerald-600">{{ tierCount("Champion") + tierCount("Star") }}</div>
								<div class="text-sm font-bold text-gray-700 mt-0.5">{{ __("On Track") }}</div>
							</div>
							<div class="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
								<div class="text-xl font-black text-amber-500">{{ tierCount("Developing") }}</div>
								<div class="text-sm font-bold text-gray-700 mt-0.5">{{ __("Watch") }}</div>
							</div>
							<div class="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
								<div class="text-xl font-black text-red-500">{{ tierCount("At Risk") }}</div>
								<div class="text-sm font-bold text-gray-700 mt-0.5">{{ __("At Risk") }}</div>
							</div>
						</div>

						<!-- Team Scores List -->
						<div class="flex flex-col gap-2.5">
							<div v-for="(entry, idx) in lb.data.leaderboard" :key="entry.employee"
								class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-slide-up cursor-pointer active:bg-gray-50"
								:style="{ animationDelay: `${idx * 0.04}s` }"
								@click="toggleExpand(entry.employee)">
								<div class="flex items-center gap-3">
									<!-- Rank -->
									<div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
										:class="rankClass(entry.rank)">
										{{ entry.rank }}
									</div>
									<!-- Avatar with CircleScore -->
									<div class="flex-shrink-0">
										<CircleScore
											:value="entry.score || 0" :maxValue="100"
											:size="48" :strokeWidth="3" :darkBg="false" />
									</div>
									<!-- Name + Tier -->
									<div class="flex-1 min-w-0">
										<div class="text-base font-bold text-gray-900 truncate">{{ entry.employee_name }}</div>
										<div class="text-sm text-gray-600 font-medium">{{ entry.tier_emoji }} {{ entry.tier }}</div>
									</div>
									<!-- Score -->
									<div class="text-right flex-shrink-0">
										<div class="text-xl font-black" :class="scoreColor(entry.score)">{{ entry.score }}</div>
										<div class="text-sm text-gray-600 font-bold">/100</div>
									</div>
									<!-- EoM badge -->
									<div v-if="entry.is_eom" class="text-xl flex-shrink-0">&#x1F3C6;</div>
									<!-- Expand arrow -->
									<FeatherIcon :name="expanded === entry.employee ? 'chevron-up' : 'chevron-down'"
										class="w-4.5 h-4.5 text-gray-500 flex-shrink-0" />
								</div>

								<!-- Expanded Breakdown -->
								<div v-if="expanded === entry.employee" class="mt-4 pt-4 border-t border-gray-100">
									<div class="grid grid-cols-4 gap-3">
										<div v-for="p in getPillars(entry)" :key="p.key" class="text-center">
											<div class="text-sm font-black" :style="{ color: p.clr }">{{ p.score }}</div>
											<div class="text-sm text-gray-600 font-bold">/{{ p.max }}</div>
											<div class="w-full bg-gray-200 rounded-full h-2 mt-1.5">
												<div class="h-full rounded-full transition-all duration-500" 
													:style="{ width: Math.round(p.score / p.max * 100) + '%', backgroundColor: p.bar }"></div>
											</div>
											<div class="text-sm font-bold text-gray-700 mt-1">{{ p.label }}</div>
										</div>
									</div>
								</div>
							</div>
						</div>

					</template>

					<!-- Empty -->
					<div v-else class="text-center py-20">
						<FeatherIcon name="bar-chart-2" class="w-14 h-14 text-gray-300 mx-auto mb-3" />
						<div class="text-base text-gray-500 font-medium">{{ __("No performance data available") }}</div>
					</div>

				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, computed, inject } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, createResource } from "frappe-ui"
import CircleScore from "@/components/CircleScore.vue"

const __ = inject("$translate")
const router = useRouter()
const expanded = ref(null)

const lb = createResource({
	url: "icd3s_follow_up.sales_performance_score.get_sales_leaderboard",
	auto: true,
	cache: "manager:sales_performance",
})

const eomEntry = computed(() => {
	if (!lb.data?.leaderboard) return null
	return lb.data.leaderboard.find(e => e.is_eom) || null
})

function tierCount(tier) {
	return (lb.data?.leaderboard || []).filter(e => e.tier === tier).length
}

function toggleExpand(emp) {
	expanded.value = expanded.value === emp ? null : emp
}

function rankClass(rank) {
	if (rank === 1) return "bg-amber-100 text-amber-700"
	if (rank === 2) return "bg-purple-100 text-purple-700"
	if (rank === 3) return "bg-orange-100 text-orange-700"
	return "bg-gray-100 text-gray-500"
}

function scoreColor(score) {
	if (score >= 90) return "text-amber-600"
	if (score >= 75) return "text-emerald-600"
	if (score >= 60) return "text-blue-600"
	if (score >= 40) return "text-orange-500"
	return "text-red-500"
}

function getPillars(entry) {
	return [
		{ key: "fu", label: "Follow-Up", score: entry.followup_score || 0, max: 35,
			clr: "#059669", bar: "#10b981" },
		{ key: "qt", label: "Quotation", score: entry.quotation_score || 0, max: 25,
			clr: "#2563eb", bar: "#3b82f6" },
		{ key: "op", label: "Opport.", score: entry.opportunity_score || 0, max: 20,
			clr: "#9333ea", bar: "#a855f7" },
		{ key: "di", label: "Discipline", score: entry.discipline_score || 0, max: 20,
			clr: "#dc2626", bar: "#ef4444" },
	]
}
</script>

<style scoped>
.eom-gradient {
	background: linear-gradient(135deg, #92400e 0%, #d97706 40%, #f59e0b 70%, #fbbf24 100%);
	box-shadow: 0 8px 30px -4px rgba(245, 158, 11, 0.35);
}
</style>
