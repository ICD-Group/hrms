<template>
	<ion-page>
		<div class="app-bg-ambient"></div>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<Button variant="ghost" class="!pl-0 hover:bg-white/50" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5" />
					</Button>
					<h2 class="text-lg font-bold text-gray-900">{{ __("Leave Balance") }}</h2>
				</header>

				<div class="flex flex-col p-4 gap-4">
					<!-- Search -->
					<div class="relative">
						<FeatherIcon name="search" class="w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
						<input
							v-model="searchQuery"
							type="text"
							:placeholder="__('Search employee...')"
							class="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-icd-400 bg-white"
						/>
					</div>

					<!-- Loading -->
					<div v-if="isLoading" class="flex items-center justify-center py-10">
						<LoadingIndicator class="w-8 h-8 text-gray-600" />
					</div>

					<!-- Empty -->
					<div v-else-if="filteredAllocations.length === 0" class="text-center py-10 text-sm text-gray-700">
						{{ __("No leave allocations found") }}
					</div>

					<!-- Employee Leave Cards -->
					<div v-else class="flex flex-col gap-3">
						<div
							v-for="emp in filteredAllocations"
							:key="emp.employee"
							class="card-premium p-4"
							@click="toggleExpand(emp.employee)"
						>
							<div class="flex items-center justify-between mb-2">
								<div class="text-sm font-semibold text-gray-900">{{ emp.employee_name }}</div>
								<FeatherIcon
									:name="expanded === emp.employee ? 'chevron-up' : 'chevron-down'"
									class="w-4 text-gray-600"
								/>
							</div>
							<div class="text-xs text-gray-700 mb-2">{{ emp.department }}</div>

							<!-- Summary row -->
							<div class="flex gap-2 flex-wrap">
								<span
									v-for="lt in emp.leave_types"
									:key="lt.leave_type"
									class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
									:class="lt.balance > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'"
								>
									{{ lt.leave_type_abbr }}: {{ lt.balance }}
								</span>
							</div>

							<!-- Expanded detail -->
							<div v-if="expanded === emp.employee" class="mt-3 border-t border-gray-100 pt-3">
								<div
									v-for="lt in emp.leave_types"
									:key="lt.leave_type"
									class="flex items-center justify-between py-1.5"
								>
									<div class="text-xs text-gray-700">{{ lt.leave_type }}</div>
									<div class="flex items-center gap-3 text-xs">
										<span class="text-gray-600">{{ __("Total") }}: {{ lt.total }}</span>
										<span class="text-orange-500">{{ __("Used") }}: {{ lt.used }}</span>
										<span class="font-bold" :class="lt.balance > 0 ? 'text-green-700' : 'text-red-600'">
											{{ lt.balance }}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, computed, inject, watch } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, toast } from "frappe-ui"
import { useManagerApi } from "@/composables/managerApi"

const { getList } = useManagerApi()

const router = useRouter()
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

const searchQuery = ref("")
const isLoading = ref(true)
const allocations = ref([])
const expanded = ref(null)

function toggleExpand(empId) {
	expanded.value = expanded.value === empId ? null : empId
}

function getAbbr(leaveType) {
	if (!leaveType) return "?"
	return leaveType.split(" ").map(w => w[0]).join("").substring(0, 3)
}

async function loadLeaveBalance() {
	if (!employee.data?.company) return
	isLoading.value = true
	try {
		const data = await getList({
			doctype: "Leave Allocation",
			filters: {
				company: employee.data.company,
				docstatus: 1,
				to_date: [">=", new Date().toISOString().split("T")[0]],
			},
			fields: ["employee", "employee_name", "department", "leave_type", "total_leaves_allocated", "new_leaves_allocated", "name"],
			order_by: "employee_name asc",
			limit_page_length: 0,
		})

		// Get leave applications to calculate used
		const leaveApps = await getList({
			doctype: "Leave Application",
			filters: {
				company: employee.data.company,
				status: "Approved",
				docstatus: 1,
			},
			fields: ["employee", "leave_type", "total_leave_days"],
			limit_page_length: 0,
		})

		// Build used map
		const usedMap = {}
		for (const la of (leaveApps || [])) {
			const key = `${la.employee}__${la.leave_type}`
			usedMap[key] = (usedMap[key] || 0) + (la.total_leave_days || 0)
		}

		// Group by employee
		const empMap = {}
		for (const alloc of (data || [])) {
			if (!empMap[alloc.employee]) {
				empMap[alloc.employee] = {
					employee: alloc.employee,
					employee_name: alloc.employee_name,
					department: alloc.department || "",
					leave_types: [],
				}
			}
			const usedKey = `${alloc.employee}__${alloc.leave_type}`
			const used = usedMap[usedKey] || 0
			const total = alloc.total_leaves_allocated || 0
			empMap[alloc.employee].leave_types.push({
				leave_type: alloc.leave_type,
				leave_type_abbr: getAbbr(alloc.leave_type),
				total: total,
				used: used,
				balance: total - used,
			})
		}

		allocations.value = Object.values(empMap)
	} catch (e) {
		_errToast(e, "Failed to load leave balance")
		allocations.value = []
	} finally {
		isLoading.value = false
	}
}

watch(
	() => employee.data?.company,
	(company) => {
		if (company) loadLeaveBalance()
	},
	{ immediate: true }
)

const filteredAllocations = computed(() => {
	if (!searchQuery.value) return allocations.value
	const q = searchQuery.value.toLowerCase()
	return allocations.value.filter(
		(e) => e.employee_name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)
	)
})
</script>
