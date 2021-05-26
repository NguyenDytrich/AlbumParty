<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

export default defineComponent({
  setup() {
    const router = useRouter();
    const route = useRoute();
    onBeforeMount(async () => {
      const uuid = route.params.partyId;
      try {
        const res = await axios.get(`http://localhost:3000/parties/${uuid}`);
        if (res.status == 200) {
          console.log('TODO: connect to room');
        }
      } catch {
        router.push('/');
      }
    });
  },
});
</script>
