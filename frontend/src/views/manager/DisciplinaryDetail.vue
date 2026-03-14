<template>
	<ion-page>
		<div class="app-bg-ambient"></div>
		<ion-content class="ion-padding">
			<div class="flex flex-col min-h-full w-full">
				<!-- Header -->
				<header class="flex items-center glass-header px-4 py-2.5 sticky top-0 z-10">
					<button class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 -ml-1" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5 text-gray-700" />
					</button>
					<div class="ml-2 min-w-0 flex-1">
						<h2 class="text-base font-bold text-gray-900 truncate">{{ doc?.name || route.params.id }}</h2>
						<span v-if="doc" class="mdd-status-badge" :class="statusClass(doc.status)">{{ doc.status }}</span>
					</div>
					<!-- Edit / Delete -->
					<div v-if="doc && canEdit" class="flex items-center gap-1.5 ml-2">
						<button @click="editMode = !editMode"
							class="w-8 h-8 flex items-center justify-center rounded-full bg-icd-50 active:bg-icd-100">
							<FeatherIcon :name="editMode ? 'x' : 'edit-2'" class="w-4 h-4 text-icd-600" />
						</button>
						<button @click="showDeleteConfirm = true"
							class="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 active:bg-red-100">
							<FeatherIcon name="trash-2" class="w-4 h-4 text-red-500" />
						</button>
					</div>
				</header>

				<!-- Loading -->
				<div v-if="loading" class="flex items-center justify-center py-20">
					<LoadingIndicator class="w-8 h-8 text-gray-600" />
				</div>

				<div v-else-if="doc" class="flex flex-col p-4 gap-3 mb-20">

					<!-- Employee Card -->
					<div class="card-premium p-4">
						<div class="flex items-center gap-3">
							<div class="mdd-avatar" :style="{ background: avatarColor(doc.employee_name) }">
								{{ initials(doc.employee_name) }}
							</div>
							<div class="min-w-0 flex-1">
								<div class="text-base font-bold text-gray-900">{{ doc.employee_name }}</div>
								<div class="text-xs text-gray-700">{{ doc.designation || '' }}</div>
								<div class="flex items-center gap-3 mt-1">
									<span class="text-[11px] text-gray-600">{{ doc.department }}</span>
									<span class="text-[11px] text-gray-600 font-mono">{{ doc.employee }}</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Violation Section -->
					<div class="card-premium p-4">
						<div class="mdd-section-label">{{ __("Violation") }}</div>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div v-if="!editMode" class="text-sm font-bold text-gray-900">{{ doc.action_type }}</div>
								<div v-if="!editMode" class="text-xs text-gray-700 mt-1">{{ doc.incident_date }}</div>
								<!-- Edit mode fields -->
								<div v-if="editMode" class="flex flex-col gap-2 w-full">
									<input v-model="editData.action_type" class="mdd-input" :placeholder="__('Action Type')" />
									<input v-model="editData.incident_date" type="date" class="mdd-input" />
								</div>
							</div>
							<div class="text-right flex-shrink-0 ml-3">
								<div v-if="!editMode" class="mdd-severity-badge" :class="severityClass(doc.severity)">{{ doc.severity }}</div>
								<select v-else v-model="editData.severity" class="mdd-input text-xs w-24">
									<option v-for="s in ['Minor','Moderate','Major','Critical']" :key="s" :value="s">{{ s }}</option>
								</select>
								<div v-if="doc.progressive_level" class="text-[11px] text-gray-700 mt-1">{{ doc.progressive_level }}</div>
							</div>
						</div>
						<div v-if="!editMode && doc.description" class="text-sm text-gray-600 mt-3 leading-relaxed">{{ doc.description }}</div>
						<textarea v-if="editMode" v-model="editData.description" class="mdd-input mt-2" rows="3" :placeholder="__('Description')"></textarea>
						<div v-if="!editMode && doc.policy_violated" class="text-xs text-gray-700 mt-2 italic">{{ __("Policy") }}: {{ doc.policy_violated }}</div>
						<input v-if="editMode" v-model="editData.policy_violated" class="mdd-input mt-2" :placeholder="__('Policy Violated')" />

						<!-- Save/Cancel for edit -->
						<div v-if="editMode" class="flex gap-2 mt-3">
							<button @click="editMode = false" class="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2 text-xs font-bold">{{ __("Cancel") }}</button>
							<button @click="saveEdit()" :disabled="saving" class="flex-1 bg-icd-600 text-white rounded-xl py-2 text-xs font-bold disabled:opacity-50">
								{{ saving ? __("Saving...") : __("Save") }}
							</button>
						</div>
					</div>

					<!-- Penalty Section -->
					<div v-if="doc.penalty_type" class="card-premium p-4">
						<div class="mdd-section-label">{{ __("Penalty") }}</div>
						<div class="flex items-center justify-between">
							<div class="text-sm font-bold text-red-700">{{ doc.penalty_type }}</div>
							<div v-if="doc.deduction_days > 0" class="text-right">
								<div class="text-xl font-black text-red-600">{{ doc.deduction_days }}<span class="text-xs">d</span></div>
								<div v-if="doc.deduction_amount > 0" class="text-[11px] text-gray-700">{{ doc.deduction_amount }} EGP</div>
							</div>
							<div v-else-if="doc.suspension_days > 0" class="text-right">
								<div class="text-xl font-black text-orange-600">{{ doc.suspension_days }}<span class="text-xs">d</span></div>
								<div class="text-[11px] text-gray-700">{{ __("Suspension") }}</div>
							</div>
						</div>
						<div v-if="doc.penalty_details" class="text-xs text-gray-600 mt-2">{{ doc.penalty_details }}</div>
						<div v-if="doc.penalty_start_date" class="flex gap-4 mt-2 text-xs text-gray-700">
							<span>{{ __("From") }}: {{ doc.penalty_start_date }}</span>
							<span v-if="doc.penalty_end_date">{{ __("To") }}: {{ doc.penalty_end_date }}</span>
						</div>
					</div>

					<!-- Investigation Section -->
					<div v-if="doc.investigation_required" class="card-premium p-4">
						<div class="mdd-section-label">{{ __("Investigation") }}</div>
						<div class="flex flex-col gap-2 text-xs text-gray-600">
							<div v-if="doc.investigation_deadline" class="flex justify-between">
								<span>{{ __("Deadline") }}</span>
								<span class="font-semibold">{{ doc.investigation_deadline }}</span>
							</div>
							<div v-if="doc.investigation_completed_date" class="flex justify-between">
								<span>{{ __("Completed") }}</span>
								<span class="font-semibold text-green-600">{{ doc.investigation_completed_date }}</span>
							</div>
							<div v-if="doc.investigation_findings" class="mt-1">
								<div class="text-[11px] font-bold text-gray-600 uppercase mb-1">{{ __("Findings") }}</div>
								<p class="text-sm text-gray-700">{{ doc.investigation_findings }}</p>
							</div>
						</div>
					</div>

					<!-- Employee Defense Section -->
					<div class="card-premium p-4">
						<div class="mdd-section-label">{{ __("Employee Defense") }}</div>
						<div v-if="doc.employee_defense">
							<p class="text-sm text-gray-700 leading-relaxed">{{ doc.employee_defense }}</p>
							<div class="text-[11px] text-gray-600 mt-2">{{ __("Submitted") }}: {{ doc.employee_defense_date }}</div>
						</div>
						<div v-else class="text-xs text-gray-600 italic">{{ __("Not submitted yet") }}</div>
					</div>

					<!-- Approval Timeline -->
					<div v-if="doc.hr_reviewed_by || doc.ceo_reviewed_by" class="card-premium p-4">
						<div class="mdd-section-label">{{ __("Approval History") }}</div>
						<div class="flex flex-col gap-3">
							<!-- HR Review -->
							<div v-if="doc.hr_reviewed_by" class="flex items-start gap-3">
								<div class="mdd-timeline-dot bg-blue-500">
									<FeatherIcon name="check" class="w-3 h-3 text-white" />
								</div>
								<div>
									<div class="text-xs font-bold text-gray-900">{{ __("HR Review") }}</div>
									<div class="text-[11px] text-gray-700">{{ doc.hr_reviewed_by }} &middot; {{ doc.hr_reviewed_on }}</div>
									<div v-if="doc.hr_notes" class="text-xs text-gray-600 mt-1 bg-blue-50 rounded-lg px-2.5 py-1.5">{{ doc.hr_notes }}</div>
								</div>
							</div>
							<!-- CEO Review -->
							<div v-if="doc.ceo_reviewed_by" class="flex items-start gap-3">
								<div class="mdd-timeline-dot bg-purple-500">
									<FeatherIcon name="check" class="w-3 h-3 text-white" />
								</div>
								<div>
									<div class="text-xs font-bold text-gray-900">{{ __("CEO Review") }}</div>
									<div class="text-[11px] text-gray-700">{{ doc.ceo_reviewed_by }} &middot; {{ doc.ceo_reviewed_on }}</div>
									<div v-if="doc.ceo_notes" class="text-xs text-gray-600 mt-1 bg-purple-50 rounded-lg px-2.5 py-1.5">{{ doc.ceo_notes }}</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Appeal Section -->
					<div v-if="doc.appeal_status || doc.appeal_reason" class="card-premium p-4">
						<div class="mdd-section-label">{{ __("Appeal") }}</div>
						<div v-if="doc.appeal_reason" class="text-sm text-gray-700 mb-2">{{ doc.appeal_reason }}</div>
						<div class="flex items-center gap-3 text-xs">
							<span v-if="doc.appeal_status" class="font-bold" :class="doc.appeal_outcome === 'Overturned' ? 'text-green-600' : 'text-gray-700'">
								{{ doc.appeal_status }}
							</span>
							<span v-if="doc.appeal_submitted_on" class="text-gray-600">{{ doc.appeal_submitted_on }}</span>
						</div>
						<div v-if="doc.appeal_outcome" class="text-xs text-gray-600 mt-1 italic">{{ __("Outcome") }}: {{ doc.appeal_outcome }}</div>
					</div>

					<!-- Resolution -->
					<div v-if="doc.is_resolved" class="card-premium p-4 bg-green-50 border border-green-200">
						<div class="flex items-center gap-2">
							<FeatherIcon name="check-circle" class="w-5 text-green-600" />
							<span class="text-sm font-bold text-green-700">{{ __("Resolved") }}</span>
							<span v-if="doc.resolution_date" class="text-xs text-green-600 ml-auto">{{ doc.resolution_date }}</span>
						</div>
					</div>
				</div>

				<!-- Bottom Action Bar -->
				<div v-if="doc && needsAction(doc.status)" class="mdd-bottom-bar">
					<template v-if="doc.status === 'Pending HR'">
						<button @click="showConfirm('hr_approve')" :disabled="processing" class="mdd-action-approve">
							<FeatherIcon name="check" class="w-4 h-4" /> {{ __("HR Approve") }}
						</button>
						<button @click="showConfirm('hr_reject')" :disabled="processing" class="mdd-action-reject">
							<FeatherIcon name="x" class="w-4 h-4" /> {{ __("Reject") }}
						</button>
					</template>
					<template v-else-if="doc.status === 'Pending CEO'">
						<button @click="showConfirm('ceo_approve')" :disabled="processing" class="mdd-action-approve">
							<FeatherIcon name="check" class="w-4 h-4" /> {{ __("CEO Approve") }}
						</button>
						<button @click="showConfirm('ceo_reject')" :disabled="processing" class="mdd-action-reject">
							<FeatherIcon name="x" class="w-4 h-4" /> {{ __("Reject") }}
						</button>
					</template>
					<template v-else-if="doc.status === 'Under Investigation'">
						<button @click="showConfirm('complete_inv')" :disabled="processing" class="mdd-action-approve" style="flex:1">
							<FeatherIcon name="check-circle" class="w-4 h-4" /> {{ __("Complete Investigation") }}
						</button>
					</template>
					<template v-else-if="doc.status === 'Appealed'">
						<button @click="showConfirm('uphold')" :disabled="processing" class="mdd-action-gray">{{ __("Uphold") }}</button>
						<button @click="showConfirm('overturn')" :disabled="processing" class="mdd-action-approve">{{ __("Overturn") }}</button>
						<button @click="showConfirm('modify')" :disabled="processing" class="mdd-action-orange">{{ __("Modify") }}</button>
					</template>
				</div>
			</div>

			<!-- Confirm Sheet -->
			<Teleport to="body">
				<transition name="sheet">
					<div v-if="confirmVisible" class="sheet-overlay" @click.self="confirmVisible = false">
						<div class="sheet-panel">
							<div class="sheet-hdr" :class="confirmHeaderClass">
								<div class="flex items-center justify-between">
									<span class="text-sm font-bold text-white">{{ confirmTitle }}</span>
									<button @click="confirmVisible = false" class="text-white/70">
										<FeatherIcon name="x" class="w-5 h-5" />
									</button>
								</div>
							</div>
							<div class="p-4">
								<div class="text-sm text-gray-700 mb-3">{{ doc?.employee_name }} &middot; {{ doc?.name }}</div>
								<textarea v-model="confirmNotes"
									class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-icd-500/30 resize-none"
									rows="3" :placeholder="__('Add notes (optional)...')"></textarea>
								<div class="flex gap-2 mt-4">
									<button @click="confirmVisible = false" class="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 text-sm font-bold">{{ __("Cancel") }}</button>
									<button @click="executeAction()" :disabled="processing"
										class="flex-1 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50"
										:class="confirmBtnClass">
										{{ processing ? __("...") : confirmTitle }}
									</button>
								</div>
							</div>
						</div>
					</div>
				</transition>

				<!-- Delete Confirm -->
				<transition name="sheet">
					<div v-if="showDeleteConfirm" class="sheet-overlay" @click.self="showDeleteConfirm = false">
						<div class="sheet-panel">
							<div class="sheet-hdr bg-red-600">
								<span class="text-sm font-bold text-white">{{ __("Delete Action") }}</span>
							</div>
							<div class="p-4">
								<p class="text-sm text-gray-700 mb-4">{{ __("Are you sure you want to delete this disciplinary action? This cannot be undone.") }}</p>
								<div class="flex gap-2">
									<button @click="showDeleteConfirm = false" class="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 text-sm font-bold">{{ __("Cancel") }}</button>
									<button @click="deleteAction()" :disabled="processing"
										class="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-50">
										{{ processing ? __("Deleting...") : __("Delete") }}
									</button>
								</div>
							</div>
						</div>
					</div>
				</transition>
			</Teleport>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue"
import { useRouter, useRoute } from "vue-router"
import { IonPage, IonContent } from "@ionic/vue"
import { FeatherIcon, LoadingIndicator, call, toast } from "frappe-ui"

const __ = inject("$translate")
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

const loading = ref(true)
const doc = ref(null)
const editMode = ref(false)
const editData = ref({})
const saving = ref(false)
const processing = ref(false)
const showDeleteConfirm = ref(false)

// Confirm sheet
const confirmVisible = ref(false)
const confirmTitle = ref("")
const confirmHeaderClass = ref("")
const confirmBtnClass = ref("")
const confirmNotes = ref("")
const confirmType = ref("")

const canEdit = computed(() => {
	if (!doc.value) return false
	return ["Draft", "Under Investigation", "Pending Employee Defense"].includes(doc.value.status)
})

function needsAction(status) {
	return ["Pending HR", "Pending CEO", "Under Investigation", "Appealed"].includes(status)
}

function statusClass(status) {
	const map = {
		"Draft": "bg-gray-100 text-gray-600",
		"Under Investigation": "bg-blue-100 text-blue-700",
		"Pending Employee Defense": "bg-amber-100 text-amber-700",
		"Pending HR": "bg-orange-100 text-orange-700",
		"Pending CEO": "bg-purple-100 text-purple-700",
		"Approved": "bg-green-100 text-green-700",
		"Rejected": "bg-red-100 text-red-700",
		"Appealed": "bg-indigo-100 text-indigo-700",
		"Closed": "bg-gray-100 text-gray-600",
	}
	return map[status] || "bg-gray-100 text-gray-600"
}

function severityClass(severity) {
	const map = {
		"Minor": "bg-yellow-100/80 text-yellow-700",
		"Moderate": "bg-orange-100/80 text-orange-700",
		"Major": "bg-red-100/80 text-red-700",
		"Critical": "bg-red-200/80 text-red-800",
	}
	return map[severity] || "bg-gray-100 text-gray-600"
}

function initials(name) {
	if (!name) return "?"
	const parts = name.split(" ")
	return (parts[0]?.[0] || "") + (parts[1]?.[0] || "")
}

function avatarColor(name) {
	if (!name) return "#9CA3AF"
	const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#6366F1", "#EF4444", "#14B8A6"]
	let hash = 0
	for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
	return colors[Math.abs(hash) % colors.length]
}

function showConfirm(type) {
	const titles = {
		hr_approve: "HR Approve", hr_reject: "HR Reject",
		ceo_approve: "CEO Approve", ceo_reject: "CEO Reject",
		complete_inv: "Complete Investigation",
		uphold: "Uphold", overturn: "Overturn", modify: "Modify",
	}
	const isReject = type.includes("reject") || type === "uphold"
	const isApprove = type.includes("approve") || type === "overturn" || type === "complete_inv"

	confirmTitle.value = titles[type]
	confirmHeaderClass.value = isReject ? "bg-red-600" : isApprove ? "bg-green-600" : "bg-orange-600"
	confirmBtnClass.value = isReject ? "bg-red-600" : isApprove ? "bg-green-600" : "bg-orange-600"
	confirmNotes.value = ""
	confirmType.value = type
	confirmVisible.value = true
}

async function executeAction() {
	processing.value = true
	const notes = confirmNotes.value || null
	const name = doc.value.name

	try {
		if (confirmType.value === "hr_approve") {
			await call(`${API_BASE}.hr_approve_action`, { action_name: name, notes })
		} else if (confirmType.value === "hr_reject") {
			await call(`${API_BASE}.hr_reject_action`, { action_name: name, notes })
		} else if (confirmType.value === "ceo_approve") {
			await call(`${API_BASE}.ceo_approve_action`, { action_name: name, notes })
		} else if (confirmType.value === "ceo_reject") {
			await call(`${API_BASE}.ceo_reject_action`, { action_name: name, notes })
		} else if (confirmType.value === "complete_inv") {
			await call(`${API_BASE}.complete_investigation`, { action_name: name })
		} else if (confirmType.value === "uphold") {
			await call(`${API_BASE}.review_appeal`, { action_name: name, outcome: "Upheld", outcome_notes: notes })
		} else if (confirmType.value === "overturn") {
			await call(`${API_BASE}.review_appeal`, { action_name: name, outcome: "Overturned", outcome_notes: notes })
		} else if (confirmType.value === "modify") {
			await call(`${API_BASE}.review_appeal`, { action_name: name, outcome: "Modified", outcome_notes: notes })
		}
		confirmVisible.value = false
		await loadDetail()
	} catch (e) {
		_errToast(e, "Action failed")
	} finally {
		processing.value = false
	}
}

async function saveEdit() {
	saving.value = true
	try {
		await call(`${API_BASE}.update_action`, {
			action_name: doc.value.name,
			...editData.value
		})
		editMode.value = false
		await loadDetail()
	} catch (e) {
		_errToast(e, "Failed to save changes")
	} finally {
		saving.value = false
	}
}

async function deleteAction() {
	processing.value = true
	try {
		await call(`${API_BASE}.delete_action`, { action_name: doc.value.name })
		showDeleteConfirm.value = false
		router.back()
	} catch (e) {
		_errToast(e, "Failed to delete action")
	} finally {
		processing.value = false
	}
}

async function loadDetail() {
	loading.value = true
	try {
		const res = await call(`${API_BASE}.get_manager_disciplinary_detail`, {
			action_name: route.params.id,
		})
		doc.value = res || null
		if (res) {
			editData.value = {
				action_type: res.action_type,
				incident_date: res.incident_date,
				severity: res.severity,
				description: res.description,
				policy_violated: res.policy_violated,
				penalty_type: res.penalty_type,
				penalty_details: res.penalty_details,
				deduction_days: res.deduction_days,
				suspension_days: res.suspension_days,
				investigation_required: res.investigation_required,
			}
		}
	} catch (e) {
		_errToast(e, "Failed to load details")
	} finally {
		loading.value = false
	}
}

onMounted(loadDetail)
</script>

<style scoped>
.mdd-status-badge {
	font-size: 9px;
	font-weight: 700;
	padding: 2px 8px;
	border-radius: 9999px;
	display: inline-block;
	margin-top: 2px;
}
.mdd-section-label {
	font-size: 10px;
	font-weight: 700;
	color: #9CA3AF;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
}
.mdd-severity-badge {
	font-size: 11px;
	font-weight: 700;
	padding: 2px 8px;
	border-radius: 9999px;
	display: inline-block;
}
.mdd-avatar {
	width: 44px;
	height: 44px;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	font-weight: 800;
	color: white;
	text-transform: uppercase;
	flex-shrink: 0;
}
.mdd-timeline-dot {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.mdd-input {
	width: 100%;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 0.5rem 0.75rem;
	font-size: 0.875rem;
	color: #374151;
	outline: none;
	background: white;
}
.mdd-input:focus { border-color: #047857; box-shadow: 0 0 0 2px rgba(4,120,87,0.12); }

/* Bottom Action Bar */
.mdd-bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
	background: rgba(255,255,255,0.9);
	backdrop-filter: blur(20px);
	border-top: 1px solid rgba(0,0,0,0.06);
	z-index: 100;
}
.mdd-action-approve {
	flex: 1;
	background: linear-gradient(to right, #22c55e, #16a34a);
	color: white;
	border-radius: 0.75rem;
	padding: 0.75rem 0;
	font-size: 13px;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
}
.mdd-action-approve:disabled { opacity: 0.5; }
.mdd-action-reject {
	flex: 1;
	background: #fef2f2;
	color: #dc2626;
	border: 1px solid rgba(220,38,38,0.15);
	border-radius: 0.75rem;
	padding: 0.75rem 0;
	font-size: 13px;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
}
.mdd-action-reject:disabled { opacity: 0.5; }
.mdd-action-gray {
	flex: 1;
	background: #f3f4f6;
	color: #374151;
	border-radius: 0.75rem;
	padding: 0.75rem 0;
	font-size: 13px;
	font-weight: 700;
}
.mdd-action-gray:disabled { opacity: 0.5; }
.mdd-action-orange {
	flex: 1;
	background: linear-gradient(to right, #f97316, #ea580c);
	color: white;
	border-radius: 0.75rem;
	padding: 0.75rem 0;
	font-size: 13px;
	font-weight: 700;
}
.mdd-action-orange:disabled { opacity: 0.5; }

/* Sheet */
.sheet-overlay {
	position: fixed;
	inset: 0;
	z-index: 9999;
	background: rgba(0,0,0,0.35);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: flex-end;
	justify-content: center;
}
.sheet-panel {
	width: 100%;
	max-width: 500px;
	background: rgba(242, 242, 247, 0.95);
	backdrop-filter: blur(40px) saturate(180%);
	border-radius: 1.25rem 1.25rem 0 0;
	overflow: hidden;
}
.sheet-hdr { padding: 0.875rem 1rem; }
.sheet-enter-active { transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-leave-active { transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel { transform: translateY(100%); }
.sheet-enter-from,
.sheet-leave-to { opacity: 0; }
</style>
