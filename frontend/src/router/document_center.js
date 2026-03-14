const routes = [
	{
		name: "DocumentCenterHub",
		path: "/document-center",
		component: () => import("@/views/document_center/Hub.vue"),
	},
	// Policies
	{
		name: "PolicyAcknowledgmentListView",
		path: "/policies",
		component: () => import("@/views/policies/List.vue"),
	},
	{
		name: "PolicyDetailView",
		path: "/policies/:id",
		props: true,
		component: () => import("@/views/policies/Detail.vue"),
	},
	// Employee Documents
	{
		name: "EmployeeDocumentListView",
		path: "/my-documents",
		component: () => import("@/views/documents/List.vue"),
	},
	{
		name: "EmployeeDocumentCreateView",
		path: "/my-documents/new",
		component: () => import("@/views/documents/Create.vue"),
	},
	{
		name: "EmployeeDocumentDetailView",
		path: "/my-documents/:id",
		props: true,
		component: () => import("@/views/documents/Detail.vue"),
	},
	// Market Intelligence
	{
		name: "MarketIntelligenceListView",
		path: "/market-intelligence",
		component: () => import("@/views/document_center/MarketIntelligence.vue"),
	},
	// Knowledge Base
	{
		name: "KnowledgeBaseListView",
		path: "/knowledge-base",
		component: () => import("@/views/knowledge/List.vue"),
	},
	{
		name: "KnowledgeArticleDetailView",
		path: "/knowledge-base/:id",
		props: true,
		component: () => import("@/views/knowledge/Detail.vue"),
	},
	// Training Videos
	{
		name: "TrainingVideoListView",
		path: "/training-videos",
		component: () => import("@/views/training_videos/List.vue"),
	},
	{
		name: "TrainingVideoPlayerView",
		path: "/training-videos/:id",
		props: true,
		component: () => import("@/views/training_videos/Player.vue"),
	},
	// Genius Search
	{
		name: "GeniusSearchView",
		path: "/genius-search",
		component: () => import("@/views/document_center/GeniusSearch.vue"),
	},
	// Quizzes
	{
		name: "QuizzesView",
		path: "/quizzes",
		component: () => import("@/views/document_center/Quizzes.vue"),
	},
	// Compliance Score
	{
		name: "ComplianceScoreView",
		path: "/compliance",
		component: () => import("@/views/document_center/Compliance.vue"),
	},
	// Onboarding
	{
		name: "OnboardingView",
		path: "/onboarding",
		component: () => import("@/views/document_center/Onboarding.vue"),
	},
	// Document Search
	{
		name: "DocSearchView",
		path: "/doc-search",
		component: () => import("@/views/document_center/DocSearch.vue"),
	},
	// Policy Question AI
	{
		name: "PolicyQuestionView",
		path: "/policy-question",
		component: () => import("@/views/document_center/PolicyQuestion.vue"),
	},
]

export default routes
