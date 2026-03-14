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
					<button @click="router.push('/genius/sales-leaderboard')"
						class="ml-auto bg-icd-600 text-white px-3 py-1.5 rounded-xl text-sm font-bold active:bg-icd-700 flex items-center gap-1.5">
						<FeatherIcon name="bar-chart-2" class="w-3.5 h-3.5" />
						{{ __("Leaderboard") }}
					</button>
				</header>

				<!-- Loading -->
				<div v-if="scoreData.loading" class="flex items-center justify-center py-20">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<!-- Not a Sales User -->
				<div v-else-if="!scoreData.data?.is_sales_user" class="flex flex-col items-center justify-center py-20">
					<FeatherIcon name="bar-chart-2" class="w-16 h-16 text-gray-300 mb-4" />
					<div class="text-base text-gray-600 font-medium">{{ __("Sales performance is for Sales Partners only") }}</div>
				</div>

				<div v-else-if="scoreData.data?.current" class="flex flex-col p-3 gap-3 mb-6">

					<!-- Score Hero Card - full width, data-dense -->
					<div class="score-hero rounded-2xl overflow-hidden animate-scale-in">
						<div class="score-hero-gradient px-4 py-4 text-white">
							<!-- Top row: Circle + Info + Trend -->
							<div class="flex items-center gap-3">
								<div class="flex-shrink-0">
									<CircleScore
										:value="current.score" :maxValue="100"
										:size="90" :strokeWidth="5" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-1"
										:class="tierBadgeClass">
										<span class="text-sm">{{ current.tier_emoji }}</span>
										<span class="text-sm font-black">{{ current.tier }}</span>
									</div>
									<div class="text-base text-white font-bold">
										{{ __("Rank") }} #{{ scoreData.data.rank }}
										<span class="text-white/70 font-medium">{{ __("of") }} {{ scoreData.data.total_sp }}</span>
									</div>
									<div class="text-sm text-white/80 font-medium mt-0.5">
										{{ formatPeriod(current.period) }}
									</div>
								</div>
								<!-- Trend on far right -->
								<div v-if="scoreData.data.trend" class="flex-shrink-0 text-right">
									<div class="flex items-center gap-1.5 justify-end">
										<FeatherIcon :name="scoreData.data.trend === 'up' ? 'trending-up' : scoreData.data.trend === 'down' ? 'trending-down' : 'minus'" class="w-5 h-5" :class="trendColor" />
										<span class="text-lg font-black" :class="trendColor">
											{{ scoreData.data.trend_diff > 0 ? '+' : '' }}{{ scoreData.data.trend_diff }}
										</span>
									</div>
									<div class="text-sm text-white/70 font-medium">{{ __("vs last") }}</div>
								</div>
							</div>
							<!-- Bottom row: 4 mini pillar scores spanning full width -->
							<div class="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/15">
								<div v-for="p in miniPillars" :key="p.key" class="text-center">
									<div class="text-base font-black text-white">{{ p.score }}<span class="text-sm font-bold text-white/50">/{{ p.max }}</span></div>
									<div class="text-sm font-bold text-white/70">{{ p.label }}</div>
								</div>
							</div>
						</div>
					</div>

					<!-- 4-Pillar Breakdown Cards -->
					<div class="grid grid-cols-2 gap-2.5">
						<div v-for="pillar in pillars" :key="pillar.key"
							class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-2">
									<div class="w-3 h-3 rounded-full" :style="{ backgroundColor: pillar.dot }"></div>
									<span class="text-sm font-bold text-gray-800">{{ pillar.label }}</span>
								</div>
								<span class="text-sm font-bold text-gray-500">{{ pillar.weight }}</span>
							</div>
							<div class="flex items-baseline gap-1 mb-2">
								<span class="text-2xl font-black" :style="{ color: pillar.scoreClr }">{{ pillar.score }}</span>
								<span class="text-base font-bold text-gray-500">/{{ pillar.max }}</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2.5">
								<div class="h-full rounded-full transition-all duration-700"
									:style="{ width: Math.round(pillar.score / pillar.max * 100) + '%', backgroundColor: pillar.bar }"></div>
							</div>
						</div>
					</div>

					<!-- Next Tier Motivation -->
					<div v-if="scoreData.data.next_tier" class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
						<div class="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-xl flex-shrink-0">
							{{ scoreData.data.next_tier.emoji }}
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-bold text-gray-800">
								{{ scoreData.data.next_tier.points_needed }} {{ __("points to") }}
								<span class="text-icd-600 font-black">{{ scoreData.data.next_tier.name }}</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2 mt-2">
								<div class="h-full rounded-full bg-icd-500 transition-all duration-700"
									:style="{ width: nextTierProgress + '%' }"></div>
							</div>
						</div>
					</div>

					<!-- 6-Month Trend Chart -->
					<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100" @click="loadHistory" style="cursor: pointer; -webkit-tap-highlight-color: transparent;">
						<div class="flex items-center justify-between mb-3">
							<div class="text-sm font-bold text-gray-800">{{ __("6-Month Trend") }}</div>
							<div v-if="scoreData.data.trend" class="flex items-center gap-1.5">
								<FeatherIcon :name="scoreData.data.trend === 'up' ? 'trending-up' : scoreData.data.trend === 'down' ? 'trending-down' : 'minus'" class="w-4 h-4" :class="trendColorDark" />
								<span class="text-sm font-bold" :class="trendColorDark">
									{{ scoreData.data.trend_diff > 0 ? '+' : '' }}{{ scoreData.data.trend_diff }}
								</span>
							</div>
						</div>
						<div v-if="historyData.data?.history?.length > 1" class="relative" style="height: 90px;">
							<svg width="100%" height="90" :viewBox="`0 0 ${chartWidth} 90`" preserveAspectRatio="none">
								<line v-for="y in [22, 45, 68]" :key="'g'+y" x1="0" :y1="y" :x2="chartWidth" :y2="y" stroke="rgba(0,0,0,0.05)" stroke-width="0.5" />
								<path :d="chartAreaPath" fill="url(#sparkGrad)" opacity="0.25" />
								<polyline :points="chartPoints" fill="none" stroke="#7B2FA0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
								<circle v-for="(pt, i) in chartDots" :key="'d'+i" :cx="pt.x" :cy="pt.y" r="4" fill="#7B2FA0" stroke="white" stroke-width="2" />
								<defs>
									<linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stop-color="#7B2FA0" />
										<stop offset="100%" stop-color="#7B2FA0" stop-opacity="0" />
									</linearGradient>
								</defs>
							</svg>
							<div class="flex justify-between mt-1.5 px-1">
								<span v-for="h in historyData.data.history" :key="h.month+'-'+h.year"
									class="text-sm text-gray-600 font-bold">
									{{ monthShort(h.month) }}
								</span>
							</div>
						</div>
						<div v-else class="text-center py-5">
							<div class="text-sm text-gray-600 font-medium">{{ __("Tap to load trend data") }}</div>
						</div>
					</div>

					<!-- Recent Violations -->
					<div v-if="scoreData.data.violations?.length > 0" class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
						<div class="flex items-center justify-between mb-3">
							<div class="text-sm font-bold text-gray-800">{{ __("Recent Violations") }}</div>
							<span class="text-sm font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600">
								{{ scoreData.data.violations.length }}
							</span>
						</div>
						<div class="flex flex-col gap-2">
							<div v-for="v in scoreData.data.violations.slice(0, 5)" :key="v.name"
								@click="router.push({ name: 'DisciplinaryDetail', params: { id: v.name } })"
								class="flex items-start gap-3 p-3 rounded-xl bg-gray-50 active:bg-gray-100 cursor-pointer"
								:class="severityBorder(v.severity)">
								<div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
									:class="severityIconBg(v.severity)">
									<FeatherIcon name="alert-triangle" class="w-4 h-4" :class="severityIconColor(v.severity)" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-bold text-gray-900">{{ v.action_type }}</div>
									<div class="text-sm text-gray-600 mt-0.5">
										{{ formatDate(v.incident_date) }}
										<span v-if="v.penalty_type" class="ml-1.5 font-bold" :class="v.penalty_type === 'Warning' ? 'text-amber-600' : 'text-red-600'">
											· {{ v.penalty_type }}
										</span>
										<span class="ml-1.5 font-medium">· {{ v.status }}</span>
									</div>
								</div>
								<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-500 flex-shrink-0 mt-2" />
							</div>
						</div>
					</div>

					<!-- Employee of the Month -->
					<div v-if="scoreData.data.eom_winner" class="eom-card rounded-2xl overflow-hidden">
						<div class="eom-gradient px-5 py-4 text-white">
							<div class="flex items-center gap-4">
								<div class="text-3xl">&#x1F3C6;</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-bold text-white/80">{{ __("Employee of the Month") }}</div>
									<div class="text-base font-bold truncate mt-0.5">{{ scoreData.data.eom_winner.employee_name }}</div>
									<div class="text-sm font-semibold text-white/80">
										{{ scoreData.data.eom_winner.total_score }}/100 · {{ scoreData.data.eom_winner.tier }}
									</div>
								</div>
								<div class="text-right flex-shrink-0">
									<div class="text-sm text-white/80 font-bold">{{ __("Prize") }}</div>
									<div class="text-lg font-black">EGP 1K</div>
								</div>
							</div>
						</div>
					</div>

				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { computed, onMounted, inject } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, createResource } from "frappe-ui"
import CircleScore from "@/components/CircleScore.vue"
import dayjs from "@/utils/dayjs"

const __ = inject("$translate")
const router = useRouter()

const scoreData = createResource({
	url: "icd3s_follow_up.sales_performance_score.get_my_score",
	auto: true,
	cache: "genius:sales_score_detail",
})

const historyData = createResource({
	url: "icd3s_follow_up.sales_performance_score.get_my_score_history",
	cache: "genius:sales_score_history",
})

function loadHistory() {
	if (!historyData.data?.history?.length) {
		historyData.reload()
	}
}

onMounted(() => {
	historyData.reload()
})

const current = computed(() => scoreData.data?.current || {})

const miniPillars = computed(() => {
	const c = current.value
	return [
		{ key: "fu", label: "Follow-up", score: c.followup_score || 0, max: c.followup_max || 35 },
		{ key: "qt", label: "Quotation", score: c.quotation_score || 0, max: c.quotation_max || 25 },
		{ key: "op", label: "Opport.", score: c.opportunity_score || 0, max: c.opportunity_max || 20 },
		{ key: "di", label: "Discipline", score: c.discipline_score || 0, max: c.discipline_max || 20 },
	]
})

const pillars = computed(() => {
	const c = current.value
	return [
		{ key: "fu", label: "Follow-up", weight: "35%", score: c.followup_score || 0, max: c.followup_max || 35,
			dot: "#10b981", scoreClr: "#059669", bar: "#10b981" },
		{ key: "qt", label: "Quotation", weight: "25%", score: c.quotation_score || 0, max: c.quotation_max || 25,
			dot: "#3b82f6", scoreClr: "#2563eb", bar: "#3b82f6" },
		{ key: "op", label: "Opportunity", weight: "20%", score: c.opportunity_score || 0, max: c.opportunity_max || 20,
			dot: "#a855f7", scoreClr: "#9333ea", bar: "#a855f7" },
		{ key: "di", label: "Discipline", weight: "20%", score: c.discipline_score || 0, max: c.discipline_max || 20,
			dot: "#ef4444", scoreClr: "#dc2626", bar: "#ef4444" },
	]
})

const tierBadgeClass = computed(() => {
	const tier = current.value.tier
	const map = {
		"Champion": "bg-amber-400/30 text-amber-100",
		"Star": "bg-emerald-400/30 text-emerald-100",
		"Performer": "bg-blue-400/30 text-blue-100",
		"Developing": "bg-amber-400/30 text-amber-200",
		"At Risk": "bg-red-400/30 text-red-200",
	}
	return map[tier] || "bg-white/20 text-white/80"
})

const trendColor = computed(() => {
	const t = scoreData.data?.trend
	if (t === "up") return "text-green-300"
	if (t === "down") return "text-red-300"
	return "text-white/60"
})

const trendColorDark = computed(() => {
	const t = scoreData.data?.trend
	if (t === "up") return "text-emerald-600"
	if (t === "down") return "text-red-500"
	return "text-gray-500"
})

const nextTierProgress = computed(() => {
	if (!scoreData.data?.next_tier) return 100
	const score = current.value.score || 0
	const needed = scoreData.data.next_tier.points_needed || 1
	const tierMin = score + needed
	const prevTierMin = tierMin - (tierMin >= 90 ? 15 : tierMin >= 75 ? 15 : tierMin >= 60 ? 20 : tierMin >= 40 ? 20 : 40)
	return Math.min(Math.round((score - prevTierMin) / (tierMin - prevTierMin) * 100), 99)
})

const chartWidth = 280
const chartDots = computed(() => {
	const h = historyData.data?.history || []
	if (h.length < 2) return []
	const step = chartWidth / (h.length - 1)
	return h.map((entry, i) => ({
		x: Math.round(i * step),
		y: Math.round(85 - (entry.score / 100) * 75 - 5),
	}))
})
const chartPoints = computed(() => chartDots.value.map(d => `${d.x},${d.y}`).join(" "))
const chartAreaPath = computed(() => {
	const dots = chartDots.value
	if (dots.length < 2) return ""
	const pts = dots.map(d => `${d.x},${d.y}`).join(" L ")
	return `M ${dots[0].x},85 L ${pts} L ${dots[dots.length - 1].x},85 Z`
})

function monthShort(m) {
	return ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m] || ""
}

function formatPeriod(period) {
	if (!period) return ""
	// Convert dates from YYYY-MM-DD to DD-MM-YYYY
	return period.replace(/(\d{4})-(\d{2})-(\d{2})/g, "$3-$2-$1").replace(/ to /g, " - ")
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}

function severityBorder(sev) {
	const map = { "Minor": "border-l-3 border-l-yellow-400", "Moderate": "border-l-3 border-l-orange-400", "Major": "border-l-3 border-l-red-500", "Critical": "border-l-3 border-l-red-700" }
	return map[sev] || ""
}
function severityIconBg(sev) {
	const map = { "Minor": "bg-yellow-100", "Moderate": "bg-orange-100", "Major": "bg-red-100", "Critical": "bg-red-200" }
	return map[sev] || "bg-gray-100"
}
function severityIconColor(sev) {
	const map = { "Minor": "text-yellow-600", "Moderate": "text-orange-600", "Major": "text-red-600", "Critical": "text-red-800" }
	return map[sev] || "text-gray-600"
}
</script>

<style scoped>
.score-hero {
	box-shadow: 0 8px 30px -4px rgba(59, 7, 100, 0.35);
}
.score-hero-gradient {
	background: linear-gradient(135deg, #3b0764 0%, #5b21b6 40%, #7c3aed 70%, #a78bfa 100%);
}
.eom-card { box-shadow: 0 8px 30px -4px rgba(245, 158, 11, 0.35); }
.eom-gradient { background: linear-gradient(135deg, #92400e 0%, #d97706 40%, #f59e0b 70%, #fbbf24 100%); }
</style>
