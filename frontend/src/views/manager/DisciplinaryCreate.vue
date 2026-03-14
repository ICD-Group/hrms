<template>
	<ion-page>
		<div class="app-bg-ambient"></div>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 -ml-1" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5 text-gray-700" />
					</button>
					<h2 class="text-lg font-bold text-gray-900 ml-1">{{ isEdit ? __("Edit Disciplinary Action") : __("New Disciplinary Action") }}</h2>
				</header>

				<div class="flex flex-col p-4 gap-4">

					<!-- Egypt Law Banner -->
					<div class="card-premium p-3 flex items-center gap-2">
						<span class="text-lg">&#x1F6E1;</span>
						<div>
							<div class="text-xs font-bold text-gray-800">{{ __("Egypt Labor Law 14/2025") }}</div>
							<div class="text-[11px] text-gray-700">{{ __("Art. 64: Investigation & defense mandatory") }}</div>
						</div>
					</div>

					<!-- Employee Selection -->
					<div class="card-premium p-3">
						<label class="text-xs text-gray-700 mb-2 block font-semibold">{{ __("Employee") }} *</label>

						<!-- Selected Employee -->
						<div v-if="selectedEmployee" class="flex items-center gap-3 p-2.5 bg-icd-50 rounded-xl border border-icd-200 mb-2">
							<div class="w-9 h-9 rounded-full bg-icd-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
								{{ selectedEmployee.employee_name?.[0] || '?' }}
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-semibold text-gray-900 truncate">{{ selectedEmployee.employee_name }}</div>
								<div class="text-[11px] text-gray-700">{{ selectedEmployee.name }} - {{ selectedEmployee.department || '' }}</div>
							</div>
							<button v-if="!isEdit" @click="clearEmployee" class="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center active:bg-gray-100">
								<FeatherIcon name="x" class="w-3.5 h-3.5 text-gray-700" />
							</button>
						</div>

						<!-- Employee Search -->
						<div v-else>
							<div class="relative mb-2">
								<FeatherIcon name="search" class="w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
								<input
									v-model="empSearch"
									type="text"
									:placeholder="__('Search employee name...')"
									class="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-icd-400 focus:ring-1 focus:ring-icd-200"
								/>
							</div>
							<div v-if="empLoading" class="flex items-center justify-center py-4">
								<LoadingIndicator class="w-5 h-5 text-gray-600" />
							</div>
							<div v-else class="max-h-48 overflow-y-auto flex flex-col gap-0.5">
								<button
									v-for="emp in filteredEmployees"
									:key="emp.name"
									@click="selectEmployee(emp)"
									class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-100 active:bg-gray-100 text-left w-full transition-colors"
								>
									<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
										{{ emp.employee_name?.[0] || '?' }}
									</div>
									<div class="flex-1 min-w-0">
										<div class="text-sm font-medium text-gray-800 truncate">{{ emp.employee_name }}</div>
										<div class="text-[11px] text-gray-600 truncate">{{ emp.name }} - {{ emp.department || emp.designation || '' }}</div>
									</div>
								</button>
								<div v-if="filteredEmployees.length === 0" class="text-xs text-gray-600 py-3 text-center">
									{{ empSearch ? __("No employees match") : __("Type to search...") }}
								</div>
							</div>
						</div>
					</div>

					<!-- Incident Date -->
					<div class="card-premium p-3">
						<label class="text-xs text-gray-700 mb-1 block font-semibold">{{ __("Incident Date") }} *</label>
						<input type="date" v-model="form.incident_date"
							class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-icd-400" />
					</div>

					<!-- Action Type -->
					<div class="card-premium p-3">
						<label class="text-xs text-gray-700 mb-1 block font-semibold">{{ __("Action Type") }} *</label>
						<div v-if="typesLoading" class="flex items-center justify-center py-3">
							<LoadingIndicator class="w-5 h-5 text-gray-600" />
						</div>
						<div v-else class="flex gap-2 flex-wrap">
							<button
								v-for="t in actionTypes"
								:key="t.name"
								@click="form.action_type = t.name; form.severity = t.default_severity || form.severity"
								class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
								:class="form.action_type === t.name
									? 'bg-icd-600 text-white'
									: 'bg-gray-100 text-gray-600 active:bg-gray-200'"
							>{{ t.type_name }}</button>
						</div>
					</div>

					<!-- Severity -->
					<div class="card-premium p-3">
						<label class="text-xs text-gray-700 mb-2 block font-semibold">{{ __("Severity") }} *</label>
						<div class="grid grid-cols-4 gap-2">
							<button v-for="sev in severities" :key="sev.value"
								@click="form.severity = sev.value"
								class="p-2.5 text-xs font-bold rounded-xl text-center transition-all"
								:class="form.severity === sev.value
									? sev.active
									: 'bg-gray-100 text-gray-600 border border-gray-100'"
							>{{ sev.value }}</button>
						</div>
					</div>

					<!-- Description -->
					<div class="card-premium p-3">
						<label class="text-xs text-gray-700 mb-1 block font-semibold">{{ __("Incident Description") }} *</label>
						<textarea v-model="form.description" :placeholder="__('Describe what happened...')"
							class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-icd-400 resize-none"
							rows="4"></textarea>
					</div>

					<!-- Penalty Type -->
					<div class="card-premium p-3">
						<label class="text-xs text-gray-700 mb-1 block font-semibold">{{ __("Penalty Type") }}</label>
						<select v-model="form.penalty_type"
							class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-icd-400 bg-white">
							<option value="">{{ __("Select penalty...") }}</option>
							<option v-for="p in penaltyOptions" :key="p" :value="p">{{ p }}</option>
						</select>
					</div>

					<!-- Deduction Days -->
					<div v-if="form.penalty_type === 'Salary Deduction'" class="card-premium p-3">
						<label class="text-xs text-gray-700 mb-1 block font-semibold">{{ __("Deduction Days") }} <span class="text-[11px] text-gray-600">({{ __("max 5 per Art. 61") }})</span></label>
						<input type="number" v-model="form.deduction_days" min="0.5" max="5" step="0.5"
							class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-icd-400" />
					</div>

					<!-- Investigation Required (create only) -->
					<div v-if="!isEdit" class="card-premium p-3">
						<label class="flex items-center gap-3 cursor-pointer">
							<input type="checkbox" v-model="form.investigation_required" class="rounded text-icd-600 w-5 h-5" />
							<div>
								<div class="text-sm font-medium text-gray-800">{{ __("Investigation Required") }}</div>
								<div class="text-[11px] text-gray-600">{{ __("Art. 148: Max 3 months investigation period") }}</div>
							</div>
						</label>
					</div>

					<!-- Submit -->
					<button @click="submitAction" :disabled="creating || !isValid"
						class="premium-submit">
						{{ creating ? __("Saving...") : (isEdit ? __("Update Action") : __("Create & Submit")) }}
					</button>

					<div class="h-8"></div>
				</div>
			</div>

			<!-- Success Toast -->
			<div v-if="showSuccess" class="fixed bottom-6 left-4 right-4 bg-green-600 text-white rounded-xl p-4 text-center text-sm font-bold z-50 shadow-lg">
				{{ successMsg }}
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, reactive, computed, inject, watch, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, call, toast } from "frappe-ui"
import { useManagerApi } from "@/composables/managerApi"

const { getList } = useManagerApi()

const __ = inject("$translate")
const employee = inject("$employee")
const router = useRouter()
const route = useRoute()

const API_BASE = "icd3s_attendance.icd3s_attendance.api.attendance"

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

// Edit mode
const isEdit = computed(() => route.name === "ManagerDisciplinaryEdit" && !!route.params.id)
const editLoading = ref(false)

// Employee picker
const empSearch = ref("")
const empLoading = ref(false)
const allEmployees = ref([])
const selectedEmployee = ref(null)

// Action types
const actionTypes = ref([])
const typesLoading = ref(true)

// Form
const form = reactive({
	incident_date: new Date().toISOString().split("T")[0],
	action_type: "",
	severity: "Minor",
	description: "",
	penalty_type: "",
	deduction_days: 1,
	investigation_required: false,
})

const creating = ref(false)
const showSuccess = ref(false)
const successMsg = ref("")

const severities = [
	{ value: "Minor", active: "bg-yellow-100 text-yellow-700 border border-yellow-300 ring-1 ring-yellow-200" },
	{ value: "Moderate", active: "bg-orange-100 text-orange-700 border border-orange-300 ring-1 ring-orange-200" },
	{ value: "Major", active: "bg-red-100 text-red-700 border border-red-300 ring-1 ring-red-200" },
	{ value: "Critical", active: "bg-red-200 text-red-800 border border-red-400 ring-1 ring-red-300" },
]

const penaltyOptions = [
	"Warning", "Salary Deduction", "Defer Increment", "Reduce Increment",
	"Postpone Promotion", "Reduce Salary", "Demotion", "Dismissal",
]

const isValid = computed(() => {
	return selectedEmployee.value && form.incident_date &&
		form.action_type && form.severity && form.description.trim()
})

const filteredEmployees = computed(() => {
	if (!empSearch.value.trim()) return allEmployees.value.slice(0, 20)
	const q = empSearch.value.toLowerCase()
	return allEmployees.value.filter(e =>
		(e.employee_name || "").toLowerCase().includes(q) ||
		(e.name || "").toLowerCase().includes(q) ||
		(e.department || "").toLowerCase().includes(q)
	).slice(0, 20)
})

function selectEmployee(emp) {
	selectedEmployee.value = emp
	empSearch.value = ""
}

function clearEmployee() {
	selectedEmployee.value = null
	empSearch.value = ""
}

async function loadEmployees() {
	if (!employee.data?.company) return
	empLoading.value = true
	try {
		const data = await getList({
			doctype: "Employee",
			filters: { status: "Active", company: employee.data.company },
			fields: ["name", "employee_name", "department", "designation"],
			order_by: "employee_name asc",
			limit_page_length: 0,
		})
		allEmployees.value = data || []
	} catch (e) {
		_errToast(e, "Failed to load employees")
	} finally {
		empLoading.value = false
	}
}

async function loadTypes() {
	typesLoading.value = true
	try {
		const res = await call(`${API_BASE}.get_action_types`)
		actionTypes.value = res?.types || []
	} catch (e) {
		_errToast(e, "Failed to load action types")
	} finally {
		typesLoading.value = false
	}
}

async function submitAction() {
	if (!isValid.value || creating.value) return
	creating.value = true
	try {
		if (isEdit.value) {
			// Update existing action
			await call(`${API_BASE}.manager_update_action`, {
				action_name: route.params.id,
				fields_dict: JSON.stringify({
					incident_date: form.incident_date,
					action_type: form.action_type,
					severity: form.severity,
					description: form.description,
					penalty_type: form.penalty_type || "",
					deduction_days: form.penalty_type === "Salary Deduction" ? form.deduction_days : 0,
					policy_violated: form.policy_violated || "",
				}),
			})
			successMsg.value = __("Disciplinary action updated")
		} else {
			// Create new action
			const res = await call(`${API_BASE}.manager_create_action`, {
				employee: selectedEmployee.value.name,
				incident_date: form.incident_date,
				action_type: form.action_type,
				severity: form.severity,
				description: form.description,
				penalty_type: form.penalty_type || null,
				deduction_days: form.penalty_type === "Salary Deduction" ? form.deduction_days : null,
				investigation_required: form.investigation_required ? 1 : 0,
			})
			successMsg.value = __("Disciplinary action created: {0}", [res?.name || ""])
		}
		showSuccess.value = true
		setTimeout(() => {
			showSuccess.value = false
			router.back()
		}, 2000)
	} catch (e) {
		_errToast(e, "Failed to save disciplinary action")
	} finally {
		creating.value = false
	}
}

async function loadExisting() {
	if (!isEdit.value) return
	editLoading.value = true
	try {
		const res = await call(`${API_BASE}.get_disciplinary_detail`, {
			action_name: route.params.id,
		})
		if (res) {
			// Set employee
			selectedEmployee.value = {
				name: res.employee,
				employee_name: res.employee_name,
				department: res.department,
				designation: res.designation,
			}
			// Fill form
			form.incident_date = res.incident_date || ""
			form.action_type = res.action_type || ""
			form.severity = res.severity || "Minor"
			form.description = res.description || ""
			form.penalty_type = res.penalty_type || ""
			form.deduction_days = res.deduction_days || 1
			form.investigation_required = !!res.investigation_required
		}
	} catch (e) {
		_errToast(e, "Failed to load existing action")
	} finally {
		editLoading.value = false
	}
}

watch(() => employee.data?.company, (c) => {
	if (c) {
		loadEmployees()
		loadTypes()
	}
}, { immediate: true })

onMounted(() => {
	if (isEdit.value) loadExisting()
})
</script>
