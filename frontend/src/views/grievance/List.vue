<template>
	<ion-page>
		<ListView
			doctype="Employee Grievance"
			:pageTitle="__('Grievances')"
			:tabButtons="TAB_BUTTONS"
			:fields="FIELDS"
			:filterConfig="FILTER_CONFIG"
			employeeFieldName="raised_by"
		/>
	</ion-page>
</template>

<script setup>
import { IonPage } from "@ionic/vue"
import ListView from "@/components/ListView.vue"
import { inject } from "vue"

const __ = inject("$translate")
const TAB_BUTTONS = ["My Grievances", "Team Grievances"]
const FIELDS = [
	"name",
	"raised_by",
	"employee_name",
	"subject",
	"grievance_type",
	"date",
	"status",
]
const FILTER_CONFIG = [
	{
		fieldname: "status",
		fieldtype: "Select",
		label: __("Status"),
		options: ["Open", "Investigated", "Resolved", "Invalid"],
	},
	{
		fieldname: "grievance_type",
		fieldtype: "Link",
		label: __("Type"),
		options: "Grievance Type",
	},
	{
		fieldname: "raised_by",
		fieldtype: "Link",
		label: __("Employee"),
		options: "Employee",
	},
	{ fieldname: "date", fieldtype: "Date", label: __("Date") },
]
</script>
