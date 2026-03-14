<template>
	<BaseLayout :pageTitle="__('Salary Structures')" :showBack="true">
		<template #body>
			<div class="flex flex-col mt-1 mb-2 gap-2.5">
				<!-- Search -->
				<div class="flex items-center gap-2 card-premium p-3 mx-3">
					<FeatherIcon name="search" class="w-4 h-4 text-gray-600 flex-shrink-0" />
					<input v-model="searchQuery" :placeholder="__('Search employee...')"
						class="flex-1 bg-transparent text-sm border-0 outline-none text-gray-800 placeholder:text-gray-700" />
				</div>

				<!-- Loading -->
				<div v-if="isLoading" class="flex items-center justify-center py-10">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<!-- Assignment Cards -->
				<div v-else-if="filteredAssignments.length > 0" class="flex flex-col gap-2 px-3">
					<div v-for="a in filteredAssignments" :key="a.name"
						class="card-premium p-4">
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-2 min-w-0">
								<div class="w-9 h-9 rounded-full bg-icd-50 flex items-center justify-center flex-shrink-0">
									<span class="text-sm font-bold text-icd-600">{{ a.employee_name?.charAt(0) }}</span>
								</div>
								<div class="min-w-0">
									<div class="text-sm font-bold text-gray-800 truncate">{{ a.employee_name }}</div>
									<div class="text-xs text-gray-600">{{ a.department }} · {{ a.designation }}</div>
								</div>
							</div>
							<div class="text-right flex-shrink-0">
								<div class="text-xs font-black text-icd-600">{{ fmt(a.base) }}</div>
								<div class="text-xs text-gray-600">{{ __("base") }}</div>
							</div>
						</div>

						<!-- Structure info -->
						<div class="bg-gray-100 dark:bg-white/5 rounded-lg p-2.5 mt-2">
							<div class="flex items-center justify-between">
								<div class="text-xs font-semibold text-gray-600">{{ a.salary_structure }}</div>
								<span class="text-xs font-bold text-gray-600">{{ __("From") }} {{ a.from_date }}</span>
							</div>
						</div>

						<!-- Expand to show components -->
						<button @click="toggleExpand(a)"
							class="w-full mt-2 text-xs text-icd-600 font-semibold flex items-center justify-center gap-1 py-1 active:opacity-70">
							<FeatherIcon :name="a._expanded ? 'chevron-up' : 'chevron-down'" class="w-3.5 h-3.5" />
							{{ a._expanded ? __("Hide Components") : __("Show Components") }}
						</button>

						<!-- Components (expanded) -->
						<div v-if="a._expanded && a._components" class="mt-2 space-y-1">
							<div v-if="a._components.earnings?.length" class="text-xs font-bold text-green-600 uppercase tracking-wide mt-2">{{ __("Earnings") }}</div>
							<div v-for="c in a._components.earnings" :key="c.name"
								class="flex items-center justify-between px-2 py-1.5 bg-green-50/50 rounded">
								<span class="text-xs text-gray-700">{{ c.salary_component }}</span>
								<span class="text-xs font-bold text-green-600">{{ c.amount_based_on_formula ? __("Formula") : fmt(c.amount || c.default_amount) }}</span>
							</div>
							<div v-if="a._components.deductions?.length" class="text-xs font-bold text-red-600 uppercase tracking-wide mt-2">{{ __("Deductions") }}</div>
							<div v-for="c in a._components.deductions" :key="c.name"
								class="flex items-center justify-between px-2 py-1.5 bg-red-50/50 rounded">
								<span class="text-xs text-gray-700">{{ c.salary_component }}</span>
								<span class="text-xs font-bold text-red-600">{{ c.amount_based_on_formula ? __("Formula") : fmt(c.amount || c.default_amount) }}</span>
							</div>
						</div>
						<div v-else-if="a._expanded && a._loadingComponents" class="flex justify-center py-3">
							<LoadingIndicator class="w-5 h-5 text-gray-600" />
						</div>
					</div>
				</div>

				<!-- Empty -->
				<div v-else class="flex flex-col items-center justify-center py-16 px-3">
					<div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
						<FeatherIcon name="layers" class="w-7 h-7 text-gray-700" />
					</div>
					<div class="text-sm font-bold text-gray-600">{{ __("No salary structure assignments found") }}</div>
				</div>

				<div class="h-4"></div>
			</div>
		</template>
	</BaseLayout>
</template>

<script setup>
import { ref, computed, inject, watch } from "vue"
import { LoadingIndicator, FeatherIcon, call, toast } from "frappe-ui"
import BaseLayout from "@/components/BaseLayout.vue"

const __ = inject("$translate")
const employee = inject("$employee")

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const isLoading = ref(false)
const searchQuery = ref("")
const assignments = ref([])

async function loadAssignments() {
	isLoading.value = true
	try {
		const data = await call("frappe.client.get_list", {
			doctype: "Salary Structure Assignment",
			fields: ["name", "employee", "employee_name", "department", "designation",
					 "salary_structure", "base", "from_date", "docstatus"],
			filters: { docstatus: 1 },
			order_by: "employee_name asc",
			limit_page_length: 200,
		})
		assignments.value = (data || []).map(a => ({ ...a, _expanded: false, _components: null, _loadingComponents: false }))
	} catch (e) {
		_errToast(e, "Failed to load salary structures")
	}
	isLoading.value = false
}

const filteredAssignments = computed(() => {
	if (!searchQuery.value) return assignments.value
	const q = searchQuery.value.toLowerCase()
	return assignments.value.filter(a =>
		(a.employee_name || "").toLowerCase().includes(q) ||
		(a.department || "").toLowerCase().includes(q) ||
		(a.salary_structure || "").toLowerCase().includes(q)
	)
})

async function toggleExpand(a) {
	if (a._expanded) {
		a._expanded = false
		return
	}
	a._expanded = true
	if (a._components) return

	a._loadingComponents = true
	try {
		const doc = await call("frappe.client.get", {
			doctype: "Salary Structure",
			name: a.salary_structure,
		})
		a._components = {
			earnings: doc?.earnings || [],
			deductions: doc?.deductions || [],
		}
	} catch (e) {
		_errToast(e, "Failed to load components")
		a._components = { earnings: [], deductions: [] }
	}
	a._loadingComponents = false
}

function fmt(n) {
	if (!n && n !== 0) return "0"
	return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
}

watch(() => employee.data?.company, (c) => { if (c) loadAssignments() }, { immediate: true })
</script>
