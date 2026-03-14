<template>
	<BaseLayout :pageTitle="__('GENIUS')">
		<template #body>
			<div class="flex flex-col mt-3 mb-7 px-4 gap-4">

				<!-- Compact Score Strip (not a full dashboard) -->
				<div class="genius-score-strip rounded-2xl overflow-hidden shadow-md">
					<div class="genius-strip-gradient px-4 py-3 text-white flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="flex flex-col">
								<div class="text-[11px] uppercase tracking-wider opacity-70 font-semibold">{{ __("GENIUS Score") }}</div>
								<div class="text-2xl font-black" style="font-variant-numeric: tabular-nums;">
									{{ points.data?.current_month?.total_points || 0 }}
									<span class="text-xs font-medium opacity-60">{{ __("pts") }}</span>
								</div>
							</div>
							<div v-if="points.data?.current_month?.monthly_rank" class="bg-white/20 rounded-full px-2 py-0.5 text-[11px] font-bold self-start mt-0.5">
								#{{ points.data.current_month.monthly_rank }}
							</div>
						</div>
						<div class="flex items-center gap-3">
							<!-- Mini Stats -->
							<div class="flex gap-2">
								<div class="text-center">
									<div class="text-base font-bold">{{ streaks.data?.current_streak || 0 }}</div>
									<div class="text-[8px] opacity-60">&#x1F525; {{ __("Streak") }}</div>
								</div>
								<div class="text-center">
									<div class="text-base font-bold">{{ badges.data?.total_badges || 0 }}</div>
									<div class="text-[8px] opacity-60">&#x1F3C5; {{ __("Badges") }}</div>
								</div>
							</div>
							<button @click="refreshGenius" class="genius-refresh-btn" :class="{ 'is-spinning': geniusRefreshing }">
								<FeatherIcon name="refresh-cw" class="w-3 h-3" />
							</button>
						</div>
					</div>
					<!-- AI Insight Strip -->
					<div v-if="burnout.data?.recommendations?.length > 0 || absence.data?.prediction_score" class="bg-white/95 dark:bg-white/10 px-4 py-2 flex items-center gap-2 border-t border-gray-100 dark:border-white/10">
						<span class="text-sm flex-shrink-0">&#x1F9E0;</span>
						<span class="text-[11px] text-gray-600 dark:text-gray-400 leading-tight truncate">
							{{ burnout.data?.recommendations?.[0] || __("Attendance probability: {0}%", [((absence.data?.prediction_score ?? 0) * 100).toFixed(0)]) }}
						</span>
					</div>
				</div>

				<!-- Quick Access Grid -->
				<div>
					<div class="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-wider mb-2.5 px-0.5">{{ __("Quick Access") }}</div>
					<div class="grid grid-cols-4 gap-2.5">
						<router-link
							v-for="action in quickActions"
							:key="action.label"
							:to="action.to || { name: action.route }"
							class="bg-white dark:bg-white/10 rounded-xl py-3 px-1 shadow-sm dark:shadow-none flex flex-col items-center gap-1.5 active:scale-95 transition"
						>
							<div class="w-9 h-9 rounded-full flex items-center justify-center text-base" :class="action.bg">
								{{ action.emoji }}
							</div>
							<span class="text-[11px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">{{ action.label }}</span>
						</router-link>
					</div>
				</div>

				<!-- Recent Badges -->
				<div v-if="badges.data?.earned_badges?.length > 0">
					<div class="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-wider mb-2.5 px-0.5">{{ __("Recent Badges") }}</div>
					<div class="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">
						<div
							v-for="badge in badges.data.earned_badges.slice(0, 6)"
							:key="badge.badge"
							class="flex-shrink-0 bg-white dark:bg-white/10 rounded-xl p-2.5 shadow-sm dark:shadow-none text-center w-20"
						>
							<div class="text-xl mb-0.5">{{ getBadgeEmoji(badge.badge_type) }}</div>
							<div class="text-[11px] font-medium text-gray-800 dark:text-gray-200 leading-tight truncate">{{ badge.badge_name }}</div>
							<div class="text-[11px] text-icd-500 dark:text-icd-300 mt-0.5 font-bold">+{{ badge.points_awarded }}</div>
						</div>
					</div>
				</div>

				<!-- Compliance -->
				<router-link v-if="compliance.data" :to="{ name: 'GeniusCompliance' }" class="block">
					<div class="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase tracking-wider mb-2.5 px-0.5">{{ __("Compliance") }}</div>
					<div class="bg-white dark:bg-white/10 rounded-xl p-4 shadow-sm dark:shadow-none">
						<div class="flex items-center justify-between mb-2.5">
							<div class="flex items-center gap-2">
								<span class="text-lg">&#x1F6E1;</span>
								<span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ __("Labor Law") }}</span>
							</div>
							<span
								class="px-2.5 py-0.5 rounded-full text-xs font-bold"
								:class="compliance.data.compliance_score >= 80 ? 'bg-green-100 dark:bg-green-800/40 text-green-700' : compliance.data.compliance_score >= 50 ? 'bg-yellow-100 dark:bg-yellow-800/40 text-yellow-700' : 'bg-red-100 dark:bg-red-800/40 text-red-700'"
							>
								{{ compliance.data.compliance_score || 0 }}%
							</span>
						</div>
						<div class="w-full bg-gray-200 dark:bg-white/15 rounded-full h-2 mb-3">
							<div
								class="h-2 rounded-full transition-all duration-500"
								:class="compliance.data.compliance_score >= 80 ? 'bg-green-500' : compliance.data.compliance_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'"
								:style="{ width: (compliance.data.compliance_score || 0) + '%' }"
							></div>
						</div>
						<div v-if="compliance.data.checks" class="grid grid-cols-2 gap-2">
							<div
								v-for="(check, key) in compliance.data.checks"
								:key="key"
								class="flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-lg px-2.5 py-2"
							>
								<div
									class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
									:class="check.compliant ? 'bg-green-100 dark:bg-green-800/40' : 'bg-orange-100 dark:bg-orange-800/40'"
								>
									<FeatherIcon
										:name="check.compliant ? 'check' : 'alert-triangle'"
										class="w-3.5 h-3.5"
										:class="check.compliant ? 'text-green-600' : 'text-orange-500'"
									/>
								</div>
								<span class="text-[11px] font-medium text-gray-700 dark:text-gray-300 leading-tight">{{ formatCheckName(key) }}</span>
							</div>
						</div>
						<div class="flex items-center justify-center gap-1 mt-3 text-[11px] text-icd-500 dark:text-icd-300 font-medium">
							<span>{{ __("View Details") }}</span>
							<FeatherIcon name="chevron-right" class="w-3 h-3" />
						</div>
					</div>
				</router-link>

			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { inject, ref } from "vue"
import { createResource, FeatherIcon, toast } from "frappe-ui"

import BaseLayout from "@/components/BaseLayout.vue"

const employee = inject("$employee")
const __ = inject("$translate")

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const geniusRefreshing = ref(false)
const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

const points = createResource({
	url: `${API_BASE}.gamification.get_points`,
	auto: true,
	cache: "genius:dash:points",
	makeParams() { return { employee: employee.data?.name, months: 1 } },
})

const streaks = createResource({
	url: `${API_BASE}.gamification.get_attendance_streaks`,
	auto: true,
	cache: "genius:dash:streaks",
	makeParams() { return { employee: employee.data?.name } },
})

const badges = createResource({
	url: `${API_BASE}.gamification.get_badges`,
	auto: true,
	cache: "genius:dash:badges",
	makeParams() { return { employee: employee.data?.name, include_available: 0 } },
})

const burnout = createResource({
	url: `${API_BASE}.ai_intelligence.get_burnout_risk`,
	auto: true,
	cache: "genius:dash:burnout",
	makeParams() { return { employee: employee.data?.name } },
})

const absence = createResource({
	url: `${API_BASE}.ai_intelligence.get_absence_prediction`,
	auto: true,
	cache: "genius:dash:absence",
	makeParams() { return { employee: employee.data?.name } },
})

const compliance = createResource({
	url: `${API_BASE}.compliance.get_compliance_status`,
	auto: true,
	cache: "genius:dash:compliance",
	makeParams() { return { employee: employee.data?.name } },
})

async function refreshGenius() {
	if (geniusRefreshing.value) return
	geniusRefreshing.value = true
	try {
		const minDelay = new Promise(r => setTimeout(r, 600))
		await Promise.all([
			points.reload(),
			streaks.reload(),
			badges.reload(),
			burnout.reload(),
			compliance.reload(),
			minDelay,
		])
	} catch (e) {
		_errToast(e, "Failed to refresh data")
	}
	geniusRefreshing.value = false
}

const quickActions = [
	{ emoji: "\u{1F4E5}", label: __("Inbox"), route: "GeniusInbox", bg: "bg-red-100 dark:bg-red-800/40" },
	{ emoji: "\u{1F4CA}", label: __("Analytics"), route: "GeniusAnalytics", bg: "bg-icd-100 dark:bg-icd-800/40" },
	{ emoji: "\u{1F3C6}", label: __("Leaders"), route: "GeniusLeaderboard", bg: "bg-amber-100 dark:bg-amber-800/40" },
	{ emoji: "\u{1F3C5}", label: __("Badges"), route: "GeniusBadges", bg: "bg-purple-100 dark:bg-purple-800/40" },
	{ emoji: "\u{1F381}", label: __("Rewards"), route: "GeniusRewards", bg: "bg-green-100 dark:bg-green-800/40" },
	{ emoji: "\u{1F3C1}", label: __("Challenge"), route: "GeniusChallenges", bg: "bg-red-100 dark:bg-red-800/40" },
	{ emoji: "\u{1F4B0}", label: __("Salary"), route: "GeniusSalary", bg: "bg-emerald-100 dark:bg-emerald-800/40" },
	{ emoji: "\u{1F334}", label: __("Leaves"), route: "GeniusLeaves", bg: "bg-sky-100 dark:bg-sky-800/40" },
	{ emoji: "\u{1F6E1}", label: __("Permits"), route: "GeniusPermission", bg: "bg-violet-100 dark:bg-violet-800/40" },
	{ emoji: "\u{1F4C5}", label: __("My History"), route: "GeniusMyHistory", bg: "bg-cyan-100 dark:bg-cyan-800/40" },
	{ emoji: "\u{1F464}", label: __("Profile"), route: "GeniusProfile", bg: "bg-indigo-100 dark:bg-indigo-800/40" },
	{ emoji: "\u{1F6E1}", label: __("Comply"), route: "GeniusCompliance", bg: "bg-orange-100 dark:bg-orange-800/40" },
	{ emoji: "\u{1F9E0}", label: __("Insights"), route: "GeniusInsights", bg: "bg-teal-100 dark:bg-teal-800/40" },
	{ emoji: "\u{1F4C8}", label: __("Sales Score"), route: "GeniusSalesScore", bg: "bg-rose-100 dark:bg-rose-800/40" },
	{ emoji: "\u{2699}", label: __("Settings"), route: "GeniusSettings", bg: "bg-gray-100 dark:bg-white/10" },
]

function formatCheckName(key) {
	const names = {
		working_hours: __("Working Hours"),
		leave_entitlement: __("Leave Entitlement"),
		overtime_rates: __("Overtime Rates"),
		grace_period: __("Grace Period"),
		rest_days: __("Rest Days"),
		probation: __("Probation"),
	}
	return names[key] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

function getBadgeEmoji(type) {
	const map = {
		"Attendance": "\u{1F3AF}",
		"Punctuality": "\u{23F0}",
		"Streak": "\u{1F525}",
		"Performance": "\u{2B50}",
		"Team": "\u{1F91D}",
	}
	return map[type] || "\u{1F3C5}"
}
</script>

<style scoped>
.genius-strip-gradient {
	background: linear-gradient(135deg, #3b0764 0%, #5b21b6 50%, #7c3aed 100%);
}
.genius-score-strip {
	border: 1px solid rgba(77, 6, 123, 0.1);
}
.genius-refresh-btn {
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	border: 1px solid rgba(255, 255, 255, 0.2);
	background: rgba(255, 255, 255, 0.12);
	color: rgba(255, 255, 255, 0.8);
	cursor: pointer;
	transition: all 0.25s ease;
}
.genius-refresh-btn:active {
	transform: scale(0.88);
	background: rgba(255, 255, 255, 0.2);
}
.genius-refresh-btn.is-spinning svg {
	animation: genius-spin 0.7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes genius-spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}
.bg-icd-100 {
	background-color: #f3e8ff;
}
</style>
