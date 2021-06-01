import { InjectionKey } from 'vue';
import { createStore, Store } from 'vuex';
import axios from 'axios';

axios.defaults.withCredentials = true;
export interface State {
  isAuth: boolean;
  user: string;
  baseUrl: string;
}

export const key: InjectionKey<Store<State>> = Symbol();

export const store = createStore<State>({
  state: {
    isAuth: false,
    user: '',
    baseUrl: process.env.VUE_APP_API_URL ?? '',
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
      await axios.post(`${state.baseUrl}/logout`);
    },
    async tryAuth({ state, commit }) {
      try {
        const { data } = await axios.get(`${state.baseUrl}/auth`);
        commit('setUser', data.user);
      } catch (e) {
        state.isAuth = false;
        state.user = '';
      }
    },
  },
});
