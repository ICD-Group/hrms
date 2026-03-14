<template>
	<ion-page>
		<div class="app-bg-ambient"></div>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<Button variant="ghost" class="!pl-0 hover:bg-white/50" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5" />
					</Button>
					<h2 class="text-lg font-bold text-gray-900">{{ __("Monthly Attendance") }}</h2>
				</header>

				<div class="flex flex-col p-4 gap-4">
					<!-- Month Selector -->
					<div class="flex items-center gap-3 card-premium p-3">
						<button @click="changeMonth(-1)" class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:bg-gray-200">
							<FeatherIcon name="chevron-left" class="w-4 text-gray-600" />
						</button>
						<div class="flex-1 text-center">
							<div class="text-sm font-bold text-gray-900">{{ dayjs(selectedMonth).format("MMMM YYYY") }}</div>
						</div>
						<button @click="changeMonth(1)" class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:bg-gray-200" :disabled="isCurrentMonth">
							<FeatherIcon name="chevron-right" class="w-4 text-gray-600" :class="isCurrentMonth ? 'opacity-30' : ''" />
						</button>
					</div>

					<!-- Summary -->
					<div class="grid grid-cols-4 gap-2">
						<div class="bg-green-50 rounded-xl p-2.5 text-center border border-green-100">
							<div class="text-lg font-bold text-green-700">{{ summary.present }}</div>
							<div class="text-[11px] text-green-600 font-medium">{{ __("Present") }}</div>
						</div>
						<div class="bg-red-50 rounded-xl p-2.5 text-center border border-red-100">
							<div class="text-lg font-bold text-red-700">{{ summary.absent }}</div>
							<div class="text-[11px] text-red-600 font-medium">{{ __("Absent") }}</div>
						</div>
						<div class="bg-orange-50 rounded-xl p-2.5 text-center border border-orange-100">
							<div class="text-lg font-bold text-orange-700">{{ summary.leave }}</div>
							<div class="text-[11px] text-orange-600 font-medium">{{ __("Leave") }}</div>
						</div>
						<div class="bg-blue-50 rounded-xl p-2.5 text-center border border-blue-100">
							<div class="text-lg font-bold text-blue-700">{{ summary.half_day }}</div>
							<div class="text-[11px] text-blue-600 font-medium">{{ __("Half Day") }}</div>
						</div>
					</div>

					<!-- Employee Filter -->
					<div class="relative">
						<FeatherIcon name="search" class="w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
						<input
							v-model="searchQuery"
							type="text"
							:placeholder="__('Filter by employee...')"
							class="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-icd-400 bg-white"
						/>
					</div>

					<!-- Loading -->
					<div v-if="isLoading" class="flex items-center justify-center py-10">
						<LoadingIndicator class="w-8 h-8 text-gray-600" />
					</div>

					<!-- Grid View -->
					<div v-else-if="filteredEmployees.length === 0" class="text-center py-10 text-sm text-gray-700">
						{{ __("No attendance records for this month") }}
					</div>

					<div v-else class="flex flex-col gap-3">
						<div
							v-for="emp in filteredEmployees"
							:key="emp.employee"
							class="card-premium p-3"
						>
							<div class="flex items-center justify-between mb-2">
								<div class="text-sm font-semibold text-gray-900">{{ emp.employee_name }}</div>
								<div class="text-[11px] text-gray-600">
									{{ emp.present }}/{{ daysInMonth }} {{ __("days") }}
								</div>
							</div>

							<!-- Attendance Grid (calendar-like) -->
							<div class="grid grid-cols-7 gap-0.5">
								<!-- Day headers -->
								<div v-for="d in ['S','M','T','W','T','F','S']" :key="d" class="text-[8px] text-center text-gray-600 font-medium py-0.5">
									{{ d }}
								</div>
								<!-- Empty cells for offset -->
								<div v-for="i in firstDayOffset" :key="'empty-'+i"></div>
								<!-- Day cells -->
								<div
									v-for="day in daysInMonth"
									:key="day"
									class="w-full aspect-square rounded-md flex items-center justify-center text-[11px] font-bold"
									:class="getDayCellClass(emp, day)"
									:title="getDayTooltip(emp, day)"
								>
									{{ day }}
								</div>
							</div>

							<!-- Legend -->
							<div class="flex gap-3 mt-2 flex-wrap">
								<span class="flex items-center gap-1 text-[11px] text-gray-700">
									<span class="w-2 h-2 rounded-full bg-green-500"></span> {{ __("Present") }}
								</span>
								<span class="flex items-center gap-1 text-[11px] text-gray-700">
									<span class="w-2 h-2 rounded-full bg-red-500"></span> {{ __("Absent") }}
								</span>
								<span class="flex items-center gap-1 text-[11px] text-gray-700">
									<span class="w-2 h-2 rounded-full bg-orange-400"></span> {{ __("Leave") }}
								</span>
								<span class="flex items-center gap-1 text-[11px] text-gray-700">
									<span class="w-2 h-2 rounded-full bg-blue-400"></span> {{ __("Half Day") }}
								</span>
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
const dayjs = inject("$dayjs")

function _errToast(e, fallback = "Operation failed") {
	let msg = fallback
	try {
		if (e?.messages?.[0]) msg = JSON.parse(e.messages[0]).message || e.message || fallback
		else if (e?.message) msg = e.message
	} catch (_) {}
	toast({ title: __(msg), icon: "alert-circle", position: "bottom-center", iconClasses: "text-red-500" })
}

const selectedMonth = ref(dayjs().startOf("month").format("YYYY-MM-DD"))
const searchQuery = ref("")
const isLoading = ref(true)
const attendanceData = ref([])

const isCurrentMonth = computed(() => dayjs(selectedMonth.value).isSame(dayjs(), "month"))

const daysInMonth = computed(() => dayjs(selectedMonth.value).daysInMonth())

const firstDayOffset = computed(() => dayjs(selectedMonth.value).startOf("month").day())

function changeMonth(offset) {
	const d = dayjs(selectedMonth.value).add(offset, "month")
	if (d.isAfter(dayjs(), "month")) return
	selectedMonth.value = d.startOf("month").format("YYYY-MM-DD")
}

function getDayCellClass(emp, day) {
	const dateStr = dayjs(selectedMonth.value).date(day).format("YYYY-MM-DD")
	const record = emp.days[dateStr]
	if (!record) return "bg-gray-100 text-gray-700"
	if (record === "Present") return "bg-green-500 text-white"
	if (record === "Absent") return "bg-red-500 text-white"
	if (record === "On Leave") return "bg-orange-400 text-white"
	if (record === "Half Day") return "bg-blue-400 text-white"
	return "bg-gray-100 text-gray-700"
}

function getDayTooltip(emp, day) {
	const dateStr = dayjs(selectedMonth.value).date(day).format("YYYY-MM-DD")
	return emp.days[dateStr] || "No record"
}

async function loadMonthlyAttendance() {
	if (!employee.data?.company) return
	isLoading.value = true
	try {
		const startDate = dayjs(selectedMonth.value).startOf("month").format("YYYY-MM-DD")
		const endDate = dayjs(selectedMonth.value).endOf("month").format("YYYY-MM-DD")

		const data = await getList({
			doctype: "Attendance",
			filters: {
				attendance_date: ["between", [startDate, endDate]],
				company: employee.data.company,
				docstatus: 1,
			},
			fields: ["employee", "employee_name", "attendance_date", "status", "department"],
			order_by: "employee_name asc, attendance_date asc",
			limit_page_length: 0,
		})

		// Group by employee
		const empMap = {}
		for (const rec of (data || [])) {
			if (!empMap[rec.employee]) {
				empMap[rec.employee] = {
					employee: rec.employee,
					employee_name: rec.employee_name,
					department: rec.department || "",
					days: {},
					present: 0,
					absent: 0,
					leave: 0,
					half_day: 0,
				}
			}
			empMap[rec.employee].days[rec.attendance_date] = rec.status
			if (rec.status === "Present") empMap[rec.employee].present++
			else if (rec.status === "Absent") empMap[rec.employee].absent++
			else if (rec.status === "On Leave") empMap[rec.employee].leave++
			else if (rec.status === "Half Day") empMap[rec.employee].half_day++
		}

		attendanceData.value = Object.values(empMap)
	} catch (e) {
		_errToast(e, "Failed to load monthly attendance")
		attendanceData.value = []
	} finally {
		isLoading.value = false
	}
}

watch(
	() => employee.data?.company,
	(company) => {
		if (company) loadMonthlyAttendance()
	},
	{ immediate: true }
)

watch(selectedMonth, () => loadMonthlyAttendance())

const summary = computed(() => {
	let present = 0, absent = 0, leave = 0, half_day = 0
	for (const emp of attendanceData.value) {
		present += emp.present
		absent += emp.absent
		leave += emp.leave
		half_day += emp.half_day
	}
	return { present, absent, leave, half_day }
})

const filteredEmployees = computed(() => {
	if (!searchQuery.value) return attendanceData.value
	const q = searchQuery.value.toLowerCase()
	return attendanceData.value.filter(
		(e) => e.employee_name.toLowerCase().includes(q)
	)
})
</script>
