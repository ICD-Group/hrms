/**
 * ICD Postbuild: Patch www/hrms.html
 *
 * Copies Vite-built index.html to www/hrms.html and injects:
 * 1. Frappe boot variables (csrf_token, site_name, boot)
 * 2. ICD version tracking (simple, no reload)
 * 3. VAPID Push subscription + frappePushNotification shim
 *
 * This replaces the plain `cp` command to avoid losing custom scripts on rebuild.
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcHtml = path.resolve(__dirname, "../../hrms/public/frontend/index.html")
const destHtml = path.resolve(__dirname, "../../hrms/www/hrms.html")

let html = fs.readFileSync(srcHtml, "utf-8")

// Remove the inline icd_app_version script if versionPlugin injected it
html = html.replace(/<script>\s*\(function\(\)\{\s*var K="icd_app_version"[\s\S]*?<\/script>\s*/g, "")

// Custom scripts to inject before </body>
const customScripts = `
		<script>
			window.csrf_token = "{{ csrf_token }}"
			window.site_name = '{{ site_name }}'
			if (!window.frappe) window.frappe = {}
			frappe.boot = {{ boot }}
		</script>
		<script>
			// ICD v12.0: Version tracking + splash recovery (UpdateBanner handles in-app updates)
			(function() {
				var BUILD_VERSION = 'v12.0_' + new Date().toISOString().slice(0,10).replace(/-/g,'');
				try { localStorage.setItem('icd_hr_build', BUILD_VERSION); } catch(e) {}

				// Splash Recovery: if app stuck loading 8s+, show "Tap to Update" button
				setTimeout(function() {
					var splash = document.getElementById('app-splash');
					if (!splash || splash.style.display === 'none' || splash.style.opacity === '0') return;
					var btn = document.createElement('button');
					btn.textContent = 'Tap to Update';
					btn.style.cssText = 'margin-top:20px;background:rgba(255,255,255,.95);color:#5b21b6;border:none;padding:12px 28px;border-radius:24px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);animation:sp-pulse 1.5s ease-in-out infinite';
					btn.onclick = function() {
						btn.textContent = 'Updating...'; btn.disabled = true;
						var p1 = ('caches' in window) ? caches.keys().then(function(n) { return Promise.all(n.map(function(k) { return caches.delete(k); })); }) : Promise.resolve();
						var p2 = ('serviceWorker' in navigator) ? navigator.serviceWorker.getRegistrations().then(function(r) { return Promise.all(r.map(function(x) { return x.unregister(); })); }) : Promise.resolve();
						Promise.all([p1, p2]).then(function() { location.reload(true); }).catch(function() { location.reload(true); });
					};
					var inner = splash.querySelector('div');
					if (inner) inner.appendChild(btn);
				}, 8000);
			})();
		</script>
		<script>
			// ICD v8.0: VAPID Push + frappePushNotification shim for Settings toggle
			(function() {
				var SW_URL = '/assets/hrms/frontend/sw.js';
				var VAPID_API = '/api/method/icd3s_attendance.icd3s_attendance.push_service.get_vapid_public_key';
				var SAVE_API = '/api/method/icd3s_attendance.icd3s_attendance.push_service.save_subscription';
				var REMOVE_API = '/api/method/icd3s_attendance.icd3s_attendance.push_service.remove_subscription';
				var LOGIN_API = '/api/method/frappe.auth.get_logged_user';

				function b64u(s) {
					var p = '='.repeat((4 - s.length % 4) % 4);
					var b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/'));
					var a = new Uint8Array(b.length);
					for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
					return a;
				}

				function saveSub(sub) {
					var ua = navigator.userAgent;
					var br = ua.indexOf('Chrome') !== -1 ? 'Chrome' : ua.indexOf('Firefox') !== -1 ? 'Firefox' : ua.indexOf('Safari') !== -1 ? 'Safari' : 'Other';
					var dt = /Mobile|Android|iPhone/i.test(ua) ? 'Mobile' : /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Desktop';
					return fetch(SAVE_API, {
						method: 'POST',
						headers: {'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': window.csrf_token || ''},
						body: JSON.stringify({subscription_json: JSON.stringify(sub.toJSON()), browser: br, device_type: dt})
					});
				}

				function doSubscribe(reg) {
					return reg.pushManager.getSubscription().then(function(existing) {
						if (existing) { saveSub(existing); return existing; }
						return fetch(VAPID_API, {headers: {'X-Frappe-CSRF-Token': window.csrf_token || ''}})
							.then(function(r) { return r.json(); })
							.then(function(data) {
								var key = data.message && data.message.public_key;
								if (!key) return null;
								return reg.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: b64u(key)});
							})
							.then(function(sub) { if (sub) { saveSub(sub); } return sub; });
					});
				}

				// v8.0: frappePushNotification shim - makes Settings toggle work with VAPID
				window.frappePushNotification = {
					isNotificationEnabled: function() {
						return typeof Notification !== 'undefined' && Notification.permission === 'granted';
					},
					enableNotification: function() {
						return new Promise(function(resolve, reject) {
							if (typeof Notification === 'undefined') { reject('No Notification API'); return; }
							var doEnable = function() {
								if (Notification.permission !== 'granted') { resolve({permission_granted: false}); return; }
								if (!('serviceWorker' in navigator) || !('PushManager' in window)) { resolve({permission_granted: false}); return; }
								navigator.serviceWorker.register(SW_URL, {scope: '/'}).then(function(reg) {
									function sub() { doSubscribe(reg).then(function() { resolve({permission_granted: true}); }).catch(reject); }
									if (reg.active) { sub(); } else {
										var sw = reg.installing || reg.waiting;
										if (sw) { sw.addEventListener('statechange', function() { if (sw.state === 'activated') sub(); }); }
										else { sub(); }
									}
								}).catch(reject);
							};
							if (Notification.permission === 'granted') { doEnable(); }
							else { Notification.requestPermission().then(function(p) { doEnable(); }).catch(reject); }
						});
					},
					disableNotification: function() {
						return new Promise(function(resolve) {
							if (!('serviceWorker' in navigator)) { resolve(); return; }
							navigator.serviceWorker.getRegistration('/').then(function(reg) {
								if (!reg) { resolve(); return; }
								reg.pushManager.getSubscription().then(function(sub) {
									if (!sub) { resolve(); return; }
									var endpoint = sub.endpoint;
									sub.unsubscribe().then(function() {
										fetch(REMOVE_API, {
											method: 'POST',
											headers: {'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': window.csrf_token || ''},
											body: JSON.stringify({endpoint: endpoint})
										}).then(function() { resolve(); }).catch(function() { resolve(); });
									}).catch(function() { resolve(); });
								}).catch(function() { resolve(); });
							}).catch(function() { resolve(); });
						});
					}
				};

				// Auto-subscribe on load if permission granted
				var attempts = 0;
				function pollAndSubscribe() {
					attempts++;
					if (attempts > 60) return;
					fetch(LOGIN_API, {credentials: 'same-origin'})
						.then(function(r) { return r.json(); })
						.then(function(d) {
							var user = d.message;
							if (!user || user === 'Guest') { setTimeout(pollAndSubscribe, 3000); return; }
							if (typeof Notification !== 'undefined') {
								if (Notification.permission === 'granted') {
									if ('serviceWorker' in navigator && 'PushManager' in window) {
										navigator.serviceWorker.register(SW_URL, {scope: '/'}).then(function(reg) {
											if (reg.active) { doSubscribe(reg); } else {
												var sw = reg.installing || reg.waiting;
												if (sw) { sw.addEventListener('statechange', function() { if (sw.state === 'activated') doSubscribe(reg); }); }
											}
										});
									}
								} else if (Notification.permission === 'default') {
									showBanner();
								}
							}
						})
						.catch(function() { setTimeout(pollAndSubscribe, 3000); });
				}

				function showBanner() {
					if (typeof Notification === 'undefined' || Notification.permission !== 'default') return;
					var d = localStorage.getItem('icd3s_push_dismissed');
					if (d && (Date.now() - parseInt(d)) < 86400000) return;
					var b = document.createElement('div');
					b.id = 'icd3s-push-banner';
					b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;background:linear-gradient(135deg,#4D067B,#7B2FA0);color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 2px 10px rgba(0,0,0,.3);font-family:-apple-system,sans-serif';
					var wrap = document.createElement('div');
					wrap.style.flex = '1';
					var title = document.createElement('b');
					title.style.fontSize = '14px';
					title.textContent = 'Enable Notifications';
					var desc = document.createElement('div');
					desc.style.cssText = 'font-size:12px;opacity:.9';
					desc.textContent = 'Get alerts for attendance, leave & more';
					wrap.appendChild(title);
					wrap.appendChild(desc);
					var btnEnable = document.createElement('button');
					btnEnable.style.cssText = 'background:#fff;color:#4D067B;border:none;padding:8px 16px;border-radius:20px;font-weight:600;font-size:13px;cursor:pointer';
					btnEnable.textContent = 'Enable';
					var btnClose = document.createElement('button');
					btnClose.style.cssText = 'background:none;border:none;color:#fff;font-size:20px;cursor:pointer;opacity:.8';
					btnClose.textContent = '\\u00d7';
					b.appendChild(wrap);
					b.appendChild(btnEnable);
					b.appendChild(btnClose);
					document.body.appendChild(b);
					btnEnable.onclick = function() {
						Notification.requestPermission().then(function(p) {
							if (p === 'granted') { b.remove(); window.frappePushNotification.enableNotification(); }
						});
					};
					btnClose.onclick = function() {
						localStorage.setItem('icd3s_push_dismissed', Date.now()); b.remove();
					};
				}

				setTimeout(pollAndSubscribe, 4000);
			})();
		</script>
`

// Inject before </body>
html = html.replace("</body>", customScripts + "\n\t</body>")

fs.writeFileSync(destHtml, html)
console.log("✓ Patched www/hrms.html (Frappe boot + version tracking + VAPID push)")
