import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { VitePWA } from "vite-plugin-pwa"
import frappeui from "frappe-ui/vite"

import path from "path"
import fs from "fs"
import crypto from "crypto"

// ICD: Semantic versioning (v1.0.1, v1.0.2, etc.)
// Format: major.minor.patch+build.hash
// Bump major/minor/patch manually in version-counter.json
// Build number auto-increments on each build
function versionPlugin() {
	const counterFile = path.resolve(__dirname, "version-counter.json")
	let major = 1, minor = 0, patch = 0, buildNum = 1
	try {
		const data = JSON.parse(fs.readFileSync(counterFile, "utf8"))
		major = data.major || 1
		minor = data.minor || 0
		patch = data.patch || 0
		buildNum = (data.build || 0) + 1
	} catch { buildNum = 1 }
	// Save incremented build number (semantic version stays until manually bumped)
	fs.writeFileSync(counterFile, JSON.stringify({ major, minor, patch, build: buildNum }) + "\n")
	const semver = `${major}.${minor}.${patch}`
	const buildHash = crypto.randomBytes(8).toString("hex")
	const buildId = `${semver}+${buildNum}.${buildHash}`
	return {
		name: "icd-version",
		config() {
			return {
				define: {
					__APP_VERSION__: JSON.stringify(buildId),
					__APP_VERSION_NUM__: JSON.stringify(semver),
				},
			}
		},
		writeBundle(options) {
			const outDir = options.dir || path.resolve(__dirname, "../hrms/public/frontend")
			fs.writeFileSync(
				path.join(outDir, "version.json"),
				JSON.stringify({ v: buildId, n: semver, build: buildNum, t: Date.now() })
			)
		},
	}
}

export default defineConfig({
	server: {
		port: 8080,
		proxy: getProxyOptions(),
	},
	plugins: [
		vue(),
		frappeui(),
		versionPlugin(),
		VitePWA({
			registerType: "autoUpdate",
			strategies: "injectManifest",
			injectRegister: null,
			injectManifest: {
				injectionPoint: undefined,
			},
			devOptions: {
				enabled: true,
			},
			manifest: {
				display: "standalone",
				name: "ICD HR",
				short_name: "ICD HR",
				start_url: "/hrms",
				scope: "/",
				id: "/hrms",
				description: "ICD Group - Employee Self-Service Portal",
				theme_color: "#ffffff",
				icons: [
					{
						src: "/assets/hrms/manifest/manifest-icon-192.any.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "/assets/hrms/manifest/manifest-icon-192.maskable.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "maskable",
					},
					{
						src: "/assets/hrms/manifest/manifest-icon-512.any.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "/assets/hrms/manifest/manifest-icon-512.maskable.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	base: "/assets/hrms/frontend/",
	build: {
		outDir: "../hrms/public/frontend",
		emptyOutDir: false,
		target: "es2015",
		commonjsOptions: {
			include: [/tailwind.config.js/, /node_modules/],
		},
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					"frappe-ui": ["frappe-ui"],
					"ionic": ["@ionic/vue", "@ionic/vue-router"],
				},
			},
		},
	},
	optimizeDeps: {
		include: [
			"frappe-ui > feather-icons",
			"showdown",
			"tailwind.config.js",
			"engine.io-client",
		],
	},
})

function getProxyOptions() {
	const config = getCommonSiteConfig()
	const webserver_port = config ? config.webserver_port : 8000
	if (!config) {
		console.log("No common_site_config.json found, using default port 8000")
	}
	return {
		"^/(app|login|api|assets|files|private)": {
			target: `http://127.0.0.1:${webserver_port}`,
			ws: true,
			router: function (req) {
				const site_name = req.headers.host.split(":")[0]
				console.log(`Proxying ${req.url} to ${site_name}:${webserver_port}`)
				return `http://${site_name}:${webserver_port}`
			},
		},
	}
}

function getCommonSiteConfig() {
	let currentDir = path.resolve(".")
	// traverse up till we find frappe-bench with sites directory
	while (currentDir !== "/") {
		if (
			fs.existsSync(path.join(currentDir, "sites")) &&
			fs.existsSync(path.join(currentDir, "apps"))
		) {
			let configPath = path.join(currentDir, "sites", "common_site_config.json")
			if (fs.existsSync(configPath)) {
				return JSON.parse(fs.readFileSync(configPath))
			}
			return null
		}
		currentDir = path.resolve(currentDir, "..")
	}
	return null
}
