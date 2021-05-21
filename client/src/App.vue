<template>
  <div v-if="!isAuth">
    <a href="http://localhost:3000/login">Login with Spotify</a>
    <button @click="checkAuth">Check Auth</button>
  </div>
  <div v-else>
    <div class="container">
      <h1>Hi {{ user }}!</h1>
      <a class="button" @click="logout">Logout</a>
    </div>
    <div class="panel">
      <div class="panel-heading">
        <h1>Live Parties</h1>
      </div>
			<div class="panel-block">
				<a class="button">Host a new party</a>
			</div>
      <div class="panel-block">Test</div>
      <div class="panel-block">Test</div>
    </div>
    <div>
      <a class="button">Start a new party</a>
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
