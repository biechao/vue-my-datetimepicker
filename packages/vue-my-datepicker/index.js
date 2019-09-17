import vueMyDatepicker from './src/vue-my-datepicker.vue'
vueMyDatepicker.install = function (Vue) {
    Vue.component(vueMyDatepicker.name, vueMyDatepicker);
};
export default vueMyDatepicker