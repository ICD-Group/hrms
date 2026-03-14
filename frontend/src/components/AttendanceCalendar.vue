<template>
	<div class="flex flex-col w-full gap-5" v-if="calendarEvents.data">
		<div class="text-lg text-gray-800 font-bold">{{ __("Attendance Calendar") }}</div>

		<div class="flex flex-col gap-6 bg-white py-6 px-3.5 rounded-lg border-none">
			<!-- Month Change -->
			<div class="flex flex-row justify-between items-center px-4">
				<Button
					icon="chevron-left"
					variant="ghost"
					@click="firstOfMonth = firstOfMonth.subtract(1, 'M')"
				/>
				<span class="text-lg text-gray-800 font-bold">
					{{ firstOfMonth.format("MMMM") }} {{ firstOfMonth.format("YYYY") }}
				</span>
				<Button
					icon="chevron-right"
					variant="ghost"
					@click="firstOfMonth = firstOfMonth.add(1, 'M')"
				/>
			</div>

			<!-- Calendar -->
			<div class="grid grid-cols-7 gap-y-3">
				<div
					v-for="day in DAYS"
					class="flex justify-center text-gray-600 text-sm font-medium leading-6"
				>
					{{ day }}
				</div>
				<div v-for="_ in firstOfMonth.get('d')" />
				<div v-for="index in firstOfMonth.endOf('M').get('D')">
					<div
						@click="onDayClick(index)"
						class="h-8 w-8 flex rounded-full mx-auto cursor-pointer active:scale-90 transition-transform"
						:class="[
							getEventOnDate(index) && colorMap[getEventOnDate(index)],
							selectedDate === getDateString(index) ? 'ring-2 ring-icd-500 ring-offset-1' : ''
						]"
					>
						<span class="text-gray-800 text-sm font-medium m-auto">
							{{ index }}
						</span>
					</div>
				</div>
			</div>

			<hr />

			<!-- Summary -->
			<div class="grid grid-cols-4 mx-2">
				<div v-for="status in summaryStatuses" class="flex flex-col gap-1">
					<div class="flex flex-row gap-1 items-center">
						<span class="rounded full h-3 w-3" :class="colorMap[status]" />
						<span class="text-gray-600 text-sm font-medium leading-5"> {{ __(status) }} </span>
					</div>
					<span class="text-gray-800 text-base font-semibold leading-6 mx-auto">
						{{ summary[status] || 0 }}
					</span>
				</div>
			</div>
			<!-- View Full History Link -->
			<div class="flex justify-center">
				<button @click="goToHistory" class="text-sm font-medium text-gray-500 active:text-gray-700 flex items-center gap-1">
					{{ __("View Full History") }}
					<span class="text-xs">&#x2192;</span>
				</button>
			</div>
		</div>

		<!-- Day Detail Bottom Sheet (teleported to body to escape ion-content containment) -->
		<DayDetailSheet
			:show="selectedDate !== null"
			:date="selectedDate"
			:status="selectedDate ? calendarEvents.data?.[selectedDate] : null"
			@close="selectedDate = null"
		/>
	</div>
</template>

<script setup>
import { computed, inject, ref, watch } from "vue"
import { createResource } from "frappe-ui"
import { useRouter } from "vue-router"
import DayDetailSheet from "./DayDetailSheet.vue"

const router = useRouter()
const dayjs = inject("$dayjs")
const employee = inject("$employee")
const __ = inject("$translate")
const firstOfMonth = ref(dayjs().date(1).startOf("D"))
const selectedDate = ref(null)

function goToHistory() {
	router.push({ name: "GeniusMyHistory" })
}

function getDateString(index) {
	return firstOfMonth.value.date(index).format("YYYY-MM-DD")
}

function onDayClick(index) {
	const dateStr = getDateString(index)
	selectedDate.value = selectedDate.value === dateStr ? null : dateStr
}

const colorMap = {
	Present: "bg-green-300",
	"Work From Home": "bg-green-300",
	"Half Day": "bg-yellow-200",
	Absent: "bg-red-200",
	"On Leave": "bg-icd-300",
	Holiday: "bg-gray-300",
}

// __("Present"), __("Half Day"), __("Absent"), __("On Leave"), __("Work From Home")
const summaryStatuses = ["Present", "Half Day", "Absent", "On Leave"]

const summary = computed(() => {
	const summary = {}

	for (const status of Object.values(calendarEvents.data)) {
		let updatedStatus = status === "Work From Home" ? "Present" : status
		if (updatedStatus in summary) {
			summary[updatedStatus] += 1
		} else {
			summary[updatedStatus] = 1
		}
	}

	return summary
})

watch(
	() => firstOfMonth.value,
	() => {
		selectedDate.value = null
		calendarEvents.fetch()
	}
)

const getEventOnDate = (date) => {
	return calendarEvents.data[firstOfMonth.value.date(date).format("YYYY-MM-DD")]
}

const getFirstLetter = (s) => Array.from(s.trim())[0] // Unicode

const DAYS = [
	getFirstLetter(__("Sunday")),
	getFirstLetter(__("Monday")),
	getFirstLetter(__("Tuesday")),
	getFirstLetter(__("Wednesday")),
	getFirstLetter(__("Thursday")),
	getFirstLetter(__("Friday")),
	getFirstLetter(__("Saturday")),
]

//resources
const calendarEvents = createResource({
	url: "hrms.api.get_attendance_calendar_events",
	auto: true,
	makeParams() {
		return {
			employee: employee.data.name,
			from_date: firstOfMonth.value.format("YYYY-MM-DD"),
			to_date: firstOfMonth.value.endOf("M").format("YYYY-MM-DD"),
		}
	},
})
</script>
