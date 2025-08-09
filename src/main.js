import { createApp } from 'vue'
import App from './App.vue'

// 防止异步监听器错误
window.addEventListener('error', function(e) {
    console.warn('捕获到错误，但继续执行:', e.message);
});

// 创建并挂载Vue应用
createApp(App).mount('#app')
