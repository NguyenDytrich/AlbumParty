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
import { useRouter } from 'vue-router';
import axios from 'axios';

export default defineComponent({
  setup() {
    const router = useRouter();
    return { router };
  },
  methods: {
    async createNewParty() {
      try {
        const { data } = await axios.post('http://localhost:3000/parties');
        this.router.push(`/${data}`);
      } catch (err) {
        console.log(err);
      }
    },
  },
});
</script>
