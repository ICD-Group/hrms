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
							{{ doc.document_title || __('Document') }}
						</h2>
						<Badge
							v-if="doc.status"
							:label="__(doc.status)"
							:theme="statusTheme"
							class="whitespace-nowrap text-[8px]"
						/>
					</div>
				</header>

				<div class="grow overflow-y-auto">
					<div class="flex flex-col gap-3 p-4">
						<!-- Loading -->
						<div v-if="detail.loading" class="flex justify-center py-12">
							<div class="w-6 h-6 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
						</div>

						<template v-else-if="detail.data">
							<!-- Status Banner -->
							<div class="rounded-xl p-3" :class="bannerClass">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<FeatherIcon :name="bannerIcon" class="w-5 h-5" />
										<span class="text-sm font-bold">{{ __(doc.status) }}</span>
									</div>
									<span v-if="doc.name" class="text-xs opacity-75">{{ doc.name }}</span>
								</div>
								<div v-if="doc.review_notes && (doc.status === 'Approved' || doc.status === 'Rejected')" class="text-xs mt-1 opacity-75">
									{{ doc.review_notes }}
								</div>
							</div>

							<!-- Document Info -->
							<div class="glass-section p-4">
								<div class="flex flex-col gap-2.5">
									<div class="flex items-center justify-between">
										<span class="text-xs text-gray-600">{{ __('Type') }}</span>
										<span class="text-sm font-semibold text-gray-900">{{ doc.document_type }}</span>
									</div>
									<div v-if="doc.document_number" class="flex items-center justify-between">
										<span class="text-xs text-gray-600">{{ __('Number') }}</span>
										<span class="text-sm font-semibold text-gray-900">{{ doc.document_number }}</span>
									</div>
									<div v-if="doc.issue_date" class="flex items-center justify-between">
										<span class="text-xs text-gray-600">{{ __('Issue Date') }}</span>
										<span class="text-sm text-gray-700">{{ formatDate(doc.issue_date) }}</span>
									</div>
									<div v-if="doc.expiry_date" class="flex items-center justify-between">
										<span class="text-xs text-gray-600">{{ __('Expiry Date') }}</span>
										<span class="text-sm font-semibold" :class="doc.days_until_expiry < 0 ? 'text-red-600' : doc.days_until_expiry <= 30 ? 'text-orange-600' : 'text-gray-700'">
											{{ formatDate(doc.expiry_date) }}
											<span v-if="doc.days_until_expiry < 0" class="text-xs ml-1">({{ __('EXPIRED') }})</span>
											<span v-else-if="doc.days_until_expiry <= 30" class="text-xs ml-1">({{ doc.days_until_expiry }}d)</span>
										</span>
									</div>
								</div>
							</div>

							<!-- File -->
							<a
								v-if="doc.document_file"
								:href="doc.document_file"
								target="_blank"
								class="flex items-center gap-3 card-premium p-4"
							>
								<div class="w-10 h-10 rounded-lg bg-icd-50 dark:bg-icd-900/30 flex items-center justify-center flex-shrink-0">
									<FeatherIcon :name="fileIcon(doc.document_file)" class="w-5 h-5 text-icd-600 dark:text-icd-300" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-900">{{ __('View Document') }}</div>
									<div class="text-xs text-gray-600 truncate">{{ doc.document_file }}</div>
								</div>
								<FeatherIcon name="external-link" class="w-4 h-4 text-gray-600" />
							</a>

							<!-- Additional Files -->
							<template v-if="doc.additional_files">
								<div class="text-xs font-bold text-gray-600 uppercase tracking-wider px-1">{{ __('Additional Files') }}</div>
								<a
									v-for="(fileUrl, idx) in parseAdditionalFiles(doc.additional_files)"
									:key="idx"
									:href="fileUrl"
									target="_blank"
									class="flex items-center gap-3 card-premium p-3"
								>
									<div class="w-8 h-8 rounded-lg bg-icd-50 dark:bg-icd-900/30 flex items-center justify-center flex-shrink-0">
										<FeatherIcon :name="fileIcon(fileUrl)" class="w-4 h-4 text-icd-600 dark:text-icd-300" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="text-xs font-medium text-gray-700 truncate">{{ fileUrl.split('/').pop() }}</div>
									</div>
									<FeatherIcon name="external-link" class="w-3.5 h-3.5 text-gray-600" />
								</a>
							</template>

							<!-- HR Review Section -->
							<div v-if="doc.reviewed_by" class="glass-section p-4">
								<div class="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">{{ __('HR Review') }}</div>
								<div class="flex flex-col gap-2">
									<div class="flex items-center justify-between">
										<span class="text-xs text-gray-600">{{ __('Reviewed By') }}</span>
										<span class="text-sm text-gray-700">{{ doc.reviewed_by }}</span>
									</div>
									<div v-if="doc.review_date" class="flex items-center justify-between">
										<span class="text-xs text-gray-600">{{ __('Review Date') }}</span>
										<span class="text-sm text-gray-700">{{ formatDate(doc.review_date) }}</span>
									</div>
									<div v-if="doc.review_notes" class="mt-1">
										<span class="text-xs text-gray-600">{{ __('Notes') }}</span>
										<div class="text-sm text-gray-700 mt-0.5 glass-card rounded-lg p-2">{{ doc.review_notes }}</div>
									</div>
								</div>
							</div>

							<!-- Original Receipt -->
							<div v-if="doc.original_received" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl p-3 text-center">
								<FeatherIcon name="check-circle" class="w-6 h-6 text-green-500 mx-auto mb-1" />
								<div class="text-xs font-semibold text-green-700 dark:text-green-400">{{ __('Original received by HR') }}</div>
								<div v-if="doc.original_received_date" class="text-[11px] text-green-600 mt-0.5">{{ formatDate(doc.original_received_date) }}</div>
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
import { computed, inject } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon, Button, Badge } from "frappe-ui"

const props = defineProps({ id: String })
const __ = inject("$translate")
const dayjs = inject("$dayjs")
const router = useRouter()

const detail = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_document_detail",
	makeParams() { return { document_name: props.id } },
	auto: true,
	cache: `doc_center:doc:${props.id}`,
})

const doc = computed(() => detail.data || {})

const statusTheme = computed(() => {
	switch (doc.value.status) {
		case "Pending": return "orange"
		case "Under Review": return "blue"
		case "Approved": return "green"
		case "Rejected": return "red"
		case "Expired": return "gray"
		default: return "gray"
	}
})

const bannerClass = computed(() => {
	switch (doc.value.status) {
		case "Pending": return "bg-orange-50 border border-orange-200 text-orange-700"
		case "Under Review": return "bg-blue-50 border border-blue-200 text-blue-700"
		case "Approved": return "bg-green-50 border border-green-200 text-green-700"
		case "Rejected": return "bg-red-50 border border-red-200 text-red-700"
		case "Expired": return "bg-gray-100 border border-gray-200 text-gray-600"
		default: return "bg-gray-100 border border-gray-200 text-gray-700"
	}
})

const bannerIcon = computed(() => {
	switch (doc.value.status) {
		case "Pending": return "clock"
		case "Under Review": return "eye"
		case "Approved": return "check-circle"
		case "Rejected": return "x-circle"
		case "Expired": return "alert-triangle"
		default: return "file"
	}
})

function fileIcon(url) {
	if (!url) return "file"
	const ext = url.split(".").pop().toLowerCase()
	if (ext === "pdf") return "file-text"
	if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "image"
	return "file"
}

function parseAdditionalFiles(files) {
	if (!files) return []
	try {
		return JSON.parse(files)
	} catch {
		return files.split(",").map(f => f.trim()).filter(Boolean)
	}
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}
</script>
