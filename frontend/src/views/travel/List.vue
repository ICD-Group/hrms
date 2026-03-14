<template>
	<ion-page>
		<ListView
			doctype="Travel Request"
			:pageTitle="__('Travel Requests')"
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
const TAB_BUTTONS = ["My Requests", "Team Requests"]
const FIELDS = [
	"name",
	"employee",
	"employee_name",
	"travel_type",
	"purpose_of_travel",
	"travel_funding",
]
const FILTER_CONFIG = [
	{
		fieldname: "travel_type",
		fieldtype: "Select",
		label: __("Travel Type"),
		options: ["Domestic", "International"],
	},
	{
		fieldname: "employee",
		fieldtype: "Link",
		label: __("Employee"),
		options: "Employee",
	},
]
</script>
