<template>
	<ion-page>
		<div class="app-bg-ambient"></div>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<Button variant="ghost" class="!pl-0 hover:bg-white/50" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5" />
					</Button>
					<h2 class="text-lg font-bold text-gray-900">{{ __("Leave Allocation") }}</h2>
				</header>

				<div class="flex flex-col p-4 gap-4">
					<!-- Allocate New -->
					<button
						@click="showAllocateModal = true"
						class="w-full bg-icd-600 text-white rounded-xl py-3 font-bold text-sm active:bg-icd-700"
					>
						+ {{ __("New Leave Allocation") }}
					</button>

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

					<!-- Allocations List -->
					<div v-else class="flex flex-col gap-2">
						<div
							v-for="alloc in filteredAllocations"
							:key="alloc.name"
							class="card-premium p-3 flex items-center gap-3"
						>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-semibold text-gray-900 truncate">{{ alloc.employee_name }}</div>
								<div class="text-[11px] text-gray-600">{{ alloc.leave_type }}</div>
								<div class="flex items-center gap-2 mt-1">
									<span class="text-[11px] text-gray-700">
										{{ dayjs(alloc.from_date).format("DD-MM") }} - {{ dayjs(alloc.to_date).format("DD-MM-YYYY") }}
									</span>
								</div>
							</div>
							<div class="flex flex-col items-end gap-0.5">
								<span class="text-lg font-bold text-icd-700">{{ alloc.total_leaves_allocated }}</span>
								<span class="text-[11px] text-gray-600">{{ __("days") }}</span>
								<span
									class="text-[11px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
									:class="alloc.docstatus === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
								>
									{{ alloc.docstatus === 1 ? __("Submitted") : __("Draft") }}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Allocate Modal -->
			<ion-modal :is-open="showAllocateModal" @didDismiss="showAllocateModal = false">
				<div class="flex flex-col h-full bg-white">
					<header class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
						<h3 class="text-base font-bold text-gray-900">{{ __("New Leave Allocation") }}</h3>
						<button @click="showAllocateModal = false" class="text-gray-600">
							<FeatherIcon name="x" class="w-5 h-5" />
						</button>
					</header>
					<div class="flex-1 overflow-y-auto p-4">
						<div class="flex flex-col gap-4">
							<div>
								<label class="text-xs text-gray-700 mb-1 block">{{ __("Employee") }}</label>
								<select
									v-model="allocForm.employee"
									class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-icd-400 bg-white"
								>
									<option value="">{{ __("Select Employee") }}</option>
									<option v-for="emp in allEmployees" :key="emp.name" :value="emp.name">
										{{ emp.employee_name }}
									</option>
								</select>
							</div>
							<div>
								<label class="text-xs text-gray-700 mb-1 block">{{ __("Leave Type") }}</label>
								<select
									v-model="allocForm.leave_type"
									class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-icd-400 bg-white"
								>
									<option value="">{{ __("Select Leave Type") }}</option>
									<option v-for="lt in leaveTypes" :key="lt.name" :value="lt.name">
										{{ lt.name }}
									</option>
								</select>
							</div>
							<div>
								<label class="text-xs text-gray-700 mb-1 block">{{ __("New Leaves Allocated") }}</label>
								<input
									v-model.number="allocForm.new_leaves"
									type="number"
									min="0"
									step="0.5"
									class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-icd-400"
								/>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label class="text-xs text-gray-700 mb-1 block">{{ __("From Date") }}</label>
									<input
										v-model="allocForm.from_date"
										type="date"
										class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-icd-400"
									/>
								</div>
								<div>
									<label class="text-xs text-gray-700 mb-1 block">{{ __("To Date") }}</label>
									<input
										v-model="allocForm.to_date"
										type="date"
										class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-icd-400"
									/>
								</div>
							</div>
						</div>
					</div>
					<div class="p-4 border-t border-gray-100">
						<button
							@click="submitAllocation"
							:disabled="isAllocating || !allocForm.employee || !allocForm.leave_type || !allocForm.new_leaves"
							class="w-full bg-icd-600 text-white rounded-xl py-3 font-bold text-sm active:bg-icd-700 disabled:opacity-50"
						>
							<span v-if="isAllocating">{{ __("Allocating...") }}</span>
							<span v-else>{{ __("Allocate & Submit") }}</span>
						</button>
					</div>
				</div>
			</ion-modal>

			<!-- Success Toast -->
			<div v-if="showSuccess" class="fixed bottom-6 left-4 right-4 bg-green-600 text-white rounded-xl p-4 text-center text-sm font-bold z-50 shadow-lg">
				{{ successMessage }}
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, computed, inject, watch } from "vue"
import { useRouter } from "vue-router"
import { IonPage, IonContent, IonModal } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, toast } from "frappe-ui"
import { useManagerApi } from "@/composables/managerApi"

const { getList, insertDoc, submitDoc } = useManagerApi()

const router = useRouter()
const __ = inject("$translate")
const employee = inject("$employee")
const dayjs = inject("$dayjs")

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const isLoading = ref(true)
const searchQuery = ref("")
const allocations = ref([])
const allEmployees = ref([])
const leaveTypes = ref([])
const showAllocateModal = ref(false)
const isAllocating = ref(false)
const showSuccess = ref(false)
const successMessage = ref("")

const allocForm = ref({
	employee: "",
	leave_type: "",
	new_leaves: 0,
	from_date: dayjs().startOf("year").format("YYYY-MM-DD"),
	to_date: dayjs().endOf("year").format("YYYY-MM-DD"),
})

const filteredAllocations = computed(() => {
	if (!searchQuery.value) return allocations.value
	const q = searchQuery.value.toLowerCase()
	return allocations.value.filter(
		(a) => a.employee_name.toLowerCase().includes(q) || a.leave_type.toLowerCase().includes(q)
	)
})

async function loadAllocations() {
	if (!employee.data?.company) return
	isLoading.value = true
	try {
		const data = await getList({
			doctype: "Leave Allocation",
			filters: {
				company: employee.data.company,
				docstatus: ["<", 2],
				to_date: [">=", dayjs().startOf("year").format("YYYY-MM-DD")],
			},
			fields: ["name", "employee", "employee_name", "leave_type", "total_leaves_allocated", "new_leaves_allocated", "from_date", "to_date", "docstatus"],
			order_by: "employee_name asc, leave_type asc",
			limit_page_length: 0,
		})
		allocations.value = data || []
	} catch (e) {
		_errToast(e, "Failed to load allocations")
		allocations.value = []
	} finally {
		isLoading.value = false
	}
}

async function loadEmployees() {
	if (!employee.data?.company) return
	try {
		const data = await getList({
			doctype: "Employee",
			filters: { status: "Active", company: employee.data.company },
			fields: ["name", "employee_name"],
			order_by: "employee_name asc",
			limit_page_length: 0,
		})
		allEmployees.value = data || []
	} catch (e) {
		_errToast(e, "Failed to load employees")
	}
}

async function loadLeaveTypes() {
	try {
		const data = await getList({
			doctype: "Leave Type",
			fields: ["name"],
			order_by: "name asc",
			limit_page_length: 0,
		})
		leaveTypes.value = data || []
	} catch (e) {
		_errToast(e, "Failed to load leave types")
	}
}

async function submitAllocation() {
	if (!allocForm.value.employee || !allocForm.value.leave_type || !allocForm.value.new_leaves) return
	isAllocating.value = true
	try {
		const doc = await insertDoc({
			doc: {
				doctype: "Leave Allocation",
				employee: allocForm.value.employee,
				leave_type: allocForm.value.leave_type,
				new_leaves_allocated: allocForm.value.new_leaves,
				from_date: allocForm.value.from_date,
				to_date: allocForm.value.to_date,
				company: employee.data.company,
			},
		})
		await submitDoc({
			doc: { doctype: "Leave Allocation", name: doc.name },
		})

		showAllocateModal.value = false
		successMessage.value = __("Leave allocated successfully")
		showSuccess.value = true
		setTimeout(() => { showSuccess.value = false }, 3000)

		allocForm.value = {
			employee: "",
			leave_type: "",
			new_leaves: 0,
			from_date: dayjs().startOf("year").format("YYYY-MM-DD"),
			to_date: dayjs().endOf("year").format("YYYY-MM-DD"),
		}
		loadAllocations()
	} catch (e) {
		_errToast(e, "Failed to allocate leave")
	} finally {
		isAllocating.value = false
	}
}

watch(
	() => employee.data?.company,
	(company) => {
		if (company) {
			loadAllocations()
			loadEmployees()
			loadLeaveTypes()
		}
	},
	{ immediate: true }
)
</script>
