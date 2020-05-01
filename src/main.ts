import Vue from 'vue';
import App from './App.vue';
import Vue2TouchEvents from 'vue2-touch-events'

Vue.config.productionTip = false;
Vue.use(Vue2TouchEvents, {
    disableClick: true,
    touchClass: '',
    tapTolerance: 0,
    touchHoldTolerance: 400,
    swipeTolerance: 30,
    longTapTimeInterval: 400
})

new Vue({ render: (h) => h(App) }).$mount('#app');
