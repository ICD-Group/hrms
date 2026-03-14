<template>
	<ion-page>
		<div class="app-bg-ambient"></div>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<Button variant="ghost" class="!pl-0 hover:bg-white/50" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5" />
					</Button>
					<h2 class="text-lg font-bold text-gray-900">{{ __("Mark Attendance") }}</h2>
				</header>

				<div class="flex flex-col p-4 gap-4">
					<!-- Date Selector -->
					<div class="card-premium p-3">
						<label class="text-xs text-gray-700 mb-1 block">{{ __("Attendance Date") }}</label>
						<input
							v-model="selectedDate"
							type="date"
							:max="dayjs().format('YYYY-MM-DD')"
							class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-icd-400"
						/>
					</div>

					<!-- Bulk Actions -->
					<div class="flex gap-2">
						<button
							@click="markAll('Present')"
							class="flex-1 bg-green-50 border border-green-200 text-green-700 rounded-xl py-2 text-xs font-bold active:bg-green-100"
						>
							{{ __("All Present") }}
						</button>
						<button
							@click="markAll('Absent')"
							class="flex-1 bg-red-50 border border-red-200 text-red-700 rounded-xl py-2 text-xs font-bold active:bg-red-100"
						>
							{{ __("All Absent") }}
						</button>
						<button
							@click="clearAll"
							class="px-3 bg-gray-100 border border-gray-200 text-gray-600 rounded-xl py-2 text-xs font-bold active:bg-gray-100"
						>
							{{ __("Clear") }}
						</button>
					</div>

					<!-- Loading -->
					<div v-if="isLoading" class="flex items-center justify-center py-10">
						<LoadingIndicator class="w-8 h-8 text-gray-600" />
					</div>

					<!-- Employee List -->
					<div v-else class="flex flex-col gap-2">
						<div
							v-for="emp in employees"
							:key="emp.name"
							class="card-premium p-3 flex items-center gap-3"
						>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-semibold text-gray-900 truncate">{{ emp.employee_name }}</div>
								<div class="text-[11px] text-gray-600">{{ emp.department || "" }}</div>
								<div v-if="emp.existing_status" class="text-[11px] text-icd-600 font-medium mt-0.5">
									{{ __("Current") }}: {{ emp.existing_status }}
								</div>
							</div>
							<div class="flex gap-1">
								<button
									v-for="status in statuses"
									:key="status.value"
									@click="setStatus(emp, status.value)"
									class="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all"
									:class="emp.selected_status === status.value
										? status.activeClass
										: 'bg-gray-100 text-gray-600 border border-gray-100'"
									:title="status.label"
								>
									{{ status.abbr }}
								</button>
							</div>
						</div>
					</div>

					<!-- Submit Button -->
					<button
						v-if="!isLoading && hasChanges"
						@click="submitAttendance"
						:disabled="isSubmitting"
						class="w-full bg-icd-600 text-white rounded-xl py-3.5 font-bold text-sm active:bg-icd-700 disabled:opacity-50 sticky bottom-4"
					>
						<span v-if="isSubmitting">{{ __("Submitting...") }}</span>
						<span v-else>{{ __("Submit Attendance") }} ({{ changeCount }})</span>
					</button>
				</div>
			</div>

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
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, toast } from "frappe-ui"
import { useManagerApi } from "@/composables/managerApi"

const { getList, cancelDoc, insertDoc, submitDoc } = useManagerApi()

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

const selectedDate = ref(dayjs().format("YYYY-MM-DD"))
const isLoading = ref(true)
const isSubmitting = ref(false)
const showSuccess = ref(false)
const successMessage = ref("")
const employees = ref([])

const statuses = [
	{ value: "Present", abbr: "P", label: "Present", activeClass: "bg-green-500 text-white border border-green-500" },
	{ value: "Absent", abbr: "A", label: "Absent", activeClass: "bg-red-500 text-white border border-red-500" },
	{ value: "On Leave", abbr: "L", label: "On Leave", activeClass: "bg-orange-400 text-white border border-orange-400" },
	{ value: "Half Day", abbr: "H", label: "Half Day", activeClass: "bg-blue-400 text-white border border-blue-400" },
]

function setStatus(emp, status) {
	emp.selected_status = emp.selected_status === status ? null : status
}

function markAll(status) {
	for (const emp of employees.value) {
		emp.selected_status = status
	}
}

function clearAll() {
	for (const emp of employees.value) {
		emp.selected_status = null
	}
}

const hasChanges = computed(() => employees.value.some((e) => e.selected_status))

const changeCount = computed(() => employees.value.filter((e) => e.selected_status).length)

async function loadEmployees() {
	if (!employee.data?.company) return
	isLoading.value = true
	try {
		// Get all active employees
		const emps = await getList({
			doctype: "Employee",
			filters: { status: "Active", company: employee.data.company },
			fields: ["name", "employee_name", "department"],
			order_by: "employee_name asc",
			limit_page_length: 0,
		})

		// Get existing attendance for this date
		const existing = await getList({
			doctype: "Attendance",
			filters: {
				attendance_date: selectedDate.value,
				company: employee.data.company,
				docstatus: 1,
			},
			fields: ["employee", "status", "name"],
			limit_page_length: 0,
		})

		const existingMap = {}
		for (const att of (existing || [])) {
			existingMap[att.employee] = att.status
		}

		employees.value = (emps || []).map((e) => ({
			...e,
			existing_status: existingMap[e.name] || null,
			selected_status: null,
		}))
	} catch (e) {
		_errToast(e, "Failed to load employees")
		employees.value = []
	} finally {
		isLoading.value = false
	}
}

watch(
	() => employee.data?.company,
	(company) => {
		if (company) loadEmployees()
	},
	{ immediate: true }
)

watch(selectedDate, () => loadEmployees())

async function submitAttendance() {
	const toSubmit = employees.value.filter((e) => e.selected_status)
	if (toSubmit.length === 0) return

	isSubmitting.value = true
	let successCount = 0
	let errorCount = 0

	for (const emp of toSubmit) {
		try {
			if (emp.existing_status) {
				// Find and amend existing record
				const existing = await getList({
					doctype: "Attendance",
					filters: {
						employee: emp.name,
						attendance_date: selectedDate.value,
						docstatus: 1,
					},
					fields: ["name"],
					limit_page_length: 1,
				})
				if (existing && existing.length > 0) {
					await cancelDoc({
						doctype: "Attendance",
						name: existing[0].name,
					})
				}
			}

			// Create new attendance
			const doc = await insertDoc({
				doc: {
					doctype: "Attendance",
					employee: emp.name,
					attendance_date: selectedDate.value,
					status: emp.selected_status,
					company: employee.data.company,
				},
			})

			// Submit it
			await submitDoc({
				doc: { doctype: "Attendance", name: doc.name },
			})

			successCount++
		} catch (e) {
			_errToast(e, `Failed to mark attendance for ${emp.employee_name}`)
			errorCount++
		}
	}

	isSubmitting.value = false

	if (successCount > 0) {
		successMessage.value = `${successCount} ${__("attendance records saved")}${errorCount > 0 ? `, ${errorCount} ${__("errors")}` : ""}`
		showSuccess.value = true
		setTimeout(() => { showSuccess.value = false }, 3000)
		loadEmployees()
	}
}
</script>
