<template>
  <div class="landing-container" v-if="!isAuth">
    <div>
      <h1>Welcome to Album Party</h1>
      <p>v{{ version }}</p>
    </div>
    <div style="text-align: left; margin: auto; display: inline-block">
      <ul>
        <li>You <b>must</b> have Spotify open <i>somewhere</i></li>
        <li>
          You <b>have</b> to be listening to music <b><i>from a playlist or album</i></b>
        </li>
        <li>Listening to <b>podcasts</b> is <b>NOT</b> supported and <i>will create problems</i>.</li>
      </ul>
    </div>
    <div style="margin-top: 2em">
      <a class="button lg" :href="loginUrl">Login with Spotify</a>
      <p class="subtext">Album Party requires a Spotify Premium membership</p>
    </div>
  </div>
  <div v-else>
    <div class="app-container">
      <div class="header">
        <div>
          <h1>hi {{ user }}</h1>
        </div>
        <div>
          <router-link to="/" class="button">Home</router-link>
          <a class="button" @click="logout">Logout</a>
        </div>
      </div>
      <router-view></router-view>
      <div class="footer">
        <p>Version {{ version }}</p>
        <p>Built by Dytrich Nguyen</p>
      </div>
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
    const loginUrl = `${process.env.VUE_APP_API_URL}/login`;
    const version = process.env.VUE_APP_VERSION;
    onBeforeMount(async () => {
      await store.dispatch('tryAuth');
    });
    return { store, loginUrl, version };
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
