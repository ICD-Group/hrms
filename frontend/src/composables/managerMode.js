import { ref, computed } from "vue"
import { call } from "frappe-ui"

// Dynamic roles fetched from backend
const _managerRoles = ref([
	"HR Manager",
	"HR User",
	"System Manager",
	"Leave Approver",
	"Expense Approver",
])
let _rolesFetched = false

// Fetch manager roles from backend API (once)
async function fetchManagerRoles() {
	if (_rolesFetched) return
	try {
		const data = await call(
			"icd3s_attendance.icd3s_attendance.api.attendance.get_manager_roles"
		)
		if (Array.isArray(data) && data.length > 0) {
			_managerRoles.value = data
		}
		_rolesFetched = true
	} catch (e) {
		// Keep defaults on error - already set above
		console.warn("[managerMode] Could not fetch roles, using defaults", e)
	}
}

// Backward-compatible export: computed array that updates after fetch
export const MANAGER_ROLES = computed(() => _managerRoles.value)

// Start with false - only enable after role validation
const _isManagerMode = ref(false)
let _rolesValidated = false

function _hasManagerRole(roles) {
	return (
		Array.isArray(roles) &&
		_managerRoles.value.some((r) => roles.includes(r))
	)
}

export function hasManagerRole(roles) {
	return _hasManagerRole(roles)
}

export function useManagerMode() {
	const isManagerMode = computed({
		get: () => _isManagerMode.value,
		set: (val) => {
			_isManagerMode.value = val
			localStorage.setItem("hrms_manager_mode", val ? "1" : "0")
		},
	})

	function toggleManagerMode() {
		isManagerMode.value = !isManagerMode.value
	}

	/**
	 * Validate manager access against actual user roles.
	 * Must be called when user data becomes available.
	 * Returns true if user has manager role.
	 */
	function validateManagerAccess(userRoles) {
		// Fetch configured roles from backend (fire-and-forget, uses defaults until loaded)
		fetchManagerRoles()

		if (!_hasManagerRole(userRoles)) {
			// No manager role - force disable regardless of localStorage
			_isManagerMode.value = false
			localStorage.setItem("hrms_manager_mode", "0")
			return false
		}
		// Has manager role - restore saved preference (only once)
		// Default to Manager mode if no preference saved yet
		if (!_rolesValidated) {
			const saved = localStorage.getItem("hrms_manager_mode")
			_isManagerMode.value = saved === "1"
			_rolesValidated = true
		}
		return true
	}

	return {
		isManagerMode,
		toggleManagerMode,
		validateManagerAccess,
		fetchManagerRoles,
	}
}
