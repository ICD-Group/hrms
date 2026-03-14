<template>
	<ion-page>
		<ion-content :fullscreen="true">
			<div class="flex flex-col h-full w-full">
				<div class="app-bg-ambient"></div>
				<header class="flex flex-row glass-header px-4 py-2.5 items-center sticky top-0 z-[1000]">
					<Button variant="ghost" class="!pl-0 hover:bg-white/50" @click="router.back()">
						<FeatherIcon name="chevron-left" class="h-5 w-5" />
					</Button>
					<div class="flex flex-row items-center gap-2 overflow-hidden grow">
						<h2 class="text-lg font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
							{{ article.title || __('Article') }}
						</h2>
						<Badge
							v-if="article.is_pinned"
							:label="__('Pinned')"
							theme="orange"
							class="whitespace-nowrap text-[8px]"
						/>
					</div>
					<!-- Favorite button -->
					<button
						v-if="detail.data"
						@click="toggleFavorite"
						class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 transition-all ml-1"
						:class="isFavorited ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-white/50'"
					>
						<FeatherIcon
							name="heart"
							class="w-5 h-5 transition-colors"
							:class="isFavorited ? 'text-[#E92634]' : 'text-gray-600'"
							:style="isFavorited ? 'fill: #E92634' : ''"
						/>
					</button>
				</header>

				<div class="grow overflow-y-auto">
					<div class="flex flex-col gap-3 p-4">
						<!-- Loading -->
						<div v-if="detail.loading" class="flex justify-center py-12">
							<div class="w-6 h-6 border-2 border-[var(--icd-purple)] border-t-transparent rounded-full animate-spin"></div>
						</div>

						<template v-else-if="detail.data">
							<!-- Article Info -->
							<div class="glass-section p-3">
								<div class="text-xs text-gray-600 mb-1">{{ article.category }}</div>
								<div class="text-base font-bold text-gray-900">{{ article.title }}</div>
								<div v-if="article.title_ar" class="text-base font-bold text-gray-700 mt-1" dir="rtl">{{ article.title_ar }}</div>
								<div class="flex gap-3 mt-2 text-xs text-gray-700">
									<span v-if="article.publish_date">{{ __('Published') }}: {{ formatDate(article.publish_date) }}</span>
									<span class="flex items-center gap-0.5">
										<FeatherIcon name="eye" class="w-3 h-3" /> {{ article.view_count }} {{ __('views') }}
									</span>
								</div>
								<div v-if="article.tags" class="flex flex-wrap gap-1.5 mt-2">
									<span
										v-for="tag in parseTags(article.tags)"
										:key="tag"
										class="text-[11px] font-semibold bg-icd-50 text-icd-600 px-2 py-0.5 rounded-full"
									>{{ tag }}</span>
								</div>
							</div>

							<!-- Language Tabs -->
							<div v-if="article.content_ar" class="flex gap-1 glass-card rounded-lg p-0.5">
								<button
									@click="lang = 'en'"
									class="flex-1 text-sm font-semibold py-1.5 rounded-md transition-all"
									:class="lang === 'en' ? 'bg-white dark:bg-white/20 text-icd-600 shadow-sm' : 'text-gray-700'"
								>English</button>
								<button
									@click="lang = 'ar'"
									class="flex-1 text-sm font-semibold py-1.5 rounded-md transition-all"
									:class="lang === 'ar' ? 'bg-white dark:bg-white/20 text-icd-600 shadow-sm' : 'text-gray-700'"
								>العربية</button>
							</div>

							<!-- Article Content -->
							<div class="glass-section p-4 overflow-auto">
								<div
									v-if="lang === 'en' || !article.content_ar"
									class="article-content prose prose-sm max-w-none"
									v-html="sanitize(article.content_en)"
								></div>
								<div
									v-else
									class="article-content prose prose-sm max-w-none"
									dir="rtl"
									style="text-align: right;"
									v-html="sanitize(article.content_ar)"
								></div>
							</div>

							<!-- Attachment -->
							<a
								v-if="article.attachment"
								:href="article.attachment"
								target="_blank"
								class="flex items-center gap-3 card-premium p-4"
							>
								<div class="w-10 h-10 rounded-lg bg-icd-50 dark:bg-icd-900/30 flex items-center justify-center flex-shrink-0">
									<FeatherIcon name="paperclip" class="w-5 h-5 text-icd-600 dark:text-icd-300" />
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-gray-900">{{ __('Download Attachment') }}</div>
									<div class="text-xs text-gray-600 truncate">{{ article.attachment }}</div>
								</div>
								<FeatherIcon name="download" class="w-4 h-4 text-gray-600" />
							</a>

							<!-- Related Videos -->
							<div v-if="relatedVideos.data && relatedVideos.data.length" class="flex flex-col gap-2 mt-2">
								<div class="flex items-center gap-2 px-1">
									<FeatherIcon name="play-circle" class="w-4 h-4 text-[var(--icd-purple)]" />
									<span class="text-[14px] font-bold text-gray-900">{{ __('Related Videos') }}</span>
									<span class="text-[11px] text-gray-600">({{ relatedVideos.data.length }})</span>
								</div>
								<div class="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
									<button
										v-for="video in relatedVideos.data"
										:key="video.name"
										@click="router.push({ name: 'TrainingVideoPlayerView', params: { id: video.name } })"
										class="flex-shrink-0 w-[200px] glass-section rounded-xl overflow-hidden active:scale-[0.98] transition-transform"
									>
										<div class="relative w-full aspect-video bg-gray-100 dark:bg-white/5">
											<img
												v-if="video.thumbnail_url"
												:src="video.thumbnail_url"
												class="w-full h-full object-cover"
												loading="lazy"
											/>
											<div v-else class="w-full h-full flex items-center justify-center">
												<FeatherIcon name="play-circle" class="w-8 h-8 text-gray-400" />
											</div>
											<div v-if="video.duration" class="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
												{{ video.duration }}
											</div>
										</div>
										<div class="p-2.5">
											<div class="text-[13px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
												{{ video.title }}
											</div>
											<div class="text-[11px] text-gray-600 mt-1">{{ video.category }}</div>
										</div>
									</button>
								</div>
							</div>
						</template>
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup>
import { IonPage, IonContent } from "@ionic/vue"
import { ref, computed, inject } from "vue"
import { useRouter } from "vue-router"
import { createResource, FeatherIcon, Button, Badge, call } from "frappe-ui"
import DOMPurify from "dompurify"

function sanitize(html) { return DOMPurify.sanitize(html || "") }

const props = defineProps({ id: String })
const __ = inject("$translate")
const dayjs = inject("$dayjs")
const router = useRouter()
const lang = ref("en")
const isFavorited = ref(false)

const detail = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_article_detail",
	makeParams() { return { article_name: props.id } },
	auto: true,
	cache: `doc_center:article:${props.id}`,
	onSuccess() { checkFavorite() },
})

const relatedVideos = createResource({
	url: "icd3s_document_center.icd3s_document_center.api.get_related_videos",
	makeParams() { return { article_name: props.id } },
	auto: true,
	cache: `doc_center:related_videos:${props.id}`,
})

const article = computed(() => detail.data || {})

async function checkFavorite() {
	try {
		const favs = await call("icd3s_document_center.icd3s_document_center.api.get_favorite_articles")
		if (favs) {
			isFavorited.value = favs.some(a => a.name === props.id)
		}
	} catch (e) {
		// Silently fail
	}
}

async function toggleFavorite() {
	const wasFav = isFavorited.value
	isFavorited.value = !wasFav
	try {
		await call("frappe.desk.like.toggle_like", {
			doctype: "ICD3S Knowledge Article",
			name: props.id,
			add: wasFav ? "No" : "Yes",
		})
	} catch (e) {
		isFavorited.value = wasFav
	}
}

function formatDate(date) {
	if (!date) return ""
	return dayjs(date).format("DD-MM-YYYY")
}

function parseTags(tags) {
	if (!tags) return []
	return tags.split(",").map(t => t.trim()).filter(Boolean)
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.article-content :deep(table) {
	width: 100%;
	border-collapse: collapse;
	font-size: 12px;
	margin: 8px 0;
}
.article-content :deep(th),
.article-content :deep(td) {
	border: 1px solid #e5e7eb;
	padding: 6px 8px;
	text-align: left;
}
.article-content :deep(th) {
	background: #f3f4f6;
	font-weight: 600;
}
.article-content :deep(h1) { font-size: 18px; margin: 12px 0 8px; }
.article-content :deep(h2) { font-size: 16px; margin: 10px 0 6px; color: var(--icd-purple); }
.article-content :deep(h3) { font-size: 14px; margin: 8px 0 4px; }
.article-content :deep(h4) { font-size: 13px; margin: 6px 0 4px; }
.article-content :deep(p) { margin: 4px 0; font-size: 13px; line-height: 1.5; }
.article-content :deep(ul),
.article-content :deep(ol) { padding-left: 20px; margin: 4px 0; font-size: 13px; }
.article-content :deep(li) { margin: 2px 0; }
.article-content :deep(hr) { margin: 12px 0; border-color: #e5e7eb; }
</style>
