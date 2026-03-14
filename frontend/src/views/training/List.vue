<template>
	<ion-page>
		<ListView
			doctype="Training Event"
			:pageTitle="__('Training Events')"
			:tabButtons="TAB_BUTTONS"
			:fields="FIELDS"
			:filterConfig="FILTER_CONFIG"
			employeeFieldName=""
		/>
	</ion-page>
</template>

<script setup>
import { IonPage } from "@ionic/vue"
import ListView from "@/components/ListView.vue"
import { inject } from "vue"

const __ = inject("$translate")
const TAB_BUTTONS = ["My Training", "All Training"]
const FIELDS = [
	"name",
	"event_name",
	"type",
	"event_status",
	"start_time",
	"end_time",
	"trainer_name",
]
const FILTER_CONFIG = [
	{
		fieldname: "event_status",
		fieldtype: "Select",
		label: __("Status"),
		options: ["Scheduled", "Completed", "Cancelled"],
	},
	{
		fieldname: "type",
		fieldtype: "Select",
		label: __("Type"),
		options: ["Seminar", "Workshop", "Conference", "Exam", "Online"],
	},
	{ fieldname: "start_time", fieldtype: "Date", label: __("Start Date") },
]
</script>
