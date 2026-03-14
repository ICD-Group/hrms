import { ref, reactive, watch, inject } from "vue"
import { call } from "frappe-ui"

const API = "icd3s_attendance.icd3s_attendance.api.attendance"

export function useReportFilters(opts = {}) {
	const dayjs = inject("$dayjs")
	const __ = inject("$translate")

	const defaultPreset = opts.defaultPreset || "month"
	const useMonthYear = opts.useMonthYear || false

	const activePreset = ref(defaultPreset)
	const departmentList = ref([])
	const employeeSearch = ref("")
	const employeeSuggestions = ref([])
	let searchTimer = null

	const now = dayjs()
	const filters = reactive({
		from_date: now.startOf("month").format("YYYY-MM-DD"),
		to_date: now.format("YYYY-MM-DD"),
		department: "",
		employee: "",
		...(useMonthYear ? { month: now.month() + 1, year: now.year() } : {}),
	})

	const datePresets = [
		{ key: "today", label: __("Today") },
		{ key: "yesterday", label: __("Yesterday") },
		{ key: "week", label: __("This Week") },
		{ key: "month", label: __("This Month") },
		{ key: "lastmonth", label: __("Last Month") },
		{ key: "custom", label: __("Custom") },
	]

	function applyPreset(p, autoLoad) {
		activePreset.value = p.key
		const n = dayjs()
		switch (p.key) {
			case "today":
				filters.from_date = n.format("YYYY-MM-DD")
				filters.to_date = n.format("YYYY-MM-DD")
				break
			case "yesterday":
				filters.from_date = n.subtract(1, "day").format("YYYY-MM-DD")
				filters.to_date = n.subtract(1, "day").format("YYYY-MM-DD")
				break
			case "week":
				filters.from_date = n.startOf("week").format("YYYY-MM-DD")
				filters.to_date = n.format("YYYY-MM-DD")
				break
			case "month":
				filters.from_date = n.startOf("month").format("YYYY-MM-DD")
				filters.to_date = n.format("YYYY-MM-DD")
				break
			case "lastmonth":
				filters.from_date = n.subtract(1, "month").startOf("month").format("YYYY-MM-DD")
				filters.to_date = n.subtract(1, "month").endOf("month").format("YYYY-MM-DD")
				break
			case "custom":
				return
		}
		if (autoLoad) autoLoad()
	}

	function clearFilters(autoLoad) {
		filters.department = ""
		filters.employee = ""
		employeeSearch.value = ""
		activePreset.value = "month"
		const n = dayjs()
		filters.from_date = n.startOf("month").format("YYYY-MM-DD")
		filters.to_date = n.format("YYYY-MM-DD")
		if (useMonthYear) {
			filters.month = n.month() + 1
			filters.year = n.year()
		}
		if (autoLoad) autoLoad()
	}

	function selectEmployee(emp, autoLoad) {
		filters.employee = emp.name
		employeeSearch.value = emp.employee_name
		employeeSuggestions.value = []
		if (autoLoad) autoLoad()
	}

	watch(employeeSearch, (val) => {
		if (searchTimer) clearTimeout(searchTimer)
		if (!val || val.length < 2) {
			employeeSuggestions.value = []
			if (!val) filters.employee = ""
			return
		}
		if (filters.employee) return
		searchTimer = setTimeout(async () => {
			try {
				const emps = await call(`${API}.manager_get_list`, {
					doctype: "Employee",
					filters: { status: "Active", employee_name: ["like", `%${val}%`] },
					fields: ["name", "employee_name", "department"],
					limit_page_length: 5,
				})
				employeeSuggestions.value = emps || []
			} catch (e) { employeeSuggestions.value = [] }
		}, 300)
	})

	async function loadDepartments() {
		try {
			const deps = await call(`${API}.manager_get_list`, {
				doctype: "Department",
				filters: { is_group: 0 },
				fields: ["name"],
				limit_page_length: 0,
			})
			departmentList.value = (deps || []).map(d => d.name)
		} catch (e) {
			console.warn("Failed to load departments:", e)
		}
	}

	return {
		filters,
		activePreset,
		datePresets,
		departmentList,
		employeeSearch,
		employeeSuggestions,
		applyPreset,
		clearFilters,
		selectEmployee,
		loadDepartments,
	}
}
