<template>
	<ion-page>
		<div class="app-bg-ambient"></div>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 -ml-1" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5 text-gray-700" />
					</button>
					<h2 class="text-lg font-bold text-gray-900 ml-1">{{ __("Sales Leaderboard") }}</h2>
				</header>

				<div class="flex flex-col p-3 gap-3">

					<!-- Loading -->
					<div v-if="lb.loading" class="flex items-center justify-center py-20">
						<LoadingIndicator class="w-8 h-8 text-gray-600" />
					</div>

					<template v-else-if="lb.data?.leaderboard?.length">

						<!-- Sports Podium Stage -->
						<div v-if="lb.data.leaderboard.length >= 3" class="podium-stage rounded-3xl overflow-hidden mt-1">
							<!-- Spotlight effects -->
							<div class="spotlight spotlight-1"></div>
							<div class="spotlight spotlight-2"></div>
							<div class="spotlight spotlight-3"></div>

							<!-- Title -->
							<div class="text-center pt-5 pb-2 relative z-10">
								<div class="text-sm font-black text-white/40 uppercase tracking-[0.2em]">{{ __("Top Performers") }}</div>
							</div>

							<!-- Podium layout: 2nd - 1st - 3rd -->
							<div class="flex items-end justify-center px-3 pb-0 relative z-10" style="min-height: 280px;">

								<!-- 2nd Place -->
								<div class="flex flex-col items-center w-[30%] animate-rise-2">
									<!-- Medal -->
									<div class="medal-silver w-8 h-8 rounded-full flex items-center justify-center text-base font-black mb-2 shadow-lg">2</div>
									<!-- Circle Score -->
									<CircleScore
										:value="lb.data.leaderboard[1]?.score || 0" :maxValue="100"
										:size="66" :strokeWidth="3.5" />
									<!-- Name + Tier -->
									<div class="text-sm font-bold text-white mt-2 text-center truncate w-full">
										{{ lb.data.leaderboard[1]?.employee_name?.split(' ')[0] }}
									</div>
									<div class="text-sm text-white/70 font-medium">{{ lb.data.leaderboard[1]?.tier_emoji }} {{ lb.data.leaderboard[1]?.tier }}</div>
									<!-- Podium Block -->
									<div class="podium-block podium-silver w-full mt-3">
										<div class="podium-block-inner py-8 text-center">
											<div class="text-2xl font-black text-white/90">{{ lb.data.leaderboard[1]?.score }}</div>
											<div class="text-sm font-bold text-white/50">pts</div>
										</div>
									</div>
								</div>

								<!-- 1st Place (tallest) -->
								<div class="flex flex-col items-center w-[34%] animate-rise-1">
									<!-- Crown -->
									<div class="crown-glow text-3xl mb-1">&#x1F451;</div>
									<!-- Circle Score -->
									<CircleScore
										:value="lb.data.leaderboard[0]?.score || 0" :maxValue="100"
										:size="82" :strokeWidth="4.5" />
									<!-- Name + Tier -->
									<div class="text-base font-black text-white mt-2 text-center truncate w-full">
										{{ lb.data.leaderboard[0]?.employee_name?.split(' ')[0] }}
									</div>
									<div class="text-sm font-bold text-amber-300">{{ lb.data.leaderboard[0]?.tier_emoji }} {{ lb.data.leaderboard[0]?.tier }}</div>
									<!-- EoM badge -->
									<div v-if="lb.data.leaderboard[0]?.is_eom" class="text-sm font-bold text-amber-200/80 mt-0.5">&#x1F3C6; {{ __("Employee of the Month") }}</div>
									<!-- Podium Block (tallest) -->
									<div class="podium-block podium-gold w-full mt-3">
										<div class="podium-block-inner py-12 text-center">
											<div class="text-3xl font-black text-white">{{ lb.data.leaderboard[0]?.score }}</div>
											<div class="text-sm font-bold text-white/50">pts</div>
										</div>
									</div>
								</div>

								<!-- 3rd Place -->
								<div class="flex flex-col items-center w-[30%] animate-rise-3">
									<!-- Medal -->
									<div class="medal-bronze w-8 h-8 rounded-full flex items-center justify-center text-base font-black mb-2 shadow-lg">3</div>
									<!-- Circle Score -->
									<CircleScore
										:value="lb.data.leaderboard[2]?.score || 0" :maxValue="100"
										:size="58" :strokeWidth="3" />
									<!-- Name + Tier -->
									<div class="text-sm font-bold text-white mt-2 text-center truncate w-full">
										{{ lb.data.leaderboard[2]?.employee_name?.split(' ')[0] }}
									</div>
									<div class="text-sm text-white/70 font-medium">{{ lb.data.leaderboard[2]?.tier_emoji }} {{ lb.data.leaderboard[2]?.tier }}</div>
									<!-- Podium Block -->
									<div class="podium-block podium-bronze w-full mt-3">
										<div class="podium-block-inner py-5 text-center">
											<div class="text-xl font-black text-white/90">{{ lb.data.leaderboard[2]?.score }}</div>
											<div class="text-sm font-bold text-white/50">pts</div>
										</div>
									</div>
								</div>

							</div>
							<!-- Stage floor reflection -->
							<div class="stage-floor"></div>
						</div>

						<!-- My Rank Card -->
						<div v-if="lb.data.my_rank" class="bg-gradient-to-r from-icd-50 to-purple-50 border border-icd-200 rounded-2xl p-4 flex items-center gap-3">
							<div class="w-12 h-12 rounded-full gradient-icd flex items-center justify-center text-lg font-black text-white shadow-lg">
								#{{ lb.data.my_rank.rank }}
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-base font-bold text-gray-900">{{ __("Your Rank") }}</div>
								<div class="text-sm text-icd-600 font-semibold">{{ lb.data.my_rank.tier_emoji }} {{ lb.data.my_rank.tier }}</div>
							</div>
							<div class="text-right">
								<CircleScore
									:value="lb.data.my_rank.score || 0" :maxValue="100"
									:size="52" :strokeWidth="3" :darkBg="false" />
							</div>
						</div>

						<!-- Full List (4th place onwards) -->
						<div v-if="lb.data.leaderboard.length > 3" class="flex flex-col gap-2">
							<div v-for="entry in lb.data.leaderboard.slice(3)" :key="entry.employee"
								class="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
								<div class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-black text-gray-600">
									{{ entry.rank }}
								</div>
								<CircleScore
									:value="entry.score || 0" :maxValue="100"
									:size="44" :strokeWidth="3" :darkBg="false" />
								<div class="flex-1 min-w-0">
									<div class="text-base font-bold text-gray-900 truncate">{{ entry.employee_name }}</div>
									<div class="text-sm text-gray-600 font-medium">{{ entry.tier_emoji }} {{ entry.tier }}</div>
								</div>
								<div class="text-right flex-shrink-0">
									<div class="text-xl font-black" :class="scoreTextColor(entry.score)">{{ entry.score }}</div>
									<div class="text-sm text-gray-600 font-bold">/100</div>
								</div>
								<div v-if="entry.is_eom" class="text-xl flex-shrink-0">&#x1F3C6;</div>
							</div>
						</div>

						<!-- Score Breakdown Legend -->
						<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
							<div class="text-sm font-bold text-gray-700 tracking-wide mb-3">{{ __("Scoring Breakdown") }}</div>
							<div class="grid grid-cols-2 gap-2.5">
								<div class="flex items-center gap-2.5">
									<div class="w-3 h-3 rounded-full bg-emerald-500"></div>
									<span class="text-sm text-gray-700 font-medium">{{ __("Follow-Up") }} (35%)</span>
								</div>
								<div class="flex items-center gap-2.5">
									<div class="w-3 h-3 rounded-full bg-blue-500"></div>
									<span class="text-sm text-gray-700 font-medium">{{ __("Quotation") }} (25%)</span>
								</div>
								<div class="flex items-center gap-2.5">
									<div class="w-3 h-3 rounded-full bg-purple-500"></div>
									<span class="text-sm text-gray-700 font-medium">{{ __("Opportunity") }} (20%)</span>
								</div>
								<div class="flex items-center gap-2.5">
									<div class="w-3 h-3 rounded-full bg-red-500"></div>
									<span class="text-sm text-gray-700 font-medium">{{ __("Discipline") }} (20%)</span>
								</div>
							</div>
						</div>

					</template>

					<!-- Empty -->
					<div v-else class="text-center py-20">
						<FeatherIcon name="bar-chart-2" class="w-14 h-14 text-gray-300 mx-auto mb-3" />
						<div class="text-base text-gray-600 font-medium">{{ __("No scores available yet") }}</div>
					</div>

				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { inject } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, createResource } from "frappe-ui"
import CircleScore from "@/components/CircleScore.vue"

const __ = inject("$translate")
const router = useRouter()

const lb = createResource({
	url: "icd3s_follow_up.sales_performance_score.get_sales_leaderboard",
	auto: true,
	cache: "genius:sales_leaderboard",
})

function scoreTextColor(score) {
	if (score >= 90) return "text-amber-600"
	if (score >= 75) return "text-emerald-600"
	if (score >= 60) return "text-blue-600"
	if (score >= 40) return "text-orange-500"
	return "text-red-500"
}
</script>

<style scoped>
/* === PODIUM STAGE === */
.podium-stage {
	background: linear-gradient(160deg, #1e0533 0%, #2d0a4e 25%, #3b1264 50%, #2d0a4e 75%, #1e0533 100%);
	box-shadow: 0 12px 40px -6px rgba(30, 5, 51, 0.6);
	position: relative;
	overflow: hidden;
}

/* Spotlight effects */
.spotlight {
	position: absolute;
	border-radius: 50%;
	filter: blur(60px);
	opacity: 0.25;
	pointer-events: none;
}
.spotlight-1 {
	width: 180px; height: 180px;
	background: radial-gradient(circle, #fbbf24, transparent 70%);
	top: -30px; left: 50%; transform: translateX(-50%);
}
.spotlight-2 {
	width: 120px; height: 120px;
	background: radial-gradient(circle, #c084fc, transparent 70%);
	top: 40px; left: 10%;
}
.spotlight-3 {
	width: 120px; height: 120px;
	background: radial-gradient(circle, #c084fc, transparent 70%);
	top: 40px; right: 10%;
}

/* Crown glow */
.crown-glow {
	filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.6));
	animation: crown-pulse 2s ease-in-out infinite;
}
@keyframes crown-pulse {
	0%, 100% { filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.4)); }
	50% { filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.8)); }
}

/* Medal badges */
.medal-silver {
	background: linear-gradient(135deg, #94a3b8, #cbd5e1, #94a3b8);
	color: #334155;
	border: 2px solid rgba(255,255,255,0.3);
}
.medal-bronze {
	background: linear-gradient(135deg, #b45309, #d97706, #b45309);
	color: #fff;
	border: 2px solid rgba(255,255,255,0.2);
}

/* Podium blocks - the actual stage pillars */
.podium-block {
	border-radius: 12px 12px 0 0;
	position: relative;
	overflow: hidden;
}
.podium-block::before {
	content: '';
	position: absolute;
	top: 0; left: 0; right: 0;
	height: 2px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
}
.podium-block-inner {
	position: relative;
	z-index: 1;
}

.podium-gold {
	background: linear-gradient(180deg, rgba(251, 191, 36, 0.35) 0%, rgba(217, 119, 6, 0.2) 100%);
	border: 1px solid rgba(251, 191, 36, 0.25);
	border-bottom: none;
	box-shadow: inset 0 1px 20px rgba(251, 191, 36, 0.15);
}
.podium-silver {
	background: linear-gradient(180deg, rgba(148, 163, 184, 0.3) 0%, rgba(100, 116, 139, 0.15) 100%);
	border: 1px solid rgba(148, 163, 184, 0.2);
	border-bottom: none;
	box-shadow: inset 0 1px 15px rgba(148, 163, 184, 0.1);
}
.podium-bronze {
	background: linear-gradient(180deg, rgba(217, 119, 6, 0.25) 0%, rgba(180, 83, 9, 0.12) 100%);
	border: 1px solid rgba(217, 119, 6, 0.18);
	border-bottom: none;
	box-shadow: inset 0 1px 15px rgba(217, 119, 6, 0.08);
}

/* Stage floor - reflective line at bottom */
.stage-floor {
	height: 3px;
	background: linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 70%, transparent 95%);
}

/* Rise animations */
.animate-rise-1 {
	animation: rise-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	animation-delay: 0.3s;
}
.animate-rise-2 {
	animation: rise-up 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	animation-delay: 0.5s;
}
.animate-rise-3 {
	animation: rise-up 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	animation-delay: 0.7s;
}
@keyframes rise-up {
	from { opacity: 0; transform: translateY(40px); }
	to { opacity: 1; transform: translateY(0); }
}
</style>
