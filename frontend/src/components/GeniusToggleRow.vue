<template>
	<div class="flex items-center justify-between p-4">
		<div>
			<div class="text-sm font-medium text-gray-800">{{ label }}</div>
			<div v-if="subtitle" class="text-xs text-gray-600 mt-0.5">{{ subtitle }}</div>
		</div>
		<button
			@click="$emit('update:modelValue', modelValue ? 0 : 1)"
			class="w-11 h-6 rounded-full transition-colors relative"
			:class="modelValue ? 'bg-icd-600' : 'bg-gray-300'"
		>
			<div
				class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm"
				:class="modelValue ? 'translate-x-5' : 'translate-x-0.5'"
			></div>
		</button>
	</div>
</template>

<script setup>
defineProps({
	label: String,
	subtitle: String,
	modelValue: [Number, Boolean],
})

defineEmits(["update:modelValue"])
</script>
