<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex flex-row glass-header px-4 py-2.5 items-center justify-between">
					<div class="flex flex-row items-center">
						<Button variant="ghost" class="!px-1 mr-1 hover:bg-white/50" @click="router.back()">
							<FeatherIcon name="chevron-left" class="h-5 w-5" />
						</Button>
						<h2 class="text-lg font-bold text-gray-900">{{ __('My Documents') }}</h2>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-3 p-4">
				<!-- Loading -->
				<div v-if="docs.loading && !docs.data" class="flex justify-center py-12">
					<div class="w-6 h-6 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
				</div>

				<template v-else-if="docs.data">
					<!-- Profile Completion Progress -->
					<div class="glass-section p-4">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm font-bold text-gray-900">{{ __('Profile Completion') }}</span>
							<span class="text-sm font-black" :class="progressColor">{{ progressPercent }}%</span>
						</div>
						<div class="w-full h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
							<div
								class="h-full rounded-full transition-all duration-700"
								:class="progressBarColor"
								:style="{ width: progressPercent + '%' }"
							></div>
						</div>
						<div class="flex items-center justify-between mt-1.5 text-[11px] text-gray-600">
							<span>{{ uploadedCount }}/{{ totalCount }} {{ __('documents') }}</span>
							<span v-if="mandatoryMissing > 0" class="text-red-500 font-bold">
								{{ mandatoryMissing }} {{ __('required missing') }}
							</span>
							<span v-else class="text-green-600 font-bold">{{ __('All required complete') }}</span>
						</div>
					</div>

					<!-- Expiring Alert -->
					<div v-if="expiringCount > 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-3">
						<div class="flex items-center gap-2">
							<FeatherIcon name="alert-triangle" class="w-4 h-4 text-red-500" />
							<span class="text-xs font-semibold text-red-700 dark:text-red-400">
								{{ expiringCount }} {{ expiringCount === 1 ? __('document') : __('documents') }} {{ __('expiring soon') }}
							</span>
						</div>
					</div>

					<!-- Document Type Cards - Grouped by Category -->
					<template v-for="(catDocs, category) in groupedDocs" :key="category">
						<div class="text-xs font-bold text-gray-600 uppercase tracking-wider px-1 mt-1">{{ category }}</div>

						<button
							v-for="item in catDocs"
							:key="item.type_name"
							@click="handleCardTap(item)"
							class="w-full text-left card-premium p-3.5"
							:class="cardBorderOverride(item)"
						>
							<div class="flex items-center gap-3">
								<!-- Status Icon -->
								<div
									class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
									:class="iconBgClass(item)"
								>
									<FeatherIcon :name="cardIcon(item)" class="w-5 h-5" :class="iconColorClass(item)" />
								</div>

								<!-- Content -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-1.5">
										<span class="text-sm font-semibold text-gray-900 truncate">{{ item.type_name }}</span>
										<span v-if="item.is_mandatory" class="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{{ __('Required') }}</span>
									</div>

									<!-- Uploaded: Show document info -->
									<div v-if="item.uploaded && item.document" class="mt-0.5">
										<div class="text-xs text-gray-700">{{ item.document.document_title }}</div>
										<div class="flex items-center gap-2 mt-0.5">
											<span
												class="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
												:class="statusClass(item.document.status)"
											>{{ __(item.document.status) }}</span>
											<span v-if="item.document.expiry_date" class="text-[11px]" :class="expiryTextClass(item.document)">
												{{ __('Exp') }}: {{ formatDate(item.document.expiry_date) }}
											</span>
										</div>
									</div>

									<!-- Not Uploaded -->
									<div v-else class="text-xs text-gray-600 mt-0.5">
										{{ __('Not uploaded') }} &middot; {{ __('Tap to upload') }}
									</div>
								</div>

								<!-- Right Arrow -->
								<FeatherIcon name="chevron-right" class="w-4 h-4 text-gray-700 flex-shrink-0" />
							</div>
						</button>
					</template>
				</template>
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

const docs = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_my_documents",
	auto: true,
	cache: "doc_center:my_documents",
})

// Progress calculations
const totalCount = computed(() => docs.data?.length || 0)
const uploadedCount = computed(() => docs.data?.filter(d => d.uploaded).length || 0)
const mandatoryMissing = computed(() => docs.data?.filter(d => d.is_mandatory && !d.uploaded).length || 0)
const progressPercent = computed(() => {
	if (!totalCount.value) return 0
	return Math.round((uploadedCount.value / totalCount.value) * 100)
})
const expiringCount = computed(() => {
	if (!docs.data) return 0
	return docs.data.filter(d => d.uploaded && d.document?.days_until_expiry > 0 && d.document?.days_until_expiry <= 30).length
})

const progressColor = computed(() => {
	if (progressPercent.value >= 80) return "text-green-600"
	if (progressPercent.value >= 50) return "text-orange-600"
	return "text-red-600"
})
const progressBarColor = computed(() => {
	if (progressPercent.value >= 80) return "bg-green-500"
	if (progressPercent.value >= 50) return "bg-orange-500"
	return "bg-red-500"
})

// Group by category
const groupedDocs = computed(() => {
	if (!docs.data) return {}
	const groups = {}
	for (const item of docs.data) {
		const cat = item.category || "Other"
		if (!groups[cat]) groups[cat] = []
		groups[cat].push(item)
	}
	return groups
})

function handleCardTap(item) {
	if (item.uploaded && item.document) {
		router.push({ name: "EmployeeDocumentDetailView", params: { id: item.document.name } })
	} else {
		router.push({ name: "EmployeeDocumentCreateView", query: { type: item.type_name } })
	}
}

function cardIcon(item) {
	if (item.uploaded) {
		if (item.document?.status === "Expired") return "alert-triangle"
		if (item.document?.status === "Rejected") return "x-circle"
		if (item.document?.status === "Approved") return "check-circle"
		return "clock"
	}
	return categoryIcon(item.category)
}

function categoryIcon(cat) {
	switch (cat) {
		case "Identity": return "credit-card"
		case "Education": return "award"
		case "Professional": return "briefcase"
		case "Medical": return "heart"
		case "Legal": return "file-text"
		case "Financial": return "dollar-sign"
		default: return "file"
	}
}

function iconBgClass(item) {
	if (item.uploaded) {
		switch (item.document?.status) {
			case "Approved": return "bg-green-100 dark:bg-green-900/30"
			case "Rejected": return "bg-red-100 dark:bg-red-900/30"
			case "Expired": return "bg-orange-100 dark:bg-orange-900/30"
			default: return "bg-icd-50 dark:bg-icd-900/30"
		}
	}
	return "bg-icd-50 dark:bg-icd-900/30"
}

function iconColorClass(item) {
	if (item.uploaded) {
		switch (item.document?.status) {
			case "Approved": return "text-green-600 dark:text-green-400"
			case "Rejected": return "text-red-600 dark:text-red-400"
			case "Expired": return "text-orange-600 dark:text-orange-400"
			default: return "text-icd-600 dark:text-icd-300"
		}
	}
	return "text-icd-600 dark:text-icd-300"
}

function cardBorderOverride(item) {
	if (!item.uploaded && item.is_mandatory) return "!border-red-200 dark:!border-red-800/30"
	if (item.uploaded && item.document?.status === "Expired") return "!border-orange-200 dark:!border-orange-800/30"
	if (item.uploaded && item.document?.status === "Rejected") return "!border-red-200 dark:!border-red-800/30"
	return ""
}

function statusClass(status) {
	switch (status) {
		case "Pending": return "bg-orange-100 text-orange-700"
		case "Under Review": return "bg-blue-100 text-blue-700"
		case "Approved": return "bg-green-100 text-green-700"
		case "Rejected": return "bg-red-100 text-red-700"
		case "Expired": return "bg-gray-200 text-gray-600"
		default: return "bg-gray-100 text-gray-600"
	}
}

function expiryTextClass(doc) {
	if (doc.days_until_expiry < 0) return "text-red-600 font-bold"
	if (doc.days_until_expiry <= 30) return "text-orange-600 font-semibold"
	return "text-gray-600"
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}
</script>
