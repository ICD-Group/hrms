<template>
	<ion-page>
		<ion-content :fullscreen="true">
			<div class="flex flex-col h-full w-full">
				<div class="app-bg-ambient"></div>
				<header class="flex flex-row glass-header px-4 py-2.5 items-center sticky top-0 z-[1000]">
					<Button variant="ghost" class="!pl-0 hover:bg-white/50" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5" />
					</Button>
					<div class="flex flex-row items-center gap-2 overflow-hidden grow">
						<h2 class="text-lg font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
							{{ policyTitle }}
						</h2>
						<Badge
							v-if="ack.status"
							:label="__(ack.status)"
							:theme="statusTheme"
							class="whitespace-nowrap text-[8px]"
						/>
					</div>
				</header>

				<div class="grow overflow-y-auto">
					<div class="flex flex-col gap-3 p-4">
						<!-- Loading -->
						<div v-if="detail.loading" class="flex justify-center py-12">
							<div class="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
						</div>

						<template v-else-if="detail.data">
							<!-- Status Banner -->
							<div class="rounded-xl p-3" :class="bannerClass">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<FeatherIcon :name="bannerIcon" class="w-5 h-5" />
										<span class="text-sm font-bold">{{ __(ack.status) }}</span>
									</div>
									<span v-if="ack.deadline_date" class="text-xs opacity-75">
										{{ __('Deadline') }}: {{ formatDate(ack.deadline_date) }}
									</span>
								</div>
								<div v-if="ack.acknowledged_on" class="text-xs mt-1 opacity-75">
									{{ __('Acknowledged on') }} {{ formatDateTime(ack.acknowledged_on) }}
								</div>
							</div>

							<!-- Policy Info -->
							<div class="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
								<div class="text-xs text-gray-600 mb-1">{{ policy.category }}</div>
								<div class="text-base font-bold text-gray-900">{{ policy.policy_title }}</div>
								<div v-if="policy.policy_title_ar" class="text-base font-bold text-gray-700 mt-1" dir="rtl">{{ policy.policy_title_ar }}</div>
								<div class="flex gap-3 mt-2 text-xs text-gray-700">
									<span>{{ __('Version') }}: {{ policy.version_number }}</span>
									<span>{{ __('Effective') }}: {{ formatDate(policy.effective_date) }}</span>
								</div>
							</div>

							<!-- Language Tabs -->
							<div class="flex gap-1 bg-gray-100 rounded-lg p-0.5">
								<button
									@click="lang = 'en'"
									class="flex-1 text-sm font-semibold py-1.5 rounded-md transition-all"
									:class="lang === 'en' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-700'"
								>English</button>
								<button
									@click="lang = 'ar'"
									class="flex-1 text-sm font-semibold py-1.5 rounded-md transition-all"
									:class="lang === 'ar' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-700'"
								>العربية</button>
							</div>

							<!-- Policy Content -->
							<div class="bg-white rounded-xl border border-gray-100 p-4 shadow-sm overflow-auto">
								<div
									v-if="lang === 'en'"
									class="policy-content prose prose-sm max-w-none"
									v-html="sanitize(policy.content_en)"
								></div>
								<div
									v-else
									class="policy-content prose prose-sm max-w-none"
									dir="rtl"
									style="text-align: right;"
									v-html="sanitize(policy.content_ar)"
								></div>
							</div>

							<!-- Acknowledge Button -->
							<div v-if="ack.status === 'Pending' || ack.status === 'Overdue'" class="sticky bottom-4 px-1 pb-2">
								<button
									@click="confirmAcknowledge"
									:disabled="acknowledging"
									class="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg active:scale-[0.98] transition-all"
									:class="acknowledging ? 'bg-gray-400' : 'bg-gradient-to-r from-violet-600 to-purple-600'"
								>
									<span v-if="acknowledging" class="flex items-center justify-center gap-2">
										<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										{{ __('Processing...') }}
									</span>
									<span v-else class="flex items-center justify-center gap-2">
										<FeatherIcon name="check-circle" class="w-5 h-5" />
										{{ __('I Acknowledge This Policy') }}
									</span>
								</button>
							</div>

							<!-- Already Acknowledged -->
							<div v-else class="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
								<FeatherIcon name="check-circle" class="w-8 h-8 text-green-500 mx-auto mb-1" />
								<div class="text-sm font-semibold text-green-700">{{ __('Policy Acknowledged') }}</div>
							</div>
						</template>
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonContent } from "@ionic/vue"
import { ref, computed, inject } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon, Button, Badge, toast } from "frappe-ui"
import DOMPurify from "dompurify"

function sanitize(html) { return DOMPurify.sanitize(html || "") }

const props = defineProps({ id: String })
const __ = inject("$translate")
const dayjs = inject("$dayjs")
const router = useRouter()

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const lang = ref("en")
const acknowledging = ref(false)

const detail = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_policy_detail",
	makeParams() { return { acknowledgment_name: props.id } },
	auto: true,
	cache: `policy:detail:${props.id}`,
})

const ack = computed(() => detail.data?.acknowledgment || {})
const policy = computed(() => detail.data?.policy || {})
const policyTitle = computed(() => policy.value.policy_title || __("Policy"))

const statusTheme = computed(() => {
	switch (ack.value.status) {
		case "Pending": return "orange"
		case "Overdue": return "red"
		case "Acknowledged": return "green"
		default: return "gray"
	}
})

const bannerClass = computed(() => {
	switch (ack.value.status) {
		case "Pending": return "bg-orange-50 border border-orange-200 text-orange-700"
		case "Overdue": return "bg-red-50 border border-red-200 text-red-700"
		case "Acknowledged": return "bg-green-50 border border-green-200 text-green-700"
		default: return "bg-gray-100 border border-gray-200 text-gray-700"
	}
})

const bannerIcon = computed(() => {
	switch (ack.value.status) {
		case "Pending": return "clock"
		case "Overdue": return "alert-triangle"
		case "Acknowledged": return "check-circle"
		default: return "file-text"
	}
})

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}

function formatDateTime(dt) {
	if (!dt) return ""
	return dayjs(dt).format("DD-MM-YYYY, h:mm A")
}

async function confirmAcknowledge() {
	if (!confirm(__("I confirm that I have read and understood this policy. Do you want to proceed?"))) return

	acknowledging.value = true
	try {
		const ackResource = createResource({
			url: "icd3s_document_center.icd3s_document_center.api.acknowledge_policy",
			makeParams() { return { acknowledgment_name: props.id } },
		})
		await ackResource.fetch()
		detail.reload()
	} catch (e) {
		_errToast(e, "Failed to acknowledge policy")
	} finally {
		acknowledging.value = false
	}
}
</script>

<style scoped>
.policy-content :deep(table) {
	width: 100%;
	border-collapse: collapse;
	font-size: 12px;
	margin: 8px 0;
}
.policy-content :deep(th),
.policy-content :deep(td) {
	border: 1px solid #e5e7eb;
	padding: 6px 8px;
	text-align: left;
}
.policy-content :deep(th) {
	background: #f3f4f6;
	font-weight: 600;
}
.policy-content :deep(h1) { font-size: 18px; margin: 12px 0 8px; }
.policy-content :deep(h2) { font-size: 16px; margin: 10px 0 6px; color: #4c1d95; }
.policy-content :deep(h3) { font-size: 14px; margin: 8px 0 4px; }
.policy-content :deep(h4) { font-size: 13px; margin: 6px 0 4px; }
.policy-content :deep(p) { margin: 4px 0; font-size: 13px; line-height: 1.5; }
.policy-content :deep(ul),
.policy-content :deep(ol) { padding-left: 20px; margin: 4px 0; font-size: 13px; }
.policy-content :deep(li) { margin: 2px 0; }
.policy-content :deep(hr) { margin: 12px 0; border-color: #e5e7eb; }
</style>
