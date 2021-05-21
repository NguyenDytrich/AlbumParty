import { InjectionKey } from 'vue';
import { createStore, Store } from 'vuex';
import axios from 'axios';

axios.defaults.withCredentials = true;
export interface State {
  isAuth: boolean;
  user: string;
}

export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
  state: {
    isAuth: false,
    user: '',
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
      state.isAuth = true;
    },
  },
  getters: {
    isAuth(state) {
      return state.isAuth;
    },
    user(state) {
      return state.user;
    },
  },
  actions: {
    async logout({ state }) {
      state.user = '';
      state.isAuth = false;
      await axios.post('http://localhost:3000/logout');
    },
    async tryAuth({ state, commit }) {
      try {
        const { data } = await axios.get('http://localhost:3000/auth');
        commit('setUser', data.user);
      } catch (e) {
        state.isAuth = false;
        state.user = '';
      }
    },
  },
});
