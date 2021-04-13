import Vue from "vue";
import VueRouter from "vue-router";
import Test from "./views/test.vue";
import Robots from "./views/robots.vue";

Vue.use(VueRouter);
const router = new VueRouter({
  routes: [
    {path: "/test",component: Test,},
    {path: "/robots",component: Robots,},
   
  ],
});
export default router;