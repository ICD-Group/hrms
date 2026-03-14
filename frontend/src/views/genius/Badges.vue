<template>
	<BaseLayout :pageTitle="__('Badges')">
		<template #body>
			<div class="flex flex-col mt-4 mb-7 p-4 gap-5">

				<!-- Loading Skeleton -->
				<CardSkeleton v-if="badges.loading" :cards="6" :columns="3" />

				<!-- Stats Bar -->
				<div v-if="!badges.loading" class="flex gap-3">
					<div class="flex-1 bg-purple-50 dark:bg-purple-900/30 rounded-xl p-3 text-center">
						<div class="text-2xl font-bold text-purple-700 dark:text-purple-300">{{ badges.data?.total_badges || 0 }}</div>
						<div class="text-xs text-purple-500 dark:text-purple-400">{{ __("Earned") }}</div>
					</div>
					<div class="flex-1 bg-gray-100 dark:bg-white/5 rounded-xl p-3 text-center">
						<div class="text-2xl font-bold text-gray-600 dark:text-gray-400">{{ badges.data?.available_badges?.length || 0 }}</div>
						<div class="text-xs text-gray-600 dark:text-gray-500">{{ __("Available") }}</div>
					</div>
					<div class="flex-1 bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3 text-center">
						<div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ totalBadgePoints }}</div>
						<div class="text-xs text-amber-500 dark:text-amber-400">{{ __("Points") }}</div>
					</div>
				</div>

				<!-- Earned Badges -->
				<div v-if="badges.data?.earned_badges?.length > 0">
					<div class="section-title mb-3">{{ __("Earned Badges") }}</div>
					<div class="grid grid-cols-3 gap-3">
						<div
							v-for="badge in badges.data.earned_badges"
							:key="badge.badge"
							class="bg-white dark:bg-white/10 rounded-xl p-3 shadow-sm dark:shadow-none text-center"
						>
							<div class="text-3xl mb-2">{{ getBadgeEmoji(badge.badge_type) }}</div>
							<div class="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">{{ badge.badge_name }}</div>
							<div class="text-xs text-green-600 mt-1 font-medium">+{{ badge.points_awarded }}pts</div>
							<div class="text-xs text-gray-600 dark:text-gray-500 mt-0.5">{{ formatDate(badge.earned_date) }}</div>
						</div>
					</div>
				</div>

				<!-- Available Badges -->
				<div v-if="badges.data?.available_badges?.length > 0">
					<div class="section-title mb-3">{{ __("Available to Earn") }}</div>
					<div class="flex flex-col gap-2">
						<div
							v-for="badge in badges.data.available_badges"
							:key="badge.badge"
							class="bg-white dark:bg-white/10 rounded-xl p-4 shadow-sm dark:shadow-none flex items-center gap-3"
						>
							<div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-2xl opacity-50">
								{{ getBadgeEmoji(badge.badge_type) }}
							</div>
							<div class="flex-1">
								<div class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ badge.badge_name }}</div>
								<div class="text-xs text-gray-700 dark:text-gray-400 mt-0.5">{{ badge.description }}</div>
								<div v-if="badge.progress !== undefined" class="mt-2">
									<div class="w-full bg-gray-200 dark:bg-white/15 rounded-full h-1.5">
										<div
											class="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
											:style="{ width: Math.min(badge.progress || 0, 100) + '%' }"
										></div>
									</div>
									<div class="text-xs text-gray-600 dark:text-gray-500 mt-0.5">{{ badge.progress || 0 }}%</div>
								</div>
							</div>
							<div class="text-right">
								<div class="text-sm font-bold text-purple-600 dark:text-purple-400">+{{ badge.points }}</div>
								<div class="text-xs text-gray-600 dark:text-gray-500">pts</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Empty State -->
				<div v-if="!badges.loading && !badges.data?.earned_badges?.length && !badges.data?.available_badges?.length" class="text-center py-10">
					<div class="text-4xl mb-3">{{"🏅"}}</div>
					<div class="text-gray-700 dark:text-gray-400">{{ __("No badges yet. Keep attending!") }}</div>
				</div>

			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { computed, inject } from "vue"
import { createResource } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"
import CardSkeleton from "@/components/CardSkeleton.vue"

const employee = inject("$employee")
const __ = inject("$translate")
const dayjs = inject("$dayjs")

const badges = createResource({
	url: "icd3s_attendance.icd3s_attendance.api.modules.gamification.get_badges",
	auto: true,
	cache: "genius:badges:full",
	makeParams() {
		return { employee: employee.data?.name, include_available: 1 }
	},
})

const totalBadgePoints = computed(() => {
	if (!badges.data?.earned_badges) return 0
	return badges.data.earned_badges.reduce((sum, b) => sum + (b.points_awarded || 0), 0)
})

function getBadgeEmoji(type) {
	const map = {
		"Attendance": "\u{1F3AF}",
		"Punctuality": "\u{23F0}",
		"Streak": "\u{1F525}",
		"Performance": "\u{2B50}",
		"Team": "\u{1F91D}",
		"Early Bird": "\u{1F426}",
		"Night Owl": "\u{1F989}",
		"Perfect Week": "\u{1F4AA}",
		"Perfect Month": "\u{1F451}",
	}
	return map[type] || "\u{1F3C5}"
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM")
}
</script>
