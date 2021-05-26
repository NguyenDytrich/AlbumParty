<template>
  <div class="landing-container" v-if="!isAuth">
    <h1>Welcome to Album Party</h1>
    <a class="button lg" href="http://localhost:3000/login">Login with Spotify</a>
    <p class="subtext">Album Party requires a Spotify Premium membership</p>
  </div>
  <div v-else>
    <div class="app-container">
      <div class="header">
        <div>
          <h1>hi {{ user }}</h1>
        </div>
        <div>
          <a class="button" @click="logout">Logout</a>
        </div>
      </div>
      <router-view></router-view>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount } from 'vue';
import { useStore, mapGetters } from 'vuex';
import { key } from './store';

export default defineComponent({
  components: {},
  setup() {
    const store = useStore(key);
    return { store };
  },
  data() {
    const store = useStore(key);
    onBeforeMount(async () => {
      await store.dispatch('tryAuth');
    });
  },
  computed: {
    ...mapGetters(['isAuth', 'user']),
  },
  methods: {
    async logout() {
      console.log('loggout out');
      await this.store.dispatch('logout');
    },
  },
});
</script>

<style></style>
