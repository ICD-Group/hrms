<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex flex-row glass-header px-4 py-2.5 items-center justify-between">
					<div class="flex flex-row items-center">
						<Button variant="ghost" class="!px-1 mr-1 hover:bg-white/50" @click="router.back()">
							<FeatherIcon name="chevron-left" class="h-5 w-5" />
						</Button>
						<h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ __('Genius Search') }}</h2>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-3 p-4">
				<!-- Search Input -->
				<div class="glass-section rounded-xl p-3">
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<FeatherIcon name="search" class="h-5 w-5 text-gray-600" />
						</div>
						<input
							ref="searchInput"
							v-model="searchQuery"
							type="text"
							:placeholder="__('Name, phone, email, tax ID...')"
							class="w-full pl-10 pr-10 py-3 rounded-xl bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--icd-purple)] focus:border-transparent text-[16px]"
							@input="onSearchInput"
							@keyup.enter="doSearch"
						/>
						<button
							v-if="searchQuery"
							class="absolute inset-y-0 right-0 pr-3 flex items-center"
							@click="clearSearch"
						>
							<FeatherIcon name="x-circle" class="h-5 w-5 text-gray-600" />
						</button>
					</div>
					<!-- Query type hint -->
					<div v-if="searchQuery && searchQuery.length >= 2" class="flex items-center gap-2 mt-2 px-1">
						<span class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
							:class="queryTypeClass">
							{{ queryTypeLabel }}
						</span>
						<span class="text-[11px] text-gray-600">{{ __('detected') }}</span>
					</div>
				</div>

				<!-- Loading -->
				<div v-if="searchResource.loading" class="flex justify-center py-8">
					<div class="w-6 h-6 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
				</div>

				<!-- No query yet -->
				<div v-else-if="!hasSearched" class="flex flex-col items-center py-12 text-center">
					<div class="w-16 h-16 rounded-full bg-icd-50 dark:bg-icd-900/30 flex items-center justify-center mb-3">
						<FeatherIcon name="search" class="h-8 w-8 text-icd-400" />
					</div>
					<p class="text-sm text-gray-700 dark:text-gray-400">{{ __('Check if a customer or contact exists') }}</p>
					<p class="text-xs text-gray-600 mt-1">{{ __('Search by name, phone, email, or tax ID') }}</p>
				</div>

				<!-- No results -->
				<div v-else-if="totalResults === 0 && !searchResource.loading" class="flex flex-col items-center py-12 text-center">
					<div class="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-3">
						<FeatherIcon name="check-circle" class="h-8 w-8 text-green-400" />
					</div>
					<p class="text-sm font-medium text-green-600 dark:text-green-400">{{ __('Not in our system') }}</p>
					<p class="text-xs text-gray-600 mt-1">{{ __('This customer/contact is available') }}</p>
				</div>

				<!-- Results -->
				<template v-else-if="searchResource.data?.results">
					<!-- Summary Banner -->
					<div class="glass-section rounded-xl p-3 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200/50 dark:border-orange-800/20">
						<div class="flex items-center gap-2">
							<FeatherIcon name="alert-circle" class="h-5 w-5 text-orange-500 flex-shrink-0" />
							<span class="text-sm font-semibold text-orange-700 dark:text-orange-300">
								{{ totalResults }} {{ totalResults === 1 ? __('match found') : __('matches found') }}
							</span>
						</div>
						<p class="text-xs text-orange-500 dark:text-orange-400 mt-1 ml-7">
							{{ __('Already exists in our system') }}
						</p>
					</div>

					<!-- Result Cards -->
					<div class="flex flex-col gap-2">
						<div v-for="(item, idx) in searchResource.data.results" :key="idx"
							class="glass-section rounded-xl p-3"
						>
							<div class="flex items-start justify-between">
								<div class="flex-1 min-w-0">
									<!-- Customer/Company Name -->
									<div class="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
										{{ item.customer_name || item.contact_name }}
									</div>
									<!-- Contact name under customer (if different) -->
									<div v-if="item.contact_name && item.customer_name && item.contact_name !== item.customer_name"
										class="text-[12px] text-gray-600 mt-0.5 truncate">
										{{ __('Contact') }}: {{ item.contact_name }}
									</div>
								</div>
								<!-- Type Badge -->
								<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ml-2"
									:class="typeBadgeClass(item.type)">
									{{ item.type === 'Customer' ? __('Customer') : item.type === 'Contact' ? __('Contact') : __('Lead') }}
								</span>
							</div>

							<!-- Sales Partner / Owner -->
							<div class="mt-2">
								<div v-if="item.sales_partner" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
									<FeatherIcon name="user-check" class="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
									<span class="text-[12px] font-semibold text-green-700 dark:text-green-300">{{ item.sales_partner }}</span>
								</div>
								<div v-else class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5">
									<FeatherIcon name="user-x" class="h-3.5 w-3.5 text-gray-600" />
									<span class="text-[12px] text-gray-600">{{ __('Not assigned') }}</span>
								</div>
							</div>

							<!-- Status indicators -->
							<div class="flex items-center gap-2 mt-2">
								<!-- Has contact linked -->
								<span v-if="item.type === 'Customer'" class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
									:class="item.has_contact ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300' : 'bg-gray-100 dark:bg-white/5 text-gray-600'">
									<FeatherIcon :name="item.has_contact ? 'user' : 'user-x'" class="h-2.5 w-2.5" />
									{{ item.has_contact ? __('Has contact') : __('No contact') }}
								</span>
								<!-- Contact linked to customer -->
								<span v-if="item.type === 'Contact'" class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300">
									<FeatherIcon name="link" class="h-2.5 w-2.5" />
									{{ __('Linked to customer') }}
								</span>
								<!-- Lead status -->
								<span v-if="item.type === 'Lead'" class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
									:class="item.converted ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'">
									<FeatherIcon :name="item.converted ? 'check-circle' : 'target'" class="h-2.5 w-2.5" />
									{{ item.converted ? __('Converted') : (item.status || __('Lead')) }}
								</span>
							</div>
						</div>
					</div>
				</template>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { ref, computed, inject, onMounted } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon, Button } from "frappe-ui"

const __ = inject("$translate")
const router = useRouter()

const searchQuery = ref("")
const searchInput = ref(null)
const hasSearched = ref(false)
let searchTimer = null

const searchResource = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.genius_customer_search",
	makeParams() {
		return { query: searchQuery.value }
	},
})

const totalResults = computed(() => searchResource.data?.total || 0)

// Detect query type for the hint badge
const detectedType = computed(() => {
	const q = searchQuery.value?.trim() || ""
	if (!q || q.length < 2) return ""
	if (q.includes("@") && q.includes(".")) return "email"
	const digits = q.replace(/[\s\-\+\(\)]/g, "")
	if ((q.startsWith("0") || q.startsWith("+") || (digits.length >= 7 && /^\d+$/.test(digits)))) return "phone"
	if (/^[\d\-]{3,}$/.test(q)) return "tax_id"
	return "name"
})

const queryTypeLabel = computed(() => {
	const labels = { email: "Email", phone: "Phone", tax_id: "Tax ID", name: "Name" }
	return labels[detectedType.value] || ""
})

const queryTypeClass = computed(() => {
	const classes = {
		email: "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-300",
		phone: "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-300",
		tax_id: "bg-orange-100 dark:bg-orange-800/40 text-orange-600 dark:text-orange-300",
		name: "bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-300",
	}
	return classes[detectedType.value] || ""
})

function typeBadgeClass(type) {
	const map = {
		"Customer": "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-300",
		"Contact": "bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-300",
		"Lead": "bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-300",
	}
	return map[type] || "bg-gray-100 dark:bg-white/10 text-gray-700"
}

function onSearchInput() {
	clearTimeout(searchTimer)
	if (searchQuery.value.trim().length < 2) {
		hasSearched.value = false
		return
	}
	searchTimer = setTimeout(() => doSearch(), 400)
}

function doSearch() {
	const q = searchQuery.value.trim()
	if (q.length < 2) return
	hasSearched.value = true
	searchResource.fetch()
}

function clearSearch() {
	searchQuery.value = ""
	hasSearched.value = false
	searchResource.reset()
	searchInput.value?.focus()
}

onMounted(() => {
	setTimeout(() => searchInput.value?.focus(), 300)
})
</script>
