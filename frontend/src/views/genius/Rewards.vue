<template>
	<BaseLayout :pageTitle="__('Rewards')">
		<template #body>
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- My Points Balance -->
				<div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
					<div class="text-sm font-medium opacity-90">{{ __("Redeemable Points") }}</div>
					<div class="text-3xl font-black mt-1">{{ points.data?.current_month?.total_points || 0 }}</div>
					<div class="text-xs opacity-75 mt-1">{{ __("Earn more by being on time!") }}</div>
				</div>

				<!-- Rewards Catalog -->
				<div v-if="rewards.data?.rewards?.length > 0">
					<div class="section-title mb-3">{{ __("Rewards Catalog") }}</div>
					<div class="flex flex-col gap-3">
						<div
							v-for="reward in rewards.data.rewards"
							:key="reward.name"
							class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none overflow-hidden"
						>
							<div class="p-4 flex items-center gap-3">
								<div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
									:class="getRewardBg(reward.category)"
								>
									{{ getRewardEmoji(reward.category) }}
								</div>
								<div class="flex-1">
									<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ reward.reward_name }}</div>
									<div class="text-xs text-gray-700 dark:text-gray-400 mt-0.5">{{ reward.description }}</div>
								</div>
								<div class="text-right">
									<div class="text-sm font-bold text-green-600">{{ reward.points_required }}</div>
									<div class="text-xs text-gray-600 dark:text-gray-500">pts</div>
								</div>
							</div>
							<div class="px-4 pb-3">
								<button
									@click="redeemReward(reward)"
									class="w-full py-2 rounded-lg text-sm font-semibold transition"
									:class="canRedeem(reward) ? 'bg-green-500 text-white active:bg-green-600' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-500'"
									:disabled="!canRedeem(reward) || redeeming"
								>
									{{ redeeming ? __('Redeeming...') : canRedeem(reward) ? __('Redeem') : __('Need more points') }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Redemption History -->
				<div v-if="rewards.data?.redemptions?.length > 0">
					<div class="section-title mb-3">{{ __("Redemption History") }}</div>
					<div class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none overflow-hidden">
						<div
							v-for="r in rewards.data.redemptions"
							:key="r.name"
							class="flex items-center gap-3 p-3 border-b border-gray-50 dark:border-white/10 last:border-0"
						>
							<div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800/40 flex items-center justify-center text-sm">
								&#x2705;
							</div>
							<div class="flex-1">
								<div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ r.reward_name }}</div>
								<div class="text-xs text-gray-600 dark:text-gray-500">{{ formatDate(r.redeemed_date) }}</div>
							</div>
							<div class="text-sm font-bold text-red-500">-{{ r.points_used }}</div>
						</div>
					</div>
				</div>

				<!-- How to Earn -->
				<div>
					<div class="section-title mb-3">{{ __("How to Earn Points") }}</div>
					<div class="bg-white dark:bg-white/10 rounded-xl shadow-sm dark:shadow-none p-4">
						<div class="flex flex-col gap-3">
							<div class="flex items-center gap-3">
								<span class="text-lg">&#x23F0;</span>
								<div class="flex-1 text-sm text-gray-700 dark:text-gray-300">{{ __("Check in on time") }}</div>
								<div class="text-sm font-bold text-green-600">+10</div>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-lg">&#x1F525;</span>
								<div class="flex-1 text-sm text-gray-700 dark:text-gray-300">{{ __("Maintain streak") }}</div>
								<div class="text-sm font-bold text-green-600">+5/day</div>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-lg">&#x1F3C5;</span>
								<div class="flex-1 text-sm text-gray-700 dark:text-gray-300">{{ __("Earn badges") }}</div>
								<div class="text-sm font-bold text-green-600">+25-100</div>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-lg">&#x1F4AA;</span>
								<div class="flex-1 text-sm text-gray-700 dark:text-gray-300">{{ __("Perfect week") }}</div>
								<div class="text-sm font-bold text-green-600">+50</div>
							</div>
						</div>
					</div>
				</div>

			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { inject, ref } from "vue"
import { createResource, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const employee = inject("$employee")
const __ = inject("$translate")
const dayjs = inject("$dayjs")

const API_BASE = "icd3s_attendance.icd3s_attendance.api.modules"

const points = createResource({
	url: `${API_BASE}.gamification.get_points`,
	auto: true,
	cache: "genius:rewards:points",
	makeParams() { return { employee: employee.data?.name, months: 1 } },
})

const rewards = createResource({
	url: `${API_BASE}.gamification.get_rewards_catalog`,
	auto: true,
	cache: "genius:rewards:catalog",
})

function canRedeem(reward) {
	const myPoints = points.data?.current_month?.total_points || 0
	return myPoints >= (reward.points_required || 0)
}

const redeeming = ref(false)

const redeemAPI = createResource({
	url: `${API_BASE}.gamification.redeem_reward`,
	onSuccess() {
		redeeming.value = false
		toast({ title: __("Reward redeemed successfully!"), icon: "check-circle", iconClasses: "text-green-600" })
		points.reload()
		rewards.reload()
	},
	onError(err) {
		redeeming.value = false
		toast({ title: err.messages?.[0] || __("Failed to redeem reward"), icon: "alert-circle", iconClasses: "text-red-600" })
	},
})

function redeemReward(reward) {
	if (!canRedeem(reward) || redeeming.value) return
	if (!confirm(__("Redeem {0} for {1} points?", [reward.reward_name, reward.points_required]))) return
	redeeming.value = true
	redeemAPI.submit({
		employee: employee.data?.name,
		reward_name: reward.name,
		points: reward.points_required,
	})
}

function getRewardEmoji(category) {
	const map = {
		"Time Off": "\u{1F3D6}",
		"Gift Card": "\u{1F381}",
		"Recognition": "\u{1F31F}",
		"Learning": "\u{1F4DA}",
		"Wellness": "\u{1F9D8}",
	}
	return map[category] || "\u{1F381}"
}

function getRewardBg(category) {
	const map = {
		"Time Off": "bg-icd-100 dark:bg-icd-800/40",
		"Gift Card": "bg-green-100 dark:bg-green-800/40",
		"Recognition": "bg-amber-100 dark:bg-amber-800/40",
		"Learning": "bg-purple-100 dark:bg-purple-900/30",
		"Wellness": "bg-pink-100 dark:bg-pink-800/40",
	}
	return map[category] || "bg-gray-100 dark:bg-white/10"
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}
</script>

<style scoped>
.bg-gradient-to-r {
	background-image: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to));
}
.from-green-500 { --tw-gradient-from: #22c55e; }
.to-emerald-600 { --tw-gradient-to: #059669; }
</style>
