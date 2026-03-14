<template>
	<BaseLayout :pageTitle="__('AI Insights')" :showBack="true">
		<template #body>
			<div class="flex flex-col mt-2 mb-7 px-4 gap-3">

				<!-- Burnout Risk -->
				<div class="card-premium overflow-hidden">
					<div class="flex items-center gap-2.5 p-3.5 border-b border-gray-100 dark:border-white/5">
						<div class="w-9 h-9 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-800/30 dark:to-orange-800/20 flex items-center justify-center flex-shrink-0">
							<span class="text-base">&#x1F525;</span>
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ __("Burnout Risk") }}</div>
							<div class="text-[11px] text-gray-700 dark:text-gray-400">{{ __("Based on recent attendance patterns") }}</div>
						</div>
						<span v-if="burnout.data?.risk_level"
							class="text-[11px] font-bold capitalize px-2.5 py-1 rounded-full"
							:class="riskBadgeClass(burnout.data.risk_level)">
							{{ burnout.data.risk_level }}
						</span>
					</div>
					<div class="p-3.5">
						<div v-if="burnout.loading" class="flex items-center justify-center py-6">
							<LoadingIndicator class="w-5 h-5 text-gray-600" />
						</div>
						<div v-else-if="burnout.data">
							<div class="flex items-center gap-3 mb-3">
								<div class="flex-1 bg-gray-200 dark:bg-white/15 rounded-full h-2.5">
									<div class="h-2.5 rounded-full transition-all duration-500"
										:class="burnoutBarClass"
										:style="{ width: (burnout.data.risk_score || 0) + '%' }"></div>
								</div>
								<span class="text-sm font-black text-gray-700 dark:text-gray-200 w-10 text-right" style="font-variant-numeric:tabular-nums">
									{{ burnout.data.risk_score || 0 }}%
								</span>
							</div>
							<div v-if="burnout.data.risk_factors?.length" class="flex flex-col gap-2">
								<div v-for="rf in burnout.data.risk_factors" :key="rf.factor"
									class="flex items-start gap-2 bg-gray-100 dark:bg-white/5 rounded-lg p-2.5">
									<FeatherIcon name="alert-triangle" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
									<div class="flex-1 min-w-0">
										<div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ rf.factor }}</div>
										<div v-if="rf.detail" class="text-[11px] text-gray-700 dark:text-gray-400 mt-0.5">{{ rf.detail }}</div>
									</div>
								</div>
							</div>
							<div v-if="burnout.data.recommendations?.length" class="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
								<div class="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">{{ __("Recommendations") }}</div>
								<div v-for="(rec, i) in burnout.data.recommendations" :key="i"
									class="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-start gap-1.5">
									<span class="text-green-500 flex-shrink-0 mt-0.5">&#x2713;</span>
									<span>{{ rec }}</span>
								</div>
							</div>
						</div>
						<div v-else class="text-center py-4">
							<div class="text-sm text-gray-600">{{ __("No data available") }}</div>
						</div>
					</div>
				</div>

				<!-- Attendance Forecast -->
				<div class="card-premium overflow-hidden">
					<div class="flex items-center gap-2.5 p-3.5 border-b border-gray-100 dark:border-white/5">
						<div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-800/30 dark:to-indigo-800/20 flex items-center justify-center flex-shrink-0">
							<span class="text-base">&#x1F4CA;</span>
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ __("Attendance Forecast") }}</div>
							<div class="text-[11px] text-gray-700 dark:text-gray-400">{{ __("Predicted attendance probability") }}</div>
						</div>
					</div>
					<div class="p-3.5">
						<div v-if="absence.loading" class="flex items-center justify-center py-6">
							<LoadingIndicator class="w-5 h-5 text-gray-600" />
						</div>
						<div v-else-if="absence.data?.prediction_score != null">
							<div class="flex items-center gap-4 mb-4">
								<div class="relative w-20 h-20">
									<svg class="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
										<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
											fill="none" stroke-width="3" class="stroke-gray-200 dark:stroke-white/10" />
										<path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
											fill="none" stroke-width="3" stroke-linecap="round"
											class="stroke-blue-500"
											:stroke-dasharray="`${attendProb}, 100`" />
									</svg>
									<div class="absolute inset-0 flex items-center justify-center">
										<span class="text-lg font-black text-gray-900 dark:text-gray-100" style="font-variant-numeric:tabular-nums">{{ attendProb }}%</span>
									</div>
								</div>
								<div class="flex-1">
									<div class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ __("Attendance Probability") }}</div>
									<div class="text-xs text-gray-700 dark:text-gray-400 mt-1">{{ __("Based on historical patterns and trends") }}</div>
								</div>
							</div>
							<div v-if="absence.data.day_of_week_analysis?.length" class="mt-1">
								<div class="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">{{ __("Risk by Day") }}</div>
								<div class="grid grid-cols-7 gap-1">
									<div v-for="d in absence.data.day_of_week_analysis" :key="d.day"
										class="text-center rounded-lg py-2"
										:class="d.risk_level === 'high' ? 'bg-red-50 dark:bg-red-800/15' : d.risk_level === 'medium' ? 'bg-amber-50 dark:bg-amber-800/15' : 'bg-green-50 dark:bg-green-800/15'">
										<div class="text-[11px] font-bold text-gray-700 dark:text-gray-400">{{ d.day.slice(0, 2) }}</div>
										<div class="text-[11px] font-black mt-0.5"
											:class="d.risk_level === 'high' ? 'text-red-600' : d.risk_level === 'medium' ? 'text-amber-600' : 'text-green-600'">
											{{ d.absence_rate }}%
										</div>
									</div>
								</div>
							</div>
						</div>
						<div v-else class="text-center py-4">
							<div class="text-sm text-gray-600">{{ __("No data available") }}</div>
						</div>
					</div>
				</div>

				<!-- Pattern Detection -->
				<div class="card-premium overflow-hidden">
					<div class="flex items-center gap-2.5 p-3.5 border-b border-gray-100 dark:border-white/5">
						<div class="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-800/30 dark:to-violet-800/20 flex items-center justify-center flex-shrink-0">
							<span class="text-base">&#x1F50D;</span>
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ __("Pattern Detection") }}</div>
							<div class="text-[11px] text-gray-700 dark:text-gray-400">{{ __("Anomalies in your attendance") }}</div>
						</div>
						<span v-if="anomaly.data?.anomalies?.length"
							class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-800/25 dark:text-purple-300">
							{{ anomaly.data.anomalies.length }}
						</span>
					</div>
					<div class="p-3.5">
						<div v-if="anomaly.loading" class="flex items-center justify-center py-6">
							<LoadingIndicator class="w-5 h-5 text-gray-600" />
						</div>
						<div v-else-if="anomaly.data?.anomalies?.length">
							<div v-for="(a, i) in anomaly.data.anomalies" :key="i"
								class="flex items-start gap-2.5 bg-gray-100 dark:bg-white/5 rounded-lg p-2.5 mb-2 last:mb-0">
								<div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
									:class="a.severity === 'high' ? 'bg-red-100 dark:bg-red-800/30' : a.severity === 'medium' ? 'bg-amber-100 dark:bg-amber-800/30' : 'bg-blue-100 dark:bg-blue-800/30'">
									<FeatherIcon name="zap" class="w-3 h-3"
										:class="a.severity === 'high' ? 'text-red-500' : a.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ a.type }}</div>
									<div class="text-[11px] text-gray-700 dark:text-gray-400 mt-0.5">{{ a.detail }}</div>
								</div>
							</div>
						</div>
						<div v-else class="flex items-center gap-2 py-4 justify-center">
							<FeatherIcon name="check-circle" class="w-5 h-5 text-green-500" />
							<span class="text-sm font-medium text-green-600 dark:text-green-400">{{ __("No anomalies detected") }}</span>
						</div>
					</div>
				</div>

				<!-- Smart Corrections -->
				<div v-if="corrections.data?.corrections?.length" class="card-premium overflow-hidden">
					<div class="flex items-center gap-2.5 p-3.5 border-b border-gray-100 dark:border-white/5">
						<div class="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-800/30 dark:to-emerald-800/20 flex items-center justify-center flex-shrink-0">
							<span class="text-base">&#x1F527;</span>
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ __("Suggested Corrections") }}</div>
							<div class="text-[11px] text-gray-700 dark:text-gray-400">{{ __("Records that may need fixing") }}</div>
						</div>
						<span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-800/25 dark:text-teal-300">
							{{ corrections.data.corrections.length }}
						</span>
					</div>
					<div class="divide-y divide-gray-50 dark:divide-white/5">
						<div v-for="(c, i) in corrections.data.corrections" :key="i"
							class="flex items-start gap-2.5 p-3.5">
							<div class="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-800/30 flex items-center justify-center flex-shrink-0 mt-0.5">
								<FeatherIcon name="edit-3" class="w-3 h-3 text-teal-600 dark:text-teal-400" />
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ c.reason }}</div>
								<div class="text-[11px] text-gray-700 dark:text-gray-400 mt-0.5">{{ c.date }}</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Weather Impact -->
				<div v-if="weather.data?.day_of_week_impact?.length" class="card-premium overflow-hidden">
					<div class="flex items-center gap-2.5 p-3.5 border-b border-gray-100 dark:border-white/5">
						<div class="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-sky-800/30 dark:to-cyan-800/20 flex items-center justify-center flex-shrink-0">
							<span class="text-base">&#x26C5;</span>
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-bold text-gray-900 dark:text-gray-100">{{ __("Weather Impact") }}</div>
							<div class="text-[11px] text-gray-700 dark:text-gray-400">{{ __("How weather affects punctuality") }}</div>
						</div>
					</div>
					<div class="p-3.5">
						<div class="grid grid-cols-7 gap-1.5">
							<div v-for="day in weather.data.day_of_week_impact" :key="day.day"
								class="text-center rounded-xl py-2.5"
								:class="day.impact === 'high' ? 'bg-red-50 dark:bg-red-800/15' : day.impact === 'medium' ? 'bg-amber-50 dark:bg-amber-800/15' : 'bg-green-50 dark:bg-green-800/15'">
								<div class="text-[11px] font-bold text-gray-700 dark:text-gray-400">{{ day.day.slice(0, 2) }}</div>
								<div class="text-xs font-black mt-0.5"
									:class="day.impact === 'high' ? 'text-red-600' : day.impact === 'medium' ? 'text-amber-600' : 'text-green-600'">
									{{ day.late_rate }}%
								</div>
							</div>
						</div>
						<div v-if="weather.data.overall_impact" class="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
							<div class="text-xs text-gray-600 dark:text-gray-400">{{ weather.data.overall_impact }}</div>
						</div>
					</div>
				</div>

				<div class="h-4"></div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { inject, computed } from "vue"
import { createResource, FeatherIcon, LoadingIndicator } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const employee = inject("$employee")
const __ = inject("$translate")

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

const burnout = createResource({
	url: `${API_BASE}.ai_intelligence.get_burnout_risk`,
	auto: true, cache: "insights:burnout",
	makeParams() { return { employee: employee.data?.name } },
})

const absence = createResource({
	url: `${API_BASE}.ai_intelligence.get_absence_prediction`,
	auto: true, cache: "insights:absence",
	makeParams() { return { employee: employee.data?.name } },
})

const anomaly = createResource({
	url: `${API_BASE}.ai_intelligence.get_anomaly_detection`,
	auto: true, cache: "insights:anomaly",
	makeParams() { return { employee: employee.data?.name } },
})

const corrections = createResource({
	url: `${API_BASE}.ai_intelligence.get_smart_corrections`,
	auto: true, cache: "insights:corrections",
	makeParams() { return { employee: employee.data?.name } },
})

const weather = createResource({
	url: `${API_BASE}.ai_intelligence.get_weather_impact`,
	auto: true, cache: "insights:weather",
	makeParams() { return { employee: employee.data?.name } },
})

const attendProb = computed(() => {
	if (absence.data?.prediction_score == null) return 0
	return Math.round(100 - absence.data.prediction_score)
})

const burnoutBarClass = computed(() => {
	const lvl = burnout.data?.risk_level
	if (["critical", "high"].includes(lvl)) return "bg-red-500"
	if (lvl === "medium") return "bg-amber-500"
	return "bg-green-500"
})

function riskBadgeClass(level) {
	if (["critical", "high"].includes(level)) return "bg-red-100 text-red-700 dark:bg-red-800/25 dark:text-red-300"
	if (level === "medium") return "bg-amber-100 text-amber-700 dark:bg-amber-800/25 dark:text-amber-300"
	return "bg-green-100 text-green-700 dark:bg-green-800/25 dark:text-green-300"
}
</script>
