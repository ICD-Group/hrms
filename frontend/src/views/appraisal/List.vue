<template>
	<ion-page>
		<ListView
			doctype="Appraisal"
			:pageTitle="__('Appraisals')"
			:tabButtons="TAB_BUTTONS"
			:fields="FIELDS"
			:filterConfig="FILTER_CONFIG"
		/>
	</ion-page>
</template>

<script setup>
import { IonPage } from "@ionic/vue"
import ListView from "@/components/ListView.vue"
import { inject } from "vue"

const __ = inject("$translate")
const TAB_BUTTONS = ["My Appraisals", "Team Appraisals"]
const FIELDS = [
	"name",
	"employee",
	"employee_name",
	"appraisal_cycle",
	"start_date",
	"end_date",
	"docstatus",
	"total_score",
	"final_score",
]
const FILTER_CONFIG = [
	{
		fieldname: "docstatus",
		fieldtype: "Select",
		label: __("Status"),
		options: ["0", "1", "2"],
	},
	{
		fieldname: "appraisal_cycle",
		fieldtype: "Link",
		label: __("Cycle"),
		options: "Appraisal Cycle",
	},
	{
		fieldname: "department",
		fieldtype: "Link",
		label: __("Department"),
		options: "Department",
	},
	{ fieldname: "start_date", fieldtype: "Date", label: __("Start Date") },
]
</script>
