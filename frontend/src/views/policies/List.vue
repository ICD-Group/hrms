<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex flex-row glass-header px-4 py-2.5 items-center justify-between">
					<div class="flex flex-row items-center">
						<Button variant="ghost" class="!px-1 mr-1 hover:bg-white/50" @click="router.back()">
							<FeatherIcon name="chevron-left" class="h-5 w-5" />
						</Button>
						<h2 class="text-lg font-bold text-gray-900">{{ __('Company Policies') }}</h2>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-3 p-4">
				<!-- Pending Banner -->
				<div v-if="pendingCount > 0" class="bg-orange-50 border border-orange-200 rounded-xl p-3">
					<div class="flex items-center gap-2">
						<FeatherIcon name="alert-circle" class="w-5 h-5 text-orange-500" />
						<span class="text-sm font-semibold text-orange-700">
							{{ pendingCount }} {{ pendingCount === 1 ? __('policy') : __('policies') }} {{ __('pending acknowledgment') }}
						</span>
					</div>
				</div>

				<!-- Loading -->
				<div v-if="policies.loading" class="flex justify-center py-8">
					<div class="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
				</div>

				<!-- Empty State -->
				<div v-else-if="!policies.data?.length" class="text-center py-12">
					<FeatherIcon name="check-circle" class="w-12 h-12 text-green-400 mx-auto mb-3" />
					<p class="text-sm text-gray-700">{{ __('No policies assigned') }}</p>
				</div>

				<!-- Policy Cards -->
				<div v-else class="flex flex-col gap-2">
					<button
						v-for="policy in policies.data"
						:key="policy.name"
						@click="router.push({ name: 'PolicyDetailView', params: { id: policy.name } })"
						class="w-full text-left bg-white rounded-xl border p-3 active:scale-[0.98] transition-transform shadow-sm"
						:class="policy.status === 'Pending' ? 'border-orange-200' : 'border-gray-100'"
					>
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0 flex-1">
								<div class="text-sm font-semibold text-gray-900 truncate">{{ policy.policy_title }}</div>
								<div class="text-xs text-gray-600 mt-0.5">{{ policy.policy }}</div>
							</div>
							<span
								class="flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full"
								:class="statusClass(policy.status)"
							>
								{{ __(policy.status) }}
							</span>
						</div>
						<div class="flex items-center gap-3 mt-2 text-xs text-gray-700">
							<span v-if="policy.deadline_date" class="flex items-center gap-1">
								<FeatherIcon name="clock" class="w-3 h-3" />
								{{ __('Deadline') }}: {{ formatDate(policy.deadline_date) }}
							</span>
							<span v-if="policy.acknowledged_on" class="flex items-center gap-1 text-green-600">
								<FeatherIcon name="check" class="w-3 h-3" />
								{{ formatDate(policy.acknowledged_on) }}
							</span>
						</div>
					</button>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { computed, inject } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon, Button } from "frappe-ui"

const __ = inject("$translate")
const dayjs = inject("$dayjs")
const router = useRouter()

const policies = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_my_policy_acknowledgments",
	auto: true,
	cache: "policy:my_acknowledgments",
})

const pendingCount = computed(() => {
	if (!policies.data) return 0
	return policies.data.filter(p => p.status === "Pending" || p.status === "Overdue").length
})

function statusClass(status) {
	switch (status) {
		case "Pending": return "bg-orange-100 text-orange-700"
		case "Overdue": return "bg-red-100 text-red-700"
		case "Acknowledged": return "bg-green-100 text-green-700"
		default: return "bg-gray-100 text-gray-600"
	}
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}
</script>
