import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import './styles/global.css';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import { isIgnoredError, notifyApiError } from './utils/apiFeedback';

const pinia = createPinia();
const auth = useAuthStore(pinia);

window.addEventListener('auth:refreshed', (event) => {
  auth.applySession((event as CustomEvent).detail);
});
window.addEventListener('auth:expired', () => {
  auth.clearSession();
});

const app = createApp(App);
app.config.errorHandler = (error) => {
  if (isIgnoredError(error)) return;
  if (error && typeof error === 'object' && 'code' in error) notifyApiError(error);
  else {
    console.error(error);
    notifyApiError({ message: '页面操作失败，请刷新后重试' });
  }
};
window.addEventListener('unhandledrejection', (event) => {
  if (isIgnoredError(event.reason) || event.reason && typeof event.reason === 'object' && 'code' in event.reason) {
    event.preventDefault();
    notifyApiError(event.reason);
  }
});
app.use(pinia).use(router).use(ElementPlus, { locale: zhCn }).mount('#app');
