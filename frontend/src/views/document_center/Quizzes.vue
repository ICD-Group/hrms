<template>
	<ion-page>
		<ion-header class="ion-no-border">
			<div class="w-full">
				<div class="flex flex-row glass-header px-4 py-2.5 items-center justify-between">
					<div class="flex flex-row items-center gap-2">
						<button @click="router.back()"
							class="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 active:bg-gray-200 active:scale-90 transition-all">
							<FeatherIcon name="arrow-left" class="h-[18px] w-[18px] text-gray-600 dark:text-gray-300" />
						</button>
						<h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ __('Policy Quizzes') }}</h2>
					</div>
				</div>
			</div>
		</ion-header>

		<ion-content>
			<div class="flex flex-col gap-4 p-4">
				<!-- Error State -->
				<div v-if="loadError" class="text-center py-12">
					<FeatherIcon name="alert-triangle" class="w-12 h-12 text-red-400 mx-auto mb-3" />
					<p class="text-base font-semibold text-red-500">{{ loadError }}</p>
					<button @click="loadError = null; quizzes.reload()" class="mt-3 px-4 py-2 rounded-xl bg-[var(--icd-purple)] text-white text-sm font-bold">
						{{ __('Retry') }}
					</button>
				</div>

				<!-- Loading -->
				<div v-else-if="quizzes.loading && !quizList.length" class="flex justify-center py-12">
					<div class="w-6 h-6 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
				</div>

				<!-- Quiz Taking Mode -->
				<template v-else-if="activeQuiz">
					<div class="glass-section rounded-2xl p-5">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-base font-bold text-gray-900 dark:text-white">{{ activeQuiz.quiz_title }}</h3>
							<button @click="activeQuiz = null; answers = {}"
								class="text-sm font-semibold text-gray-500">{{ __('Exit') }}</button>
						</div>

						<!-- Progress -->
						<div class="flex items-center gap-3 mb-5">
							<div class="flex-1 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
								<div class="h-full bg-[var(--icd-purple)] rounded-full transition-all duration-500"
									:style="{ width: ((currentQ + 1) / questionList.length * 100) + '%' }"></div>
							</div>
							<span class="text-sm font-bold text-gray-600 dark:text-gray-300">{{ currentQ + 1 }}/{{ questionList.length }}</span>
						</div>

						<!-- Question -->
						<div v-if="questionList.length && questionList[currentQ]" class="flex flex-col gap-3">
							<p class="text-base font-semibold text-gray-900 dark:text-white leading-relaxed">
								{{ questionList[currentQ].question }}
							</p>

							<div class="flex flex-col gap-2 mt-2">
								<button
									v-for="opt in getOptions(questionList[currentQ])"
									:key="opt.key"
									@click="answers[questionList[currentQ].idx] = opt.key"
									class="w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 active:scale-[0.98]"
									:class="answers[questionList[currentQ].idx] === opt.key
										? 'border-[var(--icd-purple)] bg-[var(--icd-purple)]/5'
										: 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5'"
								>
									<div class="flex items-center gap-3">
										<div class="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
											:class="answers[questionList[currentQ].idx] === opt.key
												? 'border-[var(--icd-purple)] bg-[var(--icd-purple)]'
												: 'border-gray-300 dark:border-white/20'">
											<div v-if="answers[questionList[currentQ].idx] === opt.key" class="w-2 h-2 rounded-full bg-white"></div>
										</div>
										<span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ opt.text }}</span>
									</div>
								</button>
							</div>

							<!-- Nav Buttons -->
							<div class="flex gap-3 mt-4">
								<button v-if="currentQ > 0" @click="currentQ--"
									class="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-white/10 text-sm font-bold text-gray-600 dark:text-gray-300 active:scale-[0.97] transition-all">
									{{ __('Previous') }}
								</button>
								<button v-if="currentQ < questionList.length - 1"
									@click="currentQ++"
									:disabled="!answers[questionList[currentQ].idx]"
									class="flex-1 py-3 rounded-xl text-sm font-bold text-white active:scale-[0.97] transition-all disabled:opacity-40"
									style="background: linear-gradient(135deg, #4D067B 0%, #7B2FA0 100%);">
									{{ __('Next') }}
								</button>
								<button v-else
									@click="submitQuiz"
									:disabled="!allAnswered || submitting"
									class="flex-1 py-3 rounded-xl text-sm font-bold text-white active:scale-[0.97] transition-all disabled:opacity-40"
									style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
									{{ submitting ? __('Submitting...') : __('Submit Quiz') }}
								</button>
							</div>
						</div>
					</div>
				</template>

				<!-- Results Mode -->
				<template v-else-if="quizResult">
					<div class="glass-section rounded-2xl p-6 text-center">
						<div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
							:class="quizResult.passed ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'">
							<FeatherIcon :name="quizResult.passed ? 'check-circle' : 'x-circle'"
								class="w-10 h-10" :class="quizResult.passed ? 'text-emerald-600' : 'text-red-500'" />
						</div>
						<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
							{{ quizResult.passed ? __('Congratulations!') : __('Not Passed') }}
						</h3>
						<p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
							{{ __('Score') }}: {{ quizResult.score }}% ({{ __('Required') }}: {{ quizResult.passing_score }}%)
						</p>
						<div class="w-full bg-gray-100 dark:bg-white/10 rounded-full h-3 mb-5">
							<div class="h-full rounded-full transition-all duration-1000"
								:class="quizResult.passed ? 'bg-emerald-500' : 'bg-red-500'"
								:style="{ width: quizResult.score + '%' }"></div>
						</div>
						<button @click="quizResult = null"
							class="premium-submit">{{ __('Back to Quizzes') }}</button>
					</div>
				</template>

				<!-- Quiz List -->
				<template v-else>
					<div v-if="!quizList.length" class="text-center py-12">
						<FeatherIcon name="help-circle" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
						<p class="text-base font-semibold text-gray-500">{{ __('No quizzes available') }}</p>
					</div>

					<div v-else class="flex flex-col gap-3">
						<button
							v-for="quiz in quizList"
							:key="quiz.name"
							@click="startQuiz(quiz)"
							class="glass-section rounded-2xl p-4 text-left active:scale-[0.98] transition-all"
						>
							<div class="flex items-center gap-3.5">
								<div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
									:class="quiz.passed ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-[var(--icd-purple)]/10'">
									<FeatherIcon :name="quiz.passed ? 'check-circle' : 'help-circle'"
										class="w-6 h-6"
										:class="quiz.passed ? 'text-emerald-600' : 'text-[var(--icd-purple)]'" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-base font-bold text-gray-900 dark:text-white truncate">{{ quiz.quiz_title || quiz.name }}</div>
									<div class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
										{{ quiz.question_count || '?' }} {{ __('questions') }}
										<span v-if="quiz.passing_score"> &middot; {{ __('Pass') }}: {{ quiz.passing_score }}%</span>
									</div>
								</div>
								<div v-if="quiz.passed" class="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
									<span class="text-xs font-bold text-emerald-700 dark:text-emerald-400">{{ __('Done') }}</span>
								</div>
								<FeatherIcon v-else name="chevron-right" class="w-5 h-5 text-gray-400 flex-shrink-0" />
							</div>
						</button>
					</div>
				</template>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonContent } from "@ionic/vue"
import { ref, computed, inject, onErrorCaptured } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon } from "frappe-ui"

const __ = inject("$translate") || (x => x)
const router = useRouter()

const loadError = ref(null)

onErrorCaptured((err) => {
	console.error("[Quizzes] Component error:", err)
	loadError.value = err.message || "Unknown error"
	return false
})

const activeQuiz = ref(null)
const currentQ = ref(0)
const answers = ref({})
const quizResult = ref(null)
const submitting = ref(false)

const quizzes = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_available_quizzes",
	auto: true,
	cache: "doc_center:quizzes",
	onError(err) {
		console.error("[Quizzes] API error:", err)
		loadError.value = err.message || "Failed to load quizzes"
	},
})

const questions = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_quiz_questions",
	onError(err) {
		console.error("[Quizzes] Questions error:", err)
	},
})

const quizList = computed(() => {
	if (!quizzes.data) return []
	return Array.isArray(quizzes.data) ? quizzes.data : []
})

const questionList = computed(() => {
	if (!questions.data) return []
	return Array.isArray(questions.data?.questions) ? questions.data.questions : []
})

const allAnswered = computed(() => {
	if (!questionList.value.length) return false
	return questionList.value.every(q => answers.value[q.idx])
})

function getOptions(q) {
	if (!q) return []
	const opts = []
	if (q.option_a) opts.push({ key: "a", text: q.option_a })
	if (q.option_b) opts.push({ key: "b", text: q.option_b })
	if (q.option_c) opts.push({ key: "c", text: q.option_c })
	if (q.option_d) opts.push({ key: "d", text: q.option_d })
	return opts
}

function startQuiz(quiz) {
	activeQuiz.value = quiz
	currentQ.value = 0
	answers.value = {}
	quizResult.value = null
	questions.submit({ quiz_name: quiz.name })
}

async function submitQuiz() {
	submitting.value = true
	try {
		const result = createResource({
			url: "icd3s_document_center.icd3s_document_center.api.submit_quiz",
		})
		await result.submit({
			quiz_name: activeQuiz.value.name,
			answers: JSON.stringify(answers.value),
		})
		quizResult.value = result.data
		activeQuiz.value = null
		answers.value = {}
		quizzes.reload()
	} catch (e) {
		console.error("[Quizzes] Submit error:", e)
	}
	submitting.value = false
}
</script>
