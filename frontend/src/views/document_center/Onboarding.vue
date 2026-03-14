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
						<h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ __('Onboarding') }}</h2>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-4 p-4">
				<!-- Loading -->
				<div v-if="packet.loading && !packet.data" class="flex justify-center py-12">
					<div class="w-6 h-6 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
				</div>

				<!-- No Packet -->
				<div v-else-if="!packet.data?.items?.length" class="text-center py-12">
					<FeatherIcon name="package" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
					<p class="text-base font-semibold text-gray-500">{{ __('No onboarding packet assigned') }}</p>
					<p class="text-sm text-gray-400 mt-1">{{ __('Contact HR for your onboarding checklist') }}</p>
				</div>

				<template v-else>
					<!-- Welcome Message -->
					<div v-if="packet.data.welcome_message" class="glass-section rounded-2xl p-5">
						<div class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed welcome-content"
							v-html="packet.data.welcome_message"></div>
					</div>

					<!-- Progress Card -->
					<div class="glass-section rounded-2xl p-5">
						<div class="flex items-center justify-between mb-3">
							<h3 class="text-base font-bold text-gray-900 dark:text-white">{{ __('Your Progress') }}</h3>
							<span class="text-sm font-bold" :class="progressPct >= 100 ? 'text-emerald-600' : 'text-[var(--icd-purple)]'">
								{{ completedCount }}/{{ totalCount }}
							</span>
						</div>
						<div class="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
							<div class="h-full rounded-full transition-all duration-700"
								:class="progressPct >= 100 ? 'bg-emerald-500' : 'bg-[var(--icd-purple)]'"
								:style="{ width: progressPct + '%' }"></div>
						</div>
						<p class="text-sm text-gray-500 mt-2">
							{{ progressPct >= 100 ? __('All tasks completed!') : __('Complete all items to finish onboarding') }}
						</p>
					</div>

					<!-- Items by Category -->
					<div v-for="category in groupedItems" :key="category.name" class="flex flex-col gap-1.5">
						<div class="flex items-center gap-2 px-1">
							<span class="text-sm font-bold text-gray-900 dark:text-white">{{ category.name }}</span>
							<span class="text-xs text-gray-400">{{ category.done }}/{{ category.items.length }}</span>
						</div>

						<div class="glass-section rounded-xl overflow-hidden">
							<div
								v-for="(item, idx) in category.items"
								:key="item.name || idx"
								class="px-4 py-3.5 flex items-center gap-3"
								:class="idx < category.items.length - 1 ? 'border-b border-gray-100 dark:border-white/10' : ''"
							>
								<div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
									:class="item.completed ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-white/10'">
									<FeatherIcon :name="item.completed ? 'check-circle' : getItemIcon(item)"
										class="w-5 h-5"
										:class="item.completed ? 'text-emerald-600' : 'text-gray-400'" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold truncate"
										:class="item.completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'">
										{{ item.item_name || item.title }}
									</div>
									<div v-if="item.description" class="text-xs text-gray-500 mt-0.5 truncate">{{ item.description }}</div>
								</div>
								<div v-if="item.completed" class="text-xs font-semibold text-emerald-600">{{ __('Done') }}</div>
								<div v-else-if="item.is_mandatory" class="px-2 py-1 rounded-lg bg-red-50 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">{{ __('Required') }}</div>
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

const packet = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_onboarding_packet",
	auto: true,
	cache: "doc_center:onboarding",
})

const items = computed(() => (packet.data?.items || []).map(i => ({
	...i,
	completed: i.completed || i.status === 'completed' || i.status === 'done',
})))
const totalCount = computed(() => items.value.length)
const completedCount = computed(() => items.value.filter(i => i.completed).length)
const progressPct = computed(() => totalCount.value ? Math.round(completedCount.value / totalCount.value * 100) : 0)

const groupedItems = computed(() => {
	const groups = {}
	items.value.forEach(item => {
		const cat = item.category || __('General')
		if (!groups[cat]) groups[cat] = { name: cat, items: [], done: 0 }
		groups[cat].items.push(item)
		if (item.completed) groups[cat].done++
	})
	return Object.values(groups)
})

function getItemIcon(item) {
	const type = (item.item_type || '').toLowerCase()
	if (type.includes('document') || type.includes('upload')) return 'upload'
	if (type.includes('policy') || type.includes('read')) return 'file-text'
	if (type.includes('quiz') || type.includes('test')) return 'help-circle'
	if (type.includes('meeting') || type.includes('intro')) return 'users'
	if (type.includes('training') || type.includes('video')) return 'play-circle'
	return 'circle'
}
</script>
