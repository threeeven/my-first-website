import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './assets/main.css';   // 添加这一行
import 'md-editor-v3/lib/style.css' // <-- 引入编辑器样式
import 'vue-datepicker/style.css';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');