import { call } from "frappe-ui"

const API = "icd3s_attendance.icd3s_attendance.api.attendance"

export function useManagerApi() {
	async function getList(params) {
		return call(`${API}.manager_get_list`, params)
	}

	async function getCount(params) {
		return call(`${API}.manager_get_count`, params)
	}

	async function getDoc(params) {
		return call(`${API}.manager_get`, params)
	}

	async function setValue(params) {
		return call(`${API}.manager_set_value`, params)
	}

	async function insertDoc(params) {
		return call(`${API}.manager_insert`, params)
	}

	async function submitDoc(params) {
		return call(`${API}.manager_submit`, params)
	}

	async function cancelDoc(params) {
		return call(`${API}.manager_cancel`, params)
	}

	return {
		getList,
		getCount,
		getDoc,
		setValue,
		insertDoc,
		submitDoc,
		cancelDoc,
	}
}
