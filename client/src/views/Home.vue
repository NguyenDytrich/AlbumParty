<template>
  <div id="parties">
    <div class="header">
      <h1>Live Parties</h1>
      <a class="button" @click="createNewParty">Host a new party</a>
    </div>
    <div id="other"></div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import axios from 'axios';

export default defineComponent({
  methods: {
    async createNewParty() {
      const res = await axios.post('http://localhost:3000/parties');
      console.log(res);
    },
  },
});
</script>
