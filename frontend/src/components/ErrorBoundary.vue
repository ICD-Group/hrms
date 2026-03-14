<template>
	<slot v-if="!hasError" />
	<div v-else class="error-boundary" role="alert" aria-live="assertive">
		<div class="error-card glass-card">
			<div class="error-icon" aria-hidden="true">!</div>
			<h3>Something went wrong</h3>
			<p class="error-message">{{ errorMessage }}</p>
			<button class="premium-submit" style="max-width: 200px; margin: 0 auto;" @click="recover">
				Try Again
			</button>
		</div>
	</div>
</template>

<script>
export default {
	name: "ErrorBoundary",
	data() {
		return {
			hasError: false,
			errorMessage: "",
		}
	},
	errorCaptured(err) {
		this.hasError = true
		this.errorMessage = err?.message || "An unexpected error occurred"
		console.error("[ErrorBoundary]", err)
		return false
	},
	methods: {
		recover() {
			this.hasError = false
			this.errorMessage = ""
		},
	},
}
</script>

<style scoped>
.error-boundary {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 200px;
	padding: 2rem 1rem;
}
.error-card {
	text-align: center;
	padding: 2rem;
	max-width: 320px;
	width: 100%;
}
.error-icon {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: rgba(239, 68, 68, 0.1);
	color: #ef4444;
	font-size: 24px;
	font-weight: 800;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1rem;
}
h3 {
	font-size: 1.0625rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 0.5rem;
}
.error-message {
	font-size: 0.8125rem;
	color: #6b7280;
	margin-bottom: 1.5rem;
	line-height: 1.5;
}

:global(.dark) .error-icon {
	background: rgba(239, 68, 68, 0.2);
}
:global(.dark) h3 {
	color: #e5e7eb;
}
:global(.dark) .error-message {
	color: #9ca3af;
}
</style>
