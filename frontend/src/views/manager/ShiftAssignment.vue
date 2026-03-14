<template>
	<ion-page>
		<div class="app-bg-ambient"></div>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<Button variant="ghost" class="!pl-0 hover:bg-white/50" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5" />
					</Button>
					<h2 class="text-lg font-bold text-gray-900">{{ __("Shift Assignment") }}</h2>
				</header>

				<div class="flex flex-col p-4 gap-4">
					<!-- Available Shifts -->
					<div class="card-premium p-3">
						<label class="text-xs text-gray-700 mb-2 block font-semibold">{{ __("Shift Types") }}</label>
						<div v-if="shiftsLoading" class="flex items-center justify-center py-4">
							<LoadingIndicator class="w-6 h-6 text-gray-600" />
						</div>
						<div v-else-if="shiftTypes.length === 0" class="text-xs text-gray-600 py-2">
							{{ __("No shift types configured") }}
						</div>
						<div v-else class="flex gap-2 flex-wrap">
							<button
								v-for="shift in shiftTypes"
								:key="shift.name"
								@click="selectedShift = shift.name"
								class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
								:class="selectedShift === shift.name
									? 'bg-icd-600 text-white'
									: 'bg-gray-100 text-gray-600 active:bg-gray-200'"
							>
								{{ shift.name }}
							</button>
						</div>
					</div>

					<!-- Current Assignments -->
					<div v-if="selectedShift" class="flex flex-col gap-3">
						<div class="flex items-center justify-between">
							<h3 class="text-sm font-bold text-gray-800">{{ __("Current Assignments") }}</h3>
							<button
								@click="showAssignModal = true"
								class="bg-icd-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold active:bg-icd-700"
							>
								+ {{ __("Assign") }}
							</button>
						</div>

						<div v-if="assignmentsLoading" class="flex items-center justify-center py-6">
							<LoadingIndicator class="w-6 h-6 text-gray-600" />
						</div>

						<div v-else-if="assignments.length === 0" class="text-center py-6 text-sm text-gray-700">
							{{ __("No active assignments for this shift") }}
						</div>

						<div v-else class="flex flex-col gap-2">
							<div
								v-for="asgn in assignments"
								:key="asgn.name"
								class="card-premium p-3 flex items-center justify-between"
							>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-900 truncate">{{ asgn.employee_name }}</div>
									<div class="text-[11px] text-gray-600">{{ asgn.department || "" }}</div>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-[11px] text-icd-600 font-medium">
											{{ dayjs(asgn.start_date).format("DD-MM") }}
											<span v-if="asgn.end_date"> - {{ dayjs(asgn.end_date).format("DD-MM") }}</span>
											<span v-else> {{ __("onwards") }}</span>
										</span>
									</div>
								</div>
								<span
									class="text-[11px] font-bold px-2 py-0.5 rounded-full"
									:class="asgn.docstatus === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
								>
									{{ asgn.docstatus === 1 ? __("Active") : __("Draft") }}
								</span>
							</div>
						</div>
					</div>

					<!-- Shift Details -->
					<div v-if="selectedShiftData" class="card-premium p-4">
						<h3 class="text-sm font-bold text-gray-800 mb-3">{{ __("Shift Details") }}</h3>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<div class="text-[11px] text-gray-600">{{ __("Start Time") }}</div>
								<div class="text-sm font-semibold text-gray-800">{{ selectedShiftData.start_time || "-" }}</div>
							</div>
							<div>
								<div class="text-[11px] text-gray-600">{{ __("End Time") }}</div>
								<div class="text-sm font-semibold text-gray-800">{{ selectedShiftData.end_time || "-" }}</div>
							</div>
							<div>
								<div class="text-[11px] text-gray-600">{{ __("Holiday List") }}</div>
								<div class="text-sm font-semibold text-gray-800">{{ selectedShiftData.holiday_list || "-" }}</div>
							</div>
							<div>
								<div class="text-[11px] text-gray-600">{{ __("Late Entry Grace") }}</div>
								<div class="text-sm font-semibold text-gray-800">{{ selectedShiftData.late_entry_grace_period || 0 }} {{ __("min") }}</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Assign Modal -->
			<ion-modal :is-open="showAssignModal" @didDismiss="showAssignModal = false">
				<div class="flex flex-col h-full bg-white">
					<header class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
						<h3 class="text-base font-bold text-gray-900">{{ __("Assign Shift") }}</h3>
						<button @click="showAssignModal = false" class="text-gray-600">
							<FeatherIcon name="x" class="w-5 h-5" />
						</button>
					</header>
					<div class="flex-1 overflow-y-auto p-4">
						<div class="flex flex-col gap-4">
							<div>
								<label class="text-xs text-gray-700 mb-1 block">{{ __("Start Date") }}</label>
								<input
									v-model="assignForm.start_date"
									type="date"
									class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-icd-400"
								/>
							</div>
							<div>
								<label class="text-xs text-gray-700 mb-1 block">{{ __("End Date (optional)") }}</label>
								<input
									v-model="assignForm.end_date"
									type="date"
									class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-icd-400"
								/>
							</div>
							<div>
								<label class="text-xs text-gray-700 mb-2 block">{{ __("Select Employees") }}</label>
								<div class="relative mb-2">
									<FeatherIcon name="search" class="w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
									<input
										v-model="empSearch"
										type="text"
										:placeholder="__('Search...')"
										class="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-icd-400"
									/>
								</div>
								<div class="max-h-60 overflow-y-auto flex flex-col gap-1">
									<label
										v-for="emp in filteredUnassigned"
										:key="emp.name"
										class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
									>
										<input
											type="checkbox"
											:value="emp.name"
											v-model="assignForm.employees"
											class="rounded text-icd-600"
										/>
										<span class="text-sm text-gray-800">{{ emp.employee_name }}</span>
										<span class="text-[11px] text-gray-600 ml-auto">{{ emp.department }}</span>
									</label>
								</div>
							</div>
						</div>
					</div>
					<div class="p-4 border-t border-gray-100">
						<button
							@click="submitAssignment"
							:disabled="isAssigning || assignForm.employees.length === 0 || !assignForm.start_date"
							class="w-full bg-icd-600 text-white rounded-xl py-3 font-bold text-sm active:bg-icd-700 disabled:opacity-50"
						>
							<span v-if="isAssigning">{{ __("Assigning...") }}</span>
							<span v-else>{{ __("Assign") }} ({{ assignForm.employees.length }})</span>
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

const shiftTypes = ref([])
const shiftsLoading = ref(true)
const selectedShift = ref(null)
const assignments = ref([])
const assignmentsLoading = ref(false)
const allEmployees = ref([])
const showAssignModal = ref(false)
const empSearch = ref("")
const isAssigning = ref(false)
const showSuccess = ref(false)
const successMessage = ref("")

const assignForm = ref({
	start_date: dayjs().format("YYYY-MM-DD"),
	end_date: "",
	employees: [],
})

const selectedShiftData = computed(() => {
	if (!selectedShift.value) return null
	return shiftTypes.value.find((s) => s.name === selectedShift.value)
})

const filteredUnassigned = computed(() => {
	const assignedIds = new Set(assignments.value.map((a) => a.employee))
	let list = allEmployees.value.filter((e) => !assignedIds.has(e.name))
	if (empSearch.value) {
		const q = empSearch.value.toLowerCase()
		list = list.filter((e) => e.employee_name.toLowerCase().includes(q))
	}
	return list
})

async function loadShifts() {
	shiftsLoading.value = true
	try {
		const data = await getList({
			doctype: "Shift Type",
			fields: ["name", "start_time", "end_time", "holiday_list", "late_entry_grace_period"],
			order_by: "name asc",
			limit_page_length: 0,
		})
		shiftTypes.value = data || []
		if (shiftTypes.value.length > 0 && !selectedShift.value) {
			selectedShift.value = shiftTypes.value[0].name
		}
	} catch (e) {
		_errToast(e, "Failed to load shift types")
	} finally {
		shiftsLoading.value = false
	}
}

async function loadAssignments() {
	if (!selectedShift.value || !employee.data?.company) return
	assignmentsLoading.value = true
	try {
		const data = await getList({
			doctype: "Shift Assignment",
			filters: {
				shift_type: selectedShift.value,
				company: employee.data.company,
				docstatus: ["<", 2],
				status: "Active",
			},
			fields: ["name", "employee", "employee_name", "department", "start_date", "end_date", "docstatus"],
			order_by: "employee_name asc",
			limit_page_length: 0,
		})
		assignments.value = data || []
	} catch (e) {
		_errToast(e, "Failed to load assignments")
		assignments.value = []
	} finally {
		assignmentsLoading.value = false
	}
}

async function loadEmployees() {
	if (!employee.data?.company) return
	try {
		const data = await getList({
			doctype: "Employee",
			filters: { status: "Active", company: employee.data.company },
			fields: ["name", "employee_name", "department"],
			order_by: "employee_name asc",
			limit_page_length: 0,
		})
		allEmployees.value = data || []
	} catch (e) {
		_errToast(e, "Failed to load employees")
	}
}

async function submitAssignment() {
	if (assignForm.value.employees.length === 0 || !assignForm.value.start_date) return
	isAssigning.value = true
	let successCount = 0

	for (const empId of assignForm.value.employees) {
		try {
			const doc = await insertDoc({
				doc: {
					doctype: "Shift Assignment",
					employee: empId,
					shift_type: selectedShift.value,
					company: employee.data.company,
					start_date: assignForm.value.start_date,
					end_date: assignForm.value.end_date || null,
				},
			})
			await submitDoc({
				doc: { doctype: "Shift Assignment", name: doc.name },
			})
			successCount++
		} catch (e) {
			_errToast(e, "Failed to assign shift")
		}
	}

	isAssigning.value = false
	showAssignModal.value = false

	if (successCount > 0) {
		successMessage.value = `${successCount} ${__("shift assignments created")}`
		showSuccess.value = true
		setTimeout(() => { showSuccess.value = false }, 3000)
		assignForm.value = { start_date: dayjs().format("YYYY-MM-DD"), end_date: "", employees: [] }
		empSearch.value = ""
		loadAssignments()
	}
}

watch(
	() => employee.data?.company,
	(company) => {
		if (company) {
			loadShifts()
			loadEmployees()
		}
	},
	{ immediate: true }
)

watch(selectedShift, () => loadAssignments())
</script>
