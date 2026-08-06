import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import './styles/global.css';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';

const pinia = createPinia();
const auth = useAuthStore(pinia);

window.addEventListener('auth:refreshed', (event) => {
  auth.applySession((event as CustomEvent).detail);
});
window.addEventListener('auth:expired', () => {
  auth.clearSession();
});

createApp(App).use(pinia).use(router).use(ElementPlus, { locale: zhCn }).mount('#app');
