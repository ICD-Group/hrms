<template>
	<div
		class="bg-white dark:bg-gray-900 w-full flex flex-col items-center justify-center pb-5 max-h-[calc(100vh-5rem)] rounded-t-2xl"
	>
		<!-- Header -->
		<div
			class="w-full flex flex-row gap-2 pt-8 pb-5 border-b border-gray-200 dark:border-white/10 justify-between items-center sticky top-0 z-[100] px-4"
		>
			<span class="text-gray-900 dark:text-white font-bold text-lg text-center flex-1">
				{{ title }}
			</span>
			<button
				v-if="canEdit"
				@click="toggleEdit"
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
				:class="isEditing
					? 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300'
					: 'bg-icd-50 dark:bg-icd-900/30 text-icd-700 dark:text-icd-300'"
			>
				<FeatherIcon :name="isEditing ? 'x' : 'edit-2'" class="w-3.5 h-3.5" />
				{{ isEditing ? __("Cancel") : __("Edit") }}
			</button>
		</div>

		<div class="w-full flex flex-col items-center justify-center gap-4 p-4 overflow-y-auto">
			<div
				v-for="item in data"
				:key="item.fieldname"
				class="flex w-full"
				:class="isEditing && isEditableField(item.fieldname)
					? 'flex-col gap-1.5'
					: 'flex-row items-center justify-between'"
			>
				<div class="text-gray-600 dark:text-gray-300 text-sm font-medium">{{ item.label }}</div>

				<!-- Edit mode - editable fields -->
				<template v-if="isEditing && isEditableField(item.fieldname)">
					<input
						v-if="getInputType(item.fieldtype) !== 'select'"
						:type="getInputType(item.fieldtype)"
						:value="editValues[item.fieldname] ?? item.value"
						@input="editValues[item.fieldname] = $event.target.value"
						class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-icd-500 focus:border-icd-500 outline-none transition"
						:placeholder="item.label"
					/>
					<select
						v-else
						:value="editValues[item.fieldname] ?? item.value"
						@change="editValues[item.fieldname] = $event.target.value"
						class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-icd-500 focus:border-icd-500 outline-none transition"
					>
						<option v-for="opt in getSelectOptions(item.fieldname)" :key="opt" :value="opt">{{ opt }}</option>
					</select>
				</template>

				<!-- Read-only mode -->
				<FormattedField
					v-else
					:value="item.value"
					:fieldtype="item.fieldtype"
					:fieldname="item.fieldname"
				/>
			</div>

			<!-- Save button -->
			<button
				v-if="isEditing && hasChanges"
				@click="saveChanges"
				:disabled="isSaving"
				class="w-full mt-2 py-3 rounded-xl font-semibold text-white text-sm transition-all active:scale-95"
				:class="isSaving ? 'bg-icd-400 cursor-wait' : 'bg-icd-600 hover:bg-icd-700 active:bg-icd-800'"
			>
				<span v-if="isSaving" class="flex items-center justify-center gap-2">
					<FeatherIcon name="loader" class="w-4 h-4 animate-spin" />
					{{ __("Saving...") }}
				</span>
				<span v-else>{{ __("Save Changes") }}</span>
			</button>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, inject, reactive } from "vue"
import { FeatherIcon, call } from "frappe-ui"
import FormattedField from "@/components/FormattedField.vue"

const __ = inject("$translate")
const employee = inject("$employee")

const props = defineProps({
	title: {
		type: String,
		required: true,
	},
	data: {
		type: Array,
		required: true,
	},
})

const emit = defineEmits(["saved"])

const isEditing = ref(false)
const isSaving = ref(false)
const editValues = reactive({})

// Fields employees can edit themselves
const editableFields = [
	"cell_number", "personal_email", "preferred_email",
	"date_of_birth", "blood_group", "emergency_phone_number",
	"person_to_be_contacted", "relation",
]

const canEdit = computed(() => {
	return props.data?.some(item => editableFields.includes(item.fieldname))
})

function isEditableField(fieldname) {
	return editableFields.includes(fieldname)
}

function getInputType(fieldtype) {
	if (fieldtype === "Date") return "date"
	if (fieldtype === "Int" || fieldtype === "Float" || fieldtype === "Currency") return "number"
	if (fieldtype === "Select") return "select"
	return "text"
}

function getSelectOptions(fieldname) {
	if (fieldname === "blood_group") return ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
	if (fieldname === "preferred_email") return ["", "Company Email", "Personal Email"]
	if (fieldname === "relation") return ["", "Father", "Mother", "Spouse", "Sibling", "Child", "Other"]
	return []
}

function toggleEdit() {
	if (isEditing.value) {
		// Cancel - clear changes
		Object.keys(editValues).forEach(k => delete editValues[k])
	}
	isEditing.value = !isEditing.value
}

const hasChanges = computed(() => Object.keys(editValues).length > 0)

async function saveChanges() {
	if (!hasChanges.value || !employee.data?.name) return
	isSaving.value = true
	try {
		for (const [fieldname, value] of Object.entries(editValues)) {
			await call("frappe.client.set_value", {
				doctype: "Employee",
				name: employee.data.name,
				fieldname,
				value: value || "",
			})
		}
		// Reload employee data
		employee.reload?.()
		Object.keys(editValues).forEach(k => delete editValues[k])
		isEditing.value = false
		emit("saved")
	} catch (err) {
		console.error("Save failed:", err)
	}
	isSaving.value = false
}
</script>
