import { State } from 'vue';
import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      count: 0,
    };
  },
  mutations: {
    increment(state: State) {
      state.count++;
    },
  },
});

export default store;
