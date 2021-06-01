<template>
  <div id="player">
    <h1>Now playing...</h1>
    <h3>{{ title }}</h3>
    <div>
      <h4>by {{ artists.join(', ') }}</h4>
    </div>
    <div id="image">
      <img :src="imgUrl" />
    </div>
    <div id="controls">
      <a @click="save">Save</a>
      <span> / </span>
      <a @click="play">Play</a>
      <span> / </span>
      <a @click="pause">Pause</a>
      <span> / </span>
      <a @click="skip">Skip</a>
      <span> / </span>
      <a @click="back">Prev</a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';
import { useRoute } from 'vue-router';
import { useStore, mapGetters } from 'vuex';
import { key } from '@/store';

const baseUrl = process.env.VUE_APP_API_URL ?? '';

export default defineComponent({
  props: {
    title: String,
    artists: Array,
    imgUrl: String,
  },
  setup() {
    const store = useStore(key);
    const route = useRoute();
    return { store, route };
  },
  computed: {
    ...mapGetters(['user']),
  },
  methods: {
    async play() {
      const res = await axios.post(`${baseUrl}/player/play`, {
        room: this.route.params.partyId,
      });
    },
    async pause() {
      const res = await axios.post(`${baseUrl}/player/pause`, {
        room: this.route.params.partyId,
      });
    },
    async save() {
      const res = await axios.post(`${baseUrl}/player/save`);
    },
    async skip() {
      const res = await axios.post(`${baseUrl}/player/skip`, {
        room: this.route.params.partyId,
      });
    },
    async back() {
      const res = await axios.post(`${baseUrl}/player/skip?back=true`, {
        room: this.route.params.partyId,
      });
    },
  },
});
</script>

<style scoped lang="scss">
img {
  width: 100%;
}
</style>
