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
      <a>Save</a>
      <span> / </span>
      <a>Play</a>
      <span> / </span>
      <a>Pause</a>
      <span> / </span>
      <a>Skip</a>
      <span> / </span>
      <a>Prev</a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    title: String,
    artists: Array,
    imgUrl: String,
  },
});
</script>

<style scoped lang="scss">
img {
  width: 100%;
}
</style>
